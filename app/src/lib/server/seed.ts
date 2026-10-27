// Loads the canonical ingredient list and swap groups from ../data on first run (or when asked).
import fs from 'node:fs';
import path from 'node:path';
import { env } from '$env/dynamic/private';
import { db, transaction } from './db';
import { parseCsv } from './csv';

const dataDir = env.DATA_DIR ?? path.resolve('../data');
const num = (s: string) => (s === '' ? null : Number(s));

export function seedIngredients(force = false) {
  const count = (db.prepare('SELECT count(*) n FROM ingredient').get() as { n: number }).n;
  if (count && !force) return count;
  const file = path.join(dataDir, 'canonical-ingredients.csv');
  if (!fs.existsSync(file)) { console.warn(`seed: ${file} not found`); return 0; }
  const rows = parseCsv(fs.readFileSync(file, 'utf-8'));
  const ins = db.prepare(`INSERT OR REPLACE INTO ingredient
    (canonical, aliases, category, store_section, groups, grams_per_piece, pantry_days, fridge_days, fridge_after_opening_days, freezer_days)
    VALUES (@canonical, @aliases, @category, @store_section, @groups, @grams_per_piece, @pantry_days, @fridge_days, @fridge_after_opening_days, @freezer_days)`);
  const insAlias = db.prepare('INSERT OR REPLACE INTO ingredient_alias (alias, canonical) VALUES (?, ?)');
  const insGroup = db.prepare('INSERT OR REPLACE INTO ingredient_group (grp, canonical) VALUES (?, ?)');
  transaction(() => {
    db.exec('DELETE FROM ingredient_alias; DELETE FROM ingredient_group;');
    for (const r of rows) {
      ins.run({
        canonical: r.canonical, aliases: r.aliases, category: r.category, store_section: r.store_section, groups: r.groups,
        grams_per_piece: num(r.grams_per_piece), pantry_days: num(r.pantry_days), fridge_days: num(r.fridge_days),
        fridge_after_opening_days: num(r.fridge_after_opening_days), freezer_days: num(r.freezer_days)
      });
      insAlias.run(r.canonical, r.canonical);
      for (const a of r.aliases.split(';').map((s) => s.trim().toLowerCase()).filter(Boolean)) insAlias.run(a, r.canonical);
      for (const g of r.groups.split(';').map((s) => s.trim()).filter(Boolean)) insGroup.run(g, r.canonical);
    }
  });
  console.log(`seed: ${rows.length} ingredients loaded`);
  return rows.length;
}

/** Resolve a name to its canonical ingredient, or null when unknown. */
export function resolveIngredient(name: string): string | null {
  const n = name.trim().toLowerCase();
  const hit = db.prepare('SELECT canonical FROM ingredient_alias WHERE alias = ?').get(n) as { canonical: string } | undefined;
  if (hit) return hit.canonical;
  for (const v of [n + 's', n.replace(/s$/, '')]) {
    const h = db.prepare('SELECT canonical FROM ingredient_alias WHERE alias = ?').get(v) as { canonical: string } | undefined;
    if (h) return h.canonical;
  }
  return null;
}
