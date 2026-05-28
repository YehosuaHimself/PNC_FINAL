/* ─────────────────────────────────────────────────────────────────────
   PNC · hero-canvas.js
   Animated turbulence noise behind the hero — warm organic film grain
   that breathes, combined with a vignette that deepens on scroll.
   Pure canvas — no dependencies, no GPU requirement.
   Uses offscreen buffer + multi-octave value noise for performance.
────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var hero = document.querySelector('.hero');
  if (!hero) return;

  /* ── Canvas setup ────────────────────────────────────────────── */
  var canvas = document.createElement('canvas');
  canvas.id = 'hero-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = [
    'position:absolute',
    'inset:0',
    'width:100%',
    'height:100%',
    'pointer-events:none',
    'z-index:0',
    'opacity:0',
    'transition:opacity 1.2s cubic-bezier(.16,1,.3,1)',
    'will-change:opacity'
  ].join(';');
  hero.insertBefore(canvas, hero.firstChild);

  var ctx = canvas.getContext('2d', { alpha: true });
  var W = 0, H = 0;

  /* ── Noise utility — fast 2D value noise ─────────────────────── */
  /* Pre-bake permutation table */
  var P = new Uint8Array(512);
  (function () {
    for (var i = 0; i < 256; i++) P[i] = i;
    for (var i = 255; i > 0; i--) {
      var j = Math.random() * (i + 1) | 0;
      var t = P[i]; P[i] = P[j]; P[j] = t;
    }
    for (var i = 0; i < 256; i++) P[256 + i] = P[i];
  })();

  function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  function lerp(a, b, t) { return a + t * (b - a); }

  function grad(h, x, y) {
    h &= 3;
    if (h === 0) return  x + y;
    if (h === 1) return -x + y;
    if (h === 2) return  x - y;
    return -x - y;
  }

  function noise2(x, y) {
    var xi = Math.floor(x) & 255;
    var yi = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    var u = fade(x), v = fade(y);
    var a  = P[xi]   + yi, aa = P[a], ab = P[a + 1];
    var b  = P[xi+1] + yi, ba = P[b], bb = P[b + 1];
    return lerp(
      lerp(grad(P[aa], x,   y  ), grad(P[ba], x-1, y  ), u),
      lerp(grad(P[ab], x,   y-1), grad(P[bb], x-1, y-1), u),
      v
    );
  }

  /* FBM — 4 octaves for organic warmth */
  function fbm(x, y, t) {
    var v = 0, amp = 0.5, freq = 1.0;
    for (var i = 0; i < 4; i++) {
      v   += amp * noise2(x * freq + t * (0.08 + i * 0.02),
                          y * freq + t * (0.06 + i * 0.015));
      amp  *= 0.5;
      freq *= 2.1;
    }
    return v; /* range roughly -0.9 … +0.9 */
  }

  /* ── Render variables ────────────────────────────────────────── */
  var t      = 0;
  var STEP   = 4;      /* Sample every 4px — balance quality/perf */
  var rafId  = null;
  var visible = true;
  var scrollY = 0;
  var fadeIn  = false;

  /* Offscreen for noise so we blit once per frame */
  var offscreen = document.createElement('canvas');
  var offCtx    = offscreen.getContext('2d');

  function resize() {
    W = canvas.offsetWidth  || window.innerWidth;
    H = canvas.offsetHeight || window.innerHeight;
    canvas.width  = W;
    canvas.height = H;
    var ow = Math.ceil(W / STEP);
    var oh = Math.ceil(H / STEP);
    offscreen.width  = ow;
    offscreen.height = oh;
  }
  resize();
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 120);
  }, { passive: true });

  /* Scroll depth for vignette */
  window.addEventListener('scroll', function () {
    scrollY = window.scrollY;
  }, { passive: true });

  /* ── Draw one frame ──────────────────────────────────────────── */
  function draw() {
    if (!visible || W === 0 || H === 0) {
      rafId = requestAnimationFrame(draw);
      return;
    }

    t += 0.004; /* very slow drift */

    var ow = offscreen.width;
    var oh = offscreen.height;
    var imgData = offCtx.createImageData(ow, oh);
    var d = imgData.data;

    /* Vignette strength increases slightly with scroll */
    var vig = 0.38 + Math.min(scrollY / window.innerHeight, 1) * 0.18;

    var INK_R = 42, INK_G = 24, INK_B = 16;   /* #2A1810 */
    var CR_R  = 248, CR_G = 244, CR_B = 236;  /* #F8F4EC */

    for (var py = 0; py < oh; py++) {
      for (var px = 0; px < ow; px++) {

        /* Normalised coords */
        var nx = px / ow;
        var ny = py / oh;

        /* Noise value (-0.9 … +0.9) → (0 … 1) */
        var n = (fbm(nx * 3.2, ny * 2.4, t) + 0.9) / 1.8;

        /* Radial vignette — darkens edges */
        var dx = nx - 0.5, dy = ny - 0.5;
        var vn = 1.0 - Math.min(1.0, (dx * dx + dy * dy) * 4.0 * vig);
        n *= vn;

        /* Blend: noise goes from cream to ink */
        /* n=1 → cream corner feel, n=0 → dark */
        /* We want mostly cream with warm dark areas — keep n high */
        n = 0.72 + n * 0.28;

        var r = (INK_R + (CR_R - INK_R) * n) | 0;
        var g = (INK_G + (CR_G - INK_G) * n) | 0;
        var b = (INK_B + (CR_B - INK_B) * n) | 0;

        var idx = (py * ow + px) * 4;
        d[idx]   = r;
        d[idx+1] = g;
        d[idx+2] = b;
        d[idx+3] = 18; /* very subtle — alpha 18/255 ≈ 7% */
      }
    }

    offCtx.putImageData(imgData, 0, 0);

    /* Blit scaled to hero canvas */
    ctx.clearRect(0, 0, W, H);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(offscreen, 0, 0, W, H);

    rafId = requestAnimationFrame(draw);
  }

  /* ── Visibility API pause ───────────────────────────────────── */
  document.addEventListener('visibilitychange', function () {
    visible = !document.hidden;
    if (visible && rafId === null) rafId = requestAnimationFrame(draw);
  });

  /* ── IntersectionObserver — pause when hero scrolled away ────── */
  var heroObs = new IntersectionObserver(function (entries) {
    visible = entries[0].isIntersecting;
  }, { threshold: 0 });
  heroObs.observe(hero);

  /* ── Start ────────────────────────────────────────────────────── */
  rafId = requestAnimationFrame(draw);

  /* Fade in after first frame so there's no flash */
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      canvas.style.opacity = '1';
    });
  });

})();
