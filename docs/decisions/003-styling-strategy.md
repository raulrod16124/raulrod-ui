# ADR-003: Estrategia de styling (CSS plano + CSS custom properties)

- **Status:** Accepted
- **Fecha:** 2026-09-23
- **Tarjeta:** [RRU-028](../design-system-jira.md) · **Epic:** EPIC 2 / Fase 2 (guía §9–§11)
- **Referencias:** guía §5 (Stack, Styling), §11 (Theming), §24 (Public API), §29 (Performance) · [taxonomía](../token-taxonomy.md) §2 (qué consume cada consumer) · [theming](../theming.md) (RRU-024) · [ADR-002](002-token-architecture.md) (arquitectura de tokens) · [ADR-001](001-monorepo.md) · [tablero](../design-system-jira.md) §2 decisión #1 · Playbook §4 Paso 3 (CSS con tokens)

---

## Context

La estrategia de styling decide **cómo** se escriben los estilos de los componentes, **cómo** los consume el theming y **cómo** el consumidor puede personalizar el DS. Es una decisión de frontera (guía §24: los estilos internos NO son API pública) y condiciona el rendimiento percibido por el consumidor (guía §29). Resuelve tres problemas concretos:

1. **Cero runtime de styling y un bundle predecible.** `import { Button } from "@raulrod/ui"` no debe arrastrar un motor de estilos en JS que se ejecute por render ni CSS inyectado en runtime (guía §29 "CSS overhead"). La librería tampoco debe depender de un host concreto: debe funcionar igual en Vite, Next, CDN o HTML plano, sin asumir features del bundler del consumidor (guía §5 "La librería no debe depender de una aplicación host concreta").

2. **Theming sin lógica en los componentes.** Los tokens ya viven en 3 capas y se emiten como CSS custom properties (ADR-002, RRU-024): `:root` (light + primitives/escalares), `[data-theme="dark"]`, `@media (prefers-color-scheme: dark)` para el default de sistema y `@media (prefers-reduced-motion: reduce)` (theming.md §2). Guía §11: el componente no debe contener lógica para saber qué tema está activo; debe consumir tokens semánticos. Queda abierta la pregunta de **cómo** los estilos de componente consumen esas variables y cómo se hereda el cambio de tema sin re-render ni redibujado.

3. **Un contrato de override estable.** El consumidor debe poder personalizar el DS (tema, densidad, estado de un componente) sin forkear estilos internos ni depender de selectores de implementación (guía §24: los internals no son accesibles; frontera `exports` en RRU-091/RRU-103). Hoy el override está _de facto_ en la capa de variables (theming.md §7), pero no estaba formalizado como contrato: qué puede cambiar el consumidor, cómo, y qué NO debe tocar (los estilos internos de los componentes).

