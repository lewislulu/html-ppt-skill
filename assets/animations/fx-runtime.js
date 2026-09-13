/* html-ppt :: fx-runtime.js
 * Canvas FX autoloader + lifecycle manager.
 * - Dynamically loads all fx modules listed in FX_LIST
 * - Initializes [data-fx] elements when their slide becomes active
 * - Calls handle.stop() when the slide leaves
 */
(function(){
  'use strict';

  const FX_LIST = [
    '_util',
    'particle-burst','confetti-cannon','firework','starfield','matrix-rain',
    'knowledge-graph','neural-net','constellation','orbit-ring','galaxy-swirl',
    'word-cascade','letter-explode','chain-react','magnetic-field','data-stream',
    'gradient-blob','sparkle-trail','shockwave','typewriter-multi','counter-explosion'
  ];

  // Resolve base path of this script so it works from any page location.
  const myScript = document.currentScript || (function(){
    const all = document.getElementsByTagName('script');
    for (const s of all){ if (s.src && s.src.indexOf('fx-runtime.js')>-1) return s; }
    return null;
  })();
  const base = myScript ? myScript.src.replace(/fx-runtime\.js.*$/, 'fx/') : 'assets/animations/fx/';

  let loaded = 0;
  const total = FX_LIST.length;
  const ready = new Promise((resolve) => {
    if (!total) return resolve();
    FX_LIST.forEach((name) => {
      const s = document.createElement('script');
      s.src = base + name + '.js';
      s.async = false;
      s.onload = s.onerror = () => { if (++loaded >= total) resolve(); };
      document.head.appendChild(s);
    });
  });

  window.__hpxActive = window.__hpxActive || new Map();

  function initFxIn(root){
    if (!window.HPX) return;
    const els = root.querySelectorAll('[data-fx]');
    els.forEach((el) => {
      if (window.__hpxActive.has(el)) return;
      const name = el.getAttribute('data-fx');
      const fn = window.HPX[name];
      if (typeof fn !== 'function') return;
      /* Snapshot the host's existing children before the module runs. Modules
       * append their own nodes (a canvas, a number overlay, a text wrapper) and
       * several never remove them in stop(); on a re-init that debris would
       * stack up. The host may equally hold the deck author's own markup, which
       * must survive. Recording what was there first is the only way to tell
       * the two apart. */
      const own = new Set(Array.from(el.childNodes));
      try {
        const handle = fn(el, {}) || { stop(){} };
        window.__hpxActive.set(el, { handle: handle, own: own });
      } catch(e){ console.warn('[hpx-fx]', name, e); }
    });
  }

  function stopFxIn(root){
    const els = root.querySelectorAll('[data-fx]');
    els.forEach((el) => {
      const rec = window.__hpxActive.get(el);
      if (!rec) return;
      if (rec.handle && typeof rec.handle.stop === 'function'){
        try{ rec.handle.stop(); }catch(e){}
      }
      /* Remove only what the module added, never what was already there. */
      if (rec.own){
        Array.from(el.childNodes).forEach((n) => {
          if (!rec.own.has(n)) el.removeChild(n);
        });
      }
      window.__hpxActive.delete(el);
    });
  }

  function reinitFxIn(root){
    stopFxIn(root);
    initFxIn(root);
  }
  /* fx-runtime is the single owner of every [data-fx] lifecycle. Anything that
   * wants to swap an effect should change the attribute and call these, rather
   * than invoking HPX[name] itself — two creators on one host means two
   * canvases, of which only the last is tracked and stoppable. */
  window.__hpxReinit = reinitFxIn;
  window.__hpxStop = stopFxIn;
  window.__hpxInit = initFxIn;

  /* Canvas FX read their colors out of CSS variables exactly once, at init —
   * a canvas cannot re-skin itself the way a CSS rule does. So on a theme swap
   * every running effect keeps painting the previous theme's palette, which is
   * only ever noticed by whoever presses T on a slide with a [data-fx].
   *
   * A <link> fires 'load' every time its href changes, and that is precisely
   * the moment the new variables become readable — reinitialising any earlier
   * would just re-sample the outgoing theme. */
  function watchThemeSwaps(){
    const link = document.getElementById('theme-link');
    if (!link) return;
    link.addEventListener('load', () => {
      const active = document.querySelector('.slide.is-active') || document.querySelector('.slide');
      if (active) reinitFxIn(active);
    });
  }

  function boot(){
    watchThemeSwaps();
    ready.then(() => {
      const active = document.querySelector('.slide.is-active') || document.querySelector('.slide');
      if (active) initFxIn(active);

      // Watch all slides for class changes
      const slides = document.querySelectorAll('.slide');
      slides.forEach((sl) => {
        const mo = new MutationObserver((muts) => {
          for (const m of muts){
            if (m.attributeName === 'class'){
              if (sl.classList.contains('is-active')) initFxIn(sl);
              else stopFxIn(sl);
            }
          }
        });
        mo.observe(sl, { attributes: true, attributeFilter: ['class'] });
      });
    });
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
