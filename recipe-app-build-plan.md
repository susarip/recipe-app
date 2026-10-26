# Recipe and Meal Planning App: Build Plan v3

Oct 26, 2026 · @Susmitha

## Purpose and goals

One private place for all my recipes, with a plan that always knows what I'm eating next, so I cook at home more, order less takeout and waste less food. I'm the main user; friends join later by invite. The app is private and invite-only, never public, so family recipes and recipes from paid newsletters can live in it.

Building it is part of the point: it's a project to learn what's possible building with Claude, so the plan favours things we can build and change ourselves over adopting an existing tool.

### Goals, in order

1. Cook and eat at home more, by always having an answer to "what am I eating next" and making a change one tap.
2. Order less takeout and throw away fewer groceries, as a result of 1.
3. Keep every recipe in one place with two indexes: my private catalogue, and the group's published index that everyone in the group can search. A recipe is published by choice, and any edit can be saved as a private copy.
4. Learn by building, with an app that is cheap to run and needs little upkeep.

### Success measures

All four come from things the app already records or from one new "ate out" entry. The home screen shows this week's numbers next to last week's.

| Measure | Where it comes from | Available from |
| --- | --- | --- |
| Meals eaten at home per week | Plan entries confirmed as eaten; cook mode logs each batch | Slice 1a |
| Takeout or eating-out meals per week | "Ate out" entries in the plan | Slice 1a |
| Planned meals actually cooked, as a share of meals planned | Plan entries confirmed vs skipped | Slice 1a |
| Items thrown away per week | "Threw away" button on stock items | Slice 2 |

Baseline: for two weeks before slice 1a goes live, keep a tally on paper or in a note of meals cooked, takeout meals and items thrown away. The app's first-month numbers are compared against it.

## What changed from v2

- Goals are ranked and each has a success measure the app records. An "ate out" entry and a weekly numbers view join slice 1a.
- Slice 1 is split: 1a is the smallest app I can cook from in two to three weeks; 1b makes the plan reliable and offline.
- A viability testing phase comes before any app code, with pass marks.
- Ingredient state splits into *bought as* (fresh, canned, dried, frozen) on stock and *served as* (raw or cooked) on each recipe ingredient. The never-list can say "raw fruit" and allow apple pie.
- Allergies are separate from preferences and get loud warnings instead of a hidden toggle.
- The plan advances on its own when a meal's time passes, with a one-tap "Did you have it?". Ticks stay optional.
- A "Plans changed" button pushes the plan back, logs eating out, and puts restaurant leftovers first.
- Steps link to a recipe's ingredient lines, not canonical names, so sugar in the dough and sugar in the glaze are two lines.
- A unit table with conversions and weight per piece joins slice 1a. Scaling rounds to buyable amounts.
- Hosting is a small VPS, with streaming backups (Litestream) added in 1b.
- Records get IDs generated on the phone, and offline changes go through a replayable queue.
- Import review is designed as a fast triage screen, and the import template is versioned and validated.
- A minimal use-first list (leftovers and freezer meals by date) moves into slice 1b.

## Design principles

- **Remove decisions.** The app always has an answer to "what am I eating next" and makes changing it a single tap. Skipped cooking comes from decision fatigue and low energy, not lack of recipes.
- **Keep itself current.** The plan moves on by itself when a meal's time passes. Ticks, logs and amounts are optional everywhere; the app asks once and never nags.
- **Low upkeep.** Nothing depends on careful data entry. Stock fills in from shopping and cooking; amounts are estimates.
- **Allergies are safety, preferences are taste.** An allergen is never shown quietly with a swap note. It gets a warning on the recipe, in cook mode and on the shopping list.
- **No AI inside the app.** Everything in the app is fixed rules and lookup tables, so it is cheap to run and every suggestion can say why. AI converts recipes outside the app, once per recipe.
- **Structured ingredients.** Every ingredient is quantity, unit, canonical name, bought-as state and served-as state. Shopping, stock, exclusions and later calories depend on this.
- **Private first.** Invite-only. Recipes, notes, ratings, stock and plans are private unless deliberately shared.
- **Works where it's used.** At the stove and in the store, so cook mode and the shopping list work offline, the screen stays on, and tap targets suit wet hands.
- **Explain every suggestion** in a few words: "uses spinach that expires tomorrow", "15 min, low effort".

## Viability testing: before any app code

Two weeks of tests with no code beyond a schema file. Tests 1 and 6 need my own kitchen, so they wait until I'm back home; the rest run now, while slice 1a is being built. They answer the three questions the whole plan rests on: can recipes get in fast enough, does the home-screen idea change what I eat, and can my phone do what cook mode needs. If a test fails, the plan changes before a line of app code is written.

