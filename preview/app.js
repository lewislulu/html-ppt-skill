/* html-ppt :: preview site controller.
 *
 * The whole point of this page is that switching a theme must not reload the
 * slide. So the iframe is mounted once per stage and everything after that —
 * theme, language, slide, animation — travels over postMessage to the runtime
 * already living inside it. Reloading would cost a flash of unstyled deck and
 * throw away the animation state you were trying to look at.
 *
 * The receiving ends are:
 *   assets/runtime.js  — preview-goto / preview-theme / preview-replay
 *   assets/i18n.js     — preview-lang
 *   preview/anim-stage.html — the above plus preview-anim / preview-fx
 */
(function () {
  'use strict';

  /* Must match the ANIMS array in assets/runtime.js. */
  const CSS_ANIMS = [
    'fade-up', 'fade-down', 'fade-left', 'fade-right', 'rise-in', 'drop-in',
    'zoom-pop', 'blur-in', 'glitch-in', 'typewriter', 'neon-glow', 'shimmer-sweep',
    'gradient-flow', 'stagger-list', 'counter-up', 'path-draw', 'parallax-tilt',
    'card-flip-3d', 'cube-rotate-3d', 'page-turn-3d', 'perspective-zoom',
    'marquee-scroll', 'kenburns', 'confetti-burst', 'spotlight', 'morph-shape',
    'ripple-reveal'
  ];

  /* Must match FX_LIST in assets/animations/fx-runtime.js (minus _util). */
  const FX_ANIMS = [
    'particle-burst', 'confetti-cannon', 'firework', 'starfield', 'matrix-rain',
    'knowledge-graph', 'neural-net', 'constellation', 'orbit-ring', 'galaxy-swirl',
    'word-cascade', 'letter-explode', 'chain-react', 'magnetic-field', 'data-stream',
    'gradient-blob', 'sparkle-trail', 'shockwave', 'typewriter-multi', 'counter-explosion'
  ];

  const LANGS = ['zh', 'en', 'vi'];
  const DECK = '../examples/demo-deck/index.html';

  /* Starting guess only — the real count is read out of the deck on first load,
     so adding a slide to demo-deck doesn't silently leave it with no dot and
     unreachable by arrow. */
  let SLIDE_COUNT = 8;

  /* The deck's design resolution. Must match .stage-shadow / #stage in app.css. */
  const DESIGN_W = 1280;
  const DESIGN_H = 720;

  /* Flat, in rail order — this is the order the T key cycles through. Built once
     in buildThemeRail(); the id list and lookup map exist so the keyboard path
     neither rebuilds an array nor linear-scans on every repeat. */
  const THEMES = [];
  const THEME_IDS = [];
  const THEME_BY_ID = new Map();

  const state = {
    stage: 'theme',      /* 'theme' | 'anim' */
    theme: 'aurora',
    lang: 'zh',
    slide: 1,            /* 1-based, matches ?preview=N */
    anim: 'fade-up',
    kind: 'css'          /* 'css' | 'fx' */
  };

  const $ = (sel) => document.querySelector(sel);
  const stageEl = $('#stage');
  let frameReady = false;

  /* ------------------------------------------------------------------ hash */

  function readHash() {
    const h = location.hash.replace(/^#/, '');
    if (!h) return;
    const q = new URLSearchParams(h);
    /* Assign both ways. Only ever setting 'anim' here would work on a cold load
       (where the default is already 'theme') but would silently refuse to go
       back to 'theme' when re-reading the hash on a live page. */
    const st = q.get('stage');
    if (st === 'anim' || st === 'theme') state.stage = st;
    if (q.get('theme')) state.theme = q.get('theme');
    if (LANGS.indexOf(q.get('lang')) > -1) state.lang = q.get('lang');
    const n = parseInt(q.get('slide'), 10);
    if (n >= 1 && n <= SLIDE_COUNT) state.slide = n;
    if (q.get('fx')) { state.kind = 'fx'; state.anim = q.get('fx'); }
    else if (q.get('anim')) { state.kind = 'css'; state.anim = q.get('anim'); }
  }

  /* replaceState rather than location.hash, so holding a key doesn't stack up a
     history entry per repeat — and coalesced to one write per frame, because
     Firefox rate-limits the History API (~200 calls / 10s) and key autorepeat
     blows through that in seconds, after which it starts dropping writes and
     the URL silently stops matching the screen. */
  let hashPending = 0;

  function writeHash() {
    if (hashPending) return;
    hashPending = requestAnimationFrame(() => {
      hashPending = 0;
      const q = new URLSearchParams();
      q.set('stage', state.stage);
      q.set('theme', state.theme);
      q.set('lang', state.lang);
      if (state.stage === 'theme') q.set('slide', String(state.slide));
      else q.set(state.kind === 'fx' ? 'fx' : 'anim', state.anim);
      history.replaceState(null, '', '#' + q.toString());
    });
  }

  /* ------------------------------------------------------- iframe plumbing */

  function send(msg) {
    if (!frameReady || !stageEl.contentWindow) return;
    stageEl.contentWindow.postMessage(msg, '*');
  }

  function frameURL() {
    if (state.stage === 'theme') {
      /* runtime.js reads ?preview=N (1-based) and ?theme=; ?lang is read by
         i18n.js. All three are bootstrap values only — later changes go over
         postMessage — but carrying them means "open in a new tab" hands over
         exactly what you were looking at instead of the deck's own default. */
      return DECK + '?preview=' + state.slide + '&theme=' + state.theme +
             '&lang=' + state.lang;
    }
    const key = state.kind === 'fx' ? 'fx' : 'anim';
    return 'anim-stage.html?theme=' + state.theme + '&lang=' + state.lang +
           '&' + key + '=' + state.anim;
  }

  /* Remount the iframe. Only ever called when the *stage* changes — never for a
     theme, language or slide change. */
  function mount() {
    frameReady = false;
    stageEl.src = frameURL();
  }

  stageEl.addEventListener('load', function () {
    frameReady = true;
    /* frameURL() already carries theme/lang/effect, so the iframe boots correct
       on its own; re-sending theme here costs nothing and keeps the deck stage
       right even if a deck ignores ?theme=. */
    send({ type: 'preview-theme', name: state.theme });
    if (state.stage === 'theme') {
      syncSlideCount();
      send({ type: 'preview-goto', idx: state.slide - 1 });
    }
  });

  /* Ask the deck how many slides it actually has. Same-origin, so this is just
     a DOM read. */
  function syncSlideCount() {
    let n = 0;
    try { n = stageEl.contentDocument.querySelectorAll('.deck .slide').length; } catch (e) { return; }
    if (!n || n === SLIDE_COUNT) return;
    SLIDE_COUNT = n;
    buildDots();
    if (state.slide > SLIDE_COUNT) state.slide = SLIDE_COUNT;
    paintDots();
    paintStatus();
  }

  /* --------------------------------------------------------------- actions */

  function setTheme(id, opts) {
    state.theme = id;
    send({ type: 'preview-theme', name: id });
    paintThemeRail();
    paintStatus();
    writeHash();
    if (opts && opts.scroll) scrollThemeIntoView(id);
  }

  function setLang(lang) {
    state.lang = lang;
    send({ type: 'preview-lang', lang: lang });
    paintLang();
    writeHash();
  }

  function setSlide(n) {
    state.slide = Math.min(SLIDE_COUNT, Math.max(1, n));
    send({ type: 'preview-goto', idx: state.slide - 1 });
    paintDots();
    paintStatus();
    writeHash();
  }

  function setAnim(kind, name) {
    state.kind = kind;
    state.anim = name;
    send({ type: kind === 'fx' ? 'preview-fx' : 'preview-anim', name: name });
    paintAnimSelect();
    paintStatus();
    writeHash();
  }

  function setStage(stage) {
    if (state.stage === stage) return;
    state.stage = stage;
    paintStage();
    writeHash();
    paintStatus();
    mount();   /* the only case that legitimately reloads */
  }

  const replay = () => send({ type: 'preview-replay' });

  /* Pasting a shared #hash into an already-open tab (or editing it by hand)
     only changes the fragment — the document is never re-created, so without
     this the URL and the stage would silently drift apart. writeHash() uses
     replaceState, which does not fire hashchange, so there's no feedback loop. */
  function applyHash() {
    const prev = { stage: state.stage, theme: state.theme, lang: state.lang,
                   slide: state.slide, anim: state.anim, kind: state.kind };
    readHash();
    if (!THEME_BY_ID.has(state.theme)) state.theme = prev.theme;

    if (state.stage !== prev.stage) {
      /* readHash has already moved state, so remount straight from it —
         frameURL() carries theme/lang/effect and the load handler pushes the
         rest. Routing through setStage() here would mean shoving state back to
         its old value first just to get past its early-return. */
      paintStage();
      mount();
    } else {
      if (state.theme !== prev.theme) setTheme(state.theme, { scroll: true });
      if (state.lang !== prev.lang) setLang(state.lang);
      if (state.slide !== prev.slide) setSlide(state.slide);
      if (state.anim !== prev.anim || state.kind !== prev.kind) setAnim(state.kind, state.anim);
    }
    repaintAll();
    writeHash();
  }

  /* ----------------------------------------------------------- theme rail */

  function buildThemeRail(groups) {
    const list = $('#theme-list');
    const frag = document.createDocumentFragment();

    groups.forEach((group) => {
      const h = document.createElement('div');
      h.className = 'group-name';
      h.textContent = group.name;
      h.dataset.group = group.name;
      frag.appendChild(h);

      group.themes.forEach((t) => {
        THEMES.push(t);
        THEME_IDS.push(t.id);
        THEME_BY_ID.set(t.id, t);
        const b = document.createElement('button');
        b.className = 'theme-btn';
        b.dataset.id = t.id;
        b.dataset.hay = (t.id + ' ' + t.label + ' ' + (t.note || '')).toLowerCase();
        b.setAttribute('role', 'option');
        b.innerHTML =
          '<span class="swatch" style="background:' + t.bg + '">' +
            '<i style="background:' + t.accent + '"></i>' +
            '<i style="background:' + t.accent2 + '"></i>' +
            '<i style="background:' + t.accent3 + '"></i>' +
          '</span>' +
          '<span class="tb-text">' +
            '<span class="tb-label"></span>' +
            '<span class="tb-note"></span>' +
          '</span>';
        /* textContent, not innerHTML — theme labels/notes are data, and this
           keeps a stray < in a future theme name from breaking the rail. */
        b.querySelector('.tb-label').textContent = t.label;
        b.querySelector('.tb-note').textContent = t.note || t.id;
        b.addEventListener('click', () => setTheme(t.id));
        frag.appendChild(b);
      });
    });

    list.appendChild(frag);
    $('#theme-count').textContent = THEMES.length + ' themes';
  }

  function paintThemeRail() {
    document.querySelectorAll('.theme-btn').forEach((b) =>
      b.classList.toggle('is-active', b.dataset.id === state.theme));
  }

  function scrollThemeIntoView(id) {
    const b = document.querySelector('.theme-btn[data-id="' + id + '"]');
    if (b) b.scrollIntoView({ block: 'nearest' });
  }

  function filterThemes(q) {
    q = q.trim().toLowerCase();
    document.querySelectorAll('.theme-btn').forEach((b) => {
      b.hidden = q ? b.dataset.hay.indexOf(q) === -1 : false;
    });
    /* Hide a group heading whose themes are all filtered out. */
    document.querySelectorAll('.group-name').forEach((h) => {
      let n = h.nextElementSibling, any = false;
      while (n && n.classList.contains('theme-btn')) {
        if (!n.hidden) { any = true; break; }
        n = n.nextElementSibling;
      }
      h.hidden = !any;
    });
  }

  /* -------------------------------------------------------------- painting */

  function buildDots() {
    const wrap = $('#slide-dots');
    wrap.textContent = '';   /* rebuilt whenever the deck reports a new count */
    for (let i = 1; i <= SLIDE_COUNT; i++) {
      const b = document.createElement('button');
      b.className = 'dot';
      b.textContent = String(i);
      b.dataset.n = String(i);
      b.addEventListener('click', () => setSlide(i));
      wrap.appendChild(b);
    }
  }

  function paintDots() {
    document.querySelectorAll('.dot').forEach((d) =>
      d.classList.toggle('is-active', +d.dataset.n === state.slide));
  }

  function buildAnimSelect() {
    const sel = $('#anim-select');
    const mk = (label, items, kind) => {
      const g = document.createElement('optgroup');
      g.label = label;
      items.forEach((name) => {
        const o = document.createElement('option');
        o.value = kind + ':' + name;
        o.textContent = name;
        g.appendChild(o);
      });
      return g;
    };
    sel.appendChild(mk('CSS · data-anim (' + CSS_ANIMS.length + ')', CSS_ANIMS, 'css'));
    sel.appendChild(mk('Canvas FX · data-fx (' + FX_ANIMS.length + ')', FX_ANIMS, 'fx'));
    sel.addEventListener('change', () => {
      const [kind, name] = sel.value.split(':');
      setAnim(kind, name);
    });
  }

  function paintAnimSelect() { $('#anim-select').value = state.kind + ':' + state.anim; }

  function paintLang() {
    document.querySelectorAll('.seg-btn[data-lang]').forEach((b) =>
      b.classList.toggle('is-active', b.dataset.lang === state.lang));
  }

  /* Which controls belong to the current stage. Shared by the tab buttons, the
     hash handler and boot — all three used to spell this out separately. */
  function paintStage() {
    $('#slide-group').hidden = (state.stage !== 'theme');
    $('#anim-group').hidden = (state.stage !== 'anim');
    $('#k-nav').textContent = (state.stage === 'theme') ? 'slide' : 'effect';
    document.querySelectorAll('.seg-btn[data-stage]').forEach((b) =>
      b.classList.toggle('is-active', b.dataset.stage === state.stage));
  }

  function repaintAll() {
    paintStage(); paintThemeRail(); paintDots();
    paintAnimSelect(); paintLang(); paintStatus();
  }

  function paintStatus() {
    const t = THEME_BY_ID.get(state.theme);
    $('#s-theme').textContent = state.theme;
    $('#s-note').textContent = t ? '— ' + t.label : '';
    $('#s-ctx').textContent = (state.stage === 'theme')
      ? 'slide ' + state.slide + ' / ' + SLIDE_COUNT
      : (state.kind === 'fx' ? 'data-fx="' : 'data-anim="') + state.anim + '"';
  }

  /* --------------------------------------------------------------- scaling */

  /* The deck is authored at 1280×720 and must be *shown* at 1280×720, then
     scaled as a whole — so what you review is the real layout, not a reflow.
     Refs are resolved once: a ResizeObserver fires continuously while a window
     is being dragged, and this is the only thing on that path. */
  const stageWrap = $('#stage-wrap');
  const stageShadow = $('#stage-shadow');

  function fitStage() {
    const pad = 44;
    const scale = Math.max(0.1, Math.min(
      (stageWrap.clientWidth - pad) / DESIGN_W,
      (stageWrap.clientHeight - pad) / DESIGN_H
    ));
    stageShadow.style.transform = 'scale(' + scale + ')';
    /* Reserve the *scaled* footprint so flex centring has honest numbers to
       work with; transform alone doesn't affect layout size. */
    stageShadow.style.margin =
      Math.round(DESIGN_H * (scale - 1) / 2) + 'px ' +
      Math.round(DESIGN_W * (scale - 1) / 2) + 'px';
  }

  /* ------------------------------------------------------------- keyboard */

  function cycle(arr, cur, dir) {
    const i = arr.indexOf(cur);
    return arr[(i + dir + arr.length) % arr.length];
  }

  function onKey(e) {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    const k = e.key.toLowerCase();

    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const dir = e.key === 'ArrowRight' ? 1 : -1;
      if (state.stage === 'theme') setSlide(state.slide + dir);
      else {
        const all = CSS_ANIMS.map(n => 'css:' + n).concat(FX_ANIMS.map(n => 'fx:' + n));
        const [kind, name] = cycle(all, state.kind + ':' + state.anim, dir).split(':');
        setAnim(kind, name);
      }
      e.preventDefault();
    } else if (k === 't') {
      setTheme(cycle(THEME_IDS, state.theme, e.shiftKey ? -1 : 1), { scroll: true });
    } else if (k === 'l') {
      setLang(cycle(LANGS, state.lang, e.shiftKey ? -1 : 1));
    } else if (k === 'r') {
      replay();
    }
  }

  /* ------------------------------------------------------------------ boot */

  fetch('themes.json')
    .then((r) => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then((data) => {
      readHash();
      buildThemeRail(data.groups);

      /* A stale or hand-edited hash shouldn't leave the rail with nothing lit. */
      if (!THEME_BY_ID.has(state.theme)) state.theme = THEME_IDS[0];

      buildDots();
      buildAnimSelect();

      document.querySelectorAll('.seg-btn[data-stage]').forEach((b) =>
        b.addEventListener('click', () => setStage(b.dataset.stage)));
      document.querySelectorAll('.seg-btn[data-lang]').forEach((b) =>
        b.addEventListener('click', () => setLang(b.dataset.lang)));

      $('#theme-search').addEventListener('input', (e) => filterThemes(e.target.value));
      $('#replay').addEventListener('click', replay);
      $('#open-new').addEventListener('click', () => window.open(frameURL(), '_blank', 'noopener'));

      repaintAll();
      scrollThemeIntoView(state.theme);

      mount();
      fitStage();
      new ResizeObserver(fitStage).observe(stageWrap);
      addEventListener('keydown', onKey);
      addEventListener('hashchange', applyHash);
    })
    .catch((err) => {
      /* Nearly always the file:// case: fetch() of a local JSON is blocked, so
         the rail can never populate. Say so plainly instead of showing an
         empty panel that looks like a hang. */
      document.body.innerHTML =
        '<div style="margin:auto;padding:40px;max-width:560px;font-family:system-ui;color:#e6e8ef">' +
        '<h1 style="font-size:18px">Could not load themes.json</h1>' +
        '<p style="color:#9aa1b1;line-height:1.6">' + String(err.message) + '</p>' +
        '<p style="color:#9aa1b1;line-height:1.6">This page needs to be served over HTTP — ' +
        'opening it straight from the filesystem blocks both the theme catalog and the ' +
        'translation files. Try <code style="color:#e6e8ef">python3 -m http.server</code> ' +
        'from the repository root, then open ' +
        '<code style="color:#e6e8ef">http://localhost:8000/preview/</code>.</p></div>';
    });
})();
