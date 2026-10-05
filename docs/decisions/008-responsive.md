# ADR-008: Estrategia responsive (container-first)

- **Status:** Accepted
- **Fecha:** 2026-10-04
- **Tarjeta:** [RRU-133](../design-system-jira.md) · **Epic:** EPIC 12 (Fase 12) — Responsive
- **Referencias:** guía §17 (DataTable responsive behavior) · [ADR-003](003-styling-strategy.md) (CSS plano + CSS custom properties) · [theming.md](../theming.md) §8 (breakpoints en @media) · [token-taxonomy.md](../token-taxonomy.md) §3.2 (breakpoint.*) · [design-system-jira.md](../design-system-jira.md) §0.1 y EPIC-12

---

## Context

RRU-113 (cierre MVP) identificó que la demo exigía mostrar comportamiento _responsive_ y el repositorio no tenía **ni un breakpoint de ancho**: `git grep "@media"` devolvía únicamente `prefers-reduced-motion`. EPIC-12 se abre (post-MVP) con RRU-133 como carta 1 para establecer los **cimientos del responsive**.

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

## Addendum: overlays `position: fixed` se acotan contra el viewport (RRU-137)

La convención "container-first" tiene una tercera excepción, que no es un at-rule: los
overlays flotantes (`Popover`, `DropdownMenu`, `Tooltip`) se acotan con `min()` y unidades
de viewport.

- **Por qué no alcanza ningún otro mecanismo.** Son `position: fixed` portalled a
  `document.body`: no son descendientes de nada que el consumidor dibuje, así que un
  contenedor de 320px alrededor no los acotaría, y su espacio de coordenadas **es** el
  viewport. Es la misma observación que reserva `@media` para Dialog y Toast, alcanzada
  por `min()` en vez de por una regla.
- **`min(<duradero>, calc(100vw - 2 * var(--rr-space-4)))`.** El molde ya existía en
  `Toast.css`; RRU-137 lo replica. El término durable (6 × `space-16` = 384px) evita que
  un párrafo largo sea una hoja de 900px en escritorio; el término de viewport es el que
  salva al móvil (288px a 320px de ancho).
- **`100dvh`, no `100vh`.** Un overlay fijo sigue el viewport _visual_, así que la unidad
  dinámica es la honesta: con la interfaz del navegador visible, `vh` dejaría que el
  scrollport se metiera debajo. Queda registrado aquí para que RRU-139 (Dialog/Toast)
  herede la decisión en vez de volver a discutir `dvh` vs `vh`.
- **`box-sizing: border-box` es parte del contrato, no un extra.** El paquete no trae
  reset de `box-sizing`, así que sin esta declaración los `max-*` miden la caja de
  **contenido**: el E2E midió un panel de 320px de ancho y 360px de alto en un viewport
  de 320×360 —pegado a los cuatro bordes— y 416px en escritorio en vez de 384px, mientras
  todas las aserciones de "cabe dentro del viewport" seguían pasando. `css-contracts.test.ts`
  lo fija.
- **El tooltip envuelve; los otros dos desplazan.** `Popover` y `DropdownMenu` declaran
  `max-block-size` + `overflow: auto`, y el menú además es alcanzable por teclado porque
  cada item es un `menuitem` enfocable: <kbd>ArrowDown</kbd> recorre el scrollport. El
  tooltip **no** declara scrollport —no es enfocable ni es focus trap, así que un
  scrollport ahí sería contenido que ningún usuario de teclado alcanza— y usa
  `overflow-wrap: anywhere`. Es la desviación documentada de la carta RRU-137, reforzada
  por la gate (que rechaza el scrollport) y no solo por una nota.

## Addendum: el `listbox` de `Select` adopta el ancho de su campo (RRU-138)

El cuarto overlay de la familia necesita una cuarta cosa: no basta con acotarse contra el
viewport, tiene que **medir lo mismo que el campo al que pertenece**. Es el único cuyo ancla
no es un botón de acción sino el control que el panel sustituye.

- **`inline-size`, no `min-inline-size`.** `usePopoverPosition` escribe el ancho del ancla
  como estilo en línea **antes** de medir el panel. La palabra clave importa: el `min-*` de
  una hoja de authored CSS gana contra el `max-*` del clamp, así que escribir
  `min-inline-size` habría dejado el panel en 1024px dentro de un viewport de 320 —pegado
  fuera de la pantalla, y con el scrollport del padre absorbiendo el daño— mientras todas
  las aserciones de "cabe dentro del viewport" seguían en verde. Con `inline-size` el
  `max-inline-size` de la hoja sigue mandando sobre el valor en línea, que es exactamente
  el orden que queremos: el campo manda, el viewport acota.
