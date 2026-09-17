import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// During `npm run dev` the React dev server runs on its own port (5173) but
// the app is designed to be served from the SAME origin as the Express API
// in production (see server.js). This proxy makes local dev behave the
// same way, forwarding API + OAuth routes to the Express server on :5000
// so cookies stay same-origin during development too.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:5000",
      "/login": "http://localhost:5000",
    },
  },
  build: {
    outDir: "dist",
  },
});
