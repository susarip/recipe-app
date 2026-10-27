// Display helpers shared by the recipe page and cook mode.
export const UNIT_LABEL: Record<string, string> = {
  g: 'g', kg: 'kg', oz: 'oz', lb: 'lb', ml: 'ml', l: 'l', tsp: 'tsp', tbsp: 'tbsp', cup: 'cup', fl_oz: 'fl oz',
  piece: '', clove: 'clove', slice: 'slice', can: 'can', bunch: 'bunch', sprig: 'sprig', pinch: 'pinch', handful: 'handful', to_taste: 'to taste'
};

/** Scale a quantity and print it the way a cook reads it: 1/2, 1 1/2, 2, 250. */
export function fmtQty(q: number | null, factor = 1): string {
  if (q === null) return '';
  const v = q * factor;
  if (v >= 10) return String(Math.round(v));
  const whole = Math.floor(v), frac = v - whole;
  const fr: [number, string][] = [[0, ''], [0.125, '⅛'], [0.25, '¼'], [0.333, '⅓'], [0.5, '½'], [0.667, '⅔'], [0.75, '¾'], [1, '']];
  let best = fr[0];
  for (const f of fr) if (Math.abs(f[0] - frac) < Math.abs(best[0] - frac)) best = f;
  if (best[0] === 1) return String(whole + 1);
  if (!best[1]) return whole ? String(whole) : v.toFixed(1).replace(/\.0$/, '');
  return (whole ? whole + ' ' : '') + best[1];
}

export function fmtLine(i: { quantity: number | null; unit: string; canonical: string; prep?: string }, factor = 1): string {
  const q = fmtQty(i.quantity, factor);
  const u = UNIT_LABEL[i.unit] ?? i.unit;
  const plural = i.quantity !== null && i.quantity * factor > 1 && u && !['g', 'kg', 'oz', 'lb', 'ml', 'l', 'tsp', 'tbsp', 'to taste', 'fl oz'].includes(u) ? 's' : '';
  const amount = [q, u ? u + plural : ''].filter(Boolean).join(' ');
  return [amount, i.canonical + (i.prep ? `, ${i.prep}` : '')].filter(Boolean).join(' ');
}

export function fmtMinutes(m: number | null | undefined): string {
  if (!m) return '';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
}