- **Es opt-in, y no por descuido.** `Popover`, `DropdownMenu` y `Tooltip` se dimensionan
  según su contenido (`shrink-to-fit`) y deben seguir así: un popover de 500 caracteres
  merece 384px aunque su disparador mida 120. Igualar solo el `listbox` deja el resto de la
  familia intacto, así que la opción (`matchAnchorWidth`) la pide `Select.tsx` y nadie más.
- **El clamp se queda, y por eso el término durable importa.** A 1280px el campo mide
  1024px y el panel **no** debe llegar ahí: `min(384px, calc(100vw - 2 * space-4))` resuelve
  a 384px y esa es la medida final. Sin el tope durable, "igualar al ancla" sería un
  listbox de 1024px con doce opciones de una línea y el chevron a un kilómetro de las
  etiquetas que señala. Las dos mitades son necesarias y se necesitan en este orden.
- **`box-sizing` también en `.rr-select-item`.** No se hereda, así que la declaración de la
  raíz del panel no cubre a los items: con `width: 100%` y `space-3` de padding cada opción
  medía 24px más que la caja que debía rellenar, y el listbox desplazaba **en horizontal**
  para llegar a ellas (`scrollWidth` 336 contra `clientWidth` 312 medido). El eje inline
  debe ser exacto; el scrollport de esta hoja es trabajo del eje de bloque.
- **`min-width: 0` en `.rr-select-trigger`.** El disparador es un `<button>` flex, así que
  su piso natural es `min-content`. La premisa de la carta —que hereda el piso de ~177px de
  un `<input size=20>`— es **falsa**, y está medido: a 320px el disparador mide 272px, el
  ancho disponible, y `.rr-select-value` ya declara su propio `min-width: 0`. Aun así la
  declaración es correcta y se fija en `css-contracts.test.ts`, porque hoy no tiene efecto
  observable y dentro de seis meses un consumidor con texto crudo dentro del disparador la
  va a necesitar. Es el mismo criterio que RRU-136 aplicó a los labels largos: lo que no se
  puede observar hoy se afirma en el CSS escrito, no en un E2E que tendría que adivinar
  nombres internos de modificadores.

## Addendum: Dialog y Toast, los dos cuyo eje de bloque es el viewport (RRU-139)

El addendum anterior resolvió el eje **inline** de los cuatro overlays flotantes. Dialog y
Toast son la excepción que reserva `@media` —su espacio de coordenadas es el viewport— y
tenían un problema en el eje de bloque que nadie podía ver, porque los dos seguían
reportándose "dentro del viewport" mientras parte de su contenido estaba fuera de la
pantalla.

- **El tope tiene que restar el margen que el panel tiene reservado, y son el mismo
  token.** El overlay de Dialog reserva `padding: var(--rr-space-6)` en los cuatro lados,
  así que la altura a la que un panel tiene derecho es `100dvh - 2 × space-6` = 312px a
  360px de alto. El tope decía `calc(100vh - var(--rr-space-8))`: la misma aritmética con
  **otro token** (32px contra 24px) y con un solo lado restado. Medido antes del arreglo:
  un panel cuyo contenido superaba el tope renderizaba **376px dentro de una caja de
  contenido de 312px** —32px de esquina redondeada arriba y 32px abajo, más el título—
  porque el overlay centra su contenido con `justify-content: center` y un ítem más alto
  que la línea desborda **por igual a ambos lados**. No encogía, y `toBeVisible()` no lo
  detecta. Este es el motivo por el que la gate compara las dos declaraciones en vez de
  buscar un patrón en cada una: las dos se leen razonables por separado.
- **`100dvh`, no `100vh`.** Heredado del addendum de RRU-137, que dejó la decisión escrita
  precisamente para no volver a discutirla. Un overlay fijo sigue el viewport _visual_, así
  que `vh` dejaría que el panel se metiera bajo la interfaz del navegador. Es la única
  diferencia entre las dos formas y no se puede observar en un E2E: no hay barra de
  navegador en un viewport headless, así que la gate la sostiene.
