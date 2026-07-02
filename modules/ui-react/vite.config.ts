import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "react-smooth": path.resolve(__dirname, "node_modules/react-smooth/es6/index.js"),
    },
    // Prefer TypeScript sources — never resolve stale emit artifacts in src/
    extensions: [".tsx", ".ts", ".jsx"],
  },
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      "/api/v1": {
        target: "http://localhost:8088",
        changeOrigin: true,
      },
    },
  },
});
