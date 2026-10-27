<script lang="ts">
  import { enhance } from '$app/forms';
  let { data, form } = $props();
</script>

<h1>Import</h1>

{#if data.shared}
  <div class="card">
    <p><strong>Shared link:</strong> <a href={data.shared}>{data.shared}</a></p>
    <p class="muted">Converting from a link inside the app comes in a later slice. For now, convert it with Claude using the conversion instructions and paste the JSON below.</p>
  </div>
{/if}

{#if form?.saved}
  <div class="card">
    <p class="ok"><strong>Saved {form.saved.length} {form.saved.length === 1 ? 'recipe' : 'recipes'}.</strong></p>
    <ul>{#each form.saved as s}<li><a href="/recipes/{s.id}">{s.title}</a></li>{/each}</ul>
    <p><a class="btn quiet" href="/import">Import another</a> <a class="btn" href="/">Library</a></p>
  </div>
{:else if form?.preview}
  <form method="POST" action="?/save" use:enhance>
    <input type="hidden" name="text" value={form.text} />
    {#each form.preview as r}
      <div class="card">
        <strong>{r.title}</strong>
        <span class="muted"> · {r.servings} servings · {r.lines} ingredients · {r.steps} steps</span>
        {#if r.tags.length}<div>{#each r.tags as t}<span class="chip">{t}</span>{/each}</div>{/if}
        {#if r.replaces}<p class="warn">A recipe with this title exists. Saving replaces it.</p>{/if}
        {#if r.unknown.length}<p class="warn">Not in the ingredient list: {r.unknown.join(', ')}. They still save; stock matching won't know them until they're added.</p>{/if}
        {#if r.missingRefs.length}<p class="warn">Sub-recipes not found: {r.missingRefs.join(', ')}. Import them too or the recipe shows a gap.</p>{/if}
        {#if r.reviewNotes.length}
          <p><strong>Review notes</strong></p>
          <ul>{#each r.reviewNotes as n}<li>{n}</li>{/each}</ul>
        {/if}
      </div>
    {/each}
    <p><button type="submit">Save {form.preview.length === 1 ? 'recipe' : `all ${form.preview.length}`}</button> <a class="btn quiet" href="/import">Cancel</a></p>
  </form>
{:else}
  <form method="POST" action="?/preview" enctype="multipart/form-data" use:enhance>
    {#if form?.error}<pre class="warn">{form.error}</pre>{/if}
    <div class="card">
      <label>JSON file<br /><input type="file" name="file" accept=".json,application/json" /></label>
      <p class="muted">or paste</p>
      <textarea name="text" rows="10" placeholder={'{ "schemaVersion": 1, "recipes": [ ... ] }'}>{form?.text ?? ''}</textarea>
    </div>
    <button type="submit">Check</button>
  </form>
{/if}

<style>
  pre.warn { white-space: pre-wrap; font: inherit; }
</style>
