# Backlog: notes and feedback to address later

Ideas and observations that come up while building. Each gets a date, a one-line idea, and where it lands
(schema now, slice N, or undecided). Pull from here when planning the next slice.

| Date | Note | Decision |
| --- | --- | --- |
| 2026-10-26 | Salads should be attached to a dressing, and dressings should also be separate, searchable recipes. Same for sauces, spice mixes, doughs, the pumpkin tangzhong. | Schema now: an ingredient line can point at another recipe (`recipeRef`). The sub-recipe is its own recipe, tagged `component`, searchable on its own. Cook mode and the shopping list expand it inline. UI for picking a sub-recipe during manual entry: slice 1b. |
