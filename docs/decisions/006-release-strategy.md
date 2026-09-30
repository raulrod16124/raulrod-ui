# ADR-006: Estrategia de releases

- **Status:** Accepted
- **Fecha:** 2026-09-30
- **Tarjeta:** [RRU-090](../design-system-jira.md) · **Epic:** EPIC 9 / Fase 9
- **Referencias:** guía §27 (Versionado y releases), §28 (Release workflow), §23 (Packaging), §24 (Public API), §30 (Seguridad) · [tablero](../design-system-jira.md) EPIC 9 · [ADR-001](001-monorepo.md) · [ADR-007](007-icons.md)

---

## Context

RaulRod UI está formado por tres paquetes publicables con ciclos de vida distintos:

- `@raulrod/tokens` — design tokens; cambia de forma lenta y estable.
- `@raulrod/icons` — re-export de `lucide-react`; cambia principalmente por bumps de la dependencia.
- `@raulrod/ui` — componentes React; evoluciona más rápido que los anteriores.

Hasta ahora los paquetes están en `version: 0.0.0` y `private: true`, sin `exports` ni flujo de publicación. Antes de implementar el empaquetado (RRU-091), el versionado (RRU-093) y el workflow de publish (RRU-094) es necesario fijar la estrategia de releases.

Las restricciones del proyecto son:

1. **Rama de trabajo actual:** las tareas se integran en `development` sin ramas por tarea, y el usuario revisa el diff antes de commitear (tablero §0).
2. **Publicación automatizada:** no se publica manualmente desde local como proceso estándar (guía §28).
3. **Versionado por paquete:** los paquetes tienen ritmos distintos; versionarlos de forma conjunta penalizaría la capacidad de liberar componentes independientemente de tokens (ADR-001).
4. **MVP sencillo:** no se habilitan pre-releases ni canales alpha/beta por ahora.
5. **Seguridad:** las credenciales de npm solo existen como secret de CI (guía §30).

## Decision

### SemVer 2.0 estricto

