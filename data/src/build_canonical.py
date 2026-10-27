"""Build data/canonical-ingredients.csv and data/swap-groups.csv from data/src/canonical.txt.

Shelf life comes from data/foodkeeper-shelf-life.csv by foodkeeper_id. Run from the repo root:
    python3 data/src/build_canonical.py
"""
import csv, sys, pathlib

root = pathlib.Path(__file__).resolve().parents[2]
fk = {r["foodkeeper_id"]: r for r in csv.DictReader(open(root / "data/foodkeeper-shelf-life.csv", encoding="utf-8"))}

def days(r, key):
    """Prefer the max of a range; fall back to min."""
    v = r.get(f"{key}_max") or r.get(f"{key}_min")
    return v or ""

rows, groups, seen, canonicals, errors = [], {}, {}, set(), []
for ln in open(root / "data/src/canonical.txt", encoding="utf-8"):
    ln = ln.strip()
    if not ln or ln.startswith("#"):
        continue
    parts = [p.strip() for p in ln.split("|")]
    while len(parts) < 7:
        parts.append("")
    name, aliases, category, section, fkid, grams, grp = parts[:7]
    if name in canonicals:
        errors.append(f"duplicate canonical: {name}")
    canonicals.add(name)
    for a in [x.strip() for x in aliases.split(";") if x.strip()]:
        if a in seen and seen[a] != name:
            errors.append(f"alias '{a}' on {name} also used by {seen[a]}")
        seen[a] = name
    f = fk.get(fkid, {})
    rows.append({
        "canonical": name,
        "aliases": aliases,
        "category": category,
        "store_section": section,
        "groups": grp,
        "grams_per_piece": grams,
        "pantry_days": days(f, "pantry_days"),
        "fridge_days": days(f, "fridge_days"),
        "fridge_after_opening_days": days(f, "fridge_after_opening"),
        "freezer_days": days(f, "freezer_days"),
        "foodkeeper_id": fkid,
        "foodkeeper_name": (f.get("name", "") + (" - " + f["subtitle"] if f.get("subtitle") else "")) if f else "",
    })
    for g in [x.strip() for x in grp.split(";") if x.strip()]:
        groups.setdefault(g, []).append(name)

for n in canonicals:
    if n in seen and seen[n] != n:
        errors.append(f"'{n}' is both a canonical and an alias of {seen[n]}")
if errors:
    sys.exit("\n".join(errors))
with open(root / "data/canonical-ingredients.csv", "w", newline="", encoding="utf-8") as out:
    w = csv.DictWriter(out, fieldnames=list(rows[0].keys()), lineterminator="\n")
    w.writeheader(); w.writerows(rows)
with open(root / "data/swap-groups.csv", "w", newline="", encoding="utf-8") as out:
    w = csv.writer(out, lineterminator="\n"); w.writerow(["group", "member"])
    for g in sorted(groups):
        for m in groups[g]:
            w.writerow([g, m])
missing = [r["canonical"] for r in rows if r["foodkeeper_id"] and r["foodkeeper_id"] not in fk]
print(f"{len(rows)} canonical ingredients, {len(groups)} groups; unknown foodkeeper ids: {missing}")
