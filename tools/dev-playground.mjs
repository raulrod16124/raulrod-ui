#!/usr/bin/env node
// One-command dev server for the playground (RRU-125).
//
// WHY THIS EXISTS. `pnpm dev` alone is not enough, and the reason is a design
// decision of the repo, not an accident: the playground is a REAL CONSUMER of
// the packages (RRU-110, RRU-103), so `apps/playground/src/main.tsx` imports the
// system CSS BY PATH inside `dist/` and resolves `@raulrod/ui` through its
// public entrypoint — with no alias to the sources (`vite.config.ts` says so
// explicitly). Two consequences follow, and both are silent:
//
//   1. On a clean checkout `pnpm dev` serves a page with NO styles and NO
//      components, because `dist/` does not exist yet. It looks like a broken
//      design system; it is just a missing build.
//   2. Once serving, editing a component in `packages/*/src` changes NOTHING,
//      because the app consumes the built output and the packages have no
//      `dev`/`watch` script (`packages/ui` builds with a bare
//      `tsc -p tsconfig.build.json && node tools/copy-css.mjs`).
//
// This script closes both gaps: it builds, then serves, and it rebuilds the
// packages on change while the server stays up. It is the fast path for the two
// things the repo needs it for: looking at a component, and running the manual
// accessibility review of RRU-071 (it points at the `#a11y-review` section).
//
// WHAT THIS IS NOT. It is not a build-system change: no task graph, no new
// dependency, no change to how the packages build. Storybook (RRU-080) will
// eventually cover part of this ground, and when it lands it should either
// replace this script or reuse it — see the handoff note in the RRU-125 card.

import { spawn } from "node:child_process";
import { existsSync, readFileSync, watch } from "node:fs";
import net from "node:net";
import { dirname, join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PKG = "@raulrod/playground";

// Mirrors `apps/playground/vite.config.ts`. The duplication is deliberate: this
// is a plain .mjs and importing a TypeScript config from it is not worth the
// cleverness. `assertPortsMatchConfig()` below turns a silent drift into a
// warning instead of a comment nobody re-reads.
const HOST = "127.0.0.1";
const DEV_PORT = 5173;
const PREVIEW_PORT = 4173;

// The packages the playground consumes by path or by entrypoint. Editing any of
// them requires a rebuild for the running app to change; the playground's own
// `src/` is already covered by Vite's HMR and is deliberately NOT watched here.
const WATCHED_DIRS = ["packages/ui/src", "packages/tokens/src"];

// What the app cannot run without. `main.tsx` imports these two files by path,
// so their absence produces an unstyled page rather than an error.
const REQUIRED_ARTIFACTS = ["packages/tokens/dist/tokens.css", "packages/ui/dist/styles.css"];

const DEBOUNCE_MS = 250;
const SERVER_TIMEOUT_MS = 60_000;

// `pnpm` is a shell script on POSIX and a `.cmd` on Windows; spawning the bare
// name fails on the latter. No other command in this repo has needed this
// because every script is invoked by pnpm itself, not by Node.
const PNPM = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

function log(message) {
  process.stdout.write(`${message}\n`);
}

function step(message) {
  log(`▸ ${message}`);
}

function ok(message) {
  log(`  ✓ ${message}`);
}

function warn(message) {
  process.stderr.write(`  ! ${message}\n`);
}

// Every failure mode below is a trap a newcomer would fall into silently, so
// each one exits with the command that fixes it instead of a stack trace.
function fail(message, hint) {
  process.stderr.write(`\n✗ ${message}\n`);
  if (hint) process.stderr.write(`  ${hint}\n`);
  process.stderr.write("\n");
  process.exit(1);
}

function printHelp() {
  log(`Uso: pnpm dev:playground [--preview] [--no-build] [--no-watch] [--port <n>]

  (sin flags)   construye los paquetes y levanta el dev server con watch de rebuild
  --preview     sirve el build del playground (:4173), el mismo artefacto que testea el E2E
  --no-build    no construye: verifica los artefactos y sirve (para un build ya hecho)
  --no-watch    no reconstruye al cambiar los paquetes
  --port <n>    fuerza el puerto (por defecto ${DEV_PORT} en dev, ${PREVIEW_PORT} en preview)`);
}

function parseArgs(args) {
  const options = { mode: "dev", build: true, watch: true, port: null, portGiven: false };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--preview") {
      options.mode = "preview";
    } else if (arg === "--no-build") {
      options.build = false;
    } else if (arg === "--no-watch") {
      options.watch = false;
    } else if (arg === "--port") {
      const value = Number(args[index + 1]);
      if (!Number.isInteger(value) || value < 1 || value > 65_535) {
        fail(`--port necesita un puerto entero entre 1 y 65535 (recibido: ${args[index + 1]})`);
      }
      options.port = value;
      options.portGiven = true;
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      fail(
        `Flag desconocida: ${arg}`,
        "Ejecuta `pnpm dev:playground -- --help` para ver las opciones.",
      );
    }
  }

  if (options.port === null) {
    options.port = options.mode === "preview" ? PREVIEW_PORT : DEV_PORT;
  }
  return options;
}

