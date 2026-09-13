(function(){
  window.HPX = window.HPX || {};
  window.HPX['matrix-rain'] = function(el){
    const U = window.HPX._u;
    const k = U.canvas(el), ctx = k.ctx;
    const glyphs = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEF'.split('');
    const fs = 16;
    let cols = 0, drops = [];
    const init = () => {
      cols = Math.ceil(k.w/fs);
      drops = Array.from({length:cols}, () => U.rand(-20, 0));
    };
    init();
    let lw = k.w, lh = k.h;
    const stop = U.loop(() => {
      if (k.w!==lw || k.h!==lh){ init(); lw=k.w; lh=k.h; }
      ctx.fillStyle = U.fade(el, 0.08);
      ctx.fillRect(0,0,k.w,k.h);
      ctx.font = fs+'px monospace';
      for (let i=0;i<cols;i++){
        const ch = glyphs[(Math.random()*glyphs.length)|0];
        const x = i*fs, y = drops[i]*fs;
        /* The green is deliberately NOT themed. Every other fx samples the
         * theme's accents, but "matrix rain" in the deck's brand colors is no
         * longer matrix rain — an author picking this effect is picking the
         * reference, glyphs and green together. The trail wash above still
         * follows --bg, so it at least stops fogging light themes to black. */
        ctx.fillStyle = '#9fffc9';
        ctx.fillText(ch, x, y);
        ctx.fillStyle = '#00ff6a';
        ctx.fillText(ch, x, y - fs);
        drops[i] += 1;
        if (y > k.h && Math.random() > 0.975) drops[i] = 0;
      }
    });
    return { stop(){ stop(); k.destroy(); } };
  };
})();
