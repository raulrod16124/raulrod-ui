# ADR-004: Composición de componentes (APIs composables vs props)

- **Status:** Accepted
- **Fecha:** 2026-09-23
- **Tarjeta:** [RRU-051](../design-system-jira.md) · **Epic:** EPIC 5 / Fase 5 (guía §14, §15)
- **Referencias:** guía §13 (FormField), §14 (casos de overlays), §15 (Diseño de APIs) · [patrón de componente](../component-pattern.mdx) §6 (Composición > props) · [typescript](../typescript.md) (RRU-011) · [ADR-001](001-monorepo.md) · [ADR-003](003-styling-strategy.md) (RRU-028) · [tablero](../design-system-jira.md) §4 Playbook Paso 4 (tests de comportamiento)

---

## Context

La API de un Design System decide **cómo** un consumidor expresa lo que quiere construir. La guía §15 pide APIs coherentes entre componentes, y §5 advierte de que la API es lo único estable que el consumidor ve (todo lo demás es internal). Para el EPIC 5 la pregunta se vuelve obligatoria: los overlays (Dialog, Popover, Tooltip, Select, DropdownMenu…) son estructuras con **varios nodos relacionados entre sí** — trigger, contenido, título, descripción, footer, backdrop — que no son un solo elemento con variantes. La decisión de producto ya está implícita en las tarjetas (RRU-053 fija `<Dialog.Trigger>.Content…`), y este ADR la formaliza, define _cuándo_ aplicarla y registra los precedentes de código real que ya la materializan.

El problema concreto que resuelve esta decisión es la **tensión entre dos extremos**:

1. **Una prop por cada relación.** Un `<Dialog open title="…" body="…" footer={…} trigger={…}>` acumula decenas de props que replican a mano jerarquía, texto arbitrario (JSX como props) y estado de cada nodo. Cada nueva parte del componente exige más props, y las relaciones ARIA entre nodos (`aria-labelledby`, `aria-describedby`, `aria-controls`, roving focus) no se pueden cablear de forma fiable desde un único nodo raíz: hay que fabricar ids y duplicar lógica semántica fuera del control del DS (guía §14: los overlays deben resolver ARIA, focus trap/return, portal, layering por construcción).

2. **Composición convertida en dogma.** Una API compound para un componente de una sola pieza (un `Button`, un `Badge`, un `Avatar`) añade fricción sin beneficio: el consumidor tiene que conocer 2+ componentes y el contrato de unirlos para algo que es un `<button>` con variantes. La guía §15 lo prohíbe explícitamente: "No convertir la composición en dogma. Una API simple es preferible cuando resulta suficientemente expresiva."

Además, ya existe **evidencia real y repetida** en el repo de que la composición es el patrón que este DS usa cuando la estructura lo pide — no especulativo:

- **`FormField` (RRU-044):** raíz compound `FormField` + slots `.Label/.Description/.Control/.Error` + hook público `useFormField()`. Un único contexto; la raíz cablea ids/ARIA por presencia de slots recorriendo el árbol en render-phase (SSR-safe); el render-prop vive solo en `.Control` para el wiring de DOM. El propio comentario de `FormField.tsx` declara el patrón como "compound (component-pattern.mdx §6, ADR-004 pendiente, RRU-051)" — dependencia que este ADR resuelve.
- **`RadioGroup`/`Radio` (RRU-047):** composición por contexto (`name`, `size`, `value`, `onValueChange`, `disabled`, `orientation`) distribuidos entre el grupo y cada opción; el grupo genera el `name` y delega en la nativa del browser el roving focus.
- **Skip-link con `VisuallyHidden focusable` (RRU-033):** composición sin polimorfismo (`<a href="#main"><VisuallyHidden focusable>…</VisuallyHidden></a>`), precedente de que el consumidor aporta la semántica envolviendo.
- **`component-pattern.mdx §6`:** la fuente de verdad del patrón de componente ya fija "composición > props" y referencia este ADR.

## Decision

Adoptar una **convención de dos vías** y una **mecánica obligatoria** para las APIs composables de `@raulrod/ui`.

### Cuándo composición y cuándo API simple

Se usa una **API composable (compound)** cuando **al menos una** de estas condiciones se cumple:

1. **La estructura tiene múltiples nodos relacionados por estado o ARIA.** El estado de un nodo determina el de otro (trigger ↔ content: `aria-expanded`/`aria-controls`; título ↔ contenedor: `aria-labelledby`), o hay que wirear idrefs entre partes (Label↔Control↔Description↔Error en FormField). La composición permite que **la raíz** genere los ids y las relaciones por construcción, sin que el consumidor los fabrique.
2. **Compartir estado/contexto entre partes sin prop-drilling.** El valor, la selección o el tamaño de un grupo deben llegar a cada opción (RadioGroup→Radio, futuro Select→Option). Con una API por props eso exige pasarlo por valor y callback en cada nivel o mantener un árbol de props duplicado.
3. **La API por props provocaría prop-explosion o texto como props.** Cuando la superficie de configuración supera la de un "elemento con variantes", la vía compound (`children` reales) gana en expresividad y mantiene el control de layout en manos del consumidor (precedente FormField: "the consumer keeps full layout control").

