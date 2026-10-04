# ADR-008: Estrategia responsive (container-first)

- **Status:** Accepted
- **Fecha:** 2026-10-04
- **Tarjeta:** [RRU-133](../design-system-jira.md) · **Epic:** EPIC 12 (Fase 12) — Responsive
- **Referencias:** guía §17 (DataTable responsive behavior) · [ADR-003](003-styling-strategy.md) (CSS plano + CSS custom properties) · [theming.md](../theming.md) §8 (breakpoints en @media) · [token-taxonomy.md](../token-taxonomy.md) §3.2 (breakpoint.*) · [design-system-jira.md](../design-system-jira.md) §0.1 y EPIC-12

---

## Context

RRU-113 (cierre MVP) identificó que la demo exigía mostrar comportamiento *responsive* y el repositorio no tenía **ni un breakpoint de ancho**: `git grep "@media"` devolvía únicamente `prefers-reduced-motion`. EPIC-12 se abre (post-MVP) con RRU-133 como carta 1 para establecer los **cimientos del responsive**.

El problema es definir **qué mecanismo responsive usar por defecto** en un Design System que:
1. Sigue ADR-003: CSS plano + CSS custom properties, sin CSS-in-JS, clases `rr-*`, sin valores arbitrarios (consume tokens).
2. Emite tokens `breakpoint.*` (sm=640, md=768, lg=1024, xl=1280) en `@raulrod/tokens` (RRU-023/024) y los expone como tipos (`Breakpoint` en `derived.ts`). Esos valores son px literales en CSS porque `@media` no evalúa CSS variables (theming.md §8).
3. Debe funcionar sin depender del host (Vite/Next/CDN), SSR-safe, con dark theme y respetando `prefers-reduced-motion`.
4. Busca evitar que cada componente reinvente queries. Al mismo tiempo, algunos componentes con comportamiento modal/overlay (Dialog, Toast) tienen necesidades específicas de viewport que conviene mantener explícitas.
5. EPIC-12 **no toca la API pública**. EPIC-13 (escape hatch de estilos) sí cambia API pública y tiene ADR-009 propio.

## Decision

Adoptar **container queries (`@container`) como mecanismo principal** para layouts/componentes del DS. **Reservar `@media` únicamente para Dialog y Toast**.

### Principios

- **Container-first.** Los componentes deben reaccionar preferentemente al tamaño de su **contenedor**, no al viewport global. Esto mejora la composabilidad (un componente puede ser responsive dentro de un panel, sidebar, card, etc.) y alinea el responsive con el diseño basado en componentes.
- **@media restringido.** Solo se usarán media queries de ancho/viewport para casos donde el comportamiento depende **del viewport** (no del contenedor padre): **Dialog** (backdrop/fullscreen, posicionamiento relativo a ventana) y **Toast** (posición/orientación en viewport, stacking global). Cualquier otro uso de `@media` para responsive de layout debe justificarse explícitamente en la tarjeta.
- **Tokens como fuente.** Los valores de breakpoints usados en queries (container o media) deben derivarse de `--rr-breakpoint-*` o del tipo `Breakpoint` cuando se definen en CSS. No se introducen breakpoints nuevos ad-hoc sin documentarlos y, de forma preferente, se reutilizan los existentes (sm/md/lg/xl). Si un caso precisa un valor intermedio, se justifica en la tarjeta y se evalúa si pertenece a tokens.
- **Sin lógica JS para responsive.** Todo queda en CSS (coherente con ADR-003). No se añade JS para medir contenedores en componentes base del DS (salvo si una primitiva futura lo justifica con necesidad real).
- **Convención de naming y queries.** Se prefiere nomenclatura semántica (`rr-*`) y queries basadas en los breakpoints existentes. Cuando se use `@container`, el componente debe definir un **container context** razonable (`container-type: inline-size` o `size` según necesidad) en su raíz cuando corresponda (documentado en el `.css` del componente). No se obliga a todos los componentes a ser contenedores por defecto: solo cuando su CSS responsive lo requiera.
- **Coherencia con theming.** No afecta a `data-theme`/`prefers-color-scheme`. `prefers-reduced-motion` sigue cubriendo animaciones (ADR-003). Los tokens de breakpoint siguen siendo px (theming.md §8).

### Alcance de RRU-133 (cimientos)

RRU-133 establece la **estrategia** y los **cimientos base** para que EPIC-12 la aplique consistentemente:
- Este ADR (trackeado en `docs/decisions/008-responsive.md`, `!/docs/decisions/`).
- Base CSS/utilidades o convenciones para `@container` (sin cambiar API pública). No añade componentes. No modifica comportamiento existente salvo sentar convención.
- Verifica que la demo pueda observar responsive en el futuro (cerrando el hallazgo de RRU-113), dejando el trabajo de aplicación a RRU-135+.

## Alternatives considered

### A. @media como único mecanismo (viewport-first)

