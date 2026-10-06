# ADR-009: Escape hatch de estilos (`styles` y `classNames`)

- **Status:** Accepted
- **Fecha:** 2026-10-06
- **Tarjeta:** [RRU-146](../design-system-jira.md) · **Epic:** EPIC 13 (Fase 13) — Extensibilidad: escape hatch de estilos
- **Referencias:** [ADR-003](003-styling-strategy.md) (contrato de override) · [theming.md](../theming.md) §7 (override = cambiar variables) · [component-pattern.mdx](../component-pattern.mdx) §5.1 (patrón de componente) · guía §10 (tokens mínimos) · guía §15 (diseño de APIs) · guía §31 (contrato de calidad) · [ADR-005](005-testing-strategy.md) (sondas negativas)

---

## Context

ADR-003 fijó el contrato visual de `@raulrod/ui`: los componentes consumen variables `--rr-*`, el consumidor las redefine en su propia cascada, y los selectores internos `rr-*` no son API pública. Ese contrato funciona para **cambios globales** (tema, spacing, un color de marca) pero es incómodo para **ajustes puntuales de una instancia**: requiere crear un scope CSS ad-hoc, pelear con especificidad, y no puede alcanzar hijos internos sin depender de selectores que el DS explícitamente prohíbe.

EPIC-13 nace de ese encargo concreto: dar al consumidor una vía tipada para ajustar una instancia sin romper el contrato visual del DS. Como cambia la API pública de un paquete ya publicado en `1.0.0`, exige ADR propio (regla 2 del tablero) y changeset `minor`.

El riesgo principal no es técnico, sino de gobernanza: un escape mal diseñado se convierte en la vía por la que todo el mundo resuelve problemas, minando la decisión de producto #1 (sin CSS-in-JS) y la garantía de contraste AA del DS. Este ADR fija qué es, qué no es, y dónde vive cada responsabilidad.

## Decision

### 1. `styles` = override de tokens, no CSS-in-JS

La prop `styles` acepta **solo** variables `--rr-*` que el componente consuma de verdad. Su tipo se deriva del propio CSS del componente mediante `tokenVarsUsed(css)` (`packages/ui/src/test-support/css.ts:82`), materializado en `packages/ui/src/style-tokens.generated.ts` por `tools/derive-style-types.mjs`.

- Un componente **no puede ofrecer un token que no consume**.
- Un token nuevo no requiere tocar 28 `.types.ts`: se regenera `style-tokens.generated.ts`.
- El valor es un string libre (`#ff0000`, `var(--mi-token)`, etc.); la clave está tipada.

Ejemplo válido:

```tsx
<Button styles={{ "--rr-button-primary-background": "#b91c1c" }}>Peligro</Button>
```

Ejemplo inválido (TypeScript lo rechaza):

```tsx
// `--rr-not-a-button-token` no está en Button.css
<Button styles={{ "--rr-not-a-button-token": "red" }} />

// `color` es una propiedad CSS, no un token del componente
<Button styles={{ color: "red" }} />
```

### 2. `style` y `className` de la raíz no se tocan

Todos los componentes ya extienden `HTMLAttributes<HTMLElement>` y propagan `style`/`className` mediante `{...props}` y `cx`. Añadir un segundo nombre para lo mismo crearía dos caminos sin guía. `styles` es semántica de **token**; `style`/`className` siguen siendo la vía CSS genérica del consumidor.

### 3. `classNames` por slot para lo que no es token

Los componentes compuestos (`Dialog`, `Select`, `FormField`, `Table`, `Tabs`, `DropdownMenu`, `Popover`, `Pagination`, `DataTable`, `Toast`, `Inline`…) hoy aceptan `className` sin tipar en el slot raíz o en el elemento equivocado. EPIC-13 añade `classNames` como mapa `{ [slot]: string }` para alcanzar subpartes públicas sin selectores globales.

Ejemplo:

```tsx
<FormField classNames={{ error: "my-error-class" }} />
```

El slot `error` es parte del contrato público del componente; el selector `.rr-form-field__error` no.

### 4. Decisión sobre el límite de AA: puerta documentada

Un consumidor puede poner `--rr-color-action-primary-background: <cualquiera>` en una instancia. Se decide **dejarlo abierto con responsabilidad del consumidor**, por tres razones:

