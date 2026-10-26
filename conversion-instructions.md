# Recipe conversion instructions (v0)

Paste this whole file into a chat with Claude, then paste or attach the recipes to convert
(screenshots, captions, links, notebook photos). Ask for one JSON file in the format below.
The app validates the file with `recipe-schema.ts` and shows anything flagged on a review screen.

---

## What you are doing

Convert each recipe into one entry of a JSON import file. Follow the schema exactly. Where the
source is unclear, make the most likely choice and add a short line to `reviewNotes` saying what
you assumed. Never invent ingredients, quantities, or steps that are not in the source.

Output one JSON object with `schemaVersion: 1`, `convertedBy`, and a `recipes` array. Nothing
else: no prose before or after the JSON.

## Field rules

### Recipe

- `title`: the recipe's own title, title case, no emoji.
- `source`: where it came from in a few words ("Instagram @handle", "NYT Cooking", "Mom's notebook"). `sourceUrl` when there is a link.
- `servings`: as the source says. "Serves 4-6" → 4 for a dinner, 6 for a meal-prep recipe (salads, grain bowls, soups). Note the choice in `reviewNotes`.
- `prepMinutes` and `cookMinutes`: as stated; estimate from the steps when not stated and say so in `reviewNotes`.
- `effort` is per batch, clean-up included:
  - `low`: under 15 minutes active, up to two pots or pans, little chopping.
  - `medium`: under 40 minutes active.
  - `high`: longer, or a lot of chopping, or more than two pots or pans.
- `bestFresh`: true for dressed salads, fried or crispy things, anything the source says to serve immediately.
- `keepsWell`, `freezesWell`, `keepsDays`: from the source's storage notes when it has them; otherwise typical for the dish (soups and stews keep 4 days and freeze well; dressed salads keep 1 day; baked goods keep 3 days). Say in `reviewNotes` when you guessed.
- `tags`: 2 to 5 lower-case tags from the dish type, cuisine, diet, and occasion: "soup", "weeknight", "vegetarian", "meal prep", "baking".

### Ingredient lines

One line per ingredient as listed in the source. If the same ingredient is listed twice (sugar for the dough and sugar for the glaze), make two lines.

- `id`: `i1`, `i2`, ... in source order.
- `original`: the source's words, verbatim.
- `quantity`: a decimal. "1/2" → 0.5, "1 1/2" → 1.5. A range ("2-3 cloves") → the lower number, note in `reviewNotes`. None given → `null`.
- `unit`: from the schema's list. "cups" → `cup`, "tablespoons" → `tbsp`, a whole item → `piece`, "a handful" → `handful`, "to taste" → `to_taste`.
- `canonical`: the name from the canonical ingredient list (lower case, singular). Use aliases: "scallions" and "green onions" are both `scallion`. If nothing in the list fits, write the best plain name and set `unknown: true`.
- `boughtAs`: how it is bought. Canned tomatoes → `canned`; dried chickpeas → `dried`; frozen peas → `frozen`; a rotisserie chicken → `cooked`; fresh produce, meat, dairy → `fresh`; oils, spices, condiments → `unspecified`.
- `servedAs`: `cooked` if a step that uses this line has a heat word (bake, boil, simmer, fry, roast, grill, sauté, braise, poach, steam, microwave, toast) or the ingredient was bought cooked, canned or dried. `raw` if it is eaten without heat (salad leaves, fresh fruit, herbs added at the end, dressings). `unspecified` only when you truly cannot tell.
- `swapMark`:
  - `essential`: the dish is not that dish without it (short rib in a braise, flour in bread, chickpeas in hummus).
  - `swappable`: a sensible replacement exists; put it in `swap` as a canonical name (ground pork → `ground turkey`; chickpeas in a curry → `white bean`; lemon juice → `red wine vinegar`).
  - `optional`: can be left out (fruit in a salad, nuts on top, garnishes).
- `amountRule`:
  - `exact`: baking ingredients, eggs, leavening, anything where ratios matter.
  - `flexible`: vegetables, greens, herbs, cheese on top, most proteins in mixed dishes. Default `floor` 0.5; set `floor` 0.75 when half would clearly be too little.
  - `stretchable`: liquids that can be topped up: broth and stock (`stretchWith: "water"`), milks (`stretchWith: "any milk"`), wine in a sauce (`stretchWith: "broth"`).
- `prep`: the preparation words from the source, if any ("diced", "minced", "zested", "room temperature").

### Steps

- `id`: `s1`, `s2`, ... in cooking order. Split a long paragraph into steps at each new action.
- `text`: the step in plain words, close to the source. Keep amounts in words where the source has them ("add half the sugar").
- `uses`: every ingredient line this step uses. A line used in several steps is listed in each. Every line must appear in at least one step.
- `timerMinutes`: only when the step states a time to wait or cook ("simmer 20 minutes"). A range → the lower number.
- `leadTimeHours`: for steps that must happen well before cooking ("marinate overnight" → 12, "soak beans overnight" → 10, "chill 2 hours" → 2).
- `makeAhead`: when a step's result can be made ahead and stored. Typical windows:
  - chopped sturdy vegetables (onion, carrot, pepper, cabbage): 3 days, fridge
  - chopped soft or browning produce (apple, avocado, tomato): same day, fridge
  - herbs: do not pre-chop; leave `makeAhead` off
  - marinades, dressings, sauces: 4 days, fridge
  - marinated raw meat: 2 days, fridge, or freeze on shopping day
  - cooked grains and beans: 4 days, fridge
  - overnight oats, chia pudding: 4 days, fridge
  - doughs: as the source says

## Self-check before you answer

Go through this list and fix anything that fails. Then output the JSON.

1. Every ingredient line is used by at least one step, and every `uses` id exists.
2. Every `canonical` name is in the canonical list, or the line has `unknown: true`.
3. Every `swappable` line has a `swap`; every `stretchable` line has a `stretchWith`.
4. `servedAs` is `raw` or `cooked` wherever the steps make it clear. Fresh fruit, salad leaves and finishing herbs are `raw`.
5. Baking ingredients and eggs are `exact`; vegetables and herbs are `flexible`; broths and milks are `stretchable`.
6. The same ingredient listed twice in the source is two lines.
7. Quantities are decimals, units are from the list, `piece` for whole items.
8. `effort` matches the rules above, not the source's "easy" claim.
9. Every guess (servings, times, keeps days, a range) is in `reviewNotes`.
10. The output is one JSON object and nothing else, with `schemaVersion: 1`.

## Canonical ingredient list

(Paste the current list here, one per line as `canonical name: alias, alias, alias [category]`.
The starter list is generated from the USDA FoodKeeper data plus the test recipes.)

## Worked examples

See `example-import.json` for a full bean salad. Add four more here after the test-recipe run:
one baked recipe, one braise or stew with a marinade, one quick weeknight pasta, one notebook recipe with vague amounts.
