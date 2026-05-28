/* cursor-square.js — shared square cursor for home + all secondary pages
 * Square dot (10px) + larger lagging square ring (96px default)
 * Color flips IMMEDIATELY (0ms) based on data-dark sections
 */
(function(){
  var dot  = document.getElementById('cur-dot');
  var ring = document.getElementById('cur-ring');
  if (!dot || !ring || window.matchMedia('(pointer:coarse)').matches) return;

  var C_DARK  = '#4A3018';   /* ink — used on light/sand surfaces */
  var C_LIGHT = '#F8F4EC';   /* cream — used on dark surfaces */

  var mx=-9999,my=-9999,rx=-9999,ry=-9999;
  var raf=null, s=0;
  var LERP=0.10;             /* ring lag factor */
  var DR=5, RR=48;           /* dot radius offset, ring half-size */
  var currentDark=false;

  dot.style.willChange  = 'transform, background';
  ring.style.willChange = 'transform, border-color';

  /* ── color swap — 0ms, immediate ─────────────────────────── */
  function applyColor(dark){
    var c = dark ? C_LIGHT : C_DARK;
    dot.style.transition  = 'background 0ms';
    ring.style.transition = 'border-color 0ms, width .22s cubic-bezier(.16,1,.3,1), height .22s cubic-bezier(.16,1,.3,1), opacity 160ms ease';
    dot.style.background  = c;
    ring.style.borderColor= c;
    ring.style.opacity    = dark ? '0.55' : '0.60';
  }

  /* ── detect dark surface under cursor ─────────────────────── */
  function isDark(){
    var el = document.elementFromPoint(mx, my);
    while(el && el !== document.body){
      if(el.dataset && el.dataset.dark !== undefined) return true;
      el = el.parentElement;
    }
    return false;
  }

  applyColor(false);

  /* ── RAF loop ─────────────────────────────────────────────── */
  function loop(){
    var dx=(mx-RR)-rx, dy=(my-RR)-ry;
    rx+=dx*LERP; ry+=dy*LERP;
    dot.style.transform  = 'translate3d('+(mx-DR)+'px,'+(my-DR)+'px,0)';
    ring.style.transform = 'translate3d('+Math.round(rx)+'px,'+Math.round(ry)+'px,0)';
    var dark = isDark();
    if(dark !== currentDark){ currentDark=dark; applyColor(dark); }
    if(Math.abs(dx)<0.3&&Math.abs(dy)<0.3){if(++s>4){raf=null;return;}}else{s=0;}
    raf=requestAnimationFrame(loop);
  }
  function go(){s=0;if(raf===null)raf=requestAnimationFrame(loop);}

  document.addEventListener('mousemove',function(e){mx=e.clientX;my=e.clientY;go();},{passive:true});
  document.addEventListener('mouseleave',function(){
    mx=-9999;my=-9999;
    dot.style.transform ='translate3d(-9999px,-9999px,0)';
    ring.style.transform='translate3d(-9999px,-9999px,0)';
  });

  /* ── hover expand on links/buttons ───────────────────────── */
  document.querySelectorAll('a,button').forEach(function(el){
    el.addEventListener('mouseenter',function(){
      ring.style.width='112px'; ring.style.height='112px'; ring.style.opacity='0.8';
      go();
    });
    el.addEventListener('mouseleave',function(){
      ring.style.width='96px'; ring.style.height='96px'; ring.style.opacity=currentDark?'0.55':'0.60';
      go();
    });
  });
})();