| # | Test | How | Pass mark |
| --- | --- | --- | --- |
| 1 | Baseline | Keep a tally for two weeks: meals cooked at home, takeout or eaten out, items thrown away | Two full weeks recorded |
| 2 | Recipe conversion speed | Pick 15 to 20 recipes across Pinterest, TikTok, Instagram, newsletters and the iPad notebook. Convert each with Claude using a draft of the conversion instructions and the JSON template. Time each one from screenshot to finished JSON | Median under 3 minutes per recipe; 80% need no hand correction of ingredients |
| 3 | Template fitness | Write the JSON schema (Zod) and validate all converted files | Every recipe fits; no field had to be dropped or fudged |
| 4 | Ingredient matching | Count the distinct ingredients in the test recipes and match them to a starter canonical list (a few hundred items) | At least 85% match by name or alias; unknowns are mostly rare items |
| 5 | Allergy rule | Check the test recipes by hand for raw vs cooked fruit and essential vs swappable marks | The served-as field and swap marks are enough to decide every case |
| 6 | Paper home screen | Each evening for a week, write tomorrow's next meal on a note and apply the "not this" rule by hand (leftovers first, then quick from stock, then low effort) | I cooked the noted meal, or its swap, on at least 4 of 7 days |
| 7 | Phone capabilities | Install a minimal SvelteKit PWA on the phone: home-screen icon, screen stays on, a test web push, an offline page | All four work on my Android phone in Chrome; note the Android version. iPhone checks are not needed now; they happen before slice 3, when friends join |
| 8 | Source exports | Request Instagram and TikTok data downloads; check what Pinterest exports | Know whether saved-post links come out of each |

### Decisions the tests settle

- Test 2 or 3 fails: simplify the template before anything else, or accept manual entry as the main route.
- Test 4 fails: grow the starter list from the test recipes before slice 1a.
- Test 6 fails: the problem may not be deciding what to eat. Revisit the purpose before building.
- Test 7 fails on push or screen wake: unlikely on Android, but if so move push to slice 2 and plan a native wrapper later; the rest of the plan stands.

### Also before building

- Agree the effort scale: a first guess is low under 15 minutes active and up to two pots or pans, medium under 40 minutes, high anything longer or with a lot of chopping. Effort is per batch; the app also shows an efficiency rating (see Recipe library), so a bean salad is honestly high effort on the day, but efficient because it feeds four days and eases the days after.
- Pick a shelf-life source and conservative defaults. Defaults are only a starting point: each person can set their own shelf life per ingredient and state (my spinach: 3 days, not 5), and the app offers to shorten it when an item is thrown away before its date.
- Decide hosting (a small Hetzner VPS) and a domain.
- Set up the repo with the schema, the conversion instructions and the starter ingredient list.

## Stack and hosting

One small web app with a SQLite database, installed on the phone as a PWA. Chosen for low cost, easy backups, and code that's readable while we learn. Any of it can be swapped later.

| Part | Choice | Why |
| --- | --- | --- |
| App | SvelteKit (TypeScript) | One codebase for pages and API, small and readable, good PWA support |
| Database | SQLite via Drizzle ORM, FTS5 for search | One file to back up, no database server, plenty for a friend group |
| Login | Invite links plus email magic link or passkey, via an auth library (Better Auth) and an email sender (Resend or Postmark) | No passwords to manage, invite-only by design, reliable delivery of magic links |
| Phone app | A progressive web app (PWA): the website itself, added to the phone's home screen from the browser. No App Store, no separate iPhone or Android app to build | Opens full-screen like an app with its own icon, works offline for cook mode and the shopping list, and can send push notifications (Android and Chrome support all of this well; friends on iPhone need iOS 16.4 or later and must add it to the home screen for push). One codebase for phone, iPad and laptop |
| Hosting | One small VPS (Hetzner, about $5 a month) with Caddy for HTTPS | Cheap, private, database on local disk, one place to back up |
| Backups | Litestream streaming the SQLite file to object storage (Backblaze B2 or Cloudflare R2), plus a nightly copy of the uploads folder and a full export from inside the app | Loses minutes, not a day, for cents a month |
| Files | Photos and screenshots on local disk, resized on upload, cleared on conversion | Keeps hosting simple; small group, small volume |
| Import | Versioned JSON template validated with Zod; conversion instructions kept in the repo | AI stays outside the app; bad files are rejected with a clear message |
| Reminders | A small scheduler in the server process that computes due reminders every few minutes and sends web pushes | No extra service |
| IDs and sync | IDs generated on the phone (ULID); offline changes queued and replayed, last write wins per field | The app works offline and syncs without clashes |

### Rules the code follows

- Every query goes through one data-access layer that checks ownership. SQLite has no row-level security, so privacy is enforced in code and proven by tests.
- The rule engines (exclusions, shopping maths, keep-until, suggestion ranking) are pure functions with tests.
- Error logging, automatic security updates on the server, and rate limits on magic-link requests from day one.

