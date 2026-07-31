/// <reference types="vitest" />
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const sharedSrc = fileURLToPath(new URL("../shared/src", import.meta.url));
const appSrc = fileURLToPath(new URL("./src", import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: [
      // The shared package ships no build — resolve it to its TS source so Vite
      // transpiles it as part of the app's module graph.
      { find: /^@freshr\/shared$/, replacement: `${sharedSrc}/index.ts` },
      { find: /^@freshr\/shared\/(.*)$/, replacement: `${sharedSrc}/$1` },
      // Anchored on "@/" so scoped packages (@react-oauth/…, @testing-library/…)
      // are left alone; a bare "@" prefix match would swallow them.
      { find: /^@\/(.*)$/, replacement: `${appSrc}/$1` },
    ],
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
  server: {
    allowedHosts: [".ngrok-free.app"],
    // Allow importing source from the sibling shared workspace package.
    fs: { allow: [sharedSrc, "."] },
  },
});
