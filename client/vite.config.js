import { defineConfig } from 'vite';

/**
 * Meridian — Vite Dev Server Config
 * ==================================
 *
 * WHY publicDir: 'public'
 * ───────────────────────
 * The React components live in public/src/*.jsx and are loaded
 * via <script type="text/babel" src="src/..."> tags in index.html.
 * Vite MUST serve them as raw static files — if Vite's transform
 * pipeline processes them it will add ESM import/export syntax,
 * which breaks browser-Babel's compilation step.
 *
 * Files inside `public/` are copied to `dist/` verbatim during
 * `vite build` and served without transformation in dev — exactly
 * what the CDN-Babel setup requires.
 *
 * WHY proxy /api
 * ──────────────
 * The React app will call relative URLs like `/api/map-state`.
 * In development Vite listens on :3000 and the Express server
 * listens on :5000.  The proxy transparently forwards every
 * request starting with /api to Express, so the frontend never
 * has to hard-code an absolute URL or deal with CORS in dev.
 *
 * In production, Express serves both the static client files
 * AND the API from the same port, so no proxy is needed.
 */
export default defineConfig({
  // index.html lives at the project root (client/)
  root: '.',

  // Files in public/ are served as-is — JSX components, styles
  publicDir: 'public',

  server: {
    port: 3000,
    strictPort: true,   // fail fast rather than silently bump port

    proxy: {
      // Forward every /api/* request to the Express server
      '/api': {
        target:      'http://localhost:5000',
        changeOrigin: true,
        // No rewrite needed — Express mounts routes at /api/...
      },
    },
  },

  build: {
    outDir:      '../server/public',  // Express will serve from here
    emptyOutDir:  true,
  },
});
