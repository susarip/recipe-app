// Recipe import template, schema v1.
// Every file the app imports is validated against this before anything is saved.
// Conversion (screenshot -> JSON) happens outside the app; see conversion-instructions.md.

import { z } from "zod";

export const SCHEMA_VERSION = 1;

// ---- Enumerations -----------------------------------------------------------

/** How the ingredient is bought. Drives stock matching and shelf life. */
export const BoughtAs = z.enum([
  "fresh",
  "cooked",
  "canned",
  "dried",
  "frozen",
  "unspecified",
]);

/** How the ingredient ends up on the plate. Drives allergy rules only; never shown on the recipe. */
export const ServedAs = z.enum(["raw", "cooked", "unspecified"]);

/** Can this ingredient be replaced? */
export const SwapMark = z.enum([
  "essential", // recipe doesn't work without it
  "swappable", // can be replaced; see `swap`
  "optional", // can be left out entirely (apple in a salad, nuts on top)
]);

/** What happens when stock is a little short. */
export const AmountRule = z.enum([
  "exact", // eggs in a cake: short means buy it
  "flexible", // spinach in pasta: fine down to `floor` (default 0.5)
  "stretchable", // broth, oat milk: top up with `stretchWith`
]);

export const Effort = z.enum(["low", "medium", "high"]);

export const Unit = z.enum([
  // weight
  "g", "kg", "oz", "lb",
  // volume
  "ml", "l", "tsp", "tbsp", "cup", "fl_oz",
  // count and loose
  "piece", "clove", "slice", "can", "bunch", "sprig", "pinch", "handful",
  "to_taste",
]);

export const StorageLocation = z.enum(["fridge", "freezer", "pantry", "counter"]);

// ---- Building blocks --------------------------------------------------------

/** A window in which a step can be done ahead of cooking day. */
export const MakeAhead = z.object({
  /** How far ahead, in days. 0.5 = the morning of. */
  maxDaysAhead: z.number().positive(),
  /** Where the result keeps. */
  store: StorageLocation,
  /** Optional words for the prep list: "cover and refrigerate", "portion into bags". */
  note: z.string().max(200).optional(),
});

export const IngredientLine = z.object({
  /** Stable id within the recipe; steps refer to it. "i1", "i2", ... */
  id: z.string().regex(/^i\d+$/),
  /** Exactly as written in the source, for display and review. "2 cups baby spinach, packed" */
  original: z.string().min(1),
  /** Number or null when the source gives none ("salt to taste"). Fractions as decimals. */
  quantity: z.number().nonnegative().nullable(),
  unit: Unit,
  /**
   * Canonical ingredient name from the canonical list, lower case, singular.
   * If no canonical name fits, use the best plain name and set `unknown: true`.
   */
  canonical: z.string().min(1),
  unknown: z.boolean().default(false),
  boughtAs: BoughtAs.default("unspecified"),
  /** Set to "raw" or "cooked" only when the steps make it clear; else "unspecified". */
  servedAs: ServedAs.default("unspecified"),
  swapMark: SwapMark,
  /** Required when swapMark is "swappable": the suggested replacement, canonical name. */
  swap: z.string().optional(),
  amountRule: AmountRule.default("exact"),
  /** For "flexible": the fraction of the amount that is still fine. Default 0.5. */
  floor: z.number().min(0).max(1).optional(),
  /** For "stretchable": what tops it up. "water", "any milk". */
  stretchWith: z.string().optional(),
  /** Preparation words that matter for prep: "diced", "minced", "zested". */
  prep: z.string().max(100).optional(),
}).superRefine((line, ctx) => {
  if (line.swapMark === "swappable" && !line.swap) {
    ctx.addIssue({ code: "custom", message: `${line.id}: swappable lines need a swap` });
  }
  if (line.amountRule === "stretchable" && !line.stretchWith) {
    ctx.addIssue({ code: "custom", message: `${line.id}: stretchable lines need stretchWith` });
  }
});

export const Step = z.object({
  /** "s1", "s2", ... in cooking order. */
  id: z.string().regex(/^s\d+$/),
  text: z.string().min(1),
  /** Ingredient line ids used in this step. A line used in several steps is listed in each. */
  uses: z.array(z.string().regex(/^i\d+$/)).default([]),
  /** Minutes, only when the step states or clearly implies a wait or cook time. Drives timers. */
  timerMinutes: z.number().positive().optional(),
  /** Lead time before cooking day: "marinate overnight" -> 12. Drives advance-prep reminders. */
  leadTimeHours: z.number().positive().optional(),
  makeAhead: MakeAhead.optional(),
});

// ---- Recipe -----------------------------------------------------------------

export const Recipe = z.object({
  title: z.string().min(1).max(120),
  /** Where it came from: URL, "Instagram @handle", "Mom's notebook p.12". */
  source: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  servings: z.number().positive(),
  prepMinutes: z.number().nonnegative().optional(),
  cookMinutes: z.number().nonnegative().optional(),
  effort: Effort,
  /** Suffers from waiting: dressed salads, fried or crispy things. */
  bestFresh: z.boolean().default(false),
  keepsWell: z.boolean().default(true),
  freezesWell: z.boolean().default(false),
  /** Days leftovers keep in the fridge; used for the batch's keep-until date. */
  keepsDays: z.number().positive().optional(),
  tags: z.array(z.string().min(1).max(30)).default([]),
  ingredients: z.array(IngredientLine).min(1),
  steps: z.array(Step).min(1),
  /** Anything the converter wasn't sure about. Shown on the review screen. */
  reviewNotes: z.array(z.string()).default([]),
}).superRefine((r, ctx) => {
  const lineIds = new Set(r.ingredients.map((i) => i.id));
  const used = new Set<string>();
  for (const s of r.steps) {
    for (const u of s.uses) {
      if (!lineIds.has(u)) ctx.addIssue({ code: "custom", message: `${s.id} uses unknown line ${u}` });
      used.add(u);
    }
  }
  for (const id of lineIds) {
    if (!used.has(id)) ctx.addIssue({ code: "custom", message: `${id} is not used by any step` });
  }
  const dupes = r.ingredients.map((i) => i.id).filter((id, n, a) => a.indexOf(id) !== n);
  if (dupes.length) ctx.addIssue({ code: "custom", message: `duplicate line ids: ${dupes.join(", ")}` });
});

/** One import file holds one or many recipes. */
export const ImportFile = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  /** Who converted it and when; free text. */
  convertedBy: z.string().optional(),
  recipes: z.array(Recipe).min(1),
});

export type Recipe = z.infer<typeof Recipe>;
export type ImportFile = z.infer<typeof ImportFile>;
