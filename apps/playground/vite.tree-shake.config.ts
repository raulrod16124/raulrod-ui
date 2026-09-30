// Vite config for the RRU-092 tree-shaking / bundle-size measurement.
//
// It extends the main playground config so that host, port and React plugin
// stay identical, and only changes the entry point and the output directory.
// The rollup-plugin-visualizer emits `stats.html` inside the output folder so
// the bundle composition can be inspected visually.
/// <reference types="node" />
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig, mergeConfig } from "vite";

import baseConfig from "./vite.config.js";

export default defineConfig(
  mergeConfig(baseConfig, {
    build: {
      outDir: "dist-tree-shake",
      emptyOutDir: true,
      rollupOptions: {
        input: "src/tree-shake-entry.tsx",
      },
    },
    plugins: [
      visualizer({
        filename: "dist-tree-shake/stats.html",
        gzipSize: true,
        brotliSize: false,
        open: false,
        title: "RRU-092 — Tree-shaking bundle analysis",
      }),
      visualizer({
        filename: "dist-tree-shake/stats.json",
        template: "raw-data",
        gzipSize: true,
        brotliSize: false,
        open: false,
      }),
    ],
  }),
);
