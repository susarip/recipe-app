"""Viability test 4: match every canonical name used in test-recipes/ against data/canonical-ingredients.csv.
Run from the repo root: python3 data/src/match_test.py [files...]"""
import csv, glob, json, sys
files = sys.argv[1:] or sorted(glob.glob("test-recipes/*.json"))
names = {}
for f in files:
    for r in json.load(open(f, encoding="utf-8"))["recipes"]:
        for i in r["ingredients"]:
            if not i.get("recipeRef"):
                names.setdefault(i["canonical"].lower(), set()).add(f)
canon = {}
for row in csv.DictReader(open("data/canonical-ingredients.csv", encoding="utf-8")):
    canon[row["canonical"].lower()] = row["canonical"]
    for a in row["aliases"].split(";"):
        if a.strip():
            canon[a.strip().lower()] = row["canonical"]
ok, miss = [], []
for n in sorted(names):
    m = canon.get(n) or canon.get(n + "s") or canon.get(n.rstrip("s"))
    (ok if m else miss).append((n, m))
print(f"{len(names)} distinct ingredients, {len(ok)} matched = {100 * len(ok) // max(len(names), 1)}% (pass mark 85%)")
for n, _ in miss:
    print("  unmatched:", n, sorted(names[n]))
for n, m in ok:
    if n != m.lower():
        print(f"  alias: {n} -> {m} (use the canonical name in the JSON)")
