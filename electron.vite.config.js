import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  main: {
    build: {
      outDir: "dist/main",
      lib: {
        entry: resolve(__dirname, "main.cjs"),
      },
    },
  },
  preload: {
    build: {
      outDir: "dist/preload",
      lib: {
        entry: resolve(__dirname, "preload.cjs"),
      },
    },
  },
  renderer: {
    root: resolve(__dirname, "src", "renderer"),
    build: {
      outDir: "dist/renderer",
      rollupOptions: {
        input: resolve(__dirname, "src", "renderer", "index.html"),
      },
    },
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
      },
    },
    plugins: [react()],
  },
});
