import { error, redirect } from '@sveltejs/kit';
import { getRecipe, componentsOf, deleteRecipe } from '$lib/server/recipes';
import type { Recipe } from '$schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
  const row = getRecipe(params.id);
  if (!row) error(404, 'No such recipe');
  const recipe = JSON.parse(row.data) as Recipe;
  return { id: row.id, recipe, components: componentsOf(recipe), updatedAt: row.updated_at };
};

export const actions: Actions = {
  delete: ({ params }) => { deleteRecipe(params.id); redirect(303, '/'); }
};
