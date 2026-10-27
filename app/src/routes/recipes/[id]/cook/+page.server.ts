import { error } from '@sveltejs/kit';
import { getRecipe, componentsOf } from '$lib/server/recipes';
import type { Recipe } from '$schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params, url }) => {
  const row = getRecipe(params.id);
  if (!row) error(404, 'No such recipe');
  const recipe = JSON.parse(row.data) as Recipe;
  const servings = Number(url.searchParams.get('servings')) || recipe.servings;
  const skip = new Set(url.searchParams.getAll('skip'));
  return { id: row.id, recipe, servings, components: componentsOf(recipe).filter((c) => c.recipe && !skip.has(c.title)) };
};
