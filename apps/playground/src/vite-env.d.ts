// Ambient types of the app (RRU-069).
//
// `vite/client` is the only declaration file this app needs: it types the
// CSS side-effect imports (`import "./app.css"`) and `import.meta.env`. It is
// the app's contract with its bundler, and it lives in `src/` so `tsconfig.json`
// keeps `types: []` — the browser code never gets Node globals by accident.
/// <reference types="vite/client" />
