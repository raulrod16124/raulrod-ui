# ADR-001: Monorepo con pnpm + Turborepo

- **Status:** Accepted
- **Fecha:** 2026-09-22
- **Tarjeta:** [RRU-005](../design-system-jira.md) · **Epic:** EPIC 0 / Fase 1 (guía §8)
- **Referencias:** guía §4 (arquitectura), §5 (stack), §8 (Fase 1) · [producto](../product.md) · [tablero](../design-system-jira.md) §2

---

## Context

RaulRod UI necesita empaquetar tres artefactos con ciclos de vida coordinados pero liberables de forma independiente:

- `@raulrod/tokens` — la fuente única de design tokens (color, typography, spacing, radius, shadow, motion, z-index, breakpoints y semánticos).
- `@raulrod/ui` — componentes React públicos (export principal de la librería).
- `@raulrod/icons` — re-export total de `lucide-react` con `sideEffects: false` (ADR-007 / RRU-006).

A esto se suman dos aplicaciones: `storybook` (catálogo + documentación interactiva) y `playground` (aplicación consumidora que valida la API pública en un entorno real, deja de ser un repo de componentes sueltos).

Los problemas concretos que motivan la decisión:

1. **Frontera de API pública real.** Sin separación física, es trivial (y casi invisible) importar internals (`packages/ui/src/...`). Con paquetes, la frontera la impone el `exports` del `package.json` de cada uno y se hace verificable (RRU-091, RRU-103).
2. **Dependencias entre paquetes explícitas.** tokens y icons no deben usar código de `ui`; si se empaquetan por separado, esa direccionalidad la obliga el propio workspace.
3. **Releases por paquete.** tokens cambia más despacio que ui; un solo versionado global bloquea la liberación de componentes por un cambio de token (RRU-093, ADR-006/RRU-090).
4. **Calidad (quality gate) centralizada.** una sola pipeline de lint/typecheck/test/build para todo el repo (guía §8), con cache reproducible.

### Decisión de naming resuelta en este ADR

Existe una ambigüedad entre guía §4 (que nombra la carpeta `packages/react`) y el producto/README (que fijan el nombre npm `@raulrod/ui`). **Se resuelve: la carpeta interna es `packages/ui` y el nombre del paquete es `@raulrod/ui`.** La carpeta y el nombre npm quedan coherentes; la guía §4 es una estructura _recomendada_ y _evolucionable_ (§4 "La estructura puede evolucionar").

## Decision

Adoptar un **monorepo con pnpm workspaces + Turborepo**, con la siguiente estructura:

```text
raulrod-ui/
├── apps/
│   ├── storybook/       # catálogo, docs, playground de props (RRU-080)
│   └── playground/      # consumer app de la API pública (RRU-110)
│
├── packages/
│   ├── tokens/          # @raulrod/tokens — tokens + tipos derivados
│   ├── ui/              # @raulrod/ui   — componentes React públicos
│   └── icons/           # @raulrod/icons — re-export de lucide-react
│
├── docs/
│   ├── decisions/       # ADRs (este documento)
│   ├── architecture/
│   └── accessibility/
│
├── .github/workflows/
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

Otras reglas que fija esta decisión:

- **pipeline** con `build`, `lint`, `typecheck`, `test` (cacheable) y `test:e2e` desde la raíz (scripts del §8).
- **build por paquete:** `pnpm build --filter=@raulrod/ui` ejecuta solo el paquete afectado y sus dependencias.
- **dirección de dependencias:** `ui` consume `tokens` e `icons`; `icons` re-exporta `lucide-react`; `tokens` no depende de nada interno. Prohibido dependencias inversas.
- **frontera pública por paquete:** cada paquete expone solo vía `exports` (types/import); los internals no son accesibles al consumidor (RRU-091, RRU-103).
- **TypeScript strict compartido** vía `tsconfig.base.json` (RRU-011) y Node LTS fijada (RRU-013).

## Alternatives considered

### A. Repo único (todo en un solo paquete/carpeta)

- **Ventajas:** configuración mínima, importaciones directas, cero tooling de workspace.
- **Por qué se descarta:** no hay frontera técnica entre tokens/componentes/iconos → es imposible garantizar que un consumidor no acceda a internals; versionado global (no se puede publicar solo tokens); el tree-shaking de iconos y el `sideEffects: false` de ADR-007 exigen un paquete físicamente separado para funcionar de verdad. El consumo previsto `import { Button, Dialog, ChevronDown } from "@raulrod/ui"` no da pistas de paquetes internos, así que la separación debe ser real, no nominal (§4: "Public API over internals").

### B. Paquetes separados en repos independientes

- **Ventajas:** aislamiento total, CI por repo.
- **Por qué se descarta:** un cambio transversal (un token nuevo consumido por un componente, o un cambio de convención TS) obliga a PRs coordinados en N repos: off-boarding síncrono, tooling duplicado y más fricción para las releases coordinadas del diseño sistema; y dificulta, precisamente, la próxima fase de "monorepo + tooling" (EPIC 1) que quiere caché de build, scripts de raíz y ci centralizado (§8).

### C. pnpm workspaces sin Turborepo (solo `--filter`)

- **Ventajas:** menos dependencias de toolchain.
- **Por qué se descarta:** pnpm resuelve el workspace pero no la caché de tareas ni la orquestación (build lint typecheck test dependen entre sí por paquete). Turborepo aporta caché reproducible y "solo lo afectado" con cero configuración de infra; es la opción de la guía §5 y su coste es una herramienta de dev-tooling, no de runtime. No elegirlo ahora obligaría a reintroducir la orquestación a mano cuando EPIC 1 pida caché en CI.

## Consequences

### Positivas

- **Frontera de API pública verificable:** cada paquete la impone su `exports`; un import de internal se detecta en CI (RRU-103).
- **Build/lint/test solo de lo afectado** con caché reproducible de Turborepo → CI rápida y predecible (RRU-015).
- **Releases independientes por paquete** con cambiosets coordinados (RRU-093): tokens avanza solo cuando toca.
- **Cambios transversales atómicos** (una `tsconfig.base` compartida, un token, una weirdo de estilo) en un único PR revisable.
- La **estructura coincide con el naming npm** (`packages/ui` ↔ `@raulrod/ui`), eliminando la ambigüedad guía/producto de una vez.

### Negativas / costes

- **Toolchain extra:** Turborepo y la disciplina de scripts/turbo deben mantenerse actualizados; es deuda de mantenimiento, no de runtime.
- **Disciplina de fronteras obligatoria:** si un paquete importa otro por fuera de sus deps declaradas, pnpm lo rechaza en install — es una regla impuesta por el repo, hay que respetarla al añadir dependencias.
- **Learning curve** leve para quien no conozca workspaces/Turborepo antes de contribuir (se mitiga con la doc de contribución, `docs/contributing`).

### Riesgos observables (para EPIC 1)

- Usar mal los filtros de Turbo genera "falsos no-rebuild" (riesgo de caché stale). Mitigación: inputs declarados explícitamente en `turbo.json` y quality gate en CI (RRU-015).
- Poner lógica de negocio en `apps/playground` no debe filtrarse a `packages/*`: el playground es solo consumidor (RRU-110).
