<script lang="ts">
  import { enhance } from '$app/forms';
  let { form } = $props();
</script>

<h1>Recipes</h1>
<form method="POST" use:enhance class="card">
  <label>Password<br /><input type="password" name="password" autocomplete="current-password" autofocus /></label>
  {#if form?.error}<p class="bad">{form.error}</p>{/if}
  <p><button type="submit">Open</button></p>
</form>
