(function(){
  window.HPX = window.HPX || {};
  window.HPX['orbit-ring'] = function(el){
    const U = window.HPX._u;
    const k = U.canvas(el), ctx = k.ctx;
    const pal = U.palette(el);
    const tx = U.text(el, '#ffffff');
    /* Index with modulo like every other fx module: the palette is "the theme's
     * decorative colors", and hard-coding pal[4] silently painted undefined the
     * moment that list stopped being exactly five long. */
    const rings = [
      {r:40,  n:3,  sp:1.2},
      {r:75,  n:5,  sp:0.8},
      {r:110, n:8,  sp:-0.6},
      {r:145, n:12, sp:0.4},
      {r:180, n:16, sp:-0.3}
    ].map((R, i) => Object.assign(R, { c: pal[i % pal.length] }));
    const stop = U.loop((t) => {
      ctx.clearRect(0,0,k.w,k.h);
      const cx=k.w/2, cy=k.h/2;
      // radial glow — tinted by the theme's accent, not a fixed violet
      const g = ctx.createRadialGradient(cx,cy,0,cx,cy,210);
      g.addColorStop(0, U.alpha(pal[0], 0.25));
      g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0,0,k.w,k.h);
      for (const R of rings){
        ctx.strokeStyle = U.alpha(tx, 0.18); ctx.lineWidth=1;
        ctx.beginPath(); ctx.arc(cx,cy,R.r,0,Math.PI*2); ctx.stroke();
        for (let i=0;i<R.n;i++){
          const a = (i/R.n)*Math.PI*2 + t*R.sp;
          const x = cx + Math.cos(a)*R.r;
          const y = cy + Math.sin(a)*R.r;
          ctx.fillStyle = R.c;
          ctx.beginPath(); ctx.arc(x,y,4,0,Math.PI*2); ctx.fill();
        }
      }
      // Core dot: --text-1, so it stays visible on light themes. It was #fff,
      // which vanished completely against any white background.
      ctx.fillStyle = tx;
      ctx.beginPath(); ctx.arc(cx,cy,5,0,Math.PI*2); ctx.fill();
    });
    return { stop(){ stop(); k.destroy(); } };
  };
})();
