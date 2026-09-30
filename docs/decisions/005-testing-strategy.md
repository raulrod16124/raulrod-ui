# ADR-005: Estrategia de testing (niveles, a11y repartido y sondas negativas)

- **Status:** Accepted
- **Fecha:** 2026-09-26
- **Tarjeta:** [RRU-070](../design-system-jira.md) · **Epic:** EPIC 7 / Fase 7 (guía §19)
- **Referencias:** guía §5 (Stack > Testing), §18 (Accesibilidad), §19 (Testing), §21 (Documentación), §22 (ADRs), §24 (Public API), §31/§32 (contrato de calidad), §33 (overengineering), §39 (preguntas de revisión > Testing) · [patrón de componente](../component-pattern.mdx) (RRU-040) · [ADR-002](002-token-architecture.md) (arquitectura de tokens y gate AA) · [ADR-003](003-styling-strategy.md) (CSS como contrato) · [ADR-004](004-component-composition.md) (composición) · tablero §4 Playbook Paso 4 (tests de comportamiento)

---

## Context

La guía §19 fija tres niveles —unit, component, E2E— y una regla: _behavior over implementation_. El nivel "component" es el de prioridad alta, y la propia guía pide "evitar comprobar excesivamente detalles internos que podrían cambiar sin romper el contrato". Eso es correcto pero **insuficiente** para un Design System cuyo contrato público no es solo lo que se renderiza. Este ADR formaliza la estrategia que el código ya materializa y que RRU-068/RRU-069 dejaron sin escribir. Tres problemas concretos:

1. **El contrato de un componente de este DS tiene tres capas, y solo una es "comportamiento observable".** Un componente promete (a) lo que hace —abre, cierra, atrapa el foco, anuncia; (b) cómo se compone y se estiliza —`forwardRef` real, `displayName`, merge de `className`, modificadores `rr-*`, formas de fichero, barrel de estilos—; y (c) que su CSS consume **solo** tokens. Un refactor que renombra `rr-dialog-backdrop`, que publica un hex suelto en `Dialog.css` o que saca `DialogContent` de `src/dialog/` no rompe **ningún** test de comportamiento: rompe la promesa. Históricamente esa capa se cubrió con 20 scripts `check-*.mjs` en `packages/ui/scripts/`, **gitignored** porque eran ruido local (política RRU-014/RRU-021): no los ejecutaba nadie en CI y un checkout limpio no podía correr la suite. RRU-068 los migró a specs trackeables, pero la **política** —qué se afirma, dónde y por qué— nunca se escribió. Sin ella, cada tarjeta inventa sus asserts a su medida.

2. **La accesibilidad no cabe en un solo gate, y el repo ya lo tenía repartido sin decirlo.** `axe` sobre `happy-dom` no tiene layout (la regla `color-contrast` solo puede devolver `incomplete`), no tiene lector de pantalla, y hay una familia entera de relaciones que axe marca `incomplete` y **nunca** violación: el `aria-controls` de un elemento con `aria-haspopup` es exactamente ese caso (`Dialog.test.tsx:144`). El contraste vive en otro sitio —los pares de tokens con la fórmula WCAG en `@raulrod/tokens`— y la resolución real de referencias y el focus real solo existen en un navegador. Tres gates distintos, cada uno con un límite que debe estar escrito, o el siguiente que lea el código asumirá que `toHaveNoViolations()` significa "accesible".

3. **Un gate que nunca se ha visto fallar no es evidencia de nada.** El bug de RRU-115 es el ejemplo canónico: el trigger anunciaba `aria-controls={dialog.contentId}` y el panel no estampaba ese `id`; sobrevivió a cuatro épics porque el spec afirmaba `toBeTruthy()` sobre el atributo y porque axe **no puede** marcarlo. El repo ya practica el patrón correcto en tokens (`tokens.test.ts:16-17`: fixtures deliberadamente rotos alimentan la gate; `css/emit-css.test.ts:5,100`: siete invariantes de emisión que deben rechazar capas rotas), pero eso vive en un paquete y no es una regla del proyecto.

## Decision

Adoptar **tres niveles** (los de la guía §19) más una **capa transversal de contratos estáticos**, una política de accesibilidad **repartida en tres gates con límites escritos**, la regla _behavior over implementation_ operationalizada con una lista explícita de aserciones sobre internals que sí se permiten, y la **sonda negativa obligatoria** antes de dar por cerrada una tarjeta.

