# ADR-002: Arquitectura de tokens (primitivo → semántico → componente + no-bundle de fuentes)

- **Status:** Accepted
- **Fecha:** 2026-09-23
- **Tarjeta:** [RRU-027](../design-system-jira.md) · **Epic:** EPIC 2 / Fase 2 (guía §9–§11)
- **Referencias:** guía §9 (modelo de tokens), §10 (tokens mínimos), §11 (theming) · [taxonomía](../token-taxonomy.md) (RRU-020) · [color](../color.md) (RRU-004/021) · [typography](../typography.md) (RRU-003/022) · [theming](../theming.md) (RRU-024) · [ADR-001](001-monorepo.md) · [ADR-003](003-styling-strategy.md) (RRU-028) · [tablero](../design-system-jira.md) §2 decisión #4

---

## Context

RaulRod UI necesita una base visual consistente ANTES de escribir componentes (guía §9: "No empezar por `Button`"). Esa base son los **design tokens**, y la forma de modelarlos condiciona tres problemas que este ADR resuelve:

1. **Un modelo de capas con dirección de dependencia.** La guía §9 propone `primitive → semantic → component`. Sin reforzarlo, es trivial que un componente lea `blue-600` directamente o que un semántico referencie otro semántico de distinta intención; eso rompe la gobernanza (el theming cambia valores, nunca intención) y hace imposible un override por nivel. La pregunta abierta es _cómo_ se modelan las capas y _cómo_ se impide saltárselas.

2. **Una única fuente de verdad.** Si los tokens viven a la vez en JSON, en CSS y en anotaciones, cualquier cambio tiene que tocarse en N sitios y divergen. Se necesita un solo lugar del que se deriven: las CSS variables emitidas (RRU-024), los tipos de props de los componentes (RRU-025) y el gate de contraste (RRU-021).

3. **Las fuentes NO se empaquetan** (RRU-003). El DS expone tokens `font.family.sans/mono` y documenta cómo cargarlas (Google Fonts / `next/font` / self-host), pero nunca incluye archivos de fuente en el paquete: ni licencia que redistribuir, ni payload de fuente al importar `@raulrod/ui`, ni dependencia del entorno de render del consumidor.

## Decision

Adoptar el **modelo de 3 capas** de la guía §9 con **`TypeScript as const` como única fuente de verdad** y reglas reforzadas en _compile-time_ y en el gate de `@raulrod/tokens`:

### Modelo de capas y dirección de dependencia

```text
Primitive tokens        # valores base, agnósticos al tema (blue-600, space-4, radius-md)
      ↓
Semantic tokens         # intención, con light/dark si es color (color.text.muted)
      ↓
Component tokens        # SOLO cuando un componente real los necesita (button.primary.background.hover)
```

- **Semánticos** consumen PRIMITIVOS (o el `#ffffff` fijo de `color.text.inverse`).
- **Component tokens** consumen **únicamente semánticos de color** (regla de capas del Playbook §4 Paso 3 y token-taxonomy §1/§2); **prohibido saltarse una capa**: un componente jamás lee un primitive (p. ej. `blue-600`) ni un semántico se define sobre otro semántico de distinta intención sin un primitive detrás.

### Fuente única: TS `as const` en `packages/tokens/src`

- `primitives.ts`, `semantic.ts` y `component.ts` son objetos `as const` tipados; **todo** (emisión CSS, tipos derivados, gate de contraste) se deriva de ellos.
- Nombre y convención por capa en `taxonomy.ts` (contrato público en `@raulrod/tokens`): primitives kebab `ns-step`; semánticos con puntos ≥2 segmentos (RRU-023 relajó de 3 a 2 admite `shadow.sm`, `z.modal`); component ≥3 segmentos (`component.variant.propiedad.estado`).
- **Refuerzo en compile-time**: `component.ts` tipa sus valores con `Record<ComponentKey, SemanticColorKey>` vía `satisfies` → un component token solo puede referenciar un semántico `color.*` existente; un semántico solo puede resolver a un primitive (tipo `PrimitiveHex` limita a hex emitidos) o al `inverse` fijo. El lint/typecheck rechaza capas saltadas o valores arbitrarios.
- **Gate runtime** (`scripts/check-contrast.mjs`, en la tarea `test` de `@raulrod/tokens`): contraste AA de pares autorizados, invariantes estructurales (semántico solo consume primitives, sin primitives huérfanos ni valores duplicados, keys por convención, component tokens con ref resuelta) — verificado en cada `pnpm test`.

