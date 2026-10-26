<script lang="ts">
  import { page } from '$app/state';
  import { base } from '$app/paths';
  const q = $derived(page.url.searchParams);
  const shared = $derived({ title: q.get('title') ?? '', text: q.get('text') ?? '', url: q.get('url') ?? '' });
  // Android apps often put the link in `text` rather than `url`.
  const link = $derived(shared.url || (shared.text.match(/https?:\/\/\S+/)?.[0] ?? ''));
</script>

<h1>Shared to the recipe app</h1>
<div class="card">
  {#if link}
    <p class="ok">Link received.</p>
    <p><code>{link}</code></p>
  {:else}
    <p class="bad">No link found in the share.</p>
  {/if}
  {#if shared.title}<p>Title: {shared.title}</p>{/if}
  {#if shared.text}<p>Text: <code>{shared.text}</code></p>{/if}
  <p>In slice 1a this is where "Convert this recipe" starts. For now, mark check 5 on the <a href="{base}/">test page</a>.</p>
</div>