- **Ventajas:** muy estable, ampliamente soportado, simple para layouts globales.
- **Por qué se descarta:** rompe composabilidad (un componente dentro de un sidebar/card no puede reaccionar a su ancho propio), obliga a layouts padre a controlar viewport queries, dificulta APIs composables (§15 guía) y no casa bien con componentes reutilizables en contextos diversos. Además, para muchos componentes (DataTable cells, cards, etc.) el contenedor es más natural. **Descartado: limita reutilización y va en contra de composición.**

### B. @container como único mecanismo

- **Ventajas:** máxima composabilidad, componente autocontenido.
- **Por qué se descarta:** existen casos donde el comportamiento es intrínsecamente viewport (Dialog/Toast). Dialog gestiona backdrop, bloqueo de scroll a nivel de documento/ventana, posicionamiento centrado relativo a viewport y fullscreen; Toast aparece en regiones fijas del viewport (top-right, etc.) con stacking global. Forzar container queries para estos casos añade complejidad innecesaria (necesitarían un contenedor artificial a nivel de root) y complica la semántica. La restricción selectiva es más pragmática y mantenible. **Descartado como absoluto; aceptado como principal con excepción explícita.**

### C. Mix sin regla (caso por caso)

- **Ventajas:** flexible.
- **Por qué se descarta:** genera inconsistencia entre componentes, dificulta mantenimiento y revisión (cada dev decide mecanismo). Un DS necesita convención única con excepciones justificadas. Este ADR fija la convención (container-first) + excepciones (Dialog/Toast). **Descartado: falta gobernanza.**

## Consequences

### Positivas

- **Composición mejorada.** Componentes responsive independientemente de dónde se coloquen (sidebar, drawer, card, grid).
- **Menos acoplamiento a viewport.** Reduce necesidad de queries globales en consumidores.
- **Coherente con arquitectura de componentes (ADR-004/composición).** Se alinea con APIs composables.
- **Sin cambios en API pública** (EPIC-12). La decisión es interna/CSS.
- **Gobernanza clara.** Excepciones explícitas (Dialog/Toast) evitan ambigüedad futura; cualquier otra excepción requiere justificación en tarjeta.

### Negativas / costes

- **Soporte de navegadores.** `@container` está ampliamente soportado en evergreen modernos (Chrome/Edge/Firefox/Safari recientes). Dado que el DS soporta "browsers modernos evergreen + SSR-friendly" (RRU-001), esto es aceptable para post-MVP. No requiere polyfills.
- **Necesidad de definir container context.** Algunos componentes deberán añadir `container-type: inline-size` (y opcional `container-name`) en su raíz CSS cuando usen `@container`. Esto es una pequeña adición declarativa en `.css`, sin JS.
- **Debugging menos obvio.** Container queries dependen del ancestro contenedor; conviene documentar en stories/docs cuándo se usa (RRU-080+). No es un bloqueo.
- **Variables CSS no evaluables en @media.** Sigue vigente (theming.md §8): valores px literales en queries. No cambia con container queries.

### Riesgos observables

- **Olvido de container context.** Un componente con `@container` sin `container-type` no funciona; se mitigará aplicando la convención por componente y verificando en stories/tests visuales cuando corresponda (EPIC-12 aplica componente a componente).
- **Excepción mal usada.** Extender "@media solo Dialog/Toast" a otros overlays: se rechaza por gobernanza (ADR-008 explícito). Cualquier ampliación requiere nuevo ADR o justificación fuerte en tarjeta.
- **Confusión entre mecanismos.** Documentar claramente en cada CSS cuándo se usa `@container` vs `@media` (comentarios breves) siguiendo estilo existente.

## Implementación (notas para RRU-133 y siguientes)

- **Cimientos (RRU-133):** este ADR + convenciones base (sin cambios de código rompientes). No modifica componentes existentes. No añade `@container` a componentes aún (eso va en RRU-135+).
- **RRU-135 (Breakpoints y queries base):** define helpers/convenciones para escribir queries con breakpoints existentes (`--rr-breakpoint-*`), cómo establecer `container-type` y ejemplos de uso. Puede añadir utilidades CSS internas si conviene (sin API pública).
- **Aplicación por familias (RRU-136–143):** cada familia aplica container-first donde tenga sentido; Dialog/Toast mantienen `@media` si fuera necesario (ya los tienen mayormente enfocados a viewport en su lógica).
- **Verificación:** lint/typecheck/test/build obligatorios (§0 paso 4). No se espera cambio en tests existentes (EPIC-12 no toca API pública). Verificar coherencia: `git grep "@media"` puede incluir media queries existentes (`prefers-reduced-motion`, `prefers-color-scheme` en tokens) y, cuando se añadan en componentes, **solo** los justificados (Dialog/Toast) según ADR-008. La comprobación de que "no hay breakpoints de ancho" antes de RRU-133 se resuelve con la estrategia establecida; la demo podrá observar responsive a partir de las tarjetas de aplicación.

## Estado

**Accepted.** EPIC-12 parte de esta convención. Cualquier desviación requiere justificación escrita en la tarjeta correspondiente.
