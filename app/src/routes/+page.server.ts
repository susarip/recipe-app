import { listRecipes, allTags } from '$lib/server/recipes';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
  const q = url.searchParams.get('q') ?? '';
  const tag = url.searchParams.get('tag') ?? '';
  const components = url.searchParams.get('all') === '1';
  const rows = listRecipes({ q, tag, components });
  return {
    q, tag, components,
    tags: allTags(),
    recipes: rows.map((r) => ({
      id: r.id, title: r.title, servings: r.servings, effort: r.effort, isComponent: !!r.is_component,
      minutes: (r.prep_minutes ?? 0) + (r.cook_minutes ?? 0), tags: JSON.parse(r.tags) as string[], source: r.source
    }))
  };
};
