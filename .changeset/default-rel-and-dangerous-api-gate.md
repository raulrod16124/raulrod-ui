---
"@raulrod/ui": patch
---

Default `rel` to `"noopener noreferrer"` on the anchor render when `target` opens another browsing context, and gate dangerous APIs. `Button` with `target="_blank"` (or `_parent`/`_top`/a named target) no longer needs `rel` to avoid handing the opened document a `window.opener` reference and this page's URL; passing `rel` still wins, including `rel=""`.