### Semánticos: tema por intención

- Los semánticos `color.*` declaran par **light y dark**; en dark cambia el **valor**, nunca la **intención** (guía §11, decisión #4 del tablero).
- Los dominios no-color (`font.*`, `breakpoint.*`, `shadow.*`, `motion.*`, `z.*`) son **escalares agnósticos al tema** (string | number).
- CSS custom properties por tema se emiten en RRU-024 (ADR-003/RRU-028): `:root` light, `[data-theme="dark"]`, `@media (prefers-color-scheme: dark)` para el default de sistema, `prefers-reduced-motion`. Los componentes consumen **solo** `var(--rr-*)`.

### Uniones derivadas para props

`derived.ts` (RRU-025) expone uniones de dominio (`Spacing`, `Radius`, `TypeScale`, `ColorText`, …) derivadas por `Extract<…>` de las keys `as const` — **cero literales duplicados**: añadir/eliminar un token reconfigura las props sin tocar el archivo. Re-exportadas desde `index.ts` para que props de componentes tipen contra tokens (guía §16).

### Component tokens solo con necesidad real

Regla §9 ("no crear cientos de tokens antes de necesidades concretas", §12): la capa componente solo se abre cuando un componente real la consume (RRU-026). Ejemplo actual: `button.primary.background(.hover)` → `color.action.primary.background(.hover)`. Tokens especulativos (disabled sin componente consumidor) se difieren a la tarjeta del componente (RRU-041).

### Fuentes: no-bundle

El DS NO empaqueta fuentes (RRU-003). Expone:

- `font.family.sans` = `'Inter', 'Helvetica Neue', Arial, sans-serif`
- `font.family.mono` = `'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace`

y documenta la carga externa (`docs/typography.md` §6: Vite, Next `next/font`, CDN). El consumidor es quien carga, con fallback network-safe.

## Alternatives considered

### A. Design Tokens W3C (formato DTCG) como fuente única

- **Ventajas:** formato estándar (`.tokens.json`), portabilidad entre herramientas, ecosistema (tokens.studio, etc.), preparado para el futuro del tooling.
- **Por qué se descarta en el MVP:** en 2026 el formato W3C sigue ganando soporte pero no está estabilizado en todas las majors de las herramientas; añade una **segunda definición** (el archivo DTCG) de la que habría que generar el TS/CSS — duplica la fuente de verdad y parte el `as const` tipado que este DS usa para _reforzar_ capas en compile-time. El TS ya le da tipos, uniones derivadas y `satisfies` sin generación. Coste asumible hoy: una **migración futura** si el estándar madura (ver Consecuencias).

### B. Style Dictionary (Amazon) como pipeline de build

- **Ventajas:** genera CSS/JS/TS en múltiples formatos desde un source de tokens, plataforma conocida, cero código de emisor propio.
- **Por qué se descarta en el MVP:** introduce una **dependencia de tooling** y su source es JSON/JS, perdiendo la verificación _por tipos_ que da el `as const` (+`satisfies`) para reforzar la regla de capas. El gate de contraste AA, las invariantes estructurales y el nomenclador ya viven ajustados al modelo del DS y son ~2 scripts Node con cero deps (RRU-021/024). El DS es pequeño: un generador genérico añade abstracción y fricción para el material (guía §33: favorecer abstracciones por necesidad real demostrada).

### C. JSON plano (o YAML) como única fuente y generación de TS/CSS

- **Ventajas:** lectura simple, cero TS en la definición.
- **Por qué se descarta:** el JSON no permite el `satisfies`/`Extract` que **enforce** capas y tipos en compile-time (un typo en una ref a un primitive no se detecta en build, solo en el gate runtime o en runtime). Con TS como fuente única, añadir un token mal tipado falla en `pnpm typecheck` con el mismo mensaje que el consumidor ve. El JSON se gana leer a costa del gate temprano, que aquí es el objetivo (RRU-011, `docs/typescript.md`).

### D. Empaquetar fuentes en el DS

- **Ventajas:** la tipografía "simplemente funciona" sin setup en el consumidor.
- **Por qué se descarta (RRU-003, decisión #3 del tablero):** redistribuir archivos de Inter/JetBrains Mono obliga a curar y auditar licencias (no todas las variantes self-host son triviales de re-distribuir), agranda el paquete (payload de fuentes al importar), y hace al DS responsable del render de texto del consumidor. Con el fallback network-safe y 3 escenarios documentados (typography.md §6) el consumidor conserva el control de la carga (performance, self-hosting, CSP).

## Consequences

### Positivas

- **Una sola fuente de verdad** tipada: cualquier cambio de token es un diff atómico en `packages/tokens/src` que reconfigura CSS, tipos de props y gate al mismo tiempo.
- **Regla de capas reforzada en compile-time**: un componente no puede consumir `blue-600` sin pasar por semántico; un component token no puede apuntar a un primitive. La gobernanza deja de ser "documentación" y pasa a ser el propio type system + gate.
- **Contraste AA como gate** (RRU-021/color.md §6): los pares de color usados están verificados programáticamente en `pnpm test`; añadir un par por debajo de AA rompe CI.
- **Theming por intención**: cambiar light→dark cambia valores, no nombres; los componentes no tienen lógica de tema (guía §11).
- **Tipos al servicio del consumidor** (RRU-025): props de componentes tipadas contra `Spacing`/`TypeScale`/`ColorText`…, con autocompletado y errores útiles.
- **No-bundle de fuentes**: sin payload extra, sin licencias curando, sin dependencia del render host.

### Negativas / costes

- **Tooling ad-hoc, local y gitignored**: `scripts/*.mjs` (emisor CSS + gate de contraste) NO se versiona (política RRU-021/§0.1) → un checkout fresco sin los scripts no emite CSS ni corre el gate hasta que RRU-068 lo sustituya por tests Vitest trackeables. **Deuda conocida, resuelta en RRU-068.**
- **Disciplina de gobernanza necesaria**: cada token nuevo tiene que respetar capa, nombre y consumidor real (RRU-026). La ausencia de herramienta externa descarga la disciplina en el equipo/tests.
- **Coste de migración futuro** si se adopta Design Tokens W3C/Style Dictionary: habría que reescribir la fuente (TS → DTCG/JSON) y re-apuntar emisor/gate. Se mitiga porque la **superficie** (modelo de 3 capas, keys, pares) ya es portable: lo que cambia es la sintaxis de la fuente, no la arquitectura.
- **Contrato con la guía**: la guía §9 usa `font-size-sm` como ejemplo de primitive; este DS expone `font.size.*` como semánticos (roles, no px — typography.md §4 y token-taxonomy §4). Decisión superada y documentada, no una desviación silenciosa.

### Riesgos observables

- **Fuga de la fuente única** (modificar CSS a mano o el `.tokens` de una herramienta) → el gate/emisión la sobreescribe en cada build; todo cambio debe pasar por `packages/tokens/src`.
- **Usar component tokens antes de que exista el componente** reintroduce la capa especulativa que §9 prohíbe; se vigila en RRU-041/049/… cuando los componentes consuman.
