import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  // The recipe schema and seed data live one level up, shared with the conversion tooling.
  server: { fs: { allow: ['..'] } },
  ssr: { external: ['better-sqlite3'] }
});
