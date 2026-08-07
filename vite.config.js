import { defineConfig } from "vite";

export default defineConfig({
  // Everything under public/ (the dc-runtime, the React UMD builds and the
  // self-hosted DM Sans / DM Serif Display faces) is copied verbatim; only
  // src/main.js and its imports go through the bundler.
  publicDir: "public",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2020",
    sourcemap: false
  },
  server: {
    port: 5173,
    strictPort: false
  }
});
