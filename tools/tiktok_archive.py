"""Read a myfaveTT TikTok archive (data/.appdata/db_*.js) and list recipe-like captions.

Usage: python3 tools/tiktok_archive.py <archive folder> [out.csv] [video_id ...]
With video ids, prints those captions in full instead of writing the CSV.
"""
import base64, collections, csv, gzip, json, re, sys, pathlib

def load(path):
    s = path.read_text(encoding="utf-8")
    return json.loads(gzip.decompress(base64.b64decode(s[s.index('"') + 1 : s.rindex('"')])))

KW = re.compile(r"\b(recipe|ingredients?|cups?|tbsp|tsp|tablespoons?|teaspoons?|oz|grams?|\d+\s?g\b|bake|roast|saut|simmer|marinat|meal ?prep|dinner|lunch|breakfast|dessert|cook|chicken|rice|pasta|salad|soup|sauce|dumpling|curry|dal|biryani|tofu|protein|snack|air ?fryer|oven|easy|healthy)", re.I)

def main():
    root = pathlib.Path(sys.argv[1]) / "data/.appdata"
    texts, videos, book = load(root / "db_texts.js"), load(root / "db_videos.js"), load(root / "db_bookmarked.js")
    authors = json.loads((root / "facts.json").read_text(encoding="utf-8")).get("authors", {})
    fav = set(v for v in book.values() if isinstance(v, list) for v in v)
    def handle(vid):
        a = authors.get(str(videos.get(vid, {}).get("authorId")), {})
        return (a.get("uniqueIds") or [""])[0]
    ids = sys.argv[3:]
    if ids:
        for vid in ids:
            print(f"=== {vid} @{handle(vid)} https://www.tiktok.com/@{handle(vid)}/video/{vid}\n{texts.get(vid)}\n")
        return
    rows = []
    for vid, cap in texts.items():
        if not KW.search(cap or ""):
            continue
        rows.append({"video_id": vid, "in_favorites": vid in fav, "keyword_hits": len(set(m.lower() for m in KW.findall(cap))),
                     "author": handle(vid), "caption": (cap or "").replace("\n", " ")[:300],
                     "url": f"https://www.tiktok.com/@{handle(vid) or '_'}/video/{vid}"})
    rows.sort(key=lambda r: (-r["in_favorites"], -r["keyword_hits"]))
    out = sys.argv[2] if len(sys.argv) > 2 else "tiktok-recipe-candidates.csv"
    with open(out, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
    print(f"{len(texts)} captions, {len(rows)} recipe-like, {sum(r['in_favorites'] for r in rows)} in favorites -> {out}")

main()
