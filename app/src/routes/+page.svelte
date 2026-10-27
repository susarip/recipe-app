<script lang="ts">
  import { fmtMinutes } from '$lib/format';
  let { data } = $props();
  const effortLabel: Record<string, string> = { low: 'low effort', medium: 'medium effort', high: 'high effort' };
</script>

<h1>Library</h1>
<form method="GET" class="search">
  <input type="search" name="q" value={data.q} placeholder="Search title, ingredient or tag" aria-label="Search" />
  <select name="tag" aria-label="Tag" onchange={(e) => (e.currentTarget.form as HTMLFormElement).requestSubmit()}>
    <option value="">Any tag</option>
    {#each data.tags as t}<option value={t.tag} selected={data.tag === t.tag}>{t.tag} ({t.n})</option>{/each}
  </select>
  <label class="components"><input type="checkbox" name="all" value="1" checked={data.components} onchange={(e) => (e.currentTarget.form as HTMLFormElement).requestSubmit()} /> include sub-recipes</label>
  <button type="submit">Search</button>
</form>

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
  .search { display: grid; grid-template-columns: 1fr auto; gap: 0.5rem; margin-bottom: 0.75rem; align-items: center; }
  .search input[type=search] { grid-column: 1; }
  .search button { grid-column: 2; grid-row: 1; }
  .search select { grid-column: 1; width: auto; max-width: 100%; }
  .components { grid-column: 2; display: flex; gap: 0.4rem; align-items: center; font-size: 0.9rem; white-space: nowrap; }
  .components input { width: auto; }
  .recipe { display: block; text-decoration: none; color: inherit; }
  .recipe strong { display: block; font-size: 1.05rem; }
  .recipe .muted { display: block; font-size: 0.9rem; margin: 0.15rem 0 0.4rem; }
</style>