// `engines.node` is the single source of truth for the required version, so it
// is read instead of hardcoded. This is a WARNING and not a failure on purpose:
// pnpm itself only warns, and the whole gate passes on 23.6, so failing here
// would make this script stricter than the tool that manages the repo.
function checkNodeVersion() {
  const manifest = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
  const range = manifest.engines?.node ?? "";
  const required = Number(/(\d+)/.exec(range)?.[1]);
  const current = Number(process.versions.node.split(".")[0]);

  if (!Number.isFinite(required)) return;

  if (current < required) {
    warn(`Node ${process.versions.node} no cumple engines.node "${range}" del repositorio.`);
    warn("pnpm también lo avisa y el build funciona igual; `nvm use` lo deja en verde.");
  }
}

// If someone changes the ports in `vite.config.ts`, the preflight below would
// check the wrong port and the banner would advertise a dead URL. Cheap guard.
function assertPortsMatchConfig() {
  const config = readFileSync(join(ROOT, "apps/playground/vite.config.ts"), "utf8");
  const declared = [...config.matchAll(/port:\s*(\d+)/g)].map((match) => Number(match[1]));

  for (const [expected, actual] of [
    [DEV_PORT, declared[0]],
    [PREVIEW_PORT, declared[1]],
  ]) {
    if (actual !== expected) {
      warn(
        `Este script asume ${expected} y vite.config.ts declara ${actual ?? "nada"}. ` +
          "Si cambias el puerto, actualiza DEV_PORT/PREVIEW_PORT en tools/dev-playground.mjs.",
      );
    }
  }
}

// Probes the exact address the server will bind. The dev block of
// `vite.config.ts` has no `strictPort` (only `preview` does), so if the port is
// busy Vite would silently move to the next free one and the developer would
// open the wrong URL — this check is the reason it exists.
function isPortFree(port) {
  return new Promise((resolveFree) => {
    const probe = net.createServer();

    probe.once("error", () => resolveFree(false));
    probe.once("listening", () => probe.close(() => resolveFree(true)));
    probe.listen(port, HOST);
  });
}

function run(command, args, options = {}) {
  return new Promise((resolveRun) => {
    const child = spawn(command, args, { cwd: ROOT, stdio: "inherit", ...options });

    child.once("error", (error) => fail(`No se pudo ejecutar \`${command}\`: ${error.message}`));
    child.once("close", (code) => resolveRun(code ?? 1));
  });
}

async function build() {
  step("Construyendo los paquetes (pnpm build)…");
  const code = await run(PNPM, ["build"]);

  if (code !== 0) {
    fail(
      "`pnpm build` falló, así que el servidor no se levanta.",
      "Arregla el error de build y vuelve a lanzarlo: servir dist/ roto daría una página sin estilos.",
    );
  }
}

function assertArtifacts(mode) {
  const required = [...REQUIRED_ARTIFACTS];
  // `vite preview` serves the built app, so it needs the app's own output too.
  if (mode === "preview") required.push("apps/playground/dist/index.html");

  const missing = required.filter((file) => !existsSync(join(ROOT, file)));

  if (missing.length > 0) {
    fail(
      `Faltan artefactos que el playground consume: ${missing.join(", ")}`,
      "El playground importa el CSS por ruta dentro de dist/ y resuelve @raulrod/ui por su " +
        "entrypoint, así que sin build se sirve una página sin estilos. Lánzalo con " +
        "`pnpm dev:playground` (sin --no-build) o con `pnpm build && pnpm dev:playground -- --no-build`.",
    );
  }

  ok(`${required.length} artefactos presentes`);
}

