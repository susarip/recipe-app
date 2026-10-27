import { fail } from '@sveltejs/kit';
import { ImportFile } from '$schema';
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
    const upload = form.get('file');
    const text = upload instanceof File && upload.size ? await upload.text() : String(form.get('text') ?? '');
    if (!text.trim()) return fail(400, { error: 'Paste JSON or choose a file.' });
    const p = parse(text);
    if ('error' in p) return fail(400, { error: p.error, text });
    return {
      text: JSON.stringify(p.file),
      preview: p.file.recipes.map((r) => ({
        title: r.title, servings: r.servings, lines: r.ingredients.length, steps: r.steps.length,
        tags: r.tags, reviewNotes: r.reviewNotes, unknown: unknownIngredients(r),
        replaces: !!getRecipeByTitle(r.title),
        missingRefs: r.ingredients.filter((i) => i.recipeRef && !p.file.recipes.some((x) => x.title === i.recipeRef) && !getRecipeByTitle(i.recipeRef!)).map((i) => i.recipeRef!)
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
