import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  server: {
    watch: {
      usePolling: true,
    },
  },
  resolve: {
    // extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json"], // Include .js and .jsx
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
