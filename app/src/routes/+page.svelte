<script lang="ts">
  import { fmtMinutes } from '$lib/format';
  let { data } = $props();
  const effortLabel: Record<string, string> = { low: 'low effort', medium: 'medium effort', high: 'high effort' };
</script>

<h1>Library</h1>
<form method="GET" class="search">
  <input type="search" name="q" value={data.q} placeholder="Search title, ingredient or tag" aria-label="Search" />
  {#if data.tag}<input type="hidden" name="tag" value={data.tag} />{/if}
  {#if data.components}<input type="hidden" name="all" value="1" />{/if}
  <button type="submit">Search</button>
</form>

<p>
  {#each data.tags.slice(0, 14) as t}
    <a class="chip" class:on={data.tag === t.tag} href="/?q={encodeURIComponent(data.q)}&tag={data.tag === t.tag ? '' : encodeURIComponent(t.tag)}{data.components ? '&all=1' : ''}">{t.tag} <span class="muted">{t.n}</span></a>
  {/each}
  <a class="chip" class:on={data.components} href="/?q={encodeURIComponent(data.q)}&tag={encodeURIComponent(data.tag)}{data.components ? '' : '&all=1'}">show components</a>
</p>

{#if !data.recipes.length}
  <div class="card">
    <p>No recipes {data.q || data.tag ? 'match' : 'yet'}.</p>
    {#if !data.q && !data.tag}<p><a class="btn" href="/import">Import a JSON file</a></p>{/if}
  </div>
{/if}

{#each data.recipes as r}
  <a class="card recipe" href="/recipes/{r.id}">
    <strong>{r.title}</strong>
    <span class="muted">
      {r.servings} {r.servings === 1 ? 'serving' : 'servings'}
      {#if r.minutes} · {fmtMinutes(r.minutes)}{/if}
      · {effortLabel[r.effort]}
      {#if r.isComponent} · component{/if}
    </span>
    {#if r.tags.length}<span class="tags">{#each r.tags.filter((t) => t !== 'component') as t}<span class="chip">{t}</span>{/each}</span>{/if}
  </a>
{/each}

<style>
  .search { display: flex; gap: 0.5rem; margin-bottom: 0.75rem; }
  .search input { flex: 1; }
  .recipe { display: block; text-decoration: none; color: inherit; }
  .recipe strong { display: block; font-size: 1.05rem; }
  .recipe .muted { display: block; font-size: 0.9rem; margin: 0.15rem 0 0.4rem; }
</style>
