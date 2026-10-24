#!/usr/bin/env python3
"""Build the self-contained site: data/neural-media.json + src/* -> index.html

Usage:  python3 build.py            (stdlib only)
        python3 build.py --today    (also set meta.last_updated to today's date, UTC+8)

Everything is inlined into Neural-Media.html (CSS, JS, JSON data and thumbnails
as base64), so it opens directly from disk with no server and no network.
index.html is written as an identical copy for local preview convenience.
"""
import base64, datetime, json, mimetypes, pathlib, sys

HERE = pathlib.Path(__file__).resolve().parent
DATA = HERE / "data" / "neural-media.json"
TZ = datetime.timezone(datetime.timedelta(hours=8))
REQUIRED = ("id", "date", "types", "date_display", "title", "summary", "url", "source")


def data_uri(rel):
    p = HERE / rel
    mime = mimetypes.guess_type(p.name)[0] or "application/octet-stream"
    return f"data:{mime};base64," + base64.b64encode(p.read_bytes()).decode()


def validate(d):
    errs, ids = [], set()
    for n, it in enumerate(d["items"]):
        for k in REQUIRED:
            if k not in it:
                errs.append(f"item {n} ({it.get('id')}): missing '{k}'")
        for k in ("date_display", "title", "summary", "source"):
            v = it.get(k, {})
            if not (isinstance(v, dict) and v.get("en") and v.get("zh")):
                errs.append(f"item {it.get('id')}: '{k}' needs both en and zh")
        for t in it.get("types", []):
            if t not in d["types"]:
                errs.append(f"item {it.get('id')}: unknown type '{t}'")
        if it.get("id") in ids:
            errs.append(f"duplicate id {it.get('id')}")
        ids.add(it.get("id"))
        try:
            datetime.date.fromisoformat(it["date"])
        except Exception:
            errs.append(f"item {it.get('id')}: date must be YYYY-MM-DD")
        if not str(it.get("url", "")).startswith("https://"):
            errs.append(f"item {it.get('id')}: url must be https")
    for rid in d.get("reading", []):
        if rid not in ids:
            errs.append(f"reading list refers to unknown id {rid}")
    L = d.get("landscape")
    if L:
        for k in ("title", "lead"):
            if not (L.get(k, {}).get("en") and L.get(k, {}).get("zh")):
                errs.append(f"landscape.{k} needs both en and zh")
        for g in L.get("groups", []):
            for k in ("title",) + (("note",) if "note" in g else ()):
                if not (g.get(k, {}).get("en") and g.get(k, {}).get("zh")):
                    errs.append(f"landscape group {g.get('key')}: '{k}' needs both en and zh")
            for e in g.get("entries", []):
                nm = e.get("name", {}).get("en")
                for k in ("name", "line"):
                    if not (e.get(k, {}).get("en") and e.get(k, {}).get("zh")):
                        errs.append(f"landscape entry {nm}: '{k}' needs both en and zh")
                if not str(e.get("url", "")).startswith("https://"):
                    errs.append(f"landscape entry {nm}: url must be https")
                for m in e.get("marks", []):
                    if m not in L.get("markers", {}):
                        errs.append(f"landscape entry {nm}: unknown marker '{m}'")
    B = d.get("bci")
    if B:
        def bil(o, where):
            if not (isinstance(o, dict) and o.get("en") and o.get("zh")):
                errs.append(f"bci {where}: needs both en and zh")
        def https(u, where):
            if not str(u or "").startswith("https://"):
                errs.append(f"bci {where}: url must be https")
        def marks(ms, where):
            for m in ms or []:
                if m not in B.get("markers", {}):
                    errs.append(f"bci {where}: unknown marker '{m}'")
        for k in ("title", "lead") + (("note",) if "note" in B else ()):
            bil(B.get(k), k)
        for mk, mv in B.get("markers", {}).items():
            bil(mv, f"marker {mk}")
        for part in ("primer", "theory", "news"):
            if part not in B:
                errs.append(f"bci: missing '{part}'")
            else:
                bil(B[part].get("title"), f"{part}.title")
        for n, c in enumerate(B.get("primer", {}).get("cards", [])):
            bil(c.get("term"), f"primer card {n} term"); bil(c.get("text"), f"primer card {n} text")
            if "url" in c:
                https(c["url"], f"primer card {n}")
        for e in B.get("theory", {}).get("entries", []):
            nm = (e.get("name") or {}).get("en")
            for k in ("name", "source", "line"):
                bil(e.get(k), f"theory '{nm}' {k}")
            https(e.get("url"), f"theory '{nm}'"); marks(e.get("marks"), f"theory '{nm}'")
            for l in e.get("links", []):
                https(l.get("url"), f"theory '{nm}' link"); bil(l.get("label"), f"theory '{nm}' link label")
        for e in B.get("news", {}).get("entries", []):
            nm = (e.get("title") or {}).get("en")
            for k in ("date_display", "title", "line"):
                bil(e.get(k), f"news '{nm}' {k}")
            try:
                datetime.date.fromisoformat(e.get("date", ""))
            except Exception:
                errs.append(f"bci news '{nm}': date must be YYYY-MM-DD")
            https(e.get("url"), f"news '{nm}'"); marks(e.get("marks"), f"news '{nm}'")
    for it in d["items"]:
        for l in it.get("links", []):
            if not str(l.get("url", "")).startswith("https://"):
                errs.append(f"item {it.get('id')}: link url must be https")
    if errs:
        sys.exit("Data errors:\n  " + "\n  ".join(errs))


def main():
    d = json.loads(DATA.read_text(encoding="utf-8"))
    if "--today" in sys.argv:
        d["meta"]["last_updated"] = datetime.datetime.now(TZ).date().isoformat()
        DATA.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    validate(d)
    d["items"].sort(key=lambda i: i["date"], reverse=True)
    # inline images
    d["featured"]["thumbnail"] = data_uri(d["featured"]["thumbnail"])
    for it in d["items"]:
        if it.get("thumbnail"):
            it["thumbnail"] = data_uri(it["thumbnail"])
    blob = json.dumps(d, ensure_ascii=False).replace("</", "<\\/")
    html = (HERE / "src" / "template.html").read_text(encoding="utf-8")
    html = html.replace("/*__CSS__*/", (HERE / "src" / "styles.css").read_text(encoding="utf-8"))
    html = html.replace("/*__DATA__*/null", blob)
    html = html.replace("/*__JS__*/", (HERE / "src" / "app.js").read_text(encoding="utf-8"))
    out = HERE / "Neural-Media.html"
    out.write_text(html, encoding="utf-8")
    (HERE / "index.html").write_text(html, encoding="utf-8")  # identical copy
    counts = {}
    for it in d["items"]:
        for t in it["types"]:
            counts[t] = counts.get(t, 0) + 1
    print(f"Built Neural-Media.html ({len(html)//1024} KB): {len(d['items'])} items; by type: {counts}; last_updated {d['meta']['last_updated']} (UTC+8)")


if __name__ == "__main__":
    main()
