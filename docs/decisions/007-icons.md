# ADR-007: Estrategia de iconos (lucide-react como set único re-exportado)

- **Status:** Accepted
- **Fecha:** 2026-09-22
- **Tarjeta:** [RRU-006](../design-system-jira.md) · **Epic:** EPIC 0 / Fase 0 (guía §7)
- **Referencias:** guía §4 (`packages/icons`), §24 (Public API), §29 (Performance) · [producto](../product.md) §2 · [tablero](../design-system-jira.md) §2 decisión #2 · [ADR-001](001-monorepo.md)

---

## Context

Los componentes de `@raulrod/ui` necesitan iconos constantemente: `ChevronDown` (Select, DropdownMenu), spinner (Button `loading`), `Check` (Checkbox), `X` (Dialog/Toast), flechas de paginación, etc. (RRU-041…RRU-060). El Design System no puede vivir sin un set de iconos, y la elección arrastra tres requisitos que condicionan la decisión:

1. **Tipos por icono.** El consumidor escribe `import { ChevronDown } from "@raulrod/ui"` y debe recibir un componente tipado con autocompletado. Cualquier indirección en string rompe esa DX (RRU-011, `docs/typescript.md`).
2. **Tree-shaking real.** Importar un icono no debe arrastrar el catálogo entero al bundle del consumidor (guía §29; se mide en RRU-092). Esto obliga a que cada icono sea un _named export_ estático de un módulo ESM sin efectos colaterales.
3. **Mantenimiento sostenible.** El DS no dispone de recursos para curar, auditar licencias ni dibujar assets propios en el MVP (guía §4 "iconos separados si mejora tree-shaking, mantenimiento y API").

A esto se suma una restricción estructural ya fijada en ADR-001: los iconos viven en un paquete físicamente separado, `@raulrod/icons`, que forma parte de la API pública del ecosistema (frontera `exports`, guía §24). La dirección de dependencias es `ui → icons`, e `icons` no depende de nada interno (ADR-001).

## Decision

Adoptar **`lucide-react` como dependencia de `@raulrod/icons`**, con:

- **Re-export total:** el index de `@raulrod/icons` hace `export * from 'lucide-react'`. Todo el catálogo de lucide (vista de árbol constante: iconos por componente React, tamaño y stroke configurable por props) queda disponible como _named exports_ tipados.
- **`sideEffects: false`** declarado en el `package.json` de `@raulrod/icons`: señal al bundler de que no hay código con efectos al importar el módulo, habilitando el tree-shaking a nivel de export.
- **Re-export desde `@raulrod/ui`:** el index raíz re-expone `@raulrod/icons`, de modo que un componente y un icono se importan de la misma frontera: `import { Button, ChevronDown } from "@raulrod/ui"`.
- **Versión de lucide como dependency** (no peer): los consumidores no eligen versión de la icon set; `@raulrod/icons` la fija y la avanza con sus propias releases.

El consumidor tiene acceso a **CUALQUIER icono de lucide** (superset completo), no a un subconjunto curado. Esta es una consecuencia deliberada: es la única forma de dar tipos y tree-shaking sin mantener un registry propio, y el modelo de personalización queda en el backlog del tablero (registro de iconos custom del consumidor).

## Alternatives considered

### A. `@heroicons`

Catálogo curado y de calidad pero **mucho menor y en dos estilos fijos** (outline/solid); cubre unos ~300 iconos bajo dos presentaciones. Para el DS supondría quedarse corto en casos (herramientas, flechas, estados) y añadir iconos propios con más frecuencia. No aporta ventaja frente a lucide en tree-shaking (también son componentes ESM) y su mantenimiento externo es equivalente. **Descartado: catálogo insuficiente sin ventaja técnica.**

### B. Icon set propia (assets SVG propios)

Máximo control visual y de licencia, pero coste de mantenimiento alto y sostenido: dibujar/curar SVG, mantener consistencia de geometría y peso, auditar licencias y documentar el proceso. Es un proyecto en sí mismo que no aporta valor al MVP (guía §22: no burocracia para decisiones que se pueden delegar). También obligaría a reaprender la API de cada icono en vez de usar una superficie estable ya documentada. **Descartado: coste de mantenimiento sin garantía de producto para el MVP.**

### C. Proxy `<Icon name="chevron-down" />` (indirección por string)

API única y fácil de aprender, pero **pierde tipos** (el `name` es un string u una unión gigante generada; el componente devuelto es `ReactNode`, sin props del icono) y, sobre todo, **rompe el tree-shaking**: el bundler no puede determinar de forma estática qué icono se requiere, por lo que el registry completo (o un mapa manual que hay que mantener) acaba en el bundle, o se cae a runtime. Contradice los requisitos 1 y 2 del Context y la regla de `docs/typescript.md` (tipos al servicio del consumidor). **Descartado: indirección que degrada tipos y rendimiento.**

## Consequences

### Positivas

- **Superset de iconos con tipos:** cada icono es un componente importable y tipado sin trabajo propio; el catálogo de lucide cubre los casos de los proyectos personales de Raúl (Realtime Board, Trip Planner — guía §38).
- **Tree-shaking garantizado por construcción:** ESM + `export *` + `sideEffects: false` permiten que `import { ChevronDown }` no arrastre el resto de iconos. Se verifica empíricamente en RRU-092 (medición del bundle de ejemplo) y se custodia con size-limit en RRU-095.
- **Cero mantenimiento de assets/licencias:** la licencia ISC de lucide se hereda y no hay que curar ni dibujar iconos en el MVP.
- **Consumo coherente con la frontera pública:** el icono entra por la misma API que el componente (`@raulrod/ui`), sin rutas internas (guía §24, RRU-103).
- **Decisión lista para materializar en código:** RRU-016 (`@raulrod/icons`) y RRU-091 (empaquetado) tienen el qué y el porqué prefijados.

### Negativas / costes

- **La superficie de API la pone lucide, no el DS:** cualquier icono del catálogo es accesible y el consumidor puede depender de uno que el DS no curó; el control del set es indirecto.
- **Dependencia externa con churn:** las majors de lucide se convierten en bumps de `@raulrod/icons`; las mejoras/roturas del catálogo fluyen al consumidor sin filtro. Coste de release moderado (EPIC 9).
- **Consistencia visual delegada:** el peso/geometría de los iconos es el de lucide; el DS no puede re-estilizar el catálogo sin técnicas extra (se acepta en el MVP).

### Mitigaciones

- **Versionado por paquete:** los cambios de lucide se absorben en `@raulrod/icons` (RRU-093), no en cada componente.
- **Registro de iconos custom en backlog** (tablero): si un proyecto necesita un icono fuera de lucide, se registra explícitamente en vez de ampliar el superset sin gobernanza.
- **A11y de iconos:** convención para componentes — el icono decorativo se marca `aria-hidden` y el accessible name se provee por label visible o `VisuallyHidden`/`aria-label` (prototipo en RRU-042 IconButton), no duplicado en el propio SVG.