### 1. Tres niveles, y una capa transversal que no es un nivel

| Nivel                          | Qué afirma                                                                                                                                                                                                        | Qué NO debe afirmar                                                                            | Dónde vive                                 | Gate                              |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------ | --------------------------------- |
| **Unit**                       | lógica aislada sin React (`cx`, geometría con rects sintéticos, roving focus, resolución de `--rr-z-*`) y contratos de hooks contra un DOM emulado (`focusTrap`, `focusReturn`, `scrollLock`, `dismissableLayer`) | render completo de componentes, ARIA, CSS                                                      | `packages/ui/src/utils/*.test.{ts,tsx}`    | `pnpm test`                       |
| **Component** (comportamiento) | `render`, `interaction`, `states`, `keyboard`, `callbacks`, `a11y` + el contrato de props (`ref`, merge de `className`, pass-through de `aria-*`/`data-*`)                                                        | detalles internos que un refactor puede cambiar sin romper el contrato; existencia de ficheros | `packages/ui/src/<comp>/<Pascal>.test.tsx` | `pnpm test`                       |
| **E2E**                        | flujos críticos en DOM real, consumiendo `dist/` construido: overlays, teclado de Select, envío de formulario, tema                                                                                               | estilos y contratos internos; valores de token                                                 | `apps/playground/e2e/*.spec.ts`            | `pnpm test:e2e` (job `e2e` en CI) |

Volumen real en la fecha de este ADR (leído de una ejecución fresca, no copiado del tablero): **41 ficheros / 892 tests** en `@raulrod/ui` —28 de componente, 11 de `utils/` y 2 transversales (`component-pattern.test.tsx`, `styles.test.ts`)—, **2 ficheros / 61 tests** en `@raulrod/tokens`, **5 specs / 30 tests** E2E.

Los **contratos estáticos** son una capa **transversal**: no un cuarto nivel, porque no prueban comportamiento de usuario sino las promesas que el paquete hace al consumidor, y porque el mismo contrato se afirma desde el nivel que le corresponde (el lineage de tokens, desde el spec del componente; la estructura de ficheros, desde el gate de patrón). Son cuatro cosas, todas trackeables:

1. **CSS leído como texto, no como computed style.** `readComponentCss` + `expectTokenLineage` (`test-support/css.ts:9,106`): cada `var(--rr-*)` que referencia el CSS de un componente debe existir en `dist/tokens.css` (artefacto construido, legítimamente legible porque `test` depende de `build`, `turbo.json:21`). Lo usan **20 specs**. El porqué de leer el fuente y no el estilo computado está escrito en el helper: hay contratos —qué token lee una regla, **orden de origen** entre `:hover` y `:disabled` (`Button.test.tsx:222`), presencia de `prefers-reduced-motion`— que ningún `getComputedStyle` de un DOM sin layout puede demostrar, y leer el fuente mantiene la aserción independiente del pipeline de CSS (ADR-003). Aserciones inversas también: `VisuallyHidden` **debe** referenciar 0 tokens, porque su excepción está documentada.
2. **Gate de patrón del paquete** (`component-pattern.test.tsx`, 256 casos): forma de ficheros, `forwardRef` real (`Symbol.for("react.forward_ref")`), `displayName`, merge de `className` y pass-through de props, convención de ejes (nada de `kind`/`dimension`), y frontera de los helpers internos. El propio spec declara el motivo: el patrón es "a promise the package makes to consumers" (`component-pattern.test.tsx:4`).
3. **Inventario del barrel de estilos** (`styles.test.ts`): cada stylesheet autoral se importa exactamente una vez, contrastado contra el **filesystem**, no contra una lista escrita a mano.
4. **Frontera de la API pública** (`overlays-public-boundary.test.ts:3`): importar el entry point real y afirmar que los helpers internos **no** forman parte de él. Fail-loud por construcción, en vez de por disciplina.

Regla derivada: **si el contrato es de comportamiento, se afirma en el nivel de comportamiento; si el contrato es del paquete (forma, frontera, tokens, barrel), se afirma leyendo el fuente, con un test trackeable.** Nada de esto vuelve a un script local sin trackear.

### 2. Behavior over implementation, operationalizada