Se usa **API simple (props)** cuando **ninguna** aplica o la API por props resulta suficientemente expresiva: un solo elemento con ejes de variante/estado (Button `variant/size`, Badge, Avatar, Input, Stack/Inline…). **No convertir la composición en dogma** (guía §15): la composición se justifica con necesidad estructural, no con preferencia estética.

La regla es binaria y se aplica por componente: un router de decisión previo es quién decide; cambiar de bando requiere ADR nuevo o tarjeta con evidencia de necesidad (regla 2 del tablero: cambios de API pública sin ADR no se aceptan).

### Mecánica obligatoria de un componente compound

- **Nombre de la raíz como espacio de nombres de los slots:** `<Dialog>.Trigger/.Content/.Header/.Title/.Description/.Footer`; `<FormField>.Label/.Description/.Control/.Error`. Exposición: cada slot se monta como **prop de la raíz** (`Dialog.Trigger = …`), re-exportado desde `index.ts`.
- **Un solo contexto por componente** (el contexto es internal; no se exporta — frontera §24). La raíz es la única que lo **provee**; los slots lo **consumen**. El contexto transporta ids/ARIA/estado, nunca estilos.
- **Wiring por presencia de slots en render-phase** (precedente FormField `collectSlots`): la raíz detecta qué slots hay recorriendo el árbol `children` (recursivo, honorables arrays/fragments/condicionales) y de ahí deriva ARIA (`aria-labelledby` nunca vacío; sin Descripción/Error no hay idrefs colgantes → axe-safe). **Prohibido** `useEffect` para derivar wiring: SSG/SSR y CSR deben producir el mismo markup (guía §5).
- **El render-prop solo donde hace wiring de DOM** (precedente `FormField.Control`): es la vía para que el consumidor dibuje un control con los atributos cableados (`{(field) => <Input {...field}/>}`). La raíz **no** acepta children-fn.
- **Sin `asChild` ni polimorfismo** (decisión cerrada RRU-031): la semántica la aporta el consumidor envolviendo o vía props acotadas (`as` de Heading es la única excepción del MVP). La composición es de **estructura**, no de render por sustitución.
- **Controlled/uncontrolled resueltos en la raíz** (guía §14): `value/defaultValue/onValueChange` se manejan en el provider y fluyen por contexto, como en RadioGroup.
- **Cada slot con su `forwardRef` y `displayName`** (patrón RRU-040; `check-pattern.mjs` lo custodia) y tipos por slot en `*.types.ts`.

## Alternatives considered

### A. API por props (un solo componente con toda la estructura como props)

Un `<Dialog open title="Delete?" body="…" trigger={<Button/>} onOpenChange={…}>`. Ventajas: una superficie, fácil de recordar, sin contexto. Por qué se descarta: (1) **prop-explosion** — cada nodo añade props (y el texto/JSX como props obliga a `ReactNode` en props, perdiendo la expresividad de los `children` y el control de layout del consumidor); (2) **ARIA no cableable** — los ids de `aria-labelledby`/`aria-describedby`/`aria-controls` entre nodos que _el consumidor_ ya conoce al escribir JSX se convierten en entradas de props que el DS no puede garantizar (ids vacíos, duplicados); (3) **estado por parte** — Trigger/Content comparten estado de apertura que por props hay que reenviar manualmente en cada uso (precedente FormField: un 4-elemento por props exigiría 10+ props y las relaciones Label↔Control rotas). **Descartada: suficiente solo cuando no hay estructura (el bando "API simple" de la Decision), insuficiente para overlays y formularios.**

### B. `asChild` / `as` polimórfico de slots (estilo Radix Slot)

Un slot «se fusiona» con el elemento del consumidor (`<Dialog.Trigger asChild><Button>…</Button></Dialog.Trigger>`). Ventajas: el trigger (por ejemplo) se ve exactamente como el componente del consumidor sin envoltura extra. Por qué se descarta: ya es **decisión cerrada** en la sesión de RRU-031 (sin `asChild`/polimorphic en el MVP, registrado en la tarjeta) y este ADR la mantiene, porque (1) el merge de `children` sobre un elemento de tipo desconocido exige clonar con `React.cloneElement(Slot…)` — fricción de tipos (guía §16: errores al servicio del consumidor) y riesgo de fusión insegura de props/refs; (2) rompe el patrón probe simple (RRU-040) y complica el `check-pattern.mjs`; (3) para el MVP el coste de DX no compensa: un trigger propio se resuelve con `<Button asChild>` por consumidor envolviendo sin fusionar. **Descartada: complejidad de render-sustitución que la decisión #RRU-031 ya excluye.**

