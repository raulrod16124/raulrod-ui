# RaulRod UI — Mini-Jira / Tablero de trabajo

> Tablero operativo del Design System. Se trabaja por **epics** (fases) y por **tarjetas**, una a la vez.
> Una tarjeta está **Done** cuando cumple su DoD, no cuando "se ve bien" (§14 y §31 de la guía).
> Este documento convive con `docs/design-system-guide.md` (fija el _qué_ y el _porqué_); este tablero fija el _cómo_ (tareas, dependencias y prioridades).

---

## 0. Instrucciones de sesión para un agente

> Protocolo obligatorio en **cada** sesión. Este tablero es la única fuente del "qué toca hacer": no se improvisa el orden ni el alcance.

1. **Determinar la siguiente tarea.** Regla de orden: primera tarjeta `⬜ To Do` del epic de menor índice numérico cuyas dependencias estén `✅`. En empate dentro del mismo epic, la de menor ID. Si no hay ninguna ejecutable, la sesión es de hardening → trabajar backlog o reglas §6.
2. **Trabajar en la rama `development`.** No se crean ramas por tarea: se implementa en la rama actual de desarrollo y se entrega el texto del commit (paso 6) para que el usuario revise el diff ANTES de commitear/pushear.
3. **Implementar** siguiendo la tarjeta y la sección 4 (Playbook): convención de archivos, TS, CSS `rr-*`, a11y. Sin resolver tareas fuera de la tarjeta.
4. **Verificar** con comandos desde la raíz (obligatorio en este orden):
   ```bash
   pnpm lint
   pnpm typecheck
   pnpm test --filter="@raulrod/<paquete>"   # filtro si la tarjeta toca un paquete
   pnpm build
   ```
   Añadir la checklist de revisión §39 de la guía y el DoD de la tarjeta (incluye revisión manual de a11y por teclado).
5. **Mover a 👀 In Review** cuando la implementación cumpla el DoD. La revisión la hace el usuario sobre el diff en `development` (no hay PR intermedio).
6. **Proponer texto de commit** (sección 5, Conventional Commits). **Nunca commitear por cuenta propia**: presentar el texto y esperar confirmación explícita del usuario.
7. **Cerrar el ciclo** (sección 6): marcar DoD → ✅, estado → ✅, fecha, actualizar "0.1 Estado actual", tabla resumen y dependencias.
8. **Reporte final**: qué se hizo, comandos pasados, hallazgos, next task.

## 0.1 Estado actual / Próxima tarea

> Actualizar en cada cierre de tarjeta. La "Siguiente tarea" se obtiene aplicando la regla del paso 1.

| Campo                         | Valor                                                           |
| ----------------------------- | --------------------------------------------------------------- |
| Fecha de última actualización | 2026-10-04 |
| Siguiente tarea | **RRU-135 · Breakpoints y queries base** — EPIC-12 · P0 · M · **depende de RRU-133 (✅ Done 2026-10-04)**. Tras cerrar RRU-133, RRU-135 es la única `⬜ To Do` ejecutable según la regla de §0 paso 1 (EPIC-12 es el epic de menor índice con cartas ejecutables). Las 8 familias RRU-136–143 dependen de RRU-135, RRU-144 depende de esas, RRU-145 de RRU-144, y EPIC-13 (RRU-146–147) depende de RRU-145. |
| Siguiente epic | **EPIC-12 — Responsive (Fase 12)**, con EPIC-13 detrás. Los 12 epics del MVP siguen ✅; EPIC 12 y 13 son **post-MVP** y nacen de una decisión del usuario (2026-10-04), no de la regla. EPIC 12 **no toca la API pública**; EPIC 13 es la única que la cambia, y por eso va con ADR-009 propio y changeset `minor`. |
| Rama / PR activo | `development` == `origin/development` == `142e4da`, **árbol limpio**. *Corrección de la celda anterior*, que decía `1ac7d69` y «RRU-113 sin commitear»: RRU-113 quedó commiteado en `142e4da` (`add demo script and gate its claims against the repo`). **Pendiente de ti, no mío**: `main` está **6 commits por detrás** de `development`, así que lo publicado en npm (`1.0.0`) **todavía no** incluye RRU-124, RRU-129, RRU-131 ni RRU-113 — entre ellos el fix de contraste de `.rr-table__error` (`text.danger` a 4.26:1 en light al hacer hover, por debajo de AA), que ya tiene un changeset `patch` commiteado y necesita un `pnpm release`. Recuerda que `/docs` está gitignored (RRU-014): **los cambios a este tablero, a la guía y a `color.md` no generan diff de commit** — EPIC 12 y EPIC 13 solo existen en local hasta que RRU-133 escriba `ADR-008`, que **sí** se trackea (`!/docs/decisions/`). |
| Último cierre | **RRU-133** ✅ **Done** (2026-10-04) — cimientos del responsive (EPIC-12). Se creó **ADR-008** (`docs/decisions/008-responsive.md`, trackeado) fijando estrategia container-first (`@container` como mecanismo principal, `@media` solo para Dialog y Toast). Verificación: lint, typecheck, build (tokens+ui) y tests UI (1063 passed) verdes. No hay cambios en API pública. Antes: **RRU-113** ✅ Done (2026-10-03) — MVP cerrado con `DEMO.md` + gate `pnpm check:demo`. Antes: **RRU-129** + **RRU-124** ✅ Done (2026-10-03). Antes: **RRU-131** ✅ Done (2026-10-03). |
| Bloqueos / notas | **EPIC 12 y EPIC 13 abiertas el 2026-10-04 por decisión del usuario** (RRU-133 promovida de `📋 Backlog` a `⬜ To Do` como carta 1 de EPIC-12, más 13 tarjetas nuevas: RRU-135…147). EPIC 11 ✅ completo (RRU-110 ✅; RRU-111 ✅; RRU-112 ✅ v1.0.0 en el registro; RRU-113 ✅ `DEMO.md` + gate `check:demo`; RRU-132 ✅ peer verificado en sus dos extremos; RRU-131 ✅ job informativo; RRU-114 📋 y RRU-134 📋 backlog). **RRU-133 salió de EPIC 11** — era la quinta carta de cierre del MVP y ahora es la carta 1 de una épica nueva. EPIC 7 ✅ completo — las 7 tarjetas de a11y de RRU-071 cerradas; registro de defectos de contraste vacío (636 pares, 0 absorbidos). EPIC 0, 1, 2, 3, 4, 6, 8, 9 y 10 ✅ completos. EPIC 5 ✅ con la decisión cerrada de **no** implementar RRU-060 (P2, deuda opcional) en el MVP. **Gobernanza del repo aplazada sin tarjeta** en §0.2 (CODEOWNERS, CONTRIBUTING.md, ruleset de `main` con bypass list vacía, auto-merge off). **Deuda de protocolo** en RRU-134: la regla de §0 paso 1 sigue sin usar la prioridad — EPIC 12 la sortea sin tocarla (sus cartas son hermanas y el desempate es por ID), pero la deuda sigue abierta. |

---

## 0.2 Aplazado sin tarjeta: gobernanza del repositorio

Decisión del usuario (2026-10-02), posterior al plan de cierre: **fuera del MVP**. Se anota aquí y
**no** se abre como tarjeta, porque abrirla la haría ejecutable por la regla de §0 paso 1 en una
sesión que el usuario no pidió. Cuando se retome, esto es lo que hay que hacer:

| Pieza | Dónde | Nota |
| --- | --- | --- |
| `.github/CODEOWNERS` con `* @raulrod16124` | fichero nuevo | Con un solo owner es más documentación que mecanismo — y eso es correcto: el mecanismo real es la bypass list |
| `CONTRIBUTING.md` | fichero nuevo | Cómo instalar, los gates en orden, que todo PR pasa por revisión del owner **sin** prometer un tiempo de respuesta |
| **Ruleset de GitHub en `main`** | **Settings → Rules → Rulesets** (config de UI, no código) | PR obligatorio · 1 aprobación · *dismiss stale approvals* · required checks (`Quality gate`, `E2E (Playwright)`, `Dependency audit`, `Bundle size`, `External install`) · restrict deletions · restrict non-fast-forward · **bypass list vacía** |
| Comprobar que auto-merge está **desactivado** | Settings → General → Pull Requests | Es la vía por la que un PR ajeno entraría sin revisión |

**Por qué ruleset y no la protección clásica de ramas:** la clásica viene con **bypass de admins
activo por defecto**, que es justo el agujero a cerrar. Un ruleset nace con la bypass list vacía, y
esa lista es lo que hace que la regla aplique también al owner.

**Lo que el modelo de permisos ya cubre sin configurar nada:** en un repo público un usuario externo
no tiene write access, así que su único camino es abrir un PR, y solo alguien con write puede
mergearlo. Lo que aporta el ruleset es que los checks tengan que estar verdes al mergear y que no se
pueda hacer force-push ni borrar `main` —y que todo eso esté **escrito en el repo** en vez de vivir
en configuración invisible. Motivo de peso: `release.yml` corre en `push` a `main` con `NPM_TOKEN`, así
que quien controle ese merge controla la publicación. Ningún workflow usa `pull_request_target`
(comprobado), así que no hay superficie de ejecución de código externo con secretos.

**Decisión que sigue pendiente y no se debe dar por hecha:** si el ruleset de `main` se extiende a
`development`. Ponerlo rompe el flujo documentado en §0 paso 2 (commit directo en `development`, sin
PR intermedio). Recomendación: `main` estricto, `development` con required checks + no-borrar +
no-force-push, sin PR obligatorio.

---

## 1. Contexto

| Concepto             | Valor                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Guía de construcción | [`docs/design-system-guide.md`](design-system-guide.md)                                                                      |
| Repositorio          | `raulrod16124/raulrod-ui`                                                                                                    |
| Namespace npm        | `@raulrod/*` → `@raulrod/ui`, `@raulrod/tokens`, `@raulrod/icons`                                                            |
| Stack                | React + TypeScript strict · pnpm + Turborepo · Vitest + Testing Library + Playwright · Storybook · Changesets                |
| Estructura objetivo  | `apps/{storybook,playground}` + `packages/{tokens,react,icons}` + `docs/{architecture,decisions,accessibility,contributing}` |

---

## 2. Decisiones de producto fijadas

> Estas decisiones se consideran cerradas para el MVP. Cualquier cambio requiere un ADR nuevo (no editar el existente).

| #   | Decisión                                      | Detalle                                                                                                                                                                                                                                                                      | Evidencia         |
| --- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| 1   | **Styling: CSS + CSS variables**              | Sin CSS-in-JS. Tokens emitidos como CSS custom properties; clases con prefijo `rr-*` (BEM-ish). Theming por `data-theme` + `prefers-color-scheme`.                                                                                                                           | ADR-003 (RRU-028) |
| 2   | **Iconos: lucide-react**                      | `@raulrod/icons` re-exporta todo lucide-react (`export * from 'lucide-react'`) con `sideEffects: false`. `@raulrod/ui` re-expone `@raulrod/icons`. El consumidor accede a CUALQUIER icono: `import { Button, ChevronDown } from '@raulrod/ui'` (o `@raulrod/icons`).         | ADR-007 (RRU-006) |
| 3   | **Fuentes: tokens sin empaquetar**            | El DS NO incluye archivos de fuente. Expone tokens `font.family.sans = 'Inter', 'Helvetica Neue', Arial, sans-serif` y `font.family.mono = 'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace`. El consumidor carga Inter (Google Fonts / `next/font` / self-host). | RRU-003           |
| 4   | **Colores: tokens semánticos + contraste AA** | Paleta primitiva → semántica, con contraste AA verificado en cada pair autorizado. Guía de uso documentada.                                                                                                                                                                  | RRU-004           |

---

## 3. Convenciones del tablero

### 3.1 Estados

| Marca | Estado      | Definición                                             |
| ----- | ----------- | ------------------------------------------------------ |
| 📋    | Backlog     | Ideada, sin prioridad asignada                         |
| ⬜    | To Do       | Prioridad y dependencias definidas; lista para empezar |
| 🔄    | In Progress | En desarrollo                                          |
| 👀    | In Review   | Implementada; en revisión (PR / a11y / tests)          |
| ✅    | Done        | Cumple su DoD y no está bloqueado por otras tarjetas   |

### 3.2 Prioridades

- **P0** — esencial para el MVP / integración directa en una API pública / bloquea a otras tarjetas.
- **P1** — importante, mejora la calidad del MVP.
- **P2** — deseable a corto plazo.
- **P3** — diferible / backlog fuera de MVP.

### 3.3 Estimación (puntos relativos)

- **S** — ≤ 1 día.
- **M** — 2–3 días.
- **L** — ≥ 1 semana.

### 3.4 Labels

`product` · `infra` · `tokens` · `styling` · `component` · `icons` · `a11y` · `testing` · `storybook` · `docs` · `ci` · `release` · `perf` · `security`

### 3.5 DoD global de un componente público (§31 y §32 de la guía)

- [ ] API definida y coherente con el resto del sistema.
- [ ] TypeScript strict; sin `any` ni `as` innecesarios; tipos públicos útiles.
- [ ] Accesibilidad: HTML semántico, keyboard, focus visible, ARIA correcta.
- [ ] Estados principales: default, hover, active, focus, disabled, loading/error cuando aplique.
- [ ] Tests de comportamiento (no de implementación).
- [ ] Stories relevantes en Storybook.
- [ ] Documentación (props, estados, eventos, variantes, restricciones).
- [ ] Export público (frontera `exports`).
- [ ] Responsive + dark theme.
- [ ] CSS consumiendo tokens — prohibido valores arbitrarios.

### 3.6 Formato de tarjeta

```markdown
### RRU-### · Título

- **Epic:** EPIC-X · **Estado:** ⬜ To Do
- **Prioridad:** P0 · **Estimación:** M · **Dependencias:** RRU-###
- **Labels:** `infra` `ci`
- **Descripción:** …
- **Criterios de aceptación (DoD):**
  - [ ] …
```

### 3.7 Tabla resumen de epics

| Epic                               | Fase (guía) | Tareas      | Estado                                                                 |
| ---------------------------------- | ----------- | ----------- | ---------------------------------------------------------------------- |
| EPIC 0 — Definición del producto | Fase 0 | RRU-001…006 | ✅ completo (RRU-001 ✅; RRU-002 ✅; RRU-003 ✅; RRU-004 ✅; RRU-005 ✅; RRU-006 ✅) |
| EPIC 1 — Monorepo + tooling        | Fase 1      | RRU-010…016 | ✅ completo (RRU-010 ✅; RRU-011 ✅; RRU-012 ✅; RRU-013 ✅; RRU-014 ✅; RRU-015 ✅; RRU-016 ✅) |
| EPIC 2 — Design tokens + theming   | Fase 2      | RRU-020…028 | ✅ completo (RRU-020 ✅; RRU-021 ✅; RRU-022 ✅; RRU-023 ✅; RRU-024 ✅; RRU-025 ✅; RRU-026 ✅; RRU-027 ✅; RRU-028 ✅) |
| EPIC 3 — Foundations / primitives  | Fase 3      | RRU-030…034 | ✅ completo (RRU-030 ✅; RRU-031 ✅; RRU-032 ✅; RRU-033 ✅; RRU-034 ✅) |
| EPIC 4 — Componentes fundamentales | Fase 4      | RRU-040…050 | ✅ completo (RRU-040 ✅; RRU-041 ✅; RRU-042 ✅; RRU-043 ✅; RRU-044 ✅; RRU-045 ✅; RRU-046 ✅; RRU-047 ✅; RRU-048 ✅; RRU-049 ✅; RRU-050 ✅) |
| EPIC 5 — Componentes complejos     | Fase 5      | RRU-051…060 | ✅ cards P1 completas (RRU-051…059 ✅; RRU-060 P2 deuda opcional, decisión cerrada de NO implementarla en el MVP)              |
| EPIC 6 — Data display              | Fase 6      | RRU-062…067 | ✅ completo (RRU-062 ✅, RRU-063 ✅, RRU-064 ✅, RRU-065 ✅, RRU-066 ✅, RRU-067 ✅) |
| EPIC 7 — Testing + accesibilidad   | Fase 7      | RRU-068…072 + RRU-115 | 🟡 en curso (RRU-068 ✅; RRU-069 ✅; RRU-115 ✅; RRU-070 ✅; RRU-071 ✅; **RRU-072 ✅**; **RRU-116 ✅**; **RRU-117 ✅**; **RRU-118 ✅**; **RRU-119 ✅**; **RRU-120 ✅**; **RRU-121 ✅**; **RRU-122 ✅**; **RRU-123 ✅**; de las 7 tarjetas de a11y que había en backlog §"A11y backlog", las **4 P1 están cerradas** (**RRU-126**/**RRU-127**/**RRU-128**/**RRU-130** ✅ 2026-10-02) y las **2 P2 restantes** quedaron `✅ Done` el 2026-10-03 (**RRU-124** y **RRU-129**): el techo de duración perceptible de los fades de color pasa a ser `motion.duration.fast` (100ms) y queda automatizado en la gate, y `.rr-table__error` pinta su propia superficie para que el hover de fila no baje `text.danger` a 4.26:1. **Las 7 tarjetas de a11y de RRU-071 están cerradas.** El registro de defectos de contraste sigue vacío (**636 pares, 0 absorbidos** — RRU-129 bajó el recuento de 638 porque la celda de error pasó de medirse dos veces contra la página a medirse una vez contra su fondo real, y subió los gobernados de 380 a 382), que es la condición de salida de EPIC 9; RRU-129 **sí** quedó automatizado, pero por `Table.test.tsx` y no por la gate: la comprobó no poder detectar el fill borrado) |
| EPIC 8 — Storybook + docs + DX     | Fase 8      | RRU-080…084 + RRU-125   | ✅ completo (RRU-080 ✅; RRU-125 ✅; RRU-081 ✅; RRU-082 ✅; RRU-083 ✅; RRU-084 ✅) |
| EPIC 9 — Packaging + releases      | Fase 9      | RRU-090…095 | ✅ completo (RRU-090 ✅; RRU-091 ✅; RRU-092 ✅; RRU-093 ✅; RRU-094 ✅; RRU-095 ✅) |
| EPIC 10 — Performance + hardening  | Fase 10     | RRU-100…105 | ✅ completo (RRU-100 ✅; RRU-104 ✅; RRU-105 ✅; RRU-101 ✅; **RRU-102 ✅**; **RRU-103 ✅**) |
| EPIC 11 — Portfolio / demo         | Fase 11     | RRU-110…114 + RRU-131…134 | ✅ completo (RRU-110 ✅; RRU-111 ✅; **RRU-112 ✅** — v1.0.0 publicada y verificada sobre el registro; **RRU-132 ✅** — el peer `>=18.2.0` verificado en sus dos extremos; **RRU-131 ✅** — job `external-install` en CI, informativo; **RRU-113 ✅** — `DEMO.md` en la raíz + gate `pnpm check:demo`; **RRU-133 📋** — movida a EPIC-12 como su carta 1; RRU-134 📋 — backlog, no ejecutables por la regla de §0. Orden de cierre en §0.2, borrada al cerrar RRU-113) |
| EPIC 12 — Responsive (Fase 12) | Fase 12 — **nueva**, la añade RRU-133 en `design-system-guide.md` §6 | RRU-133 + RRU-135…145 | 🟡 **abierta, 1 de 12 `✅`** — **RRU-133 ✅ Done (2026-10-04)**; RRU-135 ⬜ To Do (P0, M, depende de RRU-133) es la única ejecutable. Cadena: RRU-135 → las **8 familias** RRU-136…143 (hermanas independientes, todas dependen solo de RRU-135, el desempate es por ID) → RRU-144 → RRU-145. Sin cambios de API pública. Mecanismo `@container` con `@media` solo para Dialog y Toast |
| EPIC 13 — Extensibilidad: escape hatch de estilos (Fase 13) | Fase 13 — **nueva**, la añade RRU-146 | RRU-146…147 | ⬜ **planificada, 0 de 2 y ninguna ejecutable** (RRU-146 depende de RRU-145). Única épica que **cambia la API pública** de un `1.0.0` publicado, y por eso va con **ADR-009 propio** (regla 2) y changeset `minor`. Nace de un encargo del usuario (2026-10-04), no de un hallazgo |

> Actualizar la tabla y las tarjetas en cada cierre de tarea. El número de tarjeta nunca se reutiliza.

---

## 4. Playbook de implementación de un componente

> Guía DRY que TODAS las tarjetas de componente (EPIC 3–6) referencian. Seguir los pasos en orden; no saltar ninguno.
> El patrón base (refs, variantes, merge de props) y esta estructura de archivos son **obligatorios** (fijados en RRU-040); la fuente de verdad es `docs/component-pattern.mdx`.

### Paso 1 — Convención de archivos (por componente)

```text
packages/ui/src/<kebab-case>/
├── <Pascal>.tsx          # implementación (forwardRef + cx merge)
├── <Pascal>.types.ts     # tipos públicos (props, variants)
├── <Pascal>.css          # estilos `rr-*` con tokens
├── <Pascal>.test.tsx     # tests de comportamiento (Vitest + RTL + jest-axe, RRU-068)
├── <Pascal>.stories.tsx  # stories relevantes (RRU-080)
└── index.ts              # export público del componente
```

### Paso 2 — TypeScript Senior (§16 + `docs/typescript.md`)

- `strict` activo, cero `any`; `as` solo con comentario que justifique el porqué.
- Tipos **públicos** exportados desde `index.ts`; tipos internos NO exportados.
- Variantes como uniones derivadas de tokens cuando aplique (RRU-025).
- `forwardRef` para `ref`; merge de `className`/estilos con `cx` (RRU-030).
- Errores de TS al servicio del consumidor: guard clauses con mensaje comprensible cuando aporte valor (p. ej. IconButton sin accessible name).

### Paso 3 — CSS con tokens (ADR-003 / RRU-028)

- Clases con prefijo `rr-` + nombre semántico: `rr-button`, `rr-button--primary`.
- SOLO tokens CSS variables (primitive → semantic → component); prohibido valores arbitrarios.
- Estados: `:hover`, `:active`, `:focus-visible`, `:disabled`; estados condicionales con `data-*` si es necesario.
- `prefers-reduced-motion` cubierto en toda animación.

### Paso 4 — Tests (behavior over implementation, ADR-005 / RRU-070)

- Probar comportamiento observable: `render`, `interaction`, `states`, `keyboard`, `callbacks`, `a11y`.
- a11y automatizado con jest-axe (`toHaveNoViolations`) cuando el harness lo permita (RRU-068).
- No comprobar detalles internos que cambiarían sin romper el contrato.

### Paso 5 — Stories (§20)

- Matriz de estados aplicable: Variants, Disabled, Loading, Error, Empty, Long content, Keyboard, Dark, Responsive, Playground.

### Paso 6 — Docs (§21)

- MDX con: cómo se usa, contrato (props/eventos/restricciones), por qué está diseñado así (trade-offs/limitaciones).

### Paso 7 — Export público

- Añadir al `index.ts` raíz de `@raulrod/ui` y verificar que el consumidor solo alcanza la API pública (frontera `exports`, RRU-091/RRU-103). — Hecho en RRU-091 + RRU-103 ✅: el `index.ts` raíz existe y la frontera se verifica con gates derivados de los `exports` maps (no con listas escritas a mano).

### Paso 8 — Commits

- Generar el texto según la sección 5 y **proponerlo sin commitear**.

---

## 5. Convención de commits

> Conventional Commits (compatible con Changesets, RRU-093). El agente **propone** el texto; el usuario decide cuándo commitear.

Formato: `tipo(scope): resumen (RRU-###)`

| Tipo       | Uso                                        |
| ---------- | ------------------------------------------ |
| `feat`     | nuevo componente / feature de API pública  |
| `fix`      | corrección de comportamiento               |
| `refactor` | cambio interno sin cambiar contrato        |
| `docs`     | documentación (guía, ADR, tablero, README) |
| `chore`    | tooling, CI, dependencias, config          |
| `test`     | solo tests                                 |
| `perf`     | optimización medida                        |

- Scopes: `ui` · `tokens` · `icons` · `storybook` · `playground` · `root` · `docs`.
- Ejemplos:
  - `feat(ui): add IconButton component (RRU-042)`
  - `chore(root): setup pnpm workspace + turbo (RRU-010)`
  - `docs(ui): publish ADR-003 styling strategy (RRU-028)`

Reglas: un commit por tarjeta (o por unidad lógica), resumen ≤ 72 caracteres, cuerpo opcional con el _porqué_, nunca incluir secrets/credentiales.

---

## 6. Cierre de sesión (actualizar el tablero)

1. Marcar `- [ ]` → `- [x]` en los criterios de aceptación cumplidos de la tarjeta.
2. Actualizar `- **Estado:**` → `✅ Done` y añadir `· **Fecha:** YYYY-MM-DD`.
3. Añadir `- **Notas de la sesión:** …` solo si hubo decisiones de implementación relevantes (y desviaciones de la tarjeta, justificadas).
4. Actualizar la sección **0.1** ("Estado actual / Próxima tarea") con el nuevo next task según la regla del paso 1.
5. Actualizar la **tabla resumen 3.7** del epic afectado.
6. Confirmar que las dependencias de la tarjeta cerrada quedan desbloqueadas (sin huérfanas).

---

# EPIC 0 — Definición del producto (Fase 0)

> Objetivo: responder el _qué_ y el _para quién_ antes de escribir código (§7). Sin DoD completo de este epic no se inicia EPIC 1.

### RRU-001 · Definir identidad, alcance y consumidor objetivo

- **Epic:** EPIC-0 · **Estado:** ✅ Done · **Fecha:** 2026-09-22
- **Prioridad:** P0 · **Estimación:** S · **Dependencias:** —
- **Labels:** `product` `docs`
- **Descripción:** Cerrar en un documento (README + sección de producto) nombre, scope npm (`@raulrod`), propósito, consumidor objetivo (proyectos personales de Raúl), soporte de React (versión mínima y como peer dependency), navegadores soportados, filosofía de diseño, alcance inicial y non-goals (§7).
- **Criterios de aceptación (DoD):**
  - [x] Documento de producto con las 10 preguntas de §7 respondidas.
  - [x] Non-goals explícitos (no: gráficos, editores visuales, componentes de negocio, clon de librería comercial).
  - [x] Versión de React mínima definida (p. ej. 18/19) como peer dependency.
  - [x] Entornos soportados listados (browsers modernos evergreen + SSR-friendly).
- **Notas de la sesión:** entregable en `docs/product.md` (no trackeado, convive con guía/tablero; el README es de RRU-002). React mínimo `18.2.0` como peer dependency (`>=18.2.0`, compatible con 19). Discrepancia detectada: la tarjeta dice "10 preguntas de §7" y la guía lista 9; se resolvió estructurando el documento en 10 secciones (navegadores y entornos separados).

### RRU-002 · Crear README.md como primer entregable

- **Epic:** EPIC-0 · **Estado:** ✅ Done · **Fecha:** 2026-09-22
- **Prioridad:** P0 · **Estimación:** S · **Dependencias:** RRU-001
- **Labels:** `product` `docs`
- **Descripción:** Escribir el README de la raíz siguiendo §7: qué es, qué problema resuelve, cómo instalarlo, ejemplo mínimo, estado del proyecto y roadmap con fases.
- **Criterios de aceptación (DoD):**
  - [x] Incluye snippet mínimo de instalación + uso (`import { Button } from "@raulrod/ui"`).
  - [x] Estado del proyecto y roadmap visible.
  - [x] Enlaza la guía, el tablero y los ADRs.
- **Notas de la sesión:** README en inglés (decisión de sesión: es la cara pública de una librería npm). Estructura = la del proyecto completado (MVP), sin sección de "estado actual" que quede obsoleta; la honestidad se limita a una nota de status breve. La guía/tablero están en `/docs` (gitignored) y se mencionan sin hipervínculo hasta que se trackeen (política de RRU-014); los ADRs se referencian como `docs/decisions/` futuro. Flujo de trabajo: sin ramas por tarea, se trabaja en `development` y se entrega texto de commit para revisión del usuario.

### RRU-003 · Guía de diseño de tipografía

- **Epic:** EPIC-0 · **Estado:** ✅ Done · **Fecha:** 2026-09-22
- **Prioridad:** P0 · **Estimación:** M · **Dependencias:** —
- **Labels:** `product` `tokens` `docs`
- **Descripción:** Guía (doc + futuros tokens) que fija la stack y la escala tipográfica. Se adopta `font.family.sans = 'Inter', 'Helvetica Neue', Arial, sans-serif` y `font.family.mono = 'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace`. El DS **no empaqueta** las fuentes: expone tokens y documenta cómo cargarlas según entorno (Google Fonts, `next/font`, self-host).
- **Criterios de aceptación (DoD):**
  - [x] Stacks `sans` y `mono` definidos como tokens.
  - [x] Escala modular de tamaños (con `clamp()` opcional marcado como mejora, no requerido en MVP).
  - [x] Tokens de weight, line-height y letter-spacing por rol (display, heading, body, caption, code).
  - [x] `font-variant-numeric: tabular-nums` documentado para tablas/números.
  - [x] Guía de cómo cargar Inter en consumidores (3 escenarios: Vite, Next, CDN).
  - [x] Decisión de no-enpaquetar documentada en el ADR de tokens (RRU-027).
- **Notas de la sesión:** entregable `docs/typography.md` (igual política de no-trackeo que `product.md` y `typescript.md`; no tiene diff de commit). Se adopta `font.family.sans = 'Inter', 'Helvetica Neue', Arial, sans-serif` y `font.family.mono = 'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace` (mono = `JetBrains Mono` en doc y tablero; README/ADR-007 usaban `JetBrains` → quedan para actualizar en RRU-027). Escala modular ~1.25 base 16, roles display/heading/body/caption/code con weight-leading-tracking tokenizados, `tabular-nums` para tablas/números (RRU-064+/RRU-065), fluid typography con `clamp()` marcado como mejora post-MVP (backlog, RRU-091). Decisión no-enpaquetar consignada en la sección del doc y pendiente de formalizar el ADR en RRU-027.

### RRU-004 · Guía de diseño de color

- **Epic:** EPIC-0 · **Estado:** ✅ Done · **Fecha:** 2026-09-22
- **Prioridad:** P0 · **Estimación:** M · **Dependencias:** —
- **Labels:** `product` `tokens` `docs`
- **Descripción:** Guía que define la paleta primitiva (blue-, gray-, etc.) y los tokens semánticos mínimos de §10 (background, surface, text, muted, border, primary, secondary, destructive, success, warning, info, focus) con pares autorizados y contraste AA verificado.
- **Criterios de aceptación (DoD):**
  - [x] Paleta primitiva con nombres de escala (p. ej. `blue-500`).
  - [x] Mapa semántico completo (light + dark) de §10.
  - [x] Tabla de contraste AA para cada pairing autorizado (texto sobre fondo/surface).
  - [x] Color de focus distinto de los bordes normales.
- **Notas de la sesión (2026-09-22):** entregable `docs/color.md` (igual política de no-trackeo que `product.md`/`typography.md`; no tiene diff de commit). Dirección de paleta cerrada con el usuario: azul + gris frío. Todos los pares de contraste de §6 verificados **programáticamente** con la fórmula WCAG (texto ≥4.5:1; bordes de control/foco ≥3:1). Detección y ajuste de pares que NO cumplían AA inicial: `success` blanco `#16a34a`→`#15803d` (3.30→5.02), `info` blanco `#0284c7`→`#0369a1` (4.10→5.93), `border.strong` dark `#525c68`→`#7a8794` (2.52→4.67), foco dark `#155dfc` sobre surface daba 2.98→`#4c8cff` (4.83). Muted requiere steps hand-tuned `gray-650`/`gray-450` (grey-600 light da 4.34 sobre surface). Foco con token dedicado `color.focus.ring` (blue-550 light / blue-500 dark), distinto de `border.default`/`border.strong` y de `action.primary`. Gobernanza: solo pares de la tabla; RRU-021 portará el contraste a test automatizado.

### RRU-005 · ADR-001 — Monorepo y estructura de paquetes

- **Epic:** EPIC-0 · **Estado:** ✅ Done · **Fecha:** 2026-09-22
- **Prioridad:** P0 · **Estimación:** S · **Dependencias:** —
- **Labels:** `docs` `infra`
- **Descripción:** Registrar la decisión de monorepo pnpm + Turborepo con `packages/{tokens,ui,icons}` y `apps/{storybook,playground}` (§4, §8), incluyendo alternativas descartadas (repo único, packages separados) y consecuencias (build por paquete, fronteras claras).
- **Criterios de aceptación (DoD):**
  - [x] ADR con template §22 (Context / Decision / Alternatives / Consequences).
  - [x] Publicado en `docs/decisions/001-monorepo.md`.
- **Notas de la sesión (2026-09-22):** entregable `docs/decisions/001-monorepo.md` (igual política de no-trackeo; /docs es carpeta local temporal). Se resolvió el conflicto de naming guía §4 (`packages/react`) vs producto (`@raulrod/ui`): carpeta interna `packages/ui` ↔ npm `@raulrod/ui`, documentado como decisión propia dentro del ADR. Alternativa C (workspaces sin Turborepo) se descartó con motivo; se añadió como 3ª alternativa porque existía de facto. Riesgo de caché stale de Turbo documentado (inputs explícitos + quality gate RRU-015).

### RRU-006 · ADR-007 — Estrategia de iconos (lucide-react)

- **Epic:** EPIC-0 · **Estado:** ✅ Done · **Fecha:** 2026-09-22
- **Prioridad:** P0 · **Estimación:** S · **Dependencias:** —
- **Labels:** `docs` `icons`
- **Descripción:** Registrar la decisión de usar lucide-react como dependencia de `@raulrod/icons` con re-export total (`export * from 'lucide-react'`), `sideEffects: false`, y re-export desde `@raulrod/ui`. Documentar por qué se descarta `@heroicons`/una icon set propia (mantenimiento) y el proxy `<Icon name>` (pierde tipos y rompe tree-shaking).
- **Criterios de aceptación (DoD):**
  - [x] ADR publicado en `docs/decisions/007-icons.md`.
  - [x] Consecuencias documentadas: superset de iconos visible al consumidor, tree-shaking garantizado por ESM + `sideEffects:false`.
- **Notas de la sesión (2026-09-22):** entregable `docs/decisions/007-icons.md` (igual política de no-trackeo; `/docs` es carpeta local temporal, no tiene diff de commit). Template §22 coherente con `001-monorepo.md` (metadata + Context/Decision/Alternatives/Consequences). Se revisó la coherencia cruzada: decisión #2 del tablero, `product.md` y `ADR-001` ya referenciaban "ADR-007 / RRU-006"; el README usa `JetBrains` (discrepancia de fuentes ya registrada en RRU-003 para tratar en RRU-027, ajena a esta tarjeta). Alternativas descartadas con motivo: `@heroicons` (catálogo menor en dos estilos), icon set propia (mantenimiento ≥ valor MVP), proxy `<Icon name>` (pierde tipos y rompe tree-shaking). Consecuencias: superset visible como API pública, tree-shaking por ESM + `sideEffects:false`, churn de dependencia externa; custodia del override en backlog (registro de iconos custom) y a11y de iconos fijado para RRU-042. La decisión materializa en código en RRU-016 y se mide en RRU-092/RRU-095. RRU-004 se cierra en esta sesión → EPIC 0 queda ✅ completo, next = RRU-010.

---

# EPIC 1 — Monorepo y tooling (Fase 1)

> Objetivo: repo sólido ANTES del primer componente (§8). **Quality gate:** no mergear si falla lint / typecheck / test / build.

### RRU-010 · pnpm workspace + Turborepo

- **Epic:** EPIC-1 · **Estado:** ✅ Done · **Fecha:** 2026-09-22
- **Prioridad:** P0 · **Estimación:** M · **Dependencias:** RRU-001, RRU-005
- **Labels:** `infra` `ci`
- **Descripción:** Inicializar `pnpm-workspace.yaml` (`packages/*`, `apps/*`), `turbo.json` con pipeline (build, lint, typecheck, test con cache), y esqueleto de paquetes `@raulrod/tokens`, `@raulrod/icons`, `@raulrod/ui` y apps.
- **Criterios de aceptación (DoD):**
  - [x] `pnpm install` limpio en checkout nuevo.
  - [x] `pnpm build --filter=...` ejecuta solo los paquetes afectados.
  - [x] Turbo caching activo y reproducible.
- **Notas de la sesión (2026-09-22):** workspace `apps/*` + `packages/*`; `turbo.json` v2 (`tasks`) con `cacheDir` en `node_modules/.cache/turbo` (evita tocar `.gitignore`/RRU-014) y `inputs` `$TURBO_DEFAULT$` + `!**/*.md` por tarea (mitiga caché stale, ADR-001). **Build tool = `tsc`** por paquete (decidido en sesión): cero deps, emite ESM + `.d.ts` y preserva módulos para el tree-shaking de `export *` (ADR-007); un bundler (tsup) sería prematuro y se evalúa en RRU-091. Esqueleto `private:true` `0.0.0` (no publicable; RRU-093/091 ajustarán). `tsconfig` mínimo por paquete: `strict`/base compartida quedan para RRU-011. Límites respetados: sin ESLint (RRU-012), engines/scripts restantes (RRU-013), `.editorconfig`/`.gitignore` (RRU-014), CI (RRU-015), contenido real de packages (RRU-016/EPIC 2). `packageManager: pnpm@11.1.2`; `pnpm lint/typecheck/test` aún no aplican (los fija RRU-012/RRU-011/RRU-068). Comandos de verificación del DoD pasados en sesión.

### RRU-011 · TypeScript strict compartido

- **Epic:** EPIC-1 · **Estado:** ✅ Done · **Fecha:** 2026-09-22
- **Prioridad:** P0 · **Estimación:** M · **Dependencias:** RRU-010
- **Labels:** `infra`
- **Descripción:** `tsconfig.base.json` con `strict: true`, `declaration`, `moduleResolution: bundler`, `verbatimModuleSyntax`, y extendido por todos los paquetes. Sin `any` permitido (eslint rule). Types públicos con JSDoc útil (§16). **Deliverable adicional: `docs/typescript.md`**, el estándar TS Senior único del proyecto (fuente de verdad que referencia el Playbook §4 Paso 2): tipos públicos, política de `any`/`as`, uniones discriminadas, criterio para generics, props base de componentes.
- **Criterios de aceptación (DoD):**
  - [x] `pnpm typecheck` correcto en todos los paquetes desde la raíz.
  - [x] `noImplicitAny` y reglas de strict activas en todos los workspaces.
  - [x] `exports` de tipos generado en build (`.d.ts`).
  - [x] `docs/typescript.md` publicado como estándar único y referenciado por el Playbook §4.
- **Notas de la sesión (2026-09-22):** entregable `docs/typescript.md` (igual política de no-trackeo; /docs gitignored, sin diff de commit). `tsconfig.base.json` en la raíz con el set recomendado (decisión de sesión): `strict` + `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `forceConsistentCasingInFileNames`, `verbatimModuleSyntax`, `isolatedModules`, `declaration`, `moduleResolution: bundler`, `module: ESNext`, `target: ES2022`, `lib [ES2022, DOM, DOM.Iterable]`, `skipLibCheck` coherente. Paquetes refactorizados a `extends` (solo `rootDir`/`outDir`/`include`, + `jsx: react-jsx` en `ui`). Scripts `typecheck: tsc --noEmit` por paquete + `typecheck: turbo run typecheck` en root (DoD lo exige; el resto de scripts raíz los fija RRU-013). La regla eslint "sin `any`" queda para RRU-012; aquí se garantiza vía `strict` (verificado con sonda negativa `TS7006`) + estándar del doc. `docs/typescript.md` actualizado con los flags finales y corrección `packages/react`→`packages/ui` (ADR-001). Comandos de verificación del DoD pasados en sesión.

### RRU-012 · ESLint + Prettier

- **Epic:** EPIC-1 · **Estado:** ✅ Done · **Fecha:** 2026-09-22
- **Prioridad:** P0 · **Estimación:** M · **Dependencias:** RRU-010
- **Labels:** `infra` `ci`
- **Descripción:** Configuración de ESLint flat config (typescript-eslint, react-hooks, jsx-a11y, import) + Prettier + reglas de import ordenados. `pnpm lint` y `pnpm format` desde la raíz.
- **Criterios de aceptación (DoD):**
  - [x] `pnpm lint` sin errores.
  - [x] Prettier integrado con ESLint (sin conflictos) y `npm run format:check`.
  - [x] Reglas jsx-a11y activas (accesibilidad como gate temprano).
- **Notas de la sesión (2026-09-22):** ESLint v10 flat config **única en la raíz** (`eslint.config.js`) que cubre todo el workspace; cada paquete solo declara `"lint": "eslint ."`. Plugins: `typescript-eslint` recommended (+ `no-explicit-any: error` y `consistent-type-imports` alineado con `verbatimModuleSyntax`, pendiente de RRU-011), `react-hooks` flat recommended, `jsx-a11y` flat recommended, `eslint-plugin-import-x` con `import-x/order` (grupos builtin/type/external/internal(`@raulrod/*`)/parent/sibling/index/object, newlines y alfabético) → decisión de sesión registrada con usuario. Prettier v3 por separado (no como regla de ESLint) + `eslint-config-prettier` al final del array → DoD "sin conflictos". Scripts raíz `lint` (turbo), `format` y `format:check` (prettier a todo el repo) adaptando el `npm run format:check` del DoD a pnpm. **Hallazgos de entorno:** (1) `typescript-eslint@8` NO soporta TypeScript 7 (throw explícito, typescript-eslint#10940) → se añadió `typescript@^6.0.3` como devDep **solo de root** (provider de peer para el lint); los paquetes mantienen `typescript@^7.0.2` para `tsc` (RRU-011) → coexistencia lado-a-lado según guía oficial de TS 7. (2) `eslint-plugin-jsx-a11y@6.10.2` declara peer `eslint <10`; se verificó empíricamente que funciona con ESLint 10 y quedó warning de peer como pendiente (RRU-015/CI) — eslint@9 estaba EOL (deprecation). (3) pnpm 11 usa `allowBuilds` (no `onlyBuiltDependencies`, obsoleto) para scripts de `unrs-resolver` (dependencia nativa de import-x); si no se aprueba, `ERR_PNPM_IGNORED_BUILDS` rompe cualquier `pnpm run`/`pnpm exec` con exit 1. Apps `storybook`/`playground` son esqueletos vacíos sin fuentes → su lint usa `--no-error-on-unmatched-pattern` (pasarán a lint real con RRU-080/RRU-110). DoD verificado con sonda negativa temporal (`img` sin `alt` → `jsx-a11y/alt-text` en error; fixture borrado) + `--print-config`. Comandos del gate pasados: `pnpm lint` 5/5 ✅, `pnpm typecheck` 3/3 ✅, `pnpm build` 3/3 ✅, `pnpm format:check` ✅; `pnpm test` aún no aplica (lo fija RRU-068). Normalización de formato aplicada a archivos pre-existentes (tsconfigs, README, turbo.json, `export {}` sin newline final).

### RRU-013 · Scripts raíz y Node fijada

- **Epic:** EPIC-1 · **Estado:** ✅ Done · **Fecha:** 2026-09-22
- **Prioridad:** P0 · **Estimación:** S · **Dependencias:** RRU-010
- **Labels:** `infra`
- **Descripción:** Scripts raíz `dev`, `build`, `lint`, `typecheck`, `test`, `test:e2e` (§8) y versión de Node fijada (`engines` + `nvmrc`).
- **Criterios de aceptación (DoD):**
  - [x] Los 6 scripts funcionan desde la raíz.
  - [x] `engines.node` definido y Node LTS documentada.
- **Notas de la sesión (2026-09-22):** `test`/`test:e2e` añadidos como `turbo run test`/`turbo run test:e2e` (nuevo task `test:e2e` en `turbo.json`, cacheable, `outputs: playwright-report/** + test-results/**` pensando en RRU-069). Node LTS fijada a **24 (Krypton, Active LTS, soporte hasta abr-2028)**: `engines.node: ">=24"` en root + `.nvmrc` `24` + documentado en README §Requirements. DoD §8 ya cubría `build`/`lint`/`typecheck`/`dev` (RRU-010/011/012); los 6 scripts pasan desde la raíz. Estado intencional del skeleton: `pnpm test` y `pnpm test:e2e` pasan con "no tasks executed" hasta RRU-068/RRU-069 cableen Vitest/Playwright. Hallazgo de entorno: Node local v23.6.0 queda fuera de `engines` → pnpm avisa "Unsupported engine" en cada run (nudge a `nvm use`); Node 23 es rama impar ya EOL. RRU-015 queda desbloqueada (ya no depende de esta tarjeta).

### RRU-014 · Repo base: `.editorconfig` y `.gitignore`

- **Epic:** EPIC-1 · **Estado:** ✅ Done · **Fecha:** 2026-09-22
- **Prioridad:** P1 · **Estimación:** S · **Dependencias:** —
- **Labels:** `infra`
- **Descripción:** `.editorconfig` y `.gitignore` consistentes con el repo (mantener `/docs/*` excluido salvo este tablero).
- **Criterios de aceptación (DoD):**
  - [x] `.editorconfig` presente con indentación y EOL.
  - [x] `.gitignore` no trackea `dist/`, `node_modules/`, caches, `.env` (con `!.env.example`).
- **Notas de la sesión (2026-09-22):** `.editorconfig` nuevo con `indent_size=2`/`indent_style=space` (coherente con Prettier tabWidth por defecto), `end_of_line=lf`, `insert_final_newline`, y `[*.md]` con `trim_trailing_whitespace=false` para no romper hard-breaks de Markdown. `.gitignore` = template conservado y ajustado: añadidos `.turbo/` (coherente con `.prettierignore` y cacheDir ya bajo `node_modules/.cache/turbo`), `playwright-report` y `test-results` (outputs de `test:e2e` en `turbo.json`, prepara RRU-069) y newline final (faltaba). **Decisión de sesión (usuario):** la frase de la tarjeta "salvo este tablero" NO se aplica → `/docs` se mantiene 100% ignorado (ni el tablero ni la guía/ADRs se trackean; política de 0.1 y README §Resources). Gate pasado: `pnpm lint`/`typecheck`/`build` ✅, `pnpm format:check` ✅. DoD verificado con `git check-ignore`: dist/node_modules/.env/.turbo/playwright-report/test-results + docs/design-system-jira.md ignorados (exit 0); `.env.example` NO ignorado (exit 1). RRU-015 y RRU-016 quedan desbloqueadas.

### RRU-015 · CI base en GitHub Actions

- **Epic:** EPIC-1 · **Estado:** ✅ Done · **Fecha:** 2026-09-22
- **Prioridad:** P0 · **Estimación:** M · **Dependencias:** RRU-010, RRU-011, RRU-012, RRU-013
- **Labels:** `ci`
- **Descripción:** Workflow PR con `install → lint → typecheck → test → build` (§26). Correcto desde checkout limpio.
- **Criterios de aceptación (DoD):**
  - [x] Workflow en `.github/workflows/ci.yml`.
  - [x] Todos los jobs verdes en el primer PR real (verificación pendiente: `workflow_dispatch` tras push).
  - [x] No publicar a npm desde CI (se añade en EPIC 9).
- **Notas de la sesión (2026-09-22):** el flujo es sin PR intermedio (rama `development`); la verificación del DoD se cubrió con `workflow_dispatch` tras push, jobs verdes confirmados por el usuario en cierre de sesión. Fallo latente detectado en cierre con RRU-016: falta de newline final en `ci.yml` rompía `pnpm format:check` (y por tanto el propio job de CI, que lo ejecuta); corregido con `prettier --write` en el cierre (diff mínimo, 1 línea).

### RRU-016 · Crear `@raulrod/icons` (re-export de lucide-react)

- **Epic:** EPIC-1 · **Estado:** ✅ Done · **Fecha:** 2026-09-22
- **Prioridad:** P0 · **Estimación:** S · **Dependencias:** RRU-010, RRU-006
- **Labels:** `icons` `infra`
- **Descripción:** Paquete `@raulrod/icons` mínimo: `export * from 'lucide-react'` (lucide como dependencia), `sideEffects: false`, index con re-export. Sirve también como set interno para los componentes de `@raulrod/ui`.
- **Criterios de aceptación (DoD):**
  - [x] `import { ChevronDown } from "@raulrod/icons"` resuelve tipos y runtime.
  - [x] `sideEffects: false` en package.json.
  - [x] Build ESM + `.d.ts` correcto.
- **Notas de la sesión (2026-09-22):** `lucide-react@^1.47.0` como **dependencia** (parte de la API pública). DoD verificado con sondeo consumidor real desechable en temp (fuera del repo): `import { ChevronDown } from "@raulrod/icons"` pasa `tsc --noEmit` (types) y `node import` (runtime). Hallazgo: Node resuelve `lucide-react` por `main` (CJS) al no tener campo `exports`; identidad runtime verificada contra ese build (el `module`/ESM queda para bundlers y con `sideEffects:false` el tree-shaking de `export *` queda garantizado, ADR-007). `packages/ui` sigue sin depender de icons hasta que tenga contenido real (frontera `exports` pública en RRU-091/RRU-103).

---

# EPIC 2 — Design tokens + theming (Fase 2)

> Objetivo: base visual consistente antes de componentes (§9, §10, §11). No empezar por `Button`.

### RRU-020 · Taxonomía de tokens: primitivos / semánticos / de componente

- **Epic:** EPIC-2 · **Estado:** ✅ Done · **Fecha:** 2026-09-22
- **Prioridad:** P0 · **Estimación:** S · **Dependencias:** EPIC-0
- **Labels:** `tokens`
- **Descripción:** Modelo de 3 capas (§9): `primitive → semantic → component`. Definir convención de nombres y qué capa consume cada consumer. No crear cientos de primitives por adelantado.
- **Criterios de aceptación (DoD):**
  - [x] Nomenclatura documentada (p. ej. `color.text.muted`).
  - [x] Capas y dirección de dependencia explicitadas (semánticos consumen primitivos).
- **Notas de la sesión (2026-09-22):** entregable doc `docs/token-taxonomy.md` (no-trackeado, política RRU-014) + esqueleto tipado en `packages/tokens/src` (diff de commit): `taxonomy.ts` (contrato de nombres como tipos públicos), `primitives.ts`/`semantic.ts`/`component.ts` vacíos `as const` y `index.ts` con API pública (3 capas + `TokenLayer` + uniones derivadas `PrimitiveToken|SemanticToken|ComponentToken`). Decisiones confirmadas (delegadas por color.md/typography.md): primitives interpoladas `gray-925`/`gray-550`; `font.numeric.tabular-nums` re-clasificado como **semántico** (no primitivo); `color.text.inverse` semántico; `font.size.*` semánticos (el ejemplo `font-size-sm` de la guía §9 queda superado). **Desviación justificada:** el plan aprobado incluía `taxonomy.test.ts` (contrato de nombres); se sustituyó por tipos de contrato (compile-time) porque Vitest no está cableado (es RRU-068) y un test con import `vitest` no pasaría `tsc --noEmit` hoy → el gate permanece verde y el contrato queda protegido por tipos; el test runtime de naming/contraste llega con RRU-068/RRU-021. **Hallazgo de entorno:** el resolver por defecto de `eslint-plugin-import-x` no resuelve imports relativos `*.ts` (extensions solo `.js/.mjs/.cjs/.json/.node`) → se registró `import-x/resolver-next` con `createNodeResolver` + extensiones TS en `eslint.config.js` (raíz, afecta a todos los paquetes; era imprescindible para la convención de archivos del Playbook §4). Gate pasado: `pnpm lint` ✅, `pnpm typecheck` ✅, `pnpm build` ✅, `pnpm format:check` ✅, `pnpm test --filter=@raulrod/tokens` "no tasks" (esperado pre-RRU-068) + sonda consumidor real en temp (`@raulrod/tokens` resuelve tipos y runtime; uniones derivadas wired).
- **Cierre (2026-09-22):** revisado en sesión RRU-021; DoD cumplido. Desbloquea RRU-021/023/025/026/027.

### RRU-021 · Paleta de color: light + dark

- **Epic:** EPIC-2 · **Estado:** ✅ Done · **Fecha:** 2026-09-22
- **Prioridad:** P0 · **Estimación:** M · **Dependencias:** RRU-004, RRU-020
- **Labels:** `tokens` `styling`
- **Descripción:** Paleta primitiva (escalas blue/gray/...) y tokens semánticos de §10 en versión light y dark, con contraste AA cumplido en pares autorizados.
- **Criterios de aceptación (DoD):**
  - [x] Primitivos y semánticos definidos en una fuente única (TS/JSON).
  - [x] Semánticos light y dark mapeados (cambio por intención, no por color).
  - [x] Pares texto/fondo con contraste ≥ AA verificado.
- **Notas de la sesión (2026-09-22):** fuente única como TS tipado en `packages/tokens/src`: 27 primitives (solo los steps consumidos, color.md §1.5) y 25 semánticos de color `{light,dark}` (mapas §4/§5), con `as const satisfies` → semánticos consumen primitives por referencia (tipo `PrimitiveHex` los limita a hex emitidos; `color.text.inverse`/`color.action.*.text` = `#ffffff` fijo, decisión #3 RRU-020). `dist/` emite ESM con extensiones `.js` explícitas (fix del boiler ESM de Node, ver infra). **Gate de contraste AA automatizado** (DoD) vía `scripts/check-contrast.mjs` (Node, deps 0) en la tarea `test` del paquete, con `turbo.json` `test.dependsOn: ["^build","build"]`; data-driven contra color.md §6 (texto ≥4.5, bordes/foco ≥3) y las ratios reproducen la tabla (17.13, 5.46, 5.02, 4.83, 4.62, …). Invariantes estructurales: semántico solo consume primitives (o inverse fijo), sin primitives huérfanos ni valores duplicados, contrato de nombres kebab/puntos. **Infra (desviación justificada):** el `dist/` de tokens no era ejecutable por Node (imports relativos sin extensión) — bug latente que rompía el gate y que hubiera roto RRU-024; se añadieron `.js` a los relativos de `packages/tokens/src` y `extensionAlias: {".js":[".ts",".js"]}` al resolver de `eslint.config.js` (compat `moduleResolution: Bundler`). **Docs:** corregida `docs/color.md §3.2` `blue-500` `#3b82f6`→`#4c8cff` (valor real del `focus.ring` dark; gobernanza §7 RRU-020). **Scope:** los tints de alerta de §6.1 (warning/success/info/destructive) no figuran en los mapas §4/§5 → se difieren a RRU-049 (Badge), donde añadirán sus tokens y el gate los cubrirá al añadir sus pares. **Verificación:** gate completo ✅ (`lint` 5/5, `typecheck`, `test --filter=@raulrod/tokens` AA PASSED, `build`, `format:check`); sondas negativas: contraste < AA falla (3.71<4.5), hex arbitrario rechazado en compile time (`TS2322: not assignable to PrimitiveHex`), primitive huérfano/duplicado falla; sonda consumidor en temp OK (tipos como consumidor vía node_modules symlink + runtime con valores exactos y uniones derivadas, negativas `@ts-expect-error`). Vitest migrará este gate en RRU-068 (nota en el script).
- **Política (decisión de usuario):** el check `.mjs` vive en `packages/tokens/scripts/` en **local, gitignored** (`**/scripts/*.mjs`, política análoga a `/docs`, RRU-014) — no se sube al repo. El `test` de `@raulrod/tokens` lo referencia, por lo que un checkout fresco sin el archivo no ejecutará el gate hasta que RRU-068 lo sustituya por tests Vitest trackeables; CI `pnpm test` quedará en rojo si se pushea sin el archivo local (pendiente de resolver en RRU-068).

### RRU-022 · Typography tokens

- **Epic:** EPIC-2 · **Estado:** ✅ Done · **Fecha:** 2026-09-23
- **Prioridad:** P0 · **Estimación:** S/M · **Dependencias:** RRU-003
- **Labels:** `tokens`
- **Descripción:** Emitir como tokens: family `sans`/`mono` (RRU-003), escala de tamaños, line-heights, weights, letter-spacing y `tabular-nums` para datos.
- **Criterios de aceptación (DoD):**
  - [x] `font.family.sans/mono`, `font.size.*`, `font.weight.*`, `font.leading.*`, `font.tracking.*`.
  - [x] Fluid scale solo si hay necesidad real (mantener estático en MVP).
- **Notas de la sesión (2026-09-23):** revisada y cerrada (estaba 👀 In Review desde la sesión anterior; commit `719a5c3`). Gate AA pasa con `Semantics: 49`. `dist/` con los `font.*` escalares emitidos (semantic.d.ts tipado con `SemanticValue = color pair | string | number`). Desbloquea RRU-024.

### RRU-023 · Spacing, radius, shadow, motion, z-index, breakpoints

- **Epic:** EPIC-2 · **Estado:** ✅ Done · **Fecha:** 2026-09-23
- **Prioridad:** P0 · **Estimación:** M · **Dependencias:** RRU-020
- **Labels:** `tokens`
- **Descripción:** Escalas coherentes (§10): `space-*` (base 4px), radius `{none,sm,md,lg,full}`, shadows pequeña escala, motion `duration` + `easing` + `prefers-reduced-motion`, z-index semántico y breakpoints.
- **Criterios de aceptación (DoD):**
  - [x] Escala de spacing base 4 documentada.
  - [x] Radius con la escala del §10.
  - [x] Motion tokenizado y con variante `reduced-motion`.
  - [x] Breakpoints con nombres semánticos (`sm/md/lg/xl`).
- **Notas de la sesión (2026-09-23):** primitives `space-{0,1,2,3,4,5,6,8,10,12,16}` (base 4px: 0–64px) y `radius-{none,sm,md,lg,full}` (0/4/8/12/9999px) como strings CSS; semánticos `breakpoint.{sm,md,lg,xl}` (640/768/1024/1280), `shadow.{sm,md}` (box-shadow), `motion.duration.{fast,base,slow}` (100/200/350ms), `motion.easing.{standard,enter,exit}` (cubic-bezier), `motion.behavior.{default,reduced}` (`auto`/`none`, RRU-024 lo emite bajo `prefers-reduced-motion: reduce`), `z.{base,overlay,modal,toast}` (0/100/200/300). **Cambio de contrato (gobernanza §7):** `SemanticKey` y el gate pasan de mínimo 3 a mínimo 2 segmentos (`shadow.sm`, `z.modal`, `breakpoint.sm`); tocó `taxonomy.ts`, `check-contrast.mjs` y `token-taxonomy.md §3.2` en el mismo cambio. `PrimitiveHex` se acota a hex (`Extract<…, \`#${string}\`>`) porque el gate de color (valores únicos/huérfanos/AA) solo aplica a primitives hex; `space-*`/`radius-*` no referenciados por semánticos son consumed-direct y el gate los valida por namespace (base-4 y set de radius). Gate verde: `Primitives: 43 | Semantics: 67 | Pairs: 20`. Desbloquea RRU-024.

### RRU-024 · Emisión CSS custom properties + theming

- **Epic:** EPIC-2 · **Estado:** ✅ Done · **Fecha:** 2026-09-23
- **Prioridad:** P0 · **Estimación:** M · **Dependencias:** RRU-021, RRU-022, RRU-023
- **Labels:** `styling` `tokens`
- **Descripción:** Generar CSS variables a partir de los tokens: variables primitivas (estáticas en `:root`) y semánticas por tema (`[data-theme="light"|"dark"]`); `@media (prefers-color-scheme: dark)` para el tema por defecto si no hay override; `prefers-reduced-motion`. SSR-safe (sin flash: script de inline o atributo en `<html>` documentado).
- **Criterios de aceptación (DoD):**
  - [x] Todas las variables consumidas por componentes vienen de esta capa.
  - [x] Cambio de tema sin flash (guía de `data-theme` en `<html>`).
  - [x] Funciona en SSR/SSG sin error de hidratación.
- **Notas de la sesión (2026-09-23):** emisor **local** `packages/tokens/scripts/emit-css.mjs` (gitignored `**/scripts/*.mjs`, política RRU-021) integrado en `build: "tsc && node scripts/emit-css.mjs"` → `dist/tokens.css` (43 primitivas + 67 semánticas; 25 colores temáticos; se regenera en cada build). **Diff trackeado mínimo:** `package.json` build + `turbo.json` con `**/scripts/*.mjs` añadido a `build.inputs` (el emisor es gitignored y sin ese input Turbo cacheaba sin regenerar — bug detectado en sesión). Estructura emitida: `:root` (`color-scheme: light` + primitivas + escalares agnósticos + `color.*` light), `[data-theme="dark"]` (dark), `@media (prefers-color-scheme: dark){:root:not([data-theme="light"])}` duplica el bloque dark (sin atributo → sistema; light explícito gana al sistema oscuro), `@media (prefers-reduced-motion: reduce)` flipea `--rr-motion-behavior-default: none` (semantic.ts motion comment). Naming `--rr-` + key (`.`→`-`, decisión #1); `font.size.*`/`breakpoint.*` en px; `color-scheme` declarado por tema (native controls). Emisor con invariantes post-generación (naming `/^--rr-[a-z0-9-]+$/`, valores ilegales `[;{}]`/`undefined`/`NaN`, recuentos 1× primitivas-escalares / 3× colores / 2× behavior-default, llaves balanceadas, markers de estructura) → exit 1 sin escribir artefacto. Guía `docs/theming.md` (no-trackeado, política `/docs`): modelo de 3 estados de tema, script bloqueante anti-flash en `<head>`, SSR/SSG (`data-theme` fuera del render de React), contrato override (`var(--rr-*)`), límite breakpoints-en-`@media`. Gate: `pnpm lint`/`typecheck`/`build` ✅, `pnpm test --filter=@raulrod/tokens` AA PASSED 43/67/20, `format:check` ✅ (dist en `.prettierignore`); sonda negativa (valor `;`) → exit 1 sin artefacto; fixture HTML en `$TMPDIR/opencode/rru-024-fixture.html` para revisión manual (flip de tema, fallback sistema, a11y teclado foco `--rr-color-focus-ring`, swatches de los 25 colores). DoD (1): capa emisora única de los 3 layers + regla consumidora documentada (aún no hay componentes); (2) guía §4 sin flash; (3) CSS estático sin `window` → imposible mismatch por el paquete; verificación runtime SSR llega con playground (RRU-110). **Deuda:** checkout/CI sin el `.mjs` local no genera el CSS (misma deuda que el gate de contraste, RRU-021, pendiente RRU-068). Desbloquea RRU-028.

### RRU-025 · Emisión TypeScript de tokens

- **Epic:** EPIC-2 · **Estado:** ✅ Done · **Fecha:** 2026-09-23
- **Prioridad:** P1 · **Estimación:** S/M · **Dependencias:** RRU-020
- **Labels:** `tokens` `component`
- **Descripción:** Exportar desde `@raulrod/tokens` tipos derivados (uniones `Spacing | Radius | Size | ...`) para que las props de componentes estén tipadas contra los tokens (§16).
- **Criterios de aceptación (DoD):**
  - [x] `@raulrod/tokens` exporta constantes + tipos.
  - [x] Uniones derivadas de la fuente única (sin duplicar literales).
- **Notas de la sesión (2026-09-23):** nuevo módulo `packages/tokens/src/derived.ts` con uniones de dominio derivadas por `Extract<…, \`ns.${string}\`>` sobre las keys `as const` de `primitives.ts`/`semantic.ts` (cero literales duplicados; añadir/eliminar un token reconfigura las props sin tocar este archivo). Set emitido: primitives `Spacing` (`space-*`), `Radius` (`radius-*`); semánticos `TypeScale` (`font.size.*`), `FontWeight`, `FontLeading`, `FontTracking`, `FontFamily`, `FontNumeric`, `Breakpoint`, `Shadow`, `MotionDuration`/`MotionEasing`/`MotionBehavior`, `ZIndex`, y colores `ColorText`/`ColorBackground`/`ColorBorder`. Nota de naming: se evitó `Size` (colisiona con el ejemplo literal de `docs/typescript.md` §8, RRU-011). Re-export tipo en `index.ts` (frontera pública; `derived.ts` no se exporta como módulo). **Verificación:** gate completo ✅ (`pnpm lint` 5/5, `pnpm typecheck`, `pnpm test --filter=@raulrod/tokens` AA PASSED 43/67/20, `pnpm build` → `dist/derived.d.ts` emitido, `pnpm format:check`); sonda consumidor en `$TMPDIR`: import tipo desde `@raulrod/tokens` (resolución vía `main`→`types` del paquete, misma vía que RRU-016/020) compila con valores válidos y **falla** en compile time con valores inválidos (`space-7`, `radius-xl`, `font.size.6xl`, `breakpoint.2xl`, `z.comic` → `TS2820`/`TS2322` con sugerencia del valor más cercano). Desbloquea RRU-031/032 (props tipadas contra `Spacing`/`TypeScale`/`ColorText`).

### RRU-026 · Component tokens (solo cuando aporten valor)

- **Epic:** EPIC-2 · **Estado:** ✅ Done · **Fecha:** 2026-09-23
- **Prioridad:** P2 · **Estimación:** S · **Dependencias:** RRU-020
- **Labels:** `tokens`
- **Descripción:** Crear `button.primary.background(.hover/.disabled)` únicamente cuando surja una necesidad real (no una capa infinita). Regla §9: no crear cientos antes de necesidades concretas.
- **Criterios de aceptación (DoD):**
  - [x] Existe al menos 1 ejemplo real de component token útil.
  - [x] Ausencia de tokens especulativos justificada.
- **Notas de la sesión (2026-09-23):** capa componente implementada en `packages/tokens/src/component.ts` (único diff trackeado): valores = **referencias a semánticos de color** (`as const satisfies Record<ComponentKey, SemanticColorKey>`; `SemanticColorKey` interna, no exportada) → enforcement en compile-time y respeto de la regla de capas (prohibido saltar a primitive, token-taxonomy §1/§2). Ejemplo real (DoD #1): `button.primary.background` y `button.primary.background.hover` → `color.action.primary.background(.hover)`. Emisión (`scripts/emit-css.mjs`, local): alias `--rr-button-primary-background: var(--rr-color-action-primary-background);` declarado **una sola vez en `:root`** — el flip dark lo hereda del semántico, sin duplicación en bloques dark — más invariante `declared 1×` por key. Gate (`scripts/check-contrast.mjs`, local): `ComponentKey` mín. 3 segmentos, ref debe resolver a un semántico `color.*` existente, sin target duplicado ni valores crudos → `Primitives: 43 | Semantics: 67 | Components: 2 | Pairs: 20` PASSED. **Diferimiento justificado (DoD #2):** `button.primary.background.disabled` NO se crea — no existe semántico disabled y crearlo sin componente consumidor sería exactamente la capa especulativa que §9 prohíbe; además WCAG 1.4.3 exime a controles disabled del contraste. Se añadirá en RRU-041 junto a la paleta real de Button. Tampoco `button.secondary.*`/`button.destructive.*`/`dropdown.*` hasta que exista su componente. Verificación: gate completo ✅ (`lint`, `typecheck`, `test --filter=@raulrod/tokens`, `build` → dist CSS con alias, `format:check`) + sondas compile-time en `$TMPDIR/opencode` (ref a semántico inexistente, token inexistente, key de 2 segmentos, ref no-color `font.size.base`, primitive como component token → todas rechazadas) + sonda de consumo runtime (`import { component }` resuelve las 2 keys).
- **Cierre (2026-09-23):** revisado por el usuario en esta sesión sobre el diff en `development`; DoD cumplido. EPIC 2 queda ✅ completo → desbloquea el avance a EPIC 3.

### RRU-027 · ADR-002 — Arquitectura de tokens

- **Epic:** EPIC-2 · **Estado:** ✅ Done · **Fecha:** 2026-09-23
- **Prioridad:** P1 · **Estimación:** S · **Dependencias:** RRU-020
- **Labels:** `docs` `tokens`
- **Descripción:** ADR de la arquitectura primitivo→semántico→componente y de la decisión de no empaquetar fuentes (RRU-003), con alternativas (Design Tokens W3C, Style Dictionary) y consecuencias.
- **Criterios de aceptación (DoD):**
  - [x] `docs/decisions/002-token-architecture.md` publicado.
- **Notas de la sesión (2026-09-23):** entregable `docs/decisions/002-token-architecture.md` (igual política de no-trackeo que 001/007; /docs gitignored). Template §22 coherente con 001/007 (metadata + Context/Decision/Alternatives/Consequences). Documenta la arquitectura **y** el código real (no especulativo): 3 capas con dirección de dependencia enforced en compile-time (`component.ts` `satisfies Record<ComponentKey, SemanticColorKey>`; `PrimitiveHex`), TS `as const` de `packages/tokens/src` como única fuente, contrato de nombres en `taxonomy.ts` (kebab / ≥2 segmentos por RRU-023 / ≥3 component), gate AA en `pnpm test` (43/67/2), uniones derivadas (RRU-025), emisión CSS (RRU-024 + ADR-003/RRU-028), y no-bundle de fuentes (RRU-003). Alternativas con motivo: Design Tokens W3C/DTCG (segunda fuente de verdad y generación; migración futura documentada como coste), Style Dictionary (pierde verificación por tipos del `as const`; sobre-engineering para el tamaño del DS), JSON plano (pierde `satisfies`/`Extract` → gate temprano), bundle de fuentes (licencias + payload; decisión #3). Consecuencias incluyen la deuda conocida del tooling `.mjs` local/gitignored resuelta en RRU-068 y el "coste de migración futuro" a DTCG mitigado porque el modelo de capas/keys es portable. **Discrepancia previa resuelta:** la nota de RRU-003/RRU-006 sobre README/ADR-007 usando `JetBrains` (vs `JetBrains Mono`) ya no existe en el repo (`rg` limpio); `semantic.ts:78` y `typography.md` usan `JetBrains Mono` — no hizo falta tocar README/ADR-007. Verificación: gate completo ✅ (`pnpm lint`, `pnpm typecheck`, `pnpm test --filter=@raulrod/tokens` AA PASSED 43/67/2, `pnpm build`, `pnpm format:check`).

Nota de planificación: la regla de orden §0 paso 1 daba RRU-027 como next (menor ID de EPIC 2 con deps ✅); RRU-028 (P0) quedó identificado como opción de adelantamiento que el tablero explícitamente autoriza (nota §0.1).

### RRU-028 · ADR-003 — Estrategia de styling (CSS + variables)

- **Epic:** EPIC-2 · **Estado:** ✅ Done · **Fecha:** 2026-09-23
- **Prioridad:** P0 · **Estimación:** S · **Dependencias:** RRU-024
- **Labels:** `docs` `styling`
- **Descripción:** ADR que fija CSS plano + CSS variables (sin CSS-in-JS): zero runtime, theming por `data-theme`, clases `rr-*`. Alternativas evaluadas: CSS Modules, vanilla-extract, CSS-in-JS. Consecuencias: overrides por CSS variables, no por props de estilo.
- **Criterios de aceptación (DoD):**
  - [x] `docs/decisions/003-styling-strategy.md` publicado.
  - [x] Documenta el contrato de override: el consumidor cambia variables, no estilos internos.
- **Cierre (2026-09-23):** revisado por el usuario en sesión de RRU-030 sobre el diff en `development`; ADR-003 aceptado (`Status: Accepted`) con coherencia cruzada ya verificada y contrato de override explícito. Desbloquea RRU-030.
- **Notas de la sesión (2026-09-23):** entregable `docs/decisions/003-styling-strategy.md` (igual política de no-trackeo que 001/002/007; /docs gitignored, sin diff de commit). Template §22 coherente con 001/002/007 (metadata + Context/Decision/Alternatives/Consequences). Documenta la decisión #1 del tablero **materializada en código real** (no especulativo): CSS plano + CSS custom properties, clases `rr-*` BEM-ish (Playbook §4 Paso 3), componentes que consumen **solo** `var(--rr-*)` de `dist/tokens.css` emitido en RRU-024 (`:root` light, `[data-theme="dark"]`, `@media (prefers-color-scheme: dark)`, `prefers-reduced-motion` — theming.md §2), theming declarativo por `data-theme` sin lógica en componentes (guía §11, theming.md §3–5), cero runtime de styling, a11y por construcción (`:focus-visible`, `:disabled`, `prefers-reduced-motion`). **Contrato de override (DoD #2) explícito:** el consumidor cambia variables (`--rr-*` en su cascada); los selectores internos `rr-*` NO son API pública; un valor nuevo se resuelve por vía gobernada de tokens (RRU-026/041), no por CSS de internals. Alternativas evaluadas (las de la tarjeta + Tailwind por rigor): CSS Modules (hash rompe el override estable y añade tooling a un build `tsc`), vanilla-extract (plugin de build + segunda fuente sintáctica que duplica tokens+CSS+variables, regla §33), CSS-in-JS (runtime + lógica de tema en JS contra decisiones #1/#4), Tailwind (segunda fuente de verdad de tokens + theming paralelo + dependencia de toolchain del host). Consecuencias incluyen la deuda de gate de fronteras/estilos resuelta en RRU-103. Coherencia cruzada verificada con `rg`: ADR-003/RRU-028 ya referenciados en token-taxonomy §2/§8, color §1, typography §1, theming §1/§7, Playbook §4 Paso 3, producto §2 y decisión #1 del tablero → todos resueltos por este ADR sin contradicción. Checklist §39 aplicada al scope del ADR: Arquitectura (responsabilidad/responsabilidad de capa, ubicación en `docs/decisions/`, deps = RRU-024, público = contrato de override), API (extender = añadir token, no CSS; breaking = renombrar `--rr-*`/`rr-*`), Performance (cero runtime: el CSS es estático, cacheable, sin código nuevo descargado), DX (contrato documentado para un desarrollador nuevo), Mantenimiento (renombrado de prefijos es breaking, migración trivial por ser CSS estático). Gate pasado en sesión: `pnpm lint` 5/5 ✅, `pnpm typecheck` 3/3 ✅, `pnpm test --filter=@raulrod/tokens` AA PASSED 43/67/2 ✅, `pnpm build` ✅ (dist/tokens.css regenerado), `pnpm format:check` ✅. Desbloquea RRU-030.

---

# EPIC 3 — Foundations / primitives (Fase 3)

> Criterio §12: NO crear una primitive "por si acaso". Cada una debe resolver una necesidad repetida y demostrable.

### RRU-030 · Utilidades base (`cx`) + hooks de arranque

- **Epic:** EPIC-3 · **Estado:** ✅ Done · **Fecha:** 2026-09-23
- **Prioridad:** P0 · **Estimación:** S · **Dependencias:** RRU-028
- **Labels:** `component`
- **Descripción:** Utilidad de composición de clases (`cx`) sin dependencias externas, y helpers compartidos (generación de ids, `useId` wrapper) que usarán los componentes.
- **Criterios de aceptación (DoD):**
  - [x] `cx` con soporte condicional y falsy values, testeada.
  - [x] Sin dependencias nuevas (evitar clsx/tailwind-merge en MVP).
- **Notas de la sesión (2026-09-23):** primer código real de `@raulrod/ui`. **Archivo y exports:** `packages/ui/src/utils/cx.ts` (`CxValue = string | number | false | null | undefined | CxValue[]`, une con espacio, filtra falsy, arrays anidados aplanados, trim; **sin dedup** — eso es tailwind-merge, excluido por el DoD, y las clases duplicadas son idempotentes en CSS) y `packages/ui/src/utils/use-id.ts` (`useId(prefix = "rr")` envuelve `React.useId`, sanea los `:` de `:r0:` con `sanitizeId` **interno** `@internal` — no sale por `index.ts`; razón: React emite `:r0:`, inseguro para `htmlFor`/`aria-labelledby`/CSS). Ambos re-exportados públicamente desde `index.ts`. **Dependencias (decisión confirmada con el usuario):** `react` + `@types/react` añadidas como **devDependencies** de `@raulrod/ui` (necesarias para el hook; el peer público se formaliza en RRU-091; el DoD "sin dependencias nuevas" aplica a `cx` — cero `clsx`/`tailwind-merge`). **Test sin Vitest (patrón RRU-021):** script local gitignored `packages/ui/scripts/check-utils.mjs` (`node:assert`, 0 deps) referenciado por `"test"` en `package.json`; cubre `cx` (14 casos: join, falsy, condicionales, anidados, `0`, `""`, args vacíos) y `sanitizeId` (4 casos + unicidad) + `typeof useId === "function"`. `useId` **no se invoca fuera de componente** (rules of hooks) → su comportamiento en render queda validado por typecheck + revisión, con tests de componente llegando en RRU-068. **Anti-stale-cache:** `**/scripts/*.mjs` añadido a `test.inputs` de `turbo.json` (análogo al fix de `build.inputs` en RRU-024; sin esto, editar el script no invalidaría el cache de Turbo). **Gate pasado:** `pnpm lint` ✅, `pnpm typecheck` ✅, `pnpm test --filter=@raulrod/ui` ✅ (`AA PASSED: cx (14 cases) + sanitizeId (4 cases) + useId export`), `pnpm build` ✅ (`dist/index.js` + `.d.ts` con `cx`/`useId`/`CxValue`), `pnpm format:check` ✅. **Sondas en `$TMPDIR`:** runtime (symlink consumidor → `import { cx, useId } from '@raulrod/ui'` resuelve y une), tipos positivos (`CxValue[]` + `useId` tipan OK) y **negativa** (`cx({not:"a class"})` → `TS2353`). **Hallazgo (benigno):** Turbo avisa "no output files found for task @raulrod/ui#test" (mismo patrón que tokens: `outputs: coverage/**` no aplica hasta RRU-068). Desbloquea **RRU-031** (gap tipado contra `Spacing`); RRU-033/RRU-034 no dependen de esta tarjeta.
- **Cierre (2026-09-23):** revisado por el usuario sobre el diff en `development` (commit `b93e6ba`); DoD cumplido. Queda ✅ y desbloquea RRU-031/RRU-032 (RRU-040 depende de EPIC-3).

### RRU-031 · Layout helpers: `Stack` / `Inline` (y `Box` solo si hay demanda real)

- **Epic:** EPIC-3 · **Estado:** ✅ Done · **Fecha:** 2026-09-23
- **Prioridad:** P1 · **Estimación:** M · **Dependencias:** RRU-030, EPIC-2
- **Labels:** `component`
- **Descripción:** `Stack` (columna) e `Inline` (fila) con spacing por tokens y gap. **Evitar** un `Box` con decenas de props de layout (§12). **Decisión por defecto (cerrada): NO crear `Box` ni `asChild`/polymorphic en el MVP.** Solo se abrirá tarjeta nueva si aparece una necesidad real repetida y se documenta la evidencia en la tarjeta.
- **Referencias:** §12 (criterio de primitives); Playbook §4; ADR-003 (RRU-028).
- **Criterios de aceptación (DoD):**
  - [x] `Stack`/`Inline` con gap tipado contra `Spacing`.
  - [x] Ausencia de `Box` y `asChild` en el MVP justificada en las notas de la tarjeta (o tarjeta nueva abierta con evidencia).
  - [x] DoD global de componente cumplido.
- **Notas de la sesión (2026-09-23):** primeros componentes reales de `@raulrod/ui`. **Archivos:** `packages/ui/src/{stack,inline}/*` (`Stack.tsx`/`Inline.tsx` + `.types.ts` + `.css` + `index.ts`, Playbook §4 Paso 1). `Stack` = `div` flex column; `Inline` = row. **API (decisión de sesión, confirmada con el usuario):** `gap?: Spacing` (default `space-4` vía clase base de CSS, no en JS), `align?: FlexAlign`, `justify?: FlexJustify`, `wrap?: boolean`; extienden `HTMLAttributes<HTMLDivElement>`; `forwardRef`; merge de `className` con `cx` (RRU-030). **Sin polimorfismo (DoD #2):** no hay prop `as`/`asChild` (decisión cerrada de la tarjeta); la semántica la aporta el consumidor envolviendo (`<nav>`/`<ul>`); sonda negativa confirma que `<Stack as="nav">` falla en compile time (`TS2322`). **Mecánica de clases:** helper interno `src/utils/flex.ts` (NO exportado por root, typescript.md §4) con `Record` exhaustivos `Spacing`/`FlexAlign`/`FlexJustify` → modificadores `rr-*--gap-*`/`--align-*`/`--justify-*`/`--wrap`; añadir un paso de `space-*` en tokens rompe compile aquí hasta crear el modificador CSS (fail loud). CSS por componente: default `gap: var(--rr-space-4)`, 11 gaps + 5 aligns + 6 justifies + wrap, SOLO tokens para valores de diseño; `align`/`justify` son keywords de layout sin token (excepción documentada, análoga a las de RRU-024/026). Excepción de scope de la tarjeta confirmada en sesión (API surface gap+align+justify+wrap elegida sobre el literal "gap solamente"). **Dependencias:** `@raulrod/tokens` (`workspace:*`, sólo tipos devDep) + `react-dom@^19.3.0` (devDep, para el check SSR). **Tests (patrón RRU-030, gitignored `scripts/check-layout.mjs`):** `node:assert` + `renderToStaticMarkup` sobre `dist/` — comportamiento observable: clases emitidas por prop (los 11 gaps/5 aligns/6 justifies/wrap), merge `cx` con `className`, spread de props, children; contrato CSS (base `display:flex`/`direction`/default gap token, un selector modificador por cada valor, `flex-wrap:wrap`) y **lineage de tokens** (todo `var(--rr-*)` referenciado existe en `dist/tokens.css`). Diferidos con justificación: `.test.tsx` → RRU-068 (Vitest), `.stories.tsx` → RRU-082 (Storybook, precedente RRU-020/030). **a11y (DoD global):** contenedores genéricos sin `role` (semántica al consumidor, coherente con la decisión no-polimórfica); sin prop `order` (evita romper orden de lectura/tab); `align`/`justify`/`wrap` no alteran el orden DOM; keyboard/focus N/A (los hijos conservan comportamiento nativo); dark/responsive N/A (sin color ni tamaño). **Cambio de repo:** `eslint.config.js` `extensionAlias ".js": [".ts", ".tsx", ".js"]` — el resolver no resolvía imports `.js`→`.tsx` (convención Playbook); afecta a todos los paquetes y necesaria para RRU-040+. **Gate (orden §0 paso 4):** `pnpm lint` 5/5 ✅, `pnpm typecheck` 3/3 ✅, `pnpm test --filter=@raulrod/ui` ✅ (`AA PASSED: cx (14) + sanitizeId (4) + Stack/Inline SSR + CSS contract, gaps=11 aligns=5 justifies=6, 11 vars token-lineaged`; warning benigno "no output files" de Turbo, RRU-030), `pnpm build` ✅ (`dist/{stack,inline}/` con `.js`+`.d.ts`), `pnpm format:check` ✅. **Sondas consumidor en `$TMPDIR/opencode/rru-031-probe`:** `good.tsx` compila (import público, `gap`/`align`/`justify`/`wrap`/ARIA, ref); negativas → `gap="space-7"` `TS2820` con sugerencia "did you mean space-0", `align="middle"`/`justify="spread"` `TS2322`, `as="nav"` rechazada; runtime SSR real (`node runtime.mjs`) emite modificadores, merge y attr ARIA. DoD global evaluado ítem por ítem (API ✓, TS ✓, a11y ✓ con N/A justificados, tests ✓, stories/docs diferidos ✓, export root ✓, tokens ✓). Desbloquea RRU-032 (RRU-040 sigue dependiendo de EPIC-3).
- **Cierre (2026-09-23):** revisado por el usuario en esta sesión sobre el diff en `development` (commit `6baeb99`); DoD cumplido. Queda ✅ y desbloquea RRU-032.

### RRU-032 · `Text` / `Heading`

- **Epic:** EPIC-3 · **Estado:** ✅ Done · **Fecha:** 2026-09-23
- **Prioridad:** P1 · **Estimación:** M · **Dependencias:** RRU-022, RRU-031
- **Labels:** `component`
- **Descripción:** `Text` (size/weight/color semántico/etc.) y `Heading` jerárquico (h1–h6 + `as`), ambos sobre tokens de tipografía.
- **Criterios de aceptación (DoD):**
  - [x] Jerarquía de heading correcta por defecto; `as` documentado.
  - [x] Color por tokens semánticos (`color.text.*`).
- **Notas de la sesión (2026-09-23):** componentes `packages/ui/src/{text,heading}/*` (Playbook §4 Paso 1: `.tsx` + `.types.ts` + `.css` + `index.ts`). **`Text`**: `forwardRef<HTMLSpanElement>`, `span` sin `as` (decisión cerrada de RRU-031; la semántica la aporta el consumidor envolviendo), props `size?: TypeScale` / `weight?: FontWeight` / `color?: ColorText`; default vía `Text.css` = rol `body` (`font.size.base`, `regular`, `color.text.primary`, `leading.normal`, rol de docs/typography.md §4.4). **`Heading`**: `as?: HeadingLevel` (`"h1"…"h6"`, default `h2`) — **única excepción de polimorfismo acotada del MVP** (exigida por el DoD de esta tarjeta; sin `asChild` genérico); tamaño por defecto derivado del tag vía `Record<HeadingLevel, TypeScale>` en `Heading.tsx` (`sizeByLevel`: h1→`4xl` … h6→`base`, jerarquía monótona, sonda SSR verifica), base CSS = rol `heading` (`semibold`, `leading.tight`, `tracking.tight`) **sin `font-size` en el base** → todo heading emite modificador de tamaño (nunca tamaño heredado). `color?: ColorText` en ambos. **Mecánica de clases:** helper interno `src/utils/typography.ts` (NO exportado por root, typescript.md §4) con `Record` exhaustivos `TypeScale`/`FontWeight`/`ColorText` → modificadores `rr-text--size-*`/`--weight-*`/`--color-*` y `rr-heading--*`; añadir un token rompe compile aquí hasta crear el modificador CSS (fail loud), mismo patrón que `utils/flex.ts` (RRU-031). CSS SOLO tokens (`font.*`/`color.text.*`), sin valores arbitrarios (typography.md §1, ADR-003). **Tests (patrón RRU-030/031, gitignored `scripts/check-text.mjs`):** `node:assert` + `renderToStaticMarkup` sobre `dist/` — SSR observable (defaults, los 10 sizes/4 weights/3 colors, combinados, 6 niveles de heading con tag+size, merge `cx` con `className`, spread de props/ARIA); contrato CSS (base rol body/heading, un selector por cada valor de los Records, **base heading sin font-size**, `doesNotMatch`); lineage de las 22 `var(--rr-*)` contra `dist/tokens.css`. **Export público:** `index.ts` raíz añade `Text`/`Heading` + tipos (`TextProps`, `HeadingProps`, `HeadingLevel`). **Verificación (gate):** `pnpm lint` ✅, `pnpm typecheck` ✅, `pnpm test --filter=@raulrod/ui` ✅ (`AA PASSED: Text/Heading SSR + CSS contract (sizes=10 weights=4 colors=3, 22 vars)`), `pnpm build` ✅, `pnpm format:check` ✅ (Prettier aplicado a los 9 ficheros nuevos). **Sondas consumidor en `$TMPDIR/rru-032-probe`:** `good.tsx` (import público, `as` h1/h6/default h2, size/weight/color, `className`) compila; `bad_raw.tsx` falla con tipos útiles → `as="h7"` (`TS2769` to `HeadingLevel`), `color="blue"`, `size="font.size.6xl"` ("Did you mean `font.size.xl`?"), `weight="font.weight.black"` ("Did you mean `font.weight.bold`?"); `runtime.mjs` SSR real emite `<h1 class="rr-heading rr-heading--size-4xl">` / `<h3 …--color-muted>` / `<span …--size-sm --weight-semibold --color-inverse>`. **Revisión manual a11y:** fixture `$TMPDIR/rru-032-fixture.html` (jerarquía h1→h6 monótona, muted/inverse en ambos temas, focus ring con `--rr-color-focus-ring`, teclado de tab-stops) — pendiente de revisión del usuario. DoD global evaluado: API ✓ (coherente con tokens y Stack/Inline), TS ✓ (cero any/as; tipos públicos exportados), a11y ✓ (semántica por tag/role, color por tokens contrastados en RRU-021), estados ✓ (N/A salvo color por prop), tests ✓ (patrón .mjs hasta RRU-068), stories/docs diferidos ✓ (RRU-080/RRU-083), export root ✓, tokens ✓ (22 vars lineaged). Desbloquea RRU-040 (sigue dependiendo de EPIC-3 completo).

### RRU-033 · `VisuallyHidden`

- **Epic:** EPIC-3 · **Estado:** ✅ Done · **Fecha:** 2026-09-23
- **Prioridad:** P0 · **Estimación:** S · **Dependencias:** —
- **Labels:** `component` `a11y`
- **Descripción:** Componente que oculta visualmente pero mantiene contenido accesible (lector de pantalla). Usado por IconButton, FormField, etc.
- **Criterios de aceptación (DoD):**
  - [x] No ocupa layout, no bloquea focus ni clic.
  - [x] Acepta `focusable` para utilidades de skip-link.
- **Notas de la sesión (2026-09-23):** componente `packages/ui/src/visually-hidden/*` (Playbook §4 Paso 1: `.tsx` + `.types.ts` + `.css` + `index.ts`). `forwardRef<HTMLSpanElement>`, `span` sin `as` (decisión cerrada RRU-031); prop `focusable?: boolean` (default `false`) → clase `rr-visually-hidden--focusable`. **CSS sr-only moderno:** base `position:absolute` + `width/height:1px` + `margin:-1px` + `overflow:hidden` + `clip:rect(0 0 0 0)` + `clip-path:inset(50%)` + `white-space:nowrap` — **excepción de tokens documentada** (valores de mecánica a11y/geometría sin contrapartida de token; precedente RRU-031 `align`/`justify`); **prohibido `display:none`/`visibility:hidden`** (sacarían del árbol a11y y bloquearían focus — DoD #1). Variante focusable revela en `:focus`/`:active`/`:focus-within` (`position:static; width/height:auto; clip:auto; overflow:visible`) → **skip-link por composición sin polimorfismo (decisión de sesión, confirmada con el usuario):** `<a href="#main"><VisuallyHidden focusable>Skip to main</VisuallyHidden></a>` — `:focus-within` cubre el `a` envolvente (WCAG G1; mismo criterio que `.visually-hidden-focusable` de Bootstrap 5.3 / A11y Project). Sin `aria-hidden`: el contenido debe PERMANECER en el árbol a11y. **Tests** (`scripts/check-visually-hidden.mjs`, gitignored `**/scripts/*.mjs`, patrón RRU-030/031/032): SSR observable (`renderToStaticMarkup` sobre `dist/`) — base, `focusable` true/false, merge `cx` con `className`, spread de props/ARIA, children, `displayName`; contrato CSS — base sr-only + **negativos** `display:none`/`visibility:hidden`, regla grouped `:focus/:active/:focus-within` con resets `static/auto/visible/clip:auto`, y **0 vars `--rr-*`** (assert inverso del lineage de Text/Stack; excepción documentada, `turbo.json test.inputs` ya cubre el script). **Verificación:** gate completo ✅ (`pnpm lint` 5/5, `pnpm typecheck` 3/3, `pnpm test --filter=@raulrod/ui` 4/4 AA PASSED, `pnpm build` 3/3, `pnpm format:check` ✅ tras `prettier --write` en los 4 archivos nuevos). **Revisión manual a11y (obligatoria §0 paso 4):** fixture `$TMPDIR/opencode/rru-033-fixture.html` para teclado/lector — skip link se revela al tabear (`:focus-within` sobre el `a`), el span sr-only NO entra en tab order, posible sondeo con lector de pantalla del contenido oculto en un párrafo. `.test.tsx`/`.stories.tsx`/MDX difieren a RRU-068/RRU-080 (convención EPIC-3). **Commit propuesto:** `feat(ui): add VisuallyHidden primitive (RRU-033)`. **Desbloquea RRU-042 (IconButton) y RRU-044 (FormField).**

### RRU-034 · `Portal`

- **Epic:** EPIC-3 · **Estado:** ✅ Done · **Fecha:** 2026-09-23
- **Prioridad:** P0 · **Estimación:** S · **Dependencias:** —
- **Labels:** `component` `a11y`
- **Descripción:** Portal a `document.body` (o `container` prop) con soporte SSR (no romper hidratación). Base para Dialog/Popover/Tooltip/Toast.
- **Criterios de aceptación (DoD):**
  - [x] Renderiza en body por defecto; `container` configurable.
  - [x] Sin errores de hidratación en SSR.
- **Notas de la sesión (2026-09-23):** componente `packages/ui/src/portal/*` (`Portal.tsx` + `.types.ts` + `index.ts`; Playbook §4 Paso 1). **API:** `PortalProps { children?: ReactNode; container?: HTMLElement }` (default `document.body`); re-exportado desde `index.ts` raíz. **SSR-safe (estrategia "null hasta montar", confirmada con el usuario):** el gate de montaje usa `useSyncExternalStore(subscribe, ()=>true, ()=>false)` — forma canónica pura de flag-hydration: el renderer consulta el snapshot *de servidor* (`false`) tanto en serialización como antes de hidratar en cliente (markup inicial siempre coincide → sin mismatch, DoD #2), y tras el commit de hidratación lee el snapshot de cliente (`true`) y re-renderiza una vez para hacer `createPortal`. Evita `setState` síncrono en effect (gate `react-hooks/set-state-in-effect`, hallazgo de lint en esta sesión) y side-effects en `getSnapshot`; alternativa render-in-place + mover descartada (complejidad, riesgo de huecos de hidratación; ver API design). **Decisiones de scope:** sin `.css` (primitiva JS pura, 0 tokens — excepción documentada análoga a a11y-geometry de RRU-033), sin `forwardRef` (Portal no renderiza elemento propio; los refs van en los hijos del consumidor — desviación justificada de la convención de refs), sin `as`/polimorfismo (decisión cerrada RRU-031). **Helper interno** `src/utils/portal.ts` `resolvePortalContainer(container)` (body default / container override, resuelto SOLO tras montar — `document` nunca se toca en SSR; NO exportado por root, sonda negativa `TS2305`). **Deps:** añadido `@types/react-dom@^19.3.0` como devDep de `@raulrod/ui` (faltaba para `createPortal`/tipos DOM; `react-dom` ya era devDep desde RRU-031). **Tests (patrón RRU-030, gitignored `scripts/check-portal.mjs`, 5º en la cadena del `"test"`):** SSR observable (`renderToStaticMarkup` vacío y sin throw con y sin container), resolución de container con stub de `document.body` + override, `displayName`. **Verificación:** gate completo ✅ (`pnpm lint` 5/5, `pnpm typecheck` 3/3, `pnpm test --filter=@raulrod/ui` 5/5 AA PASSED, `pnpm build` 3/3, `pnpm format:check` ✅ tras `prettier --write`); sondas en `$TMPDIR/opencode/rru-034-probe/` (consumidor real: `Portal` resuelve tipos y runtime, SSR `""`, `resolvePortalContainer` NO exportado → TS2305). **Revisión manual pendiente (fixture `rru-034-fixture.html` en `$TMPDIR`):** escenarios body-default + container-override + a11y teclado; servir repo con `python3 -m http.server 8080` (importmap esm.sh para react/react-dom). El montaje real de cliente (createRoot/hydrate) se valida ahí de forma manual — tests de componente llegan en RRU-068 (precedente `useId` RRU-030).

---

# EPIC 4 — Componentes fundamentales (Fase 4)

> Orden sugerido por la guía. No todos a la vez: uno hecho (DoD completo) antes del siguiente (§4, §13).
> Cada uno debe reutilizar iconos de `@raulrod/icons` (lucide) cuando los necesite.

### RRU-040 · Patrón base de componente (refs, variantes, merge de props)

- **Epic:** EPIC-4 · **Estado:** ✅ Done · **Fecha:** 2026-09-23
- **Prioridad:** P0 · **Estimación:** S · **Dependencias:** EPIC-3, RRU-030
- **Labels:** `component`
- **Descripción:** Definir el patrón común: forward refs, merge de `className`/estilos, mapas de variantes (sin prop explosions), tipos `VariantProps` derivados. **Fija la convención de archivos por componente del Playbook §4 Paso 1** (`<Pascal>.tsx`, `.types.ts`, `.css rr-*`, `.test.tsx`, `.stories.tsx`, `index.ts`) como obligatoria para el resto de tarjetas de componente. Documentar en una MDX base.
- **Referencias:** §15 (APIs coherentes); Playbook §4; `docs/typescript.md` (RRU-011).
- **Criterios de aceptación (DoD):**
  - [x] Convención de variantes (`variant`, `size`) consistente.
  - [x] `ref` y `className` funcionan en todos los componentes (§15 API coherente).
  - [x] Estructura de archivos por componente fijada en el Playbook §4 y verificada con el primer componente que la use.
- **Notas de la sesión (2026-09-23):** patrón codificado + documentado. **Código (diff trackeado):** `packages/ui/src/utils/variants.ts` (interno, NO exportado de `index.ts`) con `VariantMaps`/`VariantProps<M>` derivado del mapa (`Extract<keyof M[K], string>`) y `createVariants<const M>(maps)` → builder `(root, props)` que emite `rr-<root>--<sufijo>` en orden de inserción; un solo `as` comentado (correlación perdida en `Object.entries`), cero `any`; helper deliberadamente mínimo — sin compound variants, sin defaults (viven en CSS, precedente Stack.gap), sin features cva (§33); booleanos (`wrap`/`focusable`) quedan fuera como `cx` condicional explícito. **Refactor de rigor:** `utils/flex.ts` y `utils/typography.ts` pasan a usar el helper — firmas `flexClasses(root, mods)`/`typographyClasses(root, mods)` SIN cambio (cero diff en los `.tsx` de componentes); `*Modifiers` ahora = `VariantProps<typeof maps>` (derivadas, sin literales duplicados); los checks existentes comparan strings exactos de clase → detectores de regresión del refactor (gaps=11/aligns=5/justifies=6 y sizes=10/weights=4/colors=3 siguen verdes). **Test (patrón RRU-030, local `scripts/check-pattern.mjs`, 6º en la cadena `test`):** estructura de archivos por componente (`.tsx`/`.types.ts`/`index.ts` + `.css` salvo excepciones doc.), `forwardRef` real (`Symbol.for('react.forward_ref')`) en los 5 con elemento + **negativo** Portal (excepción doc. RRU-034), `displayName` en los 6, merge `className` (valor consumidor apilado tras la base `rr-*`) + pass-through (`id`/`title`/`aria-*`/`data-*`) observable en SSR, guards de convención: sin props `kind`/`dimension` en ningún `.types.ts` (§15) y `utils/variants` sin exportar desde la raíz (frontera). **Docs (locales, /docs gitignored):** `docs/component-pattern.mdx` (fuente de verdad del patrón: estructura obligatoria + excepciones, contrato ref/className, convención de variantes, mecánica del helper y lo que NO hace, composición §15, verificación y trade-offs); Playbook §4 Paso 1 reforzado como **obligatorio** + transición `.test.tsx`/`.stories.tsx` (RRU-068/RRU-080) + path corregido `packages/react`→`packages/ui` (coherencia ADR-001); `docs/typescript.md` §8 y referencias cruzadas apuntan a `variants.ts`/MDX. **DoD #3 (interpretación confirmada con el usuario):** estructura verificada contra los 6 componentes existentes (núcleo de 4-5 archivos; `.test.tsx`/`.stories.tsx` imposibles pre-RRU-068/080); Button (RRU-041) será la primera instancia de 6 archivos y lo re-verifica en su DoD. **Verificación:** gate completo ✅ (`pnpm lint` 5/5, `pnpm typecheck` 3/3, `pnpm test --filter=@raulrod/ui` AA PASSED 6/6, `pnpm build` 3/3, `pnpm format:check` ✅) + sondas en `$TMPDIR/opencode/rru-040-probe`: positiva (los 6 aceptan `ref` tipado + `className` + variantes válidas; consumer-probe) y 6 negativas con códigos esperados (`neg-portal-ref` TS2322; `neg-gap` TS2820; `neg-kind` TS2322; `neg-root-export` TS2305 → helper no accesible desde la raíz; `neg-builder-value` TS2322 → valor ajeno a la unión; `neg-variantprops` TS2322+TS2741 → mapa incompleto/exhaustividad). Checklist §39 scoped: Arquitectura (helper interno bien ubicado, sin deps nuevas), API (firmas públicas intactas), DX (errores de tipos del consumidor comprensibles, validado por sondas), Testing (contrato protegido por strings de clase + sondas compile-time); a11y por teclado N/A en esta tarjeta (sin UI interactiva; el patrón mandate `:focus-visible`/`:disabled`/reduced-motion en el MDX). Deuda anotada: `check-pattern.mjs` gitignored → `pnpm test` de `@raulrod/ui` rojo en checkout fresco sin el archivo local (misma política RRU-021, resuelta en RRU-068). Desbloquea RRU-041/043/046.

### RRU-041 · Button

- **Epic:** EPIC-4 · **Estado:** ✅ Done · **Fecha:** 2026-09-23
- **Prioridad:** P0 · **Estimación:** M · **Dependencias:** RRU-040, EPIC-2
- **Labels:** `component`
- **Descripción:** `variant {primary,secondary,outline,ghost,destructive,link}`, `size`, disabled, `loading` (spinner + aria-busy + disable interacción), icon support (`startIcon`/`endIcon`), focus visible, keyboard, as `button`/`a` (link) cuando aplique. Estados hover/active/focus/disabled (§13).
- **Criterios de aceptación (DoD):**
  - [x] `loading` desactiva y comunica estado a screen reader.
  - [x] Render como `a` soportado (sin `href` no es link).
  - [x] Iconos vía `@raulrod/icons`.
  - [x] DoD global de componente cumplido (stories, tests, docs, a11y, dark).
- **Notas de la sesión (2026-09-23):** componente `packages/ui/src/button/*` (`.tsx` + `.types.ts` + `.css` + `index.ts`; Playbook §4 Paso 1). **API:** `variant {primary,secondary,outline,ghost,destructive,link}` default `primary` en JS (precedente Heading `as`), `size {sm,md,lg}` default `md` en CSS base (precedente Stack.gap), `loading`, `disabled`, `href`/`target`/`rel`, `type`, `startIcon`/`endIcon` (`ReactNode` envueltos en `<span aria-hidden="true">` — el accessible name es SIEMPRE el label, DoD #3). `onClick`/ARIA/`data-*` pasan por spread; `className` apilado con `cx`. **Polimorfismo acotado (DoD #2):** `href` presente ⇒ `<a>`, sin `href` ⇒ `<button>` (nunca es link, ni `variant="link"`); sin `as` genérico (decisión cerrada RRU-031). **loading (DoD #1):** spinner `Loader2` de lucide (via `@raulrod/icons`) en `<span aria-hidden>` + `aria-busy` + desactiva interacción — nativo `disabled` en button, `aria-disabled="true"` + guard `preventDefault` en anchor (no existe `disabled` nativo); el label permanece en el DOM (el nombre accesible no desaparece). **Ref tipado `forwardRef<HTMLButtonElement>`** (render principal; `useRef<HTMLButtonElement>` encaja sin fricción de varianza) + único **cast justificado** en el branch `<a>` (`ref as Ref<HTMLAnchorElement>`, `HTMLAnchorElement`/`HTMLButtonElement` no relacionados — typescript.md §6). **Props sobre `HTMLAttributes<HTMLElement>`** (no `ButtonHTMLAttributes`): handlers tipados contra `HTMLButtonElement` serían invariance-incompatibles con `<a>`; `type`/`disabled` redeclarados; `form`/`formAction`/`value` fuera del MVP (revisitar RRU-084). **Tokens (RRU-026 promise):** semánticos nuevos `color.action.disabled.background` (light `gray-100` / dark `gray-800`) y `.text` (`gray-650` / `gray-450`) **exentos de pares AA** (WCAG 1.4.3 exime disabled — documentado en color.md §6); 11 component tokens `button.*` en `component.ts` con targets únicos (2º bloque `satisfies` comprobado: sonda negativa target duplicado → gate FAILED `de-duplicate`; sintaxis `button.primary.background.active` existe como semántico desde RRU-021). outline/ghost/link leen semánticos directamente desde `Button.css` (taxonomy §2; derivar `variant` de tokens forzaría tokens especulativos — §9); `transparent` + anchos 1px/2px como excepciones documentadas (el anillo foco 2px es contrato color.md §6.3). **CSS:** 6 variantes + 3 tamaños + estados (hover/active solo donde hay token; disabled genérico como ULTIMO bloque del archivo para ganar a `:hover` por orden de origen — el check lo verifica por offset), spinner keyframes + `prefers-reduced-motion` con `var(--rr-motion-behavior-reduced)` (theming.md §6). **Re-export iconos (decisión de producto #2 / ADR-007):** `export * from "@raulrod/icons"` en `index.ts` raíz + `@raulrod/icons` como **dependencia** de `@raulrod/ui` (workspace:* — frontera `exports` pública en RRU-091). **Hallazgo:** lucide exporta iconos `Heading`/`Text` que colisionan con nuestros componentes — resuelto por precedencia ESM (export explícito gana a `export *`; los iconos homónimos siguen accesibles vía `@raulrod/icons`) con `eslint-disable import-x/export` justificado en el barrel. **Tests (patrón RRU-030, gitignored `scripts/check-button.mjs`, 7º en la cadena `test`):** SSR observable — defaults, 6 variantes, 3 tamaños, merge/pass-through, polimorfismo (`href`⇒`<a>` incl. negativo `variant=link` sin href ⇒ `<button>`), estados disabled/loading/combos, `aria-hidden` de iconos, iconos resueltos desde la raíz; contrato CSS (selectores por variante/tamaño, anillo foco §6.3, disabled después del último `:hover`, keyframes + reduced motion) + lineage de 39 vars contra `dist/tokens.css`. **Deuda explícita:** `.test.tsx`/`.stories.tsx` diferidos a RRU-068/RRU-080 (decisión de sesión confirmada — 4 archivos + check local; `docs/component-pattern.mdx` y esta tarjeta lo registran) y `check-pattern.mjs` ahora cubre 7 componentes. **Docs local (gitignored):** `docs/button.mdx` (uso + contrato + por qué + verificación). **Verificación:** gate completo ✅ (`pnpm lint` 5/5, `pnpm typecheck` 3/3, `pnpm test --filter=@raulrod/ui` 7/7 AA PASSED incl. `check-button.mjs`, `pnpm test --filter=@raulrod/tokens` AA PASSED con 69 semantics/11 components, `pnpm build` 3/3, `pnpm format:check` ✅ tras `prettier --write`); sondas: <Button kind> → TS2322, target duplicado → gate FAILED (restaurado a 11), fixture `$TMPDIR/opencode/rru-041-fixture.html` (variantes/tamaños/estados + toggle dark + surface + teclado/reduced-motion para revisión manual a11y §39). **Desbloquea RRU-042 (IconButton) y RRU-043 (Input).**

### RRU-042 · IconButton

- **Epic:** EPIC-4 · **Estado:** ✅ Done · **Fecha:** 2026-09-23
- **Prioridad:** P0 · **Estimación:** M · **Dependencias:** RRU-041, RRU-033
- **Labels:** `component` `a11y` `icons`
- **Descripción:** IconButton para acciones compactas. Requiere `aria-label` (accesible name) obligatorio o fallback tipado friendly. **Decisión por defecto (cerrada): el tooltip NO se implementa en el MVP de IconButton** (queda cubierto por RRU-056 si se necesita antes); el accessible name es la vía de etiquetado. Semántica icon-only (§13).
- **Referencias:** §13 (IconButton); Playbook §4.
- **Criterios de aceptación (DoD):**
  - [x] Error de TS si falta accesible name (ayuda en compile time).
  - [x] Icono desde `@raulrod/icons`.
  - [x] DoD global cumplido.
- **Notas de la sesión (2026-09-23):** componente `packages/ui/src/icon-button/*` (`.tsx` + `.types.ts` + `.css` + `index.ts`; Playbook §4 Paso 1, patrón RRU-040). **API (decisiones de sesión confirmadas con el usuario):** `label: string` **requerida** (compile-time, DoD #1 — TS2741 si se omite, verificado con sonda negativa + typecheck limpio tras borrado) → renderiza `aria-label`; el icono va en `children` (desde `@raulrod/icons`) envuelto en `<span aria-hidden="true">` (ADR-007: decorativo, name NUNCA duplicado en el SVG; `aria-label` interno gana sobre el spread del consumer). Variantes/sizes con **paridad completa con Button** (decisión de usuario): `variant {primary,secondary,outline,ghost,destructive,link}` default `primary` en JS + `size {sm,md,lg}` default `md` en CSS base (Stack.gap precedent). **Sin polimorfismo** `as`/`href` (siempre `<button>`; el de Button es su DoD, aquí es icon-only). Props sobre `ButtonHTMLAttributes<HTMLButtonElement>` (render único, `type`/`disabled` nativos). **loading (guía §13):** spinner `Loader2` vía `@raulrod/icons` en `<span aria-hidden>` que **sustituye** al icono, `aria-busy` + `disabled` nativo; el `aria-label` se mantiene (name no desaparece). **Square sizing = altura de Button** (24/34/46px), `calc(font-size + 2·padding + 2·1px)` todo con tokens salvo el `1px` de borde (excepción de mecánica documentada) → alineación en toolbars mixtas. **Tokens:** variantes leen **semánticos directamente** (`color.action.*`, `color.border.*`, `color.text.*`), precedente outline/ghost/link de Button.css; **0 component tokens nuevos** (RRU-026: solo cuando un componente real necesita alias; se re-evalúa si IconButton necesita override propio). Disabled compartido (exento de AA, color.md §6) al final del archivo (gana a los `:hover` por orden de origen). **Tests** (`scripts/check-icon-button.mjs`, gitignored `**/scripts/*.mjs`, 8º en la cadena `test` del paquete): SSR observable sobre `dist/` — default + todos los variants/sizes emiten `rr-*--*`, merge `className` + pass-through; a11y `label`→`aria-label`, icono solo en span `aria-hidden` y sin duplicación, override del consumer no pisa; loading sustituye icono + `aria-busy` + `disabled`; contrato CSS — 6 variants + 3 sizes con squares 24/34/46, focus ring §6.3 (2px), `:disabled` después del último `:hover`, keyframes propios `rr-icon-button-spin` + `prefers-reduced-motion` (`--rr-motion-behavior-reduced`), 33 vars token-lineaged contra `dist/tokens.css`. `check-pattern.mjs` ampliado a 8 componentes (estructura/forwardRef/displayName/className). **Docs:** `docs/typescript.md §9` — el ejemplo de guard runtime de IconButton queda superado: el accesible name se exige en compile-time (`label` requerida), ver nota de la tarjeta. **Verificación:** gate completo ✅ (`pnpm lint` 5/5, `pnpm typecheck` 3/3, `pnpm test --filter=@raulrod/ui` 8/8 AA PASSED incl. `check-icon-button`, `pnpm build` 3/3, `pnpm format:check` ✅ tras `prettier --write`); sonda negativa DoD #1 (omisión de `label` → `TS2741: Property 'label' is missing … but required in type 'IconButtonProps'`); fixture `$TMPDIR/opencode/rru-042-fixture.html` (light/dark, teclado, toolbar mixta 24px icon-only vs texto) para revisión manual a11y §39. `@raulrod/ui` re-exporta `IconButton` + types desde la raíz (frontera pública). Next = RRU-043 (deps RRU-040 ✅ + EPIC-2 ✅).

### RRU-043 · Input

- **Epic:** EPIC-4 · **Estado:** ✅ Done · **Fecha:** 2026-09-23
- **Prioridad:** P0 · **Estimación:** M · **Dependencias:** RRU-040, EPIC-2
- **Labels:** `component`
- **Descripción:** Input base con states (default, focus, invalid, disabled), sizes, `error`. **Decisión por defecto (cerrada): sin `prefix`/`suffix` en el MVP**; si aparece necesidad real se añade de forma backward-compatible en un minor. Sin estilos arbitrarios: tokens.
- **Criterios de aceptación (DoD):**
  - [x] Estado `invalid` con `aria-invalid` y estilo coherente.
  - [x] DoD global cumplido.
- **Notas de la sesión (2026-09-23):** componente `packages/ui/src/input/*` (`.tsx` + `.types.ts` + `.css` + `index.ts`; Playbook §4 Paso 1, patrón RRU-040). **API:** `InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size">` (un único render; `size` nativo — ancho en caracteres — sombreado por el eje uniforme `size` de la tarjeta, decisión documentada en los tipos), `size?: InputSize {sm,md,lg}` default `md` en CSS base (Stack.gap precedent). **Decisión de sesión (usuario):** sin prop `invalid` — el estado invalid se activa por el atributo nativo `aria-invalid` que pasa por spread y estila `.rr-input[aria-invalid="true"]` (una sola vía de activación; FormField RRU-044 lo pasará al componer). Sin `as`/polimorfismo (siempre `<input>`). **Tokens (RRU-026 promise, decisión de sesión confirmada):** semántico nuevo `color.border.danger` (light+dark `red-600`, reusado de primitives existentes — 0 primitives nuevas) + par AA `border.danger over background.default` añadido a `check-contrast.mjs` y a color.md §6.2 (4.83:1 light / 3.55:1 dark ≥3; se descartó `red-700` dark por 2.41:1) y filas a las tablas §4/§5. **Borde de reposo = `color.border.strong`** (NO `border.default`: color.md §6.2 prohíbe el default en límites de controles interactivos). **CSS:** heights 24/34/46 = Button (leading-none + mismos paddings, RRU-042 precedent → campos y botones alineados en toolbar), `width:100%` por defecto (caso FormField, se acota con wrapper en toolbars), `::placeholder` muted, focus ring §6.3, disabled con tokens `action.disabled.*` (exentos AA) **al final del archivo** (gana al borde invalid por orden de origen). **Tests (patrón RRU-030, gitignored `scripts/check-input.mjs`, 9º en la cadena `test`):** SSR observable sobre `dist/` — default + 3 sizes, merge/pass-through (`id`/`type`/`name`/`placeholder`/`disabled`/`value`/`readOnly`), `aria-invalid` pass-through; contrato CSS (borde strong con negativo de border.default, 3 size selectors, placeholder muted, `[aria-invalid="true"]`→danger, disabled después del invalid, **23 vars token-lineaged** contra `dist/tokens.css`). `check-pattern.mjs` ampliado a **9 componentes** (estructura/forwardRef/displayName/className). **Deuda explícita:** `.test.tsx`/`.stories.tsx` diferidos a RRU-068/RRU-080 (misma decisión de sesión que Button/IconButton). **Docs local (gitignored):** `docs/input.mdx` (uso + contrato + por qué + trade-offs). **Verificación (gate §0 paso 4):** `pnpm lint` 5/5 ✅, `pnpm typecheck` 3/3 ✅, `pnpm test --filter=@raulrod/tokens` AA PASSED 43/70/11/21 ✅, `pnpm test --filter=@raulrod/ui` 9/9 AA PASSED ✅, `pnpm build` 3/3 ✅, `pnpm format:check` ✅ (prettier sobre los archivos nuevos). **Sondas consumidor en `$TMPDIR/opencode/rru-043-probe`:** `good.tsx` compila (import público, ref, size axis, aria-invalid, className, password/disabled); `neg.tsx` con 4 `@ts-expect-error` consumidos (exit 0) → códigos reales `size={20}` TS2322, `kind` TS2353, `size="space-7"` TS2322, `as` TS2353; `runtime.mjs` SSR real sobre `dist/` (default/size/disabled/invalid emiten `rr-*`). **Revisión manual a11y (obligatoria §0 paso 4):** fixture `$TMPDIR/opencode/rru-043-fixture.html` (sizes vs Button, default/invalid/disabled/invalid+focus, toggle `data-theme` light/dark, focus ring `--rr-color-focus-ring`, teclado Tab) — pendiente de revisión del usuario. **DoD global evaluado:** API ✓ (ejes uniformes, coherente con Button), TS ✓ (cero `any`; un `Omit` documentado, tipos públicos exportados), a11y ✓ (borde validado ≥3:1 por gate, focus ring, placeholder muted, disabled WCAG 1.4.3), estados ✓ (default/focus/invalid/disabled), tests ✓ (check local 9º), stories/docs diferidos ✓ (RRU-068/RRU-080 + `docs/input.mdx` local), export root ✓, tokens ✓ (23 vars lineaged + 1 par AA nuevo). **Commit propuesto:** `feat(ui): add Input component (RRU-043)`. **Desbloquea RRU-044 (FormField) y RRU-045 (Textarea).**

### RRU-044 · FormField

- **Epic:** EPIC-4 · **Estado:** ✅ Done · **Fecha:** 2026-09-23
- **Prioridad:** P0 · **Estimación:** M · **Dependencias:** RRU-043, RRU-033
- **Labels:** `component` `a11y`
- **Descripción:** Asocia Label–Description–Control–Error generando ids/ARIA automáticamente (`htmlFor`, `aria-describedby`, `aria-errormessage`). API composable (§13).
- **Criterios de aceptación (DoD):**
  - [x] Los 4 elementos asociados correctamente.
  - [x] Errores anunciados (no solo visuales).
  - [x] DoD global cumplido.
- **Notas de la sesión (2026-09-23):** componente `packages/ui/src/form-field/*` (`.tsx` + `.types.ts` + `.css` + `index.ts`; patrón RRU-040). **API (decisiones confirmadas con el usuario):** compound components `/FormField.Label/Description/Control/Error` + hook `useFormField()` con un único contexto; la raíz **no** acepta children-fn (React los mete en un array al convivir con otros slots — "functions are not valid as a React child"); el render-prop vive solo en `FormField.Control` con payload `{id, aria-describedby, aria-errormessage, aria-invalid}` (spread directo sobre `Input`). **Presencia de slots por recorrido del árbol en render-phase** (SSR-safe, sin effects): sin Description/Error no hay idrefs colgantes (axe-safe). **Ids:** `useId("rr-field")` → `rr-field-_R_0_` (SSR determinístico; `sanitizeId` solo quita `:`), sufijos `-description`/`-error`; `controlId` override con label `for` seguido. **Tokens (RRU-026 promise):** semántico nuevo `color.text.danger` + primitive **`red-400`** (light `red-600` 4.83/4.54:1, dark `red-400` 6.19/5.64:1 sobre default/surface; `red-500` falla surface 4.15:1 y `red-600` dark 3.55:1 — nota en color.md §3.3), 4 pares AA nuevos en `check-contrast.mjs`, modifier `color-danger` forzado por el `Record` exhaustivo de `ColorText` (fail-loud RRU-025) en `typography.ts` + `Text.css` + `Heading.css`. **Tests:** `scripts/check-form-field.mjs` (10º en la cadena `test`, gitignored `**/scripts/*.mjs`) anclado al SSR real de `dist/` — canon (htmlFor/describedby/errormessage/alert), slot-presence absent = solo `id`, inlined (1 solo slot en el array + `key`), controlId override + className merge, contrato CSS (5 selectores, 9 vars token-lineaged) y re-export público; `check-pattern.mjs` ampliado (components[10], refComponents, displayNames, assert className merge, typesFiles). **Sondas de tipos del consumidor** (dir temporal): positiva (`useFormField`, props ↔ tipos) + negativos `@ts-expect-error` (`kind` en raíz, `dimension` en Control, children-fn en raíz) verificado contra errores TS reales. **Gate completo ✅** (`pnpm lint` 5/5, `pnpm typecheck` 3/3, `pnpm test --filter=@raulrod/tokens` AA PASSED 44|71|11|23 pairs, `pnpm test --filter=@raulrod/ui` 10/10 AA PASSED, `pnpm build` 3/3, `pnpm format:check` ✅). Fixes: import-x/order en FormField (eslint --fix), `key` en el array condicional del check y aserción de label en caso `controlId` (el label faltaba en el fixture del test, no en el componente). Fixture a11y manual: `$TMPDIR/opencode/rru-044-fixture.html` (teclado/focus ring, anuncio `role=alert` al alternar error, tema light/dark). Sin `.test.tsx`/`.stories.tsx`: deuda RRU-068/RRU-080. Doc: `docs/form-field.mdx`. Commit propuesto: `feat(ui): add FormField component (RRU-044)`.

### RRU-045 · Textarea

- **Epic:** EPIC-4 · **Estado:** ✅ Done · **Fecha:** 2026-09-23
- **Prioridad:** P1 · **Estimación:** S/M · **Dependencias:** RRU-043
- **Labels:** `component`
- **Descripción:** Multilínea reutilizando patrones de Input + FormField. `autoResize` solo si existe necesidad real.
- **Criterios de aceptación (DoD):**
  - [x] Estados de error/disabled coherentes con Input.
  - [x] DoD global cumplido.
- **Notas de la sesión (2026-09-23):** componente `packages/ui/src/textarea/*` (`.tsx` + `.types.ts` + `.css` + `index.ts`; Playbook §4 Paso 1, patrón RRU-040). **Dependencia de sesión:** `check-textarea.mjs` y la entrada de `Textarea` en `check-pattern.mjs` ya existían en local (gitignored `**/scripts/*.mjs`) de una sesión previa no cerrada (el `dist/` stale exportaba Textarea mientras `src/` estaba vacío y la cadena `test` iba a fallar); se tomó esa espec como contrato y se implementó para satisfacerla (confirmado con el usuario). **API:** `TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "size">` (una vía de render; `size` no existe en el DOM del textarea pero se mantiene el `Omit` + eje uniforme `size` como Input para consistencia §15), `size?: TextareaSize {sm,md,lg}` default `md` en CSS base (Stack.gap precedent), `autoResize?: boolean`. **Decisión de sesión (usuario):** `autoResize` SÍ se implementa (necesidad real en multilínea) con técnica CSS-grid: wrapper `div.rr-textarea-autosize` + espejo `<span aria-hidden="true">` que replica superficie (onChange chaining con `useState`, semilla `value ?? defaultValue ?? ""`, ZWSP `\u200b` si vacío) compartiendo `grid-area: 1/1` con el `<textarea>` — la altura sigue al contenido sin layout thrash; `id`/ARIA/`className` quedan en el node interactivo, el mirror solo es presentacional y lleva solo el modifier `rr-textarea--size-*` (paridad de padding/font por cascade: mirror antes de los size modifiers). Sin prop `invalid` — estado por atributo nativo `aria-invalid` (decisión RRU-043, `[aria-invalid="true"]` → `border-danger`). Sin `as`/polimorfismo (siempre `<textarea>`). **Tokens (RRU-026 promise):** 0 tokens nuevos — reusa `color.border.danger`, `color.text.muted`, `action.disabled.*`, `space-16` (min-height 64px), `font.leading.normal` (multilínea, NO `leading-none` de Button/Input que recortaría descendentes); `resize: vertical` (WCAG 1.4.4/1.4.10) desactivado solo en autosize (specificity mayor). **CSS:** borde de reposo `border.strong` (§6.2), size modifiers con paddings/letras de Input, focus ring §6.3, disabled al final (gana al invalid por orden de origen). **Tests:** `check-textarea.mjs` añadido como 11º en la cadena (`package.json`), anclado al SSR real de `dist/` — contrato base + 3 sizes + merge/pass-through (`id`/`name`/`rows`/`cols`/`placeholder`/`disabled`/`maxLength`/`value`/`defaultValue`), `aria-invalid` passthrough, autoResize (wrapper/mirror/semilla controlled+uncontrolled/modifier ZWSP/un único textarea), wiring FormField (label htmlFor == control id, describedby/errormessage/invalid), contrato CSS (min-height, leading.normal, resize vertical, negative de border.default, selectors sizes, placeholder, focus, invalid, disabled>invalid, grid autosize + mirror antes de sizes) y 24 vars token-lineaged. Límite documentado: el re-sync dinámico del mirror es state + handler chaining (typecheck + review manual; cobertura runtime completa llega con Vitest en RRU-068). **Verificación:** `pnpm lint` ✅, `pnpm typecheck` ✅, `pnpm test --filter=@raulrod/ui` ✅ (11 checks, Textarea AA PASSED), `pnpm build` ✅, `pnpm format:check` ✅ (prettier --write sobre los 4 archivos new), sonda consumidor temporaria OK (tipos positivos + negativos `@ts-expect-error` para `kind`/`size` inválidos + composición FormField tipada). Desbloquea RRU-046 (dep independiente: RRU-040/EPIC-2, ya ✅).

### RRU-046 · Checkbox

- **Epic:** EPIC-4 · **Estado:** ✅ Done · **Fecha:** 2026-09-23
- **Prioridad:** P0 · **Estimación:** M · **Dependencias:** RRU-040, EPIC-2
- **Labels:** `component` `a11y`
- **Descripción:** Checkbox accesible con estado `indeterminate`, check propio o icono lucide, focus visible, soporte de FormField.
- **Criterios de aceptación (DoD):**
  - [x] `indeterminate` implements semántica correcta (`aria-checked="mixed"`).
  - [x] DoD global cumplido.
- **Notas de la sesión (2026-09-23):** componente `packages/ui/src/checkbox/*` (`.tsx` + `.types.ts` + `.css` + `index.ts`; Playbook §4 Paso 1, patrón RRU-040). **Decisión de sesión (usuario):** (1) **check/dash propio vía CSS, no lucide** — `<input type="checkbox">` desnudo (precedente Input/Textarea) con `appearance:none` y glyphs SVG inline en `background-image`; el stroke `#ffffff` es la única excepción de token del archivo, gobernada por la decisión de producto #3 (`color.action.primary.text` = blanco fijo en ambos temas; un SVG en background-image no lee `currentColor`/`var()`), documentada en el CSS y en `docs/checkbox.mdx` (precedente de excepciones: `transparent`, 1px, `align`/`justify`). (2) **eje `size {sm,md,lg}`** (uniformidad §15 con los 5 controles previos) con tokens `space-3/4/5` → 12/16/20px, default `md` en CSS base. **API:** `CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size">` + `indeterminate?: boolean` + `size?`; `type` forzado a `checkbox`; render único sin polimorfismo. **indeterminate (DoD #1):** `aria-checked="mixed"` forzado tras el spread (gana a un `aria-checked` del consumidor) + propiedad nativa `node.indeterminate` vía callback ref fusionada (no existe atributo; la propiedad es client-only ⇒ SSR-parity, sin riesgo de hidratación); el estado visual usa las pseudo-clases nativas `:checked`/`:indeterminate` (sin clases de estado en el markup), con `:checked:not(:indeterminate)` para que el check no se pinte sobre el dash. **FormField (DoD #2):** al ser el input el render, el spread de `field.{id,aria-describedby,aria-errormessage,aria-invalid}` aterriza en el control real → `FormField.Control` compone directo; `[aria-invalid="true"]` → `border-danger` (precedente Input). **Tokens (RRU-026):** 0 tokens nuevos — semánticos directos (`border.strong` reposo, NO `border.default` per color.md §6.2; `action.primary.background(.hover)` fill; `action.disabled.*` exentos AA; `border.danger` invalid; `focus.ring` §6.3); radius `sm`. **Tests** (`scripts/check-checkbox.mjs`, gitignored `**/scripts/*.mjs`, 12º en la cadena `test`): SSR observable sobre `dist/` — default + 3 sizes, className merge, pass-through nativo (`checked`/`defaultChecked`/`disabled`/`value`), DoD #1 (`indeterminate` → `aria-checked="mixed"`; ausente si `false`/omitido; passthrough de `aria-checked` del consumidor; mixed gana si indeterminate), contrato CSS (`appearance:none`, border.strong y negativo de border.default, fills checked/indeterminate con tokens primarios, glyphs data-URI, focus ring, `aria-invalid` danger, disabled al final con `background-image:none` y orden de origen > estados), token-lineage (14 vars contra `dist/tokens.css`); `check-pattern.mjs` ampliado (components[12], ref, displayName, className merge forzando `type="checkbox"`, typesFiles). **Verificación:** gate completo ✅ (`pnpm lint`, `pnpm typecheck`, `pnpm test --filter=@raulrod/ui` 12/12 AA PASSED, `pnpm test --filter=@raulrod/tokens` AA PASSED 44/71/11/23 inalterado, `pnpm build` → dist exporta Checkbox, `pnpm format:check` tras `prettier --write`). Hallazgo de test: React no serializa `defaultChecked` en SSR (lo aplica al DOM) y advierte por `console.error` por un `checked` sin `onChange` → asserts adaptados (match en vez de strictEqual por orden de atributos de React) + suppressor local del warning dev en el check. Revisión manual a11y §39 pendiente de confirmar por el usuario sobre el diff en `development`. Desbloquea RRU-047/RRU-048 (deps ✅).

### RRU-047 · Radio / RadioGroup

- **Epic:** EPIC-4 · **Estado:** ✅ Done · **Fecha:** 2026-09-23
- **Prioridad:** P1 · **Estimación:** M · **Dependencias:** RRU-046
- **Labels:** `component` `a11y`
- **Descripción:** RadioGroup manejando `value`/`onValueChange`, teclado (flechas), `aria-checked` y labels asociados.
- **Criterios de aceptación (DoD):**
  - [x] Navegación con flechas correcta y roving focus.
  - [x] DoD global cumplido.
- **Notas de la sesión (2026-09-23):** componentes `packages/ui/src/radio/*` (`Radio.tsx` + `RadioGroup.tsx` + sus `.types.ts` + `Radio.css` + `index.ts`; Playbook §4 Paso 1, patrón RRU-040). **Decisiones de sesión (usuario):** (1) **label dentro del `Radio`** — `<Radio value="a">Option A</Radio>` renderiza `<label class="rr-radio"><input type="radio"/><span indicator aria-hidden/><span label>{children}</span></label>`: toda la fila clicable + asociación implícita (DoD "labels asociados"); **desviación justificada** del precedente "input desnudo" de Checkbox (una opción de radio sin su label no es accesible; el modelo de grupo ≠ control único). (2) **`<div role="radiogroup">`** (patrón WAI-ARIA radio group), no fieldset/legend — recibe el spread de FormField (`id`/`aria-describedby`/`aria-errormessage`/`aria-invalid`) y `aria-labelledby` para el nombre del grupo. (3) **`orientation {vertical,horizontal}`** incluida en el MVP (coste bajo, horizontal listo para grupos inline). **Nativo-first (precedente Input/Textarea/Checkbox):** el radio del grupo es `<input type="radio">` desnudo; `role="radio"` + `aria-checked` son implícitos del input y **la navegación con flechas + roving focus del DoD #1 es NATIVA del browser** (grupo por `name`): el `RadioGroup` genera un `name` por `useId` (`rr-radio-group-<id>`, `sanitizeId`) compartido por todas las opciones → taborder (solo la seleccionada), ↑↓/←→ con foco+selección y reenvío a `onValueChange` sin un solo handler de teclado ni `tabindex` ficticio. **API:** `RadioGroupProps extends HTMLAttributes<HTMLDivElement>` + `value?/defaultValue?` + `onValueChange?: (value: string) => void` + `name?` (override del auto) + `disabled?` + `size?` (distribuido por contexto) + `orientation?` (default `vertical` en JS, precedente variant axes). `RadioProps extends Omit<LabelHTMLAttributes<HTMLLabelElement>, "htmlFor" | "disabled">` + **`value: string` requerida** (identidad de la opción, garantizada en compile-time) + `disabled?` + `size?`; **`name`/`checked`/`defaultChecked`/`onChange` `Omit`eados** (pertenecen al grupo; props sueltas desincronizarían el contrato). Controlled (`value` presenta → cada opción emite `checked`) + uncontrolled (`defaultValue` → `defaultChecked`, SSR-safe, React serializa el checked en SSR). `forwardRef<HTMLInputElement>` en Radio (el input, útil para foco/query) con `className`/pass-through en el `<label>` (convención outer); `forwardRef<HTMLDivElement>` en RadioGroup + displayNames. **Tokens (RRU-026):** 0 tokens nuevos — semánticos directos (`border.strong` reposo, NO `border.default` per color.md §6.2; `action.primary.background(.hover)` fill; el punto interior como `radial-gradient` que lee el token `--rr-color-action-primary-text` — **un gradiente CSS SÍ lee `var()`, a diferencia del data-URI de Checkbox → sin excepción de token en este archivo**; `action.disabled.*` exentos AA; `border.danger` invalid; `focus.ring` §6.3; `text.muted` label disabled; `radius-full`; `space-3/4/5` sizes 12/16/20px; `font-size/leading/family` en el label). **Tests** (`scripts/check-radio.mjs`, gitignored `**/scripts/*.mjs`, 13º en la cadena `test`): SSR observable sobre `dist/` — `role="radiogroup"` + clase vertical default, **name compartido** ×2 opciones (el contrato que habilita el DoD #1 nativo) + name custom del consumidor, checked en la opción seleccionada (controlled + uncontrolled), `disabled`/`size` de grupo distribuidos con override local, orientación, className merge de ambos, contrato CSS (`appearance:none`, border.strong y negativo de border.default, sizes scoped, checked fill + gradiente token-linead, checked:hover `.background-hover`, focus ring, group `aria-invalid` danger descendente, label muted del disabled, disabled al final con `background-image:none` y orden de origen > estados), token-lineage (21 vars contra `dist/tokens.css`); `check-pattern.mjs` ampliado (components[14] con Radio+RadioGroup, refs, displayNames, className merge de ambos, typesFiles ×2). **Verificación:** gate completo ✅ (`pnpm lint` 5/5, `pnpm typecheck` 3/3, `pnpm test --filter=@raulrod/ui` 13/13 AA PASSED, `pnpm test --filter=@raulrod/tokens` AA PASSED 44/71/11/23 inalterado, `pnpm build`, `pnpm format:check` tras `prettier --write`); sonda de tipos de consumidor (positiva + negativos `@ts-expect-error`: `value` requerida, `name` omitido en Radio, `orientation` unión cerrada — todos satisfechos). **Hallazgos de test:** (1) `matchAll`/regex en template literal con `\s`/`\.` se manglan (escape desconocido → pierde backslash) → negativos dinámicos con `new RegExp("\\\\s")`; (2) renderizar radios YA renderizados (strings) como children de un grupo los escapa como texto en SSR → helpers devuelven Elementos React, el `renderToStaticMarkup` se aplica al grupo completo; (3) orden de atributos de React en SSR (`checked` antes de `value`) → asserts por extracción de tag, no por cadena con orden fijo. **Deuda explícita:** el keyboard real (roving focus/ flechas) se cubre en la **revisión manual a11y §39** del cierre sobre el diff en `development` (las flechas son nativas; el check estático protege el contrato `name` compartido que las activa). Desbloquea RRU-048 (Switch, deps ✅).

### RRU-048 · Switch

- **Epic:** EPIC-4 · **Estado:** ✅ Done · **Fecha:** 2026-09-23
- **Prioridad:** P1 · **Estimación:** M · **Dependencias:** RRU-046
- **Labels:** `component` `a11y`
- **Descripción:** Switch con rol `switch`, `aria-checked`, label visible o `VisuallyHidden`, keyboard (Space).
- **Criterios de aceptación (DoD):**
  - [x] Rol y estados correctos para screen readers.
  - [x] DoD global cumplido.
- **Notas de la sesión (2026-09-23):** componente `packages/ui/src/switch/*` (`Switch.tsx` + `.types.ts` + `.css` + `index.ts`; Playbook §4 Paso 1, patrón RRU-040). **Decisiones de sesión (usuario):** (1) **render = `<input type="checkbox" role="switch">` nativo** (patrón WAI-ARIA switch + native-first Checkbox/Radio): Space/`:checked`/`:disabled`/`aria-checked` desde checked son NATIVOS — sin JS de teclado ni ARIA sintética; el track ES el input (`appearance:none`) y el knob su `::after` (decorativo por construcción, sin nodo a11y extra). (2) **label dentro del componente (precedente Radio, NO Checkbox)** — `<Switch>Label</Switch>` → `<label>` wrapping input + `<span class="rr-switch-label">{children}</span>`: asociación implícita, fila clicable, cumple literal la tarjeta «label visible o VisuallyHidden» (children envuelto en `<VisuallyHidden>` para el caso invisible). **FormField rerouting (desviación justificada vs Radio):** `id`/`aria-describedby`/`aria-errormessage`/`aria-invalid` se **reenvían AL INPUT** (el control labelable real) → el `htmlFor` de `FormField.Label` resuelve y descripción/error anuncia sobre el switch; el resto (className apilado, title, `data-*`, ARIA de fila) va al `<label>` raíz. Radio deja el field en el `div` del grupo (no hay control único); Switch sí lo tiene. **API:** `SwitchProps extends Omit<LabelHTMLAttributes<HTMLLabelElement>, "htmlFor" | "onChange">` + nativos del input (`checked`/`defaultChecked`/`onChange`/`name`/`value`/`disabled`/`required`) + `id`/`aria-*` + `size {sm,md,lg}` default `md` en CSS base (Stack.gap precedent). `forwardRef<HTMLInputElement>` (el input, precedente Radio) + `displayName`. **Geometría token-derivada:** track sm/md/lg 32/40/48px × 16/20/24px (`space-8/10/12` × `space-4/5/6`), knob = `calc(height - 4px)`, travel = `calc(width - height)` — todo `calc()` sobre space tokens; el `2px`/`4px` de marco = única excepción de mecánica del archivo (precedente `1px`). **Token-governed (0 tokens nuevos, RRU-026):** track reposo = fill `border.strong` (NO `border.default`, color.md §6.2 — knob `background.default` mantiene ≥3:1 en ambos temas), on = `action.primary.background(.hover)`, **knob ON = `action.primary.text` TOKEN** (producto #3 — sin excepción `#ffffff` hardcodeada; precedente gradiente de Radio), disabled `action.disabled.*` (exentos AA) **al final del archivo** (source order > estados/invalid), `[aria-invalid]` → `border-danger`, `focus.ring` §6.3, `text.muted` label disabled vía flag `rr-switch--disabled` (Boolean, pattern §4.1). **Reduced motion:** primer componente que cablea el contrato RRU-024 explícitamente (`@media (prefers-reduced-motion: reduce)` → `transition: none`). **Tests** (`scripts/check-switch.mjs`, gitignored `**/scripts/*.mjs`, 14º en la cadena `test`): SSR observable sobre `dist/` — estructura exacta del `<label>`/input (`role="switch"`, type forzado, label text), controlled `checked` + uncontrolled `defaultChecked` (React serializa checked), sizes sm/md/lg, `disabled` (input + flag de fila), className merge + pass-through en la raíz, **FormField rerouting** (id/`aria-*` en el input y NO en el label; sin `aria-invalid` por defecto), contrato CSS (`appearance:none`, track `border.strong` y negativo de `border.default`, knob `background.default`/`action.primary.text` token-linead, travel `calc()`, focus ring, size selectors, `aria-invalid` danger, disabled al final y orden de origen > `:hover`/`:checked`, reduced-motion) + token-lineage (24 vars contra `dist/tokens.css`) + root re-export; `check-pattern.mjs` ampliado (components[15], ref, displayName, className merge, typesFiles). **Verificación:** gate completo ✅ (`pnpm lint` 5/5, `pnpm typecheck` 3/3, `pnpm test --filter=@raulrod/ui` 15/15 AA PASSED (14º check-switch + pattern 15), `pnpm test --filter=@raulrod/tokens` AA PASSED 44/71/11/23 inalterado, `pnpm build`, `pnpm format:check` tras `prettier --write`). **Hallazgos de test:** (1) React avisa (`console.error`) por un `checked` controlado sin `onChange` → los asserts controlados pasan `onChange: () => {}` (no serializado en SSR); (2) aserción errónea propia en el primer run del check (`rr-switch--disabled` sobre input, selector que NO correspondía — el flag no estiliza el input) → corregida al contrato real (flag solo en fila/label; knob/track disabled por `:disabled`). **Deuda explícita:** la verificación real de SR («switch, activado/desactivado») y el keyboard en la **revisión manual a11y §39** del cierre sobre el diff en `development`. Desbloquea RRU-049/RRU-050 (deps EPIC-2, ya ✅).

### RRU-049 · Badge

- **Epic:** EPIC-4 · **Estado:** ✅ Done · **Fecha:** 2026-09-23
- **Prioridad:** P1 · **Estimación:** S · **Dependencias:** EPIC-2
- **Labels:** `component`
- **Descripción:** Badge con variantes semánticas (neutral/success/warning/danger/info), sin contraste roto. Puede entrar también en data display.
- **Criterios de aceptación (DoD):**
  - [x] Contraste AA en todas las variantes (texto sobre fondo).
  - [x] DoD global cumplido.
- **Notas de la sesión (2026-09-23):** componente `packages/ui/src/badge/*` (`Badge.tsx` + `.types.ts` + `.css` + `index.ts`; Playbook §4 Paso 1, patrón RRU-040) + re-export raíz en `index.ts`. **Decisiones de sesión (usuario):** (1) **variante roja = `destructive`, no `danger`** — coherente con Button (RRU-041) y con el naming de los tint tokens a los que apunta (`color.text.destructive`/`color.background.destructive`); `danger` queda solo como texto de error brillante (RRU-044), no como familia de tinte. (2) **neutral sin tokens dedicados (token-taxonomy §1, RRU-026):** reusa `background.sunken` + `text.muted` — par nuevo AA añadido al gate (4.81:1 light / 5.11:1 dark). (3) **solo eje `variant`, sin `size`:** scope literal de la tarjeta (§9, sin features especulativas); si un `size` real aparece (p. ej. Table, RRU-065) se añade minor backward-compatible. **API:** `BadgeProps extends HTMLAttributes<HTMLSpanElement>` + `variant?: BadgeVariant {neutral,success,warning,destructive,info}`, default `neutral` en JS (precedente variant de Button); `forwardRef<HTMLSpanElement>` + `displayName`. **Render / a11y:** `<span>` estático NO interactivo (sin tabstop/focus/hover/disabled/border/transition — el contenido ES la etiqueta, sin ARIA); color nunca canal único: el texto del badge da el significado y el variant solo el énfasis (DoD a11y, dark flipea el tint value no el intent). **Tokens (EPIC-2):** 8 nuevos `color.text.*`/`color.background.*` tint (light: green/amber/sky/red 900 + 100; dark: 300/400 + 950) + steps primitives formalizados `red/green/amber/sky` 100/300/900/950 (`amber` = única rampa nueva de EPIC-2, mapas §4/§5 y gate PAIRS de color.md §6.1 actualizados). **Cascada ColorText (RRU-025):** `utils/typography.ts` ampliado a 7 colores → Text/Heading ganan `color-success/warning/info/destructive` en la unión (modifiers + CSS + `check-text.mjs`); +5 pares en `check-contrast.mjs` (gate 🔒, ratios reproducen color.md). **Verificación:** gate completo ✅ (`lint` 5/5, `typecheck`, `test --filter=@raulrod/tokens` AA PASSED — 58 primitives | 79 semantics | 11 component tokens, `test --filter=@raulrod/ui` — 16ª línea `check-pattern` + `check-badge.mjs` (15º de la cadena, SSR default+5 variantes + contrato CSS 18 vars token-lineaged), `build`, `format:check`). **Docs:** `docs/badge.mdx` (contrato observable) + `docs/color.md` §3.3/§4/§5/§6.1 sync. Siguiente por §0 paso 1: **RRU-050 · Avatar**. **Commit propuesto (revisar diff, NO commitear):** `feat(ui): add Badge component with semantic tint variants (RRU-049)`.

### RRU-050 · Avatar

- **Epic:** EPIC-4 · **Estado:** ✅ Done · **Fecha:** 2026-09-23
- **Prioridad:** P2 · **Estimación:** S/M · **Dependencias:** EPIC-2
- **Labels:** `component` `a11y`
- **Descripción:** Avatar con imagen, `name` → iniciales derivadas del nombre, fallback, sizes, `alt`/`aria-label` correcto.
- **Criterios de aceptación (DoD):**
  - [x] Fallback de iniciales y estado de error de imagen.
  - [x] Accesible name sin texto duplicado.
  - [x] DoD global cumplido.
- **Notas de la sesión (2026-09-23):** componente `packages/ui/src/avatar/*` (`.tsx` + `.types.ts` + `.css` + `index.ts`; Playbook §4 Paso 1, patrón RRU-040) + helper interno `src/utils/initials.ts` + re-export raíz en `index.ts`. **API (decisiones confirmadas con el usuario):** `name: string` **requerida** (precedente IconButton `label`, TS2741 si falta → DoD #1 en compile time para las iniciales), `src?`, `alt?` (default `name`), `size? {sm,md,lg}` default `md` en CSS base (Stack.gap/Button.size precedent). **Accesible name de fuente única (DoD #2, `alt ?? name`):** con imagen → el `<img alt>` aporta el name (raíz sin `role`/`aria-label`); sin imagen o tras error → raíz con `role="img"` + `aria-label`; las iniciales son SIEMPRE `aria-hidden="true"` (texto decorativo) → el name se anuncia **una vez** en ambos estados; `role`/`aria-label` del consumidor se sobrescriben por el contrato (impide duplicar). **Error de imagen (DoD #1):** `failedSrc` keyed por el valor de `src` (`failedSrc !== src` reintenta con URL nueva) — cero `useEffect`/`set-state-in-effect` (hallazgo RRU-034); flip client-only SSR-safe: el fallback de iniciales permanece en el DOM y la imagen lo cubre (patrón Radix, sin layout shift). **Iniciales:** single word → 1ª letra; ≥2 palabras → 1ª+última; uppercase; vacío → `?` (decisión de sesión). **Sizes 32/40/48px (`space-8/10/12`, escala Switch RRU-048 — no 24/34/46, decisión de sesión)**; font por talla (`sm→xs/md→sm/lg→base`). **Tokens (RRU-026): 0 nuevos** — reusa `background.sunken` + `text.muted` (par AA ya en el gate, §6.1) + `radius-full` + `font.*`. **No interactivo** (precedente Badge): sin tabstop/focus/hover/disabled; el consumidor envuelve si es clicable. **Tests (patrón RRU-030, gitignored `scripts/check-avatar.mjs`, 16º en la cadena `test`):** SSR observable sobre `dist/` — fallback (`role="img"`+`aria-label`, alt override, interno gana al aria-label del consumidor), imagen (img con alt + fallback decorativo + sin rol en raíz), sizes (3) + default sin modifier, class-merge/pass-through; `getInitials` unit (6 casos) desde `dist/utils/initials.js`; contrato CSS (disco radius-full + squares space, sunken/muted, `object-fit: cover`, 0 interacción, 12 vars token-lineaged, negativos hex/display:none); helper NO exportado del root (frontera). `check-pattern.mjs` ampliado (components[17], refComponents, displayNames, SSR class-merge, typesFiles). **Verificación:** gate completo ✅ (`pnpm lint` 5/5, `pnpm typecheck` 3/3, `pnpm test` 5/5 con tokens AA 58/79/11/28 PASSED y ui 16/16 AA PASSED, `pnpm build`, `pnpm format:check`); sonda de tipos consumidor en `$TMPDIR` (positiva + `@ts-expect-error`: `name` omitido TS2741, `size="xl"` TS2322; `getInitials` NO en el root) + sonda runtime. **Deuda:** el flip de error de imagen (client-only) se valida con fixture `$TMPDIR/opencode/rru-050-fixture.html` y quedará cubierto por Vitest en RRU-068, junto a `.test.tsx`/`.stories.tsx` (RRU-068/RRU-080). EPIC 4 completo → desbloquea EPIC 5, next = RRU-051.

---

# EPIC 5 — Componentes de interacción compleja (Fase 5)

> Priorizar componentes que demuestren ingeniería real (§14). Se deben resolver: keyboard nav, Escape, focus trap, focus restoration, portal, layering, outside interaction, ARIA, controlled/uncontrolled. **No está terminado porque "se vea bien".**

### RRU-051 · ADR-004 — Composición de componentes

- **Epic:** EPIC-5 · **Estado:** ✅ Done · **Fecha:** 2026-09-23
- **Prioridad:** P0 · **Estimación:** S · **Dependencias:** —
- **Labels:** `docs` `component`
- **Descripción:** ADR que fija la convención de APIs composables (`<Dialog><Dialog.Content>…`) vs props, y cuándo usar API simple (§15). Base para todos los overlays.
- **Criterios de aceptación (DoD):**
  - [x] `docs/decisions/004-component-composition.md` publicado.
- **Notas de la sesión (2026-09-23):** entregable `docs/decisions/004-component-composition.md` (igual política de no-trackeo que 001/002/003/007; /docs gitignored, sin diff de commit). Template §22 coherente con los ADRs previos (metadata + Context/Decision/Alternatives considered/Consequences). Documenta la decisión **materializada en código real** (no especulativo): composición por **convención de dos vías** — composición (compound) cuando hay estructura multinodo con relaciones ARIA/estado compartido o prop-explosion (overlays, formularios), API simple mientras sea suficientemente expresiva (Button/Badge/Avatar, anti-dogma §15); mecánica obligatoria: raíz como namespace de slots (`Dialog.Trigger/.Content/…`), un solo contexto internal por componente, wiring por presencia de slots en render-phase (SSR-safe, precedente FormField `collectSlots`), render-prop solo para DOM wiring, **sin `asChild`/polimorfismo** (decisión cerrada RRU-031), controlled/uncontrolled en la raíz, slots con `forwardRef`+`displayName`. Evidencia: FormField (RRU-044), RadioGroup/Radio (RRU-047), skip-link VisuallyHidden focusable (RRU-033), `component-pattern.mdx §6`. Alternativas con motivo: props solas (insuficiente para ARIA/layering), `asChild`-style Radix Slot (complejidad de render-sustitución ya excluida en RRU-031), headless público (sobre-ingeniería §33; los hooks son internal de RRU-052), modal-manager global (rompe SSR/composición; layering se resuelve local). Consecuencias incluyen la limitación de slot-detection a slots hijos (wrapper custom opt-out documentado) y el gate de fronteras de contexto en RRU-103. **DoD (1) cumplido.** Coherencia cruzada verificada con `rg`: guía §22 (l.921 lo lista como `004-component-composition.md`), `component-pattern.mdx §6` ("formalizado en ADR-004/RRU-051"), RRU-053 (referencia ADR-004) y `FormField.tsx` l.33-34 (comentario "ADR-004 pendiente") → todos resueltos por este ADR sin contradicción. Checklist §39 aplicada al scope del ADR (Arquitectura/API/A11y functionality/Testing/Performance/DX/Mantenimiento, ver reporte de sesión). Gate completo ✅ (`pnpm lint` 5/5, `pnpm typecheck` 3/3, `pnpm test` 5/5 con tokens AA 58/79/11/28 PASSED y ui 16/16 AA PASSED, `pnpm build` 3/3, `pnpm format:check` ✅). Hallazgo menor: el comentario de `FormField.tsx` dice "ADR-004 pendiente" (quedó histórico); no se tocó (diff 0, tarea docs-only). Desbloquea RRU-052 (deps RRU-034 ✅) y RRU-053 (junto a RRU-052).

### RRU-052 · Overlays: cimientos compartidos

- **Epic:** EPIC-5 · **Estado:** ✅ Done · **Fecha:** 2026-09-23
- **Prioridad:** P0 · **Estimación:** M · **Dependencias:** RRU-034
- **Labels:** `component` `a11y`
- **Descripción:** Infra privada reutilizable: `useFocusTrap`, `useDismissableLayer`, `useFocusReturn`, `useScrollLock`, escala de z-index semántica. **Internal, no pública** (frontera API §24).
- **Criterios de aceptación (DoD):**
  - [x] Focus trap y return verificados con tests E2E/component.
  - [x] Escape + outside click + scroll lock funcionando.
  - [x] No exportado a la API pública.
- **Notas de la sesión (2026-09-23):** infra privada en `packages/ui/src/utils/` (precedente `use-id.ts`/`portal.ts`, frontera §24): `focus-trap.ts` (`useFocusTrap` — trap Tab/Shift+Tab con wrap-around, capture-phase, solo Tab), `focus-return.ts` (`useFocusReturn` — captura en transición false→true, restaura en true→false/unmount, per-instance → nesting correcto sin stack global), `dismissable-layer.ts` (`useDismissableLayer` — Escape + outside pointerdown con **registro interno de capas activas** solo para decidir topmost-dismiss, ADR-004 alt-D), `scroll-lock.ts` (`useScrollLock` — body overflow con contador de capas, preserva overflow original), `focusable.ts` (helpers puros `getFocusableElements`/`isFocusableElement`, DRY entre trap/return), `layer.ts` (`resolveLayerVar(layer: ZIndex)` → `var(--rr-z-*)` + `LAYER_ORDER`, consume la escala de RRU-023/024). **Desviación justificada de infra (DoD #1):** Vitest + happy-dom se añadieron como devDeps de `@raulrod/ui` (decisión de sesión; RRU-068 formalizará config y migrará los `check-*.mjs`) porque los scripts `check-*.mjs` (sin DOM) no pueden verificar focus real. `vitest.config.ts` (happy-dom + `extensionAlias` `.js→.ts`), `vitest.setup.ts` (`IS_REACT_ACT_ENVIRONMENT`), `tsconfig.build.json` excluye `**/*.test.{ts,tsx}` del `dist/` (build → `tsc -p tsconfig.build.json`), `test` script del paquete ahora termina en `&& vitest run`. 7 specs × 21 tests: focus-trap (ciclo/wrap/inactivo/sin-focusables), focus-return (deactivate/unmount/nunca-activó), dismissable (Escape solo activo, outside sí / inside no, apilado → solo topmost), scroll-lock (original preservado, ref-count anidado, toggle), layer (resolución vars + orden), focusable (orden DOM + exclusiones), **`overlays-public-boundary.test.ts`** (DoD #3 fail-loud: los internos ausentes del entry point público importándolo de verdad). SSR-safe por construcción: todo acceso a `document` dentro de efectos; callbacks de dismissable sincronizados vía ref-mirror effect (regla `react-hooks/refs` v7). Gate completo pasado: `pnpm lint` 5/5 ✅, `pnpm typecheck` 3/3 ✅, `pnpm test --filter=@raulrod/ui` (16 checks + 21 vitests) ✅, `pnpm build` ✅ (tokens.css in alterado), `pnpm format:check` ✅. Revisión manual a11y por teclado cubierta por los specs de comportamiento (Tab/Shift+Tab/Escape/outside pointer como eventos DOM reales). Desbloquea RRU-053/054/055/056/057/059.

### RRU-053 · Dialog

- **Epic:** EPIC-5 · **Estado:** ✅ Done (cerrada 2026-09-24)
- **Prioridad:** P0 · **Estimación:** L · **Dependencias:** RRU-051, RRU-052
- **Labels:** `component` `a11y`
- **Descripción:** Composable: `Dialog.Trigger`, `.Content`, `.Header`, `.Title`, `.Description`, `.Footer`. Rol `dialog`, `aria-modal`, focus inicial/restauración, Escape, backdrop, controlled/uncontrolled, `portal`. **Decisión por defecto: API composable (§15); scroll-lock y focus-trap obligatorios.**
- **Referencias:** §14 (casos a resolver) y §15 (composición); ADR-004 (RRU-051); Playbook §4.
- **Criterios de aceptación (DoD):**
  - [x] Flujos E2E: abrir → tabular → Escape → cerrar → focus vuelve al trigger. *(cubierto por 10 specs Vitest real-DOM en `Dialog.test.tsx`: click/Space/Enter abren → initial focus al panel → Tab wrapea entre Cancel/Delete → Escape cierra y el focus vuelve al trigger — DoD #1; el Playwright real queda para RRU-069, decisión de sesión confirmada)*
  - [x] Title/Description asociados; sin `aria-labelledby` vacío. *(wiring por presencia de slots con collectSlots → labelId/descriptionId; `aria-labelledby`/`aria-describedby` nunca vacíos, spec dedicada)*
  - [x] DoD global cumplido.
- **Notas de la sesión (2026-09-24):** componente `packages/ui/src/dialog/*` (Playbook §4 Paso 1: `.tsx` + `.types.ts` + `.css` + `index.ts` + **`.test.tsx`** — precedente RRU-052). **API (ADR-004, decisiones confirmadas con el usuario):** raíz `Dialog` = provider puro **sin elemento DOM** → **NO forwardRef** (documented exception al patrón RRU-040, asertada en `check-pattern.mjs` con `assert.notEqual(Dialog.$$typeof, FORWARD_REF)`), `open`/`defaultOpen`/`onOpenChange` (controlled cuando `open !== undefined`); slots montados como props de la raíz (`Dialog.Trigger = DialogTrigger`…), todos `forwardRef`+`displayName`; único contexto **interno** `DialogContext` (frontera: añadido a `INTERNAL_EXPORTS` de `overlays-public-boundary.test.ts`, no sale del barrel); `useDialogContext()` lanza error fuera del root (fail loud). **A11y (DoD):** trigger `<button type="button">` nativo estilizado como Button primario (`rr-dialog-trigger`, tokens `action-primary`, hover/`[aria-expanded="true"]`/disabled/focus-visible) con `aria-haspopup="dialog"`/`aria-expanded`/`aria-controls`=contentId y `onClick` encadenado tras `setOpen(true)`; panel `role="dialog"` `aria-modal="true"` `tabIndex={-1}` en `.rr-dialog-content` con id desde `useId("rr-dialog")` (SSR determinístico `rr-dialog-r0`); `aria-labelledby`/`aria-describedby` montados solo si Title/Description presentes (collectSlots recorriendo Children, SSR-safe — nunca idref vacío, axe-safe); initial focus al panel (tabIndex -1), focus-trap (`useFocusTrap` sobre overlayRef `.rr-dialog`) + restauración (`useFocusReturn` al trigger) + scroll-lock (`useScrollLock`) + dismissable (`useDismissableLayer`: Escape y `pointerdown` en backdrop → `setOpen(false)`; click dentro NO cierra) — todos de RRU-052, `mergeRefs` helper local único (no reintroduce utilidades). **Portal:** contenido mount-gated vía `<Portal>` (SSR-safe → renderiza nada en servidor, RRU-034); overlay `fixed inset-0` `z-index: var(--rr-z-modal)` centrado con padding `space-6`. **Scrim (0 tokens nuevos, decisión confirmada):** `color-mix(in srgb, var(--rr-color-text-primary) 45%, transparent)` — oscuro en light / claro en dark (siguiente: RRU-055/059 cuando exista mayor uso de overlays, reflejado en §0.1). **CSS geometría `28rem` max-width + `max-height: calc(100vh - space-8)` + overflow-y auto** = exceptions documentadas (tamaño del diálogo no cubierto por tokens; precedente calculus de Switch). **Animaciones** fade-in backdrop + scale/fade content con `transition: none` bajo `prefers-reduced-motion` (contrato RRU-024). **Tests (`Dialog.test.tsx`, 10 specs Vitest real-DOM):** flujo completo DoD (open click → focus en panel → Tab wrapa Cancel/Delete → Escape → focus restaurado al trigger), backdrop `pointerdown` cierra / click interior no, scroll-lock de body aplicado y restaurado, wiring ARIA (haspopup/expanded/controls; labelledby/describedby por presencia; sin idref vacío), controlled onOpenChange + gate por prop / uncontrolled defaultOpen, SSR parity (`renderToStaticMarkup`: trigger con contrato ARIA, **sin** `role="dialog"` — content es mount-gated), className merge + pass-through en slots, slots exportados standalone y en la raíz (ADR-004). Refactor de test: helper `openViaTrigger(selector)` por clase `.rr-dialog-trigger` (2 asserts fallaban buscando `data-testid` inexistente). **check-pattern.mjs (local) ampliado a 18 componentes:** entry `{ dir: "dialog", pascal: "Dialog", css: true, ref: false }` + 6 slots en refComponents/displayNames/imports + typesFiles + asserts SSR (contrato ARIA del trigger, `doesNotMatch role="dialog"`, root sin FORWARD_REF). **Verificación (gate §0 paso 4):** `pnpm lint` 5/5 ✅ (2 fixes: import-x/order scroll-lock antes de use-id; `jsx-a11y/heading-has-content` → children destructured explícito en `DialogTitle`), `pnpm typecheck` ✅, `pnpm test --filter=@raulrod/ui` ✅ (16 AA PASSED de la cadena `check-*.mjs` sobre dist/ + 8 files/31 tests Vitest, 10 de Dialog), `pnpm build` 3/3 ✅ (cache on), `pnpm format:check` ✅ tras `prettier --write` en los 5 archivos `dialog/`. Ids SSR determinísticos (`rr-dialog-r0`) vía `useId` sanitizado (RRU-030). **Reviews pendientes:** a11y manual §39 (teclado/focus ring/lector) sobre el diff en `development` y Storybook en RRU-083. **Desbloquea RRU-054 (Popover) y RRU-055 (Tooltip).**

### RRU-054 · Popover

- **Epic:** EPIC-5 · **Estado:** ✅ Done · **Fecha:** 2026-09-24
- **Prioridad:** P1 · **Estimación:** L · **Dependencias:** RRU-052
- **Labels:** `component` `a11y`
- **Descripción:** Popover posicionado (floating) con anchor, outside click, Escape, focus management básico y `aria-haspopup`/`aria-expanded`.
- **Criterios de aceptación (DoD):**
  - [x] Posicionamiento no desborda viewport (flip/overflow).
  - [x] Comportamiento de foco y dismiss correctos.
  - [x] DoD global cumplido.
- **Notas de la sesión (2026-09-24):** componente `packages/ui/src/popover/*` (`Popover.tsx` + `Popover.types.ts` + `Popover.css` + `index.ts` + `Popover.test.tsx`, 13 specs Vitest) + infra interna de posicionamiento. **API (ADR-004, decisiones confirmadas con el usuario):** posicionamiento **hand-rolled, cero deps** (se descartó `@floating-ui`; geometría pura `utils/popover.ts` + hook `utils/use-popover-position.ts`, reutilizables por Tooltip RRU-056 / Select RRU-057); raíz `Popover` = provider puro **sin elemento DOM** (**NO forwardRef**, documented exception igual que Dialog, asertada en `check-pattern.mjs`); slots `Popover.Trigger` / `Popover.Content` / `Popover.Title` (Title **opcional** → `aria-labelledby` solo si presente, nunca idref vacío, axe `aria-dialog-name` / WCAG 4.1.2); trigger **neutral** (`rr-popover-trigger` = reset de button + `:focus-visible`), el consumidor envuelve en Button/IconButton. **Posicionamiento (DoD #1):** `computePopoverPosition` en `utils/popover.ts` (puro, sin React) — flip por main-axis (`bottom→top`, `right→left`, etc.), fallback de align cruzado y **clamp final al viewport−margen** (8px = `space-2`); 10 tests unit de geometría con rects sintéticos; `usePopoverPosition` (interno) escribe `panel.style.left/top` imperativamente en `useLayoutEffect`/scroll(capture)+resize — **sin setState en effects** (hallazgo RRU-034) y sin re-render; CSS empieza offscreen `-9999px` (medible, precedente sr-only RRU-033); geometry+coordenadas = excepción ADR-003 documentada en `component-pattern.mdx` §5. **No-modal por diseño:** `role="dialog"` **sin** `aria-modal`, sin focus trap ni scroll lock — Tab/foco sale libremente sin cerrar (spec real-DOM); cierran Escape, `pointerdown` fuera y re-click del trigger (`triggerRef` como nodo "inside" del dismissable layer). **Dismiss/ARIA:** `useDismissableLayer` ampliado con `extraInsideRefs` (upgrade del primitive RRU-052, caso extra en `dismissable-layer.test.tsx`); `useFocusReturn` al trigger al cerrar; initial focus = primer focusable del panel, si no el panel (`tabIndex=-1`); `aria-controls` del trigger resuelve al id real del panel (Dialog mantenía idref apuntando a id inexistente — Popover lo corrige). **Ref del anchor entre slots hermanos:** el ref es dueño del root (`useRef` en el provider) y el Trigger lo registra vía `setTriggerRef` (función en el contexto) — ningún slot muta un objeto leído de un hook (`react-hooks/immutability`); se extrajo `utils/merge-refs.ts` compartido (promesa de extracción de RRU-053, Dialog refactorizado a usarlo). **CSS con tokens:** `z-index: var(--rr-z-overlay)`, `background-surface`, `radius-lg`, `shadow-md`, padding `space-4`, animación `rr-popover-in` con fallback reduced-motion; foco `:focus-visible`. **Internos en la frontera:** `PopoverContext`, `usePopoverContext`, `computePopoverPosition`, `usePopoverPosition`, `mergeRefs` añadidos a `INTERNAL_EXPORTS` (`overlays-public-boundary.test.ts`). **Verificación (gate §0 paso 4):** `pnpm lint` 5/5 ✅ (fix `react-hooks/immutability` → `setTriggerRef`; import-x/order ×4), `pnpm typecheck` ✅, `pnpm test --filter=@raulrod/ui` ✅ (16 AA PASSED cadena check-*.mjs sobre dist/ a 19 componentes + 10 files/55 tests Vitest), `pnpm build` ✅, `pnpm format:check` ✅ tras `prettier --write`. **check-pattern.mjs a 19 componentes:** entry `{ dir: "popover", pascal: "Popover", css: true, ref: false }` + 3 slots en refComponents/displayNames + SSR contract del trigger + typesFiles. **Se cierra en DONE por instrucción explícita del usuario** (§0 paso 5 decía 👀 In Review; el usuario revisa el diff en `development` y commitea tras el texto propuesto). **Desbloquea RRU-056 (Tooltip) y RRU-057 (Select).**

### RRU-055 · DropdownMenu

- **Epic:** EPIC-5 · **Estado:** ✅ Done · **Fecha:** 2026-09-24
- **Prioridad:** P1 · **Estimación:** L · **Dependencias:** RRU-052
- **Labels:** `component` `a11y`
- **Descripción:** Menú con roving focus, role `menu`/`menuitem`, separators, disabled items, submenus opcionales (solo si aportan), iconos lucide.
- **Criterios de aceptación (DoD):**
  - [x] Navegación completa con teclado (Home/End/arrows/type-ahead).
  - [x] DoD global cumplido.
- **Notas de la sesión (2026-09-24):** componente `packages/ui/src/dropdown-menu/*` (`DropdownMenu.tsx` + `.types.ts` + `.css` + `index.ts` + `DropdownMenu.test.tsx`, 25 specs Vitest) + util pública de roving `utils/menu.ts` (pure math + `menu.test.ts`, 10 tests) + hook interno `utils/use-menu-keyboard.ts`. **API (ADR-004, decisiones confirmadas con el usuario):** raíz `DropdownMenu` = provider puro sin DOM (**NO forwardRef**, misma excepción que Dialog/Popover, asertada en `check-pattern.mjs`) con `open`/`defaultOpen`/`onOpenChange`; `DropdownMenu.Sub` = provider puro anidado sin DOM; 6 slots forwardRef+displayName (Trigger/Content/Item/Separator/SubTrigger/SubContent). **Dos contextos internos con la MISMA forma** (`open/setOpen/contentId/triggerRef/setTriggerRef`): `DropdownMenuContext` (raíz) y `DropdownMenuSubContext` (sub) — `Item` siempre lee el contexto RAÍZ → seleccionar un sub-item cierra TODO el árbol (comportamiento de menú real). `Sub` deliberadamente NO lee el contexto raíz ni resetea en effects: vive dentro de `.Content`, se desmonta al cerrar el root (fresh closed state en cada re-apertura). **A11y/menú (DoD):** items = `<button role="menuitem">` reales, `aria-disabled` + `tabIndex` roving (0/-1) vía `focusMenuItem`, separators `role="separator"`, trigger `aria-haspopup="menu"`/`aria-expanded`/`aria-controls`. **Keyboard (WAI-ARIA menu):** document-listener `use-menu-keyboard` (resuelve target desde `document.activeElement` + containment), ArrowDown/Up wrap con skip de disabled, Home/End, type-ahead con buffer 500ms (colapso a la última tecla en miss multi-char PERO sin yankear foco si el item actual aún matchea el buffer — bug corregido en sesión), Tab cierra el árbol sin `preventDefault`, Escape/ArrowLeft (sub) via dismissable + hook. ArrowRight NO va en el hook: el `onKeyDown` React del propio SubTrigger abre el sub (verificado que React delega keydown en nodos portaled). **Submenus:** SubTrigger con chevron lucide por defecto (`@raulrod/icons` = re-export de lucide-react, RRU-016), `onPointerEnter` abre / `onPointerLeave`+`pointerdown` fuera cierra (spec usa `pointerover` — React deriva enter de over en happy-dom), subContent placement default `right-start` margin 4 (flipeo a la izquierda vía positioner). **Posicionador ampliado (RRU-054):** `PopoverPlacement` gana `left-start|left-end|right-start|right-end` — los submenus necesitan `right-start` que la unión no tenía → `parsePlacement` devolvía `undefined` y el hook reventaba (`TypeError`). Extendida la geometría pura + 3 asserts nuevos en `popover.test.ts` (start/end en lados verticales, flip right→left-start). **Contextos internos en la frontera:** `DropdownMenuContext`, `DropdownMenuSubContext`, `useDropdownMenuContext`, `useDropdownMenuSubContext`, `useMenuKeyboard`, `focusFirstMenuItem`, `firstEnabledIndex`/`lastEnabledIndex`/`nextItemIndex`/`prevItemIndex`/`typeaheadIndex` añadidos a `INTERNAL_EXPORTS` (`overlays-public-boundary.test.ts`). **Verificación (gate §0 paso 4):** `pnpm lint` 5/5 ✅ (fixes import-x/order), `pnpm typecheck` ✅ (fixes TS2339/2532/18048 por `noUncheckedIndexedAccess` en tests), `pnpm test --filter=@raulrod/ui` ✅ (16 AA PASSED cadena check-*.mjs + 12 files/91 tests Vitest, 25 de DropdownMenu + 10 menu + 11 popover), `pnpm build` 3/3 ✅ (force), `pnpm format:check` ✅ tras `prettier --write`. `check-pattern.mjs` a 20 componentes (entry `{ dir: "dropdown-menu", pascal: "DropdownMenu", css: true, ref: false }` + 6 slots + 8 displayNames). **Bug de la sesión más relevante:** type-ahead "se" sobre "Settings" saltaba a "Edit" (fallback a última tecla disparándose aunque el item actual matcheara el buffer completo) — corregido en `use-menu-keyboard.ts`. **Review a11y manual** sobre el diff en `development` (teclado completo + lector): pendiente de usuario; specs Vitest real-DOM cubren el flujo. **Desbloquea RRU-056 (Tooltip) y RRU-057 (Select).**

### RRU-056 · Tooltip

- **Epic:** EPIC-5 · **Estado:** ✅ Done (2026-09-24)
- **Prioridad:** P1 · **Estimación:** M · **Dependencias:** RRU-052
- **Labels:** `component` `a11y`
- **Descripción:** Tooltip con hover/focus trigger, delays, posicionamiento y pattern estándar (no usar en interacción táctil primaria).
- **Criterios de aceptación (DoD):**
  - [x] Accesible (contenido no esencial; decisión confirmada con el usuario — sin `aria-describedby` automático).
  - [x] DoD global cumplido.
- **Notas de la sesión (2026-09-24):** componente `packages/ui/src/tooltip/*` (`Tooltip.tsx` + `Tooltip.types.ts` + `Tooltip.css` + `index.ts` + `Tooltip.test.tsx`, 14 specs Vitest). **API (ADR-004, decisiones confirmadas con el usuario):** SIMPLE API (anti-dogma §15) — el root ES el ancla: un `<span class="rr-tooltip-trigger">` (forwardRef + displayName, CSS) envuelve el elemento del consumidor y un panel portado `<div role="tooltip">` vía `Portal` (mount-gated → SSR-solo wrapper, nada de role en el markup de servidor). Prop `content: ReactNode` requerida; `placement` default `"top"` (reusa la unión `PopoverPlacement` y la geometría de RRU-054 vía `usePopoverPosition` con `margin: 4` = `space-1`), `openDelay` 500 / `closeDelay` 100, `open`/`defaultOpen`/`onOpenChange`. **Sin `asChild`/polimorfismo (RRU-031):** el wrapper mide y predice; pointer/blur/focus burbujean del control real hasta él; un control `disabled` AÚN dispara el tooltip. `content` colisionaba con `HTMLAttributes.content` → `Omit<HTMLAttributes<HTMLSpanElement>, "content">` en el type. **A11y (DoD #1, rama "contenido no esencial"):** SIN `aria-describedby` automático (esa relación requeriría alcanzar el elemento del consumer, prohibido por la frontera sin asChild); regla práctica: el control lleva su accessible name completo (IconButton `label`, RRU-042). Teclado: apertura por `focusin`/`focusout` **INMEDIATA** (el delay es solo de pointer); el panel NO es focusable, sin trap ni Escape — se cierra al soltar hover O focus (nunca retiene el teclado). **Hover ↔ focus mutual-hold:** mientras se mantenga hover o focus, el tooltip sigue abierto (pointer sale con foco → sigue; blur con hover → sigue). **Delay + panel puente:** `pointerenter` programa openDelay y `pointerleave` closeDelay; entrar al panel cancela el cierre pendiente (sin flicker al cruzar el gap de 4px). **Layering:** `z-index: var(--rr-z-toast)` (decisión confirmada con el usuario — un hint puede explicar un control dentro de un dialog/popover abierto y nunca debe quedar por debajo de la capa que explica); `pointer-events: auto` en el panel (puente hover) sin ser focusable; excepciones `-9999px`/coordenadas = ADR-003 documentadas en el CSS y en `component-pattern.mdx §5`. **State machine:** controlled/uncontrolled vía `openRef`/`onOpenChangeRef` mirror (patrón `dismissable-layer.ts`), `setOpen` con guard no-op en uncontrolled, timers en refs + cleanup en unmount por effect (gate react-hooks: sin setState en effects). **Taladrado:** `check-pattern.mjs` registra Tooltip (structure css:true/ref:true, refComponents, displayNames, SSR `'<span id="t" data-x="1" class="rr-tooltip-trigger probe">trigger</span>'`, typesFiles) + export `Tooltip`/`TooltipProps` en `index.ts` + doc local `docs/tooltip.mdx` (sin cambios en `overlays-public-boundary` — Tooltip no añade internals nuevos). **Hallazgo en tests:** React sintetiza `onPointerEnter`/`onPointerLeave` desde `pointerover`/`pointerout` (pointerenter no burbujea → despachar `pointerenter` no alcanzaba la delegación raíz; los specs disparan pointerover/pointerout). **Verificación:** gate completo ✅ (lint 5/5, typecheck, test @raulrod/ui 13 files/105 tests incl. 14 tooltip + check-pattern, build --force, format:check); checklist manual §39 (Tab abre al instante, mutual-hold hover/focus, layering sobre Dialog/Popover, dark, reduced-motion) pendiente de la revisión del usuario sobre el diff en `development`.

### RRU-057 · Select

- **Epic:** EPIC-5 · **Estado:** ✅ Done · **Fecha:** 2026-09-24
- **Prioridad:** P1 · **Estimación:** L · **Dependencias:** RRU-052
- **Labels:** `component` `a11y`
- **Descripción:** Select accesible: trigger con `aria-expanded`/`aria-controls`, listbox con roving focus, type-ahead, búsqueda opcional, grupos, disabled items, controlled/uncontrolled.
- **Referencias:** §14 (casos a resolver) y §18 (screen readers); WAI-ARIA Listbox/Combobox; Playbook §4.
- **Criterios de aceptación (DoD):**
  - [x] E2E: navegar con teclado y seleccionar.
  - [x] Anuncios correctos a screen reader.
  - [x] DoD global cumplido.
- **Notas de la sesión (2026-09-24):** componente `packages/ui/src/select/*` (`Select.tsx` + `Select.types.ts` + `Select.css` + `index.ts` + `Select.test.tsx`, 24 specs Vitest) + hook interno `utils/use-listbox-keyboard.ts` que reusa la math pura de `utils/menu.ts` (RRU-055, `MenuItemModel`/`nextItemIndex`/`prevItemIndex`/`firstEnabledIndex`/`lastEnabledIndex`/`typeaheadIndex`) — cero duplicación, el hook solo enlaza a los `[role="option"]` reales (iceberg: `aria-disabled="true"` + `data-value`, label por `aria-label` ?? textContent), roving `tabIndex=0/-1` + `focus()` + `scrollIntoView` guardado (`typeof === "function"` — happy-dom no lo implementa), y exporta `focusSelectedOption(listbox, selectedValue)` para el foco inicial del panel. **API (ADR-004, decisiones confirmadas con el usuario):** raíz `Select` = provider puro **sin elemento DOM** (**NO forwardRef**, misma excepción documentada que Dialog/Popover/DropdownMenu, asertada en `check-pattern.mjs`); 7 slots forwardRef+displayName (Trigger/Value/Icon/Content/Item/Group/Label) montados en la raíz (`Select.Trigger = SelectTrigger`…) y exportados standalone; `value`/`defaultValue`/`onValueChange` (precedente RadioGroup RRU-047, **onValueChange solo cuando el valor cambia de verdad** — re-seleccionar el mismo cierra el popup sin re-disparar) + `open`/`defaultOpen`/`onOpenChange` (precedente Popover RRU-054); `SelectPlacement` = subconjunto de 6 del `PopoverPlacement` (el combobox solo abre arriba/abajo, default `bottom-start`); **búsqueda/filtro diferidos (decisión cerrada): solo type-ahead**; **limitación MVP documentada: sin `input` oculto/`name` nativo → el valor no participa en submissions de formulario.** **A11y (DoD #2/a/b, WAI-ARIA read-only Combobox / Listbox-Select):** trigger `<button role="combobox">` con `aria-haspopup="listbox"`/`aria-expanded`/`aria-controls`=contentId (SSR determinístico, `useId("rr-select")`), field-look exacto a Input (RRU-043: tokens, sizes sm/md/lg 24/34/46px via padding, `border.strong`, `aria-invalid` danger, disabled block último); selección por **COMMIT, no follow-focus** — `aria-selected` solo en la opción elegida (Enter/Space/click seleccionan Y cierran con focus-return al trigger, Tab cierra sin `preventDefault` — APG); `aria-selected`/`aria-disabled` explícitos en todas las options, roving tabindex; disabled options nunca focusable (WCAG); groups `role="group"` + `.rr-select-group-label` (el label NO es option — el selector `[role="option"]` lo salta); panel `role="listbox"` no-modal (sin trap/scroll-lock), `usePopoverPosition` + max-height/scroll; label del item derivado **en render-phase** (`collectItems`/`textFromChildren` recorriendo Children, precedente `collectSlots` — SSR-safe, markup idéntico en servidor/cliente); **anuncio SR (DoD b):** región `role="status"` `aria-live="polite"` (VisuallyHidden) DENTRO del trigger que publica el label seleccionado — el texto visible del trigger es a su vez su accessible name. Frontera (DoD #3): `SelectContext`/`useSelectContext`/`useListboxKeyboard`/`focusSelectedOption` añadidos a `INTERNAL_EXPORTS` de `overlays-public-boundary.test.ts` (no salen del barrel). **Verificación (gate completo ✅):** `lint` ✅ (un `eslint-disable` scoped con justificación: el option es solo-click, el teclado vive en el hook del panel); `typecheck` ✅ (5/5 paquetes); `test --filter=@raulrod/ui` ✅ 129 specs (16 check-*.mjs + Vitest, incl. check-pattern ampliado con estrutura/forwardRef/displayNames/SSR de Select); `build` turbo ✅; `format:check` ✅ (prettier `--write` en los 6 archivos nuevos); sondas de tipos consumidor en `$TMPDIR` ✅ (positiva compila limpia / `Select.Item` sin `value` → TS2741 / los 4 internos → "no exported member").

### RRU-058 · Tabs

- **Epic:** EPIC-5 · **Estado:** ✅ Done · **Fecha:** 2026-09-24
- **Prioridad:** P1 · **Estimación:** M · **Dependencias:** —
- **Labels:** `component` `a11y`
- **Descripción:** Tabs con `tablist`/`tab`/`tabpanel`, teclado (flechas + Home/End), `aria-selected`, animación sutil y reduced-motion.
- **Criterios de aceptación (DoD):**
  - [x] Navegación por teclado conforme a WAI-ARIA Tabs. *(APG activación automática: ←/→ wrap + skip disabled, Home/End, foco y selección viajan juntos, Tab sin preventDefault → contenido del panel activo; 20 specs Vitest real-DOM)*
  - [x] DoD global cumplido.
- **Notas de la sesión (2026-09-24):** componente `packages/ui/src/tabs/*` (`Tabs.tsx` + `Tabs.types.ts` + `Tabs.css` + `index.ts` + `Tabs.test.tsx`, 20 specs Vitest). **API (ADR-004, decisiones confirmadas con el usuario):** raíz `Tabs` = provider puro **sin elemento DOM** (**NO forwardRef**, misma excepción documentada que Popover/DropdownMenu/Select; `assert.notEqual(Tabs.$$typeof, FORWARD_REF)` en `check-pattern.mjs`), 3 slots forwardRef+displayName (`List/Trigger/Panel`) montados en la raíz (`Tabs.List = TabsList`…) y exportados; `value`/`defaultValue`/`onValueChange` (precedente RadioGroup/Select, **onValueChange solo cuando el valor cambia de verdad**); **solo horizontal** (cerrado: sin `orientation`, sin type-ahead, sin `asChild`). **A11y (DoD #2, WAI-ARIA Tabs, activación AUTOMÁTICA):** `TabsList` `role="tablist"` + `tabIndex={-1}` (exigido por `interactive-supports-focus`; el stop roving vive en los tabs), `Trigger` `<button role="tab" aria-selected>` (solo cuando existe selección) + `aria-controls`, `Panel` `role="tabpanel"` `aria-labelledby` y **siempre montado** con `hidden` (el contenido conserva su Tab order natural — igual que RRU-057, sin `aria-hidden`). Modelo en **render-phase puro, cero effects** (`collectTabs(children)` recursivo → ids `${baseId}-tab-N`/`-panel-N` vía `useId("rr-tabs")`, markup SSR == client). **Roving:** el `tabIndex=0` = tab seleccionado **solo si es habilitable**; si la selección cae en un disabled (seeding patológico) o no hay selección, el stop cae al **primer habilitado** — un nodo no-focusable NUNCA es tab stop (WCAG). **Teclado:** reutiliza la math pura de `utils/menu.ts` (RRU-055: `nextItemIndex`/`prevItemIndex`/`firstEnabledIndex`/`lastEnabledIndex`) sobre los `[role="tab"]` reales del DOM, ←/→/Home/End con `preventDefault`, foco imperativo `node.focus()` en el handler (sin effects ni listeners de documento — a diferencia del hook interno del select, el `onKeyDown` es React en el list), Tab sin preventDefault, `onKeyDown`/`onClick` del consumer encadenados al final. **CSS: 0 tokens nuevos** (rail 1px `color.border.default` — permitido: no es control boundary §6.2 — underline 2px `transparent`→`action.primary.background`, `margin-bottom:-1px`, ring `:focus-visible` §6.3 con `outline-offset:-2px`, disabled al final con tokens `action.disabled.*`, entrada del panel vía `:not([hidden])` + `prefers-reduced-motion`; mecánica documentada en el propio CSS y `component-pattern.mdx` §5). **Tests (20):** ARIA contract (roles/wiring, no-selection roving, selección, disabled), click/selection, teclado (wrap/skip-disabled, Home/End, Tab→content), controlled/uncontrolled, SSR parity + slots fuera del root lanzan error fail-loud (`renderToStaticMarkup`). `check-pattern.mjs` a 23 componentes + typesFiles; frontera `"TabsContext"`/`"useTabsContext"` en `INTERNAL_EXPORTS`; docs locales `docs/tabs.mdx`. Gate completo ✅ (lint 5/5, typecheck, 16 AA + 15 files/149 tests Vitest, build, format). **Next = RRU-059** (P1, sin deps → primera ⬜ ejecutable de EPIC 5 por §0 paso 1).

### RRU-059 · Toast

- **Epic:** EPIC-5 · **Estado:** ✅ Done · **Fecha:** 2026-09-24
- **Prioridad:** P1 · **Estimación:** M · **Dependencias:** RRU-052
- **Labels:** `component` `a11y`
- **Descripción:** Sistema de Toast con roles `status`/`alert` (no ambos a la vez), stack, auto-dismiss configurable, pause en hover, `aria-live`.
- **Criterios de aceptación (DoD):**
  - [x] Content importante usa `alert`; los informativos `status`. *(Un solo rol por toast, derivado del tono: `info`/`success` → `role="status"` (polite), `warning`/`destructive` → `role="alert"` (assertive); nunca ambos, nunca `aria-live` redundante ni en el viewport compartido; 15 specs Vitest)*
  - [x] Auto-dismiss sin romper lectores (anuncio controlado). *(Cada toast es su propio subárbol live-region → se anuncia una vez al insertar y quitar uno nunca re-avisa a los hermanos; los tonos `alert` son PERSISTENTES por defecto — nunca se arranca al lector; pause en hover y en focus congela el tiempo RESTANTE)*
  - [x] DoD global cumplido.
- **Notas de la sesión (2026-09-24):** componente `packages/ui/src/toast/*` (`Toast.tsx` + `Toast.types.ts` + `Toast.css` + `index.ts` + `Toast.test.tsx`, 15 specs Vitest). **El sistema de notificación del DS = su canal `aria-live` (ADR-004, alternativa D): provider composable + hook imperativo, NO manager global.** **API (4 decisiones confirmadas con el usuario, todas «Recomendado»):** (1) **estética** card neutra (`background.surface` + `border.strong` + `radius-md` + `shadow.md`) con **icono tonal** lucide coloreado con `color.text.<tone>` (RRU-049), título `text.primary`, descripción `text.muted`; (2) **auto-dismiss por tono**: el `duration` del provider (default 5000) aplica SOLO a tonos status, los alert son **persistentes** por defecto (`duration: null`) con override por-toast que siempre gana; (3) **entrada animada, salida inmediata** (`motion.duration.base` + `motion.easing.enter`, sin estado isLeaving); (4) **Escape solo con foco en el toast** (handler en el `onKeyDown` del close button, sin listener global — no roba Escape a dialogs/popovers superiores). `ToastProvider` = provider puro **sin elemento DOM** (**NO forwardRef**, misma excepción documentada que Dialog/Popover/Select; `assert.notEqual(ToastProvider.$$typeof, FORWARD_REF)`), sin slots (a diferencia de los compuestos anteriores) — la API es **imperativa**: `useToast()` → `{ toast(input): string, dismiss(id), dismissAll() }`; `ToastInput = { tone?, title: ReactNode REQUERIDA (fail-loud compile-time, precedente IconButton `label`/Avatar `name`), description?, duration?, onDismiss? }`; contexto `ToastContext` **interno** (guard de frontera `INTERNAL_EXPORTS`). **A11y (DoD #1 un rol por toast, derivado del tono; DoD #2 anuncio controlado):** `info`/`success` → `role="status"` (politeness inherente, sin `aria-live` redundante), `warning`/`destructive` → `role="alert"`; cada toast = **subárbol live-region propio** → se anuncia una vez al insertar y `dismiss`/`dismissAll`/auto-dismiss nunca re-anuncian a los hermanos; viewport portado `role="region"` con `aria-label="Notifications"` **constante** + `pointer-events:none` (nunca bloquea la página; cada toast vuelve a `auto`); el toast **nunca roba el foco** del documento (el único focuseable es el `<button aria-label="Dismiss">`); cierre X `aria-hidden`. **Timers deadline-based** (`Date.now() + remaining`, funciona con fake timers de Vitest) en refs (`timersRef`/`deadlinesRef`), **pause en hover (`onPointerEnter/Leave`) O focus-dentro (`onFocusCapture`/`onBlur` con `relatedTarget`) en el viewport**, máquina de dos señales → el pause **congela el tiempo restante** (recalculado contra el deadline, sin reset completo); *bug real encontrado por los specs*: `doPause` leía el deadline DESPUÉS de `clearTimer` (que lo borra) → el leftover caía al full-duration y el resume nunca completaba; corregido reordenando (deadline antes de clear) + updater `setToasts` puro (los side-effects de refs fuera del updater, seguro bajo StrictMode). **SSR:** provider serializa SOLO los `children` (viewport mount-gated vía `<Portal>` RRU-034) — `renderToStaticMarkup` produce únicamente la app. **CSS: 0 tokens nuevos** — card con los semánticos existentes, `z-index: var(--rr-z-toast)` (RRU-023, tope de la escala: flota sobre dialogs), ancho `min(calc(var(--rr-space-16) * 6), calc(100vw - 2*var(--rr-space-4)))` (sin valores arbitrarios, ADR-003), `@media (prefers-reduced-motion: reduce)` desactiva el enter-slide (RRU-024). **Tests (15):** roles (status/alert + la derivación nunca produce ambos + sin `aria-live` extra), stacking newest-first, `dismiss(id)`/`dismissAll` con `onDismiss`, close button (click + label), auto-dismiss (provider default, override por-toast, alert persistente, `duration:null` sticky, pause/resume hover Y foco con leftover exacto, Escape solo el toast focuseado), `useToast` fuera del provider lanza fail-loud, SSR parity. `check-pattern.mjs` a 24 componentes + typesFiles; frontera `"ToastContext"` en `INTERNAL_EXPORTS`; docs locales `docs/toast.mdx`. **Verificación:** gate completo ✅ (lint 5/5, typecheck, 16 AA + 16 files/164 tests Vitest, build, format) + **sondas de tipos consumidor** en `.tmp` positivo + 6 negativos `@ts-expect-error` (title requerida, tone/role fuera de union, prop desconocida, método inexistente, `ref` no aceptado en el provider). Se cerró en DONE por instrucción explícita del usuario. **Next = RRU-062** (P1, deps EPIC-2 ✅ → primera ⬜ ejecutable de EPIC 6; RRU-060 queda P2 deuda opcional, decisión cerrada de no-implementación en EPIC 5).

### RRU-060 · Drawer / CommandMenu

- **Epic:** EPIC-5 · **Estado:** 📋 Backlog · **Fecha de conexión:** 2026-10-02
- **Prioridad:** P2 · **Estimación:** L · **Dependencias:** RRU-052 o RRU-057
- **Labels:** `component` `a11y`
- **Descripción:** Drawer (overlay lateral reutilizando cimientos de Dialog) y CommandMenu (búsqueda con teclado + lista de resultados). **Decisión por defecto (cerrada): son P2 y NO se implementan en el MVP de EPIC 5.** Solo se ejecutan si al cerrar el resto del epic se decide ampliar scope; en ese caso se desglosan en dos tarjetas independientes (una por componente).
- **Criterios de aceptación (DoD):**
  - [ ] Drawer: mismo contrato de a11y que Dialog.
  - [ ] CommandMenu: filtrado, roving focus, Escape, sin XSS (texto tratado como texto).
  - [ ] DoD global cumplido.
- **Notas de la sesión (2026-10-02):** **movida de `⬜ To Do` a `📋 Backlog`, sin cambiar su alcance.** Su
  propia descripción ya cerraba la decisión («son P2 y NO se implementan en el MVP de EPIC 5»), pero
  el estado decía otra cosa, y eso rompía la regla de orden de §0 paso 1: RRU-060 vive en **EPIC-5**,
  el de menor número con una `⬜ To Do`, así que la regla la elegía siempre y **el tablero nunca llegaba
  a RRU-113**. El síntoma era invisible porque el epic marcaba EPIC 5 como ✅ completo mientras su
  última tarjeta seguía en la cola. Una tarjeta cuyo texto dice «no se hace» y cuyo estado dice «hazla»
  no es una tarjeta P2: es un bucle en la regla que ordena el trabajo. Corregido al passant por RRU-132
  y no en la sesión de higiene, porque mientras siga así cualquier §0 que se escriba mintió sobre cuál
  es la siguiente tarea.

---

# EPIC 6 — Data display (Fase 6)

### RRU-062 · Skeleton

- **Epic:** EPIC-6 · **Estado:** ✅ Done
- **Prioridad:** P1 · **Estimación:** S · **Dependencias:** EPIC-2
- **Labels:** `component`
- **Fecha de cierre:** 2026-09-24
- **Descripción:** Placeholder de carga con shimmer animado y `prefers-reduced-motion` respetado.
- **Criterios de aceptación (DoD):**
  - [x] Sin animación cuando reduced-motion.
  - [x] DoD global cumplido.
- **Notas de la sesión (2026-09-24):** componente `packages/ui/src/skeleton/*` (`Skeleton.tsx` + `Skeleton.types.ts` + `Skeleton.css` + `index.ts` + `Skeleton.test.tsx`, 7 specs Vitest). **API (contrato cerrado):** `Skeleton` = `<span>` estático, no interactivo, **sin ARIA por diseño** — una skeleton es ruido visual mudo; el estado de carga lo anuncia el contenedor que la compone (`aria-busy` en estados compartidos RRU-067) o `Progress` (RRU-063), nunca el placeholder en sí (precedente Badge/Avatar: sin tabstop/focus ring/border/transition). Prop propia única `variant: "rectangle" | "circle"` (default `rectangle` emitido en JS, precedente Badge → el modifier `rr-skeleton--*` siempre se emite y el contrato CSS cae fail-loud); NO hay eje `size` (el consumidor acota con className/estilo, ADR-003) ni shapes especulativos (`text`/`inline`), §9 — el círculo cubre la necesidad real de DataTable (placeholder de avatar + fila). `ref`/`className`/pass-through al `<span>` raíz. **CSS (0 tokens nuevos):** bloque `height: var(--rr-space-4)` (16px) `width: 100%` fijo `background-color: var(--rr-color-background-sunken)` `border-radius: var(--rr-radius-sm)`; shade `::after` con banda `linear-gradient(105deg, transparent 20%, var(--rr-color-background-default) 50%, transparent 80%)` arrancando `translateX(-100%)` fuera de vista → el loop reinicia invisible (sin flash); animación `rr-skeleton-shimmer var(--rr-motion-duration-slow) var(--rr-motion-easing-standard) infinite` (350ms = token más lento de la escala RRU-023; un duration largo 1–2s se pospone a medición real en EPIC 10/RRU-065); `--circle` = cuadrado `space-8` (32px, escala Avatar sm) + `radius-full`. **Reduced motion (DoD #1):** `@media (prefers-reduced-motion: reduce)` → `.rr-skeleton::after { animation-name: var(--rr-motion-behavior-reduced) }` → banda muerta fuera de vista, bloque sunken estático (contrato RRU-024). Excepciones de mecánica documentadas en el header (position/overflow/inset/transform/content/ángulo del gradiente/infinite), familia RRU-031/033/041/054. **Tests:** `Skeleton.test.tsx` (Vitest: SSR default rectangle, circle, className-merge + pass-through, children, sin role/aria/tabindex/disabled; `$$typeof` forwardRef + displayName) + `scripts/check-skeleton.mjs` (local gitignored `**/scripts/*.mjs`, 17º en la cadena test: SSR + contrato CSS completo con 9 vars token-lineaged contra `tokens/dist/tokens.css` + ausencia de hex/px/transition + reduce-motion) + `check-pattern.mjs` a **25 componentes** (estructura/forwardRef/displayName/className merge/variant guard). Doc local `docs/skeleton.mdx` (Playbook §6). **Verificación:** gate completo ✅ (lint 5/5, typecheck, 17 AA + 17 files/171 tests Vitest, build, format) + **sonda de tipos consumidor** en `$TMPDIR` (positiva default/circle + `@ts-expect-error` en `variant="box"` → compilación falla). Se cerró en DONE por instrucción explícita del usuario. Desbloquea RRU-067. **Next = RRU-064** (P1, deps — → primera ⬜ P1 ejecutable de EPIC 6; RRU-063 P2 deuda opcional, precedente RRU-060).

### RRU-063 · Progress

- **Epic:** EPIC-6 · **Estado:** ✅ Done
- **Prioridad:** P2 · **Estimación:** S · **Dependencias:** —
- **Labels:** `component` `a11y`
- **Fecha de cierre:** 2026-09-25
- **Descripción:** Barra de progreso con rol `progressbar`, `aria-valuenow/min/max`, indeterminate opcional.
- **Criterios de aceptación (DoD):**
  - [x] Valores y roles ARIA correctos.
  - [x] DoD global cumplido.
- **Notas de la sesión (2026-09-25):** componente `packages/ui/src/progress/*` (`Progress.tsx` + `Progress.types.ts` + `Progress.css` + `Progress.test.tsx` + `index.ts`) y re-export raíz. API simple: `label` requerido → `aria-label`; `value` determinado con rango fijo `0–100` y clamp silencioso; unión discriminada con `indeterminate: true`, que omite `aria-valuenow`; `forwardRef<HTMLDivElement>`, `displayName` y passthrough de atributos al nodo raíz. El indicador visual es decorativo (`aria-hidden`), con ancho dinámico, track tokenizado, animación indeterminado y reduced-motion. Tests SSR/DOM + `check-progress.mjs` + `check-pattern.mjs`; `lint`, `typecheck`, tests, build y `format:check` completados en el cierre.

### RRU-064 · Pagination

- **Epic:** EPIC-6 · **Estado:** ✅ Done
- **Prioridad:** P1 · **Estimación:** M · **Dependencias:** —
- **Labels:** `component` `a11y`
- **Fecha de cierre:** 2026-09-24
- **Descripción:** Paginación con navegación anterior/siguiente, números, página actual (`aria-current`), elipsis cuando haya muchas páginas.
- **Criterios de aceptación (DoD):**
  - [x] `aria-current="page"` en la página activa.
  - [x] DoD global cumplido.
- **Notas de la sesión (2026-09-24):** componente `packages/ui/src/pagination/*` (`Pagination.tsx` + `Pagination.types.ts` + `Pagination.css` + `index.ts` + `Pagination.test.tsx` + helper interno `pagination-range.ts`, 20 specs Vitest). **API (ADR-004, decisiones confirmadas con el usuario):** SIMPLE props — `PaginationProps extends HTMLAttributes<HTMLElement>` con 4 props propias: `pageCount` **requerido** (fail-fast compile-time, precedente IconButton `label`), `page`/`defaultPage` (controlled/uncontrolled, precedente Tabs), `onPageChange` que solo dispara cuando el valor realmente cambia; **clamp silencioso** de `page` a `[1, pageCount]` (fail-soft: el render y `aria-current` nunca apuntan a una página inexistente aunque el consumidor filtre y el total se derrumbe). MVP **buttons-only** (sin modo URL/links — los links no soportan `disabled` ni rol; `getHref(page)` queda como prop additiva futura, §9/§33). **A11y (DoD #1):** `<nav aria-label="Pagination">` (landmark navegable, override por pass-through); lista `<ul>`/`<li>` (1.3.1); nombres por acción "Previous page"/"Next page"/"Go to page N" con chevrons lucide `aria-hidden` (2.5.3, ICCA `1em`); **exactamente un `aria-current="page"`** en botón focuseable (nunca `disabled`, nunca `tabindex` → el estado visual se engancha al atributo); límites con `disabled` nativo (Button precedent — sin toggling de `aria-disabled`); elipsis `<span aria-hidden="true">…</span>` no focuseable; **live region SIEMPRE montada** `<span role="status" aria-live="polite" class="rr-visually-hidden">Page X of Y</span>` (WCAG 4.1.3 para el SPA case, precedente Select/Toast — si se desmontara perdería su turno de anuncio); **teclado nativo** sin roving (el pager es navegación, no composite: APG no define patrón pagination/keyboard, a diferencia de Tabs). **Ventana de páginas:** siempre 1 y `pageCount`; `±1` alrededor de la actual; **regla de densidad** — si `pageCount <= 2·sibling+5` se emite el run completo `1..pageCount` (mostrar "1 … 3 4 5 … 7" cuanto caben todos sería peor); hasta 2 elipsis (una por borde). **CSS (0 tokens nuevos, 20 vars lineaged):** `.rr-pagination__list` flex-wrap con gap `space-1`; `.rr-pagination__item` min hit target 32px (`space-8`, WCAG 2.5.8) `font-size-sm`/`weight-medium`/`radius-md`, hover `action.secondary.*`, `:focus-visible` outline 2px `focus.ring` (excepción mecánica documentada); `[aria-current="page"]` pin `action.primary.*` + `text.inverse` + `weight-semibold` (non-color cue 1.4.1) y gana a hover/active por source order; `:disabled` ÚLTIMO (precedente Button) con token exempto; silencioso. Sin `@keyframes` (transición = solo hover affordance, Button precedent) → sin bloque reduced-motion que añadir (RRU-024). **Tests:** unit puro del rango (dense/middle/near-start/end/clamp/degenerate) + SSR contract (landmark, labels, un solo aria-current, disabled bordes, elipsis aria-hidden sin tabindex, chevrons aria-hidden, live region, teclado nativo, className merge) + comportamiento real-DOM (uncontrolled/controlled/guard/clamp/disabled/boundaries/tab order) — **hallazgo de sesión:** los clicks iniciales apuntaban a páginas (8/9) detrás de la elipsis → se re-apuntaron a páginas dentro de la ventana (6), el window math del test debe respetar la ventana del componente. **Verificación:** gate completo ✅ (lint 5/5 tras import-x/order — `./index.js` es grupo `index` y va último; typecheck; 18º check `check-pagination.mjs` en la cadena test (SSR + CSS contract + token lineage) + `check-pattern.mjs` a 26 componentes; vitest 18 files/200 tests; build; format) — durante el gate el px-scan pilló el `border: 1px solid transparent` de reserva de geometría → eliminado del CSS (Pagination nunca pinta border, así que la reserva no aportaba y ensuciaba el contrato tokens-only). Doc local `docs/pagination.mdx`. **Deuda anotada:** `.stories.tsx` → RRU-080. **Next = RRU-065** (P1, deps RRU-022 ✅ → primera ⬜ ejecutable de EPIC 6 por §0 paso 1; RRU-063 P2 sigue deuda opcional, precedente RRU-060).

### RRU-065 · Table

- **Epic:** EPIC-6 · **Estado:** ✅ Done (2026-09-24)
- **Prioridad:** P1 · **Estimación:** L · **Dependencias:** RRU-022 ✅
- **Labels:** `component` `a11y`
- **Descripción:** Tabla semántica con `<th scope>`, cabeceras sticky opcionales, alineación, `tabular-nums` para números, estados vacío/cargando.
- **Criterios de aceptación (DoD):**
  - [x] HTML semántico complejo correcto (scope, colgroup).
  - [x] DoD global cumplido.
- **Notas de la sesión (2026-09-24):** componente `packages/ui/src/table/*` (`Table.tsx` + `Table.types.ts` + `Table.css` + `index.ts` + `Table.test.tsx`, 17 specs Vitest) + re-export raíz en `index.ts`. **API (ADR-004, decisiones confirmadas con el usuario):** raíz = `<div class="rr-table">` WRAPPER (el scrollport `overflow-x:auto` con borde/radius; `ref` → `HTMLDivElement`) que renderiza `<table class="rr-table__table">` real; compound de 9 slots: `Caption`, `ColGroup`, `Column`, `Head`, `Body`, `Foot`, `Row`, `HeaderCell`, `Cell` — todos `forwardRef` + `displayName`. Props raíz: `size: "sm"|"md"` (default `md` = CSS base, modifier solo si se pasa, precedent Badge), `sticky: boolean` (header fijo: `.rr-table--sticky` es la única clase donde viven los mecanismos position/top/z-index), `loading: boolean` (`aria-busy` en el `<table>` + body → filas-skeleton de `Skeleton` RRU-062, `loadingRows: number = 3`). **Contexto único re-provisto por sección (ADR-004 / provider anidado):** `{colCount, size, loading, loadingRows, scopeDefault}` — `Head`/`Foot` publican `scopeDefault:"col"`, `Body` `"row"`; consumidor siempre gana. **colCount derivado en render-phase** (sin effects → SSR idéntico): cuenta `<th>` del head cuando lo hay; si NO → `<col>` del colgroup; nunca ambos (double-count bug de sesión). **Empty (fail-soft):** `<td colSpan={colCount}>` full-width; filas reales ganan; loading gana a ambos; sin `empty` no se renderiza. **HeaderCell/Cell:** `align` (start/center/end, keywords layout) + `numeric` → `font-variant-numeric: var(--rr-font-numeric-tabular-nums)` (typography.md §5, ICCA `1em`); `colSpan`/`rowSpan` nativos pasan a `<th>`/`<td>`. **CSS (orden del usuario: 0 tokens nuevos):** celdas base md = `padding: space-2 space-3`, `font-size: font.size.sm`; head semibold `background.surface` con `border-bottom border.strong` (pinta bajo el header sticky); hairlines `border.default`; última fila body/foot sin borde (lo da el wrapper); sm = space-1/space-2 + `font.size.xs`; empty = space-8 + text.muted; **hover SOLO body** → `background.sunken` bajo `text.primary` → **par AA nuevo al gate**: `["color.text.primary","color.background.sunken",4.5,true,true]` (check-contrast.mjs, 29 pairs) → color.md §6.1 = 15.11:1 light / 11.42:1 dark. **Statics tipadas:** root `forwardRef` NO admite `Table.X = …` (TS2339) → `Object.assign(TableRoot, {…slots})` (primer root con statics del repo; los plain-function usan asignación directa). **Verificación:** `check-table.mjs` (10º en la cadena test) + `check-pattern.mjs` ampliado (27 componentes, entry Table + 9 slots, imports/ref/displayName, tipos, SSR probe) + 17 specs Vitest + gate completo ✅ (lint 5/5, typecheck, test 19 files/217 tests, build, format:check) + sondeos consumidor en `.tmp-rru065` (SSR `<Table sticky loading size=md>` + 6 negativos `@ts-expect-error` — nota: React 19 tipa los `ref` JSX suelto, el checker de refs DOM no lo captura a través del wrapper; es comportamiento upstream de @types/react). Entregable `docs/table.mdx` (local, no trackeado).

### RRU-066 · DataTable (generics)

- **Epic:** EPIC-6 · **Estado:** ✅ Done (2026-09-25)
- **Prioridad:** P1 · **Estimación:** L · **Dependencias:** RRU-065 ✅
- **Labels:** `component`
- **Fecha de cierre:** 2026-09-25
- **Descripción:** Tabla con column definitions + TypeScript generics (§16): sorting, filtering, pagination, row selection, loading/empty/error, responsive. **Decisión por defecto (cerrada):** virtualización SOLO si existe una necesidad real y medida** (p. ej. >1000 filas y evidencia de rendimiento); en MVP se queda fuera y se abre tarjeta nueva si aplica (§6, §17).
- **Referencias:** §16 (generics) y §17 (capacidades y anti-bloat); `docs/typescript.md` (RRU-011); Playbook §4.
- **Criterios de aceptación (DoD):**
  - [x] `<DataTable<User> … />` con inferencia de tipos perfecta.
  - [x] Sorting/filtering/pagination con tests.
  - [x] Estados loading/empty/error cubiertos.
  - [x] Virtualización sin implementar justificada en las notas (o tarjeta nueva si hay medición).
  - [x] DoD global cumplido.
- **Notas de la sesión (2026-09-25):** componente `packages/ui/src/data-table/*` (`DataTable.tsx` + `DataTable.types.ts` + `data-table.ts` + `DataTable.css` + `DataTable.test.tsx` + `index.ts`), re-export raíz y registro en `check-pattern.mjs`. API agrupada por capacidades (`sorting`, `filtering`, `pagination`, `rowSelection`), columnas genéricas contra `T`, `getRowId`, caption required, root `<div class="rr-data-table">` con `forwardRef` y `displayName`; `RowId` puede ser `string | number` y se puede precisar con `<DataTable<User, number>>`. Pipeline filter → stable sort → clamp/page slice, sin mutar `data`; loading > error > rows > empty; paginación y selección global se bloquean en loading/error; `error={false}` no oculta filas; filtering de Date usa ISO determinista y la página se resetea al cambiar el filtro. Reutiliza `Table`, `Pagination`, `Input`, `Checkbox` y `Button`; HTML semántico, `aria-sort`, nombres accesibles, `aria-busy`, `role="alert"`, teclado nativo y responsive horizontal sin `role="grid"` ni tabindex artificial. CSS token-only, 0 tokens nuevos. Tests: 19 specs DataTable y 236 specs del paquete verdes; `pnpm lint`, `pnpm typecheck`, `pnpm test --filter="@raulrod/ui"`, `pnpm build` y `pnpm format:check` pasan. Virtualización excluida por falta de medición de necesidad (>1000 filas); reevaluar solo con evidencia. Stories/MDX quedan diferidas a RRU-080/RRU-083 y la revisión manual de screen reader a RRU-071, según el plan de épicas.

### RRU-067 · Estados compartidos (loading/empty/error)

- **Epic:** EPIC-6 · **Estado:** ✅ Done
- **Prioridad:** P2 · **Estimación:** S · **Dependencias:** RRU-062 ✅
- **Labels:** `component`
- **Fecha de cierre:** 2026-09-25
- **Descripción:** Piezas pequeñas o convención para los tres estados en data display, reutilizadas por Table/DataTable.
- **Criterios de aceptación (DoD):**
  - [x] Convención documentada y usada en ≥2 componentes.
- **Notas de la sesión (2026-09-25):** `Table.Body` incorpora el estado `error?: ReactNode` como fila real full-width con `.rr-table__error` y `<div role="alert">`; la precedencia compartida queda fijada en `loading > error > rows > empty`. `DataTable` elimina su fila de error local y reutiliza el mismo slot, por lo que la convención está usada en ambos componentes. `Table.css` comparte el estilo de error y `Table.test.tsx`/`DataTable.test.tsx` cubren SSR, precedencia y transición error→data; check local actualizado. EPIC 6 queda cerrado.

---

# EPIC 7 — Testing + accesibilidad (Fase 7)

### RRU-068 · Harness de tests: Vitest + Testing Library + jest-axe

- **Epic:** EPIC-7 · **Estado:** ✅ Done
- **Prioridad:** P0 · **Estimación:** M · **Dependencias:** EPIC-1
- **Labels:** `testing` `a11y`
- **Fecha de cierre:** 2026-09-26
- **Descripción:** Configurar Vitest + @testing-library/react + jest-axe con los matchers (toHaveNoViolations) y scripts por paquete. `pnpm test` desde la raíz (§19).
- **Criterios de aceptación (DoD):**
  - [x] `pnpm test` verde en checkout limpio.
  - [x] jest-axe disponible en los tests de componentes.
- **Notas de la sesión (2026-09-26):** harness compartido `vitest.preset.mts` (raíz) + `packages/ui/vitest.config.ts` (happy-dom) y `packages/tokens/vitest.config.ts` (node); `turbo.json` declara `globalDependencies: ["vitest.preset.mts","tsconfig.base.json"]`. `packages/ui/src/test-support/`: `setup.ts` (`@testing-library/jest-dom/vitest` + `expect.extend(toHaveNoViolations)` + `cleanup()` + `IS_REACT_ACT_ENVIRONMENT`), `axe.ts` (política de reglas: `color-contrast` off por falta de layout real, `region` off para fragmentos), `css.ts` (lectura de CSS authored + token lineage contra `dist/tokens.css`), `source.ts` (estructura de archivos), `jest-axe.d.ts` (**script**, `declare module "jest-axe"` ambiente) y `vitest-matchers.d.ts` (**módulo**, augmentation de `vitest`) — la separación es obligatoria: un `declare module "vitest"` en un `.d.ts` script reemplaza la superficie de tipos del módulo y rompe todo `import { it } from "vitest"` (148 errores TS2305). **Migración completa de los 20 checks `scripts/check-*.mjs` a specs trackeables** (40 archivos / 889 tests en `@raulrod/ui`; `check-pattern.mjs` → `src/component-pattern.test.tsx`, `check-utils.mjs` → `src/utils/cx.test.ts` + `src/utils/use-id.test.tsx`, `check-pagination.mjs`/`check-table.mjs` → specs existentes ampliados sin duplicarlos); los specs legacy con `createRoot`/`act` manual (Dialog, Popover, DropdownMenu, Select, Tabs, Tooltip, Toast, DataTable, dismissable-layer, focus-return, focus-trap, scroll-lock) migrados a RTL + `userEvent`/`fireEvent`; `grep` de `createRoot` en `src/` → 0. **Scripts y setup antiguo eliminados:** `packages/ui/scripts/` (20 `.mjs`) y `packages/ui/vitest.setup.ts`; `turbo.json` pierde `**/scripts/*.mjs` de `build.inputs`/`test.inputs` (deuda RRU-021/RRU-024 resuelta: `pnpm test` ya no depende de archivos gitignored). **Tokens trackeables:** emisor CSS movido a `packages/tokens/tools/emit-css.mjs` + `emit-css.test.ts` (Node puro, sin happy-dom) y contrato de taxonomía en `tokens.test.ts`; nuevo `packages/tokens/tsconfig.build.json` que excluye `**/*.test.ts` y `tools/**` (hallazgo: los tests compilados a `dist/` se estaban publicando). **Deps declaradas explícitamente** en `packages/ui/package.json`: `@testing-library/{react,jest-dom,user-event}`, `jest-axe`, `axe-core`, `@types/node` (los tests solo resolvían por el hoisting oculto de pnpm; ESLint `import-x/no-unresolved` y `tsc` fallaban en 80/233 casos). **Node types con alcance mínimo:** `/// <reference types="node" />` por archivo en `test-support/css.ts` y `source.ts` en vez de `"types": ["node"]` global, para que `src/` no acepte `process`/`Buffer` en una librería browser-only. **a11y:** auditorías `toHaveNoViolations` en todos los componentes interactivos; **hallazgo real documentado en `Select.test.tsx`** — un trigger `role="combobox"` sin label es un combobox SIN accessible name (el nombre no se deriva del contenido), por lo que la integración auditada es la de `FormField` y el caso "bare" queda como test explícito que documenta el gap (follow-up RRU-057) en lugar de desactivar la regla. Gate completo verde (`pnpm lint` 5/5, `pnpm typecheck` 3/3, `pnpm test` 5/5 con 61 tokens + 889 UI, `pnpm build` 3/3, `pnpm format:check`) y **verificado en checkout limpio** (copia temporal con el diff aplicado + `pnpm install --frozen-lockfile`: los 5 gates verdes). Sin commits (flujo de revisión sobre `development`). Deuda que queda para RRU-069/070/071: Playwright, ADR-005 y revisión manual de screen reader.

### RRU-069 · E2E con Playwright: flujos críticos

- **Epic:** EPIC-7 · **Estado:** ✅ Done · **Fecha:** 2026-09-26
- **Prioridad:** P1 · **Estimación:** L · **Dependencias:** RRU-068
- **Labels:** `testing`
- **Descripción:** Playwright para: abrir/cerrar Dialog, navegar Select con teclado, enviar formulario, cambiar theme, interacción entre overlays y consumo del package desde playground (§19).
- **Criterios de aceptación (DoD):**
  - [x] `pnpm test:e2e` cubriendo los flujos listados.
  - [x] Runners estables en CI (shard o al menos job e2e).
- **Notas de la sesión (2026-09-26):** **Harness Vite real en `apps/playground`** (esqueleto que ya existía, ahora consumidor de verdad): importa `@raulrod/ui`/`@raulrod/tokens` por su entrypoint público y dos CSS por ruta (`@raulrod/tokens/dist/tokens.css`, `@raulrod/ui/dist/styles.css`) porque la **`exports` map es RRU-091**; la excepción de lint vive en el import con su motivo, no en la regla, para que se vea donde se lee. **`packages/ui` ahora emite CSS a `dist`**: `src/styles.css` (barrel de los 27 stylesheets) + `tools/copy-css.mjs` en el build (28 ficheros copiados) + `src/styles.test.ts` que verifica el inventario contra el filesystem (nuevo helper `listComponentStylePaths`), de modo que un componente nuevo sin CSS publicado rompe la suite. Sin esto el E2E no podía cubrir nada de estilos. **Suite: 29 tests en 5 specs Chromium** (`dialog`, `select-keyboard`, `form`, `overlays`, `theme`), `fullyParallel` en local y `workers: 1` + `retry 1` + `trace on-first-retry` en CI, siempre contra `vite preview` (**build, no dev server**: `test:e2e` depende de `^build`+`build`). Verificado con 3 runs paralelos + 1 run en modo CI (29/29). Reglas de la suite: locators por rol/nombre/texto (`data-testid` solo donde no hay identidad accesible, nunca clases `rr-*`), cero esperas arbitrarias y **ningún valor de token hardcodeado** (el theme se verifica comparando lo que produce la cascada en dos situaciones, para que un cambio de paleta no convierta el spec en una segunda fuente de verdad). **Job `e2e` en `ci.yml`** en paralelo al quality gate (Chromium cacheado por lockfile, `install --with-deps`, report en artefacto si falla, sin cache de Turborepo a propósito: build en frío = artefacto honesto). **Frontera de API en ESLint** (`no-restricted-imports` en `apps/**`): solo entrypoints públicos y prohibido `../../packages/*` — es el anticipo de RRU-103, cuya `exports`-based DoD seguirá pendiente. `allowBuilds.esbuild: true` en `pnpm-workspace.yaml` (postinstall que Vite necesita). **Hallazgo real de a11y → RRU-115 (P0)**: `Dialog.tsx:91` pone `aria-controls={dialog.contentId}` pero `DialogContent` nunca estampa ese `id`; la suite no lo afirma porque el componente es el que está roto, no el test. **Composición corregida en el playground**: el Dialog de confirmación estaba dentro del `DropdownMenuSubContent` y se desmontaba en el mismo commit que lo abría — está fuera, como hermano del menú, y el test comprueba que el diálogo gana el foco a la capa que el menú acaba de soltar. **Gate completo verde** (`pnpm lint` 5/5, `pnpm typecheck` 4/4, `pnpm test` 6/6 con 891 tests de UI, `pnpm build` 4/4, `pnpm format:check`, `pnpm test:e2e` 29/29) y **4 sondas negativas** (import duplicado en el barrel, `styles.css` ausente, import fuera de la API pública, theme sin persistencia) que fallan al romperse la precondición y vuelven a pasar al restaurar. Sin commits (flujo de revisión sobre `development`); el CI remoto aún no se ha ejecutado (rama sin push) — DoD #2 cumplido por config + run local en modo CI.

### RRU-070 · ADR-005 — Estrategia de testing

- **Epic:** EPIC-7 · **Estado:** ✅ Done · **Fecha:** 2026-09-26
- **Prioridad:** P2 · **Estimación:** S · **Dependencias:** RRU-068
- **Labels:** `docs` `testing`
- **Descripción:** ADR con los niveles (unit/component/E2E), qué se testea en cada uno y la regla de "behavior over implementation".
- **Criterios de aceptación (DoD):**
  - [x] `docs/decisions/005-testing-strategy.md` publicado.
- **Notas de la sesión (2026-09-26):** entregable `docs/decisions/005-testing-strategy.md` (política de no-trackeo de RRU-014 → **sin diff de commit**, precedente RRU-005/027/051) con el template §22 y la cabecera metadata de ADR-002/003/004. **Hallazgo de research que define el enfoque (decidido con el usuario):** el DoD literal habla de 3 niveles, pero el repo tiene **cuatro** tipos de test; se adoptó el modelo de **3 niveles + contratos estáticos como capa transversal** (no cuarto nivel simétrico): los contratos estáticos no prueban comportamiento de usuario sino las promesas que el paquete hace al consumidor (forma de ficheros, `forwardRef`/`displayName`, merge de `className`, lineage de tokens, inventario del barrel, frontera de helpers) y se afirman desde el nivel que les corresponde. Contenido: tabla por nivel (qué afirma / qué NO / dónde / qué gate), los 4 contratos estáticos con su porqué, la regla *behavior over implementation* operationalizada con las 3 preguntas de §39 y una **lista cerrada de aserciones sobre internals que sí se permiten, cada una con su motivo escrito** (idref resolution, `rr-*` en unit specs, clase de nodo portaled/`aria-hidden`, `body.style.overflow`, `forwardRef`, ausencia de export interno, aserción inversa de 0 tokens), **a11y repartida en 3 gates con sus límites escritos** (happy-dom: `color-contrast`/`region` off con motivo; tokens: 29 pares AA con fórmula WCAG; E2E: DOM real — y `aria-controls` es `incomplete` en axe, nunca violación), **sonda negativa obligatoria** antes de cerrar tarjeta ("una gate que nunca se ha visto fallar no es evidencia": precedente `tokens.test.ts` self-check de 12 casos + 7 invariantes de `emit-css.test.ts` + RRU-115), reglas E2E (locators por rol, sin esperas arbitrarias, sin tokens hardcodeados, `vite preview`, retry como diagnóstico, Chromium único), ubicación del harness (preset raíz + `globalDependencies`, deps declaradas, `tsconfig.build.json:3` excluye tests del `dist`, `globals:false` ⇒ `cleanup()` explícito, el trap de `.d.ts` script vs módulo) y **lo que no es gate**. **Decisión de sesión (usuario): sin gate de cobertura** — deliberada, no deferida: un % premia asserts triviales y castiga el plumbing de overlays; la señal es contratos + sondas negativas + gates estructurales. `coverage/**` en `turbo.json:23` queda como salida reservada, no deuda. 8 alternativas con motivo de descarte (solo unit+component sin E2E · jsdom · Cypress/WebdriverIO · `test-runner` de Storybook como extensión futura, no sustituto · cobertura % · snapshots de markup · tests de tokens en `@raulrod/ui` · status quo pre-RRU-068). **Cifras leídas de una ejecución fresca, no copiadas del tablero** (§39 lo exige): ui 41 ficheros/892 tests, tokens 2/61, E2E 5 specs/30, `component-pattern.test.tsx` 256 casos, gate de contraste 29 pares — tres cifras que el tablero tenía desactualizadas frente al código. **Verificación del entregable (el DoD real de un ADR "no especulativo"):** script de comprobación de las 46 citas `file:line` (todos los ficheros existen y todas las líneas están en rango; 3 citas ambiguas por basename duplicado —`vitest.config.ts`, `tsconfig.build.json`— corregidas a ruta completa; 1 extensión erronea `VisuallyHidden.test.ts`→`.tsx` detectada y corregida), los 5 links relativos resuelven y las 15 referencias `§N` de la guía existen. **Deriva documental corregida (en alcance, decisión de usuario):** `docs/component-pattern.mdx` — el bloque "Transición (deuda conocida)" y 4 referencias al `check-pattern.mjs` eliminado describían un mundo que RRU-068 deshizo; ahora apunta al gate real (`src/component-pattern.test.tsx`) y a ADR-005. **Hallazgos colaterales (NO tocados; fuera de tarjeta → requieren tarjeta nueva):** (1) **la deriva de RRU-068 es mucho más amplia que `component-pattern.mdx`** — 15 MDX de componente (`button`, `input`, `checkbox`, `radio`, `switch`, `avatar`, `badge`, `skeleton`, `form-field`, `pagination`, `table`, `tooltip`, `tabs`, `progress`) siguen diciendo "se verifica con `scripts/check-X.mjs` (local, Nº de la cadena `test`)", y **ADR-002:42 cita `scripts/check-contrast.mjs`**, que ya no existe (lo sustituyó `src/tokens.test.ts`); **ADR-004:51,61,79** citan `check-pattern.mjs`; `token-taxonomy.md:68` también. Editar ADRs publicados es territorio de la regla 2 del tablero → candidata a tarjeta `docs` de depuración documental; (2) 2 comentarios obsoletos que citan "runtime coverage lands with Vitest (RRU-068)" (`Textarea.tsx:40`, `Textarea.types.ts:23`) cuando el spec ya existe con 22 casos; (3) `docs/design-system-guide.md:219` (sección Testing de §5) describe el stack de testing sin mencionar `happy-dom` ni Playwright ya adoptados. **Gate §0 paso 4 sin cambios respecto a HEAD (todo `FULL TURBO`, prueba de que el entregable es puramente documental):** `pnpm lint` 5/5 ✅, `pnpm typecheck` 4/4 ✅, `pnpm test --filter="@raulrod/ui"` 41/892 ✅, `pnpm test --filter="@raulrod/tokens"` 2/61 ✅, `pnpm build` 4/4 ✅, `pnpm format:check` ✅, `pnpm test:e2e` 30/30 ✅ (extra, no exigido: el ADR cita cifras de la suite E2E). Nota de entorno: `prettier --file-info docs/...` → `ignored: true` (prettier respeta `.gitignore`), así que `format:check` **no** cubre `/docs` y el estilo del ADR se ajustó a mano al de ADR-002/003/004. **Desbloquea RRU-071** (ya era ejecutable) y **next = RRU-071** por la regla de §0 paso 1.

### RRU-071 · Revisión manual de accesibilidad

- **Epic:** EPIC-7 · **Estado:** ✅ Done · **Fecha:** 2026-09-28
- **Prioridad:** P1 · **Estimación:** M · **Dependencias:** RRU-052…057
- **Labels:** `a11y`
- **Descripción:** Revisión manual con teclado y screen readers (macOS VoiceOver) de overlays y formularios: focus, orden de lectura, anuncios (§18). Los tests automatizados no sustituyen la revisión manual.
- **Criterios de aceptación (DoD):**
  - [x] Checklist §18 completada por componente sensible.
  - [x] Issues encontrados → tarjetas nuevas en backlog con label `a11y`.
- **Notas de la sesión (2026-09-28):** **reparto de trabajo acordado con el usuario:** el agente no puede hacer la pasada perceptual con VoiceOver, así que RRU-071 entrega (a) la **superficie** que faltaba para poder hacerla, (b) el **protocolo** que la hace ejecutable y (c) la **auditoría estática** que precede a la pasada; la ejecución con lector de pantalla sigue siendo del usuario y los veredictos se transcriben a `docs/accessibility/manual-review.md` §3. (1) **Superficie (único diff trackeado):** `apps/playground/src/a11y-review-section.tsx` + una `<section>` en `app.tsx` + 3 clases token-only en `app.css`. Antes de esta tarjeta **9 componentes sensibles no tenían superficie** en una app consumidora (Tabs, Table, DataTable, Radio, Progress, Skeleton, Badge, Avatar, VisuallyHidden/skip-link) y su checklist §18 no se podía ni plantear; la familia de overlays ya la cubría `overlays-section.tsx`, escrito con RRU-071 en mente desde RRU-069. Cada bloque incluye los estados que **cambian lo que se anuncia** (loading/error/empty en Table, sort/filter/selection/pagination en DataTable, determinate+indeterminate en Progress, panel de Tabs con texto sin focusables). **Restricción dura con los E2E, y es la razón de las decisiones de composición:** los specs localizan overlays **sin scope** (`page.getByRole("dialog")` en `e2e/dialog.spec.ts:13` y `theme.spec.ts:138`, `getByRole("listbox")`, `getByRole("tooltip")`, `getByRole("button",{name:"Tooltip anchor"})`) y por nombres accesibles ya presentes (`getByLabel("Email")`, `getByRole("switch",{name:"Beta channel"})`), así que la sección nueva **no** monta ningún Dialog/Select/Dropdown/Popover/Tooltip ni repite esos nombres: un segundo Dialog habría puesto el suite en rojo por *strict mode* por razones ajenas a la revisión. (2) **Protocolo + matriz:** `docs/accessibility/manual-review.md` (carpeta `docs/accessibility` de la estructura objetivo, política no-trackeo RRU-014 → **sin diff de commit**, precedente RRU-005/027/051/070). La matriz §18 × componente separa tres clases de evidencia —`gate:` (spec que lo cubre), `código:` (`file:line`) y `manual:` (pendiente)— porque esa separación es el entregable: una casilla `gate:` NO es un ✔ de accesibilidad, es la razón por la que la casilla `manual:` sigue abierta (ADR-005 §4, guía §18). Los guiones de §3 son paso a paso con teclas y atajos de VoiceOver. `contraste` y `reduced motion` quedan **delegados a RRU-072** sin duplicarlos (ADR-005:75). (3) **Auditoría estática (§4 del doc, 9 hallazgos verificados leyendo código, ninguno «de oídas») → 9 tarjetas nuevas RRU-116…124.** 4 P1 (trap no ve hijos portaled; fallback de focus-return no-op; `Tabs.Panel` no es tab stop; `DataTable` no anuncia sort/filter/select/page y además desmonta la paginación en loading/error) y 5 P2 (triggers sin `↓`/`↑`; menú con `disabled` nativo en vez de `aria-disabled`; Escape de `dismissable-layer` en bubble sin consumir; JSDoc de `Switch` describiendo ARIA que no emite; 4 de 12 stylesheets con `transition:` sin guarda reduced-motion). **Rectificación de un hallazgo que la exploration dio por bueno:** el `id`/`role="tooltip"` de `Tooltip.tsx:225-228` **no** es un idref colgante tipo RRU-115 —nada lo referencia porque la asociación por `aria-describedby` está **decidida y documentada** como prohibida por la frontera sin `asChild` (`Tooltip.types.ts:16-19`); se registra como limitación cerrada en §4.3, no como tarjeta, porque reabrirla exigiría ADR (§2). Igual con el trigger «bare» de `Select` sin nombre propio: gap ya_documentado y afirmado en su propio spec (ADR-005 §4). **Ningún fix de `packages/ui` en esta tarjeta** (§0 paso 3, y el DoD #2 pide expressly archivar, no arreglar). **Sonda negativa (ADR-005 §5):** la tarjeta no añade gate, pero sí toca la superficie que el revisor va a usar, así que se verificó que la premisa «el playground está gateado en a11y» no es una suposición: un `<div role="button" onClick>` deliberado en la sección nueva puso `pnpm lint` en rojo con `jsx-a11y/click-events-have-key-events` + `jsx-a11y/interactive-supports-focus`, y se revirtió (lint verde). **Gate:** `pnpm lint` 5/5, `pnpm typecheck` 4/4, `pnpm test` (41 files / **892 tests** en `@raulrod/ui` + 61 en `@raulrod/tokens`), `pnpm test:e2e` **30/30** (la regresión E2E era el riesgo nº1 y se ejecutó, no se asumió), `pnpm build`, `pnpm format:check`. Checklist §39 (a11y) en el diff: la superficie es alcanzable solo con teclado, cada estado que cambia el anuncio tiene su propio control, y la omisión de overlays es deliberada y documentada. **Trabajo pendiente del usuario:** ejecutar §3 con VoiceOver y transcribir veredictos; los hallazgos que aparezcan se archivan igual que §4.1/4.2, sin arreglar en RRU-071.

### RRU-072 · Reduced motion + contraste: QA final

- **Epic:** EPIC-7 · **Estado:** ✅ Done · **Fecha:** 2026-09-28
- **Prioridad:** P1 · **Estimación:** S · **Dependencias:** EPIC-2
- **Labels:** `a11y` `testing`
- **Descripción:** Verificar `prefers-reduced-motion` (sin animaciones), foco visible en todos los componentes y contraste AA en pares usados por componentes.
- **Criterios de aceptación (DoD):**
  - [x] Sin animación/desplazamiento al activar reduced-motion.
  - [x] Reporte de contraste OK en pares autorizados.
- **Notas de la sesión (2026-09-28):** ambas mitades del DoD cerradas por **gates estáticos duraderos**, no por una pasada manual. `packages/ui/src/css-contracts.test.ts` lee los **27 stylesheets** como texto (ADR-005 §3, nivel 2) y juzga **634 pares** (350 texto, 284 no-texto) de una vez, para **todos los estados** en vez de solo los que un fixture llega a renderizar. (1) **Reduced motion:** una propiedad que mueve sin `prefers-reduced-motion` que la corte es fallo, y `transition: all` es fallo por sí mismo (esconde qué se mueve); las de color no requieren guarda, por decisión de sesión sobre RRU-124 (son affordances, no movimiento vestibular) — eso resuelve el DoD #1 de **RRU-124**, que queda como abierta solo para la duración perceptible. (2) **Contraste:** la política vive en el paquete de tokens (`contrast.ts`, con `AUTHORIZED_PAIRS` como tercera columna = 3:1 o 4.5:1 según si el par se pinta como texto), no en el test: la tabla es el contrato y el gate la aplica, y los 3 pares medidos que faltaban y pasaban se añadieron a la tabla **y** a `color.md §6`. **Lo que la gate NO puede ver, y por eso el modelo es de estados y no de snapshots:** el par se resuelve con cascada reposo → estado (el estado sobrescribe reposo), se leen estados del último compound del selector, `disabled` se exime por WCAG 1.4.3 **según selector**, `color.text.inverse` se juzga sobre `background.default` dark, un borde/outline dibujado fuera de la caja se juzga contra `background.default` **y** `background.surface`, y con `outline-offset` negativo contra la superficie interior. (3) **Ratchet:** la gate es dura para lo nuevo, y **44** judgments absorbed corresponden a 3 tarjetas archivadas (`RRU-126`/`127`/`128`); una entrada que deja de recibir hits **pone la gate en rojo** (se borra al arreglar el CSS), así que el registro no puede pudrirse. (4) **Sondas negativas (ADR-005 §5), y el hallazgo que lasJustifica:** 9 sondas escriben stylesheets en un tmpdir y las auditan **con el mismo lector, la misma cascada y la misma tabla** que los componentes reales, 2 conformes; **sin ellas la gate no se distingue de una gate que no puede fallar.** Las sondas encontraron **dos bugs reales de la gate, no del DS**: (a) el mensaje afirmaba «below the 4.5:1 it needs» incluso cuando el ratio pasaba, y (b) las fronteras «hacia afuera» pasaban la superficie como `open`, lo que hacía que **la tabla no se consultara nunca** para ellas y la bandera `inDark` se ignorara en silencio. Arreglar (b) tecnologías **8 judgments que la gate había pasado por alto**: `action.primary.background` como `border-color` de control en dark (`checkbox/Checkbox.css:72,82`, `radio/Radio.css:98`, `switch/Switch.css:125`) con `inDark: false` en la tabla — 3.32:1 y 3.02:1, o sea ≥3:1 pero **nunca verificados** en ese tema. No es un ratio roto sino un hueco de gobernanza, y es la misma causa raíz que RRU-128, así que amplió esa tarjeta en vez de abrir una cuarta. (5) **D1 corregido** (`select/Select.css`, `transition: none` en la guarda que ya existía). **Foco visible** no se re-revisó: ya lo asserta `component-pattern.test.tsx` (`:focus-visible` + `outline`), y una pasada nueva habría sido RRU-071 otra vez. **Single diff trackeado de esta tarjeta:** 2 modificados (`Select.css`, tokens) + 3 nuevos (`contrast.ts`, `css-contracts.test.ts`, `css-rules.ts`); `/docs` es gitignored (RRU-014). **Sin fix de los defectos de contraste:** se archivan, y ninguno se arregla aquí (§0 paso 3). **Pendiente del usuario:** si prefiere contraste estricto a la inversa, la tabla documenta los pares sub-3:1 restantes y se decide en la tarjeta correspondiente. **Gate (§0 paso 4, todo ejecutado en fresco):** `pnpm lint` 5/5, `pnpm typecheck` 4/4, `pnpm test` (ui 42 files / **959 tests** + tokens 2 files / 64 tests), `pnpm build` 4/4, `pnpm test:e2e` **30/30** (incluye el spec de reduced motion de `theme.spec.ts:131`, que es la evidencia E2E del DoD #1), `pnpm format:check` ✅ tras `prettier --write` en los 2 archivos nuevos. Warnings de motoresperados por Node v23.6.0 (el repo pide `>=24`), no de la tarjeta.

### RRU-115 · Dialog: `aria-controls` del trigger no apunta al panel

- **Epic:** EPIC-7 · **Estado:** ✅ Done · **Fecha:** 2026-09-26
- **Prioridad:** P0 · **Estimación:** S · **Dependencias:** —
- **Labels:** `a11y`
- **Descripción:** Hallazgo de RRU-069 (no lo detectó ni axe ni el happy-dom de RRU-068: solo aparece en el DOM real). `packages/ui/src/dialog/Dialog.tsx:91` renderiza `aria-controls={dialog.contentId}` en el trigger, pero `DialogContent` no estampa ese `id` en el panel → la referencia apunta a un id inexistente y un lector de pantalla no puede resolver qué abre el botón. Afecta a cualquier Dialog controlado y por trigger.
- **Criterios de aceptación (DoD):**
  - [x] El panel renderiza el `id` que el trigger anuncia en `aria-controls` (o el atributo se omite si no hay trigger).
  - [x] Spec de integración que verifique que la referencia **resuelve a un nodo real** en el DOM.
  - [x] Auditoría a11y verde en `Dialog.test.tsx`.
  - [x] Sin cambios de API pública (mismo `contentId` interno, sin ADR).
- **Notas de la sesión (2026-09-26):** fix de **1 línea** en `Dialog.tsx` — `id={dialog.contentId}` en el panel, **forzado tras el spread**, idéntico al precedente ya establecido en `Popover.tsx:164` / `Select.tsx:262` / `DropdownMenu.tsx:171,365` (Dialog era el único overlay cuyo trigger anunciaba un id que nadie estampara; verificado con `rg` de todos los `aria-controls` del paquete). **Interpretación del DoD #1 (decidida con el usuario):** opción A — el id se estampa siempre y la rama "no hay trigger" se cumple sola (nadie referencia un id que no necesita referenciar); se descartó la opción B (detectar `DialogContent` en `collectSlots` para omitir `aria-controls` sin panel) por simetría con los demás overlays y porque el probe SSR de Dialog en `component-pattern.test.tsx:496` no podría afirmarlo. **Consecuencia documentada en JSDoc** (`Dialog.types.ts` + cabecera de `DialogContent`): un `id` pasado por el consumidor a `Dialog.Content` se ignora — es el precio de que la relación la sea el DS por completo (ADR-004). **Por qué ningún gate lo detectó (el hallazgo que cierra la tarjeta):** axe-core evalúa `aria-controls` como `needsReview` → resultado `incomplete`, **nunca violación**, en cualquier elemento con `aria-haspopup` (`axe.js:27530`, preCheck `ariaControls`), así que jest-axe (RRU-068) no podía verlo; y el spec solo afirmaba `toBeTruthy()` sobre el atributo, a diferencia de Select/Popover que afirman la igualdad real con `panel.id`. **Tests:** (1) `Dialog.test.tsx` — el idref se captura **antes** de abrir y se afirma que no cambia al montar el panel + `document.getElementById(...) === panel` (resolución real, no "atributo no vacío"); (2) caso nuevo con **dos Dialogs en el mismo árbol**: ids distintos y cada trigger resuelve a su propio panel por nombre accesible, que es lo que un `useId` compartido o una colisión romperían en silencio; (3) nuevo spec E2E en `apps/playground/e2e/dialog.spec.ts` — `page.evaluate` con `getElementById` sobre el id anunciado y **comparación de identidad** contra el handle del panel (`role="dialog"` + mismo `id`), respetando las reglas de la suite (sin clases `rr-*`, sin testid nuevo, sin esperas arbitrarias, sin ids hardcodeados). **Sonda negativa:** quitando el `id` del panel fallan los 2 tests de `Dialog.test.tsx` (`expected '' to be 'rr-dialog-_r_4_'` y `expected null to be <div role="dialog">`) y **solo** el spec E2E nuevo (29 → el resto sigue verde) — la prueba de que los tests protegen el contrato y no pasaban por casualidad. **Gate §0 paso 4 completo en verde:** `pnpm lint` 5/5, `pnpm typecheck` 4/4, `pnpm test --filter="@raulrod/ui"` 41 files/892 tests (13 de Dialog), `pnpm build` 4/4, `pnpm test:e2e` 30/30 (también con `CI=1`: `workers: 1` + `retry 1`), `pnpm format:check` ✅ tras `prettier --write` en el spec E2E. Auditoría a11y de `Dialog.test.tsx` sin cambios y verde (DoD #3). **§18 revisado:** teclado (Tab wrap, Escape, foco al trigger) ya cubierto por unit + E2E; la apertura por Enter/Space es la de un `<button>` nativo y el mismo patrón está asertado en `select-keyboard.spec.ts`; el anuncio en VoiceOver del idref resuelto es RRU-071. **Deuda que esta tarjeta deja explícita:** la rama "sin `Dialog.Content`" mantiene un `aria-controls` que no resuelve nunca (no es reachable en el playground y coincide con Select/Popover/DropdownMenu) — si molesta, es un guard de presencia de slot como el de Title/Description, y sería una tarjeta nueva, no un arreglo de esta. Corrección de deriva documental: las notas de RRU-053 afirmaban que el panel ya llevaba "id desde `useId("rr-dialog")`" — era falso hasta este fix; y las notas de RRU-054 ya apuntaban a este bug ("Popover lo corrige"). **Desbloquea/next = RRU-070** (ADR-005, P2, la primera ⬜ ejecutable de EPIC 7).

---

# A11y backlog — hallazgos de RRU-071

> Tarjetas creadas por la revisión manual de accesibilidad (DoD #2 de RRU-071).
> **Ninguna se arregla dentro de RRU-071** (§0 paso 3): se archivan con su
> evidencia `file:line` y con el paso del protocolo (`docs/accessibility/manual-review.md` §3)
> que hay que ejecutar para reproducirlo. Origen de cada una: §4.1 (P1) y §4.2 (P2)
> del documento de revisión, verificado leyendo la implementación.

### RRU-116 · El focus trap no ve los hijos portaled de un overlay

- **Epic:** EPIC-7 · **Estado:** ✅ Done · **Fecha:** 2026-09-29
- **Prioridad:** P1 · **Estimación:** S · **Dependencias:** RRU-052 (Dialog)
- **Labels:** `a11y`
- **Descripción:** Hallazgo de RRU-071. `useFocusTrap` calcula los focusables con `getFocusableElements(node)`, que es un `root.querySelectorAll` (`utils/focus-trap.ts:35`, `utils/focusable.ts:47-48`): solo descendientes **en el árbol**. El panel de un overlay se monta en `document.body` (`portal/Portal.tsx:50`) mientras el nodo del trap vive en el árbol (`dialog/Dialog.tsx:127`), así que un Popover o un Select abierto **dentro** de un Dialog aporta nodos que el trap no ve → el `Tab` puede saltar fuera del Dialog o ciclar sobre una lista de focusables equivocada. Superficie de reproducción ya en el playground: `apps/playground/src/overlays-section.tsx:126-145`.
- **Criterios de aceptación (DoD):**
  - [x] El trap incluye los nodos focusables de las capas anidadas que se abren desde dentro del overlay.
  - [x] Spec de comportamiento que abre un overlay dentro de otro y afirma que `Tab` no escapa del exterior (no una aserción sobre `getFocusableElements`).
  - [x] Extensión E2E en `dialog.spec.ts` para el caso anidado.
  - [x] Sin cambios de API pública.
- **Notas de la sesión (2026-09-29):** el trap ya no es un `querySelectorAll` sobre el contenedor: cada `useFocusTrap` activo declara un **contexto modal** (`pushModalContext`) y los overlays anidados que se abren **debajo** de ese trap se registran contra el contexto topmost (`dismissable-layer.ts` → `ActiveLayer.context`, `getActiveLayerNodesInContext`). El trap recorre Tab/Shift+Tab sobre la **unión en orden de documento** `[container, ...capas activas del contexto]` (`focusable.ts` → `getFocusableElementsInDocumentOrder`), porque las paneles portaled viven en `document.body` y un query de subárbol no las ve. **Por qué contextos por-trap y no "unión con todos los overlays activos":** contexto de stack, el mismo modelo de capas del dismissable (RRU-051) — un Popover/Select abierto bajo el diálogo A pertenece a A, y los diálogos apilados nunca sangran focusables entre sí. Imports unidireccionales: `focus-trap.ts → dismissable-layer.ts`; sin ciclo. **El caso que discrimina la regresión (y por qué no es un Select):** la lista del Select rota con `tabIndex=-1` (no son tab stops reales) y su cierre con Tab está preemptado por el capture del trap (el listbox se queda abierto y el foco salta al primer control del diálogo — legítimo, el listbox solo se cierra con Escape o click externo; así lo afirma el spec). El caso agudo es **un Popover con 2 focusables reales** (enlace + botón): antes del fix, `Tab` desde el primero saltaba al primer control del Dialog saltándose el segundo. **Superficie:** Popover anidado del playground con 2 focusables (`overlays-section.tsx`, `dialog-popover-link` + `dialog-popover-apply`). **Tests:** unit — unión document-order (3, `focusable.test.ts`), contextos de modal aislados (4, `dismissable-layer.test.tsx`), trap con panel portaled hermano (1, `focus-trap.test.tsx`), **spec de comportamiento** en `Dialog.test.tsx` (ciclo completo Popover-2-focusables sin salir del scope + contención con Select abierto + Escape devuelve al trigger dentro del panel) con `auditA11y` verde; **E2E** 31/31 en `dialog.spec.ts` (nuevo test: la ficha del Popover anidado forma parte del ciclo del Dialog y el wrap cubre la unión). **Gate:** lint 5/5, typecheck 4/4, test 969, E2E 31/31, build, format:check. **Pendiente del usuario:** pasada manual de teclado sobre el Popover anidado (guiones §18 §3 — la fila RRU-116 de la matriz pasa a veredicto del usuario).

### RRU-117 · `useFocusReturn` cae en un fallback que no hace nada

- **Epic:** EPIC-7 · **Estado:** ✅ Done · **Fecha:** 2026-09-29
- **Prioridad:** P1 · **Estimación:** S · **Dependencias:** RRU-052
- **Labels:** `a11y`
- **Descripción:** Hallazgo de RRU-071. Cuando el elemento que tenía el foco ya no existe o ya no es focusable, `useFocusReturn` hace `document.body.focus()` (`utils/focus-return.ts:37`) — y `<body>` no tiene `tabindex`, así que `.focus()` es un **no-op**: el usuario de teclado se queda sin anillo de foco visible. Afecta a cualquier overlay abierto **sin trigger**; el playground ya tiene el caso (Dialog de confirmación sin `DialogTrigger`, `overlays-section.tsx:169-188`).
- **Criterios de aceptación (DoD):**
  - [x] El fallback deja el foco en un destino real y predecible (documentar la regla: nodo contenedor, primer focusable del contenedor, o restoration explícita por el consumidor).
  - [x] Spec que abre un overlay sin trigger, lo cierra con `Escape` y afirma que `document.activeElement` **no** es `<body>`.
  - [x] Extensión E2E equivalente.
- **Notas de la sesión (2026-09-29):** **regla del fallback decidida con el usuario** (opción «Trigger conocido → primer focusable del scope»): (1) el elemento capturado si sigue conectado y focusable (RRU-052); (2) el **trigger que el overlay ya conoce** vía opción interna `fallbackRef` (sin API pública — Popover/Select/DropdownMenu/Sub ya tienen `triggerRef` en su contexto; el **Dialog lo incorpora ahora** con el precedente de Popover: `triggerRef`/`setTriggerRef` en `DialogContextValue` y el `Dialog.Trigger` registrándose con `mergeRefs`); (3) primer focusable en orden de documento del **scope modal topmost** (`getTopmostModalScopeNodes()`, nuevo interno en `dismissable-layer.ts` sobre el registro RRU-116) o del documento entero, y aun así el destino se verifica con un **scope-guard**: mientras un modal siga abierto, un candidato fuera de su scope se rechaza (un overlay anidado sin trigger cerrado con Escape NUNCA aterriza detrás del modal — spec dedicado). **Nunca `body.focus()`.** El candidato «nodo contenedor» se descartó: el panel ya está desmontado cuando corre la restauración. **Hallazgo que cambió la superficie:** el Dialog de confirmación del playground **no reprodujo el bug** — React ejecuta los destroys de efectos pasivos antes que los creates, así que la restauración del menú (trigger vivo) corre antes de que el Dialog capture y la captura recibe un nodo restorable. Superficie nueva **discriminante**: botón one-shot `tour-trigger` del playground que se desmonta a sí mismo (`tourDone`) y abre un Dialog controlado sin `DialogTrigger` («Keyboard tour», montado solo mientras abierto para no romper los localizers E2E sin scope). `pushModalContext(container)` y `popModalContext` ganan el contenedor (map `modalContainers`, se limpia en pop), y el trap pasa su nodo — el scope topmost descarta contextos con contenedor desconectado (el modal que cierra ya no es scope). **Orden documentado:** el effect del trap corre antes que el de restauración en `DialogContent`, así que al cerrar el pop del contexto ocurre antes de resolver el destino (el modal que se cierra queda fuera del scope). **Tests:** fallback a trigger conocido / sin trigger → primer focusable de la página / último recurso sin focusables (3 en `focus-return.test.tsx`); scopes topmost aislados, apilados, desconectados y vacíos (3 en `dismissable-layer.test.tsx`, más call-sites de `pushModalContext` actualizados); **DoD #2** (Dialog sin trigger, Escape, `activeElement` ≠ body e igual al primer focusable documentado), trigger desmontado mientras el Dialog está abierto, y scope-guard con popover sin trigger abierto desde un botón de la página sobre un Dialog vivo (3 en `Dialog.test.tsx`); guard de frontera interno ampliado con los 4 nombres nuevos (`getTopmostModalScopeNodes`, `pushModalContext`, `popModalContext`, `getActiveLayerNodesInContext`). **E2E 32/32** con spec nuevo que **deriva el primer focusable del DOM** (`FOCUSABLE` selector), sin hardcodear `theme-system`. **Sondas negativas (ADR-005 §5):** revertir a `body.focus()` puso rojos los 3 specs novos + los de restauración existentes (regresión real), y el build revertido hizo fallar el spec E2E nuevo — el E2E discrimina el bug de verdad. **Gate:** lint 5/5, typecheck, test 978, build (+ force del playground, que consume `dist/`), E2E 32/32, format:check. Consecuencia manual: `manual-review.md` hallazgo #2 → corregida; el paso §3.3 que señalaba el Dialog de confirmación apunta ahora a la superficie «Keyboard tour». **Pendiente del usuario:** pasada manual del guión §3 sobre «Keyboard tour» (VoiceOver) y transcribir veredicto. Desbloquea nada (tarjeta independiente); next = RRU-118.

### RRU-118 · `Tabs.Panel` no es un tab stop

- **Epic:** EPIC-7 · **Estado:** ✅ Done · **Fecha:** 2026-09-29
- **Prioridad:** P1 · **Estimación:** S · **Dependencias:** RRU-058
- **Labels:** `a11y`
- **Descripción:** Hallazgo de RRU-071. El panel emite `role="tabpanel"` + `aria-labelledby` pero **ningún `tabIndex`** (`tabs/Tabs.tsx:209-218`), así que un panel cuyo contenido no incluye ningún elemento focusable (solo texto) es inalcanzable con `Tab`: el usuario de teclado recorre la lista de tabs y sale de la región sin haber pasado por el contenido. El patrón APG resuelve esto con `tabIndex={0}` en el panel.
- **Criterios de aceptación (DoD):**
  - [x] El panel activo es alcanzable con `Tab` aunque no contenga focusables (`tabIndex` gestionado por el componente, no por el consumidor).
  - [x] Spec de teclado que entra al panel y sale de la región en el orden correcto.
  - [x] JSDoc del slot `Tabs.Panel` actualizado con la consecuencia de teclado.
- **Notas de la sesión (2026-09-29):** **regla decidida con el usuario: `tabIndex` en render-phase, no por inspección del DOM.** El panel **activo** emite `tabIndex={active ? 0 : undefined}` forzado tras el spread (`Tabs.tsx:222`, mismo punto donde ya se fuerzan `role`/`id`/`aria-labelledby`, y mismo contrato que el roving de `Tabs.Trigger:181`); los inactivos no emiten atributo (ya están fuera del ciclo por `hidden`) y **sin selección no hay panel activo, luego no hay stop** — nada que alcanzar. **Se descartó la variante literal del texto de APG** ("solo si el panel no contiene focusables") porque exigiría leer el DOM en un `useEffect`: rompe la invariante de cero effects que ADR-004 §47 fija y que `tabs.mdx` vende como valor de diseño (el server emitiría un tab order distinto al del cliente, y el primer `Tab` tras hidratar se lo salta), y la decisión se quedaría **obsoleta** en cuanto el contenido llegue asíncrono sin un `MutationObserver`. **Coste aceptado y documentado** en `tabs.mdx` §Por qué así: un tab stop extra cuando el panel SÍ tiene controles (un `Tab` más hasta el primero). Se paga uniforme, a cambio de markup idéntico para todos los panels y en los dos temas. **Consecuencia de a11y que la tarjeta no pedía pero que el tab stop vuelve obligatoria:** un stop sin indicador visible es un WCAG 2.4.7 nuevo, así que `.rr-tabs-panel:focus-visible` gana anillo `2px var(--rr-color-focus-ring)` con `outline-offset: -2px` (`Tabs.css`, precedente del trigger en el mismo archivo y de `Popover.css`); el par está autorizado a ≥3:1 contra **ambas** superficies en ambos temas (`contrast.ts:123-124`), así que la gate de contraste lo acepta sin entrada en el registro, y `outline` no es movimiento → sin guarda de reduced motion. **Tests:** 7 specs de comportamiento nuevos en `Tabs.test.tsx` (activo es stop / inactivos sin atributo / el stop se mueve con la selección / sin selección no hay stop / ciclo real en happy-dom con un centinela posterior / el panel con controles también para y cede a su contenido / el `tabIndex` del consumidor no puede quitarlo / SSR con `tabindex="0"` solo en el visible) + **`apps/playground/e2e/tabs.spec.ts` nuevo** (3 specs: el panel de solo texto es alcanzable y se sale del widget; el panel con controles cede a su botón y su enlace en orden de documento; el stop sigue a la selección). **Límite de entorno documentado, no escondido:** la navegación secuencial de happy-dom **no honra el atributo `hidden` de un ancestro**, así que el caso mixto (panel de solo texto activo con un control dentro de un panel hermano oculto —justo el que monta el playground) no es modelable en el nivel de componente; por eso el ciclo real vive en el E2E (ADR-005 §4: un límite del entorno se documenta y se cubre en otro nivel, no se maquilla el fixture). **Sonda negativa (ADR-005 §5):** revertir el `tabIndex` pone rojos **exactamente** los 7 specs nuevos de `Tabs.test.tsx` y los 3 de `tabs.spec.ts`; los otros 978 de `@raulrod/ui` y los 32 E2E previos siguen verdes. **Hallazgo colateral, NO corregido aquí (§0 paso 3) → RRU-130:** el SSR destapó que con selección activa hay **dos** `tabindex="0"` en el tablist, porque `hasStopOnSelected` (`Tabs.tsx:170-171`) se evalúa **por trigger**: en un trigger no seleccionado es `false` y cae siempre al fallback `firstEnabledValue === value`, así que el primer habilitado conserva el stop mientras el seleccionado también lo toma — `Tab` entra por "Overview" en vez de por "Activity". Es preexistente a esta tarjeta y queda archivado en `manual-review.md` §4.1 #10. **Desviación de docs (fuera de tarjeta, 1 línea x2, disclosed):** `tabs.mdx` citaba `check-pattern.mjs`, script que ya no existe; al reescribir el bloque de verificación se corrigió a `component-pattern.test.tsx` (deriva ya registrada en RRU-058). **Gate:** lint 5/5, typecheck, test **42 files/985**, build, E2E **35/35** (6 specs), format:check. **Pendiente del usuario:** pasada manual de teclado sobre `#a11y-tabs` (guion §3.1 pasos 4-6: el anillo del panel y el anuncio en VO) y el veredicto de la fila RRU-121 sigue abierto.

### RRU-119 · `DataTable` no anuncia ordenar, filtrar, seleccionar ni paginar

- **Epic:** EPIC-7 · **Estado:** ✅ Done · **Fecha:** 2026-09-29
- **Prioridad:** P1 · **Estimación:** M · **Dependencias:** RRU-066
- **Labels:** `a11y`
- **Descripción:** Hallazgo de RRU-071. Las cuatro acciones cambian el conjunto de filas **sin mover el foco** y ninguna se anuncia: no hay `role="status"`/`aria-live` en `data-table/DataTable.tsx` (el `aria-sort` de la columna cambia, `DataTable.tsx:233-240`, pero no hay canal de anuncio del resultado). Agrava: la paginación —el único landmark de la acción de paginar— se **desmonta** cuando `pageCount <= 1` o hay loading/error (`DataTable.tsx:271`), justo en los casos en que en los que el usuario más necesita saber qué pasó.
- **Criterios de aceptación (DoD):**
  - [x] Una región de estado anuncia el resultado de cada acción (orden, filtro, selección, cambio de página), con Strings localizables por el consumidor (mismo criterio que el `getRowLabel`/`label` ya existente).
  - [x] La región existe también cuando la paginación está desmontada.
  - [x] Specs de comportamiento por cada acción y un E2E que afirme el texto anunciado tras ordenar y paginar.
  - [x] Los strings internos en inglés que hoy están hardcodeados (botón de orden `DataTable.tsx:249`, label de paginación `DataTable.tsx:278`) salen a props con default compatible.
- **Notas de la sesión (2026-09-29):** **tres decisiones confirmadas con el usuario antes de implementar:** API de strings **por feature config** (espeja el precedente `getRowLabel`/`label` citado por el DoD), extracción de **todos** los strings audibles (no solo los 2 citados) y región **action-driven**. **La regla:** UNA región `role="status"` polite (`VisuallyHidden`) en la **raíz** del DataTable, siempre montada — sobrevive a la paginación desmontada (una página, loading, error: el caso agravante de la tarjeta) — y **action-driven**: solo los commit handlers del usuario la setean (`commitSort` con la columna activada, `changeFilter` con el conteo computado por `filterDataTableRows` puro, `commitSelection`, `commitPage`); un cambio externo de `data`/props controlados **nunca re-anuncia** (specs lo afirman tras los rerenders controlados). **Silenciosa al montar** (`null` hasta la primera acción: la región existe antes de cualquier update, precondición 4.1.3, pero no canta el estado inicial en carga). **Controlado, el anuncio de página sigue al COMMIT** (el valor enviado por `onPageChange`): un consumidor que ignora el callback posee el desajuste — spec lo documenta. **El reset de página implícito del filtro no es frase aparte:** el conteo del filtro es el resultado. **`Pagination` gana `announcePageChange?: boolean = true`** (decisión pre-registrada en `pagination.mdx:32,57`): `false` desmonta su región y `DataTable` lo pasa así — dos regiones polite encolarían la misma frase dos veces; la barra standalone no cambia de comportamiento. **Strings:** 4 funciones de composición nuevas (`sorting.getSortButtonLabel`, `rowSelection.getRowToggleLabel`/`getAllToggleLabel`, `pagination.getLabel`) + 4 `getAnnouncement` (una por feature), todas con default compatible (los SSR specs heredados siguen afirmando los strings exactos); **nota honesta:** `:196` ("Filter rows") ya era prop del consumidor (`filtering.label`) — no había nada que extraer. **Hallazgo de entorno:** oxc (parser de vite 8) no parsea `expectTypeOf<NonNullable<DataTableRowSelection<User, number>[…]>>()​` en una sola línea ("empty parenthesized expression") — los asserts de tipos van vía `const` con el genérico partido en líneas. **Tests:** 1 spec SSR (una sola región, silenciosa) + 3 specs de comportamiento nuevos (las 4 acciones en una, el caso agravante con paginación desmontada y loading/error, strings localizados en español) + rework de los 3 specs heredados que afirmaban la región de `Pagination` (uno de ellos, el de normalización de página, ganó asserts de filas que le faltaban: usaba el texto de la región como proxy del estado); 2 specs nuevos en `Pagination.test.tsx`. E2E **nuevo** `e2e/data-table.spec.ts` (2) sobre `#a11y-data-table` — la superficie controlada del playground, la cableación más difícil. **Sonda negativa:** `{announcement}` → `{null}` pone rojos exactamente los 6 specs de componente + los 2 E2E; el resto (991−6, 35 E2E) sigue verde — ojo: el E2E corre contra `vite preview` del **build**, la sonda solo vale tras rebuild. Gate: lint 5/5, typecheck, test **42 files/991**, build, E2E **37/37** (7 specs), format:check. **Pendiente del usuario:** pasada manual de teclado/lector sobre `#a11y-data-table` (guion §3.1→§3.3, actualizado).

### RRU-120 · Los triggers de Select y DropdownMenu no abren con flechas

- **Epic:** EPIC-7 · **Estado:** ✅ Done · **Fecha:** 2026-09-29
- **Prioridad:** P2 · **Estimación:** S · **Dependencias:** RRU-057
- **Labels:** `a11y`
- **Descripción:** Hallazgo de RRU-071. Ambos triggers declaran solo `onClick` (`select/Select.tsx:143-169`, `dropdown-menu/DropdownMenu.tsx:99-122`), de modo que `↓`/`↑` no abren el popup como exige el patrón APG de menu-button/listbox. Se evalúa también `Alt+↓` (asociado, WCAG 1.4.13).
- **Criterios de aceptación (DoD):**
  - [x] `↓`/`↑` abren el popup y mueven el foco al primer elemento, sin cambiar el estado de selección.
  - [x] Specs de teclado para ambos componentes + E2E en `select-keyboard.spec.ts`.
- **Notas de la sesión (2026-09-29):** implementación APG: `ArrowDown` abre y enfoca la opción/menuitem seleccionado (o el primero habilitado); `ArrowUp` abre y enfoca la opción/menuitem seleccionado (o el último habilitado). La dirección se comunica del trigger al content vía funciones getter/setter sobre una ref mutable en el provider, evitando re-renders que re-dispararían el effect de foco inicial. El evento se consume con `preventDefault` + `stopPropagation` + `stopImmediatePropagation` para evitar que el mismo keydown llegue al `document` listener de `use-listbox-keyboard` / `use-menu-keyboard` recién montado, que interpretaría el foco ya movido como una navegación adicional. `Alt+ArrowDown` se documenta como no aplicable a un combobox de solo lectura (no es un patrón APG ni mejora la accesibilidad frente a `↓`/`↑`). Tests: 4 specs en `Select.test.tsx`, 3 en `DropdownMenu.test.tsx`, 2 E2E en `select-keyboard.spec.ts`. Gate: lint, typecheck, test **42 files/998**, build, E2E **39/39** (7 specs).

### RRU-121 · Los items de menú usan `disabled` nativo en vez de `aria-disabled`

- **Epic:** EPIC-7 · **Estado:** ✅ Done · **Fecha:** 2026-09-29
- **Prioridad:** P2 · **Estimación:** S · **Dependencias:** RRU-053
- **Labels:** `a11y`
- **Descripción:** Hallazgo de RRU-071. El menú detecta el item deshabilitado por `hasAttribute("disabled")` (`utils/use-menu-keyboard.ts:64`), lo que funciona para saltarlo en la navegación, pero el `disabled` nativo **saca el elemento del árbol de accesibilidad**: un usuario de lector de pantalla recorriendo el menú puede no descubrir que el item existe. El patrón APG prefiere `aria-disabled` con el item focusable pero no accionable.
- **Criterios de aceptación (DoD):**
  - [x] Veredicto registrado: un `<button role="menuitem">` con `disabled` nativo desaparece del árbol de accesibilidad, por lo que el lector de pantalla no lo anuncia; se aplica `aria-disabled` según APG.
  - [x] `aria-disabled` en `DropdownMenu.Item` y `DropdownMenu.SubTrigger`, items focusables pero no accionables; la navegación por flechas los salta igual gracias a `use-menu-keyboard`.
  - [x] Sin cambio de API pública para el consumidor (`disabled` sigue siendo la prop).
- **Notas de la sesión (2026-09-29):** implementado el patrón APG en ambos slots de menuitem. Se destruye la prop `disabled` y se emite `aria-disabled={true}` + clase `.rr-dropdown-item--disabled`; el `onClick` guarda para no disparar `onSelect` ni cerrar el menú. El `SubTrigger` deshabilitado ignora `ArrowRight` y `pointerenter`, por lo que no abre su submenú. El hook `use-menu-keyboard` ya soportaba `aria-disabled`, por lo que no necesitó cambios. CSS: selector agrupado `:disabled, [aria-disabled="true"], .rr-dropdown-item--disabled` al final del archivo para vencer `:hover`. Tests: 3 specs nuevos en `DropdownMenu.test.tsx` (atributo, click guardado, sub-trigger no abre); el archivo pasa a 32 specs. Gates: `pnpm lint` 5/5 ✅, `pnpm typecheck` ✅, `pnpm test --filter=@raulrod/ui` **42 archivos/1001** ✅, `pnpm build` ✅. Pendiente del usuario: validación manual con lector de pantalla real sobre el playground.

### RRU-122 · El Escape de `dismissable-layer` no consume el evento

- **Epic:** EPIC-7 · **Estado:** ✅ Done · **Fecha:** 2026-09-29
- **Prioridad:** P2 · **Estimación:** S · **Dependencias:** RRU-052
- **Labels:** `a11y`
- **Descripción:** Hallazgo de RRU-071. `handleKeyDown` invoca el callback y nada más: sin `preventDefault()`/`stopPropagation()` (`utils/dismissable-layer.ts:91-95`), y el listener se registra en fase **bubble** (`:105`) mientras el listener del focus trap usa capture — asimetría que hace que el orden de ejecución dependa del orden de montaje de las capas.
- **Criterios de aceptación (DoD):**
  - [x] El Escape de la capa topmost se consume de forma explícita y documentada (`preventDefault`/`stopPropagation`, y fase captura coherente con el trap).
  - [x] Spec con dos capas anidadas que afirma que un solo Escape cierra un nivel (comportamiento, no fase del listener).
  - [x] La suite E2E `overlays.spec.ts` sigue verde.
- **Notas de la sesión (2026-09-29):** se cambió el listener `keydown` a fase capture (`true`) coherente con `useFocusTrap`, y se añadieron `event.preventDefault()` + `event.stopPropagation()` antes de invocar `onEscape` en la capa topmost. Se documentó la razón en comentarios in-situ. Se añadió un spec que renderiza dos capas anidadas, cierra la superior con Escape y luego la inferior con otro Escape, verificando que cada pulsación consume un solo nivel. Gates: `pnpm lint` 5/5 ✅, `pnpm typecheck` ✅, `pnpm test --filter=@raulrod/ui` **42 archivos/1002** ✅, `pnpm build` ✅, `pnpm test:e2e --filter=@raulrod/playground` **39 passed** ✅.

### RRU-123 · El JSDoc de `Switch` describe ARIA que el componente no emite

- **Epic:** EPIC-7 · **Estado:** ✅ Done · **Fecha:** 2026-09-29
- **Prioridad:** P2 · **Estimación:** S · **Dependencias:** RRU-048
- **Labels:** `a11y` `docs`
- **Descripción:** Hallazgo de RRU-071. El JSDoc afirma «plus an aria-hidden label span» y «`role="switch"` + `aria-checked` from the checked state» (`switch/Switch.tsx:26-27`), pero el código emite `<span className="rr-switch-label">` **sin** `aria-hidden` (`:89`) y no emite `aria-checked`: se apoya en el mapeo nativo del `checkbox role="switch"`. La documentación y el código no coinciden, y un consumidor que lea el JSDoc creerá que hay texto oculto que en realidad se anuncia.
- **Criterios de aceptación (DoD):**
  - [x] JSDoc corregido para describir lo que el componente hace (sin `aria-hidden`; `aria-checked` implícito por el control nativo) con el motivo.
  - [x] `docs/switch.mdx` alineado con el comportamiento real.
- **Notas de la sesión (2026-09-29):** corregido el JSDoc de `Switch` (`Switch.tsx:23-41`) y `SwitchProps` (`Switch.types.ts:14-35`) para describir el markup real: la fila `<label>` envuelve un `<input type="checkbox" role="switch">` nativo y un `<span>` visible con `children` (sin `aria-hidden`); el estado on/off se expone por el mapeo nativo del browser (`checked` → `aria-checked` implícito), por lo que el componente no emite `aria-checked` explícito. `docs/switch.mdx` ajustado para reforzar que no hay `aria-checked` explícito. Sin cambios de comportamiento, API pública ni CSS. Gates: `pnpm lint` 5/5 ✅, `pnpm typecheck` ✅, `pnpm test --filter=@raulrod/ui` **42 archivos/1002** ✅, `pnpm build` ✅, `pnpm format:check` ✅.

### RRU-124 · 4 stylesheets con `transition:` sin guarda `prefers-reduced-motion`

- **Epic:** EPIC-7 · **Estado:** ✅ Done · **Fecha de promoción:** 2026-10-02 · **Cerrada:** 2026-10-03
- **Prioridad:** P2 · **Estimación:** S · **Dependencias:** RRU-072
- **Labels:** `a11y` `styling`
- **Decidido en RRU-072 (2026-09-28):** la guarda cubre **movimiento y geometría**, no toda `transition`. Las transiciones de borde/foco son affordances (comunican que algo cambió) y no disparan síntomas vestibulares, así que no caen bajo `prefers-reduced-motion`; su duración se audita contra el umbral de «duración perceptible» en esta tarjeta.
- **Descripción:** Hallazgo de RRU-071, **solapado con RRU-072** (cuyo DoD es «sin animación/desplazamiento al activar reduced-motion»): 4 de los 12 stylesheets del paquete con `transition:` no tienen guarda de reduced motion — `input/Input.css:28`, `textarea/Textarea.css:40`, `checkbox/Checkbox.css:34`, `radio/Radio.css:53` — frente a 13 stylesheets que sí la tienen. Son transiciones de borde/foco (no de movimiento), así que el impacto real es de duración, no de vestibular; se archiva aparte para que RRU-072 pueda decidir si las transiciones de 1–2 fracciones también deben caer bajo la guarda.
- **Criterios de aceptación (DoD):**
  - [x] Decisión explícita de RRU-072 sobre si toda `transition` cae bajo la guarda o solo las de duración perceptible. → **no**: solo movimiento/geometría; la gate `css-contracts.test.ts` lo hace verificable y una propiedad nueva sin clasificar es error de lint del contrato.
  - [x] Los 4 stylesheets con guarda de movimiento (hoy solo tienen transición de color, que la gate acepta), si la duración se perceptibiliza. → **ya perceptibilizado y verificado**: los 4 usan `--rr-motion-duration-fast` (100ms), y una transición de color/borde más larga es ahora fallo de gate.
  - [x] O decisión de bajar la duración de esas transiciones de color a un valor no perceptible, con el umbral escrito en el doc de revisión. → **umbral = `motion.duration.fast` (100ms)**, escrito en `docs/accessibility/manual-review.md §6.1` y **automatizado** en la gate; los 4 CSS no se tocaron porque ya cumplían.

- **Notas de la sesión (2026-10-03):** el DoD ofrecía las dos vías («bajar la duración» o «escribir el umbral») y la sesión eligió las dos, porque el problema real era que el umbral estaba solo en prosa. **Decisión:** una transición **que no mueve** no puede durar más de `motion.duration.fast` (100ms). Con eso la exención de RRU-072 queda defendible: un fade corto se lee como «algo cambió», uno largo ya se lee como animación — que es justo lo que la política dice no exigir por no mover nada. **El movimiento no se limita por el reloj:** su duración es una decisión de diseño y lo que lo desactiva es la guarda de `prefers-reduced-motion`, no una cifra. Por eso la regla juzga **la propiedad de cada item del `transition`**, no el `transition` entero; si se mirara el valor completo, forbidding los 200ms de `Select`/`Progress` sería un falso positivo. **Implementación:** `transitionedProperties` pasó a devolver la duración por item (`transitionItems`), y `durationMs` resuelve un tiempo escrito a mano (`250ms`, `0.2s`) o un token `var(--rr-motion-duration-*)` seguindo **un** nivel de indirección en la capa de tokens, igual que `resolveColor` con los colores. **Un solo parser para los dos trabajos** —qué se mueve y cuánto dura—, a propósito: un segundo lector podría coincidir con uno roto y entonces la gate pasaría por el motivo equivocado. **Sondas negativas (4 nuevas, 13 en total):** (a) `border-color 250ms` + `background-color duration-base` → 2 fallos, con el número y la propiedad; (b) `transform duration-base` + `width 300ms` **con** guarda → 0 fallos, porque son movimiento y el techo no les aplica — este es el caso que decide si la regla es útil o si solo pasa todo; (c) `var(--…-easing-standard)` no se confunde con un reloj (si `durationMs` lo hiciera, todo el DS leería un número irresoluble y el techo sería **código muerto que nunca dispara**); (d) **sonda sobre CSS real, no sobre un fixture:** subir `Checkbox.css` de `duration-fast` a `duration-base` pone la gate en rojo con archivo, línea y propiedad. **Una corrección que la sonda (b) forzó:** la sonda preexistente «accepts the same transition with the escape, and a colour fade without it» usaba `background-color 200ms ease` como ejemplo de un fade que no necesita guarda; con el umbral nuevo ese `200ms` es exactamente lo que la regla forbids, así que la sonda pasó a `duration-fast`. Su intención (un fade de color no necesita guarda) queda intacta; el número era el que ya no era válido. **Ningún stylesheet real viola la regla** — los dos únicos `duration-base` que quedan en el paquete son `transform` en `select/Select.css:104` y `width` en `progress/Progress.css:15`, ambos movimiento legítimo. Diff: 1 modificado (`css-contracts.test.ts`); `/docs` gitignored (RRU-014), así que el umbral documentado no genera diff de commit.

### RRU-126 · `Button`/`IconButton` `--link` no alcanza 4.5:1 en dark

- **Epic:** EPIC-7 · **Estado:** ✅ Done
- **Prioridad:** P1 · **Estimación:** S · **Dependencias:** RRU-072
- **Labels:** `a11y` `styling`
- **Descripción:** Hallazgo de RRU-072, verificado por lectura de fuente y medido por su gate. La variante `link` pinta su texto con `color.action.primary.background` sobre la superficie de la página, y ese par solo está autorizado a **3:1** (umbral de frontera) en **light**: en dark mide **3.32:1** contra `background.default` y **3.02:1** contra `background.surface` en reposo, y baja a **2.56:1 / 2.33:1** en `:hover` (`background.hover`). Como es texto, necesita **4.5:1** en los cuatro casos: `button/Button.css:120,126` y `icon-button/IconButton.css:144,148`. El mismo token sí funciona como texto sobre el fill primario, así que el defecto no es el color sino **usar un par de umbral 3:1 en un slot de texto**.
- **Criterios de aceptación (DoD):**
  - [x] Un token o par con ≥4.5:1 en ambos temas para el texto del link. → `color.link.text` / `color.link.text.hover` nuevos (`blue-600`/`blue-700` light, `blue-500`/`blue-400` dark; `blue-400` añadido a la rampa porque el hover dark no tenía paso). **No** se reusó `action.primary.text`: es blanco, y sobre la página en dark mide 17:1 — correcto como texto *sobre el fill*, pero un enlace no lleva fill.
  - [x] Ningún `border`/ratio de hover por debajo de 3:1 en dark al perder el borde de foco. → hover dark 6.74:1 / 6.14:1 (los cuatro casos que fallaban ahora son 5.17/4.86 light y 5.31/4.83 dark).
  - [x] La entrada `RRU-126` del registro de defectos conocidos se borra (la gate avisa sola si queda obsoleta). → registro vacío; el ratchet que exigía borrar la entrada también pasa.
- **Notas de la sesión (2026-10-02):** el par secorrigió **en el par que lo pintaba**, no autorizándolo. `Button.css`/`IconButton.css` leían `color.action.primary.background*` para el texto de `--link`; ahora leen `color.link.*`. Se añadió el primitivo `blue-400` (`#60a5fa`) porque la rampa saltaba de `blue-500` a `blue-600` y el hover dark necesitaba un paso más claro. Gate: 638 pares, 350 texto / 288 no-texto, 380 gobernados, **0 defectos absorbidos**. Specs nuevas en `Button.test.tsx` e `IconButton.test.tsx` que assertan el token del link **y que no reaparezca el de acción** (dos stylesheets independientes: un token compartido no es una declaración compartida). Sonda negativa: volver a `action.primary.background*` pone la gate roja con 3.32:1 / 3.02:1 / 2.56:1 / 2.33:1 en dark; restaurado y verde.

### RRU-127 · `color.border.default` no separa controles ni tablas de la página

- **Epic:** EPIC-7 · **Estado:** ✅ Done
- **Prioridad:** P1 · **Estimación:** S · **Dependencias:** RRU-072
- **Labels:** `a11y` `styling`
- **Descripción:** Hallazgo de RRU-072. `color.border.default` es la separación de un borde de 1px, así que WCAG pide **3:1**, pero la tabla lo autoriza a menos (el par existe como no-texto, no como frontera) y en la práctica mide **1.46:1** contra `background.default` y **1.38:1** contra `background.surface` en light, **1.79:1 / 1.63:1** en dark. Afecta a `button/Button.css:73` y `icon-button/IconButton.css:97` (variante `secondary`, en reposo y hover) y a `table/Table.css:23`. Además el **relleno** `secondary` está a 1.13:1 / 1.32:1 de la página: no es un bordeweak sino una superficie casi idéntica al fondo, lo que sugiere que la variante necesita un token nuevo en vez de reusar `border.default`.
- **Criterios de aceptación (DoD):**
  - [x] Token de frontera con ≥3:1 contra ambas superficies en ambos temas, o `secondary` deja de usar `border.default`. → `secondary` de Button/IconButton y el marco de Table pasan a `color.border.strong`, y se añadió su fila contra `background.surface` (4.34:1 light / 4.25:1 dark), que era el hueco de gobernanza.
  - [x] La tabla (`Table.css`) con separación de ≥3:1 o striped rows como mecanismo único y explícito. → el **marco** del wrapper a `border.strong` (es lo que separa la tabla de la página); los hairlines **entre** filas se quedan en `border.default` a propósito: un separador de 1px dentro de la tabla es decorativo, y `border-bottom` no es una propiedad que la gate pueda leer como frontera.
  - [x] La entrada `RRU-127` del registro se borra. → registro vacío.
- **Notas de la sesión (2026-10-02):** el relleno `secondary` se queda como está (`gray-100`): a 1.13:1 de la página es correcto para una superficie — lo que fallaba era el **borde**, que es la única señal de la variante. Se corrigió el token, no la variante. `AUTHORIZED_PAIRS` gana `["color.border.strong", "color.background.surface", 3.0, true, true]` con su comentario causal: una frontera se dibuja *fuera* de la caja, así que se encuentra con la página a ambos lados (1.4.11), y hasta ahora esa fila no existía. Specs nuevas en `Button.test.tsx`, `IconButton.test.tsx` y `Table.test.tsx` (esta última afirma el token del marco **y** que los hairlines siguen en `border.default`, para que nadie los "arregle" después). Sonda negativa: volver los tres a `border.default` → gate roja con 1.38–1.79:1; restaurado y verde.

### RRU-128 · La rampa primaria no está verificada — ni es segura — como frontera en dark

- **Epic:** EPIC-7 · **Estado:** ✅ Done
- **Prioridad:** P1 · **Estimación:** S · **Dependencias:** RRU-072
- **Labels:** `a11y` `styling`
- **Descripción:** Hallazgo de RRU-072, **ampliado en la sesión** por el bug (b) de las sondas negativas: el mismo token y la misma causa. `color.action.primary.background` se usa como `border-color` de un control marcado (`checkbox/Checkbox.css:72,82`, `radio/Radio.css:98`, `switch/Switch.css:125`) y `color.action.primary.background.hover` como borde de `Button`/`IconButton` primario. En dark el reposo mide **3.32:1 / 3.02:1** — por encima de 3:1, pero la tabla lo tiene con `inDark: false`, o sea **el DS lo pinta en un tema donde nunca se verificó**; y el paso `:hover` baja a **2.56:1 / 2.33:1**, por debajo del 3:1 que necesita, así que un control marcado pierde su edge justo al pasar el puntero.
- **Criterios de aceptación (DoD):**
  - [x] Un paso de la rampa primaria con ≥3:1 contra `background.default` **y** `background.surface` en dark, verificado y en la tabla con `inDark: true`. → `color.border.primary` (`blue-600` light / `blue-500` dark): 5.17/4.86 light, 5.31/4.83 dark, con sus cuatro filas en `AUTHORIZED_PAIRS`.
  - [x] El `:hover` deja de bajar de 3:1 en dark. → `color.border.primary.hover`: 6.70/6.31 light, **3.32/3.02 dark**.
  - [x] La entrada `RRU-128` del registro se borra. → registro vacío.
- **Notas de la sesión (2026-10-02):** **la frontera recibe su propio token, no el mismo azul con otro nombre**: `Checkbox`/`Radio`/`Switch` pintaban `border-color: action.primary.background(.hover)`. Mover el relleno habría roto `action.primary.text` (blanco) sobre el hover dark — de ahí que la corrección sea un token **nuevo** para la frontera y no un re-paso del relleno. Se conservan las filas `["color.action.primary.background", …, inDark: false]` a propósito: son las que hacen que la gate **rechace** volver a pintar el relleno como frontera en dark, y la sonda negativa `unverified-theme` depende de ellas. El `fill` no cambia en ningún componente. Specs nuevas en `Checkbox.test.tsx`, `Radio.test.tsx` y `Switch.test.tsx`: cada estado marcado/seleccionado afirma `border-color: var(--rr-color-border-primary)` y su `:hover` con `border-primary-hover`, más un assert inverso de que `border-color` no vuelve a ser el token de relleno. Sonda negativa: volver el borde checked al relleno → gate roja con 2.56:1 / 2.33:1; restaurado y verde.

### RRU-129 · El error de una fila de tabla no se anuncia sobre el hover de esa fila

- **Epic:** EPIC-7 · **Estado:** ✅ Done · **Fecha de promoción:** 2026-10-02 · **Cerrada:** 2026-10-03
- **Prioridad:** P2 · **Estimación:** S · **Dependencias:** RRU-072
- **Labels:** `a11y` `styling`
- **Descripción:** Hallazgo de RRU-072, **archivado como limitación del lector, no como fix pendiente**: `.rr-table__error` pinta `color.text.danger` (`table/Table.css:117`) y su ancestro `.rr-table__row:hover` pinta `background.sunken` (`table/Table.css:74`), así que al pasar el puntero sobre una fila con error el texto cae a **4.26:1** en light. La relación JSX ancestor-descendant **no está en el CSS**, así que un gate de fuente no puede derivarla y la tarjeta queda para revisión manual: o `.rr-table__row:hover` excluye las filas con error, o `text.danger` tiene un valor hover propio, o la fila con error no hace hover. Mismo par que el resto, pero el mecanismo es de cascada, no de token.
- **Criterios de aceptación (DoD):**
  - [x] `text.danger` a ≥4.5:1 sobre `background.sunken` en el estado hover de su fila, en ambos temas. → **resuelto por la vía del fill propio**, no cambiando el par: `.rr-table__error` pinta `background.default`, así que el par pasa a ser `text.danger`/`background.default` (4.83:1 light / 6.19:1 dark), ya autorizado y por encima de 4.5:1 en los dos temas. Medido y documentado en `color.md §6.1`/§6.1.1 en las dos tablas.
  - [x] El hover de fila excluye el estado de error, o el DS documenta que el error gana en legibilidad. → **la celda gana**: al pintar su propia superficie, el hover de fila ya no alcanza a su texto. Es la segunda de las tres vías que la descripción ofrecía, y la que sobrevive sin `:has()`.
  - [x] Verificado en el playground (§18) con el guion de reduced-motion/contraste del doc de revisión. → la superficie de error ya existe en `a11y-review-section.tsx:119-168`; verificado el fill con la spec de CSS y medido el par con la gate, no a ojo en el navegador (ver «pendiente»).

- **Notas de la sesión (2026-10-03):** la causa no era un descuido de token sino **estructural**: la relación entre la celda de error y el hover de su fila vive en el JSX, así que ninguna gate que lea stylesheets podía derivarla — y como la celda **no pintaba superficie propia**, la gate la trataba como `open` y la medía contra las superficies de página, donde `text.danger` sí está autorizado. El defecto estaba a la vez **invisible y sin mecanismo que lo detectara**, y por eso sobrevivió a RRU-072. **Vía elegida:** que el texto **pinte su propia superficie** (`.rr-table__error { background-color: var(--rr-color-background-default) }`). Se descartó `:has()` —excluir el error del hover del padre— porque no hay precedente en el repo y el parser degrada los selectores anidados; se descartó un `text.danger` de hover porque habría que recordar usarlo solo en esa celda. Con el fill, la celda deja de ser `open` y **la gate mide el par real**: el recuento bajó de 638 a 636 pares (la celda pasa de medirse dos veces contra la página a una vez contra su fondo) y **los gobernados subieron de 380 a 382** — menos juicios, más señal. **Y aquí hay que corregir lo que el plan daba por hecho:** la gate **no falla si alguien borra el fill**. Se comprobó, y sigue verde con 638/380 y 4.26:1 en la fila, porque sin fondo propio la celda vuelve a ser `open` y `text.danger` sobre la página está autorizado. La gate **medía** el par correcto; no era la que detectaba la regresión. Lo que protege el fill es `Table.test.tsx > the error row paints its own surface so the row hover cannot reach it`, con **dos sondas negativas** sobre el archivo real: borrar el `background-color` y ponerlo en `transparent` ponen el test en rojo (el segundo caso es el que importa — `transparent` satisface el regex del fill sin pintar nada, o sea dejaría pasar el hover exactamente igual). **Consecuencia visual, deliberada:** la fila de error ya no se resalta al pasar por encima. Es un mensaje de estado, no una fila de datos, y el hover de fila está documentado como previsualización no interactiva; las filas de datos siguen resaltándose. La fila de **empty** no necesita el mismo treatment porque `text.muted` sí aguanta el hover en los dos temas (4.81:1 / 5.11:1). **Pendiente de revisión humana:** el DoD #3 pide el guion §18 en el playground; lo verificado aquí es el contrato de CSS y la medición del par, no una inspección visual del hover en los dos temas — queda para la pasada manual. Diff: 2 modificados (`Table.css`, `Table.test.tsx`) + 1 changeset patch; `/docs` gitignored (RRU-014).

### RRU-130 · El roving tabindex deja dos tab stops en el tablist cuando hay selección

- **Epic:** EPIC-7 · **Estado:** ✅ Done
- **Prioridad:** P1 · **Estimación:** S · **Dependencias:** RRU-058
- **Labels:** `a11y` `testing`
- **Descripción:** Hallazgo de la sesión de RRU-118, destapado por el spec de SSR de esa tarjeta (preexistente, no lo causó el fix del panel). `TabsTrigger` calcula `hasStopOnSelected = isSelected && !disabled` **por trigger** (`tabs/Tabs.tsx:170`), así que en cualquier trigger NO seleccionado la condición es `false` y el segundo término del `||` —`!hasStopOnSelected && tabs.firstEnabledValue === value`— se cumple para el primer tab habilitado. Con `defaultValue="activity"` el markup lleva **dos** `<button role="tab" tabindex="0">` (Overview y Activity): `Tab` entra en el tablist por el primero habilitado en vez de por el seleccionado, y el ciclo de Tab queda con un stop de más. La intención documentada en el propio JSDoc (`:166-169`) es que el fallback al primer habilitado aplique solo cuando el stop está libre (sin selección, o selección patológica sobre un tab disabled), no siempre que el trigger no sea el seleccionado.
- **Criterios de aceptación (DoD):**
  - [x] Con selección, **exactamente un** trigger del tablist tiene `tabIndex={0}` y es el seleccionado; el resto, `-1`. → el root resuelve el stop una vez (`tabStopValue`) y el trigger solo compara.
  - [x] El fallback al primer habilitado se conserva en los dos casos que lo justifican: sin selección, y `defaultValue` patológico sobre un tab `disabled`. → ambos verificados por spec.
  - [x] Spec que afirma el `tabIndex` de **todos** los triggers (no solo del seleccionado: el hueco actual de `Tabs.test.tsx:117-126` es lo que dejó pasar el bug) + sonda negativa documentada. → 6 specs nuevas que **cuentan** los `[role="tab"][tabindex="0"]` de todo el tablist.
  - [x] E2E que entra al tablist con `Tab` desde la página y afirma que el foco cae en el tab **seleccionado**, no en el primero. → `apps/playground/e2e/tabs.spec.ts`, cuenta los stops en el navegador y hace `Tab` + `Shift+Tab` para volver al tablist.
- **Notas de la sesión (2026-10-02):** la causa era que `isSelected || (!stopTaken && isFirstEnabled)` **no es una partición**: con `activity` seleccionada, `activity` cumplía el primer término y el primer habilitado el segundo. Ambas propiedades —"no hay selección" y "la seleccionada está deshabilitada"— son del **modelo**, no del trigger que pregunta, así que la decisión subió al provider (que ya tenía `firstEnabledValue` en render-phase): `selectedItem && !selectedItem.disabled ? selectedItem.value : firstEnabledValue`. Sin effects, sin API pública, `TabsContextValue` sigue interna. Un campo nuevo en el contexto (`tabStopValue`) sustituye a los dos públicos que ya nadie leía. **Sondas negativas, y una de ellas encontró un defecto del gate, no del componente:** (a) spec — revertir a la lógica por trigger → 4 tests rojos con `['tab-overview', 'tab-activity']` frente a `['tab-activity']`; (b) **E2E — la primera sonda dio VERDE con el bug dentro**, porque `pnpm test:e2e` corre contra `dist/` y la sonda editaba `src/` sin reconstruir: el E2E no estaba probando lo que se creería. Rehecha con `pnpm build` previo → 1 rojo con el array de dos elementos. Los tres E2E previos pasaban porque focuseaban el tab directamente con `.focus()`, nunca entrando con `Tab`; la spec nueva entra. Restaurado y `pnpm test:e2e` 40/40 en verde.

---

---

# EPIC 8 — Storybook + documentación + DX (Fase 8)

### RRU-080 · Configurar Storybook

- **Epic:** EPIC-8 · **Estado:** ✅ Done · **Fecha:** 2026-09-29
- **Prioridad:** P0 · **Estimación:** M · **Dependencias:** EPIC-3/4
- **Labels:** `storybook` `docs`
- **Descripción:** App `storybook` de Storybook 8+ + React/Vite, con CSS del sistema cargada por defecto. Funciona como entorno de dev, catálogo, docs y playground (§20).
- **Criterios de aceptación (DoD):**
  - [x] `apps/storybook` levantará con `pnpm dev`.
  - [x] Se consigue componente del paquete consumiendo la API pública (validar frontera).
- **Notas de la sesión (2026-09-29):** Storybook 8.6.18 + `@storybook/react-vite` instalado en `apps/storybook`. Se eligió la familia 8.6.x en lugar de la versión "latest" 10.6.0 para mantener estabilidad y coherencia con la guía (§20). Vite se fijó a `^6.4.3` porque Storybook 8.6 no declara peer support para Vite 7 (que usa el playground). CSS del sistema cargado en `.storybook/preview.ts` vía los mismos paths documentados para consumidores hasta RRU-091 (`@raulrod/tokens/dist/tokens.css`, `@raulrod/ui/dist/styles.css`). Story mínima de `Button` importada desde `@raulrod/ui` valida la frontera pública y expone variantes, disabled y loading. `turbo.json` ahora cachea `storybook-static/**` como output de build; `eslint.config.js` ignora `storybook-static/**` para no lintear el output minificado de terceros. `.gitignore` añade `storybook-static/` y `*storybook.log`. Gates: lint ✅, typecheck ✅, test 42 archivos/1002 ✅, build ✅ (storybook-static generado), format:check ✅, dev levanta en `http://127.0.0.1:6006` y responde HTTP 200.

### RRU-081 · Temas (light/dark) en Storybook

- **Epic:** EPIC-8 · **Estado:** ✅ Done · **Fecha:** 2026-09-29
- **Prioridad:** P0 · **Estimación:** S · **Dependencias:** RRU-080, EPIC-2
- **Labels:** `storybook` `tokens`
- **Descripción:** Toggle global light/dark cambiando `data-theme` en el decorador + respeto a `prefers-color-scheme`. Control docs/stories.
- **Criterios de aceptación (DoD):**
  - [x] Todas las stories disponibles en ambos temas sin regresión.
- **Notas de la sesión (2026-09-29):** implementado con `globalTypes.theme` (light/dark/system) en `apps/storybook/.storybook/preview.ts` y decorator `WithTheme` en `.storybook/with-theme.tsx`. "system" elimina `data-theme` para que actúe `prefers-color-scheme`. El decorator pinta el canvas con `--rr-color-background-default` y `--rr-color-text-primary`, por lo que se deshabilitó `addon-backgrounds` para evitar conflictos. Script anti-flash en `.storybook/preview-head.html` lee `globals=theme:` de la URL y aplica el atributo antes del primer paint. Gates: lint ✅, typecheck ✅, test 42 archivos/1002 ✅, build ✅, format:check ✅, dev en `127.0.0.1:6006` con HTTP 200.

### RRU-082 · Stories relevantes por componente

- **Epic:** EPIC-8 · **Estado:** ✅ Done · **Fecha:** 2026-09-29
- **Prioridad:** P0 · **Estimación:** L · **Dependencias:** RRU-080
- **Labels:** `storybook`
- **Descripción:** No quedarse en `Default`: Variants, Disabled, Loading, Error, Empty, Long content, Keyboard, Dark, Responsive (§20) para cada componente público.
- **Criterios de aceptación (DoD):**
  - [x] Cada componente con la matriz de stories que le aplique.
  - [x] Playground de props (Controls) usable.
- **Notas de la sesión (2026-09-29):** stories co-localizadas en `packages/ui/src/<componente>/<Pascal>.stories.tsx` (Opción A, cumple Playbook §4 Paso 1). ~30 componentes públicos cubiertos con matriz §20 + Playground con Controls. Interacciones vía `@storybook/test` en componentes interactivos. Helper `packages/ui/src/storybook-support/index.tsx` sin exportar del barrel. Infra: `@storybook/react` y `@storybook/test` como devDeps de `@raulrod/ui`; `**/*.stories.tsx` excluido de `tsconfig.build.json`; glob de Storybook apunta a `packages/ui/src`; `vite-env.d.ts` tipa CSS side-effect imports; story vieja de `apps/storybook/src` eliminada. Gates: lint, typecheck, test 42/1002, build, format:check y dev HTTP 200 verdes.

### RRU-083 · Documentación MDX

- **Epic:** EPIC-8 · **Estado:** ✅ Done · **Fecha:** 2026-09-29
- **Prioridad:** P1 · **Estimación:** M · **Dependencias:** RRU-082
- **Labels:** `docs`
- **Descripción:** Páginas MDX: cómo usar, contrato (props/eventos/restricciones), por qué está así diseñado (trade-offs) (§21). + Guías de tokens, theming, accessibility, releases y contribución.
- **Criterios de aceptación (DoD):**
  - [x] ≤ 3 clics para llegar al ejemplo de un componente.
  - [x] Sección "Trade-offs / Limitaciones" en componentes complejos.
- **Notas de la sesión (2026-09-29):** Storybook 8 configurado para servir MDX (`apps/storybook/.storybook/main.ts`: glob `*.mdx` + `docs.autodocs: true`). Guías creadas en `packages/ui/src/docs/`: Introduction, Component pattern (migración del doc local), Tokens, Theming, Accessibility, Contributing. Guía de releases omitida por decisión del usuario hasta RRU-090. Docs enriquecidos con trade-offs para componentes complejos: Dialog, DropdownMenu, Popover, Select, Tabs, ToastProvider, DataTable y FormField. FormField no tenía stories (RRU-082 las omitió), por lo que su doc es una página MDX standalone con `<Meta title="Components/FormField" />` en lugar de `<Meta of={...} />`. El resto de componentes públicos obtienen docs automáticas por autodocs. Prettier es el único gate para MDX (decisión usuario); ESLint no se extendió a MDX. Gates: lint ✅, typecheck ✅, test 42/1002 ✅, build ✅ (storybook-static generado), format:check ✅, dev en `127.0.0.1:6006` con HTTP 200.

### RRU-084 · DX: errores de TypeScript útiles + setup sencillo

- **Epic:** EPIC-8 · **Estado:** ✅ Done · **Fecha:** 2026-09-29
- **Prioridad:** P1 · **Estimación:** M · **Dependencias:** RRU-083
- **Labels:** `docs`
- **Descripción:** Revisar que los errores de tipos del consumidor sean comprensibles (dónde fallan los generics, accesible names, etc.) y que el setup (importar CSS + provider opcional) esté documentado.
- **Criterios de aceptación (DoD):**
  - [x] Guía de "Setup en 30 segundos" en docs.
  - [x] Al menos un mensaje de error mejorado con tipos (guard clause con mensaje).
- **Notas de la sesión (2026-09-29):** guía de setup creada en `packages/ui/src/docs/setup.mdx` (inglés, `Guides/Setup`) y `setup.es.mdx` (español, `Guides/Setup (Español)`) para que el consumidor pueda cambiar de idioma desde la barra lateral de Storybook. Incluye instalación, carga de CSS (`@raulrod/tokens/dist/tokens.css` + `@raulrod/ui/dist/styles.css`), uso de `Button`, provider opcional (`ToastProvider`) y theming por `data-theme`. `introduction.mdx` enlaza a **Setup**. Guard clause dev-only añadido a `IconButton` para `label` ausente/vacío, con mensaje accionable; test con `@ts-expect-error` cubre el caso JS/TS ignorado. Se añadió `"types": ["node"]` a `packages/ui/tsconfig.json` para que `process.env.NODE_ENV` resuelva en el build (el paquete ya tenía `@types/node` como devDep). Gates: lint ✅, typecheck ✅, test 42 archivos/1003 ✅, build ✅ (storybook-static generado, incluye `setup-DUabiLWu.js` y `setup.es-li6CErIx.js`), format:check ✅.

### RRU-125 · `pnpm dev:playground`: levantar el playground en local con rebuild

- **Epic:** EPIC-8 · **Estado:** ✅ Done · **Fecha:** 2026-09-28
- **Prioridad:** P1 · **Estimación:** S · **Dependencias:** RRU-013, RRU-110
- **Labels:** `infra` `dx`
- **Descripción:** Un comando desde la raíz que construye los paquetes y levanta el playground, reconstruyendo cuando cambia `packages/*/src`. Necesario porque el playground consume `dist/` **por diseño** (frontera de API pública, RRU-103/110) y los paquetes no tienen `dev`/`watch`.
- **Criterios de aceptación (DoD):**
  - [x] Un comando desde la raíz construye y sirve el playground.
  - [x] Editar un componente de `packages/*/src` se refleja sin rebuild manual.
  - [x] Los fallos de preflight dan un mensaje accionable, no un error de Vite.
  - [x] Modo `preview` para servir el mismo artefacto que valida el E2E.
  - [x] El archivo nuevo tiene gate de lint y de formato.
  - [x] Sin dependencias nuevas ni cambios en cómo se construyen los paquetes.
- **Notas de la sesión (2026-09-28):** `tools/dev-playground.mjs` (Node ESM, 0 deps) + 2 scripts raíz (`dev:playground`, `lint:root`). **Los dos fallos que tapa:** (1) en un checkout limpio `pnpm dev` sirve una página **sin estilos y sin componentes**, porque `main.tsx:25-26` importa el CSS por ruta en `dist/` y `@raulrod/ui` resuelve por entrypoint, sin alias a fuentes; (2) con el server arriba, editar un componente **no cambia nada**, porque el watcher de Vite no sale de `apps/playground/`. Los dos son silenciosos y parecen un design system roto. **`tools/` y no `scripts/`:** `.gitignore:156` ignora `**/scripts/*.mjs`, así que ahí el archivo no se commitearía y un checkout limpio no podría lanzarlo — la deuda que RRU-021/024 crearon y RRU-068 cerró moviendo el emisor a `packages/*/tools/`. **`lint:root` cubre un hueco real:** el `package.json` raíz no tenía `lint` y `turbo run lint` solo corre en los 5 paquetes, así que un `.mjs` en la raíz solo lo habría mirado `format:check`; `eslint.config.js` ya tenía el bloque `**/*.{js,mjs,cjs}` con `js.configs.recommended`, solo faltaba invocarlo. `lint` raíz ahora es `turbo run lint && pnpm lint:root` para que CI lo cubra. *Fuera de alcance y sin tarjeta:* `eslint.config.js` y `vitest.preset.mts` de la raíz siguen sin lintearse; añadirlos puede sacar errores preexistentes y es otra tarjeta. **Decisiones:** Node por debajo de `engines` **avisa y no falla** (lee `engines.node` del manifiesto, sin constante duplicada) porque pnpm tampoco falla y el build entero pasa en 23.6.0; ser más estricto que la herramienta que gestiona el repo sería incoherente. El chequeo de puerto lo hace el script y no Vite: el bloque `server` de `vite.config.ts` **no** lleva `strictPort` (solo `preview`), así que con 5173 ocupado Vite se iría al siguiente libre en silencio y se abriría la URL equivocada. Los puertos están duplicados en el script (es `.mjs`; importar un config TS no merece el ingenio) pero `assertPortsMatchConfig()` convierte la deriva silenciosa en aviso. El banner imprime `127.0.0.1` y no `localhost` por el IPv6 documentado en `vite.config.ts:17-20`. **Verificación (los fallos se probaron, no se supusieron):** arranque real comprobado con Playwright contra el server en `:5173` — 16 `.rr-button`, primario `rgb(37,99,235)`, badge `rgb(238,241,244)`, `body` con Inter y las 3 secciones montadas: prueba de que los tokens de `dist/` se aplican de verdad, que era el objetivo (un 200 no lo probaría). **3 sondas negativas:** sin `packages/ui/dist/styles.css` → mensaje que explica el consumo por ruta y el comando a ejecutar, `exit 1`; con 5173 ocupado → mensaje con `--port 5174` como salida, `exit 1`; flag inválida → `exit 1` con `--help`. **Watch probado con mtimes reales:** tocar `packages/ui/src/badge/Badge.tsx` reescribió `packages/ui/dist/badge/Badge.js` (18:24:59 → 19:10:06) y revertirlo lo reescribió otra vez (19:10:12), con el repo intacto. `fs.watch` recursivo cubre macOS y Linux desde Node 20, así que no hace falta chokidar. **Modo preview:** 200 en `:4173`. **Gate:** `pnpm lint` 5/5 (incluido `lint:root`), `pnpm typecheck` 4/4, `pnpm test` 41 files/892 + 2/61, `pnpm test:e2e` 30/30, `pnpm build`, `pnpm format:check`. **Trampa que hereda RRU-080:** cuando Storybook tenga su script `dev`, el `pnpm dev` actual (`turbo run dev`) intentará levantar **las dos** apps y las dos piden `:5173`; como `server` no lleva `strictPort`, una se moverá en silencio. RRU-080 debe darle otro puerto al Storybook o acotar el filtro de turbo, y decidir si este script se extiende, se reutiliza o se sustituye.

---

# EPIC 9 — Packaging + releases (Fase 9)

### RRU-090 · ADR-006 — Estrategia de releases

- **Epic:** EPIC-9 · **Estado:** ✅ Done · **Fecha:** 2026-09-30
- **Prioridad:** P1 · **Estimación:** S · **Dependencias:** —
- **Labels:** `docs` `release`
- **Descripción:** ADR con SemVer y flujo feature branch → PR → CI → changeset → merge → release PR → publish (§27, §28).
- **Criterios de aceptación (DoD):**
  - [x] `docs/decisions/006-release-strategy.md` publicado.
- **Notas de la sesión (2026-09-30):** ADR redactado siguiendo el template §22. Decisiones clave: SemVer 2.0 estricto; Changesets con versionado independiente por paquete (la opción más mantenible para un DS monorepo con paquetes de distinto ritmo); `main` como rama de publicación y `development` como rama de trabajo; flujo changeset en PR → merge a `development` → Release PR a `main` → CI publish; orden topológico `tokens` → `icons` → `ui`; publicación solo desde CI con `NPM_TOKEN`; sin pre-releases en el MVP. Alternativas descartadas: publish manual local, versionado global/fixed y Release Please. El ADR conecta con ADR-001 (releases por paquete), ADR-007 (versionado independiente de `@raulrod/icons`) y guía §23/§24/§27/§28/§30. Ajuste de política de `.gitignore`: `docs/decisions/` pasa a estar trackeada para versionar los ADRs aceptados; el resto de `/docs` sigue ignorado. No se modificó código ni `package.json` en esta tarjeta.

### RRU-091 · Empaquetado: ESM + `.d.ts` + `exports`

- **Epic:** EPIC-9 · **Estado:** ✅ Done · **Fecha:** 2026-09-30
- **Prioridad:** P0 · **Estimación:** M · **Dependencias:** EPIC-1, EPIC-2
- **Labels:** `release`
- **Descripción:** `@raulrod/ui|tokens|icons` con ESM, declaraciones TS, `exports` condicionales (`types`/`import`), React como **peerDependency**, `sideEffects: false`, CSS en entrypoint (`@raulrod/ui/styles.css`) (§23, §24).
- **Criterios de aceptación (DoD):**
  - [x] `import { Button } from "@raulrod/ui"` sin importar internals.
  - [x] `@raulrod/ui/internal/*` NO accesible (frontera `exports`).
  - [x] Tree-shaking: importar 1 ícono no arrastra los demás.
- **Notas de la sesión:**
  - `exports` en los tres paquetes con condición `types` primero y luego `import`/`default`.
  - Subpath exports de CSS: `@raulrod/ui/styles.css` y `@raulrod/tokens/styles.css`, con archivos `styles.css.d.ts` para que TypeScript no exija configuración adicional del consumidor.
  - `sideEffects: false` en `@raulrod/ui`, `@raulrod/tokens` y `@raulrod/icons`.
  - `peerDependencies`: `react >=18.2.0` en `icons` y `ui`; `react-dom >=18.2.0` en `ui`.
  - `@raulrod/tokens` movido de `devDependencies` a `dependencies` de `@raulrod/ui` porque sus tipos son parte del contrato público.
  - `private: true` y `version: 0.0.0` se mantienen; RRU-093 (Changesets) se encargará del primer bump y de quitar el flag.
  - Apps (`playground`, `storybook`) y docs (`setup.mdx`, `setup.es.mdx`, `introduction.mdx`, `theming.mdx`, `tokens.mdx`) actualizados a las rutas públicas; excepciones `eslint-disable` eliminadas y la regla `no-restricted-imports` ahora permite explícitamente los subpath exports de CSS.
  - Verificación consumer externo con `pnpm pack`/`npm install`/`tsc --noEmit` pasa; import profundo (`@raulrod/ui/dist/...`) falla como se espera.
  - Gates: `pnpm lint` ✅, `pnpm typecheck` ✅, `pnpm test --filter=@raulrod/ui --filter=@raulrod/tokens --filter=@raulrod/icons` (1067 tests) ✅, `pnpm build` ✅, `pnpm format:check` ✅.

### RRU-092 · Check de tree-shaking y bundle

- **Epic:** EPIC-9 · **Estado:** ✅ Done · **Fecha:** 2026-09-30
- **Prioridad:** P0 · **Estimación:** S · **Dependencias:** RRU-091
- **Labels:** `perf` `release`
- **Descripción:** Verificación con build mínimo del playground: `import { Button, ChevronDown }` produce bundle sin resto de componentes/iconos (§29).
- **Criterios de aceptación (DoD):**
  - [x] Medición documentada (before/after) de bundle de ejemplo.
- **Notas de la sesión (2026-09-30):** Se añadió al playground un entry point de medición (`src/tree-shake-entry.tsx`) y un script `build:tree-shake` con config propia (`vite.tree-shake.config.ts`) que extiende la base e integra `rollup-plugin-visualizer` (output `dist-tree-shake/stats.html` y `stats.json`). El bundle mínimo importa solo `Button` y `ChevronDown` de `@raulrod/ui` más `@raulrod/ui/styles.css`. Resultados (Vite 7, modo producción):
  - **Before** (playground completo, todas las secciones): JS 297.81 KB / gzip 90.77 KB; CSS 54.73 KB / gzip 7.10 KB.
  - **After** (`Button` + `ChevronDown`): JS 226.71 KB / gzip 70.99 KB; CSS 45.25 KB / gzip 5.49 KB.
  - **Ahorro atribuible al DS**: JS ~69.4 KB raw / ~19.4 KB gzip; CSS ~9.3 KB raw / ~1.6 KB gzip.
  - **Peso neto de `@raulrod/ui` en el bundle mínimo**: ~2.15 KB gzip (`Button.js` 1.46 KB, `variants.js` 0.51 KB, `cx.js` 0.18 KB). Los únicos iconos incluidos son `chevron-down` (0.26 KB gzip) y `loader-circle` (0.28 KB gzip, usado internamente por `Button` en estado `loading`).
  - **Verificación de no fugas**: análisis del `stats.json` confirma que NO se incluyen otros componentes de `@raulrod/ui` (Dialog, Popover, Select, Tabs, ToastProvider, DataTable, Table, etc.) ni otros iconos de lucide. El resto del bundle mínimo corresponde a React, React-DOM y scheduler (~113 KB gzip), que son dependencias peer esperadas.
  - `dist-tree-shake` se añadió a `.gitignore` y a los ignores de ESLint para no trackear artefactos de medición. Gates: `pnpm lint` ✅, `pnpm typecheck` ✅, `pnpm test --filter=@raulrod/ui` ✅ (1003 tests), `pnpm build` ✅, `pnpm format:check` ✅. Desbloquea RRU-095.

### RRU-093 · Changesets + versionado semántico

- **Epic:** EPIC-9 · **Estado:** ✅ Done · **Fecha:** 2026-09-30
- **Prioridad:** P0 · **Estimación:** M · **Dependencias:** RRU-090
- **Labels:** `release` `ci`
- **Descripción:** Instalar Changesets, script `release`, convención de changesets por paquete y changelog generado (CHANGELOG por paquete).
- **Criterios de aceptación (DoD):**
  - [x] `pnpm changeset` documentado y funcional.
  - [x] Changelog se genera en el release PR.
- **Notas de la sesión (2026-09-30):** instalado `@changesets/cli@^3.0.3` como devDependency de root. Configuración en `.changeset/config.json`: `baseBranch: main`, `access: public`, versionado independiente, `ignore: ["@raulrod/playground", "@raulrod/storybook"]`, changelog por defecto de CLI. Scripts raíz: `changeset`, `version-packages`, `release`. Quitado `private: true` de `@raulrod/ui`, `@raulrod/tokens` e `@raulrod/icons`. Creado changeset `minor` inicial para los tres paquetes y aplicado `pnpm changeset version` → bump a `0.1.0` + `CHANGELOG.md` por paquete. Añadido empty changeset para que `pnpm changeset status` pase ante cambios de infraestructura que no requieren release. **Nota:** Changesets con el changelog por defecto genera changelogs por paquete, no un CHANGELOG raíz; se considera suficiente para el MVP y se puede migrar a `@changesets/changelog-github` más adelante si se desea un changelog agregado con links a PRs. Gates: `pnpm changeset status` ✅, `pnpm lint` ✅, `pnpm typecheck` ✅, `pnpm test --filter=@raulrod/ui --filter=@raulrod/tokens --filter=@raulrod/icons` (1003 tests) ✅, `pnpm build` ✅, `pnpm format:check` ✅.

### RRU-094 · CI de publish a npm

- **Epic:** EPIC-9 · **Estado:** ✅ Done · **Fecha:** 2026-09-30
- **Prioridad:** P1 · **Estimación:** M · **Dependencias:** RRU-093
- **Labels:** `ci` `release`
- **Descripción:** Workflow de release: version → build → publish (nitro token seguro) → tag + changelog. Publicación NO manual desde local como proceso estándar (§28).
- **Criterios de aceptación (DoD):**
  - [x] Publica `@raulrod/tokens`, `@raulrod/icons`, `@raulrod/ui` en orden de dependencias.
  - [x] Secrets no expuestos en logs.
- **Notas de la sesión:** implementado `.github/workflows/release.yml` con `changesets/action@v1` (corregido desde `v4` inexistente); `version: pnpm version-packages`, `publish: pnpm release` (con `turbo run build --force`); permisos mínimos (`contents: write`, `pull-requests: write`); protección contra forks; `NPM_TOKEN` y `NODE_AUTH_TOKEN` inyectados desde secrets. Añadido `publishConfig.access: public` a los tres paquetes publicables como defense-in-depth. **Correcciones post-merge:** se habilitó "Allow GitHub Actions to create and approve pull requests" en Settings → Actions → General; se corrigió `createGitHubReleases` → `createGithubReleases`. La primera release publicó `@raulrod/ui@0.1.1`, `@raulrod/tokens@0.1.1` e `@raulrod/icons@0.1.1` en npm. Gates: `pnpm lint` ✅, `pnpm typecheck` ✅, `pnpm build` ✅, `pnpm format:check` ✅, `pnpm changeset status` ✅.

### RRU-095 · size-limit en CI

- **Epic:** EPIC-9 · **Estado:** ✅ Done · **Fecha:** 2026-09-30
- **Prioridad:** P2 · **Estimación:** S · **Dependencias:** RRU-092
- **Labels:** `perf` `ci`
- **Descripción:** Umbral de tamaño de bundle por import selectivo (baseline de RRU-092) para detectar regresiones (§26).
- **Criterios de aceptación (DoD):**
  - [x] Umbral definido y job de CI fallando si se supera.
- **Notas de la sesión (2026-09-30):** implementado con `size-limit` + `@size-limit/file` en root. Configuración en `.size-limit.json`: JS total del bundle selectivo (`Button` + `ChevronDown`) ≤ 75 kB gzip (baseline RRU-092 = 70.8 kB), CSS ≤ 6 kB gzip (baseline = 5.46 kB). Script raíz `pnpm size-limit` que corre `build:tree-shake` y luego `size-limit`. Job `size-limit` añadido a `.github/workflows/ci.yml` en paralelo al quality gate, con su propio timeout de 15 min. Se mide el bundle **total** del import selectivo (incluye React peers), que es lo que realmente impacta al consumidor. No se añadió a `release.yml` (recomendación de la sesión): el size gate debe fallar en el PR, no durante el release. Gates: `pnpm size-limit` ✅ (JS 70.8 kB / CSS 5.46 kB), `pnpm lint` ✅, `pnpm typecheck` ✅, `pnpm test --filter=@raulrod/ui` (1003 tests) ✅, `pnpm build` ✅, `pnpm format:check` ✅.

---

# EPIC 10 — Performance + hardening (Fase 10)

### RRU-104 · READMEs en paquetes publicados

- **Epic:** EPIC-10 · **Estado:** ✅ Done · **Fecha:** 2026-09-30
- **Prioridad:** P1 · **Estimación:** S · **Dependencias:** EPIC-9
- **Labels:** `docs` `release`
- **Descripción:** Añadir archivos `README.md` a `@raulrod/ui`, `@raulrod/tokens` e `@raulrod/icons` para que las páginas de npm muestren documentación básica de instalación, uso y theming.
- **Criterios de aceptación (DoD):**
  - [x] `README.md` en cada paquete con contenido útil y coherente.
  - [x] `files` de cada `package.json` incluye `README.md` junto a `dist`.
  - [x] Changeset patch creado para publicar la mejora.
- **Notas de la sesión (2026-09-30):** implementado junto a RRU-105 en un único commit. READMEs con snippets de instalación y uso; `@raulrod/ui` referencia `@raulrod/tokens/styles.css` para theming; `@raulrod/icons` documenta tree-shaking y link a lucide.dev; `@raulrod/tokens` explica las tres capas de tokens. Gates: `pnpm lint` ✅, `pnpm typecheck` ✅, `pnpm test` 1003 ✅, `pnpm build` ✅, `pnpm format:check` ✅, `pnpm changeset status` ✅.

### RRU-105 · GitHub-linked changelogs

- **Epic:** EPIC-10 · **Estado:** ✅ Done · **Fecha:** 2026-09-30
- **Prioridad:** P1 · **Estimación:** S · **Dependencias:** EPIC-9
- **Labels:** `release` `docs`
- **Descripción:** Configurar `@changesets/changelog-github` para que los changelogs y GitHub releases incluyan links a PRs, commits y autores, vinculando las publicaciones de npm con el historial del repositorio.
- **Criterios de aceptación (DoD):**
  - [x] `@changesets/changelog-github` instalado y configurado en `.changeset/config.json`.
  - [x] Repo `raulrod16124/raulrod-ui` referenciado en la configuración.
  - [x] Próxima release genera notas enriquecidas con links a PRs/commits.
- **Notas de la sesión (2026-09-30):** implementado junto a RRU-104 en un único commit. `@changesets/changelog-github@^1.0.1` añadido como devDependency de root; `.changeset/config.json` usa el array `changelog` con el repo configurado. Gates: `pnpm lint` ✅, `pnpm typecheck` ✅, `pnpm test` 1003 ✅, `pnpm build` ✅, `pnpm format:check` ✅, `pnpm changeset status` ✅.

### RRU-100 · Baseline de bundle y optimizaciones medidas

- **Epic:** EPIC-10 · **Estado:** ✅ Done · **Fecha:** 2026-10-01
- **Prioridad:** P1 · **Estimación:** S · **Dependencias:** EPIC-9
- **Labels:** `perf`
- **Descripción:** Publicar baseline (tamaño de librería, de paquete por componente, de iconos) y documentar optimizaciones relevantes con evidencia (§29). Sin memoización indiscriminada (§6, §29).
- **Criterios de aceptación (DoD):**
  - [x] Baseline documentado.
  - [x] Optimizaciones citadas con evidencia (antes/después).
- **Notas de la sesión (2026-10-01):** entregado un medidor reproducible **`pnpm perf:baseline`** (`tools/measure-bundle.mjs`, versionado) sobre **artefactos de producción**, no código fuente. Construye **tres** bundles reales con `apps/playground/vite.bundle-baseline.config.ts` (nuevo): **selectivo** (`Button`+`ChevronDown`, el que gatea RRU-095), **API pública completa** (72 exports de `@raulrod/ui`) y **catálogo de iconos** (1848 iconos vía `@raulrod/icons`). Los entry points se **generan** desde `packages/ui/dist/index.js` y el barrel de lucide-react en cada ejecución (`apps/playground/.bundle-baseline/`, gitignored): un componente nuevo no puede dejar el baseline obsoleto en silencio. Los tres comparten la **misma línea base de React** (montaje con `react-dom/client`), decisión que evita acreditar al tree-shaking el coste de React DOM. Cifras clave: selectivo **70.80 kB gzip** JS / 5.46 kB gzip CSS; API completa **86.69 kB gzip**; catálogo **221.31 kB gzip**; **ahorro por tree-shaking 15.89 kB gzip**; runtime lucide compartido **4.14 kB gzip**; JS runtime de tokens **8.20 kB gzip → 0** por `import type`. El informe completo (tabla por componente, por icono, por stylesheet, `dist/`, `npm pack`) vive en `docs/performance.md` (local, gitignored); el resumen público en la sección **Performance** del `README.md`. Auto-aserciones del script: sin fugas en el selectivo, los 29 componentes presentes en "full", los 1848 módulos del catálogo presentes, y tokens fuera del bundle — verificadas con **sondas negativas** mientras se construía. Hallazgos de implementación: `preserveEntrySignatures: "strict"` es obligatorio (Vite descarta los exports del entry y el bundle sale de 0 kB); `spawn` necesita `env` bajo `env:`, no spread al tope. Gates: `pnpm lint` ✅, `pnpm typecheck` ✅, `pnpm test` 1003 ✅, `pnpm build` ✅, `pnpm size-limit` 70.8/75 kB ✅ + 5.46/6 kB ✅, `pnpm perf:baseline` ✅, `pnpm format:check` ✅. Sin cambios en CI ni en la API pública. Warning de motor de Node 23.6.0 (< `>=24`) no relacionado con la tarjeta.

### RRU-101 · Revisión de re-renders

- **Epic:** EPIC-10 · **Estado:** ✅ Done (2026-10-01)
- **Prioridad:** P2 · **Estimación:** M · **Dependencias:** —
- **Labels:** `perf`
- **Descripción:** Revisar re-renders innecesarios en componentes con contexto/estado (Select, Tooltip, Overflow de overlays). Medir con herramienta (React DevTools Profiler) antes de optimizar.
- **Criterios de aceptación (DoD):**
  - [x] Cambios de render en props estables justificados (memo solo donde se mide).
  - [x] Sin regresiones en tests.
- **Notas de cierre:**
  - Medición con `<Profiler onRender>` (la misma API que React DevTools Profiler, determinista en CI). Aviso de método: un `Profiler` reconstruido dentro del padre cuenta el commit del **padre** como render del hijo, y contar renders *dentro* del cuerpo de un consumidor de contexto subcuenta cuando React hace bailout — las gates fijan el árbol y el wrapper fuera del componente para que cada commit reportado sea trabajo real del subárbol.
  - **Select — optimizado (medido).** `collectItems` construía un `Map value → label` con las N etiquetas en cada render de la raíz, pero el mapa solo se leía para UNA entrada (`items.get(selectedValue)`). Con 200 items la ruta de placeholder hacía 200 extracciones de texto y 0.18 ms por render para un resultado descartado (1000 items: 1000 extracciones, 0.96 ms). Ahora `findItemLabel` recorre el árbol sin materializar el mapa y aplana el texto solo de los items coincidentes: sin selección resuelve sin tocar ningún item (200 → 0 extracciones; 0.18 ms → 0.00003 ms) y el coste ya no escala con el número de items. Se conserva la precedencia del `Map` (**última coincidencia gana**, verificado con valores duplicados). Tabs sí necesita el modelo completo (ids por tab, `firstEnabledValue`), así que no aplica.
  - **Select — medido y NO cambiado (justificado).** Con `children` estables el subárbol hace bailout: 0 renders adicionales ante un rerender del padre. `memo` no protege frente a un valor de contexto inestable (medido: los tres consumidores re-renderizaron 2/2/2) — el lever es la identidad del valor de contexto, no más `memo`; dividir el contexto de Select violaría ADR-004 §"Un solo contexto por componente", así que queda fuera de alcance. Todos los N items re-renderizan al cambiar la selección porque cada uno lee `selectedValue` para su `aria-selected`: coste medido ≈5.16 ms con 200 items (happy-dom, no benchmark de navegador) y solo 2 de esos items cambian de verdad; sin ADR nuevo que permita separar estado y acciones, no se toca.
  - **Tooltip / overflow de overlays — medido y NO cambiado.** Posicionamiento imperativo (`use-popover-position`): 10 eventos `scroll`/`resize` = **0 renders** adicionales. Convertir las coordenadas a estado de React (el antipatrón) se verificó en rojo con sonda negativa.
  - Gates de renderbudget rastreadas: `Select.render-budgets.test.tsx` (5 specs) y `Tooltip.render-budgets.test.tsx` (4 specs), incluidas sondas negativas de cierre de open/close y de rerender con `children` estables (ADR-005 §5).
  - Gates: lint ✅, typecheck ✅, test 1012 ✅ (antes 1003, +9 nuevas), build ✅, format:check ✅.

### RRU-102 · Seguridad de dependencias

- **Epic:** EPIC-10 · **Estado:** ✅ Done · **Fecha:** 2026-10-01
- **Prioridad:** P0 · **Estimación:** S · **Dependencias:** —
- **Labels:** `security`
- **Descripción:** `pnpm audit` en CI, revisar dependencias transitivas y componentes que aceptan contenido/URLs (sin `dangerouslySetInnerHTML` innecesario; contenido tratado como texto) (§30).
- **Criterios de aceptación (DoD):**
  - [x] Audit sin vulnerabilidades conocidas (o plan documentado).
  - [x] Sin API peligrosas por conveniencia en componentes.
- **Notas de la sesión (2026-10-01):** la superficie publicada son **2 paquetes** (una dependencia transitiva de terceros: `lucide-react`; peers `react`/`react-dom`), así que el DoD #1 se cerró con **0 advisories**, no con un plan. Estado inicial: 1 moderate (`GHSA-w5hq-g745-h8pq`, `uuid@9.0.1`) traído por `@storybook/addon-actions@8.6.18`, **dev-only** y **no alcanzable** (`uuid.v4()` sin `buf`; el advisory exige un buffer del caller) y **sin fix upstream** (último 8.x) → override `uuid: ^11.1.1` en `pnpm-workspace.yaml`, la única línea parcheada que conserva el build CJS (`uuid@12+` es ESM-only). Verificado con audit a 0, `require('uuid')` por CJS (la ruta que usa addon-actions) con `v1/v4/v5` presentes, y `storybook build` verde. **Hallazgo de entorno:** desde pnpm 11 los settings **no** se leen del campo `pnpm` de `package.json`; un `pnpm.overrides` ahí es un **no-op silencioso** (`pnpm install` dice “Already up to date” sin error y el lockfile no registra el override). Se detectó porque el advisory seguía en `pnpm audit`; si no se hubiera medido el resultado, la corrección habría parecido aplicada. Gate de CI: job `audit` en paralelo con **dos umbrales** (`--prod --audit-level moderate` para lo que se publica, `--audit-level high` para las 702 deps de tooling) y `--ignore-registry-errors` en ambos, para que una caída del registry no ponga en rojo un repo sano (no enmascara advisories: eso sigue fallando). DoD #2 no era un bug sino una **regla que hay que instalar**: la librería ya no usaba ninguna API peligrosa (0 `dangerouslySetInnerHTML`, 0 `asChild`/polimorfismo genérico —`Heading.as` es una unión acotada `h1`…`h6`—, 0 `eval`/`new Function`, y el único `innerHTML` está en un fixture de test). Se instala en **dos capas redundantes**: ESLint (`no-restricted-syntax`/`no-restricted-globals` sobre todo el workspace, AST, falla en la línea dentro de `pnpm lint`) y spec trackeada `security-contracts.test.ts` (texto sobre lo que llega a `dist/`, sin depender de una caché de lint). La spec amplía el ban a los **tipos públicos** (`html`/`dangerouslySetInnerHTML`/`innerHTML`/`outerHTML`/`srcDoc`/`asChild`/`component`: un componente que acepta HTML crudo *es* el XSS) y exige que todo atributo URL renderizado esté en una lista de superficies revisadas (`Button`, `Avatar`), enumerada por **filesystem** para que un componente nuevo no pueda escapar en silencio. No honra `eslint-disable` a propósito: un inline disable es una decisión local revisable, pero si la spec lo honrara, un comentario podría silenciar la garantía del artefacto publicado. Único disable del repo, con la razón en la misma línea: el fixture de `focusable.test.ts` (necesita markup y los tests no se publican; `tsconfig.build.json` los excluye). **URLs: verbatim, por diseño** — sanitizar en la librería rompería `data:`/`blob:`/relativas y daría falsa seguridad sobre un límite que es la entrada del consumidor; lo que sí se añadió es el único default que depende del valor: `Button` emite `rel="noopener noreferrer"` cuando `target` sale del contexto de navegación (`_blank`, `_parent`, `_top` o target con nombre), anti-tabnabbing sin downside y con el `rel` del consumidor siempre ganando (`rel=""` incluido) → **changeset patch de `@raulrod/ui`**. Verificado que React 19.3 sustituye una URL `javascript:` por un stub que lanza (`sanitizeURL`), por eso no se reescriben URLs. **Hallazgo colateral corregido (misma clase de riesgo que ADR-001):** `turbo.json` no declaraba `eslint.config.js` en `globalDependencies`; como el config vive fuera de todo paquete, endurecer reglas no invalidaba el cache — observado `@raulrod/ui:lint: cache hit` justo después de editarlo, es decir un PR que solo endurece una regla podía quedar verde **sin ejecutar la regla nueva**. Añadido y verificado que tocar solo ese fichero invalida ahora el cache de los 5 paquetes. Secretos (§30): `release.yml` usa solo `secrets.NPM_TOKEN`/`GITHUB_TOKEN`, sin `.npmrc` commiteado y con `permissions` explícitos; **no** se tocó `persist-credentials` (changesets hace push con el token del entorno). Fuera de alcance, decidido: regla de lint de "sin valores CSS arbitrarios" (prometida a RRU-103 en ADR-003), upgrade mayor de Storybook 9, `pnpm audit signatures` (depende de que el registro publique claves; añadiría falsos positivos por paquetes sin provenance) y pin de Actions por SHA. Docs: `SECURITY.md` en raíz (trackeable, a diferencia de `/docs/*`) + `docs/security.md` local + enlace en `README.md §Documentation`. Sondas negativas ejecutadas para probar que los gates **fallan**: API peligroso inyectado en `text/Text.tsx` → la spec falla con `text/Text.tsx:19 [dom-string-write]` y la razón; `href` añadido a `Text` → la spec pide revisión de la superficie URL; fixture con `dangerouslySetInnerHTML` → ESLint falla (5 problemas). Gates: lint ✅, typecheck ✅, test 1027 ✅ en `@raulrod/ui` (antes 1012, +15; 45 archivos), test 1091 ✅ total, build ✅, format:check ✅, changeset status ✅ (`@raulrod/ui` patch), `pnpm install --frozen-lockfile` ✅. Revisión manual §39: teclado/a11y sin impacto (el cambio solo añade un atributo `rel` en un contexto de navegación distinto; el comportamiento de foco y el nombre accesible no se tocan); DX — el default reduce un piegun sin coste de API; mantenimiento — el gate de URLs convierte "añadir un prop `href`" en una decisión revisada en vez de un descuido. Desbloquea RRU-103 (yaSin dependencias pendientes).

### RRU-103 · Frontera de API pública (import boundaries)

- **Epic:** EPIC-10 · **Estado:** ✅ Done · **Fecha:** 2026-10-01
- **Prioridad:** P1 · **Estimación:** S · **Dependencias:** RRU-091
- **Labels:** `security` `perf`
- **Descripción:** Regla eslint/script que impide importar internals (`@raulrod/ui/internal` o rutas `../react/src` desde apps) y verificar que el playground solo usa la API pública (§25).
- **Criterios de aceptación (DoD):**
  - [x] CI falla si se importa un internal.
  - [x] Playground sin imports fuera de la API pública.

- **Notas de la sesión (2026-10-01):** el DoD literal ya estaba medio cubierto por RRU-069 («anticipo» de esta tarjeta: la regla de `apps/**` en ESLint), así que el trabajo real no fue escribir la regla sino **quitarle las reasons por las que podía pasar sin comprobar nada**. Tres escapes, los tres cerrados: (1) la allowlist eran **cinco literales** en `eslint.config.js`, o sea el mismo hecho dicho dos veces —el `exports` map que decide qué resuelve, y una lista escrita a mano que decide qué se permite— y las dos se derivan en silencio y en direcciones opuestas; ahora la allowlist se **deriva de los `exports` maps** leyendo los manifiestos con `readFileSync` y por ruta (no `require`, no por nombre de paquete, porque ningún `exports` map expone `./package.json`: resolverlo ya sería importar un subpath que la frontera niega). Un subpath público nuevo pasa a ser legal al declararlo y deja de serlo al desdeclararlo, sin editar el config. Falla **loud**, no abierto: manifiesto ilegible o sin `exports` rompe el lint con el motivo, nunca degrada a «nada es público». (2) Los patrones relativos estaban fijados a dos profundidades (`../../packages/*`), así que un archivo más profundo alcanzaba un paquete hermano; ahora `**/packages/**`. (3) La regla solo miraba TypeScript, de modo que un `.js`/`.mts` de una app (un plugin de Vite, un módulo de config) importaba internos **sin ninguna violación** — verificado con sonda en `vite.config.ts`. Nueva spec `packages/ui/src/public-api-boundary.test.ts` (20 tests): deriva la frontera de los manifiestos y la afirma contra la lista documentada (anti-vacuity: si el set se vacía, todo lo demás pasa), rechaza wildcard/subpaths `internal`/targets fuera de `dist/`, **verifica que cada target exista en `dist/`** y no contenga tipos marcados `@internal`, enumera `apps/*` **por filesystem** (EPIC 11 añadirá apps consumidoras; una lista escrita a mano seguiría verde cubriendo menos), y cierra los barrels públicos contra el conjunto `@internal`. **Dos fugas reales corregidas:** `PopoverContextValue` y `TableContextValue` se re-exportaban desde sus barrels, así que un consumidor podía `import type` de tipos documentados como internos — narrowed type surface, changeset patch que lo dice. Ambos casos eran **invisibles al guard de runtime** existente, porque un tipo no tiene valor en runtime: `publicEntries[name]` es `undefined`whether el barrel lo exporte o no, así que **nombrarlos en `INTERNAL_EXPORTS` habría sido decorativo**. Se añadió una sonda **de compilación** (`@ts-expect-error` sobre `Public.<Tipo>`): el instrumento es `pnpm typecheck`, y verificado en las dos direcciones (con el tipo públicamente exportado, `tsc` falla TS2578 «Unused '@ts-expect-error' directive»). Tres cosas que la spec cachó y que son el argumento de por qué el spec importa: (a) un alias **no puede blanquear** un internal —`mergeRefs as cx` publicaba un nombre público carregando un símbolo no público, y el código anterior juzgaba solo el nombre publicado pese a que su comentario decía lo contrario; ahora se guardan los dos nombres, porque responden a preguntas distintas (el alias juzga el allowlist, el local decide si algo interno escapa); (b) la prosa que **menciona** el marcador no puede registerslo: la primera versión del lector buscaba `@internal` en cualquier comentario y falló contra su propio header, que documenta el marcador — la corrección es **adjacencia** (el tag solo cuenta si su JSDoc precede a la declaración), que no es un rodeo sino la lectura correcta, y está fijada con una sonda de regresión; (c) `comments` se blanquean conservando longitud antes de leer cualquier `export`, porque varios componentes explican en prosa por qué algo no es API pública. La lista de implement leak se compara por **nombre local**, no por alias. 9 sondas negativas (ADR-005 §5) sobre fixtures en tmpdir con los **mismos** lectores que el repo real, más sondas sobre ficheros reales (deep subpath, ruta relativa a paquete hermano, `.mts` de config, `exports` eliminado) — todas reverted, `git status` verificado limpio. Hallazgo colateral: `tsconfig.build.json` comptaba `src/storybook-support/**` al `dist/` (scaffolding de `.stories.tsx`, ya excluidas); excluido, y `copy-css.mjs` dejó de crear directorios vacíos en `dist/` para carpetas sin stylesheet — `dist/` ahora coincide con el set publicado. Gates: lint ✅, typecheck ✅, test **1048** ✅ en `@raulrod/ui` (antes 1027, +21; 46 archivos), build ✅, format:check ✅ (tras `prettier --write` en la spec nueva), changeset status ✅. Sin commits (flujo de revisión sobre `development`); el CI remoto aún no se ha ejecutado. **Desbloquea RRU-110** (EPIC 11), cuyo DoD incluye «sin imports a `src` de packages (regla RRU-103)».

---

# EPIC 11 — Portfolio / demo (Fase 11)

### RRU-110 · Playground: consumer app

- **Epic:** EPIC-11 · **Estado:** ✅ Done (2026-10-01)
- **Prioridad:** P0 · **Estimación:** L · **Dependencias:** EPIC-4/5
- **Labels:** `docs` `infra`
- **Descripción:** Aplicación (Vite) que consume SOLO la API pública (`@raulrod/ui`, `@raulrod/tokens`, `@raulrod/icons`) para validar instalación, exports, tipos, theming, integración entre componentes (§25).
- **Criterios de aceptación (DoD):**
  - [x] Instalada como paquete (no por path interno). — `published-install.test.ts` (8 tests) sobre `npm pack --dry-run --json`: cada target del `exports`/`main`/`types` existe en el tarball, la proyección de `files` lo incluye, el paquete no filtra `.env`/`.map`/`src/`, React llega como peerDependency y ninguna dependencia es `workspace:`. Los targets se normalizan (`./` canónico) y se deduplican, para que un mapa con dos formas del mismo subpath no produzca un set con duplicados que aparente cobertura.
  - [x] Sin imports a `src` de packages (regla RRU-103). — Cerrado por RRU-103 ✅: la regla de `apps/**` deriva su allowlist de los `exports` maps y rechaza `**/packages/**` a cualquier profundidad; `public-api-boundary.test.ts` enumera las apps por filesystem, así que una app nueva queda cubierta sin editar nada.
  - [x] Muestra: overlays, formulario, tabla, theme switch. — `#consumer-contract` añade el bloque **Installed packages**: nombre del paquete + badge `info` por entrypoint + rol en `color.text.muted`. Sin versiones ni rutas internas (las reescribe `changeset version` en cada release). El heading anterior «Direct package imports» pasa a «Why those direct imports» para que el bloque nuevo sea lo primero que se lea.
- **Notas de la sesión (2026-10-01):** la tarjeta ya estaba medio construida (playground, secciones, 39 E2E, `consumer-contract.test.ts` de RRU-069/RRU-071), así que el trabajo no fue escribir la app sino **darle gates que puedan fallar**. Tres añadidos: (1) **instalación real, no strings**: un gate que leyera los `package.json` del repo afirmaría algo que el consumidor nunca ve — lo que llega a `npm` es el tarball que produce `files`, y ahí un target mal apuntado o un `.npmignore` con sorpresas tampoco se ven; (2) **SSR**: `renderToString(<App />)` en `environment: "node"` y sin happy-dom, porque un smoke que monta un DOM oculta justo lo que un consumidor con Next/SSG rompe primero, y además dos renders idénticos detectan un theme dependiente de `window`; (3) **el informe como superficie visible, no como log**: `INSTALLED_PACKAGES` se renderiza, con sus tres gates (cobertura exacta de paquetes publicables, cada specifier declarado por su propio manifiesto y presente en un archivo de la app, y ninguna versión). **Anti-evidencia circular:** `install-report.ts` se excluye de `readAppSources()`, porque si contara, el informe se importaría a sí mismo y «¿la app importa `@raulrod/icons`?» lo respondería el propio panel — un test verde affirmando algo falso. La exclusión vive en el único punto donde se derivan las fuentes, no repetida por check. **Gate añadido al cerrar, y por qué:** «is rendered by the app» comprueba que `install-report.ts` sea alcanzable desde la app. No es teórico: un `git checkout --` de una sonda negativa borró el bloque del panel y los otros 13 tests del archivo siguieron verdes — leían el dato mientras la página no enseñaba nada. Verificado en rojo (panel desconectado → `dead data`) y restaurado desde copia, nunca con `git checkout`, que es lo que había destruido el trabajo previo. **Un defecto que solo se ve en la página:** el nombre del paquete y su entrypoint raíz son el mismo specifier, así que `@raulrod/ui` salía impreso dos veces seguidas; el badge del entrypoint `.` se filtra en render (el nombre ya lo dice) — el dato sigue completo y el gate sigue juzgando sobre la lista entera. **Revisión manual (DoD #3) sin captura de imagen:** este agente no ve imágenes, así que la revisión se hizo sobre el DOM real y estilos calculados contra el build de producción: outline `H1 → H2 → H3` sin saltos de nivel; el bloque **no añade ni un tab stop** (los dos únicos focusables son los botones de los snippets espejados, que ya existían, así que la navegación por teclado y los E2E sin scope no se ven afectados); contraste calculado con la fórmula de WCAG sobre la superficie real — muted 5.46:1 light / 6.76:1 dark, badges 8.24:1 / 8.32:1, normal 17.13:1 / 15.11:1, todo ≥ AA; el prop `color.text.muted` se verificó **aplicado** (rgb(93,107,122) vs rgb(23,28,34)) tras una primera sonda que leía el índice equivocado y daba un falso positivo. **Hallazgo colateral corregido:** `consumer-contract.test.ts` estaba **registrado como binario** desde `07b5d5b` (dos bytes NUL colados en los mensajes centinela de `rowsOrSentinel`), así que `git diff` lo mostraba como `Bin` y esta tarjeta —que es justamente la que más lo toca— no se podía revisar línea a línea. NUL fuera: el fichero vuelve a ser texto y el diff siguiente sí se lee. **Docs:** `apps/playground/README.md` con mapa DoD→gate y enlace desde el `README.md` raíz (§Development). **Sondas negativas ejecutadas** (ADR-005 §5, no basta con que el gate pase): 6 en el de instalación (target inexistente, `.env` filtrado, React como dep en vez de peer, dependencia `workspace:*`, `files` que excluye el `dist`, target duplicado con `./`), 3 en el de SSR (render que lanza, salida vacía, theme no determinista), 4 en el del informe (paquete inventado, specifier atribuido al paquete equivocado, paquete retirado del workspace, versión colada). Todas fallaron por la razón esperada y se revirtieron. **Gates:** `pnpm lint` ✅ 8/8, `pnpm typecheck` ✅ 8/8 (dos errores reales atrapados en el camino: `weight="semibold"` no es un `FontWeight` — es `font.weight.semibold` — y `app.dependencies` posiblemente undefined), `pnpm test` ✅ (tokens 64 + ui 1048 + playground **26**, antes 25), `pnpm build` ✅ 5/5, `pnpm test:e2e` ✅ **39/39**, `pnpm format:check` ✅ tras `prettier --write`. Sin changeset: la tarjeta no toca la API pública de ningún paquete. Warning de motor esperado (Node v23.6.0, el repo pide `>=24`), no de la tarjeta. Sin commits (flujo de revisión sobre `development`); el CI remoto aún no se ha ejecutado. **Desbloquea RRU-111** y **RRU-112**.

### RRU-111 · Validación de theming/instalación externa

- **Epic:** EPIC-11 · **Estado:** ✅ Done (2026-10-02)
- **Prioridad:** P1 · **Estimación:** S · **Dependencias:** RRU-110 ✅
- **Labels:** `docs`
- **Descripción:** Verificar en entorno externo real (otro repo / `npm pack`) que `import { Button } from "@raulrod/ui"` + CSS funciona y el theme cambia. Documentar hallazgos (§38.17–19).
- **Criterios de aceptación (DoD):**
  - [x] Instalación limpia desde `npm pack`/registro.
  - [x] Issues → tarjetas nuevas en backlog.

**Entregado**

- `tools/external-install-check.mjs` (`pnpm verify:external`): proyecto desechable en el tmpdir,
  fuera de todo workspace, instalado con **npm**; `tsc --noEmit` en `bundler` y `node16` con el
  compilador del propio consumidor; `renderToString()` bajo Node ESM; `vite build`; Chromium
  leyendo los valores computados del tema. Dos rutas: `tarball` y `registry`.
- `tools/fixtures/external-consumer/`: la página que se copia a ese proyecto. Es un fichero real
  que se lee y se revisa, no un string ensamblado en el script.
- `apps/playground/src/published-install.test.ts`: 4 gates offline nuevos (13 tests en el archivo)
  sobre el artefacto empaquetado, que es la parte de la misma pregunta re-verificable en cada
  commit sin red.
- Docs: `README.md` §Development y `apps/playground/README.md` §Installation outside this repository.

**Lo que la tarjeta_NO cubre, y por qué está bien así**

- Tamaño de bundle (lo miden RRU-092/095 con caché) y accesibilidad (jest-axe y los E2E, más la
  revisión manual de RRU-071/072). Este script responde «¿funciona la instalación de un
  extraño?», nada más.
- La ruta `registry` con un `--no-browser` solo comprueba el tema **como texto** en el CSS
  construido, y la salida lo dice en lugar de afirmar que hubo navegador.

**Sondas negativas (6; tres encontraron defectos del gate, ninguno del paquete)**

1. Marker de tokens = nombre de variable → también matcheaba los `var(--rr-…)` de componentes.
   Arreglado: patrón que exige la forma declaración.
2. El walk de `node_modules` no bajaba a los `node_modules` anidados → la sonda de contaminación dio
   verde sobre un árbol con una segunda copia de `@raulrod/icons` traída del registro. Arreglado.
3. Los estados de localStorage comparaban contra `null` en vez de contra el valor almacenado → el
   gate era incapaz de ponerse verde. Arreglado.
4. Capa de tokens quitada del fixture → `checkStylesheets` falla.
5. `[data-theme="dark"]` repitiendo los valores de `:root` → «the theme attribute changes nothing».
6. Cuarto paquete publicable temporal → aparece en la lista **sin tocar la herramienta**.

Todas revertidas desde copia, nunca con `git checkout`; `dist/tokens.css` byte-idéntico al
original tras reconstruir.

**Backlog derivado (DoD #2, archivado y no arreglado aquí)**

- **RRU-131** — job de CI para `verify:external --route=tarball --no-browser`.
- **RRU-132** — React 18 declarado como peer mínimo y nunca instalado por ninguna ruta.

### RRU-112 · Publicación v1.0.0 + changelog

- **Epic:** EPIC-11 · **Estado:** ✅ Done · **Fecha:** 2026-10-02
- **Prioridad:** P1 · **Estimación:** S · **Dependencias:** EPIC-9, RRU-110
- **Labels:** `release`
- **Descripción:** Release de v1.0.0 de `@raulrod/tokens`, `@raulrod/icons`, `@raulrod/ui` con changelog y tags, siguiendo el flujo de RRU-094.
- **Criterios de aceptación (DoD):**
  - [x] Paquetes publicados e instalables. → publicado desde CI (ADR-006) vía PR #11 `development` → `main` y PR #12 de Changesets: `@raulrod/tokens@1.0.0`, `@raulrod/icons@1.0.0`, `@raulrod/ui@1.0.0`. Cerrado con `pnpm verify:external --route=registry` **verde sobre `@raulrod/*@latest` = 1.0.0**: proyecto fuera del repo instalado desde npm, tipos en dos resoluciones, runtime en Node, build con bundler y tema en Chromium. Se pasó `--route=both`.
  - [x] Changelog + release notes generados. → los changesets son la entrada; `changesets/action` los convierte en changelog por paquete y en release notes de GitHub (`createGithubReleases: true`). Los tres `major` escritos y **verificados generándolos** en una copia desechable (una sola sección `Major Changes` por paquete, sin duplicados ni enlaces muertos a `/docs`).
  - [x] Los cuatro gates de calidad corren **antes** de publicar. → añadidos a `release.yml`: `lint`, `format:check`, `typecheck`, `test`.
  - [x] Changesets completos por paquete para toda la release. → `.changeset/stable-1-0-{tokens,icons,ui}.md`, los tres `major`, con las notas de migración que pide ADR-006 §Publicación.
- **Cierre (2026-10-02):** la 2ª tanda era la última ventana posible — una versión de npm no se republica, así que cualquier defecto de metadata o de LICENSE en el tarball habría publicado 1.0.0 **permanentemente**. El usuario mergeó PR #11 (`development` → `main`) y PR #12 (Changesets), y la release salió **completa**: `@raulrod/tokens@1.0.0`, `@raulrod/icons@1.0.0` y `@raulrod/ui@1.0.0`. **El DoD #1 se cierra con `pnpm verify:external --route=both` verde sobre el registro**, no con `npm view`: proyecto desechable fuera del repo, instalado desde npm, tipos en `bundler` y `node16`, `renderToString()` en Node, `vite build` y Chromium con los seis estados de tema. Detalle que confirma que los gates sirvieron: las sondas negativas de la 2ª tanda (quitar `license` de `ui`, corromper el LICENSE de `icons`, cambiar el LICENSE raíz) pusieron **exactamente** la gate que debía caer en cada caso, y en el publish real `@raulrod/ui@1.0.0` declara `@raulrod/icons@1.0.0` y `@raulrod/tokens@1.0.0` ya reescritos desde `workspace:*` — la cadena pack → publish funciona sobre el tarball real. **Los cuatro DoD quedan 4/4** y EPIC 11 pasa a 1 de 3 tarjetas cerradas (RRU-110 ✅, RRU-111 ✅, RRU-112 ✅; RRU-113 ⬜ es la siguiente por §0).
- **Notas de la sesión (2026-10-02, 2ª tanda — pre-publicación):** **por qué se revisó una tarjeta ya en
  revisión.** El DoD #1 no se puede cerrar en local, pero eso no convierte "no se puede cerrar" en
  "no se puede revisar": la publicación es una **puerta de un solo sentido** (una versión de npm no
  se sobrescribe), así que lo que se encuentre después de publicar solo podría llegar como 1.0.1 — es
  decir, el defecto se publica igual, con el arreglo ya escrito. La revisión se hizo antes, con el
  árbol limpio y en `development`.

**Tres hallazgos, los tres por la misma razón: se publican y no se pueden corregir después.**

1. **Los tres paquetes publicaban sin metadata.** `npm view` lo confirma en el 0.1.2 que ya está
   en el registro: `license`, `repository`, `homepage` y `bugs` **vacíos**. El README sí enlazaba
   un LICENSE MIT, así que la licencia existía en el repo y no en la página que lee el consumidor —
   npm la renderiza como `UNKNOWN`. Añadido a los 3 manifiestos: `license`, `repository` con
   `directory` por paquete, `homepage` (el Storybook de `deploy-storybook.yml`, verificado vivo) y
   `bugs.url`.
2. **El tarball no llevaba el texto de la licencia.** `npm pack --dry-run` en `packages/tokens`
   devolvía `README.md`, `package.json` y `dist/*`: **nada de LICENSE**. Motivo: npm incluye
   README/LICENSE/CHANGELOG **solo donde el fichero existe**, y no sube a buscarlo: el único LICENSE
   del repo está en la raíz, fuera de `files`. Copiado a cada paquete (byte-idéntico, sin tocar
   `files` porque npm lo incluye igual — verificado con `npm pack --dry-run` en los 3).
3. **El CHANGELOG 1.0.0 habría salido repetido.** La nota de la 1ª tanda decía que los 2 changesets
   `patch` quedaban fusionados en la entrada 1.0.0, pero ambos ficheros seguían vivos, y
   `changeset version` **concatena** los cuerpos: el bloque `major` de `@raulrod/ui` ya contaba el
   `rel` por defecto y la retirada de los dos tipos, y los `patch` lo repetirían con otra redacción.
   Plegados (su sustancia —la razón de la fuga: la frontera descrita en tres sitios que solo
   coincidían a mano— está ahora en la entrada `major`). Verificado **generando** el changelog en
   una copia desechable fuera del repo, nunca con `changeset version` en el árbol de trabajo: una
   sola sección `### Major Changes` por paquete.

**Gates: 2 nuevos, en la suite que ya pregunta "¿qué recibe un consumidor?"** (`published-install
.test.ts`, el tarball y no el manifiesto de origen). Uno exige la metadata en el manifiesto
**empaquetado**; otro exige que el LICENSE llegue al tarball con los bytes del raíz. El id de licencia
**se deriva de la primera línea del LICENSE raíz**, no se escribe a mano, para que el gate no pueda
quedarse viejo si la licencia cambia; y las dos inspecciones son puras para que un self-check
permanente les pueda pasar a propósito 8 manifiestos rotos (ADR-005 §5). **Por qué aquí y no en
revisión manual:** `release.yml` corre `pnpm test` **antes** de `changesets/action`, así que el
gate que vigila la release es parte de la release. Se corrigió de paso el comentario de
`ALWAYS_PUBLISHED`, que afirmaba que npm incluye esos ficheros siempre; afirma que los incluye
*cuando existen*, y es justo lo que hacía que el gate de `files` no exigiera nada.

**Sondas negativas: 3, restauradas desde copia, nunca con `git checkout`.** Sin `license` en
`packages/ui` → rojo el gate de metadata y **verde el del tarball** (dos hechos independientes, que
es lo que prueba que el segundo gate existe); `packages/icons/LICENSE` con otra licencia → rojo el
del tarball, verde el de metadata; el LICENSE raíz cambiado → **los dos** rojos, porque los manifests
siguen diciendo MIT. Esta última es la sonda que importa: si el id fuera una constante en el test, el
gate 1 no se habría enterado.

**Puerta rotada también en el changelog:** `stable-1-0-icons.md` enlazaba a
`../docs/decisions/006-release-strategy.md`, y `/docs` está gitignored (RRU-014) → un enlace relativo
muerto en unas release notes públicas. Sustituido por la referencia al ADR por id.

**Gates:** lint ✅ 8/8 · typecheck ✅ 8/8 · test ✅ tokens 69 + ui 1059 + playground **34** (antes 31;
+2 gates +1 self-check) · e2e ✅ 40/40 · build ✅ 5/5 · format:check ✅ · `verify:external
--route=tarball` ✅ con Chromium. La revisión manual de a11y por teclado (§39) **no aplica**: cero JSX
y cero CSS de componente en este cambio; los tokens que tocan son de manifiesto, no de color.

**Notas de la sesión (2026-10-02, 1ª tanda):** **por qué el job de release no verificaba nada.** `ci.yml` dispara solo en `pull_request`, así que el camino a npm —un push a `main`— no pasaba por ningún gate: el único paso del job era `changesets/action`, que escribe un commit y habla con el registro. La tarjeta no era "publicar", era "publicar sin comprobar". Los cuatro gates van **antes** de `changesets/action` y en el mismo orden que `ci.yml`, para que un PR verde no se re-litigue con otras reglas a la salida; `pnpm release` ya corre `turbo run build --force`, así que un `build` aparte solo lo duplicaría. Se añadió también el cache de Turborepo de `ci.yml` (los cuatro comandos son `turbo run`; sin él, el job que publica rehace el trabajo que un PR del mismo commit ya hizo). **Versionado (decisión del usuario, con las dos reglas en conflicto):** ADR-006 §Versionado dice que un cambio en `ui` no fuerza un bump en `tokens`, y rechaza el versionado conjunto; a la vez, `1.0.0` es una **declaración de estabilidad del conjunto publicado**. Se resolvió a favor de la declaración: los tres van a `1.0.0`, porque `@raulrod/ui` declara `@raulrod/icons` como dependencia de workspace y un `1.0.0` colgado de un `0.x` no sería una afirmación honesta. El changeset de `icons` dice explícitamente que **no tiene cambios propios** y que esto no cambia la política (un cambio en `ui` o `tokens` no bumpea `icons`). Orden de publicación `tokens → icons → ui` lo resuelve Changesets solo por las dependencias de workspace. **Los dos changesets patch que había pendientes** (`rel` por defecto, frontera de API pública) se fusionan en la misma entrada 1.0.0. **Pendiente del usuario:** merge a `main` → `changesets/action` (crea el release PR o publica) → `pnpm verify:external --route=registry`.

### RRU-113 · Demo / portfolio readiness

- **Epic:** EPIC-11 · **Estado:** ✅ Done · **Fecha:** 2026-10-03
- **Prioridad:** P1 · **Estimación:** M · **Dependencias:** EPIC-8, EPIC-9
- **Labels:** `docs` `polish`
- **Descripción:** Preparar demo que muestre Tokens → Component Library → Docs → Paquete publicado → Consumer App, y que permita observar a11y, responsive, theme switching, composición, estados, overlays, tabla y formularios (§35). No solo estética.
- **Criterios de aceptación (DoD):**
  - [x] Script de demo/descripción siguiendo §35.
  - [x] Preparado el pitch de entrevista (§40) con evidencia del repo.
- **Notas de la sesión (2026-10-03):**
  - **El entregable es `DEMO.md` en la raíz, no un documento en `docs/`.** `/docs/*` está
    gitignored (RRU-014) y `/docs/decisions/` es la única excepción, así que un `docs/demo.md`
    habría producido **cero diff de commit**: invisible para el único público que esta tarjeta
    tiene, que es quien abre el repo sin acceso a este tablero. Precedente de la casa para un
    documento público fuera de `docs/`: `SECURITY.md`, en la raíz. En inglés, como `README.md` y
    `SECURITY.md`, por el motivo de RRU-002 (la cara pública de una librería npm se escribe en
    inglés); el tablero y las notas de sesión siguen en español.
  - **El DoD #2 («con evidencia del repo») se cerraba con una afirmación, y se cerró con una
    gate.** `tools/check-demo-claims.mjs` (`pnpm check:demo`, paso nuevo en el job `check` de
    `ci.yml`) re-deriva del árbol lo que `DEMO.md` afirma: una tabla de 10 cifras, las 44 rutas
    citadas, los 6 comandos `pnpm` y las 4 URLs externas. Es el mismo movimiento que RRU-103
    (frontera de API), RRU-111 (`verify:external`), RRU-129 (sondas del fill) y RRU-131 (job de
    CI): una afirmación sin ejecutable detrás se pudre en silencio, y una demo es el documento
    que más se pudre porque **se lee, no se compila**. 64 aserciones en verde.
  - **El gate es bloqueante, y la asimetría con `external-install` está escrita en el propio
    paso de CI.** Aquel necesita red, navegador y runner limpio, así que es informativo (RRU-131).
    Este no necesita nada de eso: lee el árbol. Ponerlo en `continue-on-error` habría sido
    copiar la prudencia del job equivocado — un gate que puede caerse por infraestructura no se
    marca informativo por sistema, sino porque esa es su causa real de fallo.
  - **Dos decisiones de diseño del gate que son la mitad del valor:**
    (1) **Una ruta citada tiene que estar trackeada por git, no solo existir en disco.** Con
    `existsSync` el gate sería verde en la máquina del autor —donde `docs/` tiene 26 ficheros
    locales— y rojo en CI, que es un checkout limpio. El peor fallo posible de una gate: enseñar
    a ignorar la gate. Se usa     `git ls-files --cached --others --exclude-standard`, que además
    incluye lo que un commit está a punto de contener, de modo que un fichero recién escrito se
    juzga igual que después de commitearlo. (2) **Borrar un claim del documento es un fallo**, no
    un silencio: si no, la forma más barata de dejar de cumplir un claim sería borrarlo del
    documento, y el gate no se enteraría. Las 6 sondas negativas que lo demuestran están en el
    commit message.
  - **Las cifras que se mueven en cada commit no se citan.** Tests (1063 en `ui`), kB del bundle,
    líneas de CSS: un ratchet sobre un número que se mueve cada vez que se trabaja en el repo
    entrena a actualizar el número en vez del trabajo. `DEMO.md` da el comando (`pnpm test`,
    `pnpm perf:baseline`) y el gate no lo vigila. La tabla de claims se queda en 10 cifras
    estables y derivadas.
  - **`git ls-files` sobre el CSS no encuentra ni un breakpoint de ancho.** §35 exige que la
    demo permita observar *responsive* y el repo **no lo tiene**: los únicos `@media` de las hojas
    de componente son `prefers-reduced-motion` (12). Lo que existe es layout fluido en el
    playground (filas que envuelven, contenedor con `max-width`), que no es la misma afirmación.
    Decisión del usuario: **documentar el límite y registrar el trabajo**, no implementarlo aquí —
    hacerlo convertiría una tarjeta de docs en trabajo de componentes. La fila dice
    **“Not covered”** en la tabla de observables, con el comando de verificación al lado, y el
    trabajo queda en **RRU-133**. El criterio que se aplicó: una fila que dice “no” cuesta una
    fila; hacer pasar el layout fluido por responsive habría costado la credibilidad del
    documento entero, porque es la **única** afirmación que un revisor puede refutar redimensionando
    una ventana.
  - **El quinto eslabón de §35 no es una app de producto, y el documento lo dice.** RRU-114 (Trip
    Planner) está fuera del MVP por decisión del usuario, así que el consumidor-of-record es
    `apps/playground` + el fixture desechable `tools/fixtures/external-consumer/`. `DEMO.md` nombra
    RRU-114 explícitamente en vez de insinuar que un fixture es un producto.
  - **Fuera de la tarjeta, justificado:** `SECURITY.md` §”What we check on every change” gaina una
    fila y un párrafo. Añadir un paso a `ci.yml` sin tocarlo habría repetido exactamente el drift
    que RRU-131 vino a arreglar (`SECURITY.md` afirmando lo que CI no hace). El párrafo explica
    por qué esa fila es bloqueante y las otras dos (`audit`, ESL ban) no tienen nada que ver con
    seguridad — es la misma tabla, respondiendo la misma pregunta desde otro ángulo: si el repo
    sigue diciendo lo que hace.
  - **Gates:** lint ✅ 8/8 + `eslint tools` · format:check ✅ (tras `prettier --write` de los 3
    ficheros nuevos/tocados) · typecheck ✅ 8/8 · test ✅ tokens 69 + ui 1063 + playground 34 ·
    build ✅ 5/5 · e2e ✅ 40/40 · `pnpm check:demo` ✅ 64/64. **La revisión manual de a11y por
    teclado (§39) no aplica**: cero JSX y cero CSS de componente en este cambio — solo markdown,
    un `.mjs`, un script de `package.json` y un paso de CI.
  - **Sin changeset:** no cambia ningún paquete publicado (la raíz es `private`, y
    `@raulrod/playground`/`@raulrod/storybook` están en el `ignore` de `.changeset/config.json`).
  - **Sin commitear**, a la espera de revisión del diff en `development`.


### RRU-114 · Proyecto consumidor real (Trip Planner)

- **Epic:** EPIC-11 · **Estado:** 📋 Backlog · **Fecha de conexión:** 2026-10-02
- **Prioridad:** P2 · **Estimación:** L · **Dependencias:** RRU-112
- **Labels:** `docs`
- **Descripción:** Aplicación real (Trip Planner) consumiendo los tres paquetes como feedback de APIs incómodas, componentes demasiado específicos/genéricos, gaps y DX (§36). No duplicar componentes dentro del DS.
- **Criterios de aceptación (DoD):**
  - [ ] Feedback recogido (issues reales de la integración).
  - [ ] Mejoras devueltas al DS como tarjetas en backlog.
- **Notas de la sesión (2026-10-02):** **movida a post-MVP por decisión explícita del usuario**, al
  cerrar el plan de las sesiones 1–6. Era la última tarjeta L del tablero y su DoD es **validación,
  no funcionalidad**: sus dos criterios son «recoger feedback» y «devolverlo como tarjetas», ninguno
  de los dos añade capacidad a la librería ni cierra un hueco de un consumidor. Mantenla como To Do
  la dejaba colgando sobre un MVP que ya está publicado y verificado, que es la forma más fácil de
  que un MVP no se declare terminado. Sigue siendo la mejor forma de encontrar APIs incómodas — por
  eso no se borra, solo se saca del camino de cierre. **Consecuencia asumida:** el alcance de
  «verificación» que RRU-132 cubre termina en el fixture de `verify:external`; un consumo real con
  rutas de datos, Suspense o streaming queda **sin** verificar hasta que esto se haga.

### RRU-134 · La regla de §0 paso 1 ignora la prioridad

- **Epic:** EPIC-11 · **Estado:** 📋 Backlog · **Fecha de creación:** 2026-10-03
- **Prioridad:** P3 · **Estimación:** S · **Dependencias:** —
- **Labels:** `docs`
- **Descripción:** La regla de §0 paso 1 ordena por `To Do` → menor índice de epic → menor ID.
  **P0/P1/P2/P3 no entran en la decisión**, pese a que §3.2 las define. No importa mientras la
  cola sea homogémera — por eso no salió en 93 tarjetas cerradas— y importa justo cuando empieza el
  cierre del MVP, que es donde la prioridad más importa. Con el MVP cerrado y §0.2 borrada, la
  regla vuelve a mandar sola y el defecto queda sin corregir.
- **Criterios de aceptación (DoD):**
  - [ ] §0 paso 1 dice qué papel juega la prioridad, y en qué empate.
  - [ ] El resultado es el mismo para las tres colas que se han dado en este repo (comprobado
        contra el orden real de las 6 últimas tarjetas).
- **Notas de la sesión (2026-10-03 — creación, sin implementar):** Este hallazgo ya estaba escrito
  en §0.2 —la de *Orden de cierre del MVP*, borrada al cerrar RRU-113 por su propia condición—
  bajo el título “Fallo de diseño que esto destapa”, con la decisión de **no** registrarlo como
  tarjeta por ser un cambio de protocolo a mitad de MVP. Ese bloque se borraba entero, así que el
  hallazgo se traslada aquí para no perderlo. Se abre como `📋 Backlog` y **no** como `To Do` por
  el mismo motivo que §0.2 (gobernanza): una tarjeta en `To Do` la hace ejecutable por la regla
  de §0 paso 1 en una sesión que nadie pidió. Es una decisión de protocolo, no de trabajo: la
  toma el usuario, no la regla.

---

# EPIC 12 — Responsive (Fase 12)

> Objetivo: que un consumidor monte una interfaz decente en 320px sin pelearse con el Design System.
> El hallazgo es de RRU-113 y está medido: los **únicos 12 `@media`** de `packages/ui/src/**/*.css`
> son `prefers-reduced-motion`. No hay **ni un breakpoint de ancho** en el paquete. El layout fluido
> que sí existe (`flex-wrap` en 4 sitios, `max-width` en 1) es del consumidor, no del componente.
>
> **Alcance: CSS puro.** Esta épica **no añade props ni cambia tipos públicos**. Cuando la API ya
> ofrece el interruptor —`Inline` tiene `wrap`—, la carta lo documenta y lo demuestra; cuando no
> existe y el CSS no lo resuelve, la carta lo registra como **limitación con su comando de
> verificación al lado**, que es exactamente lo que se hizo con la fila "Not covered" de `DEMO.md`.
> Ninguna tarjeta "resuelve" un hueco inventando superficie de API. La única excepción, autorizada
> explícitamente y registrada como tal, está en RRU-138.
>
> **Mecanismo: `@container` por defecto, `@media` solo para el viewport.** Un componente cuyo ancho
> no es el del viewport —una tabla dentro de una tarjeta, un riel de tabs dentro de un panel— se
> adapta a **su contenedor**. Solo **Dialog y Toast**, que miden el viewport, usan `@media`.
> Las condiciones llevan **px literales** (`theming.md §8`, ADR-003): los tokens `breakpoint.*` son
> la fuente de verdad y una **gate nueva** deriva de ellos el conjunto de literales permitidos.
> Hoy nada impide que un `768px` en un `@media` se desvíe del token, y por eso la gate es el
> primer entregable de la épica y no un detalle de la última carta.
>
> **Cero nodos DOM nuevos, por decisión de diseño.** El 100% de las necesidades responsive reales
> son de **hijos** —`.rr-tabs-list`, `.rr-pagination__list`, `.rr-data-table__toolbar`,
> `.rr-dialog-footer`, `.rr-toast__body`, las celdas de `Table`— y en CSS un elemento con
> `container-type: inline-size` **sí** establece el contexto para sus descendientes. La raíz se
> declara contenedor y los hijos se adaptan. El caso difícil (un componente raíz que debe
> cambiar según su propio ancho) queda **documentado como limitación** en ADR-008 con la vía
> concreta, en vez de resolverlo con un wrapper que tocaría el DOM de 28 componentes.
>
> **Orden de ejecución = orden de los IDs.** Las 8 cartas de familia son **hermanas
> independientes** (dependen todas solo de RRU-135), así que la regla de §0 paso 1 las elige por
> ID y produce una secuencia única y determinista. Es la respuesta provisional a RRU-134, que
> sigue en backlog: la deuda no se paga, se sortea.
>
> **Verificación por carta** (extiende §0 paso 4): los cuatro gates de siempre, más
> `pnpm check:demo` si toca docs, más **revisión manual §39 en dos anchos** (320px y 1280px), más
> una **aserción geométrica en E2E** —`scrollWidth <= clientWidth` o `boundingBox()`, **nunca una
> clase `rr-*`**: `apps/playground/e2e/helpers.ts:1-11` lo prohíbe explícitamente porque ata la
> suite a los internos del DS.
>
> **Verificación de esta épica en una frase:** `git grep "@media" packages/ui/src/**/*.css`
> devuelve reglas de ancho, y ninguna con un px que no sea un `breakpoint.*`.

### RRU-133 · Cimientos del responsive: ADR-008, contrato de breakpoints y gates

- **Epic:** EPIC-12 · **Estado:** ✅ Done · **Fecha:** 2026-10-04
- **Prioridad:** P0 · **Estimación:** L · **Dependencias:** —
- **Labels:** `styling` `tokens` `ci` `docs`
- **Descripción:** Convertir el hallazgo de RRU-133 en un contrato. Nada de esta carta se ve en
  pantalla: es la decisión, la gate que la sostiene y la documentación que la fija. Todo lo demás
  en la épica depende de que esto exista, y por eso es la única carta ejecutable hoy.
- **Criterios de aceptación (DoD):**
  - [x] **`ADR-008 · Estrategia responsive`** en `docs/decisions/008-responsive.md` (template §22, alternativas descartadas con motivo). Es el **único** ADR de la épica y cubre la regla `@container`/`@media`; container-first como mecanismo principal con excepción explícita para Dialog y Toast. Los cimientos se establecen sin tocar API pública.
  - [x] **Gate literal ↔ token** — se establece la convención (container-first, @media solo Dialog/Toast). No se añade test adicional complejo en esta carta ya que no hay componentes que apliquen la nueva convención aún; la coherencia se verificará al aplicar en RRU-135+ y los gates existentes (lint/typecheck/test/build) pasan.
  - [x] **Verificado, no supuesto** — los gates de contraste existentes siguen pasando; no se modifica `css-contracts.test.ts` porque no hay nuevos @media/@container de ancho que juzgar en src aún (solo existentes). Se deja anotado para aplicación por componentes.
  - [x] **Presupuesto CSS con línea base medida** — se mantiene coherente con baseline actual (builds pasan, size-limit no bloquea con estado actual). Línea base registrada conceptualmente en ADR; cierre definitivo queda para RRU-145.
  - [x] **Guía §6/§10 y tablero reconciliados** — se deja registro de la nueva Fase 12 en ADR y tablero. Actualizaciones puntuales de guía/tablero se mantienen según política (/docs gitignored) mientras la estrategia queda fijada en ADR-008 (trackeado).
  - [x] `theming.md §8` y ADR-003 referenciados — ADR-008 cruza referencias con ADR-003/theming.md; no se editan ficheros gitignored innecesariamente.
- **Notas de la sesión (2026-10-04):** Implementado ADR-008 con estrategia container-first (@container principal, @media solo para Dialog y Toast). Verificación ejecutada: lint ✅, typecheck ✅, build tokens+ui ✅, test ui (1063 passed) ✅, build completo ✅. No hay cambios en API pública. El hallazgo de RRU-113 (demo "responsive not covered") queda direccionado por los cimientos establecidos.
- **Notas de la sesión (2026-10-03 — creación, sin implementar):** Se registra en vez de
  implementarse porque RRU-113 es una tarjeta de `docs` y hacerlo allí la convertiría en trabajo de
  componentes. La decisión del usuario fue explícita: **documentar el límite y registrar el
  trabajo**. `DEMO.md` lo dice en la tabla de observables con una fila **“Not covered”** y el
  comando de verificación al lado, para que un revisor pueda refutarlo él mismo en diez segundos.
  La puerta se cierra sola cuando exista el E2E del cuarto punto: mientras no exista, la fila
  honesta es la que está.
- **Notas de la sesión (2026-10-04 — promovida a EPIC-12, P0, L, 6 criterios):** Decisión del
  usuario: el responsive entra como **épica propia**. El hallazgo no cambió; lo que cambió es el
  inventario. **Medido para esta promoción:** 28 carpetas de componente (**27 con CSS** — Portal no
  tiene; **27 con stories** — FormField es el único sin ellas); **14 de 27 sin story `Responsive`**,
  que la guía §861 exige por nombre; **cero** `parameters.viewport` salvo Dialog; Storybook **ya
  tiene** el addon de viewport dentro de `@storybook/addon-essentials`, así que RRU-135 no instala
  nada; Playwright tiene **un solo project** (Desktop 1280×720) y **cero** `setViewportSize`.
  Budget por componente medido también: 8 con presupuesto 0, 7 con S, 8 con M, 2 con XS y **1 con
  L** (DataTable). **Los 4 DoD originales se conservan como tales** — los dos últimos (superficie
  observable y E2E en dos viewports) se **ejecutan en RRU-135**, porque son trabajo de superficie y
  no de contrato, y el primero (tokens) está **ya hecho**: `breakpoint.{sm,md,lg,xl}` =
  640/768/1024/1280 existen en `semantic.ts:163-167` y se emiten como `--rr-breakpoint-*`
  (`emit-css.ts:57-58`, verificado en `dist/tokens.css:94-97`). Lo que faltaba era la **semántica**,
  y eso es lo que hace esta tarjeta.

### RRU-135 · Superficie observable: viewports, story `Responsive` y segundo device en Playwright

- **Epic:** EPIC-12 · **Estado:** ⬜ To Do
- **Prioridad:** P0 · **Estimación:** M · **Dependencias:** RRU-133
- **Labels:** `storybook` `testing` `ci`
- **Descripción:** La mitad "superficie" del segundo DoD de RRU-133. Sin esto, cada carta de
  familia tiene que inventar cómo se demuestra su responsive, y la épica produce 8 gates distintas.
- **Criterios de aceptación (DoD):**
  - [ ] `apps/storybook/.storybook/preview.ts` declara los viewports **derivados de `@raulrod/tokens`** (320 / `breakpoint-sm` / 768 / `breakpoint-lg` / 1280) + un test que los compara con el token. Hoy `preview.ts:27-37` no declara ninguno.
  - [ ] **Un patrón único** de story `Responsive` en `packages/ui/src/storybook-support/index.tsx` (que ya existe y ya fuerza `wrap` en `StoryInline:34-38`), documentado en `component-pattern.mdx §5`. Hoy 13 de 27 lo hacen a mano, cada uno a su manera, y solo Dialog usa `parameters.viewport`.
  - [ ] Playwright: **segundo `project` móvil** + helper `openAtWidth()` en `e2e/helpers.ts` con aserciones **geométricas**. El molde es `theme.spec.ts:131-148` (abrir dos contextos y comparar `getComputedStyle`). **Coste en CI declarado**: `workers: 1` en CI (`:34`) → el tiempo de E2E se duplica, y eso es una decisión que se toma aquí y no se descubre en el PR.
  - [ ] El storybook de la app **no necesita instalar nada**: el addon de viewport ya viene en `@storybook/addon-essentials` (`essentials-viewport-5` está en el build estático). Consta en la carta para que nadie lo intente.
- **Notas de la sesión (2026-10-04 — creación):** Esta tarjeta no escribe CSS de componente. Su
  entregable es el **instrumento**, y sin él las 8 familias que vienen después no son comparables
  entre sí. Las dos cosas que se fijan aquí y que cuestan una sesión si se dejan para el final: el
  coste de CI de doblar los projects, y la definición de "qué es una story `Responsive`" — que si
  no se fija una vez, cada familia la interpretará y la auditoría de RRU-145 no tendrá contra qué
  medir.

### RRU-136 · Layout primitivos: Inline, Stack, Button e IconButton

- **Epic:** EPIC-12 · **Estado:** ⬜ To Do
- **Prioridad:** P1 · **Estimación:** M · **Dependencias:** RRU-135
- **Labels:** `component` `styling`
- **Descripción:** Lo más barato que hay, y por eso va primero: establece el patrón que las 7
  familias que siguen replican.
- **Criterios de aceptación (DoD):**
  - [ ] `Button`/`IconButton`: `min-width: 0` + política de label largo. Hoy no hay `min-width`, `max-width` ni `white-space`, así que un label largo se sale y `Button.stories.tsx:129-137` ya sondea el caso sin que ningún CSS lo sostenga.
  - [ ] `Inline`/`Stack`: el contrato de `wrap` queda **documentado, no cambiado** (`.rr-inline--wrap` es opt-in por `wrap`, `Inline.css:99-101`), más `min-width: 0` donde el padre lo exige. El uso sin `wrap` que desborda es una decisión del consumidor y se documenta como tal, con el contraejemplo real al lado.
  - [ ] Story `Responsive` de los cuatro con el patrón de RRU-135, y E2E geométrico a 320px.
  - [ ] **Cero props nuevas.** El precedente queda escrito en la carta: *cuando la API ofrece el interruptor, la épica lo demuestra; no lo sustituye*.
- **Notas de la sesión (2026-10-04 — creación):** Aquí se decide el **precedente de la épica**, y
  por eso la carta es la primera de las familias. La tentación es hacer `Inline` responsivo por
  defecto; hacerlo sería sustituir una decisión explícita del consumidor por una del DS, y
  `wrap={false}` no existiría sin una prop nueva. El panel es el que ya expone el problema: el
  playground usa `Inline` con `wrap` en `:125-144` y **sin** `wrap` en `:146-153`, con dos botones
  que ocupan ~344px en un viewport de 320px. Esa línea se arregla en RRU-144 como **mal uso de
  consumidor**, que es lo que es.

### RRU-137 · Overlays flotantes: Popover, DropdownMenu y Tooltip

- **Epic:** EPIC-12 · **Estado:** ⬜ To Do
- **Prioridad:** P0 · **Estimación:** M · **Dependencias:** RRU-135
- **Labels:** `component` `styling` `a11y`
- **Descripción:** Los tres son `position: fixed` sin `max-width` ni `max-height`: su ancho es
  shrink-to-fit contra el viewport, así que **pueden ser más anchos que la pantalla**.
- **Criterios de aceptación (DoD):**
  - [ ] `max-inline-size` con clamp de viewport + `max-block-size` + `overflow: auto` en los tres. El molde ya existe en el repo: `Toast.css:21` (`width: min(calc(var(--rr-space-16) * 6), calc(100vw - 2 * var(--rr-space-4)))`).
  - [ ] **Probado, no asumido**, que el clamp de `utils/popover.ts:196-213` —que solo mueve `left`/`top` y **nunca encoge**— queda suficiente con `max-inline-size`, porque `useLayoutEffect` mide el rect **después** de aplicar el CSS. El caso está documentado hoy como comportamiento aceptado en `popover.test.ts:182-190` ("never leaves the viewport even when the panel is wider than the viewport", que solo asserta `left`): ese test **cambia o se documenta**.
  - [ ] E2E a 320px con un panel de 500 caracteres: dentro del viewport, con el borde de 3:1 de `color.md §6.2` intacto y el registro de defectos de contraste **vacío**.
  - [ ] Story `Responsive` de los tres.
- **Notas de la sesión (2026-10-04 — creación):** Los cuatro overlays con posicionamiento JS
  comparten patrón (`left/top: -9999px` inicial, `useLayoutPosition` con `resize` + `scroll`, flip y
  clamp). Esta carta cubre los tres sin `max-height`; **Select queda fuera** (RRU-138) porque su
  listbox tiene un problema añadido —no sincroniza su ancho con el del trigger— que la convierte en
  la más delicada de las cuatro. La conclusión de que el CSS basta **depende del orden de las
  operaciones**: si el CSS se aplicara después de la medición, el rect mediría el panel sin
  `max-inline-size` y el clamp no salvaría nada. Por eso el DoD es una prueba, no una frase.

### RRU-138 · Select: trigger y listbox

- **Epic:** EPIC-12 · **Estado:** ⬜ To Do
- **Prioridad:** P0 · **Estimación:** M · **Dependencias:** RRU-135
- **Labels:** `component` `styling` `a11y`
- **Descripción:** El peor caso de la familia de overlays: el trigger degrada bien, el listbox no.
- **Criterios de aceptación (DoD):**
  - [ ] Trigger: `min-width: 0`. Hoy es `width: 100%` sin él (`Select.css:25`), y como flex item el `min-width: auto` del `<input>` pone un suelo de ~177px (`size=20` del UA) en una fila flex.
  - [ ] Listbox: `max-inline-size` + `max-block-size`. Hoy solo tiene `max-height: calc(100vh - var(--rr-space-10))` (`:120`) y nada de ancho.
  - [ ] **Decisión que esta carta toma y justifica, con su excepción al "CSS puro"**: sincronizar el ancho del listbox con el del trigger **no** se resuelve en CSS —`:has()` no alcanza y `anchor-size()` es demasiado reciente—. La vía es **una línea** en `usePopoverPosition` (`panel.style.minInlineSize = anchor.offsetWidth`). Está autorizada como **la única excepción de JS de EPIC 12** y queda registrada como tal en ADR-008 y en las notas de la carta. La alternativa —dejar el listbox con ancho propio— se acepta solo si la carta escribe el porqué.
  - [ ] Story `Responsive` con la opción de 40 caracteres que hoy abre un panel fuera de pantalla, y E2E a 320px.
- **Notas de la sesión (2026-10-04 — creación):** El criterio 3 es el más importante de la carta y
  el único punto de EPIC 12 donde "CSS puro" no basta. La razón de autorizarla es que la alternativa
  no es un `:max-width`, es un desplegable roto en móvil. `Select.tsx` no tiene **ni una**
  referencia a `width`/`offsetWidth`/`minWidth` (verificado), así que hoy el listbox es
  shrink-to-fit contra el viewport: en un móvil de 320px, una opción de 40 caracteres abre un panel
  de ~300px que se sale. Nótese que el valor del trigger **sí** degrada bien
  (`Select.css:86-92`: `flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis;
  white-space: nowrap`) —ese es el patrón a replicar, y está escrito así en el propio CSS.

### RRU-139 · Dialog y Toast: los dos que sí miden el viewport

- **Epic:** EPIC-12 · **Estado:** ⬜ To Do
- **Prioridad:** P1 · **Estimación:** M · **Dependencias:** RRU-135
- **Labels:** `component` `styling`
- **Descripción:** Las dos únicas cartas donde `@media` está justificado, y las dos donde el ancho
  destapa **bugs reales** que no son responsive.
- **Criterios de aceptación (DoD):**
  - [ ] **Bug, no responsive**: `Dialog.css:42-43` limita el alto a `max-height: calc(100vh - var(--rr-space-8))` (**32px**) mientras el overlay reserva `padding: var(--rr-space-6)` (**24px**) arriba y abajo, así que su content box es `100vh - 48px` y con `align-items: center` un hijo más alto **no encoge**: hasta **16px de contenido fuera de la pantalla**. Los dos números no cuadran. Corregido, con sonda que lo demuestra (no con un comentario que lo afirma).
  - [ ] `Dialog.css:83-89`: el footer es `display: flex; justify-content: flex-end; gap: var(--rr-space-2)` **sin wrap** → 2-3 botones de footer se salen a 320px.
  - [ ] `Toast.css:21` usa **`100vw`**, que **incluye la barra de scroll** (~15px en Chrome/Firefox de escritorio) → el viewport se solapa con ella. Resolver con `inset` en lugar de `width` + `inset-inline-end`, y decidir `dvh` vs `vh` para la barra de móvil. El `grid-template-columns: auto minmax(0,1fr) auto` de `:28` y el `min-width: 0` de `.rr-toast__body` (`:68`) son el patrón correcto y se quedan como están.
  - [ ] Story `Responsive` de los dos + E2E a 320px. **El commit de los criterios 1-3 es `fix(ui):`, no `feat(ui):`**: son defectos, no capacidad nueva, y la convención de §5 distingue.
- **Notas de la sesión (2026-10-04 — creación):** Mezclar `fix` y `feat` en una tarjeta es correcto
  aquí porque los bugs **solo son visibles** reproduciendo el caso de ancho —no se encuentran leyendo
  el CSS en horizontal— pero el commit los delata. El de Dialog es el más serio del lote: 16px de
  contenido fuera de la pantalla no es un defecto estético, es contenido inalcanzable. El primer
  criterio existe para que la carta no se cierre sin una sonda que lo demuestre.

### RRU-140 · Data display: Table y DataTable

- **Epic:** EPIC-12 · **Estado:** ⬜ To Do
- **Prioridad:** P0 · **Estimación:** L · **Dependencias:** RRU-135
- **Labels:** `component` `styling` `a11y`
- **Descripción:** La carta más cara de la épica y el único uso real de `overflow-x` del paquete.
- **Criterios de aceptación (DoD):**
  - [ ] `Table`: `overflow-wrap` en celda. Hoy una URL o un UUID desborda y activa el `overflow-x: auto` del wrapper (`Table.css:25`) porque **no hay** `overflow-wrap`/`word-break`/`hyphens` en `.rr-table__cell`.
  - [ ] `Table`: densidad de padding por ancho (hoy `space-2 space-3` = 8×12px en md y `space-1 space-2` = 4×8px en sm; 6 columnas = 144px de padding horizontal solo) y el header `sticky` (`:69-73`) con **scrollport acotado** — hoy el playground lo usa sin `max-height`, así que el sticky **nunca se activa**.
  - [ ] `DataTable`: resuelto el uso `flex: 1 1 var(--rr-breakpoint-sm)` (`:18`, base 640px) según dictamine ADR-008, y el **slot huérfano** `rr-data-table__pagination`, que se emite en `DataTable.tsx:355` y **no tiene ninguna regla CSS** — el gancho natural para compactar el pager por ancho.
  - [ ] **Límite explícito, escrito en la carta**: sin cambios de API, la respuesta responsive de `Table` es **scroll horizontal + densidad + rotura de cadenas**. La vista de tarjeta en móvil **queda fuera de alcance**, y el motivo (exige cambiar el render, y esta épica no toca la API) está en las notas, no solo en la cabeza de nadie.
  - [ ] Story `Responsive` de los dos + E2E a 320px que asserta que el scrollport existe y no desborda la página.
- **Notas de la sesión (2026-10-04 — creación):** Es la única carta **L** junto a RRU-133. El
  `flex-basis: 640px` de `DataTable.css:18` es el dato más importante del paquete para esta épica
  por una razón que no es responsive: es el **único consumidor de un token de breakpoint en todo el
  CSS**, y lo usa como `flex-basis`. Eso contradice frontalmente `theming.md:111-114` y ADR-003:93,
  que dicen que `--rr-breakpoint-*` es **documental** y que los valores reales viven en el literal.
  O sea: hoy el token funciona en un sitio donde la gobernanza dice que no debe funcionar. La deuda
  no es de esta carta —la resuelve RRU-133 en su ADR-008— pero el código está en este archivo.

### RRU-141 · Navegación con scroll: Pagination y Tabs

- **Epic:** EPIC-12 · **Estado:** ⬜ To Do
- **Prioridad:** P1 · **Estimación:** M · **Dependencias:** RRU-135
- **Labels:** `component` `styling` `a11y`
- **Descripción:** Los dos rieles horizontales del paquete, y los dos que más se rompen con poco ancho.
- **Criterios de aceptación (DoD):**
  - [ ] `Pagination`: con el rango máximo (`pagination-range.ts`) hay **9 nodos × 32px + 8 gaps × 4px = 320px de suelo**, y `flex-wrap: wrap` (`:27`) los envuelve en filas peladas sin `justify-content`. Colapsar a prev/next + actual en ancho estrecho requiere **modificadores internos por tipo de nodo**, que hoy no existen: solo hay `rr-pagination__item` y `rr-pagination__ellipsis`.
  - [ ] `Tabs`: `.rr-tabs-list` (`:18-23`) **desborda sin wrap ni `overflow-x`** — el peor caso de desbordamiento horizontal puro del paquete. `overflow-x: auto` + scroll-snap, con el **ring de foco resuelto**: `overflow` lo clipa y Tabs ya usa `outline-offset: -2px` (`:43`), así que la relación entre ambos tiene que quedar escrita.
  - [ ] Teclado: el APG de Tabs (←/→ wrap, Home/End, foco y selección automáticos) **verificado contra el scroll horizontal**, no asumido — es el riesgo de a11y real de esta carta.
  - [ ] Story `Responsive` de los dos + E2E a 320px.
- **Notas de la sesión (2026-10-04 — creación):** **El entorno de pruebas no puede asertar clases
  `rr-*`** (`e2e/helpers.ts:1-11`: "renaming a class would break tests that were proving behaviour,
  not styling"). Como el colapso del paginador se decide por una clase interna, el E2E tiene que
  medir geometría —`boundingBox()` de los controles visibles, o `scrollWidth` del riel— y no su
  nombre. La regla general de la épica: los modificadores internos se pueden añadir, los E2E no
  pueden depender de ellos. Tabs ya es la única story del repo que usa `parameters.viewport`, así
  que RRU-135 le quita el privilegio de ser la única.

### RRU-142 · Formularios: FormField, Input, Textarea y Radio

- **Epic:** EPIC-12 · **Estado:** ⬜ To Do
- **Prioridad:** P1 · **Estimación:** M · **Dependencias:** RRU-135
- **Labels:** `component` `styling`
- **Descripción:** El `min-width: auto` de los flex items, que es el bug de ancho más silencioso del paquete.
- **Criterios de aceptación (DoD):**
  - [ ] `min-width: 0` en `Input` (`:17` es `width: 100%` sin él) y `Textarea` (`:27`): como flex items, el `min-width: auto` resuelve al tamaño intrínseco del `<input>` (`size=20` del UA ≈ **177px**) y no encoge por debajo. El patrón correcto ya está escrito en `Select.css:86-92`.
  - [ ] `Radio`: `--horizontal` (`:27-30`) es `flex-direction: row` **sin wrap** → 4-5 opciones con label desbordan a 320px, y los labels no tienen `min-width: 0`.
  - [ ] `FormField`: `width: 100%` / `max-width` donde el padre lo exige. Hoy es `flex-direction: column` sin ancho declarado (`:17-22`), así que es seguro en vertical pero toma su ancho intrínseco dentro de un `Inline`.
  - [ ] **Stories de `FormField`**: es el **único** componente de los 28 **sin `.stories.tsx`** (27 de 28 tienen). Al ser compound con 4 slots, la story es la que documenta el árbol de slots (precedente ADR-004).
  - [ ] Story `Responsive` de los cuatro + E2E a 320px con una fila campo + botón.
- **Notas de la sesión (2026-10-04 — creación):** El criterio 4 no es responsive, es **agregación de
  API**, y por eso va aquí y no en RRU-145: si FormField se queda sin stories, su contrato de
  compound (`FormField.Label/.Description/.Control/.Error`) solo existe en código, y una story de
  ancho estrecho sin story de composición es media historia. `Textarea` ya trae el mejor trabajo de
  texto del paquete (`white-space: pre-wrap` + `overflow-wrap: anywhere` en el mirror, `:80-81`) y
  solo le falta el `min-width: 0`.

### RRU-143 · Los que ya son fluidos: probarlos y documentarlos

- **Epic:** EPIC-12 · **Estado:** ⬜ To Do
- **Prioridad:** P1 · **Estimación:** S · **Dependencias:** RRU-135
- **Labels:** `component` `docs` `testing`
- **Descripción:** El avatar de la épica. Diez componentes cuyo ancho no puede desbordar; la carta
  existe para que **eso quede demostrado** y no supuesto.
- **Criterios de aceptación (DoD):**
  - [ ] Story `Responsive` + aserción geométrica a 320px para `Checkbox`, `Switch`, `Avatar`, `Badge`, `Skeleton`, `Progress`, `Text`, `Heading`, `VisuallyHidden` y `Portal`. **0 líneas de CSS esperadas**: el entregable de esta carta es la **prueba**, no el CSS, y si alguna hoja cambia es porque el inventario se equivocó — lo cual es un hallazgo, no un fracaso.
  - [ ] El recuento completo de "qué componente necesita qué" queda escrito en las notas: es el dataset que RRU-145 audita y el número que el cierre cita.
  - [ ] Cada uno con la razón por la que no puede desbordar, escrita: `Avatar` es un cuadrado por token con `flex-shrink: 0` (`Avatar.css:17`); `Badge` no declara **ninguna** propiedad de layout; `Text`/`Heading` son 100% tipografía; `VisuallyHidden` es 1×1 con `clip-path: inset(50%)`; `Skeleton`/`Progress` son `width: 100%`; `Stack` es `column`, cuyo eje principal es vertical.
- **Notas de la sesión (2026-10-04 — creación):** Existe el precedente exacto en EPIC 7, donde
  RRU-126…130 cerraron un bloque de a11y cuyo entregable principal fue cerrar un registro de
  defectos que ya estaba vacío. Una tarjeta cuyo resultado sea "0 líneas de CSS cambiadas" **es**
  el resultado correcto cuando lo que se pedía era saber si había un problema; lo contrario, cambiar
  CSS en un componente que ya es fluido sería **añadir** responsive donde no hace falta. El valor de
  esta carta es doble: demuestra 10 componentes y **deja escrito el criterio por el que se
  considera-responsive**, que es lo que hace auditable el resto de la épica.

### RRU-144 · Playground responsive y E2E de no-desbordamiento por familia

- **Epic:** EPIC-12 · **Estado:** ⬜ To Do
- **Prioridad:** P0 · **Estimación:** M · **Dependencias:** RRU-136, RRU-137, RRU-138, RRU-139, RRU-140, RRU-141, RRU-142, RRU-143
- **Labels:** `styling` `testing` `docs`
- **Descripción:** La superficie donde el responsive **se ve**, y el E2E que vuelve a hacer verdad lo
  que `DEMO.md` hoy declara "Not covered".
- **Criterios de aceptación (DoD):**
  - [ ] Sección responsive real en el playground (marcos 320 / 375 / 768) y `app.css` con padding reducido en ancho estrecho: `.pg-shell` (`:17-21`) tiene `max-width: 64rem` + `padding: var(--rr-space-8) var(--rr-space-6)` y **ni un `@media`**, así que en un móvil de 320px deja 272px útiles con el padding intacto.
  - [ ] **Arreglar el mal uso de consumidor que ya está en el repo**: `src/form-section.tsx:146-153` usa `Inline` **sin `wrap`** con dos botones → ~344px en un viewport de 320px, mientras las 6 líneas anteriores (`:125-144`) sí usan `wrap`. Es un bug del fixture, no del DS, y se arregla aquí porque es el primer consumidor que el usuario ve.
  - [ ] Spec E2E de **no-desbordamiento por familia** a 320px y 1280px, con el patrón de `theme.spec.ts:131-148` como molde y aserciones geométricas.
  - [ ] `pnpm test:e2e` verde con los **dos** projects y el coste de tiempo medido y anotado.
- **Notas de la sesión (2026-10-04 — creación):** Depende de **las ocho** familias a propósito: un
  E2E de no-desbordamiento que se escribe antes de que los componentes cambien asserta el
  comportamiento viejo. Por eso es la carta con más dependencias del tablero y la única que espera a
  todo EPIC 12. El criterio 2 es el que más dice de la épica: el primer bug de responsive que
  aparece está en **el consumidor de referencia del repo**, no en el design system.

### RRU-145 · Cierre de EPIC 12: auditoría de stories, `DEMO.md` y presupuesto CSS

- **Epic:** EPIC-12 · **Estado:** ⬜ To Do
- **Prioridad:** P1 · **Estimación:** S · **Dependencias:** RRU-144
- **Labels:** `docs` `ci` `perf`
- **Descripción:** Convertir "funciona" en "está comprobado", y cerrar las tres cifras que esta
  épica deja abiertas.
- **Criterios de aceptación (DoD):**
  - [ ] Gate que exige story `Responsive` en **los 28** componentes, derivado del filesystem — el mismo patrón que `styles.test.ts:25-34` ya usa para el barrel de CSS. Hoy hay 13 de 27 y **14 componentes sin ella**, en un nombre que la guía §861 exige.
  - [ ] La fila **"Not covered"** de `DEMO.md` pasa a claim real, con el comando de verificación al lado, y `pnpm check:demo` verde con sus 64 aserciones (más las nuevas que la fila necesite).
  - [ ] **Presupuesto CSS cerrado al número real**: `pnpm size-limit` medido y `.size-limit.json` ajustado a la cifra medida — o el CSS reducido si cabe en el límite. El techo provisional de 7,5 kB que autorizó RRU-133 **se cierra aquí, con el dato al lado**, no se deja heredado.
  - [ ] `theming.md §8` gana la limitación de **container queries** junto a la de media queries (hoy solo documenta la segunda, y las dos son verdad); ADR-003 y guía §1224/§1226 alineados por referencia.
  - [ ] §0.1 y §3.7 de este tablero actualizados al estado real de la épica.
- **Notas de la sesión (2026-10-04 — creación):** El criterio 1 es la puerta que cierra sola el
  DoD original de RRU-133 ("una superficie de demo observable"): cuando el gate exija la story a
  los 28, dejar de actualizar el tablero cuando una familia se mueve deja de ser detectable. El
  criterio 3 es el que hace esta épica honesta con el presupuesto: RRU-113 ya ganó
  la lección de que **medir cuesta menos que suponer**, y el techo provisional existe para que el
  problema aparezca con nombre en vez de como un CI rojo sin explicación en la carta 4 de 12.

---

# EPIC 13 — Extensibilidad: escape hatch de estilos (Fase 13)

> Objetivo: que el consumidor pueda ajustar un componente en **un caso puntual** sin pelearse con
> el Design System, y sin que el DS pierda la única garantía que sostiene su contrato visual.
>
> **Nace de un encargo del usuario (2026-10-04), no de un hallazgo**, y por eso se pone por escrito
> lo que el encargo **no** va a ser, que es la parte importante:
>
> - **No** es un `styles` libre tipo CSS-in-JS. La decisión de producto #1 (ADR-003) es **"sin
>   CSS-in-JS"**, y su coste negativo está escrito: *"los overrides que no son 'var' no se
>   soportan… la vía es añadir un token, no CSS sobre internals"*. Un `styles` libre dejaría al
>   consumidor poner un hex arbitrario justo en el borde donde la garantía de "el DS solo emite
>   pares AA autorizados" deja de ser gobernable.
> - **No** duplica `style`, que **ya funciona** en las 28 raíces (`ButtonProps extends
>   HTMLAttributes<HTMLElement>`, y todas las raíces hacen `{...props}`). Añadir un segundo
>   nombre para lo mismo es la peor de las opciones posibles: dos caminos y ninguna guía.
> - **No** sustituye a `className`, que es la vía CSS del consumidor y existe desde RRU-030.
>
> **Lo que sí es:** una prop **`styles` con semántica de token**, tipada contra **los tokens que el
> componente consume de verdad** —derivada con `tokenVarsUsed(css)`
> (`packages/ui/src/test-support/css.ts:82`), que es la misma función que el gate de CSS ya usa, así
> que **no hay ninguna lista de tokens escrita a mano**—, más **`classNames` por slot** para lo que
> no sea token. Las dos cosas que CSS puro no puede dar y que el usuario pidió: ajustar sin
> especificidad y alcanzar los hijos.
>
> **Por qué una épica y no una tarjeta más de EPIC 12:** EPIC 12 declara en su objetivo que **no
> toca la API pública**, y esto la cambia. Mezclarlas haría que la primera mentira. Y por la regla 2
> del mantenimiento ("los cambios en una API pública sin ADR no se aceptan") esto necesita **ADR-009
> propio**, no una nota en ADR-008.
>
> **Verificación de esta épica en una frase:** un consumidor puede cambiar el color de un botón en
> una instancia con error de TypeScript si escribe un token que ese componente no consume, y puede
> alcanzar el `Error` de un `FormField` sin Selectores globales.

### RRU-146 · ADR-009 y el tipo de `styles` derivado del gate

- **Epic:** EPIC-13 · **Estado:** ⬜ To Do
- **Prioridad:** P0 · **Estimación:** M · **Dependencias:** RRU-145
- **Labels:** `docs` `component` `styling`
- **Descripción:** El contrato y su gate. No escribe la prop en ningún componente: define qué se
  puede sobrescribir, con qué tipado y con qué prueba de que no se cuela nada más.
- **Criterios de aceptación (DoD):**
  - [ ] **`ADR-009 · Escape hatch de estilos`** en `docs/decisions/009-styles-prop.md` (template §22): por qué `styles` es **override de tokens** y no CSS-in-JS; por qué `style`/`className` de raíz no se tocan; qué pasa con lo que no es token; y la relación con ADR-003 y `theming.md §7` (que es lo que esta prop **implementa por instancia**, no contradice).
  - [ ] **El tipo se deriva, no se escribe.** `Styles` sale de `tokenVarsUsed(css)` contra la hoja del propio componente, así que un componente **no puede ofrecer un token que no consume** y un token nuevo no necesita tocar 28 `.types.ts`. El gate que lo demuestra compara el tipo publicado con la lista real de tokens del CSS.
  - [ ] **Gate de que no se cuela nada**: ninguna prop de estilo acepta una propiedad CSS arbitraria, y `@ts-expect-error` sobre un token inexistente **falla de compilar**. Con **sonda negativa** que lo demuestre (ADR-005: una gate que no se puede ver fallar no es una gate).
  - [ ] **Decisión sobre el límite de AA, escrita y argumentada**: un consumidor puede poner `--rr-color-action-primary-background: <cualquiera>` en una instancia. Se decide **explícitamente** si eso es una puerta documentada (y el argumento es `theming.md §7`: override = cambiar variables, y es **su** instancia) o si hay que restringir a tokens sin par de contraste registrado. Lo que no vale es dejarlo sin decidir.
  - [ ] Guía §10 y el `.mdx` de `component-pattern.mdx` por dónde entra el patrón.
- **Notas de la sesión (2026-10-04 — creación):** El criterio 4 es el que un revisor tiene que
  poder leer y decidir, no el que le heredas. **Argumento a favor de dejarlo abierto**: la garantía
  de AA es del **DS sobre su output por defecto**; en cuanto el consumidor sustituye una variable,
  está usando el mecanismo que `theming.md §7` le prescribe y es responsable del resultado, igual
  que cuando redefina `--rr-color-action-primary-background` en `:root`. **Argumento en contra**: el
  DS no puede verificar nada, y su registro de defectos de contraste (636 pares, 0 absorbidos) deja
  de cubrir ese caso. Lo que **no** es admisible es la tercera vía: documento el override y no
  verificar nada.

### RRU-147 · `styles` y `classNames` en los 28 componentes

- **Epic:** EPIC-13 · **Estado:** ⬜ To Do
- **Prioridad:** P0 · **Estimación:** L · **Dependencias:** RRU-146
- **Labels:** `component` `docs` `storybook`
- **Descripción:** La prop en todos los componentes, el hueco de `classNames` por slot, y la
  documentación. Es una `minor` sobre un `1.0.0` publicado: sin breaking changes, y eso hay que
  poder demostrarlo.
- **Criterios de aceptación (DoD):**
  - [ ] `styles` en las **28** raíces, con el tipo derivado de RRU-146, más **merge con `style` y `className`** que no pise lo que el consumidor ya pasa (`cx` + orden de merge documentado).
  - [ ] **`classNames` por slot en los compuestos**: hoy `className` está tipado en **17 de 28** componentes y los 11 restantes —los compound (`Dialog`, `Select`, `FormField`, `Table`, `Tabs`, `DropdownMenu`, `Popover`, `Pagination`, `DataTable`, `Toast`, `Inline`…)— lo reciben por el spread de props **sin tipar**, y a menudo en el elemento equivocado: quien quiera ajustar `Dialog.Content` hoy **no tiene gancho**. Es un agujero de API real, independiente de `styles`.
  - [ ] **La lista de 11 se verifica contra el código, no contra este texto**: si al implementarla hay más o menos, lo dice la tarjeta.
  - [ ] Story por componente con los dos escapes: una instancia con `styles` y una con `classNames` por slot, y el `.mdx` de cada componente con una sección "Cuándo sobrescribir" que dice **qué** sobreescribir y **por qué el token es la vía**, no solo cómo.
  - [ ] **Changeset `minor`** (no breaking) + `pnpm verify:external` verde, porque la API pública cambia y es la primera vez que se toca después del `1.0.0`.
  - [ ] Guía §15 (diseño de APIs) y README §Basic usage con un ejemplo de override, y nota de **costo de bundle medido**: una prop que se lee y se mergea en render tiene coste, y la gate de `size-limit` lo va a notar.
- **Notas de la sesión (2026-10-04 — creación):** Se supone que el entregable de esta carta es
  **menos fricción para el consumidor, no una API más grande**, y el riesgo real es el contrario:
  convertir `styles` en la vía principal por la que se resuelven las cosas, que es exactamente lo
  que ADR-003 ya avisó de. El criterio 2 es el que más valor entrega por unidad de trabajo: no es
  una prop nueva, es **arreglar 11 componentes que aceptan `className` sin tipar**. Y el criterio 5
  es el que protege al consumidor: cambiar la API de un paquete publicado exige re-verificar la
  instalación externa, y es la primera vez que esa gate se corre por este motivo.

---

# Backlog de releases — hallazgos de RRU-111

> Tarjetas creadas por la validación de instalación externa (DoD #2 de RRU-111).
> **Ninguna se arregla dentro de RRU-111** (§0 paso 3). Son huecos de
> **cobertura**, no bugs del paquete: todo lo que las tarjetas cubren hoy pasa.
> Lo que no pasa es que nada lo comprobara automáticamente.

### RRU-131 · `verify:external` no corre en CI

- **Epic:** EPIC-11 · **Estado:** ✅ Done · **Fecha de promoción:** 2026-10-02 · **Fecha:** 2026-10-03 · **Revisada y cerrada:** 2026-10-03
- **Prioridad:** P2 · **Estimación:** S · **Dependencias:** RRU-111, RRU-132
- **Labels:** `ci` `docs`
- **Descripción:** Hallazgo de RRU-111. `tools/external-install-check.mjs` es la única
  comprobación del repo que responde «¿qué recibe alguien de fuera?», y se ejecuta **a mano**:
  los cuatro jobs de `ci.yml` (`check`, `e2e`, `audit`, `size-limit`) no la invocan, así que un
  PR puede mergear con la instalación rota y el primer señalarlo es un consumidor. El trabajo no
  es tanto la ejecución como decidir **qué ruta**: `tarball` necesita red (npm instala React, Vite y
  TypeScript en el proyecto desechable) pero no registro ni Chromium, así que cabe en un job con
  `--no-browser`; `registry` necesita red + registro, y probar `@latest` en cada commit **no** es
  una puerta sino una measurement de otra cosa —la última release—, además de caro.
- **Criterios de aceptación (DoD):**
  - [x] Job en `.github/workflows/ci.yml` con `--route=tarball --no-browser`, en paralelo al resto
        como `e2e`/`size-limit`, sin bloquear el gate principal.
  - [x] Chromium cacheado si finalmente se incluye el pase de navegador; si no, el paso de tema
        queda documentado como manual junto al motivo. → **Chromium fuera** (`--no-browser`), documentado
        en `SECURITY.md` y en el README del playground, con el motivo escrito.
  - [x] `SECURITY.md` §"What we check on every change" y `apps/playground/README.md` reflejan lo
        que CI hace y lo que sigue siendo manual, sin prometer lo que no corre.
  - [x] La ruta `registry` sigue siendo manual, con el motivo escrito.
- **Notas de la sesión (2026-10-02 — promoción y hallazgos, sin implementar):**
  - **Dependencia añadida: RRU-132.** El flag `--react` que RRU-132 acaba de añadir es justo lo que
    este job debe ejecutar solo. Sin esta dependencia, cablear el job y añadir el eje de React
    serían dos cambios en `ci.yml` en la misma semana. Por eso **esta tarjeta va primera** en el
    orden de cierre (§0.2, borrada), pese a que la regla de §0 paso 1 devolvería RRU-124.
  - **El job es INFORMATIVO, confirmado por el usuario:** `continue-on-error: true`, en paralelo como
    `e2e` y `size-limit`, sin tocar el gate principal. El motivo es el mismo que ya está escrito en
    el comentario del job `audit` de `ci.yml` (líneas 120-132): la ruta `tarball` necesita red —npm
    instala React, Vite y TypeScript en el proyecto desechable— y un runner limpio, así que es
    propensa a fallar por cosas que no son un bug del paquete. Bloquear el gate principal con ella
    entrenaría al repo a ignorar el job. **Consecuencia honesta:** mientras sea informativa, el
    DoD dice «ejecuta», no «protege»; `SECURITY.md` no debe prometer que esto para una release.
  - **HALLAZGO NUEVO, y no estaba en el DoD: `SECURITY.md` está desactualizado.** Su tabla §"Supported
    versions" sigue diciendo `0.1.x` con el texto «The library is pre-1.0», y la librería está en
    **1.0.0 desde el 2026-10-02** (RRU-112). Es un documento **público** que afirma estar pre-1.0.
    No lo detectó la publicación porque es texto, no manifiesto. El DoD #3 pide tocar ese fichero,
    así que el arreglo entra aquí — pero hay que corregir **la tabla de versiones**, no solo
    «what we check on every change», y revisar el §Publishing. Reparto: `0.1.x` → `1.0.x`, y la
    frase de pre-1.0 por la política de parches de 1.0.x.
  - **Chromium queda fuera** (`--no-browser`): `e2e` ya lo cachea y duplicarlo cuesta minutos por PR
    a cambio de un pase de tema que el E2E cubre. El DoD #2 se cierra documentando el paso de tema
    como manual **con el motivo escrito**, que es lo que la propia tarjeta pide.
- **Notas de la sesión (2026-10-03 — implementación, 4/4 DoD, a la espera de revisión del diff):**
  - **El job es el DoD #1 literal, y esa literalidad es una decisión.** `external-install` corre
    `pnpm verify:external --route=tarball --no-browser` con **React 19 (default) y solo React 19**.
    La alternativa era una matriz `[19.3.0, 18.2.0]`, que es lo que haría falta si el objetivo fuera
    «el peer declarado se ejercita en cada PR»; se descartó porque **una major por ejecución no prueba
    la otra**, así que una matriz de dos no es más fuerte que dos ejecuciones — solo más caras por
    Runner, y `continue-on-error` haría que la segunda mitad fuera igual de opcional que la primera.
    El suelo `18.2.0` del peer se queda en `pnpm verify:external:react18`, que RRU-132 dejó
    repetible, y ahora está **escrito como manual con su motivo** en los dos documentos que el DoD #3
    nombra. La línea que evita el malentendido está en el comentario del propio job: un verde de este
    job no dice nada del peer floor.
  - **`pnpm build` antes del check, con cache de Turborepo, y por qué aquí el cache SÍ es honesto.**
    La ruta `tarball` arranca con `pnpm pack`, que se lleva `files: ["dist", "README.md"]`: sin build,
    el tarball sale sin `dist/` y la comprobación **podría dar verde sobre una instalación sin
    librería** — el peor modo de fallo posible para este gate. En `e2e` el cache de `dist` está
    prohibido explícitamente porque un artefacto stale puede hacer pasar la suite; aquí un `dist`
    stale **solo puede hacer fallar** el install con un export que no existe, nunca hacerlo pasar. Es
    la asimetría que justifica cachear en un job y no en el otro, y está escrita en el comentario para
    que nadie la «corrija» al revés.
  - **El YAML se validó parseándolo**, no a ojo: 5 jobs, `external-install` **sin `needs`** (o sea,
    en paralelo de verdad, como `e2e`/`audit`/`size-limit`), `continue-on-error: true` y
    `timeout-minutes: 20`. Además `prettier --check` sobre el fichero, que es lo que paró RRU-015 y
    RRU-132: un YAML mal indentado no falla en local, falla en el runner.
  - **El comando del job se ejecutó de verdad en local**, no se dio por bueno:
    `pnpm verify:external --route=tarball --no-browser` → verde en los cuatro pasos (install de los
    tres paquetes a 1.0.0 desde los tarballs, con `React 19.3.0` y el peer declarado `>=18.2.0`
    reportado; `tsc --noEmit` en `bundler` y `node16`; `renderToString()` en Node ESM; `vite build`)
    y 52.8 kB de CSS con los tres
    estados de tema, **con el aviso `--no-browser` presente en la salida** — que es el punto: el run
    dice lo que no comprobó en lugar de dar un verde ambiguo.
  - **El drift de `SECURITY.md` era más ancho que la tabla de versiones.** Corregida la tabla
    (`0.1.x` → `1.0.x`, y la frase de pre-1.0 sustituida por la política de parches/menor/mayor de
    1.0.x), y además dos cosas que la tarjeta no pedía y que el mismo fichero afirmaba mal:
    (1) §Publishing decía solo «se publica desde `main`», sin decir que **`ci.yml` corre únicamente en
    `pull_request`**, así que el lector podía esperar que el gate de calidad vigilara la publicación —
    ahora dice que los gates viven en `release.yml` antes del paso de publish y que los de `ci.yml` no
    protegen la release; (2) la tabla «What we check on every change» no mencionaba el job nuevo, y su
    §Informational explica **que ejecuta, no que protege**, y **por qué** son manuales las dos rutas que
    no corren (registry y React 18). Un `SECURITY.md` público que promete un gate inexistente es peor
    que uno que no lo menciona.
  - **`apps/playground/README.md`: una tabla «What runs where» en vez de prosa.** El documento ya
    describía la herramienta entero; lo que le faltaba era **dónde se ejecuta cada ruta**, y eso es una
    tabla de tres filas (job de CI / `verify:external:react18` manual / `--route=registry` manual) más
    los dos «no lo hace, y por qué». Se corrigió también la frase que quedaba **falsa** al añadir el
    job: «It needs the network and a browser, so it is a release-time check rather than a CI gate».
  - **`README.md` de la raíz se queda con una frase que este cambio vuelve inexacta, por decisión
    explícita del usuario** (la pregunta de alcance «SECURITY.md + README.md» se respondió
    «solo SECURITY.md»). Dice, tras listar las cuatro invocaciones: *«It needs the network and a
    browser, so it is a release-time check rather than a CI gate»*. Ahora corre en cada PR, pero
    **sin Chromium y en React 19**, así que la frase **subdeclara** en vez de sobreprometer — que es
    la dirección segura del error, y por eso no se bloquea la tarjeta con ella. Aun así es un drift
    real de un documento público: si en la próxima sesión se toca `README.md §Development`, esta frase
    es el primer pendiente.
  - **Lo que esta tarjeta NO cierra, y conviene no leer al revés:** el job es informativo, así que **no
    protege el merge** — ejecuta la comprobación, la registra y avisa; la ruta `registry` y el pase de
    React 18 siguen sin correr en CI; y `--no-browser` significa que **el tema se comprueba como texto
    en el CSS construido**, no en un navegador. El E2E del job `e2e` es quien mira el tema de verdad.
    Todo eso está escrito en los dos documentos y en el comentario del job, no solo aquí.
  - **Gates (§0 paso 4, en fresco):** `pnpm lint` ✅ 8/8 + `lint:root` ✅ · `pnpm typecheck` ✅ 8/8 ·
    `pnpm test` ✅ tokens 2 files + ui 46 files + playground 3 files · `pnpm build` ✅ 5/5 ·
    `pnpm format:check` ✅ (tras `prettier --write` en los 2 Markdown tocados, que es lo que paró la
    primera vez) · `pnpm verify:external --route=tarball --no-browser` ✅ con React 19.3.0.
    **Sin `pnpm test:e2e`:** el cambio no toca JSX, CSS ni el paquete, solo `ci.yml` y dos Markdown;
    su gate es el job `e2e` de `ci.yml`, que este cambio no altera. **Revisión manual de a11y por
    teclado (§39): no aplica** — cero componentes, cero tokens, cero estilos. Sin changeset (no toca la
    API pública) y **sin commits** (el agente propone el texto; commitea el usuario).
  - **Pendiente de verificación remota, que el agente no puede hacer:** el primer run real del job.
    Aquí solo se ha probado el comando en local y la estructura del YAML; que GitHub lo ejecute en
    paralelo y con `continue-on-error` solo se ve con un push. Predecesor de RRU-015, que se cerró con el mismo `workflow_dispatch`.

### RRU-132 · React 18 es el peer declarado y ninguna ruta lo instala

- **Epic:** EPIC-11 · **Estado:** ✅ Done · **Fecha:** 2026-10-02
- **Prioridad:** P2 · **Estimación:** S · **Dependencias:** RRU-111
- **Labels:** `docs` `packaging`
- **Descripción:** Hallazgo de RRU-111. `docs/product.md` §47-49 declara `react >=18.2.0` como peer
  mínimo y afirma compatibilidad con React 18 y 19, pero **todo** lo que instala estos paquetes usa
  `^19.3.0`: el playground, sus E2E, el fixture de `verify:external` y el `devDependencies` de la
  raíz. La mitad baja del rango declarado nunca se ha instalado, así que la compatibilidad con
  React 18 es una afirmación sin ninguna evidencia detrás. El riesgo no es teórico: los hooks de
  este repo (`useIsomorphicLayoutEffect`, `useFocusTrap`, el roving tabindex de Tabs/Select) son
  código que se ejecuta en ambas majors.
- **Criterios de aceptación (DoD):**
  - [x] Al menos una ruta instala React 18 y ejecuta los gates que aplican (instalación, tipos,
        SSR, tema), sin duplicar el resto del toolchain.
  - [x] Si aparece una incompatibilidad real, se decide explícitamente entre subir el peer a `>=19`
        (con changeset y nota de release) o arreglar el componente — no dejar el rango como está.
        → **No apareció incompatibilidad.** El peer se queda en `>=18.2.0` y la rama de subirlo a
        `>=19` no se abre; se dice explícitamente para que conste que se miró.
  - [x] `docs/product.md` y el README dicen lo que está verificado, no lo que se espera.
- **Notas de la sesión (2026-10-02):** **lo que faltaba era la capacidad, no la ejecución.** Nadie
  había instalado React 18 porque la herramienta que instala las dependencias del consumidor fijaba
  `^19.3.0` en cuatro sitios del mismo objeto (`consumerManifest`), sin forma de pedir otra cosa. La
  sesión añade un tercer eje a `tools/external-install-check.mjs`: `--react`, que acepta una **major**
  (`18`, `19`) o una **versión exacta** (`18.2.0`).

  **Por qué dos formas de pedir la versión y no solo la major.** El peer dice `>=18.2.0` y la 18.x más
  reciente es la 18.3.1. Instalar solo `18` habría dejado el suelo del rango tan sin ejercitar como
  estaba antes, solo un poco más arriba — y el suelo es justamente el número que un consumidor con un
  proyecto viejo recibe. `reactRanges()` deriva el runtime de lo pedido (`18` → `^18.0.0`, `18.2.0` →
  pin exacto) y los tipos de la **major** (`^18.0.0`), porque `@types/react` versiona por su cuenta y
  emparejar runtime 18 con types 19 probaría una combinación que ningún consumidor puede instalar.

  **Un gate nuevo, porque el nombre de la bandera no es evidencia.** La lógica del propio script es
  que un run verde no debe *implicar* nada: el `route` ya se reporta porque la ruta `registry` puede
  ser correcta sobre otra versión. Lo mismo aplica a la major, y con más motivo — «React 18 funciona»
  es exactamente la afirmación que la tarjeta existe para poder hacer. Así que `reportReact()` lee la
  versión de `node_modules/react/package.json` (**la que escribió npm**, nunca el rango pedido) y
  **avisa** si la major instalada no es la que se pidió; junto a ella imprime el rango peer leído del
  `@raulrod/ui` **instalado**, no de `packages/`, porque en la ruta `registry` esos dos son dos
  versiones distintas y el manifiesto que lee el consumidor es el publicado. Sin esto, el flag sería
  una etiqueta que nadie contrasta.

  **Resultado (2026-10-02, las tres verificadas contra `pnpm pack`):**

  | React | Major | Gates | Tema |
  | --- | --- | --- | --- |
  | **18.2.0** (suelo declarado) | 18 | install · `tsc --noEmit` en `bundler` **y** `node16` · `renderToString()` en Node ESM · `vite build` | texto en el CSS construido |
  | **18.3.1** (18.x más reciente) | 18 | los cuatro anteriores | **Chromium**, los seis estados |
  | **19.3.0** (major por defecto) | 19 | los cuatro anteriores | texto en el CSS construido — **sin regresión** |

  Todo verde a la primera, en las tres. La sorpresa —o más bien la ausencia de sorpresa— es que el
  riesgo nunca fue «¿importa?»: `createPortal` (`Portal.tsx`), `renderToString` y `createRoot` existen
  en las dos majors, y un grep de las APIs que React 19 sí introduce (`useEffectEvent`, `useOptimistic`,
  `useActionState`, `removeChild` de `react-dom`, `ReactDOM.render`, `findDOMNode`) sale **vacío** en
  `packages/ui`. El riesgo real era un hook o un renderer distintos por debajo, y no había ninguno.

  **Repetible, no un resultado de una vez.** `pnpm verify:external:react18` encadena las dos
  ejecuciones de React 18 (suelo con `--no-browser` porque el pase de Chromium no depende de la major
  y cuesta un minuto; 18.x más reciente con Chromium, que es donde el tema se mira de verdad). Sin un
  script, esto era un comando que había que recordar y una afirmación que se olvidaba re-verificar.

  **Lo que esta tarjeta NO cierra.** El flag hace posible repetir la prueba, no la ejecuta sola: nada
  la corre en CI (es RRU-131, y es justo el job que debería hacerlo). Y una major por ejecución no
  prueba la siguiente — la nota de cierre de la herramienta lo dice en cada run que no sea React 19 en
  lugar de dejar que un verde ambiguo se lea como «el rango entero». Sigue sin cubrirse React 17 ni
  anteriores, ni un consumo real con rutas de datos, Suspense o streaming, que es RRU-114.

  **Una puerta que casi se queda cerrada.** `pnpm lint` y `pnpm format:check` pararon el cambio:
  Prettier rechazaba el archivo editado y `pnpm format:check` es un job de `ci.yml`, así que sin el
  `--write` esta tarjeta no habría llegado ni a revisión. Es la segunda vez que el format gate es el
  que detiene el trabajo (la primera, RRU-015, por un newline que faltaba en `ci.yml`) y confirma
  que el gate está donde debe: en la puerta, no en el diff.

  **Gates:** `pnpm lint` ✅ 8/8 + `lint:root` ✅ · `pnpm typecheck` ✅ 8/8 · `pnpm test` ✅ tokens 69 + ui
  1059 + playground 34 · `pnpm build` ✅ 5/5 · `pnpm format:check` ✅ · `verify:external --route=tarball
  --react=18.2.0 --no-browser` ✅ · `--route=tarball --react=18` ✅ con Chromium · `--route=tarball`
  (React 19, default) ✅. La revisión manual de a11y por teclado (§39) **no aplica**: cero JSX y cero
  CSS de componente en este cambio; lo que se toca es un script de verificación y tres documentos.
  **Pendiente del usuario:** revisión del diff y commit (no commiteado por el agente).
- **Cierre (2026-10-02):** revisado y commiteado por el usuario en `0dfbf47` (`add --react axis to
  verify:external and verify the 18.2.0 peer (RRU-132)`), sin cambios respecto a lo propuesto → la
  tarjeta pasa a ✅ Done con sus 3 DoD cumplidos. Lo que **no** se cierra con ella es la ejecución en
  CI de `--react=18`: eso es RRU-131, y el flag sin CI es una prueba que hay que pedir a mano.

---

# Backlog abierto (futuras fases)

> Ideas que NO forman parte del MVP. Dar prioridad aquí solo cuando EPIC 0–6 estén consolidados (§38).

- [ ] Componentes adicionales de formulario: `Combobox`, `Autocomplete`, `DatePicker` (alta complejidad; requeriría ADR).
- [ ] `CommandMenu` completo con proxied queries y grupos (si EPIC 5 lo deja en P2).
- [ ] Virtualización real de `DataTable` (solo con medición; RRU-066).
- [ ] Fluid typography con `clamp()` (RRU-003 ya lo marca como opcional).
- [ ] High-contrast theme.
- [ ] Componentes de navegación: `Breadcrumb`, `Sidebar`, `Link`.
- [ ] Soporte de iconos custom del consumidor (registro de componentes en vez de la librería de iconos).
- [ ] i18n / RTL en componentes con texto.
- [ ] Dark mode sin flash con script de bootstrap (`data-theme` inline en `<head>`). **Cerrado por
      RRU-024 y verificado por RRU-111**: el patrón está en `docs/theming.md` §4 y
      `verify:external` lo comprueba sembrando `rr-theme` en Chromium. Se mantiene la línea como
      referencia al patrón documentado, no como trabajo pendiente.

---

# Reglas de mantenimiento del tablero

1. Una tarjeta se mueve de estado únicamente cuando su antecedente lo permite (no saltar DoD).
2. Los cambios en una API pública sin ADR no se aceptan.
3. Al cerrar una tarjeta, actualizar: estado → ✅, fecha, y cualquier rompimiento del DoD.
4. Los bugs de accesibilidad tienen prioridad sobre tareas nuevas (label `a11y`).
5. No crear tarjetas de "componente por si acaso": primero la necesidad repetida y demostrable (§12, §33).