La regla de la guía §19 y del §39 se convierte en una pregunta que **todo test nuevo debe poder responder por escrito**: _¿qué promesa del consumidor protejo?_ Tres corolarios:

- Un test cuyo motivo sea "que exista un elemento con esta clase" es un detalle de implementación, **salvo** que la clase sea el contrato (orden del merge de `className`, emisión de modificadores, lineage de tokens) — que es el caso de los specs unitarios, donde el vocabulario `rr-*` es su objeto de estudio.
- Ante la duda, la pregunta es la de §39: _¿qué escenario puede romperse con una refactorización?_ Si la respuesta es "ninguno, porque solo cambia la implementación", el assert sobra.
- Los tests de componente se escriben con Testing Library y `userEvent`, nunca con `createRoot`/`act` a mano. El entorno es `happy-dom` (DOM emulado, con el harness común en `vitest.preset.mts` y la config por paquete en `packages/ui/vitest.config.ts:14-15`; no es un navegador, y por eso no hay layout ni cascade real) y aun así `Tab`, `Escape` o un `pointerdown` fuera del panel son **eventos reales** sobre nodos reales, no stubs: es lo que permite afinar teclado, foco y anuncios sin Playwright.

### 3. Qué sí se puede asertar sobre internals (lista cerrada, con motivo)

Estas aserciones rompen "no aserción de implementación" a propósito, y cada una tiene que escribir su motivo en el propio test:

| Aserción                                          | Dónde                                          | Por qué se permite                                                                                                       |
| ------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `document.getElementById(anunciado) === panel`    | `Dialog.test.tsx:141-144`, `dialog.spec.ts:58` | es lo que hace un lector de pantalla; asertar "el atributo no está vacío" es exactamente lo que dejó el bug cuatro épics |
| Clases `rr-*`                                     | specs unitarios                                | el merge de `className` y los modificadores de variante son contrato (ADR-004, Playbook §4)                              |
| Clase interna de un nodo portaled o `aria-hidden` | `theme.spec.ts:133-134` (backdrop)             | no tiene identidad accesible propia: es decoración; la clase es el único handle                                          |
| `document.body.style.overflow`                    | `Dialog.test.tsx`                              | el contrato del scroll lock **es** ese efecto observable                                                                 |
| `forwardRef` / `displayName` / forma de ficheros  | `component-pattern.test.tsx:223`               | el patrón es una promesa del paquete, no una preferencia de estilo                                                       |
| Ausencia de un export interno en el entry point   | `overlays-public-boundary.test.ts:3`           | frontera §24; es un contrato de API pública                                                                              |
| **Ausencia** de `var(--rr-*)`                     | `VisuallyHidden.test.tsx`                      | aserción negativa sobre una excepción documentada: la excepción debe seguir siéndolo                                     |

### 4. Accesibilidad: tres gates, tres límites, y uno que no se sustituye

