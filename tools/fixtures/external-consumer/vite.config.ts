import { defineConfig } from "vite";

export default defineConfig({
  // `jsx: "automatic"` is esbuild's automatic runtime, so the project needs no
  // React plugin and therefore one fewer dependency that could fail to install for
  // reasons that have nothing to do with the design system.
  esbuild: { jsx: "automatic" },
  build: { reportCompressedSize: true },
});