- **`box-sizing: border-box` es parte del contrato donde hay padding, y solo donde lo
  hay.** El panel de Dialog trae `space-6` de padding propio, así que sin la declaración
  el `max-block-size` mide la caja de contenido, el padding queda fuera del tope y la caja
  de borde sale a `100dvh`: pegada a los bordes, justo lo contrario de lo que existe para
  impedir. El stack de Toast **no** declara padding ni `width`, así que su caja de borde y
  la de contenido miden lo mismo y la línea no cambia nada; exigirla ahí sería una regla
  sin motivo medido detrás, que es la clase de regla que este archivo no lleva.
- **Toast resuelve el eje inline con `inset`, no con `width`.** `width` lo dimensionaba
  contra una caja que **incluye** el scrollbar mientras que el `inset-inline-end` contra el
  que se posicionaba **no** lo incluye: por debajo de 416px los dos discrepaban ~15px. Con
  `inset` en los dos bordes inline más un `max-inline-size` durable (6 × `space-16` =
  384px) la caja se llena entre los bordes y el tope la recorta. **Este defecto no es
  reproducible en el E2E**: headless Chromium informa `innerWidth === clientWidth`, no
  reserva scrollbar, y `100vw` coincide con el ancho del viewport —revertir el arrangement a
  `width` deja los siete specs en verde—, así que lo sostiene la gate leyendo la
  declaración. Dos clases de evidencia para dos clases de afirmación, ninguna sustituyendo a
  la otra.
- **`margin-inline-start: auto` es lo que mantiene el stack pegado al borde final.** Con los
  dos `inset` puestos y `width: auto` la caja llena el espacio, y al recortarla el
  `max-inline-size` el sobrante **se va a la izquierda** en LTR: el panel quedaría a
  `space-4` del borde inicial, que no es donde vive una región de notificaciones. Una línea
  sola, y su ausencia mueve la tarjeta de 384px de x=880 a x=16 a 1280px.
- **El footer envuelve, y la premisa de la carta era falsa.** La carta decía que las
  acciones largas "se salen" a 320px. Medido: **no** se salen —`overflowPx` era exactamente
  0—, porque con `flex-wrap: nowrap` y el `min-width: 0` + `overflow-wrap: anywhere` que
  RRU-136 dio a `Button` **se encogen**: tres botones a ~65px de ancho y 96–114px de alto,
  etiquetas partidas en tres y cuatro líneas, en una sola fila alta como un párrafo. El
  defecto es distinto del escrito y peor: no desborda, se destroza. Con `flex-wrap: wrap`
  los mismos tres botones salen a 161–193px, una línea cada uno, en tres filas. Por eso el
  E2E afirma **número de filas** y no desbordamiento.
- **El scrollport del stack es alcanzable por teclado, y por eso puede desplazarse.** Cada
  toast lleva su propio botón de descarte enfocable, así que tabular mueve el foco a través
  del scrollport y el navegador trae cada control enfocado a la vista dentro de su ancestro
  desplazable —el mismo argumento que sostiene el del `DropdownMenu` en RRU-137. El fixture
  sube **dos** notificaciones largas a propósito: el stack ordena la más reciente primero,
  así que la más antigua acaba abajo, y su botón de descarte abre **fuera del viewport**.
  Sin ese elemento enfocable por debajo del pliegue, "el stack se desplaza" no tendría nada
  que revelar.

## Addendum: `container-type: inline-size` en componentes compuestos como flex items (RRU-141)

La convención container-first tiene una cuarta excepción de implementación, descubierta al
componer `Pagination` dentro de `DataTable`:

- **`container-type: inline-size` anula la contribución intrínseca de tamaño.** En un flex item
  sin `flex-grow`/`flex-basis` positivo, el navegador resuelve el tamaño base contra el contenido;
  con `contain: inline-size` esa contribución es **0px**, así que el item colapsa aunque su
  contenido quepa.
- **El consumidor que compone el componente debe darle una base positiva.** En `.rr-data-table__pagination`
  bastó `flex: 1 1 auto` para que el paginador llenara el footer y mantuviera su alineación
  interna. Sin esa línea, el pager desaparecía del árbol de accesibilidad (caja de 0×altura).
- **La regresión solo se detecta midiendo el consumidor.** La hoja de `Pagination` declaraba el
  container correctamente; el defecto aparecía en la composición con `DataTable`. El E2E del
  consumidor es quien debe assertar que el componente compuesto sigue siendo visible y tiene un
  ancho razonable.

## Addendum: form family y el suelo intrínseco de los controles reemplazados (RRU-142)

