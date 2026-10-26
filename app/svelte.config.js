import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** Phone-test build: static, served from GitHub Pages under /recipe-app.
 *  Slice 1a swaps this for adapter-node and a real server. */
const base = process.env.BASE_PATH ?? '';

export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({ fallback: 'index.html' }),
    paths: { base },
    serviceWorker: { register: false }
  }
};
