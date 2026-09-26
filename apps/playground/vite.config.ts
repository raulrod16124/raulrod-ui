// Vite config of the playground (RRU-069).
//
// The app is a REAL CONSUMER of the packages: it imports `@raulrod/ui` (which
// resolves to the built `dist/`), `@raulrod/tokens` and `@raulrod/icons` through
// their public entrypoints and nothing else. Importing the sources would make
// the E2E suite prove something a consumer never does (and is exactly what
// RRU-103 will forbid).
//
// No `resolve.extensionAlias` here, unlike the Vitest preset: the packages are
// consumed as BUILT output, where `./button/index.js` is a real file, so the
// `.js`-extension convention of the sources (moduleResolution bundler, RRU-011)
// needs no help from the bundler.
//
// `process.env` is Node-only and this app ships to the browser, so Node types
// are requested HERE instead of globally in `tsconfig.json`.
//
// Both servers bind 127.0.0.1 EXPLICITLY. Vite's default `localhost` resolves
// to `[::1]` first on macOS, and the server then listens on IPv6 only: a
// Playwright run pointed at `http://127.0.0.1:4173` (IPv4) then waits 60s for a
// server that is up and answering on the other family. Naming the address once
// here keeps the port and the host in a single place for both the dev server and
// the `preview` server the E2E suite boots.
/// <reference types="node" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const HOST = "127.0.0.1";

export default defineConfig({
  plugins: [react()],
  server: {
    host: HOST,
    port: 5173,
  },
  preview: {
    host: HOST,
    port: 4173,
    strictPort: true,
  },
  build: {
    // A design system that fails to tree-shake would still pass a demo; keep
    // the noise visible in the build log (RRU-092/095 measure it properly).
    reportCompressedSize: true,
  },
});
