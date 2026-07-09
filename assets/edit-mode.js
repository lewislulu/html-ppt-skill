/* html-ppt :: edit-mode.js
 * In-browser text editing + save-back-to-file for static decks. Zero dependencies.
 *
 * Usage:
 *   1. Include as the LAST script tag in <body> (after runtime.js and any inline scripts):
 *        <script src="../../assets/edit-mode.js"></script>
 *   2. Open the deck with ?edit appended, e.g.  index.html?edit  or  index.html?edit#/3
 *   3. Double-click any text to edit. Esc or click elsewhere to finish. 💾 saves.
 *   4. ✨ 动画: click the button, then click an element — pick one of the CSS entry
 *      animations (hover an item to live-preview, click to apply, 无 removes).
 *   5. 🎇 特效: pick a canvas FX (data-fx) for the CURRENT slide, hover previews.
 *   6. 🧩 组件: click a card / list item / pill — hide/show (persists as
 *      data-em-hidden + a self-contained style rule written on save), duplicate
 *      (placeholder text), or delete it. 选父级 widens the selection.
 *   Works with html-ppt decks (.deck/.slide) and frontend-slides decks
 *   (.deck-stage/.slide) alike. Without ?edit the script is completely inert.
 *
 * Saving:
 *   Primary: File System Access API (Chrome, works on file:// too). The first save asks
 *   you to pick THIS html file once; later saves write silently through the same handle.
 *   Fallback (no FSA / write failed): downloads a replacement html file — overwrite the
 *   original manually.
 *
 * How clean output is produced:
 *   This script runs synchronously at the end of <body>, BEFORE runtime.js's
 *   DOMContentLoaded work injects chrome (progress bar, overview, is-active classes,
 *   counter rewrites). It snapshots the pristine DOM into a detached "clean copy"
 *   (DOMParser, scripts never execute) and mirrors every committed edit onto it.
 *   Saving serializes the clean copy — runtime state never leaks into the file.
 *
 * Note: the first save normalizes the HTML through one DOM parse/serialize round-trip
 *   (e.g. bare attributes like `data-anim-target` become `data-anim-target=""`).
 *   Commit once after the first save to keep later diffs text-only.
 */