async function waitForServer(port) {
  const url = `http://${HOST}:${port}/`;
  const deadline = Date.now() + SERVER_TIMEOUT_MS;

  while (Date.now() < deadline) {
    try {
      await fetch(url, { signal: AbortSignal.timeout(1_000) });
      return true;
    } catch {
      await new Promise((settle) => setTimeout(settle, 200));
    }
  }
  return false;
}

function printBanner(mode, port) {
  const base = `http://${HOST}:${port}`;

  log("");
  log(`  Playground listo  ${base}/`);
  log(`  Revisión a11y    ${base}/#a11y-review   (protocolo: docs/accessibility/manual-review.md)`);
  log(
    `  Modo             ${mode === "preview" ? "preview — build del playground, el mismo que testea el E2E" : "dev — HMR para apps/playground/src, rebuild manual para packages/*/src"}`,
  );

  if (mode !== "preview") {
    log("");
    warn(
      "Los componentes vienen de packages/*/dist, no de su código fuente: edita y el script reconstruye.",
    );
  }
  log("");
}

function startWatch(rebuild) {
  const watchers = [];
  let timer = null;

  for (const dir of WATCHED_DIRS) {
    const absolute = join(ROOT, dir);
    if (!existsSync(absolute)) continue;

    try {
      // `recursive: true` is supported on macOS and on Linux since Node 20, so
      // this needs no dependency (chokidar would be the alternative).
      const watcher = watch(absolute, { recursive: true }, (_event, file) => {
        if (file === null || file === undefined) return;
        if (timer !== null) clearTimeout(timer);
        timer = setTimeout(() => rebuild(dir, file), DEBOUNCE_MS);
      });
      watchers.push(watcher);
    } catch (error) {
      warn(`No se pudo observar ${dir} (${error.message}); los cambios no dispararán rebuild.`);
    }
  }

  return () => {
    if (timer !== null) clearTimeout(timer);
    for (const watcher of watchers) watcher.close();
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  checkNodeVersion();
  assertPortsMatchConfig();

  // Port first, build second: a busy port should not cost a 30s build to then
  // fail anyway.
  if (!(await isPortFree(options.port))) {
    fail(
      `El puerto ${options.port} en ${HOST} ya está ocupado.`,
      `CIerra lo que lo usa, o elige otro con \`pnpm dev:playground -- --port ${
        options.port + 1
      }\`. Sin esto Vite movería el servidor al siguiente libre en silencio y abrirías otra URL.`,
    );
  }

  if (options.build) {
    await build();
  } else {
    step("Saltando el build (--no-build).");
  }

  assertArtifacts(options.mode);

  const script = options.mode === "preview" ? "preview" : "dev";
  // The port is only forwarded when the user asked for it, so the default
  // keeps coming from `vite.config.ts` and stays a single source of truth.
  const args = [
    "--filter",
    PKG,
    script,
    ...(options.portGiven ? ["--", "--port", String(options.port)] : []),
  ];

  step(`Levantando \`pnpm --filter ${PKG} ${script}\`…`);
  const server = spawn(PNPM, args, { cwd: ROOT, stdio: "inherit" });

  if (!(await waitForServer(options.port))) {
    warn(
      `El servidor no respondió en ${SERVER_TIMEOUT_MS / 1000}s; puede que Vite siga arrancando.`,
    );
  }
  printBanner(options.mode, options.port);

  let stopWatching = () => {};
  if (options.watch) {
    step("Observando packages/*/src para reconstruir (Ctrl-C para salir)…");

    let building = false;
    let queued = false;

    const rebuild = async (dir, file) => {
      if (building) {
        queued = true;
        return;
      }
      building = true;
      step(`Cambio en ${dir}/${file} → reconstruyendo…`);

      const code = await run(PNPM, ["build"]);

      if (code !== 0) {
        warn("El rebuild falló; el servidor sigue sirviendo la versión anterior.");
      } else {
        ok("Rebuild listo. Vite recarga la página con el código nuevo.");
      }

      building = false;
      if (queued) {
        queued = false;
        await rebuild(dir, file);
      }
    };

    stopWatching = startWatch(rebuild);
  }

  // Ctrl-C reaches the whole process group, so Vite stops on its own; these
  // handlers only clean up the watchers and propagate the exit code.
  const shutdown = (signal) => {
    stopWatching();
    if (!server.killed) server.kill(signal);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  server.once("close", (code) => {
    stopWatching();
    process.exit(code ?? 0);
  });
}

await main();