La quinta excepción de implementación afecta a `Input`, `Textarea`, `Radio` y `FormField`:

- **Los elementos reemplazados (`<input>`, `<textarea>`) tienen un ancho intrínseco**
  (`size=20` / `cols=20` del UA, aproximadamente 177px de contenido). Dentro de un flex/grid item,
  `min-width: auto` convierte ese intrínseco en suelo: con solo `width: 100%` el control no encoge
  por debajo y empuja la fila. El contrato es declarar `min-width: 0` en `.rr-input`, en
  `.rr-textarea` y en el wrapper `.rr-textarea-autosize`, porque ambos niveles pueden ser el flex
  item visible para el consumidor.
- **Una fila que se encoge es peor que una fila que salta de línea.** RRU-139 ya midió esto en el
  footer de `Dialog`: sin `flex-wrap: wrap` los botones se aplastan y sus etiquetas se rompen en
  3-4 líneas, sin desbordar la página. El criterio correcto para `RadioGroup--horizontal` es
  `flex-wrap: wrap`, más `min-width: 0` y `overflow-wrap: anywhere` en `.rr-radio-label` para que la
  opción pueda encogerse sin cortar palabras arbitrariamente.
- **`FormField` no declara `width: 100%`.** El root y el slot `.rr-form-field-control` sí declaran
  `min-width: 0`, pero darle al root un ancho del 100% como flex item en una fila horizontal
  cambiaría la composición del consumidor (`form-section.tsx` agrupa un `FormField` con un `Switch`
  en una misma fila). El ancho del campo sigue siendo decisión del consumidor.
- **Las afirmaciones invisibles se fijan en el CSS escrito.** Como en RRU-138, el E2E no puede
  detectar el suelo intrínseco sin un marco de ancho fijo, y un marco con `Inline` nowrap ya es un
  artefacto de prueba. Por eso el contrato se pincha con `*.responsive-contract.test.ts` leyendo
  las declaraciones, no asumiendo el efecto visual.

## Addendum: los que ya eran fluidos y los cuatro que no lo eran (RRU-143)

La octava familia de la épica era un inventario: diez componentes que el tablero
asumía fluidos. Medirlos demostró que cuatro no lo eran (`Text`, `Heading`,
`Badge` y `Switch.label`) y dejó escrito por qué los otros seis sí lo son.

- **Los elementos reemplazados ya están suelo por `min-width: auto`.** Un
  `<input type="checkbox">` con `width: var(--rr-space-4)` no necesita
  `flex-shrink: 0` porque su tamaño mínimo basado en contenido **es** ese ancho
  explícito. Esa es la distinción real frente a un `<button>` (IconButton), cuyo
  min-content es `0` y por eso sí necesita `flex-shrink: 0` para no aplastarse.
  El track de `Switch` es un replaced element con ancho fijo; su label, en cambio,
  es un flex item con texto y necesita el mismo par (`min-width: 0` +
  `overflow-wrap: anywhere`) que RRU-142 puso en `.rr-radio-label`.
- **La tipografía necesita `overflow-wrap: anywhere`.** `Text` y `Heading` no
  declaran ninguna propiedad de layout, pero un token irrompible (URL, id, hash)
  desborda un contenedor estrecho igual que el label de un botón. Solo
  `overflow-wrap: anywhere` realimenta las oportunidades de salto de línea en el
  min-content; `break-word` no lo hace, y dejaría un suelo que parece desbordamiento.
- **`min-width: 0` + `overflow-wrap: anywhere` en los flex items que llevan texto.**
  `Switch.label` y `Badge` son flex items con texto del consumidor; la convención
  fijada en RRU-136 (`Button`) y RRU-142 (`Radio`) aplica aquí también.
- **Los seis que sí eran fluidos y por qué:**
  - `Checkbox`: cuadrado fijo por token, replaced element.
  - `Avatar`: cuadrado fijo + `flex-shrink: 0` + `overflow: hidden`.
  - `Skeleton` / `Progress`: `width: 100%` sin padding/border que desborde.
  - `VisuallyHidden`: `position: absolute` 1×1, fuera de flujo, huella de layout cero.
  - `Portal`: no renderiza elemento propio; los hijos porteados escapan al
    `overflow: hidden` de su ancestro React.

## Estado

**Accepted.** EPIC-12 parte de esta convención. Cualquier desviación requiere justificación escrita en la tarjeta correspondiente.