(function () {
  'use strict';
  if (!/[?&]edit(?:[=&]|$)/.test(location.search)) return;
  if (/[?&]preview=\d/.test(location.search)) return;

  /* ===== pristine snapshot → clean copy (must happen before DOMContentLoaded) ===== */
  function doctypeStr(dt) {
    if (!dt) return '<!DOCTYPE html>';
    let s = '<!DOCTYPE ' + dt.name;
    if (dt.publicId) s += ' PUBLIC "' + dt.publicId + '"';
    else if (dt.systemId) s += ' SYSTEM';
    if (dt.systemId) s += ' "' + dt.systemId + '"';
    return s + '>';
  }
  const snapshot = doctypeStr(document.doctype) + '\n' + document.documentElement.outerHTML;
  const cleanDoc = new DOMParser().parseFromString(snapshot, 'text/html');
  /* live→clean node map, built while both trees are still element-identical
   * (fx-runtime's injected scripts are present in BOTH at this point — they are
   * removed from the clean copy right below, which detaches only their twins).
   * Node references survive any later DOM drift (runtime chrome, fx canvases). */
  const twin = new WeakMap();
  (function () {
    const a = document.querySelectorAll('*'), b = cleanDoc.querySelectorAll('*');
    if (a.length === b.length) for (let i = 0; i < a.length; i++) twin.set(a[i], b[i]);
    else console.warn('[edit-mode] live/clean 元素数不一致(' + a.length + ' vs ' + b.length + '),动画挑选不可用');
  })();
  /* fx-runtime.js injects its module <script> tags into <head> at parse time
   * (before this snapshot) and marks them data-runtime-injected — drop them. */
  cleanDoc.querySelectorAll('[data-runtime-injected]').forEach(el => el.remove());

  /* ===== editable element collection =====
   * Same selector + filters applied to the live deck and the clean copy yield
   * position-aligned lists (both trees are identical at snapshot time, and neither
   * runtime.js nor fx-runtime.js adds matching elements inside .deck).
   * Excluded: .counter (runtime rewrites its text; value lives in data-to),
   * .slide-number (attr-driven), and anything containing those or [data-anim]
   * descendants (their live innerHTML carries runtime-injected anim-* classes). */
  const SEL = 'h1,h2,h3,h4,h5,h6,p,li,blockquote,figcaption,dt,dd,th,td,span,a,b,strong,em,code,small';
  /* Deck container: .deck (html-ppt) or .deck-stage (frontend-slides). */
  function deckEl(root) {
    return root.querySelector('.deck, .deck-stage');
  }
  function collect(root) {
    const deck = deckEl(root);
    if (!deck) return [];
    return Array.from(deck.querySelectorAll(SEL)).filter(el =>
      !el.classList.contains('counter') &&
      !el.classList.contains('slide-number') &&
      !el.querySelector('.counter, [data-anim]'));
  }
  function markEditables() {
    collect(document).forEach(el => el.setAttribute('data-em-edit', ''));
  }
  markEditables();

  /* ===== edit state ===== */
  const dirty = new Set();      /* live elements with committed, unsaved changes */
  let editing = null;
  let preHTML = '';
  let fileHandle = null;
  let exitArmed = false;

  try { document.execCommand('defaultParagraphSeparator', false, 'br'); } catch (e) {}

  function startEdit(el) {
    if (editing === el) return;
    if (editing) endEdit();
    editing = el;
    preHTML = el.innerHTML;
    el.setAttribute('contenteditable', 'true');
    el.classList.add('em-editing');
    el.focus();
  }
  function endEdit() {
    if (!editing) return;
    const el = editing;
    editing = null;
    el.removeAttribute('contenteditable');
    el.classList.remove('em-editing');
    if (el.innerHTML !== preHTML) {
      dirty.add(el);
      markEditables(); /* elements created while editing become editable too */
    }
    exitArmed = false;
    updateStatus();
  }

  document.addEventListener('dblclick', e => {
    const t = e.target.closest('[data-em-edit]');
    if (!t) return;
    e.preventDefault();
    startEdit(t);
  });
  document.addEventListener('focusout', e => {
    if (e.target === editing) endEdit();
  });
  /* While typing, keep keystrokes away from runtime.js deck navigation. */
  document.addEventListener('keydown', e => {
    if (editing) {
      if (e.key === 'Escape') { e.preventDefault(); endEdit(); }
      e.stopPropagation();
      return;
    }
    if (e.key === 'Escape' && (picking || panelMode)) {
      e.stopPropagation();
      closePickUI();
      updateStatus();
      return;
    }
    /* Runtime's A key writes a random data-anim to the live DOM only — the
     * clean copy would no longer align and save would refuse. Swallow it. */
    if ((e.key === 'a' || e.key === 'A') && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.stopPropagation();
      status('编辑模式下 A 键随机动画已禁用,请用 ✨ 动画面板');
    }
    /* Runtime's overview grid is a boot-time clone of the slides — component
     * ops (hide/dup/delete) would show stale there. Keep it closed while editing. */
    if ((e.key === 'o' || e.key === 'O') && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.stopPropagation();
      status('编辑模式下概览已禁用(缩略图不随编辑刷新)');
    }
  }, true);
  /* Paste as plain text so foreign markup/styles never enter the deck. */
  document.addEventListener('paste', e => {
    if (!editing) return;
    e.preventDefault();
    const txt = e.clipboardData ? e.clipboardData.getData('text/plain') : '';
    document.execCommand('insertText', false, txt);
  });

  /* ===== sync committed edits onto the clean copy ===== */
  function syncDirty() {
    const live = collect(document);
    const clean = collect(cleanDoc);
    if (live.length !== clean.length) {
      throw new Error('结构对不上(live ' + live.length + ' vs clean ' + clean.length + '),拒绝保存以免写坏文件');
    }
    dirty.forEach(el => {
      const i = live.indexOf(el);
      if (i === -1) dirty.delete(el); /* detached: an ancestor edit already covers it */
    });
    /* Apply children before ancestors (descending index): an ancestor's live
     * innerHTML already contains its edited descendants, so the last write wins
     * and detached-clean-node updates are never lost. */
    [...dirty]
      .map(el => ({ el, i: live.indexOf(el) }))
      .sort((a, b) => b.i - a.i)
      .forEach(({ el, i }) => {
        clean[i].innerHTML = el.innerHTML;
        /* edit-mode's own transient classes/attrs must never reach the file */
        clean[i].querySelectorAll('.em-selected, .em-pick, .em-editing').forEach(d => {
          d.classList.remove('em-selected', 'em-pick', 'em-editing');
          if (!d.getAttribute('class')) d.removeAttribute('class');
        });
        clean[i].querySelectorAll('[data-em-edit]').forEach(d => d.removeAttribute('data-em-edit'));
      });
  }
  function serialize() {
    syncDirty();
    /* Hidden components persist as data-em-hidden; the file must carry its own
     * rule (self-contained — works in any deck, no shared-CSS dependency). */
    const needHide = cleanDoc.querySelector('[data-em-hidden]');
    let hideStyle = cleanDoc.querySelector('style[data-em-hide-style]');
    if (needHide && !hideStyle) {
      hideStyle = cleanDoc.createElement('style');
      hideStyle.setAttribute('data-em-hide-style', '');
      hideStyle.textContent = '[data-em-hidden]{display:none!important}';
      cleanDoc.head.appendChild(hideStyle);
    } else if (!needHide && hideStyle) {
      hideStyle.remove();
    }
    return doctypeStr(cleanDoc.doctype) + '\n' + cleanDoc.documentElement.outerHTML + '\n';
  }

  /* ===== animation & fx picking ===== */
  const ANIM_GROUPS = [
    ['方向淡入', ['fade-up', 'fade-down', 'fade-left', 'fade-right']],
    ['强势入场', ['rise-in', 'drop-in', 'zoom-pop', 'blur-in', 'glitch-in']],
    ['文字效果', ['typewriter', 'neon-glow', 'shimmer-sweep', 'gradient-flow']],
    ['列表', ['stagger-list']],
    ['SVG/形状', ['path-draw', 'morph-shape']],
    ['3D/透视', ['parallax-tilt', 'card-flip-3d', 'cube-rotate-3d', 'page-turn-3d', 'perspective-zoom']],
    ['持续/氛围', ['marquee-scroll', 'kenburns', 'confetti-burst', 'spotlight', 'ripple-reveal']],
  ];
  const FX_NAMES = [
    'particle-burst', 'confetti-cannon', 'firework', 'starfield', 'matrix-rain',
    'knowledge-graph', 'neural-net', 'constellation', 'orbit-ring', 'galaxy-swirl',
    'word-cascade', 'letter-explode', 'chain-react', 'magnetic-field', 'data-stream',
    'gradient-blob', 'sparkle-trail', 'shockwave', 'typewriter-multi', 'counter-explosion',
  ];

  const attrDirty = new Set();  /* live elements with unsaved data-anim/data-fx/data-em-hidden changes */
  let picking = false;          /* false | 'anim' | 'comp' — waiting for an element click */
  let selected = null;          /* anim/comp mode: chosen element */
  let panelMode = null;         /* null | 'anim' | 'fx' | 'comp' */
  let fxTargetEl = null;        /* fx mode: element carrying data-fx */
  let preview = null;           /* { el, attr, restore } while hovering a panel item */

  /* Resolve the clean-copy twin. Falls back to walking child indices down from
   * the nearest ancestor whose twin is still attached — valid because callers
   * flush text edits (syncDirty) first, making the two subtrees identical. */
  function resolveTwin(el) {
    const direct = twin.get(el);
    if (direct && cleanDoc.documentElement.contains(direct)) return direct;
    const path = [];
    let n = el;
    while (n) {
      const t = twin.get(n);
      if (t && cleanDoc.documentElement.contains(t)) {
        let c = t;
        for (const i of path) { c = c.children[i]; if (!c) return null; }
        if (c.tagName !== el.tagName) return null;
        twin.set(el, c);
        return c;
      }
      const p = n.parentElement;
      if (!p) return null;
      path.unshift(Array.prototype.indexOf.call(p.children, n));
      n = p;
    }
    return null;
  }
  /* Flush pending text edits so live/clean subtrees match before attribute work. */
  function flushForAttrEdit() {
    try { syncDirty(); return true; }
    catch (e) { status(e.message, 'err'); return false; }
  }

  function currentAnim(el) {
    const a = el.getAttribute('data-anim');
    if (a) return a;
    const cls = [...el.classList].find(x => x.startsWith('anim-'));
    return cls ? cls.slice(5) : '';
  }
  function applyAnim(el, name) {
    if (!flushForAttrEdit()) return false;
    const c = resolveTwin(el);
    if (!c) { status('干净副本里找不到该元素,请先保存并刷新', 'err'); return false; }
    [el, c].forEach(node => {
      [...node.classList].filter(x => x.startsWith('anim-')).forEach(x => node.classList.remove(x));
      if (name) {
        node.setAttribute('data-anim', name);
        node.classList.add('anim-' + name);
      } else {
        node.removeAttribute('data-anim');
      }
      if (!node.getAttribute('class')) node.removeAttribute('class');
    });
    void el.offsetWidth; /* replay entry animation as feedback */
    attrDirty.add(el);
    markEditables(); /* [data-anim] containment affects what is text-editable */
    updateStatus();
    return true;
  }
  function previewAnim(el, name) {
    stopPreview();
    const saved = el.getAttribute('class');
    preview = {
      el,
      restore() {
        if (saved === null) el.removeAttribute('class');
        else el.setAttribute('class', saved);
      },
    };
    [...el.classList].filter(x => x.startsWith('anim-')).forEach(x => el.classList.remove(x));
    void el.offsetWidth;
    if (name) el.classList.add('anim-' + name);
  }

  /* fx lifecycle for a single element (fx-runtime's reinit works per-root). */
  function fxStop(el) {
    const m = window.__hpxActive;
    if (!m) return;
    const h = m.get(el);
    if (h && typeof h.stop === 'function') { try { h.stop(); } catch (e) {} }
    m.delete(el);
  }
  function fxStart(el) {
    const m = window.__hpxActive, name = el.getAttribute('data-fx');
    if (!m || !window.HPX || !name) return;
    const fn = window.HPX[name];
    if (typeof fn !== 'function' || m.has(el)) return;
    try { m.set(el, fn(el, {}) || { stop() {} }); } catch (e) {}
  }
  function setFxLive(el, name) {
    fxStop(el);
    if (name) el.setAttribute('data-fx', name);
    else el.removeAttribute('data-fx');
    fxStart(el);
  }
  function applyFx(el, name) {
    if (!flushForAttrEdit()) return false;
    const c = resolveTwin(el);
    if (!c) { status('干净副本里找不到该元素,请先保存并刷新', 'err'); return false; }
    setFxLive(el, name);
    if (name) c.setAttribute('data-fx', name);
    else c.removeAttribute('data-fx');
    attrDirty.add(el);
    updateStatus();
    return true;
  }
  function previewFx(el, name) {
    stopPreview();
    const saved = el.getAttribute('data-fx');
    preview = {
      el,
      restore() { setFxLive(el, saved || ''); },
    };
    setFxLive(el, name);
  }
  function stopPreview() {
    if (!preview) return;
    const p = preview;
    preview = null;
    p.restore();
  }

  function activeSlide() {
    const d = deckEl(document);
    if (!d) return null;
    return d.querySelector(':scope > .slide.is-active, :scope > .slide.active') ||
           d.querySelector(':scope > .slide');
  }
  /* The element on this slide that carries (or should carry) data-fx. */
  function fxTarget(slide) {
    if (!slide) return null;
    if (slide.matches('[data-fx]')) return slide;
    return slide.querySelector('[data-fx]') || slide;
  }

  /* ===== component mode: hide/show, duplicate, delete (cards / list items / pills) ===== */
  let structDirty = 0;         /* unsaved structural changes (dup/delete) */

  function classSig(el) {
    return el.tagName + '|' + [...el.classList].filter(c => !/^(em-|anim-)/.test(c)).sort().join('.');
  }
  /* Component root: nearest ancestor (from el up, staying inside the slide)
   * that has a sibling with the same tag + class signature — i.e. part of a
   * repeating structure (cards in a grid, li in a list, pills in a row).
   * Falls back to the clicked element itself. */
  function componentRoot(el) {
    const slide = el.closest('.slide');
    let n = el;
    while (n && n !== slide) {
      const p = n.parentElement;
      if (!p) break;
      const sig = classSig(n);
      if ([...p.children].some(s => s !== n && classSig(s) === sig)) return n;
      if (p === slide) break;
      n = p;
    }
    return el;
  }
  function describe(el) {
    const cls = [...el.classList].filter(c => !/^(em-|anim-)/.test(c)).slice(0, 2).join('.');
    return '<' + el.tagName.toLowerCase() + (cls ? '.' + cls : '') + '>';
  }

  function compToggleHidden(el) {
    if (!flushForAttrEdit()) return false;
    const c = resolveTwin(el);
    if (!c) { status('干净副本里找不到该元素,请先保存并刷新', 'err'); return false; }
    const on = el.hasAttribute('data-em-hidden');
    [el, c].forEach(n => on ? n.removeAttribute('data-em-hidden') : n.setAttribute('data-em-hidden', ''));
    attrDirty.add(el);
    updateStatus();
    return true;
  }
  function placeholderize(root) {
    [root, ...root.querySelectorAll('*')].forEach(n => {
      /* .counter text is runtime-rewritten from data-to (a placeholder would be
       * animated straight back to the number, and .counter is not text-editable);
       * .slide-number is attribute-driven. Keep both as-is. */
      if (n.classList.contains('counter') || n.classList.contains('slide-number')) return;
      if (!n.children.length && n.textContent.trim()) n.textContent = '待填写';
    });
  }
  function pairTwins(liveRoot, cleanRoot) {
    const a = [liveRoot, ...liveRoot.querySelectorAll('*')];
    const b = [cleanRoot, ...cleanRoot.querySelectorAll('*')];
    if (a.length === b.length) for (let i = 0; i < a.length; i++) twin.set(a[i], b[i]);
  }
  /* Insert a placeholder copy after el. The copy is cloned from the CLEAN twin
   * (never from the live node — that could carry runtime-injected canvases or
   * rewritten counter text) and imported into the live document, so both trees
   * stay element-identical. */
  function compDuplicate(el) {
    if (!flushForAttrEdit()) return null;
    const c = resolveTwin(el);
    if (!c) { status('干净副本里找不到该元素,请先保存并刷新', 'err'); return null; }
    const cleanClone = c.cloneNode(true);
    if (cleanClone.id) cleanClone.removeAttribute('id');
    cleanClone.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
    placeholderize(cleanClone);
    const liveClone = document.importNode(cleanClone, true);
    c.after(cleanClone);
    el.after(liveClone);
    pairTwins(liveClone, cleanClone);
    /* only start fx when the clone is on the visible slide — fx-runtime will
     * init it on slide activation otherwise */
    const slideOfClone = liveClone.closest('.slide');
    if (!slideOfClone || slideOfClone.classList.contains('is-active') || slideOfClone.classList.contains('active')) {
      if (liveClone.matches('[data-fx]')) fxStart(liveClone);
      liveClone.querySelectorAll('[data-fx]').forEach(fxStart);
    }
    structDirty++;
    markEditables();
    updateStatus();
    return liveClone;
  }
  function compDelete(el) {
    if (!flushForAttrEdit()) return false;
    const c = resolveTwin(el);
    if (!c) { status('干净副本里找不到该元素,请先保存并刷新', 'err'); return false; }
    if (el.matches('[data-fx]')) fxStop(el);
    el.querySelectorAll('[data-fx]').forEach(fxStop);
    [dirty, attrDirty].forEach(set => set.forEach(n => { if (n === el || el.contains(n)) set.delete(n); }));
    el.remove();
    c.remove();
    structDirty++;
    markEditables(); /* ancestors excluded for containing .counter/[data-anim] may free up */
    updateStatus();
    return true;
  }

  /* ===== pick-mode + panel UI (built after the toolbar, see below) ===== */
  let panel, panelTitle, panelHint, panelList;

  function closePickUI() {
    stopPreview();
    picking = false;
    panelMode = null;
    fxTargetEl = null;
    if (selected) { selected.classList.remove('em-selected'); selected = null; }
    document.querySelectorAll('.em-pick').forEach(el => el.classList.remove('em-pick'));
    document.documentElement.classList.remove('em-picking');
    if (panel) panel.style.display = 'none';
    syncModeBtns();
  }

  function renderPanel(title, hint, groups, current, onHover, onPick) {
    panelTitle.textContent = title;
    panelHint.textContent = hint || '';
    panelHint.style.display = hint ? '' : 'none';
    panelList.textContent = '';
    const mkItem = (label, value) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'em-item' + (value === current ? ' em-cur' : '');
      b.textContent = (value === current ? '✓ ' : '') + label;
      b.addEventListener('mouseenter', () => onHover(value));
      b.addEventListener('mouseleave', stopPreview);
      b.addEventListener('click', () => {
        stopPreview();
        if (onPick(value)) renderPanel(title, hint, groups, value, onHover, onPick);
      });
      return b;
    };
    panelList.appendChild(mkItem('无(移除)', ''));
    groups.forEach(([g, names]) => {
      if (g) {
        const h = document.createElement('div');
        h.className = 'em-group';
        h.textContent = g;
        panelList.appendChild(h);
      }
      names.forEach(n => panelList.appendChild(mkItem(n, n)));
    });
    panel.style.display = 'flex';
  }

  function openAnimPanel(el) {
    selected = el;
    el.classList.add('em-selected');
    let hint = '';
    if (el.matches('.anim-stagger-list, [data-anim="stagger-list"]')) {
      hint = '这是 stagger 列表容器:动画逐个作用于它的子元素';
    } else if (el.closest('.anim-stagger-list, [data-anim="stagger-list"]') !== el && el.closest('.anim-stagger-list, [data-anim="stagger-list"]')) {
      hint = '注意:父容器带 stagger-list,子元素入场已由父级控制';
    }
    panelMode = 'anim';
    renderPanel(
      '✨ 动画 · <' + el.tagName.toLowerCase() + '>',
      hint,
      ANIM_GROUPS,
      currentAnim(el),
      name => previewAnim(el, name),
      name => applyAnim(el, name)
    );
  }

  function openCompPanel(el, armed) {
    selected = el;
    el.classList.add('em-selected');
    panelMode = 'comp';
    panelTitle.textContent = '🧩 组件 · ' + describe(el);
    const p = el.parentElement;
    const group = p ? [...p.children].filter(s => classSig(s) === classSig(el)).length : 1;
    panelHint.textContent = group > 1 ? '同组共 ' + group + ' 项(同 tag+class 兄弟)' : '独立元素(无同构兄弟)';
    panelHint.style.display = '';
    panelList.textContent = '';
    const mkBtn = (label, fn, danger) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'em-item' + (danger ? ' em-danger' : '');
      b.textContent = label;
      b.addEventListener('click', fn);
      panelList.appendChild(b);
    };
    const hidden = el.hasAttribute('data-em-hidden');
    mkBtn(hidden ? '👁 显示(取消隐藏)' : '🙈 隐藏(保留在文件里,放映不显示)', () => {
      if (compToggleHidden(el)) openCompPanel(el);
    });
    mkBtn('⧉ 复制一份(文字置占位)', () => {
      const clone = compDuplicate(el);
      if (clone) {
        el.classList.remove('em-selected');
        openCompPanel(clone);
        status('已在后面插入副本,双击改文字');
      }
    });
    mkBtn(armed ? '⚠️ 再点一次确认删除' : '🗑 删除', () => {
      if (!armed) { openCompPanel(el, true); return; }
      if (compDelete(el)) {
        closePickUI();
        picking = 'comp';
        document.documentElement.classList.add('em-picking');
        syncModeBtns();
        status('已删除,可继续点选组件(保存前刷新可恢复)');
      }
    }, true);
    if (p && !p.matches('.slide') && p.closest('.slide')) {
      mkBtn('⬆ 选父级 ' + describe(p), () => {
        el.classList.remove('em-selected');
        openCompPanel(p);
      });
    }
    panel.style.display = 'flex';
  }

  function openFxPanel() {
    const slide = activeSlide();
    fxTargetEl = fxTarget(slide);
    if (!fxTargetEl) { status('找不到当前页', 'err'); return; }
    const n = Array.prototype.indexOf.call(deckEl(document).querySelectorAll(':scope > .slide'), slide) + 1;
    const hint = window.HPX
      ? (fxTargetEl === slide ? '作用于整页背景' : '作用于本页的特效容器')
      : '⚠️ 该 deck 未引入 fx-runtime.js,选择会写入文件但当前不渲染';
    panelMode = 'fx';
    renderPanel(
      '🎇 特效 · 第 ' + n + ' 页',
      hint,
      [['', FX_NAMES]],
      fxTargetEl.getAttribute('data-fx') || '',
      name => previewFx(fxTargetEl, name),
      name => applyFx(fxTargetEl, name)
    );
  }

  /* pick-mode pointer handling (capture: keep clicks away from deck/links) */
  function pickTarget(n) {
    if (!(n instanceof Element)) return null;
    if (n.closest('.em-bar, .em-panel')) return null;
    if (n.tagName === 'CANVAS') n = n.parentElement;
    const slide = n.closest('.deck .slide, .deck-stage .slide');
    if (!slide || n === slide) return null;
    return n;
  }
  document.addEventListener('click', e => {
    if (!picking) return;
    if (e.target.closest('.em-bar, .em-panel')) return;
    e.preventDefault();
    e.stopPropagation();
    const t = pickTarget(e.target);
    if (!t) { status('请点击页面内的具体元素'); return; }
    stopPreview();
    if (selected) selected.classList.remove('em-selected');
    if (picking === 'comp') openCompPanel(componentRoot(t));
    else openAnimPanel(t);
  }, true);
  document.addEventListener('mouseover', e => {
    if (!picking) return;
    const t = pickTarget(e.target);
    if (t) t.classList.add('em-pick');
  });
  document.addEventListener('mouseout', e => {
    if (!picking) return;
    if (e.target instanceof Element) e.target.closest('.em-pick')?.classList.remove('em-pick');
  });

  /* ===== save ===== */
  const basename = decodeURIComponent(location.pathname.split('/').pop()) || 'index.html';

  async function pickFile() {
    const [handle] = await window.showOpenFilePicker({
      types: [{ description: 'HTML', accept: { 'text/html': ['.html', '.htm'] } }],
    });
    if (handle.name !== basename) {
      const err = new Error('选中的是 ' + handle.name + ',与当前页面 ' + basename + ' 不符,已取消');
      err.name = 'WrongFileError';
      throw err;
    }
    return handle;
  }
  function download(html) {
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = basename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
  async function save() {
    if (editing) endEdit();
    closePickUI(); /* selection/preview state must not leak into the file */
    let html;
    try { html = serialize(); }
    catch (e) { status(e.message, 'err'); return; }

    if (typeof window.showOpenFilePicker === 'function') {
      try {
        if (!fileHandle) fileHandle = await pickFile();
        const w = await fileHandle.createWritable();
        await w.write(html);
        await w.close();
        dirty.clear();
        attrDirty.clear();
        structDirty = 0;
        status('已保存 ' + new Date().toLocaleTimeString(), 'ok');
        return;
      } catch (e) {
        if (e.name === 'AbortError') { status('已取消'); return; }
        if (e.name === 'WrongFileError') { status(e.message, 'err'); return; }
        fileHandle = null;
        status('直写失败(' + e.name + '),改用下载', 'warn');
      }
    }
    download(html);
    dirty.clear();
    attrDirty.clear();
    structDirty = 0;
    status('已下载 ' + basename + ',请手动覆盖原文件', 'warn');
  }

  /* ===== toolbar ===== */
  const css = document.createElement('style');
  css.textContent = [
    '[data-em-edit]:hover{outline:1.5px dashed rgba(255,171,0,.85);outline-offset:2px;cursor:text}',
    '.em-editing{outline:2px solid #ffab00 !important;outline-offset:2px;cursor:text}',
    '.em-bar{position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:2147483000;',
    ' display:flex;align-items:center;gap:10px;padding:7px 12px;border-radius:10px;',
    ' background:rgba(18,20,28,.92);color:#e6edf3;box-shadow:0 4px 16px rgba(0,0,0,.4);',
    ' font:12px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans SC",sans-serif}',
    '.em-bar b{font-weight:700;letter-spacing:.08em}',
    '.em-status{color:#8b949e;max-width:340px}',
    '.em-status.ok{color:#3fb950}.em-status.warn{color:#f0883e}.em-status.err{color:#f85149}',
    '.em-btn{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#e6edf3;',
    ' padding:4px 10px;border-radius:6px;font:inherit;cursor:pointer}',
    '.em-btn:hover{background:rgba(88,166,255,.2);border-color:#58a6ff}',
    '.em-btn.em-on{background:rgba(255,171,0,.25);border-color:#ffab00}',
    '.em-picking .deck *{cursor:crosshair !important}',
    '.em-pick{outline:1.5px dashed rgba(88,166,255,.9) !important;outline-offset:2px}',
    '.em-selected{outline:2px solid #58a6ff !important;outline-offset:3px}',
    '.em-panel{position:fixed;top:60px;right:14px;z-index:2147483000;width:230px;max-height:76vh;',
    ' display:none;flex-direction:column;border-radius:10px;overflow:hidden;',
    ' background:rgba(18,20,28,.95);color:#e6edf3;box-shadow:0 4px 16px rgba(0,0,0,.45);',
    ' font:12px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans SC",sans-serif}',
    '.em-panel-title{padding:9px 12px 4px;font-weight:700}',
    '.em-panel-hint{padding:0 12px 6px;color:#f0883e}',
    '.em-panel-list{overflow-y:auto;padding:0 8px 10px}',
    '.em-group{padding:8px 4px 3px;color:#8b949e;font-size:11px;letter-spacing:.06em}',
    '.em-item{display:block;width:100%;text-align:left;background:none;border:0;color:#e6edf3;',
    ' padding:4px 8px;border-radius:6px;font:inherit;cursor:pointer}',
    '.em-item:hover{background:rgba(88,166,255,.2)}',
    '.em-item.em-cur{color:#3fb950;font-weight:700}',
    '.em-item.em-danger:hover{background:rgba(248,81,73,.25)}',
    '.em-picking .deck-stage *{cursor:crosshair !important}',
    /* hidden components stay ghost-visible in edit mode so they can be un-hidden;
     * display:revert!important beats the saved file's [data-em-hidden] rule (this
     * style element is appended later in <head>, so it wins the important tie) */
    '.deck [data-em-hidden],.deck-stage [data-em-hidden]{display:revert !important;',
    ' opacity:.28 !important;outline:1.5px dashed #f85149 !important;outline-offset:2px}',
  ].join('\n');
  document.head.appendChild(css);

  const bar = document.createElement('div');
  bar.className = 'em-bar';
  bar.innerHTML = '<b>✏️ 编辑</b><span class="em-status"></span>' +
    '<button class="em-btn em-comp" type="button">🧩 组件</button>' +
    '<button class="em-btn em-anim" type="button">✨ 动画</button>' +
    '<button class="em-btn em-fx" type="button">🎇 特效</button>' +
    '<button class="em-btn em-save" type="button">💾 保存</button>' +
    '<button class="em-btn em-exit" type="button">退出</button>';
  document.body.appendChild(bar);
  const statusEl = bar.querySelector('.em-status');

  panel = document.createElement('div');
  panel.className = 'em-panel';
  panel.innerHTML = '<div class="em-panel-title"></div><div class="em-panel-hint"></div><div class="em-panel-list"></div>';
  document.body.appendChild(panel);
  panelTitle = panel.querySelector('.em-panel-title');
  panelHint = panel.querySelector('.em-panel-hint');
  panelList = panel.querySelector('.em-panel-list');

  const animBtn = bar.querySelector('.em-anim');
  const fxBtn = bar.querySelector('.em-fx');
  const compBtn = bar.querySelector('.em-comp');
  function syncModeBtns() {
    animBtn.classList.toggle('em-on', picking === 'anim' || panelMode === 'anim');
    fxBtn.classList.toggle('em-on', panelMode === 'fx');
    compBtn.classList.toggle('em-on', picking === 'comp' || panelMode === 'comp');
  }
  function startPicking(mode, msg) {
    const wasOn = picking === mode || panelMode === mode;
    closePickUI();
    if (!wasOn) {
      if (editing) endEdit();
      picking = mode;
      document.documentElement.classList.add('em-picking');
      status(msg);
    } else updateStatus();
    syncModeBtns();
  }
  animBtn.addEventListener('click', () => startPicking('anim', '点击要调动画的元素(Esc 取消)'));
  compBtn.addEventListener('click', () => startPicking('comp', '点击卡片/列表项/pill(Esc 取消)'));
  fxBtn.addEventListener('click', () => {
    const wasOn = panelMode === 'fx';
    closePickUI();
    if (!wasOn) {
      if (editing) endEdit();
      openFxPanel();
    } else updateStatus();
    syncModeBtns();
  });

  function status(msg, cls) {
    statusEl.textContent = msg;
    statusEl.className = 'em-status' + (cls ? ' ' + cls : '');
  }
  function updateStatus() {
    const n = dirty.size + attrDirty.size + structDirty;
    if (n) status('未保存更改 ' + n + ' 处', 'warn');
    else status('双击改文字 · 🧩 组件 · ✨/🎇 动画特效');
  }
  updateStatus();

  bar.querySelector('.em-save').addEventListener('click', save);
  bar.querySelector('.em-exit').addEventListener('click', () => {
    const n = dirty.size + attrDirty.size + structDirty;
    if (n && !exitArmed) {
      exitArmed = true;
      status('有 ' + n + ' 处未保存,再点一次退出将放弃', 'err');
      return;
    }
    const params = new URLSearchParams(location.search);
    params.delete('edit');
    const qs = params.toString();
    location.href = location.pathname + (qs ? '?' + qs : '') + location.hash;
  });

  /* Tiny hook for automated verification (only exists in ?edit mode). */
  window.__emDebug = {
    serialize,
    dirtyCount: () => dirty.size,
    attrDirtyCount: () => attrDirty.size,
    structDirtyCount: () => structDirty,
    applyAnim, applyFx, previewAnim, previewFx, stopPreview,
    fxTarget, activeSlide, resolveTwin, closePickUI,
    componentRoot, compToggleHidden, compDuplicate, compDelete,
  };
})();
