#!/usr/bin/env python3
"""Build the self-contained site: data/neural-media.json + data/new-models.json + data/felstead-leung.json + src/* -> five pages

Pages: index.html (identical copy: Neural-Media.html) = hero, concept, timeline, video, reading;
       who-else.html = landscape (who else works on neural media);
       bci.html = BCI x Neural Media, with the Phase Lock feature chapter;
       new-models.html = New Models / Lil Internet / Caroline Busta: overview, ideas, K link, full archive;
       felstead-leung.html = Daniel Felstead & Jenn Leung: overview, ideas, K link, full archive.

Usage:  python3 build.py            (stdlib only)
        python3 build.py --today    (also set meta.last_updated to today's date, UTC+8)

Each page inlines its CSS, JS and the part of the JSON data it needs (thumbnails
as base64), so every page opens directly from disk with no server and no network.
"""
import base64, datetime, json, mimetypes, pathlib, sys

HERE = pathlib.Path(__file__).resolve().parent
DATA = HERE / "data" / "neural-media.json"
NMDATA = HERE / "data" / "new-models.json"
FLDATA = HERE / "data" / "felstead-leung.json"
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


def validate_nm(N, name="new-models"):
    """Checks for an archive page's data (data/new-models.json, data/felstead-leung.json)."""
    errs = []
    def bil(o, w):
        if not (isinstance(o, dict) and str(o.get("en", "")).strip() and str(o.get("zh", "")).strip()):
            errs.append(f"{name} {w}: needs both en and zh")
    def https(u, w):
        if not str(u or "").startswith("https://"):
            errs.append(f"{name} {w}: url must be https")
    for k in ("title", "lead", "note"):
        bil(N.get(k), k)
    for n, pp in enumerate(N.get("people", [])):
        bil(pp.get("role"), f"person {n} role"); bil(pp.get("text"), f"person {n} text")
        for l in pp.get("links", []):
            https(l.get("url"), f"person {n} link"); bil(l.get("label"), f"person {n} link label")
    for n, ev in enumerate(N.get("evolution", [])):
        bil(ev.get("text"), f"evolution {n}")
    for n, idea in enumerate(N.get("ideas", [])):
        bil(idea.get("term"), f"idea {n} term"); bil(idea.get("text"), f"idea {n} text")
    R = N.get("relation", {})
    bil(R.get("summary"), "relation.summary")
    for part in ("direct", "thematic"):
        if not R.get(part):
            errs.append(f"{name} relation.{part} is empty")
        for n, r in enumerate(R.get(part, [])):
            bil(r.get("text"), f"relation {part} {n}")
            if "url" in r:
                https(r["url"], f"relation {part} {n}")
            if "when" in r:
                bil(r["when"], f"relation {part} {n} when")
    W = N.get("who")
    if W is not None:
        for k, v in W.items():
            bil(v, f"who.{k}")
    for grp in ("formats", "basis", "access"):
        for k, v in N.get(grp, {}).items():
            bil(v, f"{grp}.{k}")
    ids, prev = set(), None
    for n, e in enumerate(N.get("entries", [])):
        w = f"entry {e.get('id', n)}"
        for k in ("id", "date", "fmt", "basis", "access", "title", "summary", "url"):
            if k not in e:
                errs.append(f"{name} {w}: missing '{k}'")
        bil(e.get("title"), f"{w} title"); bil(e.get("summary"), f"{w} summary")
        if "date_display" in e:
            bil(e["date_display"], f"{w} date_display")
        if e.get("nm") is not None:
            bil(e["nm"], f"{w} neural-media note")
        if e.get("fmt") not in N.get("formats", {}):
            errs.append(f"{name} {w}: unknown format '{e.get('fmt')}'")
        if e.get("basis") not in N.get("basis", {}):
            errs.append(f"{name} {w}: unknown basis '{e.get('basis')}'")
        if e.get("access") not in N.get("access", {}):
            errs.append(f"{name} {w}: unknown access '{e.get('access')}'")
        https(e.get("url"), w)
        if W is not None and e.get("who") not in W:
            errs.append(f"{name} {w}: unknown person '{e.get('who')}' (use one of {list(W)})")
        for l in e.get("internal", []):
            bil(l.get("label"), f"{w} internal label")
        for l in e.get("links", []):
            https(l.get("url"), f"{w} link"); bil(l.get("label"), f"{w} link label")
        if e.get("id") in ids:
            errs.append(f"{name} duplicate id {e.get('id')}")
        ids.add(e.get("id"))
        try:
            datetime.date.fromisoformat(e.get("date", ""))
        except Exception:
            errs.append(f"{name} {w}: date must be YYYY-MM-DD")
        if prev and e.get("date", "") > prev:
            errs.append(f"{name} {w}: entries must be ordered newest to oldest ({e.get('date')} after {prev})")
        prev = e.get("date", prev)
        zl = len(e.get("summary", {}).get("zh", ""))
        if zl < 40:
            errs.append(f"{name} {w}: Chinese summary too short ({zl} chars) - write what the episode discusses")
    if errs:
        sys.exit("Data errors:\n  " + "\n  ".join(errs))