Cada paquete sigue [Semantic Versioning](https://semver.org/lang/es/):

- **PATCH** (`1.2.1 → 1.2.2`): correcciones compatibles, fixes de tipos, mejoras de a11y que no cambian la API.
- **MINOR** (`1.2.0 → 1.3.0`): nuevos componentes, nuevas props opcionales, nuevos tokens o iconos, mejoras backward-compatible.
- **MAJOR** (`1.x → 2.0.0`): breaking changes (eliminar prop, cambiar contrato de un componente, renombrar token público, cambiar el prefijo `rr-*`, etc.).

Un cambio se considera **breaking** si un consumidor válido en la versión anterior deja de compilar o de comportarse igual sin modificar su código.

### Versionado independiente por paquete

Se adopta **versionado independiente** con [Changesets](https://github.com/changesets/changesets):

- Cada paquete tiene su propio changelog y su propia versión.
- Un cambio en `@raulrod/ui` no fuerza un bump en `@raulrod/tokens` si no lo necesita.
- Los consumidores actualizan solo los paquetes que usan.

Esta elección es la más mantenible para un design system con dependencias internas desiguales: `tokens` cambia mucho más despacio que `ui` (ADR-001).

### Rama de publicación: `main`

- `development` es la rama de trabajo e integración continua.
- `main` es la rama estable desde la que se publican versiones.
- El flujo de publicación se dispara exclusivamente al mergear a `main`.

Esto separa claramente el trabajo diario de los releases estables y permite que `development` siga siendo la rama de integración revisada por el usuario.

### Flujo de release

```text
feature / task en development
            ↓
    PR con changeset (si afecta API publicable)
            ↓
    merge a development
            ↓
    Changesets abre/actualiza Release PR → main
            ↓
    revisión + merge del Release PR a main
            ↓
    CI publica a npm y crea tags
```

Reglas del flujo:

1. Cada PR que modifique un paquete publicable debe incluir un changeset si el cambio afecta a los consumidores (`patch`, `minor` o `major`).
2. Los cambios puramente internos (docs, tests, CI) no requieren changeset.
3. Changesets agrupa los cambios en una Release PR que, al mergearse a `main`, dispara el publish automático.
4. El merge a `main` se hace manualmente tras revisar el changelog y los version bumps propuestos.

### Orden de publicación

Dado que `@raulrod/ui` depende de `@raulrod/icons` y de `@raulrod/tokens`, el publish debe respetar el orden topológico:

```text
@raulrod/tokens
      ↓
@raulrod/icons
      ↓
@raulrod/ui
```

Changesets con `publish` maneja este orden automáticamente cuando los paquetes declaran sus dependencias de workspace correctamente.

### Breaking changes

- Todo breaking change requiere un **major bump** y un **ADR o nota de migración** vinculada.
- No se acumulan breaking changes sin documentar; el changelog debe incluir instrucciones de migración mínimas.
- Durante `0.x` se sigue SemVer al pie de la letra: `0.x.y` puede incluir breaking changes en `x`, pero preferimos saltar a `1.0.0` cuando la API sea estable.

### Publicación solo desde CI

- No se ejecuta `npm publish` / `pnpm publish` desde entornos locales como paso estándar.
- El workflow de GitHub Actions usa un secret `NPM_TOKEN` con permisos de publicación para `@raulrod/*`.
- Las credenciales no se imprimen en logs ni se almacenan en el repositorio.

### Pre-releases

No se habilitan canales de pre-release (`alpha`, `beta`) para el MVP. Se publican versiones estables directamente desde `main`. Si en el futuro se necesitan pre-releases, se evaluará `changeset pre enter` en un ADR posterior.

### Protección de la API pública

La frontera pública de cada paquete se define en su `package.json` mediante el campo `exports`:

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./styles.css": "./dist/styles.css"
  }
}
```

No se expone ninguna ruta interna (`/internal`, `/src`, etc.). Esto se implementa y verifica en RRU-091 y RRU-103.

## Alternatives considered

### A. Publicación manual desde local

- **Ventajas:** simplicidad inicial, cero configuración de CI adicional.
- **Por qué se descarta:** riesgo de publicar desde un estado no reproducible, exposición accidental de credenciales, imposibilidad de exigir que alguien más repita el proceso, y ausencia de changelog verificable. Contradice guía §28 y §30.

### B. Versionado global/fixed (todos los paquetes comparten versión)

- **Ventajas:** un único número de versión para comunicar al consumidor.
- **Por qué se descarta:** cualquier cambio en `@raulrod/ui` forzaría un bump en `@raulrod/tokens` aunque no haya cambiado, generando ruido y actualizaciones innecesarias. Va en contra del objetivo de releases por paquete fijado en ADR-001.

### C. Release Please en lugar de Changesets

- **Ventajas:** integración directa con Conventional Commits.
- **Por qué se descarta:** Changesets tiene soporte más maduro para monorepos pnpm, versionado independiente por paquete y generación de changelogs por paquete + raíz. Además, separa la decisión de versión del mensaje de commit, lo que encaja mejor con el flujo actual de revisión manual antes de commitear.

### D. Pre-releases `0.x` con canales alpha/beta

- **Ventajas:** permite probar APIs inestables antes de `1.0.0`.
- **Por qué se descarta:** el MVP busca sencillez; una vez estable, se publicará `1.0.0`. Si surge la necesidad, se habilitará más adelante.

## Consequences

### Positivas

- **Releases predecibles:** SemVer + Changesets generan changelogs claros y versiones justificadas.
- **Desacoplamiento publicable:** `tokens`, `icons` y `ui` pueden evolucionar y publicarse a su propio ritmo.
- **Seguridad:** el token de npm nunca pasa por un entorno local ni por el diff revisable.
- **Trazabilidad:** cada release está asociado a un merge en `main`, un tag y un changelog.
- **DX del consumidor:** solo recibe los bumps que realmente le afectan.

### Negativas / costes

- **Overhead de Changesets:** los contribuidores deben acordarse de añadir un changeset cuando el cambio afecta a un paquete publicable.
- **Rama `main` como paso extra:** a diferencia del flujo actual de `development`, los releases requieren mergear una Release PR a `main`.
- **Curva de aprendizaje:** el equipo debe entender la diferencia entre `patch`, `minor` y `major` y cuándo añadir un changeset.

### Riesgos y mitigaciones

| Riesgo                                       | Mitigación                                                                                |
| -------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Publicar accidentalmente desde `development` | El workflow de publish se dispara solo en `push` a `main`; `development` no publica.      |
| Olvidar añadir un changeset                  | El CI puede advertir (no bloquear) en PRs que tocan `packages/*` sin changeset.           |
| Breaking change no documentado               | Requisito de ADR/migración para majors; revisión manual del Release PR.                   |
| Fallo de orden de publicación                | Dependencias de workspace correctas en `package.json`; Changesets resuelve el grafo.      |
| Token expuesto en logs                       | Uso de `NODE_AUTH_TOKEN` / `NPM_TOKEN` como secret; workflows sin `echo` de credenciales. |

## Próximos pasos

- **RRU-091:** implementar `exports`, ESM, `.d.ts`, `sideEffects: false` y entrypoint de CSS en cada paquete.
- **RRU-093:** instalar Changesets, configurar `pnpm changeset` y el formato de changelogs.
- **RRU-094:** implementar el workflow de GitHub Actions que publica desde `main` con `NPM_TOKEN`.
