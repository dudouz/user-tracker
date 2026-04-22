import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: [resolve(root, "src/test/setup.ts")],
  },
  resolve: {
    alias: {
      "@": resolve(root, "src"),
    },
  },
});
