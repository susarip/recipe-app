<script lang="ts">
  import { enhance } from '$app/forms';
  import { fmtLine, fmtMinutes } from '$lib/format';
  let { data } = $props();
  const r = $derived(data.recipe);
  // The servings number is editable, not asked about. Quantities scale from it.
  let servings = $state(0);
  $effect(() => { servings = data.recipe.servings; });
  const factor = $derived(servings > 0 ? servings / r.servings : 1);
  const markHint: Record<string, string> = { essential: '', swappable: 'swap', optional: 'optional' };
  let confirmDelete = $state(false);
  // Sub-recipes already made (or bought): cook mode skips their steps. Slice 1b reads this from stock.
  let have = $state<Record<string, boolean>>({});
  const cookHref = $derived(`/recipes/${data.id}/cook?servings=${servings}` + Object.entries(have).filter(([, v]) => v).map(([t]) => `&skip=${encodeURIComponent(t)}`).join(''));
</script>

<p><a href="/">← Library</a></p>
<h1>{r.title}</h1>
<p class="muted">
  {#if r.source}{#if r.sourceUrl}<a href={r.sourceUrl}>{r.source}</a>{:else}{r.source}{/if} · {/if}
  {#if r.prepMinutes}{fmtMinutes(r.prepMinutes)} prep · {/if}{#if r.cookMinutes}{fmtMinutes(r.cookMinutes)} cook · {/if}{r.effort} effort
  {#if r.bestFresh} · best fresh{/if}{#if r.freezesWell} · freezes{/if}{#if r.keepsDays} · keeps {r.keepsDays} {r.keepsDays === 1 ? 'day' : 'days'}{/if}
</p>
{#if r.tags.length}<p>{#each r.tags as t}<a class="chip" href="/?tag={encodeURIComponent(t)}">{t}</a>{/each}</p>{/if}

<div class="card">
  <label class="servings">Servings <input type="number" min="0.5" step="0.5" bind:value={servings} /></label>
  <a class="btn" href={cookHref}>Cook</a>
</div>

<div class="card">
  <h2>Ingredients</h2>
  <ul class="ingredients">
    {#each r.ingredients as i}
      <li>
        {#if i.recipeRef}
          {@const c = data.components.find((x) => x.line === i.id)}
          {fmtLine({ ...i, canonical: '' }, factor)} {#if c?.id}<a href="/recipes/{c.id}">{i.recipeRef}</a>{:else}{i.recipeRef} <span class="bad">(not in library)</span>{/if}
        {:else}
          {fmtLine(i, factor)}
        {/if}
        {#if i.swapMark !== 'essential'}<span class="muted hint">{markHint[i.swapMark]}{#if i.swap}: {i.swap}{/if}{#if i.swapGroup} / any {i.swapGroup}{/if}</span>{/if}
      </li>
    {/each}
  </ul>
</div>

{#each data.components as c}
  {#if c.recipe}
    <div class="card sub">
      <h2>{c.title} <span class="muted">(sub-recipe)</span></h2>
      <label class="have"><input type="checkbox" bind:checked={have[c.title]} /> Already have it (skip its steps in cook mode)</label>
      <ul class="ingredients">{#each c.recipe.ingredients as i}<li>{fmtLine(i, factor)}</li>{/each}</ul>
      <ol>{#each c.recipe.steps as s}<li>{s.text}</li>{/each}</ol>
    </div>
  {/if}
{/each}

<div class="card">
  <h2>Steps</h2>
  <ol class="steps">
    {#each r.steps as s}
      <li>{s.text}
        {#if s.timerMinutes || s.makeAhead || s.leadTimeHours}
          <span class="muted hint">
            {#if s.timerMinutes}{fmtMinutes(s.timerMinutes)}{/if}
            {#if s.leadTimeHours} · start {s.leadTimeHours} h ahead{/if}
            {#if s.makeAhead} · can be done {s.makeAhead.maxDaysAhead} {s.makeAhead.maxDaysAhead === 1 ? 'day' : 'days'} ahead ({s.makeAhead.store}{#if s.makeAhead.note}, {s.makeAhead.note}{/if}){/if}
          </span>
        {/if}
      </li>
    {/each}
  </ol>
</div>

{#if r.reviewNotes.length}
  <div class="card">
    <h2>Review notes</h2>
    <ul>{#each r.reviewNotes as n}<li>{n}</li>{/each}</ul>
  </div>
{/if}

<div class="muted">
  {#if !confirmDelete}
    <button class="quiet" onclick={() => (confirmDelete = true)}>Delete recipe</button>
  {:else}
    <form method="POST" action="?/delete" use:enhance style="display:inline">
      <button type="submit">Yes, delete "{r.title}"</button> <button type="button" class="quiet" onclick={() => (confirmDelete = false)}>Keep</button>
    </form>
  {/if}
</div>

<style>
  .servings { display: inline-flex; align-items: center; gap: 0.5rem; margin-right: 1rem; }
  .servings input { width: 5rem; }
  .ingredients { padding-left: 1.2rem; }
  .ingredients li, .steps li { margin: 0.3rem 0; }
  .steps li { margin: 0.7rem 0; }
  .hint { display: block; font-size: 0.85rem; }
  .sub { border-left: 4px solid #2f6f4e; }
  .have { display: flex; gap: 0.5rem; align-items: center; margin: 0.25rem 0 0.5rem; }
  .have input { width: auto; }
</style>
