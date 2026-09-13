/* html-ppt fx :: shared helpers */
(function(){
  window.HPX = window.HPX || {};
  const U = window.HPX._u = {};

  U.css = (el, name, fb) => {
    const v = getComputedStyle(el).getPropertyValue(name).trim();
    return v || fb;
  };

  U.accent = (el, fb) => U.css(el, '--accent', fb || '#7c5cff');
  U.accent2 = (el, fb) => U.css(el, '--accent-2', fb || '#22d3ee');
  U.accent3 = (el, fb) => U.css(el, '--accent-3', fb || '#f0abfc');
  U.text = (el, fb) => U.css(el, '--text-1', fb || '#eaeaf2');
  U.bg = (el, fb) => U.css(el, '--bg', fb || '#0b0c10');

  /* The per-frame wash that turns moving particles into trails: instead of
   * clearing the canvas, paint the page's own background over it at low alpha
   * so older frames sink into the slide.
   *
   * It has to be the *theme's* background. A hard-coded black wash is invisible
   * on a dark deck and therefore looks correct — but on minimal-white it fogs a
   * white slide to solid black within a second or two, taking the headline with
   * it. Same bug, opposite sign. */
  U.fade = (el, a) => U.alpha(U.bg(el, '#0b0c10'), a);

  /* Decorative color pool for particles, nodes, sparks and rings.
   *
   * These are the theme's three accents, and nothing else. Two reasons:
   *
   * 1. They are what a theme actually designs as its signature triad — most
   *    themes build --grad out of exactly these three, so they are known to sit
   *    together.
   * 2. The obvious-looking alternative, --good/--warn/--bad, is a *semantic*
   *    status triad meant for charts, diffs and pros/cons. Green/amber/red mean
   *    something. Firing them out of a confetti cannon means nothing, and on a
   *    restrained theme it actively fights the design: minimal-white's accents
   *    are three greys, so borrowing its --bad painted red dots across a deck
   *    whose entire point is greyscale.
   *
   * Callers must not assume a length — index with pal[i % pal.length]. This
   * list has been 5 long and is now 3; treat it as "the theme's decorative
   * colors", however many that turns out to be.
   */
  U.palette = (el) => [
    U.accent(el, '#7c5cff'),
    U.accent2(el, '#22d3ee'),
    U.accent3(el, '#f0abfc'),
  ];

  /* Re-alpha a CSS color so an fx can draw a translucent glow/trail in a theme
   * color instead of a hard-coded one. Handles the two forms theme tokens
   * actually use — hex (#rgb / #rrggbb, with or without an alpha pair) and
   * rgb()/rgba(). Anything else is returned untouched: better to draw the color
   * at full strength than to throw inside an animation frame. */
  U.alpha = (color, a) => {
    if (typeof color !== 'string') return color;
    const c = color.trim();

    let m = /^#([0-9a-f]{3,8})$/i.exec(c);
    if (m) {
      let h = m[1];
      if (h.length === 3 || h.length === 4) h = h.split('').map(x => x + x).join('');
      if (h.length !== 6 && h.length !== 8) return c;
      const r = parseInt(h.slice(0, 2), 16);
      const g = parseInt(h.slice(2, 4), 16);
      const b = parseInt(h.slice(4, 6), 16);
      return `rgba(${r},${g},${b},${a})`;
    }

    m = /^rgba?\(([^)]+)\)$/i.exec(c);
    if (m) {
      const p = m[1].split(/[,\s/]+/).filter(Boolean);
      if (p.length >= 3) return `rgba(${p[0]},${p[1]},${p[2]},${a})`;
    }

    return c;
  };

  U.canvas = (el) => {
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    const c = document.createElement('canvas');
    c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;display:block;';
    el.appendChild(c);
    const ctx = c.getContext('2d');
    let w = 0, h = 0, dpr = Math.max(1, Math.min(2, window.devicePixelRatio||1));
    const fit = () => {
      const r = el.getBoundingClientRect();
      w = Math.max(1, r.width|0);
      h = Math.max(1, r.height|0);
      c.width = (w*dpr)|0;
      c.height = (h*dpr)|0;
      ctx.setTransform(dpr,0,0,dpr,0,0);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return {
      c, ctx,
      get w(){return w;}, get h(){return h;}, get dpr(){return dpr;},
      destroy(){
        try{ro.disconnect();}catch(e){}
        if (c.parentNode) c.parentNode.removeChild(c);
      }
    };
  };

  U.loop = (fn) => {
    let raf = 0, stopped = false, t0 = performance.now();
    const tick = (t) => {
      if (stopped) return;
      fn((t - t0)/1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { stopped = true; cancelAnimationFrame(raf); };
  };

  U.rand = (a,b) => a + Math.random()*(b-a);
})();
