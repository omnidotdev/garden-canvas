import tailwindcss from "@tailwindcss/postcss";
import { globbySync } from "globby";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

// https://vite.dev/config/
export default defineConfig({
  css: {
    postcss: {
      plugins: [tailwindcss],
    },
  },
  build: {
    outDir: "build",
    target: "esnext",
    minify: false,
    sourcemap: true,
    lib: {
      entry: globbySync(["src/index.ts"]),
      formats: ["es"],
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime"],
      output: {
        // Single bundle (not per-module): keeps the extracted stylesheet's
        // path self-consistent so it emits as build/garden.css (matching the
        // `./styles.css` export) instead of a dangling per-module CSS import.
        entryFileNames: "index.js",
        assetFileNames: (asset) =>
          (asset.names ?? []).some((name) => name.endsWith(".css"))
            ? "garden.css"
            : "[name][extname]",
        format: "es",
        exports: "named",
        banner: `"use client";`,
      },
    },
  },
  plugins: [
    dts({
      entryRoot: "src",
      staticImport: true,
    }),
  ],
});
