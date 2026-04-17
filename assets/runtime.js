/* html-ppt :: runtime.js
 * Keyboard-driven deck runtime. Zero dependencies.
 *
 * Features:
 *   ← → / space / PgUp PgDn / Home End  navigation
 *   F  fullscreen
 *   S  presenter mode (split view: current + next + notes + timer)
 *   N  quick notes overlay (bottom drawer, legacy)
 *   O  slide overview grid
 *   T  cycle themes (reads data-themes on <html> or <body>)
 *   A  cycle demo animation on current slide
 *   URL hash #/N  deep-link to slide N (1-based)
 *   Progress bar auto-managed
 */
(function () {
  'use strict';

  const ANIMS = ['fade-up','fade-down','fade-left','fade-right','rise-in','drop-in',
    'zoom-pop','blur-in','glitch-in','typewriter','neon-glow','shimmer-sweep',
    'gradient-flow','stagger-list','counter-up','path-draw','parallax-tilt',
    'card-flip-3d','cube-rotate-3d','page-turn-3d','perspective-zoom',
    'marquee-scroll','kenburns','confetti-burst','spotlight','morph-shape','ripple-reveal'];

  function ready(fn){ if(document.readyState!='loading')fn(); else document.addEventListener('DOMContentLoaded',fn);}

  ready(function () {
    const deck = document.querySelector('.deck');
    if (!deck) return;
    const slides = Array.from(deck.querySelectorAll('.slide'));
    if (!slides.length) return;

    let idx = 0;
    const total = slides.length;

    // progress bar
    let bar = document.querySelector('.progress-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'progress-bar';
      bar.innerHTML = '<span></span>';
      document.body.appendChild(bar);
    }
    const barFill = bar.querySelector('span');

    // notes overlay
    let notes = document.querySelector('.notes-overlay');
    if (!notes) {
      notes = document.createElement('div');
      notes.className = 'notes-overlay';
      document.body.appendChild(notes);
    }

    // overview
    let overview = document.querySelector('.overview');
    if (!overview) {
      overview = document.createElement('div');
      overview.className = 'overview';
      slides.forEach((s, i) => {
        const t = document.createElement('div');
        t.className = 'thumb';
        const title = s.getAttribute('data-title') ||
          (s.querySelector('h1,h2,h3')||{}).textContent || ('Slide '+(i+1));
        t.innerHTML = '<div class="n">'+(i+1)+'</div><div class="t">'+title.trim().slice(0,80)+'</div>';
        t.addEventListener('click', () => { go(i); toggleOverview(false); });
        overview.appendChild(t);
      });
      document.body.appendChild(overview);
    }

    function go(n){
      n = Math.max(0, Math.min(total-1, n));
      slides.forEach((s,i) => {
        s.classList.toggle('is-active', i===n);
        s.classList.toggle('is-prev', i<n);
      });
      idx = n;
      barFill.style.width = ((n+1)/total*100)+'%';
      const numEl = document.querySelector('.slide-number');
      if (numEl) { numEl.setAttribute('data-current', n+1); numEl.setAttribute('data-total', total); }
      // notes (bottom overlay, legacy N key)
      const note = slides[n].querySelector('.notes, aside.notes, .speaker-notes');
      notes.innerHTML = note ? note.innerHTML : '';
      // presenter view live update
      renderPresenter(n);
      // hash
      if (location.hash !== '#/'+(n+1)) history.replaceState(null,'','#/'+(n+1));
      // re-trigger entry animations
      slides[n].querySelectorAll('[data-anim]').forEach(el => {
        const a = el.getAttribute('data-anim');
        el.classList.remove('anim-'+a);
        void el.offsetWidth;
        el.classList.add('anim-'+a);
      });
      // counter-up
      slides[n].querySelectorAll('.counter').forEach(el => {
        const target = parseFloat(el.getAttribute('data-to')||el.textContent);
        const dur = parseInt(el.getAttribute('data-dur')||'1200',10);
        const start = performance.now();
        const from = 0;
        function tick(now){
          const t = Math.min(1,(now-start)/dur);
          const v = from + (target-from)*(1-Math.pow(1-t,3));
          el.textContent = (target % 1 === 0) ? Math.round(v) : v.toFixed(1);
          if (t<1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    }

    function toggleNotes(force){ notes.classList.toggle('open', force!==undefined?force:!notes.classList.contains('open')); }
    function toggleOverview(force){ overview.classList.toggle('open', force!==undefined?force:!overview.classList.contains('open')); }

    // ========== PRESENTER MODE ==========
    // Split view: current slide (left) + next slide thumb + large speaker notes + timer
    let presenter = document.querySelector('.presenter-view');
    if (!presenter) {
      presenter = document.createElement('div');
      presenter.className = 'presenter-view';
      presenter.innerHTML = ''
        + '<div class="pv-main">'
        +   '<div class="pv-label">CURRENT</div>'
        +   '<div class="pv-stage" id="pv-stage"></div>'
        + '</div>'
        + '<div class="pv-side">'
        +   '<div class="pv-next">'
        +     '<div class="pv-label">NEXT</div>'
        +     '<div class="pv-stage pv-next-stage" id="pv-next"></div>'
        +   '</div>'
        +   '<div class="pv-notes">'
        +     '<div class="pv-label">SPEAKER SCRIPT · 逐字稿</div>'
        +     '<div class="pv-notes-body" id="pv-notes-body"></div>'
        +   '</div>'
        +   '<div class="pv-bar">'
        +     '<div class="pv-timer" id="pv-timer">00:00</div>'
        +     '<div class="pv-count" id="pv-count">1 / ' + total + '</div>'
        +     '<div class="pv-hint">S 退出 · ← → 翻页 · R 重置计时</div>'
        +   '</div>'
        + '</div>';
      document.body.appendChild(presenter);
    }
    const pvStage = presenter.querySelector('#pv-stage');
    const pvNext  = presenter.querySelector('#pv-next');
    const pvBody  = presenter.querySelector('#pv-notes-body');
    const pvTimer = presenter.querySelector('#pv-timer');
    const pvCount = presenter.querySelector('#pv-count');

    let timerStart = 0, timerHandle = null;
    function fmtTime(ms){
      const s = Math.floor(ms/1000);
      const mm = String(Math.floor(s/60)).padStart(2,'0');
      const ss = String(s%60).padStart(2,'0');
      return mm + ':' + ss;
    }
    function startTimer(){
      if (timerHandle) return;
      timerStart = Date.now();
      timerHandle = setInterval(() => {
        pvTimer.textContent = fmtTime(Date.now() - timerStart);
      }, 1000);
    }
    function stopTimer(){ if (timerHandle) { clearInterval(timerHandle); timerHandle = null; } }
    function resetTimer(){ timerStart = Date.now(); pvTimer.textContent = '00:00'; }

    function renderPresenter(n){
      if (!presenter.classList.contains('open')) return;
      // Clone current + next slides for mini display
      pvStage.innerHTML = '';
      pvNext.innerHTML = '';
      const curClone = slides[n].cloneNode(true);
      curClone.style.position = 'relative';
      curClone.style.opacity = '1';
      curClone.style.transform = 'none';
      curClone.classList.add('is-active');
      pvStage.appendChild(curClone);

      if (n + 1 < total) {
        const nxtClone = slides[n+1].cloneNode(true);
        nxtClone.style.position = 'relative';
        nxtClone.style.opacity = '1';
        nxtClone.style.transform = 'none';
        nxtClone.classList.add('is-active');
        pvNext.appendChild(nxtClone);
      } else {
        pvNext.innerHTML = '<div class="pv-end">— END —</div>';
      }

      // Notes
      const note = slides[n].querySelector('.notes, aside.notes, .speaker-notes');
      pvBody.innerHTML = note ? note.innerHTML : '<span class="pv-empty">（这一页还没有逐字稿）</span>';
      pvCount.textContent = (n+1) + ' / ' + total;
    }

    function togglePresenter(force){
      const willOpen = force !== undefined ? force : !presenter.classList.contains('open');
      presenter.classList.toggle('open', willOpen);
      document.body.classList.toggle('presenter-mode', willOpen);
      if (willOpen) {
        startTimer();
        renderPresenter(idx);
      } else {
        stopTimer();
      }
    }
    function fullscreen(){ const el=document.documentElement;
      if (!document.fullscreenElement) el.requestFullscreen&&el.requestFullscreen();
      else document.exitFullscreen&&document.exitFullscreen();
    }

    // theme cycling
    const root = document.documentElement;
    const themesAttr = root.getAttribute('data-themes') || document.body.getAttribute('data-themes');
    const themes = themesAttr ? themesAttr.split(',').map(s=>s.trim()).filter(Boolean) : [];
    let themeIdx = 0;
    function cycleTheme(){
      if (!themes.length) return;
      themeIdx = (themeIdx+1) % themes.length;
      const name = themes[themeIdx];
      let link = document.getElementById('theme-link');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'stylesheet';
        link.id = 'theme-link';
        document.head.appendChild(link);
      }
      // resolve relative to runtime's location
      const themePath = (root.getAttribute('data-theme-base') || 'assets/themes/') + name + '.css';
      link.href = themePath;
      root.setAttribute('data-theme', name);
      const ind = document.querySelector('.theme-indicator');
      if (ind) ind.textContent = name;
    }

    // animation cycling on current slide
    let animIdx = 0;
    function cycleAnim(){
      animIdx = (animIdx+1) % ANIMS.length;
      const a = ANIMS[animIdx];
      const target = slides[idx].querySelector('[data-anim-target]') || slides[idx];
      ANIMS.forEach(x => target.classList.remove('anim-'+x));
      void target.offsetWidth;
      target.classList.add('anim-'+a);
      target.setAttribute('data-anim', a);
      const ind = document.querySelector('.anim-indicator');
      if (ind) ind.textContent = a;
    }

    document.addEventListener('keydown', function (e) {
      if (e.metaKey||e.ctrlKey||e.altKey) return;
      switch (e.key) {
        case 'ArrowRight': case ' ': case 'PageDown': case 'Enter': go(idx+1); e.preventDefault(); break;
        case 'ArrowLeft': case 'PageUp': case 'Backspace': go(idx-1); e.preventDefault(); break;
        case 'Home': go(0); break;
        case 'End': go(total-1); break;
        case 'f': case 'F': fullscreen(); break;
        case 's': case 'S': togglePresenter(); break;
        case 'n': case 'N': toggleNotes(); break;
        case 'r': case 'R': if (presenter.classList.contains('open')) resetTimer(); break;
        case 'o': case 'O': toggleOverview(); break;
        case 't': case 'T': cycleTheme(); break;
        case 'a': case 'A': cycleAnim(); break;
        case 'Escape': toggleOverview(false); toggleNotes(false); togglePresenter(false); break;
      }
    });

    // hash deep-link
    function fromHash(){
      const m = /^#\/(\d+)/.exec(location.hash||'');
      if (m) go(Math.max(0, parseInt(m[1],10)-1));
    }
    window.addEventListener('hashchange', fromHash);
    fromHash();
    go(idx);
  });
})();