## Data model

Five tables carry the whole app; everything else hangs off them. Every record has an owner and a phone-generated ID.

| Table | Holds | Notes |
| --- | --- | --- |
| Canonical ingredient | One row per real ingredient, with aliases ("scallions" and "green onions" are one row), category, store section, default shelf life per bought-as state (with a per-person override, since fridges and climates differ), optional grams per piece and density, later a nutrition match | Import maps names to this table and flags unknowns for review |
| Contains | Links an ingredient to what it contains or belongs to, with several parents allowed | Chorizo is pork and sausage; hummus contains chickpeas and sesame. Drives ingredient groups for exclusions |
| Unit | Units with conversion factors between them | Cups to ml, oz to g; with grams per piece, "2 onions" becomes about 300 g |
| Recipe and ingredient lines | A recipe's ingredient lines, each with quantity, unit, canonical ingredient, bought-as, served-as, swap mark and suggested swap, in display order | Steps reference line IDs, so the same ingredient can appear twice |
| Stock item | Canonical ingredient, bought-as state, location, optional amount, dates, optional brand | Perishables and pantry are two views of this table |
| Household | One or more accounts. Stock items, plan entries, batches and shopping lists belong to a household; recipes, never-lists and personal layers belong to a person | Every account starts in a household of one, so slice 3 can merge two without a migration |

### Two kinds of state

