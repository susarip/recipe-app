<script lang="ts">
  import { page } from '$app/state';
  let { children } = $props();
  const cooking = $derived(page.url.pathname.endsWith('/cook'));
</script>

{#if !cooking}
  <nav>
    <a href="/" class:active={page.url.pathname === '/'}>Library</a>
    <a href="/import" class:active={page.url.pathname.startsWith('/import')}>Import</a>
  </nav>
{/if}
<main class:cooking>{@render children()}</main>

<style>
  :global(body) { margin: 0; font: 16px/1.45 system-ui, sans-serif; background: #f6f4ee; color: #1d1d1b; }
  :global(*, *::before, *::after) { box-sizing: border-box; }
  nav { display: flex; gap: 0.25rem; padding: 0.6rem 1rem 0; max-width: 40rem; margin: 0 auto; }
  nav a { padding: 0.5rem 0.9rem; border-radius: 0.6rem 0.6rem 0 0; text-decoration: none; color: #1d1d1b; }
  nav a.active { background: white; font-weight: 600; }
  main { max-width: 40rem; margin: 0 auto; padding: 1rem 1rem 4rem; }
  main.cooking { max-width: none; padding: 0; }
  :global(h1) { font-size: 1.5rem; margin: 0.4rem 0 1rem; line-height: 1.2; }
  :global(h2) { font-size: 1.1rem; margin: 1.2rem 0 0.5rem; }
  :global(button, .btn) { font: inherit; padding: 0.65rem 1rem; border-radius: 0.6rem; border: 1px solid #2f6f4e; background: #2f6f4e; color: white; text-decoration: none; display: inline-block; cursor: pointer; }
  :global(button.quiet, .btn.quiet) { background: white; color: #2f6f4e; }
  :global(button:disabled) { opacity: 0.5; }
  :global(input, textarea, select) { font: inherit; padding: 0.55rem 0.7rem; border: 1px solid #c9c5b8; border-radius: 0.5rem; background: white; width: 100%; }
  :global(.card) { background: white; border-radius: 0.8rem; padding: 1rem; margin-bottom: 0.9rem; box-shadow: 0 1px 2px rgba(0,0,0,0.06); }
  :global(.muted) { color: #6b6a63; }
  :global(.warn) { background: #fff3e0; border-left: 4px solid #e39a2f; padding: 0.6rem 0.8rem; border-radius: 0.4rem; margin: 0.5rem 0; }
  :global(.bad) { color: #b4392a; }
  :global(.ok) { color: #2f6f4e; }
  :global(.chip) { display: inline-block; padding: 0.15rem 0.6rem; border-radius: 1rem; background: #e8ede6; font-size: 0.85rem; margin: 0 0.25rem 0.25rem 0; text-decoration: none; color: inherit; }
  :global(.chip.on) { background: #2f6f4e; color: white; }
</style>
