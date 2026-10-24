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

  if (location.hash) { var tgt = document.getElementById(location.hash.slice(1)); if (tgt) setTimeout(function () { tgt.scrollIntoView(); spy(); }, 0); }
})();
