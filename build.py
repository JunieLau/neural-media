#!/usr/bin/env python3
"""Build the self-contained site: data/neural-media.json + src/* -> three pages

Pages: index.html (identical copy: Neural-Media.html) = hero, concept, timeline, video, reading;
       who-else.html = landscape (who else works on neural media);
       bci.html = BCI x Neural Media, with the Phase Lock feature chapter.

Usage:  python3 build.py            (stdlib only)
        python3 build.py --today    (also set meta.last_updated to today's date, UTC+8)

Each page inlines its CSS, JS and the part of the JSON data it needs (thumbnails
as base64), so every page opens directly from disk with no server and no network.
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


SUBNAV = {  # in-page section bar (sticky under the header) for each page
    "home": [("concept", "Concept", "概念"), ("updates", "Timeline", "时间线"), ("video", "Video", "视频"), ("reading", "Reading", "阅读")],
    "who-else": [("g-people", "Scholars & artists", "学者与艺术家"), ("g-institutions", "Institutions", "机构与项目"),
                 ("g-meanings", "Different meanings", "同名异义")],
    "bci": [("phase-lock", "Phase Lock", "《Phase Lock》专题"), ("primer", "Primer", "入门"), ("theory", "Theory", "理论"),
            ("news", "News", "新闻")],
}
PAGES = {  # key -> (output files, sections in <main>, data keys kept, title)
    "home": (["Neural-Media.html", "index.html"],
             '  <section class="hero wrap" id="hero"></section>\n' + "".join(
                 f'  <section class="wrap block" id="{s}"></section>\n' for s in ("concept", "updates", "video", "reading")),
             ("meta", "types", "hero", "concept", "featured", "items", "reading"),
             "Neural Media · 神经媒体 | K Allado-McDowell tracker"),
    "who-else": (["who-else.html"], '  <section class="wrap block page-first" id="landscape"></section>\n',
                 ("meta", "types", "landscape"),
                 "Who else works on neural media · 其他研究者与机构 | Neural Media"),
    "bci": (["bci.html"], '  <section class="wrap block page-first" id="bci"></section>\n',
            ("meta", "types", "bci"),
            "BCI × Neural Media · 脑机接口与神经媒体 | Neural Media"),
}


def validate_pages(d):
    errs = []
    keys = [p.get("key") for p in d.get("pages", [])]
    if keys != list(PAGES):
        errs.append(f"pages must list {list(PAGES)} in order, got {keys}")
    files = {p["file"] for p in d.get("pages", [])} | {"Neural-Media.html"}
    for p in d.get("pages", []):
        if not (p.get("label", {}).get("en") and p.get("label", {}).get("zh")):
            errs.append(f"page {p.get('key')}: label needs both en and zh")
    def chk(href, where):
        f = href.split("#")[0]
        if f and f not in files:
            errs.append(f"{where}: internal link to unknown page '{href}'")
        anchor = href.split("#")[1] if "#" in href else ""
        known = {a for v in SUBNAV.values() for a, _, _ in v} | {"landscape", "bci", "top"}
        if anchor and anchor not in known:
            errs.append(f"{where}: unknown anchor '#{anchor}'")
    for it in d["items"]:
        if "internal" in it:
            chk(it["internal"].get("href", ""), f"item {it['id']}")
            if not (it["internal"].get("label", {}).get("en") and it["internal"].get("label", {}).get("zh")):
                errs.append(f"item {it['id']}: internal label needs both en and zh")
    for e in d.get("bci", {}).get("theory", {}).get("entries", []):
        if "internal" in e:
            chk(e["internal"].get("href", ""), f"theory {e['name']['en']}")
    F = d.get("bci", {}).get("feature")
    if F:
        def bil(o, w):
            if not (isinstance(o, dict) and o.get("en") and o.get("zh")):
                errs.append(f"feature {w}: needs both en and zh")
        def https(u, w):
            if not str(u or "").startswith("https://"):
                errs.append(f"feature {w}: url must be https")
        for k in ("kicker", "subtitle", "byline", "note"):
            bil(F.get(k), k)
        bil(F["definition"].get("quote"), "definition.quote"); bil(F["definition"].get("note"), "definition.note")
        for n, c in enumerate(F.get("cta", [])):
            https(c.get("url"), f"cta {n}"); bil(c.get("label"), f"cta {n} label")
        bil(F["author"].get("title"), "author.title"); bil(F["author"].get("text"), "author.text")
        for l in F["author"].get("links", []):
            https(l.get("url"), "author link"); bil(l.get("label"), "author link label")
        bil(F["argument"].get("title"), "argument.title")
        for n, pt in enumerate(F["argument"].get("points", [])):
            bil(pt.get("term"), f"point {n} term"); bil(pt.get("text"), f"point {n} text")
            if "quote" in pt:
                bil(pt["quote"], f"point {n} quote")
        bil(F["structure"].get("title"), "structure.title"); bil(F["structure"].get("intro"), "structure.intro")
        for pt in F["structure"].get("parts", []):
            for k in ("name", "question", "text"):
                bil(pt.get(k), f"part {pt.get('num')} {k}")
            https(pt.get("url"), f"part {pt.get('num')}")
            for s in pt.get("sections", []):
                bil(s, f"part {pt.get('num')} section")
        bil(F["versions"].get("title"), "versions.title")
        for v in F["versions"].get("entries", []):
            try:
                datetime.date.fromisoformat(v.get("date", ""))
            except Exception:
                errs.append(f"feature version {v.get('label')}: date must be YYYY-MM-DD")
            bil(v.get("text"), f"version {v.get('label')}")
            if not isinstance(v.get("label"), str):
                bil(v.get("label"), "version label")
        https(F["versions"]["source"].get("url"), "versions.source")
        bil(F["chain"].get("title"), "chain.title"); bil(F["chain"].get("note"), "chain.note")
        for s in F["chain"].get("steps", []):
            bil(s.get("date"), f"chain {s.get('who')} date"); bil(s.get("what"), f"chain {s.get('who')} what")
            https(s.get("url"), f"chain {s.get('who')}")
    if errs:
        sys.exit("Data errors:\n  " + "\n  ".join(errs))


def nav_html(d, key):
    out = []
    for p in d["pages"]:
        href = "#top" if p["key"] == key else p["file"]
        cur = ' aria-current="page"' if p["key"] == key else ""
        out.append(f'<a href="{href}" data-internal{cur}><span class="t en">{p["label"]["en"]}</span>'
                   f'<span class="t zh">{p["label"]["zh"]}</span></a>')
    return "".join(out)


def subnav_html(key):
    links = "".join(f'<a href="#{a}" data-spy="{a}"><span class="t en">{en}</span><span class="t zh">{zh}</span></a>'
                    for a, en, zh in SUBNAV[key])
    return ('<nav class="subnav" aria-label="On this page · 本页导航"><div class="wrap subnav-in">'
            '<span class="sublabel"><span class="t en">On this page</span><span class="t zh">本页</span></span>' + links + '</div></nav>')


def main():
    d = json.loads(DATA.read_text(encoding="utf-8"))
    if "--today" in sys.argv:
        d["meta"]["last_updated"] = datetime.datetime.now(TZ).date().isoformat()
        DATA.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    validate(d)
    validate_pages(d)
    keys = [g["key"] for g in d.get("landscape", {}).get("groups", [])]
    for a, _, _ in SUBNAV["who-else"]:
        if a[2:] not in keys:
            sys.exit(f"Data errors:\n  who-else in-page bar points to missing landscape group '{a[2:]}'")
    d["items"].sort(key=lambda i: i["date"], reverse=True)
    # inline images
    d["featured"]["thumbnail"] = data_uri(d["featured"]["thumbnail"])
    for it in d["items"]:
        if it.get("thumbnail"):
            it["thumbnail"] = data_uri(it["thumbnail"])
    tpl = (HERE / "src" / "template.html").read_text(encoding="utf-8")
    css = (HERE / "src" / "styles.css").read_text(encoding="utf-8")
    js = (HERE / "src" / "app.js").read_text(encoding="utf-8")
    report = []
    for key, (files, main_html, keep, title) in PAGES.items():
        sub = {k: d[k] for k in keep if k in d}
        sub["pages"] = d["pages"]
        blob = json.dumps(sub, ensure_ascii=False).replace("</", "<\\/")
        html = (tpl.replace("<!--__TITLE__-->", title)
                   .replace("<!--__PAGE__-->", key)
                   .replace("<!--__HOME__-->", "#top" if key == "home" else "index.html")
                   .replace("<!--__NAV__-->", nav_html(d, key))
                   .replace("<!--__SUBNAV__-->", subnav_html(key) if SUBNAV.get(key) else "")
                   .replace("<!--__MAIN__-->", main_html.rstrip("\n"))
                   .replace("/*__CSS__*/", css)
                   .replace("/*__DATA__*/null", blob)
                   .replace("/*__JS__*/", js))
        for f in files:
            (HERE / f).write_text(html, encoding="utf-8")
        report.append(f"{' = '.join(files)} ({len(html)//1024} KB)")
    counts = {}
    for it in d["items"]:
        for t in it["types"]:
            counts[t] = counts.get(t, 0) + 1
    print("Built " + "; ".join(report))
    print(f"{len(d['items'])} items; by type: {counts}; last_updated {d['meta']['last_updated']} (UTC+8)")


if __name__ == "__main__":
    main()
