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
  function fmtStamp(iso) {
    var m = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    var p = iso.split("-");
    return { en: (+p[2]) + " " + m[+p[1] - 1] + " " + p[0], zh: p[0] + " 年 " + (+p[1]) + " 月 " + (+p[2]) + " 日" };
  }

  function render(D) {
    var items = D.items.slice().sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
    var byId = {}; items.forEach(function (i) { byId[i.id] = i; });
    var st = fmtStamp(D.meta.last_updated);
    var stamp = '<div class="stamp"><i></i><span class="t en">Last updated: ' + esc(st.en) + ' (' + esc(D.meta.timezone) + ')</span>' +
                '<span class="t zh">最后更新：' + esc(st.zh) + '（' + esc(D.meta.timezone) + '）</span></div>';

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

    // Landscape: who else works on neural media
    var L = D.landscape;
    if (L) {
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
        return '<div class="land-group g-' + esc(g.key) + '">' +
          '<div class="land-head"><span class="roman">' + ["I", "II", "III"][gi] + '</span><h3>' + bi(g.title) + '</h3></div>' +
          '<ul class="who-list">' + rows + '</ul>' +
          (g.note ? '<div class="land-note">' + bi(g.note, "p") + '</div>' : "") + '</div>';
      }).join("");
      document.getElementById("landscape").innerHTML =
        '<div class="sec-head"><span class="num">05</span><h2>' + bi(L.title) + '</h2></div>' +
        '<div class="lead land-lead">' + bi(L.lead, "p") + '</div>' +
        '<div class="legend">' + legend + '</div>' + groups;
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
  }
  document.querySelector(".lang").addEventListener("click", function (ev) {
    var b = ev.target.closest("button"); if (b) setLang(b.getAttribute("data-lang"));
  });
  var saved = null; try { saved = localStorage.getItem("nm-lang"); } catch (e) {}
  var q = (location.search.match(/[?&]lang=(en|zh|both)/) || [])[1];
  setLang(q || saved || "both");

  if (window.__NM_DATA__) render(window.__NM_DATA__);
  else fetch("data/neural-media.json").then(function (r) { return r.json(); }).then(render);
})();