| Gate                                    | Qué cubre                                                                                                                                                      | Límite declarado                                                                                                                                                                                                                      |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auditA11y` en `@raulrod/ui` (18 specs) | reglas de axe sobre el DOM renderizado                                                                                                                         | `color-contrast` desactivada: sin layout real solo puede dar `incomplete`; `region` desactivada para fragmentos (un spec que renderiza un control no tiene que envolverlo en un landmark) — política en `test-support/axe.ts:8-17,24` |
| `@raulrod/tokens` (node, sin DOM)       | contraste AA de los **29 pares autorizados** con la fórmula WCAG (`tokens.test.ts:114`), nomenclatura, forma de valores, lineage de color, unicidad de targets | solo pares autorizados: un componente no puede introducir un par sin actualizar la lista (gobierno de ADR-002)                                                                                                                        |
| E2E (DOM real)                          | resolución de idrefs, focus y return de focus reales, `prefers-reduced-motion` observable, tema resuelto por la cascada                                        | Chromium único; el `aria-controls` **solo** se puede probar aquí (axe lo marca `incomplete`, nunca violación)                                                                                                                         |

Regla de política que sale de los tres: **una regla que no puede funcionar en el entorno se desactiva con el motivo escrito y su vacío se cubre en otro gate; una regla que sí funciona y revela un gap real del producto se deja activa y el gap se aserta como test.** El segundo caso tiene precedente: el trigger "bare" de `Select` es un combobox sin accessible name porque `role="combobox"` no toma el nombre del contenido; en vez de apagar la regla, `Select.test.tsx:538-550` lo afirma como gap documentado y la integración soportada (dentro de `FormField`) es la que se audita.

Y lo que ningún gate automatizado sustituye: la revisión manual con teclado y lector de pantalla (guía §18, RRU-071) y el QA final de reduced-motion/contraste (RRU-072). El comment de `axe.ts:12` ya lo dice al desactivar `color-contrast`: el contraste no queda sin probar, cambia de sitio.

### 5. Sonda negativa obligatoria antes de cerrar una tarjeta

- **Regla:** una gate nueva, o una gate tocada, no se cierra hasta que se la ha visto **fallar**. "Una gate que nunca se ha visto fallar no es evidencia de nada" (`tokens.test.ts:16-17`).
- **Forma:** si el gate es data-driven, los fixtures rotos se quedan **como tests permanentes** (los doce casos del self-check de `tokens.test.ts:371` y los siete de `css/emit-css.test.ts:100` alimentan la gate con fixtures deliberadamente malos y además verifican la propia fórmula WCAG). Si es un fix puntual, la sonda es quitar el fix, ver rojo y documentar **qué tests** se rompen (RRU-115: quitar el `id` del panel dejó rojos exactamente 2 tests de `Dialog.test.tsx` y 1 spec E2E, y nada más).
- **Por qué es una regla y no una costumbre:** un test que nunca ha fallado puede estar asertando algo falso. El precedente de RRU-115 es el argumento: 4 épics, ~900 tests, y el idref colgante no lo detectó nadie porque nadie comprobó que la gate pudiera detectar.

### 6. Reglas de la suite E2E

1. **Locators como el usuario encuentra las cosas:** rol, nombre y texto visible (`e2e/helpers.ts:5-10`). `data-testid` solo donde el nodo no tiene identidad accesible propia; **prohibido asertar clases `rr-*`** salvo decoración `aria-hidden` (`theme.spec.ts:133-134` es la única excepción en 30 tests, y lo dice). Un locator que exige la clase ata la suite a la implementación: renombrar una clase rompería un test que probaba comportamiento.
2. **Cero esperas arbitrarias** (`helpers.ts:11-12`): toda espera es una condición que auto-reintenta. `waitForTimeout` convierte una carrera real en un rojo o en un falso verde.
3. **Cero valores de token hardcodeados** (`theme.spec.ts:10-12`): el spec compara lo que la cascada **produce** en dos situaciones, para que un cambio de paleta no convierta el spec en una segunda fuente de verdad.
4. **Siempre contra el build** (`playwright.config.ts:4`): `vite preview`, nunca el dev server — el objetivo es probar lo que recibe el consumidor desde los artefactos publicados; un dev server serviría fuentes y escondería un build roto. Por eso `test:e2e` depende de `build` y el job de CI **no** restaura la caché de Turborepo (`.github/workflows/ci.yml:106`).
5. **El retry es diagnóstico, no pintura** (`playwright.config.ts:30`): 1 retry solo en CI, con trace del intento fallido; `workers: 1` en CI porque los overlays mueven el foco y atrapan el teclado (`:33`); `forbidOnly` para que un `test.only` olvidado rompa el build en vez de encoger la suite en silencio.
6. **Chromium único** (`playwright.config.ts:11,46`): los flujos son DOM + ARIA + teclado nativos, idénticos en los tres motores; `projects` queda como punto de extensión cuando haya que probar una diferencia real (focus en WebKit, por ejemplo).

### 7. Dónde vive el harness

- **Un preset compartido en la raíz** (`vitest.preset.mts`): lo que no puede divergir por paquete —`include` de specs junto al código, `extensionAlias` para los imports TS con `.js`, `clearMocks`. Como vive fuera de todo paquete, **no** entra en `$TURBO_DEFAULT$`, así que está declarado en `globalDependencies` (`turbo.json:5`): la misma clase de bug que el input de `emit-css` corregido en RRU-024, donde Turbo cacheaba sin regenerar.
- **Cada paquete añade solo su entorno**: `happy-dom` + setup en `@raulrod/ui` (`packages/ui/vitest.config.ts:14-15`), `node` en `@raulrod/tokens` (`packages/tokens/vitest.config.ts:12`) porque sus contratos son datos puros.
- **Dependencias de test declaradas explícitamente** en cada `package.json`. No basta con el hoisting de pnpm: sin declararlas explícitamente, `import-x/no-unresolved` y `tsc` fallan y el fallo aparece en un archivo que no has tocado.
- **Los tests no se publican**: `packages/ui/tsconfig.build.json:3` excluye `**/*.test.{ts,tsx}` y `src/test-support/**` del `dist/` (y `packages/tokens/tsconfig.build.json:3` hace lo propio con `tools/**`) — un test compilado a `dist/` es un bug de empaquetado, no un test.
- **`globals: false` implica `cleanup()` explícito** (`test-support/setup.ts:14,29`): el cleanup automático de RTL se engancha al `afterEach` global, que aquí no existe; sin él, portales, focus traps y timers se filtran entre casos.
- **Los `.d.ts` de ambientación son script o módulo, y no es intercambiable**: `packages/ui/src/test-support/jest-axe.d.ts:9-10` debe ser script (declaración ambiente de un paquete sin tipos) y `packages/ui/src/test-support/vitest-matchers.d.ts:3-4` debe ser módulo (augmentation de `vitest`). Un `declare module "vitest"` en un `.d.ts` script **reemplaza** la superficie de tipos del módulo y rompe todos los `import { it } from "vitest"` (148 errores TS2305 cuando se probó al revés).

### 8. Lo que deliberadamente no es un gate

- **Cobertura de líneas/branches: no hay gate.** No hay proveedor, ni umbrales, ni script que lo produzca; `coverage/**` en `turbo.json:23` es una salida reservada, no un umbral. La alternativa evaluada y el motivo de descartarla están en _Alternatives considered_ (E): un porcentaje premia asserts triviales y castiga código de plumbing (focus trap, capa de layers) que sí está probado por comportamiento. La señal que se usa en su lugar es la del §5: contratos + sondas negativas + gates estructurales que fallan de forma ruidosa. La cobertura se reevalúa solo con evidencia (p. ej. si un E2E falla y ningún nivel lo cubre).
- **Regresión visual**: depende de las stories (RRU-080/082); hoy no hay superficie.
- **Performance / bundle size**: RRU-092/095, con su propia métrica.
- **Matriz de navegadores**: `projects` de Playwright cuando aparezca una diferencia real entre motores.

## Alternatives considered

### A. Solo unit + component, sin E2E

Qué compra: velocidad y cero superficie de flakes. Por qué se descarta: el bug de RRU-115 no se habría encontrado —`aria-controls` es `incomplete` en axe, y el atributo apuntaba a un id inexistente que solo se ve al resolverlo en el documento real. La guía §19 ya pide Playwright para flujos críticos y RRU-069 los define. Con solo dos niveles, el DS publicaría accesibilidad sin poder probarla: exactamente el fallo que motivó la tarjeta.

### B. `jsdom` en lugar de `happy-dom`

Qué compra: el DOM más estándar y más rápido de crear. Por qué se descarta: se adoptó `happy-dom` en RRU-052 y es el que sostiene focus trap, `pointerdown` fuera del panel, scroll lock y los 18 `auditA11y`. Cambiarlo ahora es un churn sin contrato que ganar; y lo relevante para esta decisión es que **ningún** DOM sin layout resuelve `color-contrast`, así que el argumento real a favor de `happy-dom` es la estabilidad de los eventos de foco, no la conformance. Queda como decisión revisitable si aparece un bug de evento que `happy-dom` no modela.

### C. Cypress o WebdriverIO en lugar de Playwright

Qué compra: (Cypress) un runner integrado con su recorder y su panel; (WebdriverIO) un único protocolo para muchos browsers. Por qué se descarta: Playwright da **aislamiento de contexto por test** y `fullyParallel` real (los overlays mueven el foco; tests que comparten página se contaminan), `webServer` con espera por condición, y artefactos de debug (trace, video, screenshot) de serie. El coste real de Playwright es la instalación del browser en CI, que ya está resuelta y cacheada por lockfile (`.github/workflows/ci.yml:95`). Alternativa revisitable si hiciera falta una matriz de browsers de producto; no lo es para el MVP.

### D. `test-runner` de Storybook (interactions) en vez de una suite E2E propia

Qué compra: los flujos de componente corriendo **en la propia Storybook**, con addons que ya son docs, y sin app de consumo. Por qué no sustituye: (1) Storybook es RRU-080/082, posterior a este ADR, así que hoy no existe; (2) no prueba lo que un consumidor recibe —`exports`, CSS publicado, tokens resueltos— que es la mitad del contrato de un paquete y el motivo por el que el E2E corre contra `vite preview` y no contra un dev server; (3) el playground es una superficie de revisión real que ya existe. **Se registra como extensión**: cuando las stories existan, las interactions cubren los estados y los flujos de componente en aislamiento, y el E2E se queda con los flujos que cruzan composición y build.

### E. Cobertura de código como gate

Qué compra: un número objetivo, comparable entre PRs, imposible de "ganar" sin tests. Por qué se descarta: (1) el número premia asserts triviales (`expect(true).toBe(true)` sube cobertura y no prueba nada) y castiga el código que más riesgo tiene —focus trap, `dismissable-layer`, `scroll-lock`, la capa de z-index— porque su código es mayoritariamente ramas; (2) no es un contrato: un test que ejecuta una línea no demuestra que el comportamiento sea correcto, que es la regla de §2; (3) el coste es real (proveedor, configuración, umbrales, gate en CI) para un MVP con 892+61+30 tests ya verdes y gates que han demostrado detectar fallos (RRU-021, RRU-068, RRU-115). Se acepta el coste de no tener el número y se compensa con §5: sondas negativas obligatorias y gates estructurales que fallan ruidosamente. Reevaluar con evidencia, no por moda.

### F. Snapshots de markup (`toMatchSnapshot`)

Qué compra: diff instantáneo de "cualquier cambio" sin escribir asserts. Por qué se descarta: (1) un snapshot falla ante **cualquier** cambio, incluido el inocuo, así que entrena al equipo a reescribir snapshots y a no leer el diff —el opuesto de una gate; (2) no distingue un cambio de contrato de uno cosmético, que es justo lo que este ADR quiere exigir; (3) el equivalente útil ya existe y es explícito: el merge de `className` y la emisión de modificadores se asertan por igualdad de string exacta en `component-pattern.test.tsx` (`'class="rr-stack probe"'`), lo cual es determinista, legible y fail-loud.

### G. Los tests de tokens dentro de `@raulrod/ui`

Qué compra: un solo paquete que testear, un solo `pnpm test`. Por qué se descarta: los contratos de tokens (nomenclatura por capa, forma de valores, pares AA con fórmula WCAG, invariantes de emisión CSS) son **datos puros**: no necesitan DOM y no necesitan React. En su propio paquete corren en entorno `node` (`packages/tokens/vitest.config.ts:12`) y en milisegundos, y sus asserts son más honestos: si el gate de contraste viviera en el paquete de componentes, parecería una prueba de componentes. Además fija la frontera de dependencias en la dirección correcta: `@raulrod/ui` consume tokens, no al revés.

### H. Mantener el status quo anterior a RRU-068 (scripts `check-*.mjs` locales)

Qué compra: cero migración y dependencia cero de test. Por qué se descarta: eran **gitignored** (política `/docs` aplicada a `**/scripts/*.mjs`), así que `pnpm test` en un checkout limpio no ejecutaba el gate — CI rojo en un push, y la deuda de RRU-021/024 sin resolver. La lección de arquitectura que se conserva no es el script: es que **la verificación tiene que ser código trackeable que el gate de la raíz ejecuta**, y por eso esta tarjeta no publica "guía de testing" sino una política de qué se afirma y dónde, con sus límites.

## Consequences

### Positivas

- **La pirámide de la guía deja de ser descriptiva y pasa a ser normativa**: cada aserción nueva tiene un sitio y un motivo, y la pregunta "¿qué promesa protejo?" (§2) es la misma que §39 usa en la revisión de milestone.
- **Los contratos del paquete están cubiertos en código trackeable**: forma de ficheros, `forwardRef`, `displayName`, merge de `className`, pass-through, ejes de variante, frontera de helpers, inventario de estilos, lineage de tokens. Un componente nuevo sin CSS publicado rompe `styles.test.ts`; un componente que introduce un hex suelto rompe su spec.
- **La accesibilidad tiene un mapa honesto**: se sabe qué gate cubre qué y qué ninguno cubre. El hueco de `aria-controls` está escrito donde se descubrió, y la integración soportada de `Select` es la auditada.
- **Una gate se demuestra a sí misma antes de cerrarse** (§5), y los negativos quedan como tests permanentes en tokens y en el emisor de CSS.
- **El fallo por nivel es barato de diagnosticar**: un rojo en `pnpm test` es de comportamiento/contrato, un rojo en `pnpm test:e2e` es de integración real, y el job de E2E corre **en paralelo** al quality gate (`.github/workflows/ci.yml:66`) para no hacer esperar un flujo roto a un build verde.

### Negativas / costes

- **Más superficie que la pirámide de la guía**: 41 specs en `@raulrod/ui` (28 de componente, 11 de `utils/`, 2 transversales, uno de los cuales —`component-pattern.test.tsx`, 256 casos— es el más grande del paquete) es más código de test que lo que tendría un proyecto de librería con una pirámide de dos niveles. Se acepta porque la alternativa era una deuda invisible (scripts que nadie ejecutaba).
- **Leer CSS y fuentes como texto ata el test a la forma del archivo**: un cambio de estructura de `Dialog.css` que mantenga el contrato (mismos tokens, mismos estados) hace tocar el test aunque el comportamiento sea idéntico. Es el precio de poder afirmar contratos que el DOM no prueba, y es un precio visible: el reviewer ve exactamente qué regla se cambió y por qué.
- **El lineage de tokens lee un artefacto de otro paquete** (`dist/tokens.css`), lo que ata el test al orden `build` → `test`. Se asume a cambio de que el contraste se verifique contra la capa realmente emitida y no contra el TS en memoria.
- **Chromium único** deja sin probar diferencias reales de motor en focus y en APIs de accesibilidad por motor. Aceptado en el MVP; `projects` es el punto de extensión.
- **Sin gate de cobertura** se pierde una métrica de tendencia. Es una pérdida asumida y revisable (§8).

### Riesgos observables

- **Sobre-afirmar internos**: la lista de §3 es cerrada a propósito, pero cualquier spec puede añadir la suya. Se custodia en la revisión de §39 (¿protejo una promesa o un detalle?) y en el hecho de que toda aserción de internals tenga su motivo escrito en el propio archivo, que es lo que hace que se pueda cuestionar en review.
- **Que `color-contrast` desactivada se lea como "el contraste no se prueba"**: está contraindicado en dos sitios (`axe.ts:8-14`, este ADR §4). La lista de 29 pares autorizados es la que manda, y ampliarla es un acto explícito.
- **Deriva del harness compartido**: el preset está fuera de los paquetes y por eso necesita `globalDependencies`; si alguien lo mueve, hay que mover esa entrada. Es la misma trampa que el input de `build` en RRU-024.
- **Sobre-usar el E2E para todo lo que no necesita navegador**: el coste por test (build, servidor, 3-4 s) hace crecer el tiempo de CI. La frontera de §1 (comportamiento observable en DOM real) es la que lo evita; subirla exige escribir el motivo.
- **Que el ADR envejezca peor que el código**: por eso las citas apuntan a `file:line` y por eso las cifras se leen de una ejecución, no del tablero. Cuando los niveles cambien (las interactions de Storybook en RRU-080, `exports` reales en RRU-091, gate de API en RRU-103), este ADR se actualiza en la misma tarjeta que introduce el cambio.

### Gaps que este ADR registra y no resuelve

| Gap                                                                         | Dónde se cubre / quién                                                                                                                                         |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Revisión manual con teclado y VoiceOver                                     | RRU-071 (P1) — no sustituible por axe (§18)                                                                                                                    |
| Reduced-motion en todos los componentes + reporte final de contraste        | RRU-072 (P1) — el E2E solo cubre la parte observable del primer overlay (`theme.spec.ts:128-134`)                                                              |
| `@raulrod/icons` sin tests                                                  | Reexport puro de `lucide-react`; se cubre indirectamente donde los componentes asertan que el icono existe. Sin tarjeta propia mientras no tenga código propio |
| Sin regresión visual                                                        | RRU-080/082 (stories)                                                                                                                                          |
| Comments obsoletos que citan "runtime coverage lands with Vitest (RRU-068)" | `Textarea.tsx:40` y `Textarea.types.ts:23`: deriva de RRU-068 (el spec existe, 22 casos). Fuera del alcance de esta tarjeta                                    |
| `coverage/**` declarado y sin producer                                      | `turbo.json:23`: salida reservada a propósito (§8), no deuda                                                                                                   |
