import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Proxy all API requests to the backend server
      "/api": {
        target: "http://api:8000",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      // Add proxy for auth endpoints
      "/auth": {
        target: "http://api:8000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
