import { ulid } from 'ulid';
import { db, transaction } from './db';
import { resolveIngredient } from './seed';
import type { Recipe } from '$schema';

export type RecipeRow = {
  id: string; title: string; source: string | null; source_url: string | null; servings: number;
  prep_minutes: number | null; cook_minutes: number | null; effort: string; best_fresh: number; keeps_well: number;
  freezes_well: number; keeps_days: number | null; is_component: number; tags: string; data: string; created_at: string; updated_at: string;
};

export const titleKey = (t: string) => t.trim().toLowerCase().replace(/\s+/g, ' ');

export function listRecipes(opts: { q?: string; tag?: string; components?: boolean } = {}) {
  const params: string[] = [];
  let sql = 'SELECT r.* FROM recipe r';
  const where: string[] = [];
  if (opts.q) {
    // FTS5 prefix match on each word; falls back to LIKE when the query has no word characters.
    const words = opts.q.match(/[\p{L}\p{N}]+/gu) ?? [];
    if (words.length) {
      sql += ' JOIN recipe_fts f ON f.id = r.id';
      where.push('recipe_fts MATCH ?');
      params.push(words.map((w) => `"${w}"*`).join(' '));
    }
  }
  if (opts.tag) { where.push(`EXISTS (SELECT 1 FROM json_each(r.tags) WHERE value = ?)`); params.push(opts.tag); }
  if (!opts.components) where.push('r.is_component = 0');
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += opts.q ? ' ORDER BY rank, r.title' : ' ORDER BY r.updated_at DESC';
  return db.prepare(sql).all(...params) as RecipeRow[];
}

export function getRecipe(id: string) {
  return db.prepare('SELECT * FROM recipe WHERE id = ?').get(id) as RecipeRow | undefined;
}
export function getRecipeByTitle(title: string) {
  return db.prepare('SELECT * FROM recipe WHERE title_key = ?').get(titleKey(title)) as RecipeRow | undefined;
}
export function allTags(): { tag: string; n: number }[] {
  return db.prepare(`SELECT value tag, count(*) n FROM recipe, json_each(recipe.tags) WHERE is_component = 0 GROUP BY value ORDER BY n DESC, tag`).all() as { tag: string; n: number }[];
}

/** Inserts or replaces (by title) one validated recipe. Returns its id. */
export function saveRecipe(r: Recipe): string {
  const existing = getRecipeByTitle(r.title);
  const id = existing?.id ?? ulid();
  const isComponent = r.tags.includes('component') ? 1 : 0;
  transaction(() => {
    db.prepare(`INSERT OR REPLACE INTO recipe
      (id, title, title_key, source, source_url, servings, prep_minutes, cook_minutes, effort, best_fresh, keeps_well, freezes_well, keeps_days, is_component, tags, data, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'))`)
      .run(id, r.title, titleKey(r.title), r.source ?? null, r.sourceUrl ?? null, r.servings, r.prepMinutes ?? null, r.cookMinutes ?? null,
        r.effort, +r.bestFresh, +r.keepsWell, +r.freezesWell, r.keepsDays ?? null, isComponent, JSON.stringify(r.tags), JSON.stringify(r),
        existing?.created_at ?? new Date().toISOString());
    db.prepare('DELETE FROM recipe_ingredient WHERE recipe_id = ?').run(id);
    const ins = db.prepare('INSERT INTO recipe_ingredient (recipe_id, line_id, canonical, quantity, unit, swap_mark, recipe_ref) VALUES (?, ?, ?, ?, ?, ?, ?)');
    for (const i of r.ingredients) ins.run(id, i.id, i.recipeRef ? i.recipeRef : (resolveIngredient(i.canonical) ?? i.canonical), i.quantity, i.unit, i.swapMark, i.recipeRef ?? null);
    db.prepare('DELETE FROM recipe_fts WHERE id = ?').run(id);
    db.prepare('INSERT INTO recipe_fts (id, title, tags, ingredients) VALUES (?, ?, ?, ?)')
      .run(id, r.title, r.tags.join(' '), r.ingredients.map((i) => `${i.canonical} ${i.original}`).join(' '));
  });
  return id;
}

export function deleteRecipe(id: string) {
  db.prepare('DELETE FROM recipe_fts WHERE id = ?').run(id);
  db.prepare('DELETE FROM recipe WHERE id = ?').run(id);
}

/** Which canonical names in a recipe are not in the ingredient list (and not sub-recipes). */
export function unknownIngredients(r: Recipe): string[] {
  return [...new Set(r.ingredients.filter((i) => !i.recipeRef && !resolveIngredient(i.canonical)).map((i) => i.canonical))];
}

/** Sub-recipes referenced by a recipe, resolved from the library (missing ones come back as null). */
export function componentsOf(r: Recipe): { line: string; title: string; recipe: Recipe | null; id: string | null }[] {
  return r.ingredients.filter((i) => i.recipeRef).map((i) => {
    const row = getRecipeByTitle(i.recipeRef!);
    return { line: i.id, title: i.recipeRef!, recipe: row ? (JSON.parse(row.data) as Recipe) : null, id: row?.id ?? null };
  });
}