La decisión de producto ya está cerrada (tablero §2 decisión #1): **CSS + CSS variables**, sin CSS-in-JS, clases con prefijo `rr-*` (BEM-ish), theming por `data-theme` + `prefers-color-scheme`. Este ADR la formaliza, evalúa las alternativas serias y fija las consecuencias (sobre todo el contrato de override).

## Decision

Adoptar **CSS plano + CSS custom properties** como estrategia de styling de `@raulrod/ui`:

### Estilos de componente: archivos CSS estáticos colocalizados

- Cada componente declara su propio `*.css` colocalizado según el Playbook §4 Paso 1 (`<Pascal>.css`).
- **Clases con prefijo `rr-`** + nombre semántico, BEM-ish: `rr-button`, `rr-button--primary`, `rr-button__icon`. El prefijo evita colisiones con el CSS del consumidor (CSS global, sin encapsulación por hash — ver Consecuencias).
- **Prohibido valores arbitrarios**: los estilos consumen ÚNICAMENTE variables de la capa de tokens (`var(--rr-*)`) emitida por `@raulrod/tokens` (`dist/tokens.css`). Un componente jamás escribe un color, una fuente, un spacing o un radius a mano (gobernanza de ADR-002/RRU-021; se revisa con regla de lint de fronteras en RRU-103).
- **Estados con selectores nativos**: `:hover`, `:active`, `:focus-visible`, `:disabled`; estados condicionales que dependen de props con atributos `data-*` propios del componente (p. ej. `data-state="open"`, `data-size="lg"`). Todo lo que el CSS necesite saber del componente se declara como atributo data o clase `rr-*`, nunca como estilo inline computado en JS.
- **`prefers-reduced-motion`** cubierto en toda animación (Playbook §4 Paso 3): se apoya en el token `--rr-motion-behavior-default` (flipeado a `none` bajo `prefers-reduced-motion: reduce` por RRU-024) y, cuando la animación es específica del componente, con su propio `@media`.

### Cero runtime de styling

- Los estilos son **archivos CSS estáticos**: se sirven como CSS (importando `@raulrod/ui/styles.css` o el CSS colocado por el mecanismo del host que corresponda) y NO se inyectan por JS en runtime ni requieren un motor en el bundle del consumidor.
- Ningún componente contiene lógica de estilos: no `style={{}}` computado, no funciones `css()`, no regeneración de clases en render. El único estado visual dinámico son los atributos `data-*`/clases que el CSS selecciona.

### Theming declarativo (sin lógica en componentes)

- El tema se gobierna desde `data-theme` en el `<html>` + `prefers-color-scheme` (theming.md §3): 3 estados (sistema / light / dark), sin duplicar lógica de tema en los componentes (guía §11).
- El flip de tema es **solo un cambio de variables**: los componentes consumen `var(--rr-*)` y no reinician estado visual ni re-renderizan por el tema. SSR-safe sin error de hidratación (theming.md §5: `data-theme` se gestiona fuera del render de React).
- Script anti-flash bloqueante en `<head>` documentado para CSR (theming.md §4).

### Contrato de override (DoD #2)

**El consumidor cambia variables; los estilos internos de los componentes no son API pública.**

- **Qué puede cambiar:** cualquier CSS custom property emitida (`--rr-*`). El consumidor re-declara la variable en su propia cascada (p. ej. en `:root` o en un scope con mayor especificidad) y todos los componentes que la consuman la ven actualizada. Ejemplo: cambiar el tema dark, escala de spacing, `--rr-color-focus-ring` o un component token como `--rr-button-primary-background`.
- **Cómo se hace durable:** cuando el cambio es un "rol" del DS (p. ej. "estado disabled de un botón"), la vía gobernada es añadir un token/component token en `@raulrod/tokens` (gobernanza §7 y regla de "solo con necesidad real" de RRU-026), no parchear CSS del componente.
- **Qué NO se puede tocar:** los selectores internos `rr-*` y la estructura CSS de un componente son **detalles de implementación**, no contrato. El consumidor no debe escribir CSS apuntando a `rr-button` directamente para override por componente; si lo necesita de forma repetida, es señal de que falta un token/callback, y se resuelve por la vía gobernada.
- **Lo no-overrideable es el valor arbitrario**: ningún componente acepta valores visuales sueltos por props de estilo (solo tokens); de ahí el diseño de props (RRU-031/040/… tipan contra las uniones derivadas de RRU-025).

## Alternatives considered

### A. CSS Modules

- **Ventajas:** encapsulación real por archivo (los classnames se hashean), cero runtime (se compila a CSS estático), soporte nativo en bundlers y en CSS de JSX.
- **Por qué se descarta:** el hash de clases hace que los estilos de un componente sean **irreferenciables desde fuera** de forma estable: mataría el patrón de override por variables del consumidor (que sí es estable) y haría imposible cualquier personalización por CSS del consumidor sin violentar la encapsulación. Además el theming por `data-theme` no es el problema que resuelve (esa capa ya vive en las variables de RRU-024), y el prefijo `rr-*` ya da el espacio de nombres suficiente para un DS de este tamaño sin añadir un step de build por archivo en el pipeline del paquete (build actual de `@raulrod/ui` es `tsc`, RRU-010). Añadir CSS Modules al editor de estilos del DS es coste de tooling para un problema (colisión global) que la convención `rr-*` ya mitiga. **Descartado: añade tooling y encapsulación que bloquea el contrato de override deseado.**

### B. vanilla-extract

- **Ventajas:** estilos tipados ("CSS mágicamente tipado"), salida estática (cero runtime), theming por variables.
- **Por qué se descarta:** resuelve un problema (estilos tipados en TS) que este DS ya resuelve por **colocación de tokens**: la capa de tipos al servicio de las props viene de las uniones derivadas de tokens (RRU-025, `docs/typescript.md` §8), y la capa visual es CSS puro sobre variables con contrato semántico (Playbook §4 Paso 3). Añadir vanilla-extract implica un **plugin de build** (los estilos se compilan a `.css` por el bundler del paquete) que hoy no existe (build = `tsc`) y rompería la regla de "no depender del host": el CSS debería generarse en el build del DS o exigir un preprocesador al consumidor. Crea además una segunda fuente de verdad sintáctica (los estilos en TS) que duplica la del `*.css` plano. **Descartado: sobre-engineering de tooling para un problema que el triángulo tokens + CSS plano + variables ya cubre (regla §33).**

### C. CSS-in-JS (styled-components, Emotion, …)

- **Ventajas:** colocalización de estilos con el componente, estilos dinámicos por props (variant/size/estado) con cero clases.
- **Por qué se descarta (3 motivos):** (1) **runtime**: inyecta estilos por render y añade JS ejecutado a cada componente — contradice el objetivo de cero runtime y CSS overhead de la guía §29 y el ser "SSR-safe sin código de styles en el servidor" (theming.md §5); (2) **lógica de tema en JS**: para "animar" por tema habría que leer/`useTheme` o `data-theme` en JS, reintroduciendo en los componentes la lógica de tema que la guía §11 prohíbe y que las variables resuelven por cascada; (3) **strategy**: contradice la decisión #1 cerrada del tablero (§2) y el ADR-002 (los tokens ya se emiten como CSS custom properties para ser consumidos por CSS, no por JS). Aunque la DX de estilos por props es cómoda, este DS consigue el mismo resultado con clases `rr-*` por variante + selectores de estado, sin runtime. **Descartado: runtime, lógica de tema en JS y contradicción con las decisiones #1/#4.**

### D. Utility-first (Tailwind)

- **Ventajas:** DSL de clases muy productivo, escala de diseño integrada, cero runtime si se compila a CSS estático.
- **Por qué se descarta:** **duplica la fuente de verdad de tokens**: la configuración de Tailwind es una segunda definición de la escala que competiría con `packages/tokens/src` (ADR-002 la fija como fuente única), y otro mecanismo de theming (modo dark de Tailwind) paralelo al `data-theme` + variables de RRU-024. Además, como enfoque de _aplicación_, encaja mejor en el consumidor que en un DS: si el DS distribuyera los estilos "en clases utilities", el consumidor dependería del framework para montar el CSS resultante (regla "no depender del host", §5). La brecha que el DS cubre (estados de componente, theming, tokens semánticos) no la resuelve mejor Tailwind que CSS plano + variables, y añade un DSL propio a aprender y a mantener. **Descartado: segunda fuente de tokens + dependencia de toolchain en el consumidor + theming paralelo.**

## Consequences

### Positivas

- **Cero runtime de styling**: sin motor JS en el bundle del consumidor, sin inyección en runtime; el CSS es estático y cacheable (guía §29).
- **Theming 100% declarativo por variables**: flip de tema sin re-render ni lógica en componentes (guía §11); SSR/SSG y CSR sin error de hidratación (theming.md §5).
- **Override estable y previsible**: el contrato "cambiar variables" es atómico: tocar `--rr-*` propaga a todos los componentes igual que el DS los usa; el consumidor no pelea con especificidad de selectores internos.
- **No depende del host**: CSS plano + variables funciona en Vite, Next, CDN, coordenadas de servidor o HTML estático (guía §5, §25).
- **A11y por construcción**: `:focus-visible`, `:disabled`, `:hover` y `prefers-reduced-motion` son primitivas del CSS; el foco y las animaciones se controlan sin JS de estado.
- **Cero dependencias de styling**: `@raulrod/ui` no añade ni un paquete de estilos (el build del paquete es `tsc`, ADR-001/RRU-010).

### Negativas / costes

- **CSS global**: sin encapsulación por hash; se mitiga con el prefijo `rr-*` (BEM-ish) y se custodia con la revisión de fronteras/estilos en RRU-103 (regla de lint). Requiere disciplina de nomenclatura en el equipo (Playbook §4 Paso 3).
- **Valores arbitrarios prohibidos = fricción inicial**: cada valor nuevo necesita un token (ruta gobernada de ADR-002/RRU-021); escribir `.foo { color: #123456 }` directamente no está permitido. Es la consecuencia (deseada) del contrato de override.
- **Overrides que no son "var" no se soportan**: si un consumidor quiere un aspecto que el DS no expone como variable, la vía es añadir un token/component token (RRU-026/041/…), no CSS sobre internals. Más lento que "hackear CSS" para casos puntuales.
- **`tokens.css` se sobreescribe en cada build** (theming.md §8): el consumidor no edita ese artefacto; su CSS de personalización va en archivos propios.
- **Breakpoints en `@media` usan px literales**: las CSS variables no se pueden evaluar dentro de una media query; `--rr-breakpoint-*` es documental y los valores reales viven en el token primitivo (theming.md §8).

### Riesgos observables

- **Colisión de `rr-*` con otro sistema `rr-*` del consumidor**: improbable pero posible; se documenta el prefijo como convención y cualquier renombrado es un breaking (EPIC 9).
- **Especificidad del consumidor sobre `var(--rr-*)`**: si el consumidor define variables a la misma altura y con menos especificidad que el archivo del DS, puede no ganar; el contrato de override recomienda definir en `:root`/scope raíz o con mayor precedencia (documentación de theming.md §7).
- **Fuga de estilos internos**: consumidor que empieza a depender de selectores `rr-button` para override → se ataca con el gate de fronteras RRU-103 y la gobernanza de tokens, no endureciendo el CSS del DS.