1. `theming.md §7` ya prescribe "override = cambiar variables, nunca estilos internos". Esa prescripción no distingue entre `:root` e instancia: en ambos casos el consumidor es quien redefine la variable.
2. La garantía AA del DS cubre su **output por defecto** (636 pares autorizados, 0 absorbidos). Cuando el consumidor sustituye una variable, está saliendo de ese output; no es razonable que el DS verifique valores arbitrarios de instancia.
3. Restringir las claves a tokens sin par de contraste registrado prohibiría el caso de uso principal (cambiar el color de un botón en una instancia), contradiciendo la verificación misma de esta épica.

Lo que **sí** se hace: documentar la puerta en ADR-009, en `theming.md §7` y en el `.mdx` de cada componente, y mantener la tabla de pares autorizados como guía — no como gate de runtime.

## Alternatives considered

### A. `styles` como `CSSProperties` libre

- **Ventaja:** máxima flexibilidad para el consumidor.
- **Por qué se descarta:** burla ADR-003. Permitiría valores arbitrarios (`color: red`, `background: url(...)`), destruyendo la garantía de "solo tokens" y convirtiendo la prop en CSS-in-JS disfrazado. **Descartado.**

### B. Lista de tokens permitidos escrita a mano por componente

- **Ventaja:** simple, sin tooling nuevo.
- **Por qué se descarta:** una lista escrita a mano se desfasa del CSS en cuanto se añade o quita un `var(--rr-*)`. EPIC-13 declara explícitamente "ninguna lista de tokens escrita a mano". **Descartado.**

### C. Restringir `styles` a tokens sin par de contraste registrado

- **Ventaja:** máxima gobernanza sobre AA.
- **Por qué se descarta:** dejaría fuera los colores semánticos, que son precisamente el caso de uso que motiva la épica. **Descartado por contradicción con la verificación de EPIC-13.**

### D. No hacer nada: confiar en `style` + `className` + CSS del consumidor

- **Ventaja:** cero cambio de API.
- **Por qué se descarta:** no resuelve el problema original. El consumidor sigue sin poder alcanzar slots internos sin selectores prohibidos, y un `style` genérico no le dice qué variables puede sobrescribir con seguridad. **Descartado.**

## Consequences

### Positivas

- **Extensibilidad controlada.** El consumidor puede ajustar instancias sin salirse del contrato de tokens.
- **Tipado derivado.** Cero listas manuales; el tipo se mantiene alineado con el CSS por construcción.
- **No se rompe ADR-003.** `styles` sigue siendo "cambiar variables"; no es CSS-in-JS.
- **`classNames` cierra un agujero real.** Once componentes compuestos ganan gancho tipado por slot.

### Negativas / costes

- **Nuevo artefacto generado.** `style-tokens.generated.ts` debe regenerarse con `pnpm derive:styles` cuando cambie un CSS. El gate `styles-type-contract.test.ts` impide commitear desfases.
- **Coste de bundle.** Cada componente que añada `styles`/`classNames` leerá y mergeará objetos en render. EPIC-13 lo mide con `size-limit` y lo documenta en el changeset `minor`.
- **API pública más ancha.** RRU-147 añade la prop en 28 componentes; eso exige `verify:external` para demostrar que no hay breaking changes sobre `1.0.0`.

### Riesgos observables

- **`styles` se convierta en la vía por defecto.** Se mitiga documentando "cuándo sobrescribir" en cada `.mdx`: primero token global, luego `classNames`, y `styles` solo para el caso puntual.
- **Fuga de selectores internos.** `classNames` solo acepta slots documentados; no expone selectores `rr-*` arbitrarios.
- **Desfase CSS→tipo.** Mitigado por el gate de igualdad y la sonda negativa `@ts-expect-error` en `styles-type-contract.test.ts`.

## Implementación (notas para RRU-146 y RRU-147)

- **RRU-146 (esta tarjeta):** ADR-009 + `tools/derive-style-types.mjs` + `packages/ui/src/style-tokens.generated.ts` + `packages/ui/src/styles-type-contract.test.ts` con sondas negativas. Sin cambios en la API pública todavía, por eso no lleva changeset.
- **RRU-147:** añadir `styles?: Styles<"dir">` y `classNames?: { [slot]: string }` en las 28 raíces, merge con `style`/`className` mediante `cx` en orden documentado, stories + `.mdx` "Cuándo sobrescribir", changeset `minor`, y `pnpm verify:external`.
- **Verificación:** `pnpm lint`, `pnpm typecheck`, `pnpm test --filter=@raulrod/ui`, `pnpm build`, `pnpm format:check`. Para RRU-147 también `pnpm size-limit` y `pnpm verify:external`.
