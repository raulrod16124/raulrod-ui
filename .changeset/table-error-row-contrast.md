---
"@raulrod/ui": patch
---

`Table` no baja el contraste de su mensaje de error al pasar el puntero por encima (RRU-129).

La fila de error se renderiza como un `<tr>` real dentro de `<tbody class="rr-table__body">`, así que la regla de hover de fila —que pinta `background.sunken`— le llegaba igual que a cualquier fila de datos. Medido, `text.danger` sobre ese fondo daba **4.26:1 en light**, por debajo del 4.5:1 que el texto necesita; en dark daba 4.68:1 y pasaba.

El defecto llevaba tiempo invisible porque su causa no está en el CSS: la relación entre la celda de error y el hover de su fila vive en el JSX. Una gate que lee stylesheets no puede derivarla, y como la celda no pintaba superficie propia, además se medía contra el fondo de la página — donde ese rojo sí está autorizado. Estaba a la vez sin medir y sin ver.

**Qué cambia.** La celda de error ahora pinta su propia superficie (`background.default`), de modo que el hover de fila ya no alcanza a su texto y el par pasa a ser `text.danger` sobre `background.default`, que es un par ya autorizado y verificado en los dos temas (4.83:1 light / 6.19:1 dark). No hay tokens nuevos y no hay ningún otro componente tocado.

**Efecto visual.** La fila de error ya no se resalta al pasar por encima. Es intencionado: es un mensaje de estado, no una fila de datos, y el hover de fila está documentado como previsualización no interactiva. Las filas de datos siguen resaltándose igual.

**Migration.** None. No cambia la API, ni el markup, ni los nombres de clase. El único cambio es el color de fondo de una celda de estado concreta.