### C. Headless público (primitivas + hooks exportados)

Exponer las piezas sin estilos (`<DialogPrimitive/useDialog>`) y que el consumidor dibuje y estilice todo. Ventajas: máxima libertad. Por qué se descarta para el MVP: sobre-ingeniería (regla §33 — no features por adelantar competencias); los hooks internos que overlays necesitan (`useFocusTrap`, `useDismissableLayer`, `useFocusReturn`, `useScrollLock`) se construyen como **infraestrutura privada** en RRU-052 (frontera §24: no exportados) y la **API pública sigue siendo estilizada**. Un consumidor con necesidad de headless real es una tarjeta nueva con evidencia, no una decisión de default. **Descartada: duplica mantenimiento y deriva la accesibilidad a quien la usa.**

### D. Estado global / modal-manager por props

Un registro global de dialogs (`<DialogManager stack={[{open:true,…}]}>`) o estado global para abrir/cerrar cualquier overlay por id. Ventajas: múltiples overlays apilados desde una fuerza. Por qué se descarta: (1) reintroduce lo que las CSS-variables resuelven (ADR-003): el DS no debe meter lógica de estado global en el consumidor ni dependencias de contexto del host; (2) rompe SSR/SSG y el "stateless por defecto" (guía §5, §11); (3) el **layering** (z-index semántico, RRU-023) y el apilamiento real de overlays se gestionan por composición local (cada overlay en su nivel), no por un registro; un sistema de notificación es Toast (RRU-059), que tendrá su propio canal `aria-live` — no un manager global. **Descartada: plantea un problema que la composición local + escalas resuelven con menos superficie.**

## Consequences

### Positivas

- **ARIA por construcción:** la raíz de composición genera ids y relaciones (`aria-labelledby`/`aria-describedby`/`aria-controls`/`aria-checked`) desde la presencia real de slots; el DoD "sin `aria-labelledby` vacío" de RRU-053 y el "errores anunciados" de RRU-044 se cumplen por diseño, no por disciplina del consumidor.
- **Extensibilidad y control de layout:** los `children` reales dejan el orden, el layout y la semántica envolvente en manos del consumidor; añadir una parte nueva al componente es añadir un slot, no un breaking change de props.
- **Una sola vía para estado compartido:** contexto único por componente, sin prop-drilling (RadioGroup precedent); controlled/uncontrolled en la raíz.
- **Explotación del precedente ya publicado:** FormField, RadioGroup/Radio y el skip-link de VisuallyHidden ya siguen esta convención; el ADR la convierte en el «qué y porqué» que RRU-053…RRU-057 consumen.
- **Consistencia con la decisión #RRU-031:** sin polimorfismo, el patrón base (RRU-040) sigue sin fallback de render-sustitución; `check-pattern.mjs` puede custodiar la convención de slots con la misma mecánica que el resto de guards.

### Negativas / costes

- **Más superficie por componente:** la raíz compound, el contexto, los slots y sus tipos habitan N archivos (Playbook §4 «kebab» + slots), y la raíz debe ser un provider puro que no duplique estado; el coste de build/lectura es mayor que una props-API trivial (asumido solo donde la estructura lo pide).
- **Slot-detection limitada a los slots como hojas/`children` directos:** si un consumidor envuelve un slot en un componente custom, la raíz no lo detecta y el wiring queda sin ARIA (limitación documentada en FormFieldProps y asumida; el aviso de uso se cubre con tests de comportamiento en RRU-069).
- **Curva de aprendizaje del contrato compound:** el consumidor debe conocer los slots y su orden/composición; se mitiga con Mapas de stories en Storybook (RRU-082) y docs MDX por componente (RRU-083) que muestren el árbol de slots.
- **Fricción para casos triviales si se aplica mal:** la regla «composición solo con necesidad estructural» es la salvaguarda; desviarse (componer lo simple) es un antipatrón que la revisión de tarjetas debe vigilar.

### Riesgos observables

- **Copiar el patrón sin la necesidad:** equipos consumidores que componen todo (o los propios autores en futuras tarjetas) por inercia; el cribado está en la descripción de cada tarjeta de componente (RRU-053…RRU-060 ya especifican cuál es composable y cuál no).
- **Contexto que se filtra a la API pública:** el contexto debe quedar internal (frontera §24); si un slot publica el contexto de la raíz, el consumidor empieza a acoplarse a él. Se custodia con el gate de fronteras de RRU-103 y la revisión de `index.ts`.
- **Exceso de render-prop:** el render-prop es la vía de wiring de DOM y no debe multiplicarse por cada slot; la raíz no acepta children-fn. Si una necesidad real exige más render-props, es una tarjeta nueva, no una ampliación silenciosa.