def nm_years(N):
    return sorted({e["date"][:4] for e in N.get("entries", [])}, reverse=True)


SUBNAV = {  # in-page section bar (sticky under the header) for each page
    "home": [("concept", "Concept", "概念"), ("updates", "Timeline", "时间线"), ("video", "Video", "视频"), ("reading", "Reading", "阅读")],
    "who-else": [("g-people", "Scholars & artists", "学者与艺术家"), ("g-institutions", "Institutions", "机构与项目"),
                 ("g-meanings", "Different meanings", "同名异义")],
    "bci": [("phase-lock", "Phase Lock", "《Phase Lock》专题"), ("primer", "Primer", "入门"), ("theory", "Theory", "理论"),
            ("news", "News", "新闻")],
    # "new-models": filled in main(): overview sections + one link per year of the archive
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
    "new-models": (["new-models.html"], '  <section class="wrap block page-first" id="newmodels"></section>\n',
                   ("meta", "types", "newmodels"),
                   "New Models & Lil Internet · New Models 与 Lil Internet | Neural Media"),
    "felstead-leung": (["felstead-leung.html"], '  <section class="wrap block page-first" id="felsteadleung"></section>\n',
                       ("meta", "types", "felsteadleung"),
                       "Daniel Felstead & Jenn Leung · Felstead 与 Leung | Neural Media"),
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
        known = ({a for v in SUBNAV.values() for a, _, _ in v} | {"landscape", "bci", "top", "newmodels", "felsteadleung"}
                 | {"e-" + e["id"] for k in ("newmodels", "felsteadleung") for e in d.get(k, {}).get("entries", [])}
                 | {"i-" + it["id"] for it in d["items"]})
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
    for g in d.get("landscape", {}).get("groups", []):
        for e in g.get("entries", []):
            if "internal" in e:
                chk(e["internal"].get("href", ""), f"landscape {e['name']['en']}")
                if not (e["internal"].get("label", {}).get("en") and e["internal"].get("label", {}).get("zh")):
                    errs.append(f"landscape {e['name']['en']}: internal label needs both en and zh")
    for k in ("newmodels", "felsteadleung"):
        for e in d.get(k, {}).get("entries", []):
            for l in e.get("internal", []):
                chk(l.get("href", ""), f"{k} entry {e['id']}")
        for part in ("direct", "thematic"):
            for r in d.get(k, {}).get("relation", {}).get(part, []):
                if "internal" in r:
                    chk(r["internal"], f"{k} relation")
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
    d["newmodels"] = json.loads(NMDATA.read_text(encoding="utf-8"))
    d["felsteadleung"] = json.loads(FLDATA.read_text(encoding="utf-8"))
    validate(d)
    validate_nm(d["newmodels"])
    validate_nm(d["felsteadleung"], "felstead-leung")
    SUBNAV["new-models"] = ([("nm-about", "Who", "是谁"), ("nm-ideas", "Ideas", "核心观点"), ("nm-k", "K & neural media", "与 K 的关系"),
                             ("nm-archive", "Archive", "全部节目")]
                            + [(f"y{y}", y, y) for y in nm_years(d["newmodels"])])
    SUBNAV["felstead-leung"] = ([("fl-about", "Who", "是谁"), ("fl-ideas", "Ideas", "核心观点"), ("fl-k", "K & neural media", "与 K 的关系"),
                                 ("fl-archive", "Archive", "全部作品")]
                                + [(f"y{y}", y, y) for y in nm_years(d["felsteadleung"])])
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
    E = d["newmodels"]["entries"]
    by_year, by_fmt, by_basis = {}, {}, {}
    for e in E:
        by_year[e["date"][:4]] = by_year.get(e["date"][:4], 0) + 1
        by_fmt[e["fmt"]] = by_fmt.get(e["fmt"], 0) + 1
        by_basis[e["basis"]] = by_basis.get(e["basis"], 0) + 1
    print(f"new-models: {len(E)} entries; flagged neural media/future media: {sum(1 for e in E if e.get('nm'))}")
    print(f"  by year: {dict(sorted(by_year.items(), reverse=True))}")
    print(f"  by format: {by_fmt}")
    print(f"  by basis: {by_basis}")
    F = d["felsteadleung"]["entries"]
    cnt = lambda key: dict(sorted(((k, sum(1 for e in F if key(e) == k)) for k in {key(e) for e in F}), key=lambda x: -x[1]))
    print(f"felstead-leung: {len(F)} entries; flagged neural media/future media: {sum(1 for e in F if e.get('nm'))}")
    print(f"  by person: {cnt(lambda e: e['who'])}")
    print(f"  by year: {dict(sorted(cnt(lambda e: e['date'][:4]).items(), reverse=True))}")
    print(f"  by format: {cnt(lambda e: e['fmt'])}")
    print(f"  by basis: {cnt(lambda e: e['basis'])}")


if __name__ == "__main__":
    main()
