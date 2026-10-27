import { fail } from '@sveltejs/kit';
import { ImportFile, type Recipe } from '$schema';
import { saveRecipe, unknownIngredients, getRecipeByTitle } from '$lib/server/recipes';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => ({
  // A share from the phone lands here with the post's link; slice 1b turns it into a conversion request.
  shared: url.searchParams.get('url') || (url.searchParams.get('text')?.match(/https?:\/\/\S+/)?.[0] ?? '')
});

function parse(text: string) {
  let json: unknown;
  try { json = JSON.parse(text); } catch (e) { return { error: `Not valid JSON: ${(e as Error).message}` }; }
  const res = ImportFile.safeParse(json);
  if (!res.success) {
    return { error: res.error.issues.map((i) => `${i.path.join('.') || 'file'}: ${i.message}`).join('\n') };
  }
  return { file: res.data };
}

export const actions: Actions = {
  preview: async ({ request }) => {
    const form = await request.formData();
    const uploads = form.getAll('file').filter((f): f is File => f instanceof File && f.size > 0);
    const texts = uploads.length ? await Promise.all(uploads.map((f) => f.text())) : [String(form.get('text') ?? '')];
    if (!texts.some((t) => t.trim())) return fail(400, { error: 'Paste JSON or choose one or more files.' });
    // Several files become one import; each must validate on its own.
    const parsed = texts.map((t, n) => ({ name: uploads[n]?.name ?? 'pasted text', ...parse(t) }));
    const errors = parsed.filter((x) => 'error' in x).map((x) => `${x.name}:\n${(x as { error: string }).error}`);
    if (errors.length) return fail(400, { error: errors.join('\n\n'), text: uploads.length ? '' : texts[0] });
    const file = { schemaVersion: 1 as const, recipes: parsed.flatMap((x) => (x as { file: { recipes: Recipe[] } }).file.recipes) };
    return {
      text: JSON.stringify(file),
      preview: file.recipes.map((r) => ({
        title: r.title, servings: r.servings, lines: r.ingredients.length, steps: r.steps.length,
        tags: r.tags, reviewNotes: r.reviewNotes, unknown: unknownIngredients(r),
        replaces: !!getRecipeByTitle(r.title),
        missingRefs: r.ingredients.filter((i) => i.recipeRef && !file.recipes.some((x) => x.title === i.recipeRef) && !getRecipeByTitle(i.recipeRef!)).map((i) => i.recipeRef!)
      }))
    };
  },
  save: async ({ request }) => {
    const form = await request.formData();
    const p = parse(String(form.get('text') ?? ''));
    if ('error' in p) return fail(400, { error: p.error });
    // Components first so references resolve when the main recipe is viewed.
    const ordered = [...p.file.recipes].sort((a, b) => +b.tags.includes('component') - +a.tags.includes('component'));
    const saved = ordered.map((r) => ({ id: saveRecipe(r), title: r.title }));
    return { saved };
  }
};
