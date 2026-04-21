/**
 * ============================================================
 * config/env.ts — Environment preload module
 * ============================================================
 * Single responsibility: call dotenv.config() with an explicit
 * path so that process.env is populated BEFORE any other module
 * in the import graph is evaluated.
 *
 * Why this module exists (the bug this fixes)
 * ────────────────────────────────────────────
 * TypeScript's CommonJS output hoists every `import` statement
 * to the top of the compiled file, ahead of any inline code.
 * So if server.ts is written like this:
 *
 *   import dotenv from 'dotenv';
 *   dotenv.config();                 // looks like it runs first
 *   import apiRouter from './routes/api';
 *
 * the emitted JavaScript actually runs:
 *
 *   require('dotenv');
 *   require('./routes/api');         // HOISTED — runs first
 *   dotenv.config();                 // too late
 *
 * Any module transitively loaded by apiRouter that reads
 * process.env at module scope (e.g. OrchestratorAgent reading
 * GOOGLE_API_KEY when it instantiates the Gemini client) will
 * see `undefined` and crash.
 *
 * How this module fixes it
 * ────────────────────────
 * Side-effect-only modules run their top-level code the first
 * time they're required. By making `import './config/env'` the
 * FIRST import in server.ts, dotenv.config() executes before any
 * other module in the graph is loaded.
 *
 * .env location
 * ─────────────
 * The .env file lives at the repo root (one level above server/).
 * __dirname here is server/config/, so '../../.env' resolves to
 * the repo root's .env.
 * ============================================================
 */

import dotenv from 'dotenv';
import path   from 'path';

const envPath = path.resolve(__dirname, '..', '..', '.env');
const result  = dotenv.config({ path: envPath });

if (result.error) {
  console.error(`[env] ✗ Failed to load .env from ${envPath}`);
  console.error(`[env]   ${result.error.message}`);
} else {
  console.log(`[env] ✓ Loaded ${envPath}`);
}

// Debug log requested during troubleshooting.
// Prints synchronously before any downstream module reads process.env.
console.log(
  `[env] DEBUG: GOOGLE_API_KEY loaded: ${process.env.GOOGLE_API_KEY ? 'YES' : 'NO'}`
);
console.log(
  `[env] DEBUG: MONGODB_URI loaded:    ${process.env.MONGODB_URI    ? 'YES' : 'NO'}`
);
