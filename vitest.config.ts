import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom", // simulates a browser environment for React components
    globals: true, // lets you use test(), expect() without importing them
    setupFiles: "./vitest.setup.ts",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // so @/shared/... works in tests
    },
  },
});
