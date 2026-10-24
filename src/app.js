(function () {
  "use strict";
  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  // Bilingual helper: renders an en span and a zh span; CSS decides what is visible.
  function bi(o, tag) {
    tag = tag || "span";
    if (!o) return "";
    return '<' + tag + ' class="t en" lang="en">' + esc(o.en) + '</' + tag + '>' +
           '<' + tag + ' class="t zh" lang="zh-Hans">' + esc(o.zh) + '</' + tag + '>';
  }
  function ext(url, inner, cls) {
    return '<a ' + (cls ? 'class="' + cls + '" ' : "") + 'href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + inner + "</a>";
  }
  // Internal link to another page of this site (keeps the language choice).
  function intl(href, inner, cls) {
    return '<a ' + (cls ? 'class="' + cls + '" ' : "") + 'data-internal href="' + esc(href) + '">' + inner + "</a>";
  }
  function feature(F) {
    var A = F.argument, S = F.structure, V = F.versions, C = F.chain;
    var cta = F.cta.map(function (c) { return ext(c.url, bi(c.label) + ' <span aria-hidden="true">↗</span>', "btn" + (c.primary ? " primary" : "")); }).join("");
    var pts = A.points.map(function (p, pi) {
      return '<li class="fpoint"><span class="fpn">' + (pi + 1 < 10 ? "0" : "") + (pi + 1) + '</span><h5>' + bi(p.term) + '</h5>' +
        '<div class="who-line">' + bi(p.text, "p") + '</div>' + (p.quote ? '<blockquote class="fq">' + bi(p.quote, "p") + '</blockquote>' : "") + '</li>';
    }).join("");
    var parts = S.parts.map(function (pt) {
      return '<li class="fpart">' +
        '<div class="fpart-head">' + ext(pt.url, '<span class="fr">' + esc(pt.num) + '</span><span class="fname">' + bi(pt.name) + '</span>') +
          '<div class="fquest">' + bi(pt.question) + '</div></div>' +
        '<div class="fpart-body"><div class="who-line">' + bi(pt.text, "p") + '</div>' +
          '<ol class="fsecs">' + pt.sections.map(function (s) { return '<li>' + bi(s) + '</li>'; }).join("") + '</ol></div></li>';
    }).join("");
    var vers = V.entries.map(function (v) {
      var st = fmtStamp(v.date), lab = typeof v.label === "string" ? { en: v.label, zh: v.label } : v.label;
      return '<li><span class="vl">' + bi(lab) + '</span><span class="vd">' + bi(st) + '</span><div class="vt">' + bi(v.text, "p") + '</div></li>';
    }).join("");
    var chain = C.steps.map(function (s, si) {
      return '<li class="cstep"><span class="cdate">' + bi(s.date) + '</span><h5>' + ext(s.url, esc(s.who) + ' ↗') + '</h5>' +
        '<div class="who-line">' + bi(s.what, "p") + '</div></li>' + (si < C.steps.length - 1 ? '<li class="carrow" aria-hidden="true">→</li>' : "");
    }).join("");
    return '<article class="feature" id="' + esc(F.id) + '">' +
      '<div class="f-top"><div class="f-kicker">' + bi(F.kicker) + '</div>' +
        '<h3 class="f-title">' + esc(F.title) + '</h3>' +
        '<div class="f-sub">' + bi(F.subtitle, "p") + '</div>' +
        '<div class="f-byline">' + bi(F.byline) + '</div>' +
        '<figure class="f-def"><div class="fw">' + esc(F.definition.word) + '</div>' + bi(F.definition.quote, "p") +
          '<figcaption>' + bi(F.definition.note) + '</figcaption></figure>' +
        '<div class="f-cta">' + cta + '</div>' +
        '<div class="f-note">' + bi(F.note, "p") + '</div></div>' +
      '<div class="f-row f-row-a"><section class="f-author"><h4 class="f-h">' + bi(F.author.title) + '</h4>' + bi(F.author.text, "p") +
          '<div class="links">' + F.author.links.map(function (l) { return ext(l.url, bi(l.label) + " ↗"); }).join("") + '</div></section>' +
        '<section class="f-arg"><h4 class="f-h">' + bi(A.title) + '</h4><ol class="fpoints">' + pts + '</ol></section></div>' +
      '<section class="f-struct"><h4 class="f-h">' + bi(S.title) + '</h4><div class="f-struct-intro">' + bi(S.intro, "p") + '</div><ol class="fparts">' + parts + '</ol></section>' +
      '<div class="f-row f-row-b"><section class="f-vers"><h4 class="f-h">' + bi(V.title) + '</h4><ol class="vlist">' + vers + '</ol>' +
          '<div class="links">' + ext(V.source.url, bi(V.source.label) + " ↗") + '</div></section>' +
        '<section class="f-chain"><h4 class="f-h">' + bi(C.title) + '</h4><ol class="clist">' + chain + '</ol>' +
          '<div class="land-note">' + bi(C.note, "p") + '</div></section></div>' +
      '</article>';
  }
  function fmtStamp(iso) {
    var m = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    var p = iso.split("-");
    return { en: (+p[2]) + " " + m[+p[1] - 1] + " " + p[0], zh: p[0] + " 年 " + (+p[1]) + " 月 " + (+p[2]) + " 日" };
  }

  function render(D) {
    var st = fmtStamp(D.meta.last_updated);
    var stamp = '<div class="stamp"><i></i><span class="t en">Last updated: ' + esc(st.en) + ' (' + esc(D.meta.timezone) + ')</span>' +
                '<span class="t zh">最后更新：' + esc(st.zh) + '（' + esc(D.meta.timezone) + '）</span></div>';

    if (D.items && document.getElementById("hero")) {
    var items = D.items.slice().sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
    var byId = {}; items.forEach(function (i) { byId[i.id] = i; });
    // Hero
    var h = D.hero;
    document.getElementById("hero").innerHTML =
      '<div class="kicker">' + bi(h.kicker) + '</div>' +
      '<h1><span class="t en">' + esc(h.title.en) + '</span><span class="t zh">' + esc(h.title.zh) + '</span></h1>' +
      '<p class="by">K Allado-McDowell · <span class="inline">' + bi({ en: "concept & framework", zh: "概念与理论框架" }) + '</span></p>' +
      '<div class="intro">' + bi(h.intro, "p") + '</div>' + stamp;

    // Concept
    var c = D.concept;
    var eras = c.eras.map(function (e) {
      return '<article class="era' + (e.key === "neural" ? " now" : "") + '">' +
        '<div class="span">' + esc(e.span) + '</div>' +
        '<h3>' + bi(e.name) + '</h3>' +
        '<dl><dt>Space 空间</dt><dd>' + bi(e.space) + '</dd><dt>Content 内容</dt><dd>' + bi(e.content) + '</dd><dt>Identity 身份</dt><dd>' + bi(e.identity_type) + '</dd></dl>' +
        '<div class="id">' + bi(e.identity, "p") + '</div></article>';
    }).join("");
    document.getElementById("concept").innerHTML =
      '<div class="sec-head"><span class="num">01</span><h2>' + bi({ en: "What is Neural Media", zh: "什么是神经媒体" }) + '</h2></div>' +
      '<div class="lead">' + bi(c.lead, "p") + '</div>' +
      '<div class="eras">' + eras + '</div>' +
      '<div class="timeline-bar" aria-hidden="true"><span></span><span></span><span></span><span class="now"></span></div>' +
      '<ul class="notes">' + c.notes.map(function (n) { return '<li>' + bi(n, "span") + '</li>'; }).join("") + '</ul>';

    // Timeline with type filters
    var counts = {}; items.forEach(function (i) { i.types.forEach(function (t) { counts[t] = (counts[t] || 0) + 1; }); });
    var chips = '<button class="chip" type="button" data-f="all" aria-pressed="true">' + bi({ en: "All", zh: "全部" }) + '<b>' + items.length + '</b></button>' +
      Object.keys(D.types).filter(function (k) { return counts[k]; }).map(function (k) {
        return '<button class="chip" type="button" data-f="' + k + '" aria-pressed="false">' + bi(D.types[k]) + '<b>' + counts[k] + '</b></button>';
      }).join("");
    var feed = items.map(function (i) {
      var tags = i.types.map(function (t) { return '<span class="tag ' + esc(t) + '">' + bi(D.types[t]) + '</span>'; }).join("") +
        (i.added && i.added === D.meta.last_updated && i.added > (D.meta.launched || "") ? '<span class="tag new">NEW</span>' : "");
      var links = ext(i.url, bi({ en: "Open source ↗", zh: "查看原文 ↗" })) +
        (i.internal ? intl(i.internal.href, bi(i.internal.label) + " →", "internal") : "") +
        (i.links || []).map(function (l) { return ext(l.url, bi(l.label) + " ↗"); }).join("") +
        '<span class="src">' + bi(i.source) + '</span>';
      var thumb = i.thumbnail ? ext(i.url, '<img alt="" src="' + esc(i.thumbnail) + '">', "thumb") : "";
      return '<li class="item' + ((Date.parse(D.meta.last_updated) - Date.parse(i.date)) / 864e5 <= 30 ? " fresh" : "") + '" data-types="' + esc(i.types.join(" ")) + '">' +
        '<div class="when"><time datetime="' + esc(i.date) + '">' + bi(i.date_display) + '</time></div>' +
        '<article class="card' + (thumb ? " has-thumb" : "") + '">' +
          '<div class="tags">' + tags + '</div>' +
          '<h3>' + ext(i.url, bi(i.title)) + '</h3>' +
          '<div class="sum">' + bi(i.summary, "p") + '</div>' +
          '<div class="links">' + links + '</div>' + thumb +
        '</article></li>';
    }).join("");
    var up = document.getElementById("updates");
    up.innerHTML =
      '<div class="sec-head"><span class="num">02</span><h2>' + bi({ en: "Latest updates", zh: "最新动态" }) + '</h2></div>' +
      stamp + '<div style="height:22px"></div>' +
      '<div class="filters" role="group" aria-label="Filter by type">' + chips + '</div>' +
      '<div class="feed-note">' + bi(D.meta.note, "p") + '</div>' +
      '<ol class="feed">' + feed + '</ol>';
    up.querySelector(".filters").addEventListener("click", function (ev) {
      var b = ev.target.closest(".chip"); if (!b) return;
      var f = b.getAttribute("data-f");
      up.querySelectorAll(".chip").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      up.querySelectorAll(".item").forEach(function (li) {
        li.hidden = !(f === "all" || (" " + li.getAttribute("data-types") + " ").indexOf(" " + f + " ") > -1);
      });
    });

    // Featured video
    var v = D.featured;
    document.getElementById("video").innerHTML =
      '<div class="sec-head"><span class="num">03</span><h2>' + bi({ en: "Featured talk", zh: "精选演讲" }) + '</h2></div>' +
      '<div class="video-grid">' +
        ext(v.url, '<img alt="On Neural Media, Long Now talk thumbnail" src="' + esc(v.thumbnail) + '"><span class="play" aria-hidden="true"></span>' +
          '<span class="cap">' + bi({ en: "Watch on YouTube", zh: "在 YouTube 观看" }) + '</span>', "player") +
        '<div class="video-info"><h3>' + bi(v.title) + '</h3><div class="meta">' + bi(v.meta) + '</div>' +
          '<ol class="take">' + v.takeaways.map(function (t) { return '<li>' + bi(t) + '</li>'; }).join("") + '</ol>' +
          '<div class="links">' + v.more.map(function (l) { return ext(l.url, bi(l.label) + " ↗"); }).join("") + '</div>' +
        '</div></div>';

    // Reading list
    document.getElementById("reading").innerHTML =
      '<div class="sec-head"><span class="num">04</span><h2>' + bi({ en: "Key essays & sources", zh: "核心文章与资料" }) + '</h2></div>' +
      '<div class="reading">' + D.reading.map(function (id) {
        var i = byId[id]; if (!i) return "";
        return ext(i.url, '<span class="yr">' + esc(i.date.slice(0, 4)) + ' · ' + esc(D.types[i.types[0]].en.toUpperCase()) + '</span>' +
          '<h3>' + bi(i.title) + '</h3>' + bi(i.summary, "p") + '<span class="src">' + bi(i.source) + '</span>', "read");
      }).join("") + '</div>';

    }

    // Landscape: who else works on neural media
    var L = D.landscape;
    if (L && document.getElementById("landscape")) {
      var mk = function (m) { return '<span class="mark ' + esc(m) + '">' + bi(L.markers[m]) + '</span>'; };
      var arr = ' <span class="arr" aria-hidden="true">↗</span>';
      var nameHtml = function (n) {
        if (n.en === n.zh) return '<span class="one">' + esc(n.en) + arr + '</span>';
        return '<span class="t en" lang="en">' + esc(n.en) + arr + '</span><span class="t zh" lang="zh-Hans">' + esc(n.zh) + arr + '</span>';
      };
      var legend = Object.keys(L.markers).map(mk).join("");
      var groups = L.groups.map(function (g, gi) {
        var rows = g.entries.map(function (en) {
          return '<li class="who">' +
            '<div class="who-marks">' + en.marks.map(mk).join("") + '</div>' +
            '<h4>' + ext(en.url, nameHtml(en.name)) + '</h4>' +
            '<div class="who-line">' + bi(en.line, "p") + '</div></li>';
        }).join("");
        return '<div class="land-group g-' + esc(g.key) + '" id="g-' + esc(g.key) + '">' +
          '<div class="land-head"><span class="roman">' + ["I", "II", "III"][gi] + '</span><h3>' + bi(g.title) + '</h3></div>' +
          '<ul class="who-list">' + rows + '</ul>' +
          (g.note ? '<div class="land-note">' + bi(g.note, "p") + '</div>' : "") + '</div>';
      }).join("");
      document.getElementById("landscape").innerHTML =
        '<div class="sec-head"><span class="num">05</span><h2>' + bi(L.title) + '</h2></div>' +
        '<div class="lead land-lead">' + bi(L.lead, "p") + '</div>' +
        '<div class="legend">' + legend + '</div>' + groups;
    }

    // BCI x Neural Media
    var B = D.bci;
    if (B && document.getElementById("bci")) {
      var bm = function (m) { return '<span class="mark b-' + esc(m) + '">' + bi(B.markers[m]) + '</span>'; };
      var more = function (ls) { return (ls || []).map(function (l) { return ext(l.url, bi(l.label) + " ↗"); }).join(""); };
      var roman = ["i", "ii", "iii", "iv", "v", "vi"];
      var primer = B.primer.cards.map(function (c, ci) {
        return '<article class="pcard"><span class="pnum">' + roman[ci] + '</span>' +
          '<h4>' + bi(c.term) + '</h4><div class="ptext">' + bi(c.text, "p") + '</div>' +
          (c.url ? '<div class="links">' + ext(c.url, bi({ en: "Source ↗", zh: "来源 ↗" })) + '</div>' : "") + '</article>';
      }).join("");
      var theory = B.theory.entries.map(function (e) {
        return '<li class="idea">' +
          '<div class="who-marks">' + e.marks.map(bm).join("") + '</div>' +
          '<h4>' + ext(e.url, bi(e.name)) + '</h4>' +
          '<div class="idea-src">' + bi(e.source) + '</div>' +
          '<div class="who-line">' + bi(e.line, "p") + '</div>' +
          '<div class="links">' + ext(e.url, bi({ en: "Read ↗", zh: "阅读 ↗" })) + more(e.links) +
          (e.internal ? intl(e.internal.href, bi(e.internal.label) + " ↑", "internal") : "") + '</div></li>';
      }).join("");
      var news = B.news.entries.slice().sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
      var lastY = "";
      var newsHtml = news.map(function (n) {
        var y = n.date.slice(0, 4), yr = "";
        if (y !== lastY) { yr = '<li class="nyear" aria-hidden="true"><span>' + y + '</span></li>'; lastY = y; }
        return yr + '<li class="nitem">' +
          '<div class="ndate"><time datetime="' + esc(n.date) + '">' + bi(n.date_display) + '</time></div>' +
          '<div class="nbody"><div class="who-marks">' + n.marks.map(bm).join("") + '</div>' +
          '<h4>' + ext(n.url, bi(n.title)) + '</h4>' + '<div class="who-line">' + bi(n.line, "p") + '</div></div></li>';
      }).join("");
      document.getElementById("bci").innerHTML =
        '<div class="sec-head"><span class="num">06</span><h2>' + bi(B.title) + '</h2></div>' +
        '<div class="bci-strap" aria-hidden="true"><span class="s-brain">BRAIN · 大脑</span><span class="s-wave"></span><span class="s-net">NET · 网络</span></div>' +
        '<div class="lead bci-lead">' + bi(B.lead, "p") + '</div>' +
        (B.feature ? feature(B.feature) : "") +
        '<div class="legend">' + Object.keys(B.markers).map(bm).join("") + '</div>' +
        '<div class="land-group" id="primer"><div class="land-head"><span class="roman">I</span><h3>' + bi(B.primer.title) + '</h3></div>' +
          '<div class="primer">' + primer + '</div></div>' +
        '<div class="land-group" id="theory"><div class="land-head"><span class="roman">II</span><h3>' + bi(B.theory.title) + '</h3></div>' +
          '<ul class="who-list ideas">' + theory + '</ul>' +
          (B.note ? '<div class="land-note">' + bi(B.note, "p") + '</div>' : "") + '</div>' +
        '<div class="land-group" id="news"><div class="land-head"><span class="roman">III</span><h3>' + bi(B.news.title) + '</h3></div>' +
          '<ol class="bnews">' + newsHtml + '</ol></div>';
    }


    // New Models / Lil Internet / Caroline Busta page
    var N = D.newmodels;
    if (N && document.getElementById("newmodels")) {
      var nmTag = function (cls, o) { return '<span class="ntag ' + cls + '">' + bi(o) + '</span>'; };
      var badge = '<span class="nm-badge">' + bi({ en: "Neural media / future media", zh: "神经媒体 / 未来新媒体" }) + '</span>';
      var people = N.people.map(function (pp) {
        return '<article class="nm-person"><h4>' + esc(pp.name) + '</h4><div class="nm-role">' + bi(pp.role) + '</div>' +
          '<div class="ptext">' + bi(pp.text, "p") + '</div>' +
          (pp.links && pp.links.length ? '<div class="links">' + pp.links.map(function (l) { return ext(l.url, bi(l.label) + " ↗"); }).join("") + '</div>' : "") + '</article>';
      }).join("");
      var evo = N.evolution.map(function (ev) {
        return '<li><span class="evy">' + esc(ev.year) + '</span><div class="evt">' + bi(ev.text, "p") + '</div></li>';
      }).join("");
      var ideas = N.ideas.map(function (it, ii) {
        return '<article class="nm-idea' + (it.nm ? " flag" : "") + '"><span class="pnum">' + (ii + 1 < 10 ? "0" : "") + (ii + 1) + '</span>' +
          (it.nm ? badge : "") + '<h4>' + bi(it.term) + '</h4><div class="ptext">' + bi(it.text, "p") + '</div>' +
          (it.where ? '<div class="idea-src">' + bi(it.where) + '</div>' : "") + '</article>';
      }).join("");
      var rel = function (arr) {
        return arr.map(function (r) {
          return '<li>' + (r.when ? '<span class="rwhen">' + bi(r.when) + '</span>' : "") + '<div class="who-line">' + bi(r.text, "p") + '</div>' +
            (r.url ? '<div class="links">' + ext(r.url, bi({ en: "Source ↗", zh: "来源 ↗" })) + (r.internal ? intl(r.internal, bi({ en: "Entry below", zh: "见下方条目" }) + " ↓", "internal") : "") + '</div>' : "") + '</li>';
        }).join("");
      };
      var E = N.entries;
      var nFlag = E.filter(function (e) { return e.nm; }).length;
      var fmtCount = {}; E.forEach(function (e) { fmtCount[e.fmt] = (fmtCount[e.fmt] || 0) + 1; });
      var chips = '<button class="chip" type="button" data-f="all" aria-pressed="true">' + bi({ en: "All", zh: "全部" }) + '<b>' + E.length + '</b></button>' +
        '<button class="chip chip-nm" type="button" data-f="nm" aria-pressed="false">' + bi({ en: "Neural media / future media only", zh: "只看神经媒体 / 未来新媒体" }) + '<b>' + nFlag + '</b></button>';
      var fchips = Object.keys(N.formats).filter(function (k) { return fmtCount[k]; }).map(function (k) {
        return '<button class="chip" type="button" data-f="f:' + k + '" aria-pressed="false">' + bi(N.formats[k]) + '<b>' + fmtCount[k] + '</b></button>';
      }).join("");
      var lastY = "", list = E.map(function (e) {
        var y = e.date.slice(0, 4), yr = "";
        if (y !== lastY) {
          var cnt = E.filter(function (x) { return x.date.slice(0, 4) === y; }).length;
          yr = '<li class="nyear nm-year" id="y' + y + '" data-year="' + y + '"><span>' + y + '</span><em>' + bi({ en: cnt + " entries", zh: cnt + " 条" }) + '</em></li>';
          lastY = y;
        }
        var dd = e.date_display || fmtStamp(e.date);
        var meta = nmTag("f-" + esc(e.fmt), N.formats[e.fmt]) + nmTag("a-" + esc(e.access), N.access[e.access]) + nmTag("b-" + esc(e.basis), N.basis[e.basis]) +
          (e.mins ? '<span class="ntag mins">' + esc(e.mins) + ' min</span>' : "") + (e.nm ? badge : "");
        return yr + '<li class="nitem nm-entry' + (e.nm ? " flag" : "") + '" id="e-' + esc(e.id) + '" data-year="' + y + '" data-fmt="' + esc(e.fmt) + '" data-nm="' + (e.nm ? "1" : "0") + '">' +
          '<div class="ndate"><time datetime="' + esc(e.date) + '">' + bi(dd) + '</time></div>' +
          '<div class="nbody"><div class="who-marks">' + meta + '</div>' +
          '<h4>' + ext(e.url, bi(e.title)) + '</h4>' +
          (e.people ? '<div class="nm-people">' + (/; hosts$/.test(e.people) ? bi({ en: e.people.replace(/; hosts$/, " · with the hosts"), zh: e.people.replace(/; hosts$/, " · 与主持人") }) : esc(e.people)) + '</div>' : "") +
          '<div class="who-line nm-sum">' + bi(e.summary, "p") + '</div>' +
          (e.nm ? '<div class="nm-note"><span class="nm-note-h">' + bi({ en: "On neural / future media", zh: "关于神经媒体 / 未来新媒体" }) + '</span>' + bi(e.nm, "p") + '</div>' : "") +
          '<div class="links">' + ext(e.url, bi({ en: "Open source ↗", zh: "查看原文 ↗" })) +
            (e.links || []).map(function (l) { return ext(l.url, bi(l.label) + " ↗"); }).join("") + '</div>' +
          '</div></li>';
      }).join("");
      var R = N.relation;
      var host = document.getElementById("newmodels");
      host.innerHTML =
        '<div class="sec-head"><span class="num">07</span><h2>' + bi(N.title) + '</h2></div>' +
        '<div class="lead nm-lead">' + bi(N.lead, "p") + '</div>' + stamp + '<div style="height:40px"></div>' +
        '<div class="land-group" id="nm-about"><div class="land-head"><span class="roman">I</span><h3>' + bi({ en: "Who they are", zh: "他们是谁" }) + '</h3></div>' +
          '<div class="nm-people-grid">' + people + '</div>' +
          '<h5 class="nm-sub">' + bi({ en: "How the platform evolved", zh: "平台的演变" }) + '</h5><ol class="nm-evo">' + evo + '</ol></div>' +
        '<div class="land-group" id="nm-ideas"><div class="land-head"><span class="roman">II</span><h3>' + bi({ en: "Core recurring ideas, in plain language", zh: "反复出现的核心观点（白话版）" }) + '</h3></div>' +
          '<div class="nm-ideas">' + ideas + '</div></div>' +
        '<div class="land-group" id="nm-k"><div class="land-head"><span class="roman">III</span><h3>' + bi({ en: "Relationship to K & neural media", zh: "与 K 及「神经媒体」的关系" }) + '</h3></div>' +
          '<div class="nm-relsum">' + bi(R.summary, "p") + '</div>' +
          '<div class="nm-rel"><section><h5 class="nm-sub">' + bi({ en: "Direct links (sourced)", zh: "直接联系（有出处）" }) + '</h5><ul class="nm-rlist">' + rel(R.direct) + '</ul></section>' +
          '<section><h5 class="nm-sub">' + bi({ en: "Thematic overlap & differences", zh: "主题重叠与差异" }) + '</h5><ul class="nm-rlist">' + rel(R.thematic) + '</ul></section></div></div>' +
        '<div class="land-group" id="nm-archive"><div class="land-head"><span class="roman">IV</span><h3>' + bi({ en: "Every episode & post, newest first", zh: "全部节目与文章（从新到旧）" }) + '</h3></div>' +
          '<div class="feed-note">' + bi(N.note, "p") + '</div>' +
          '<div class="legend nm-legend">' + Object.keys(N.basis).map(function (k) { return nmTag("b-" + k, N.basis[k]); }).join("") + '</div>' +
          '<div class="filters nm-filters" role="group" aria-label="Filter · 筛选">' + chips + '</div>' +
          '<details class="nm-fmt"><summary>' + bi({ en: "Filter by series", zh: "按栏目筛选" }) + '</summary><div class="filters">' + fchips + '</div></details>' +
          '<div class="nm-shown" aria-live="polite"></div>' +
          '<ol class="bnews nm-list">' + list + '</ol></div>';
      var shown = host.querySelector(".nm-shown");
      var applyF = function (f) {
        var n = 0;
        host.querySelectorAll(".nm-entry").forEach(function (li) {
          var ok = f === "all" || (f === "nm" && li.getAttribute("data-nm") === "1") || (f.indexOf("f:") === 0 && li.getAttribute("data-fmt") === f.slice(2));
          li.hidden = !ok; if (ok) n++;
        });
        host.querySelectorAll(".nm-year").forEach(function (yh) {
          var y = yh.getAttribute("data-year");
          var c = host.querySelectorAll('.nm-entry[data-year="' + y + '"]:not([hidden])').length;
          yh.hidden = !c;
          yh.querySelector("em").innerHTML = bi({ en: c + " entries", zh: c + " 条" });
        });
        shown.innerHTML = f === "all" ? "" : bi({ en: "Showing " + n + " of " + E.length + " entries", zh: "显示 " + n + " / " + E.length + " 条" });
        host.querySelectorAll(".nm-filters .chip, .nm-fmt .chip").forEach(function (x) { x.setAttribute("aria-pressed", String(x.getAttribute("data-f") === f)); });
      };
      host.addEventListener("click", function (ev) {
        var b = ev.target.closest(".nm-filters .chip, .nm-fmt .chip"); if (!b) return;
        applyF(b.getAttribute("data-f"));
      });
      // Year links in the sticky bar: if a filter hides that year, reset to "All" first.
      document.querySelectorAll('.subnav a[href^="#y"]').forEach(function (a) {
        a.addEventListener("click", function () {
          var t = document.getElementById(a.getAttribute("href").slice(1));
          if (t && t.hidden) applyF("all");
        });
      });
    }

    document.getElementById("foot").innerHTML =
      bi({ en: "An independent bilingual tracker of public sources on Neural Media, a concept by K Allado-McDowell. Every item links to its original source. Dates are China time (UTC+8).",
           zh: "这是一个独立的双语追踪站，收录有关 K Allado-McDowell「神经媒体」概念的公开资料。每一条目都附有原始来源链接。日期均为北京时间（UTC+8）。" }, "p");
  }

  // Language toggle
  function setLang(l) {
    document.body.className = "lang-" + l;
    document.documentElement.lang = l === "zh" ? "zh-Hans" : "en";
    document.querySelectorAll(".lang button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-lang") === l)); });
    try { localStorage.setItem("nm-lang", l); } catch (e) {}
    // carry the language choice across pages (also works when localStorage is unavailable)
    document.querySelectorAll("a[data-internal]").forEach(function (a) {
      var h = a.getAttribute("href"), hash = "", k = h.indexOf("#");
      if (k > -1) { hash = h.slice(k); h = h.slice(0, k); }
      if (!h) return;
      h = h.replace(/[?&]lang=(en|zh|both)/, "");
      a.setAttribute("href", h + "?lang=" + l + hash);
    });
  }
  document.querySelector(".lang").addEventListener("click", function (ev) {
    var b = ev.target.closest("button"); if (b) setLang(b.getAttribute("data-lang"));
  });
  if (window.__NM_DATA__) render(window.__NM_DATA__);
  var saved = null; try { saved = localStorage.getItem("nm-lang"); } catch (e) {}
  var q = (location.search.match(/[?&]lang=(en|zh|both)/) || [])[1];
  setLang(q || saved || "both");

  // Sticky header height -> scroll offset, so headings are never hidden under the header + section bar.
  var topbar = document.querySelector(".topbar");
  function syncOffset() {
    var hgt = topbar ? Math.ceil(topbar.getBoundingClientRect().height) : 60;
    document.documentElement.style.setProperty("--hdr", hgt + "px");
    return hgt;
  }
  syncOffset();
  window.addEventListener("resize", syncOffset);

  // Scroll-spy: highlight the section currently in view in the in-page bar.
  var spyLinks = Array.prototype.slice.call(document.querySelectorAll(".subnav a[data-spy]"));
  var spyTargets = spyLinks.map(function (a) { return document.getElementById(a.getAttribute("data-spy")); });
  var current = null;
  function spy() {
    if (!spyLinks.length) return;
    var line = syncOffset() + 24, idx = -1;
    spyTargets.forEach(function (el, i) { if (el && el.getBoundingClientRect().top <= line) idx = i; });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) idx = spyTargets.length - 1;
    var a = idx > -1 ? spyLinks[idx] : null;
    if (a === current) return;
    current = a;
    spyLinks.forEach(function (l) { if (l === a) l.setAttribute("aria-current", "true"); else l.removeAttribute("aria-current"); });
    if (a) {  // keep the active link visible in the horizontally scrolling bar on small screens
      var bar = a.parentNode, r = a.getBoundingClientRect(), br = bar.getBoundingClientRect();
      if (r.left < br.left || r.right > br.right) bar.scrollLeft += (r.left - br.left) - (br.width - r.width) / 2;
    }
  }
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; spy(); }); }
  }, { passive: true });
  spy();

  // On narrow screens the page nav scrolls sideways: keep the current page's tab in view.
  var curNav = document.querySelector('.nav a[aria-current="page"]');
  if (curNav) { var navEl = curNav.parentNode; if (navEl.scrollWidth > navEl.clientWidth + 1) navEl.scrollLeft = Math.max(0, curNav.offsetLeft - navEl.offsetLeft - 12); }

  if (location.hash) { var tgt = document.getElementById(location.hash.slice(1)); if (tgt) setTimeout(function () { tgt.scrollIntoView(); spy(); }, 0); }
})();
