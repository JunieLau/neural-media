(function () {
  "use strict";
  var host = document.getElementById("spatial-storytelling"), board = window.__NM_DATA__.spatial;
  if (!host || !board) return;
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) {
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
  }); };
  function bi(o, tag) {
    tag = tag || "span";
    if (o.en === o.zh) return '<' + tag + ' class="sp-same">' + esc(o.en) + '</' + tag + '>';
    return '<' + tag + ' class="t en" lang="en">' + esc(o.en) + '</' + tag + '>' +
      '<' + tag + ' class="t zh" lang="zh-Hans">' + esc(o.zh) + '</' + tag + '>';
  }
  function copy(en, zh, tag) { return bi({en:en,zh:zh},tag); }
  function ext(url, inner) {return '<a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + inner + '</a>';}
  var category = {
    studio:{en:"Story studio",zh:"叙事工作室"},venue:{en:"Production & venues",zh:"制作与场馆"},
    tools:{en:"Technology",zh:"技术底层"},historical:{en:"Historical case",zh:"历史案例"},screen:{en:"Immersive cinema",zh:"沉浸式电影"}
  };
  var label = {
    work:{en:"Project",zh:"作品"},interview:{en:"Interview",zh:"访谈"},
    source:{en:"Source",zh:"资料"},funding:{en:"Funding",zh:"融资"}
  };
  var picks = [
    ["atlas-v","Best film-to-XR reference","电影 IP 转译"],
    ["arvore","Best AI-dialogue reference","AI 角色实时回应"],
    ["sandbox","Largest disclosed venue network here","线下商业规模"]
  ];
  var marketKind = {trade:{en:"Industry news / disclosures",zh:"行业新闻／披露"},report:{en:"Field reports",zh:"行业观察"},paper:{en:"Research papers",zh:"研究论文"}};
  function market() {
    return '<section class="sp-market" id="market" aria-labelledby="sp-market-title"><div class="sp-market-kicker">02 / MARKET BRIEF</div>' +
      '<h2 id="sp-market-title">' + copy("Is spatial storytelling a blue ocean?", "空间叙事是蓝海吗？") + '</h2>' +
      '<div class="sp-market-thesis">' + copy("Not as a whole. The opening is original stories with meaningful interaction and a repeatable route to audiences.", "不是整片蓝海。更值得试的是：原创故事、真的会改变体验的互动，以及能反复触达观众的发行方式。","p") + '</div>' +
      '<div class="sp-market-takes">' +
      [['Paid demand exists','有人愿意付费','Known IP, multiplayer venues and travelling heritage shows have sold tickets. This does not establish indie studio margins.','成熟 IP、多人场馆和巡展已有付费案例，但不能据此推算独立团队的利润。'],
       ['The bottleneck is distribution','难的是发行','Headset owners, festivals and venue operators buy different things. Budget for onboarding, staffing and porting before calling it scalable.','家用头显、影展和线下门店是三套不同的渠道。场地动线、人员和移植成本都会影响能不能复制。'],
       ['A creative test worth running','先做一个可验证的原型','Try one location, one character and one decision that changes the next scene. Measure completion, replay interest and willingness to pay before building a larger world.','先做一个场景、一个角色和一个会改变下一幕的选择；测完成率、重玩意愿和付费意愿，再决定要不要扩大世界。']].map(function(item){
        return '<article><h3>' + copy(item[0],item[1]) + '</h3>' + copy(item[2],item[3],"p") + '</article>';
      }).join("") + '</div><div class="sp-market-sources">' +
      Object.keys(marketKind).map(function(kind){
        return '<div class="sp-market-group"><h3>' + bi(marketKind[kind]) + '</h3>' + board.market.filter(function(e){return e.kind === kind;}).map(function(e){
          return '<article class="sp-market-source"><div class="sp-source-meta"><time datetime="' + esc(e.date) + '">' + esc(e.date) + '</time> · ' + bi(e.source) + '</div><h4>' +
            ext(e.url,bi(e.title) + '<span class="sp-source-arrow" aria-hidden="true"> ↗</span>') + '</h4>' + bi(e.summary,"p") + '</article>';
        }).join("") + '</div>';
      }).join("") + '</div></section>';
  }
  var byId = new Map(board.entries.map(function(e){return [e.id,e];}));
  host.classList.add("sp-wrap");
  host.innerHTML = '<div class="sp-hero"><div class="kicker">11 / ' + copy("FIELD GUIDE","公司图谱") + '</div>' +
    '<h1>' + copy("Spatial Storytelling","空间叙事") + '</h1><div class="sp-intro">' +
    copy("Studios, venues and tools that turn a space into a story people can enter, explore or change.",
    "从走进一幕戏，到和角色对话，再到让选择改变剧情。按叙事能力看团队，不按融资额排名。","p") + '</div></div>' +
    '<div class="sp-picks" aria-label="Starting points · 优先看">' +
    picks.map(function(p){return '<a class="sp-pick" href="#sp-' + esc(p[0]) + '"><span class="sp-pick-label">' + copy(p[1],p[2]) +
      '</span><strong class="sp-pick-name">' + bi(byId.get(p[0]).title) + '</strong></a>';}).join("") + '</div>' +
    '<div class="sp-board-head"><h2>' + copy("Companies & case studies","公司与案例") + '</h2><span class="sp-checked">' +
    copy("Checked " + board.checked,"核查于 " + board.checked) + '</span><a class="sp-market-jump" href="#market">' + copy("Market brief ↓","市场观察 ↓") + '</a></div><div class="sp-grid">' +
    board.entries.map(function(e){
      return '<button type="button" aria-haspopup="dialog" class="sp-card" id="sp-' + esc(e.id) + '" data-sp-card="' + esc(e.id) + '">' +
        '<span class="sp-cover"><img loading="lazy" decoding="async" alt="" src="' + esc(e.image.file) + '"><span class="sp-badge">' + bi(category[e.category]) + '</span></span>' +
        '<span class="sp-cardbody"><strong class="sp-name">' + bi(e.title) + '</strong><span class="sp-place">' + bi(e.place) +
        '</span><span class="sp-blurb">' + bi(e.blurb) + '</span><span class="sp-edge"><strong>' + copy("Advantage","优势") + '</strong>' + bi(e.advantage) + '</span><span class="sp-more">' + copy("Projects & sources ↗","作品与资料 ↗") + '</span></span></button>';
    }).join("") + '</div><p class="sp-notice">' +
    copy("Publicly disclosed funding, round sizes, valuations and acquisitions are shown separately. An undisclosed amount is not zero.",
      "单轮、累计、估值和收购分开标注。金额未披露不等于没有融资。") + '</p>' + market() +
    '<dialog class="sp-dialog" aria-labelledby="sp-detail-title"><div class="sp-dialog-bar"><button type="button" autofocus class="sp-close" aria-label="Close · 关闭">×</button></div><div class="sp-dialog-content"></div></dialog>';
  var dialog = host.querySelector("dialog"), content = host.querySelector(".sp-dialog-content");
  var close = host.querySelector(".sp-close"), trigger = null;
  function field(en, zh, value) { return '<div><dt>' + copy(en,zh) + '</dt><dd>' + bi(value) + '</dd></div>'; }
  function show(e, opener, updateUrl) {
    trigger = opener || document.getElementById("sp-" + e.id);
    var zh = document.body.classList.contains("lang-zh");
    content.innerHTML = '<img class="sp-dialog-cover" alt="' + esc(zh ? e.image.alt.zh : e.image.alt.en) + '" src="' + esc(e.image.file) + '">' +
      '<div class="sp-detail"><span class="sp-focus">' + bi(e.focus) + '</span><h2 id="sp-detail-title">' + bi(e.title) + '</h2><dl>' +
      field("Strength","擅长",e.strength) + field("Limit","局限",e.limit) + field("Funding","公开融资",e.funding) + '</dl>' +
      '<h3>' + copy("Projects, interviews & sources","作品、访谈与来源") + '</h3><ul class="sp-links">' +
      e.links.map(function(l) { return '<li>' + ext(l.url,'<span class="sp-link-role">' + bi(label[l.role]) + '</span>' + bi(l.label) + ' ↗') + '</li>'; }).join("") +
      '</ul><p class="sp-credit">' + copy("Image:","图源：") + ' ' + ext(e.image.source,esc(e.image.credit)) + '</p></div>';
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
    close.focus();
    if (updateUrl) history.replaceState(null,"","#sp-" + e.id);
  }
  function fromHash() {
    var key = (location.hash.match(/^#sp-([a-z0-9-]+)$/) || [])[1], entry = byId.get(key);
    if (entry) show(entry,null,false);
    else if (dialog.open) dialog.close();
  }
  host.addEventListener("click", function(ev) {
    var card = ev.target.closest("[data-sp-card]");
    if (card) {show(byId.get(card.dataset.spCard),card,true);return;}
    var pick = ev.target.closest(".sp-pick");
    if (pick && !(ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.altKey)) {
      ev.preventDefault();
      show(byId.get(pick.hash.slice(4)),pick,true);
    }
  });
  close.addEventListener("click",function(){dialog.close();});
  dialog.addEventListener("click",function(ev){
    if (ev.target !== dialog) return;
    var b = dialog.getBoundingClientRect();
    if (ev.clientX<b.left || ev.clientX>b.right || ev.clientY<b.top || ev.clientY>b.bottom) dialog.close();
  });
  dialog.addEventListener("close",function(){
    if (/^#sp-/.test(location.hash)) history.replaceState(null,"",location.pathname + location.search);
    if (trigger) trigger.focus({preventScroll:true});
  });
  window.addEventListener("hashchange",fromHash);
  fromHash();
})();
