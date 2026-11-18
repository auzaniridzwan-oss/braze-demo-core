import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { index: "src/index.ts" },
    format: ["esm"],
    dts: true,
    clean: true,
    target: "es2020",
    sourcemap: true,
  },
  {
    // Client components: keep the "use client" directive at the top of the bundle.
    entry: { "react/index": "src/react/index.ts" },
    format: ["esm"],
    dts: true,
    target: "es2020",
    sourcemap: true,
    external: ["react", "react-dom"],
    banner: { js: '"use client";' },
    esbuildOptions(o) {
      o.jsx = "automatic";
    },
  },
]);
