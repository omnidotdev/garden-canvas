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
      // Two entries: the lean 2D base (`index`) and the optional 3D plugin
      // (`3d`), which carries the heavy Three.js deps so they never land in the
      // base bundle.
      entry: globbySync(["src/index.ts", "src/3d.ts"]),
      formats: ["es"],
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime"],
      output: {
        // Per-entry bundles (index.js, 3d.js). Keep the extracted stylesheet's
        // path self-consistent so it emits as build/garden.css (matching the
        // `./styles.css` export) instead of a dangling per-module CSS import.
        entryFileNames: "[name].js",
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
