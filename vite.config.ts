import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

/** Dev server only: /demo → demo.html (sample-data preview). Not part of production builds. */
const demoRoute: Plugin = {
  name: "gmun-demo-route",
  apply: "serve",
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      if (req.url === "/demo" || req.url === "/demo/") req.url = "/demo.html";
      next();
    });
  },
};

export default defineConfig({
  plugins: [react(), tailwindcss(), demoRoute],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: { port: 5190, strictPort: true },
  preview: { port: 5190 },
});
