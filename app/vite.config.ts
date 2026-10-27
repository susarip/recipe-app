import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [sveltekit()],
  // The recipe schema and seed data live one level up, shared with the conversion tooling.
  // The schema imports zod; resolve it from this app's node_modules so the root needs no install.
  resolve: { alias: { zod: fileURLToPath(new URL('./node_modules/zod', import.meta.url)) } },
  server: { fs: { allow: ['..'] } },
  ssr: { external: ['better-sqlite3'] }
});