- **Bought as:** fresh, cooked, canned, dried, frozen or unspecified. Lives on stock items and on recipe lines. Drives stock matching (canned tomatoes don't count toward fresh) and shelf life. Freezing a fresh item changes it to frozen and moves it to the freezer in one move.
- **Served as:** raw, cooked or unspecified. Lives on recipe lines only. Drives allergy rules: a raw apple in a salad is blocked by a "raw fruit" allergy, a cooked apple in a pie is not. Unspecified matches anything, so the import rules set it wherever the step text makes it clear.

### Scaling and rounding

Recipes scale to the servings wanted. Counted items round to whole or half units (1.5 eggs becomes 2), cans round up to whole cans, and weights round to sensible steps (10 g under 100 g, 25 g above). The shopping list uses the rounded amounts.

## Recipe library

Every recipe has an owner and is private by default. Each stores:

| Field | Detail |
| --- | --- |
| Basics | Title, photo, source link, owner |
| Ingredient lines | Quantity, unit, canonical name, bought-as, served-as, swap mark (essential or swappable, with a suggested swap). Order kept for display |
| Steps | Plain text, plus the ingredient lines each step uses. This drives cook-mode checkmarks |
| Time | Prep and cook time stored separately, total calculated |
| Effort | Low, medium or high for the batch, clean-up included. Set at import, corrected after cooking. The app derives an efficiency rating from effort, servings and keeps-well days: a big batch of bean salad stays high effort on the day but is rated efficient, because it feeds four days and removes work from them |
| Advance prep | Any step with a lead time (marinate 2 hours, soak overnight), and any step with a make-ahead window and storage note (see Prep and storage). Plus a best-fresh flag on the recipe |
| Servings | Yield in servings, plus keeps-well and freezes-well flags |
| Tags | Case-insensitive, one shared vocabulary, suggested while typing |
| Status | Want to try, or made it |
| Sharing | Private, shared with the group, or never share (for paid-newsletter and family recipes) |
| Personal layer | Private notes, rating, favorite marker (per person, never shared) |

### Steps and ingredient lines

A step lists the ingredient lines it uses. A line used in several steps is listed in each. Step text can say "half the sugar" in words; the full scaled amounts live in the ingredient list at the top of cook mode. Ticking a step checks each line whose last step it is.

### Quick filters and search

Search covers titles, ingredients and tags, with the never-list applied. Quick filters for the moment: under 20 minutes, low effort, uses what I have, want to try. Deleted recipes go to a trash bin for 30 days.

## Allergies, exclusions and swaps

A strict rule (my beef and pork, my raw-fruit allergy, a friend's chickpea allergy) is set once and never needs a filter again, while recipes that can be adapted still show up. Allergies and preferences are kept apart because they need different behavior.

### The never-list

Each person has one, set in the profile. Each entry is an ingredient or group, an optional served-as condition, and a kind.

| Kind | Example | Behavior |
| --- | --- | --- |
| Allergy | Raw fruit; chickpeas | Red warning on the recipe, in cook mode and beside the shopping list item. Never offered from "Not this" or suggestions. Shown with a swap only when the swap removes the allergen |
| Preference | Beef; pork | Hidden by default with a toggle to show it marked "contains beef". Swappable recipes shown with a swap note |

### How a recipe is judged

| Avoided ingredient in the recipe is… | Preference | Allergy |
| --- | --- | --- |
| Not present | Shown normally | Shown normally |
| Present but served-as condition not met (cooked apple vs raw-fruit rule) | Shown normally | Shown normally |
| Swappable | Shown with "pork → turkey" | Shown with the swap and a warning to check the swap |
| Essential | Hidden; toggle shows "contains beef" | Hidden; toggle shows a red "contains chickpeas" |
| Not marked | General swap table decides (beans for beans, pork for turkey or chicken); no match means essential | Treated as essential |
| Uncertain (unknown ingredient, stock, gelatin, unspecified sausage) | Flagged "check this" | Flagged "check this" and hidden from suggestions |

### Groups and swaps

- **Ingredient groups** come from the contains table: pork catches bacon, ham, chorizo, prosciutto and lard; chickpeas catch hummus and chickpea flour. An ingredient can be in several groups.
- **Swap marks** are set per ingredient line during conversion and editable in the recipe. Ground pork in meatballs: swappable, turkey. Short rib in a braise: essential.
- **Personal versions.** Save a private copy with the swap applied; it then counts as fine and the shopping list uses the swap.
- **One-off filters.** Exclude any ingredient for a single search or plan.
- **Amount rules** sit beside the swap mark on each line: *exact*, *flexible* (how far under is fine, default about half), or *stretchable* (what tops it up: water for broth, any milk for oat milk). The canonical table gives a default by category (leafy greens flexible, liquids stretchable, baking ingredients exact); conversion and the recipe can override it.
- **Leaving something out.** A swap can be "leave it out": a swappable line with no replacement (apple in a salad, nuts on top). A recipe whose only allergen can be left out stays searchable and plannable; it shows "leave out the apple", the shopping list drops it, and cook mode marks it. No copy is saved. If the line is marked essential but I disagree, the hidden-recipe toggle shows it and I can plan it "without the apple" as a one-off; the plan entry remembers the omission and nothing is saved to the recipe.

## Getting recipes in

The app reads one template. All conversion from captions, screenshots and notebook pages happens outside it, in a chat with Claude using written instructions kept in the repo. The review screen is where all the upkeep in the app lives, so it gets the most design care.

- **Template import (main route).** A JSON file of one or many recipes, with a `schemaVersion` field, validated against the schema in the repo. The conversion instructions include the canonical list, the served-as rules and the swap-mark rules, so output arrives already matched. A bad file is rejected with a message that names the field.
- **Manual entry with a line parser.** Typing "2 cups sugar" splits into quantity, unit and name with fixed rules, and offers canonical names as you type.
- **Website links (slice 2).** The app fetches one page on request and reads the standard recipe data most sites publish. Not attempted for social links behind logins; the link is kept as the source.
- **Conversion instructions.** A file in the repo (`conversion-instructions.md`) that is pasted into the chat with every batch of recipes. It holds the JSON schema, the canonical ingredient list with aliases and categories, the rules for bought-as, served-as, swap marks, amount rules, effort and make-ahead windows, five fully worked examples across recipe types, and a self-check list the assistant runs before answering (every ingredient line used by a step, every name in the canonical list or flagged, every served-as set where the steps make it clear). Corrections made on the review screen are logged, and the instructions are revised from that log at each gate.

### Review screen

All imports land as drafts. The review is a triage list, one row per flag: unknown ingredient names, missing swap marks, odd quantities, a likely duplicate of an existing recipe. Each row is one tap to accept the suggested match, one tap to add a new canonical ingredient, or one tap to skip. A draft with no flags saves in one tap.

### Saved section

A private holding area for links and screenshots not yet converted. Quick to capture, usable to cook from, not plannable until converted. Items export as a batch to hand to Claude; the JSON comes back through the template import, the new recipe keeps the source link, and the saved item and its screenshots are deleted. Saved items are never shared. In slice 3, a weekly script run outside the app converts everyone's saved items into drafts in their private catalogue.

## Home screen and plan

The home screen shows the next meal and two buttons: "Not this" and "Plans changed". Everything else in the plan exists to keep that answer good.

### Home screen

- **Next:** the next entry in the plan that hasn't passed, with servings, and for a cook day the recipe's time and effort, plus one line of why ("uses the chicken that expires Thursday").
- **Not this:** opens the swap. Leftovers and freezer meals first, then quick recipes from stock, then anything low-effort, each with its reason. The skipped batch is rescheduled, with a check that its ingredients will keep. Allergens are never offered.
- **Plans changed:** push everything back one meal or one day; log "ate out" (with optional restaurant leftovers, which go to the front of the queue with a two-day keep-until); or skip today's meal. Then the plan re-checks keep-until dates and says what is now at risk.
- **Coming up:** the next few days, so shopping and defrosting are visible without opening the plan.
- **This week:** meals cooked, ate out, and planned-vs-cooked, next to last week.

### The plan advances itself

Ticks stay optional. When an entry's time passes, the plan moves on and asks once, the next time the app opens: "Did you have the chilli?" with Yes, Skipped and Ate out. No answer is taken as Yes after a day. This keeps "Next" right without making anything required, and feeds the success measures.

### Structure

- Rolling timeline of days, no fixed week. Each day holds an ordered list of entries. Reorder by drag, or by "move to tomorrow" and "swap with next" from the entry's menu, which work better on a phone.
- An entry is a food plus servings: a recipe batch, a leftover, a freezer meal, any stock item, or "ate out".
- Each person sets a daily servings target (two for me).

### Batches

- Cooking a recipe creates a batch with a serving count, and the plan tracks where each serving goes. Unassigned servings are flagged with a prompt to place or freeze them.
- Each batch gets a keep-until date; the plan warns if a serving is scheduled past it.
- Recipes scale to the servings wanted, with rounding, and the shopping list follows.

### Suggestions

Fixed ranking rules, no AI, each with its reason shown: expiring stock used, effort for today's energy, efficiency for the week (an efficient batch is suggested for a free day ahead of busy ones), time since last made, exclusions applied. Slice 1b suggests recipes and I place them. Slice 4 drafts the whole plan for approval, with a "batch run" preference that drafts my usual pattern of one batch over consecutive meals, then the next.

### Navigation

A bottom bar with four tabs: Next (home), Plan, Recipes (with Saved inside it), Shop. Stock joins as a fifth tab in slice 2. Settings, the never-list and the group live behind the profile picture. Empty states say what to do first: "Import your first recipes" with a link to the conversion instructions.

## Shopping list

Built from the batches to be cooked over a chosen range ("next batch only", "everything through Friday"), minus what stock says is on hand, with bought-as state respected and amounts rounded to buyable units.

- **Needed-by dates.** Each item shows the date of its batch; shared items show the earliest date and the combined amount, merged through the unit table.
- **Two views.** By date for deciding when to shop; by store section (from the canonical table) in the store.
- **Shelf-life check.** Flags items that won't keep if bought too far ahead of their batch.
- **Approximate stock (slice 2).** Clearly covered items are left off. Close calls stay on with a note ("you may have about 80 g, check"). Pantry items marked "have" are left off, "low" stays on with a note.
- **Check-off into stock (slice 2).** Ticking an item adds it to stock with the bought amount pre-filled.
- **Allergy warnings.** An item that is an allergen for anyone eating the batch shows a red mark.
- **Works offline (slice 1b).** The list loads without signal; ticks queue and sync when it's back.
- **Extras.** Anything typed in by hand is kept on the list and added to stock when ticked.
- **Quick group.** Items on my personal "quick to get" list (what the shop next door always has) sit in their own group, so the big shop and the five-minute errand are separate. Suggestions treat a recipe missing only quick items as nearly in stock.

## Stock and use-first

Stock is split in two so the useful part (what's going off) costs almost nothing to keep, and amounts are there when wanted. Leftovers and freezer meals with dates arrive in slice 1b; the rest in slice 2.

|  | Perishables | Pantry |
| --- | --- | --- |
| What | Fridge items, fresh produce, meat, dairy, leftovers, freezer meals | Dry goods, cans, spices, oils, frozen staples |
| Always tracked | Date added, estimated expiry from the shelf-life table by ingredient and bought-as state, using my own override where I've set one. Editable on the item; "threw away" before the date offers to shorten the shelf life for next time | Have, low, or out |
| Optional | Amount with a full-to-empty slider | Amount with a full-to-empty slider |
| Notified | Yes, before expiry | Never; visible in stock and use-first |

Each item stores canonical ingredient, bought-as state, location (fridge, freezer, pantry, custom), optional brand (kept now so slice 4 ratings have data), and the optional amount.

### Keeping it current

- Shopping adds items with bought amounts pre-filled.
- Cooking removes items. Finishing a recipe offers to mark ingredients used and moves sliders down by the amount used, converted through the unit table. Otherwise it asks for a nudge.
- Finishing a batch creates leftovers as a stock item with a serving count and keep-until date, placeable in the plan.
- Quick clean-up. "Used up" and "threw away" on every item. The second builds the waste record behind the weekly numbers.
- Estimates always. Amounts display as "about 120 g". The slider is the only control that ever needs touching.

### Use-first

- Stock sorted by expiry, most urgent first, leftover batches included. Filter for pantry and freezer.
- Each urgent item links to recipes that use it, exclusions applied, ranked by how many expiring items they use and how little needs buying, with the reason shown.
- Expiring stock is weighted heavily in plan suggestions.
- Freeze suggestions. Something freezable about to expire and not in the plan gets a one-tap move to the freezer with a new date and the frozen state.

## Cook mode

One scrolling page that works offline, keeps the screen on, and makes a missed ingredient stand out. Large text and tap targets for wet hands, dark mode, and an iPad landscape layout with ingredients beside steps.

- **Ingredients at the top.** The full scaled list, rounded, with any swap applied for this person and any allergen marked in red.
- **Steps below.** Plain text with one optional tick each. Ticked steps dim.
- **Automatic checkmarks.** Ticking a step checks each ingredient line whose last step it is. Nothing has to be ticked to carry on.
- **Spotting a miss.** Any line without a checkmark stands out, during and at the end.
- **Timers.** Any step with a time gets a tap-to-start timer. The timer stores its end time and shows "done at 6:42", so it survives the screen locking; in slice 2 it also sends a push.
- **Prep day (slice 2).** Open two or three recipes at once with one combined timer list.
- **Finish.** Logs the batch with servings and keep-until date, offers to update stock, and shows servings and effort as editable values I can change if the batch came out different, plus an optional note; nothing asks, and corrections update the recipe. Undo is available for a minute.

## Prep and storage

The app tells me what to do with groceries when they come home, and moves prep work from busy evenings to free ones. All of it is fixed rules on data that already exists or arrives with the recipe; none of it is required.

### Storage guidance (slice 2)

- The canonical ingredient table gains storage notes per bought-as state: where to keep it, whether to wash before storing, whether it can be cut ahead and for how long. Herbs: keep whole, stems in water. Carrots and peppers: fine cut up to 4 days. Berries: don't wash until eating.
- **Coming home.** Ticking off a shopping trip shows one checklist for everything bought, grouped by action: put away as is, wash and store, cut ahead for a planned meal, freeze now. Each line says why ("peppers for Thursday's stir-fry can be cut now").
- Cut-ahead items become stock items with their own, shorter shelf life.

### Make-ahead on recipes (template in slice 1a, used from slice 2)

- Any step can carry a make-ahead window: how far ahead it can be done and how to store the result. Marinate: up to 2 days, fridge. Overnight oats and chia pudding: 1 to 4 days, fridge. Portioned chicken: freeze on the day of shopping. Chop onions: 3 days, fridge.
- Each recipe carries a *best fresh* flag for things that suffer from waiting (salads with dressing, fried food, anything crispy).
- Both are set during conversion from the recipe's own words and corrected after cooking, like effort.

### Busy days and the prep plan (slice 2)

- Each day in the plan can be marked busy or free, with a weekly default ("Wednesday and Thursday evenings busy").
- The plan steers low-effort meals, leftovers and make-ahead meals to busy days, and best-fresh recipes to free days. "Not this" respects the same rule.
- A **prep list** appears on free days: the make-ahead steps of the next few meals that fall inside their windows, each with its storage note and the meal it serves. Doing one ticks that step in cook mode later and puts the prepped item in stock.
- Nothing is required: an unticked prep step just stays in the recipe for cooking day.

### What it does not do

No general cooking advice and no AI: every note comes from the ingredient table or the recipe. If a step has no make-ahead window, the app says nothing.

## Reminders

In-app in slice 1a; real phone push notifications in slice 2, because a defrost reminder seen only on opening the app arrives too late. Same-day reminders are grouped into one, quiet hours apply, and each type can be switched off.

| Reminder | When |
| --- | --- |
| Did you have it? | A plan entry's time has passed and nothing was confirmed (once, next time the app opens) |
| Shopping deadline | Cooking is coming up and items are still missing |
| Advance prep | Counted back from the planned cooking time |
| Defrosting | A planned recipe uses something stock says is in the freezer |
| Perishable expiry | Fridge items and short-life items elsewhere, a day or two ahead |

Pantry and freezer expiry are never notified.

## Friends and sharing (slice 3)

Everyone gets a full account with their own recipes, never-list, stock and plan. Friends who only browse can ignore the rest.

- **Invite by link** into one private group. Nothing is visible outside it. A first-run screen shows a friend how to browse shared recipes and how to import their own.
- **Private by default.** Sharing is a deliberate choice per recipe. Recipes marked "never share" (family, paid newsletters) cannot be shared even by mistake.
- **Owners control edits.** Only the person who added a recipe changes the published version. Credit and source link are always shown.
- **Personal layers stay private:** notes, ratings, favourites, status, stock, plans.
- **Comments.** Anyone in the group can comment on a shared recipe. Comments never change the recipe.
- **Variants.** Anyone can keep a private edited copy, stored as a full copy with a link to the original. A shared edit is published as a variant attached to the original. Search shows the original once with a variant count.
- **Swap marks on shared recipes** are set by the owner; a friend who disagrees keeps a personal version.
- **Allergies travel with the person.** A friend's never-list applies to everything they see, including my shared recipes.
- **Leaving.** A friend can export everything they own and delete their account; their shared recipes go with them unless they choose to leave copies.
- **Friends' imports** use the same routes: the template filled by their own assistant or by me, manual entry, website links, and the weekly script for their saved items.
- **Households.** Two or more accounts can form a household that shares one stock, one plan and one shopping list, for couples who cook and eat together. Recipes, notes, ratings and never-lists stay personal. A household meal must clear every member's allergies and shows every member's preference notes. Everyone starts as a household of one, so nothing changes for me.
- **Servings can change hands.** A batch's servings can be given to another household (dinner at a friend's, a swap after a prep day). They leave my stock and plan and arrive in theirs with the same keep-until date. This is the one piece of slice 4's cook-together that the data model carries from 1a: a serving always belongs to exactly one household.

## Project plan

Each slice is usable on its own and gets cooked from before the next starts. A slice ends when its gate is met in real use, not when its features are built. Weeks assume a few evenings and one weekend day a week; they are estimates to check against, not promises.

&#91;embedded content: roadmap · 6 phases, 5 gates\]

The accented band is the first point at which the app earns its place: dinner cooked from it five nights in a week.

### Slice 1a: cook from it (weeks 3 to 5)

| Build | Notes |
| --- | --- |
| Login with invite links; accounts and ownership on every record | Better Auth, magic link |
| Canonical ingredient table with aliases, contains links, store sections, shelf lives; unit table | Seeded from the starter list and the test recipes |
| JSON template import with versioning, validation and the triage review screen | The test recipes are the first import |
| Recipe library with all fields, bought-as and served-as, swap marks, tags, status, notes, ratings, favourites, trash bin |  |
| Never-list with allergy and preference kinds, served-as conditions, ingredient groups, swap-aware search, one-off filters, quick filters |  |
| Home screen: next meal with reason, "Not this", "Plans changed" with ate out, coming up, this week's numbers |  |
| Rolling plan with servings, self-advancing entries and "Did you have it?", move-to-tomorrow and swap-with-next | Drag to reorder can wait for 1b |
| Shopping list for a range, needed-by dates, two views, rounding, allergy marks (online only) |  |
| Cook mode with checkmarks by ingredient line, timers with end times, finish that logs the batch |  |
| In-app reminders; nightly backup copy |  |

**Gate:** I cooked dinner from the app on 5 nights in one week, and the home screen was right each evening.

### Slice 1b: make it reliable (weeks 6 to 9)

| Build | Notes |
| --- | --- |
| Batches with keep-until dates and warnings; leftovers and freezer meals as plannable stock items with dates | The minimal use-first list |
| Rule-based suggestions with reasons |  |
| Offline cook mode and shopping list: change queue, phone-generated IDs, replay |  |
| Manual entry with the line parser; drag to reorder |  |
| Litestream streaming backup; full export from inside the app |  |
| Privacy tests: a second account cannot read private records |  |

**Gate:** two weeks in which the plan was never stale, and a tick made with no signal synced correctly.

### Slice 2: stock and waste (weeks 10 to 14)

| Build | Notes |
| --- | --- |
| Perishables with dates and use-first; pantry as have, low, out | Stock tab appears |
| Optional amounts and the slider; shopping check-off and cooking update stock | Unit conversions in use |
| Used-up and threw-away record; waste number on the home screen; freeze suggestions |  |
| Phone push for all reminders, grouped, with quiet hours; timer pushes |  |
| Website link import; Saved section with batch export |  |
| Prep-day cook mode; storage notes on the ingredient table and the coming-home checklist; busy days and the prep list |  |

**Gate:** the waste record has run for two weeks, and at least one expiry push led to the item being used.

### Slice 3: friends (weeks 15 to 18)

| Build | Notes |
| --- | --- |
| Invite links to the group, first-run screen for friends with iPhone install steps (Share, Add to Home Screen) and a push-permission prompt | Ask friends the browse-or-plan question first. Test the whole flow on an iPhone before inviting anyone |
| Sharing per recipe with the never-share flag, comments, variants |  |
| Weekly conversion script run outside the app |  |
| Per-person export and account deletion |  |
| Custom lists, private first |  |
| Households: join two accounts into one shared stock, plan and shopping list; allergy checks across members | Needed for married friends; the data model has carried households since 1a |

**Gate:** two friends on iPhones installed the app, imported their own recipes, and one cooked from a recipe I shared.

### Slice 4: later

- **Cook together.** Two households plan a shared prep: each cooks one or two large batches (one marinates and grills the meat, the other preps vegetables and a sauce) and they swap half. A shared plan entry links the batches, the shopping list splits by who cooks what, and handing over servings moves them from one household's stock to the other's with the keep-until date intact. Greek bowls all week for both.
- Automatic plan drafting with the batch-run pattern
- Brand and product ratings on stock items, shown on the shopping list
- Calorie estimates from a public nutrition database
- Price notes per item, if ever wanted

### Working rhythm

- One feature at a time, each merged with its tests, each used for real before the next.
- A short note at the end of every week: what was cooked, what the app got wrong, what to change. These notes feed the next slice's plan.
- The build plan is revised at each gate, not between.

## Edge cases and decisions

Decided on 26 Oct 2026. Each row is a rule the app follows; the slice column says where it first applies.

| Case | Decision | Slice |
| --- | --- | --- |
| Leftovers pass their keep-until date | The app never marks anything thrown away on its own. It keeps the item visible with a freshness colour: green is fine, yellow is old but edible and should be eaten today, red is past its date. Only I say "threw away" or "used up" | 1b |
| "Did you have it?" when I ate more or less | The prompt comes pre-filled with the planned servings. One tap on Yes confirms them; the number can be edited first, and the batch's remaining servings follow | 1a |
| "Not this" picks a recipe that uses another planned meal's ingredients | Allowed, with a warning naming the meal that will be short ("Thursday's stir-fry will be missing the peppers"). I can say that's fine; the shopping list then picks up the shortfall | 1b |
| A suggested swap is on someone's never-list | Try the next swap in the recipe or the general swap table. No safe swap left means the ingredient is treated as essential for that person | 1a |
| A friend eats servings from my batch | It's my food, so it comes off my plan and my stock. Their plan can record "ate at Susmitha's" without touching my records | 4 (data model allows it from 1a) |
| An import looks like a recipe I already have | Keep both. The review screen says "looks like your Snickerdoodles" with a one-tap "replace mine" for when I do want to swap | 1a |
| The same item is changed on two devices while one is offline | The later change wins, field by field, so a tick from the phone and a quantity from the laptop both survive. The item shows a small "updated from your laptop" note for a day. No conflict questions | 1b |
| I have almost enough of something | Each ingredient line has an amount rule: exact (eggs in a cake), flexible (spinach in pasta, fine with about half), or stretchable (broth or oat milk, top up with water or another milk). Defaults come from the ingredient's category and the recipe line can override them. A recipe stays an option when I'm short on a flexible or stretchable line; the suggestion says so ("you have about 2/3 of the spinach, fine" or "short 100 ml oat milk, top up with water"). Only an exact line that's short puts the item on the shopping list | Template in 1a, used from 2 |
| I'm missing something I can grab in minutes | Each person keeps a personal "quick to get" list: ingredients the shop next door always has (my bodega: milk, eggs, bread, limes). A recipe missing only quick items stays an option, ranked just below fully-in-stock ones, with the note "grab eggs downstairs". The shopping list puts them in their own "quick" group instead of the big shop. The list grows itself: ticking a shopping item as bought at the corner shop offers to add it | 1b |

## Open questions

- Friends: answered. They'd use it as a full cooking app, keep each other's favourite recipes, and often cook or eat together. Slice 3 is built for that, and cook-together is the first slice 4 item.
- Shelf-life table: pick a source: seed from the USDA FoodKeeper dataset (public domain, JSON download at https://catalog.data.gov/dataset/fsis-foodkeeper-data, last updated January 2025), which gives pantry, fridge and freezer ranges per food, including after opening and after cooking. Use the low end of each range as the default. Cross-check cooked leftovers and meat against the FDA cold storage chart (https://www.fda.gov/media/74435/download) and foodsafety.gov. Map FoodKeeper's food names to the canonical table once, during seeding.
- Starter ingredient list: a few hundred common items to seed; grow from the test recipes. Sources: the names and categories come from the FoodKeeper dataset (same file as shelf life, so the two line up); grams per piece and later nutrition come from USDA FoodData Central's SR Legacy and Foundation Foods downloads (public domain, CSV, at https://fdc.nal.usda.gov/download-datasets), whose portion tables say what "1 medium onion" weighs; store sections and aliases are written by hand from the test recipes, since no public list matches your shops or your friends' names for things.
- Served-as defaults: which ingredients count as raw unless a step cooks them? Settled: all of them. An ingredient is raw unless a step that uses it has a heat word (bake, boil, simmer, fry, roast, grill, sauté, braise, poach, steam, microwave), or it was bought cooked, canned or dried. Served-as is never shown on the recipe; it appears only inside an allergy warning. A never-list entry is an ingredient or group plus an optional served-as, so "raw fruit" is one entry and "chickpeas, any state" is another.
- Serving size: a recipe's "serves 4" is taken as four of my servings for now. Settled: the finish step in cook mode shows the recipe's servings as an editable number, not a question; I change it only if the batch came out different, and the correction saves to the recipe so the next batch, its scaling and its shopping list use the real yield.
- Pinterest export: does it include saved pins as links? Settled by viability test 8.
- Push on friends' iPhones: iOS supports it only once the app is on the home screen, so the slice 3 first-run screen should say so.
- Weekly script cost and screenshot limits per person: settle when planning slice 3.
