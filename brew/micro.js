/* ═══════════════════════════════════════════════════════════════════════
   PNC BREW — MICRO.JS  v4  MASTER
   Surgical JS micro-interactions. Nothing that CSS alone can do.
   Awwwards-grade. Runs after script.js.
   Zero conflicts. All selectors verified against index.html.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var FINE    = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var REDUCED = window.matchMedia('(prefers-reduced-motion:reduce)').matches;


  /* ── 1. HERO HEADLINE — word-split stagger ─────────────────────── */

  /* ── 1. HERO HEADLINE — GSAP clip-mask wipe (matches home page) ── */
  (function heroHeadline() {
    if (REDUCED) return;
    if (typeof gsap === 'undefined') return;
    var inners = document.querySelectorAll('.hero-headline .hl-inner');
    if (!inners.length) return;
    gsap.set(inners, { yPercent: 108, opacity: 0 });
    gsap.to(inners, {
      yPercent: 0, opacity: 1,
      duration: 1.15, ease: 'expo.out',
      stagger: 0.13, delay: 0.05,
      clearProps: 'transform,opacity'
    });
    var sub = document.querySelector('.hero-headline .hl-sub');
    if (sub) {
      gsap.set(sub, { opacity: 0, y: 16 });
      gsap.to(sub, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', delay: 0.38, clearProps: 'transform,opacity' });
    }
  })();



  /* ── 2. HERO SCROLL HIDE ───────────────────────────────────────── */

  var heroScroll = document.querySelector('.hero-scroll');
  if (heroScroll) {
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      if (y > 80) heroScroll.classList.add('hidden');
      if (y < 20) heroScroll.classList.remove('hidden');
    }, { passive: true });
  }


  /* ── 3. MAGNETIC PULL ON STEP TITLES ──────────────────────────── */

  if (FINE && !REDUCED) {
    document.querySelectorAll('.step').forEach(function (step) {
      var title = step.querySelector('.step-title');
      if (!title) return;
      var rect;
      step.addEventListener('mouseenter', function () {
        rect = step.getBoundingClientRect();
      });
      step.addEventListener('mousemove', function (e) {
        if (!rect) rect = step.getBoundingClientRect();
        var rx = (e.clientX - rect.left) / rect.width  - 0.5;
        var ry = (e.clientY - rect.top)  / rect.height - 0.5;
        title.style.transform =
          'translate(' + (rx * 5).toFixed(1) + 'px,' + (ry * 3).toFixed(1) + 'px)';
      });
      step.addEventListener('mouseleave', function () {
        title.style.transform = '';
        rect = null;
      });
    });
  }


  /* ── 4. STEP TIMER META COUNTDOWN ─────────────────────────────── */

  if (!REDUCED) {
    document.querySelectorAll('.step').forEach(function (step) {
      var meta = step.querySelector('.step-meta');
      if (!meta) return;
      var text = meta.textContent;
      var m = text.match(/(\d+)\s*(min|sec|s\b)/i);
      if (!m) return;
      var origNum   = parseInt(m[1]);
      var unit      = m[2];
      var targetNum = Math.max(1, Math.round(origNum * 0.34));

      function animateNum(from, to, dur, done) {
        var start = null;
        (function tick(now) {
          if (!start) start = now;
          var t = Math.min((now - start) / dur, 1);
          var eased = 1 - Math.pow(1 - t, 2);
          meta.textContent = text.replace(m[0], Math.round(from + (to - from) * eased) + ' ' + unit);
          if (t < 1) requestAnimationFrame(tick);
          else if (done) done();
        })(performance.now());
      }

      var frame;
      step.addEventListener('mouseenter', function () {
        cancelAnimationFrame(frame);
        animateNum(origNum, targetNum, 900, null);
      });
      step.addEventListener('mouseleave', function () {
        var cur = parseInt(meta.textContent) || origNum;
        animateNum(cur, origNum, 500, function () {
          meta.textContent = text;
        });
      });
    });
  }


  /* ── 5. TASTING ROWS — sequential attention ─────────────────── */

  if (FINE && !REDUCED) {
    var rows = document.querySelectorAll('.tl-row');
    rows.forEach(function (row) {
      row.addEventListener('mouseenter', function () {
        var idx = Array.from(rows).indexOf(row);
        rows.forEach(function (r, i) {
          if (i !== idx) {
            r.style.opacity   = '0.38';
            r.style.transition = 'opacity 0.35s ease';
          }
        });
      });
      row.addEventListener('mouseleave', function () {
        rows.forEach(function (r) {
          r.style.opacity   = '';
          r.style.transition = 'opacity 0.4s ease';
        });
      });
    });
  }


  /* ── 6. SOURCE STAT COUNT-UP ────────────────────────────────────── */

  if (!REDUCED) {
    function parseStatNum(str) {
      var clean = str.replace(/[€,\s]/g, '');
      var m = clean.match(/^~?([0-9]+)/);
      return m ? parseInt(m[1]) : null;
    }

    function countUp(el, to, dur, prefix, suffix) {
      var start = null;
      (function tick(now) {
        if (!start) start = now;
        var t = Math.min((now - start) / dur, 1);
        var eased = 1 - Math.pow(1 - t, 3);
        el.textContent = prefix + Math.round(to * eased).toLocaleString() + suffix;
        if (t < 1) requestAnimationFrame(tick);
        else el.textContent = prefix + to.toLocaleString() + suffix;
      })(performance.now());
    }

    var ssObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el   = entry.target;
        var orig = el.textContent.trim();
        var num  = parseStatNum(orig);
        if (num === null) { ssObs.unobserve(el); return; }
        var prefix = orig.match(/^[€\s]*/)[0].replace(/[0-9]/g, '');
        var suffix = orig.replace(/^[€~\s,0-9]+/, '');
        countUp(el, num, 1000, prefix, suffix);
        ssObs.unobserve(el);
      });
    }, { threshold: 0.5 });

    document.querySelectorAll('.ss-val').forEach(function (el) {
      ssObs.observe(el);
    });
  }


  /* ── 7. REVEAL — product-name, source-headline, sc-title, sc-text ─ */
  /* script.js already handles .reveal elements.                       */
  /* micro.js adds the additional selectors not covered there.         */

  var extraReveal = document.querySelectorAll(
    '.sc-title, .sc-text'
  );
  if (extraReveal.length) {
    var revObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    extraReveal.forEach(function (el) { revObs.observe(el); });
  }


  /* ── 8. QTY CARD SPRING CLICK ───────────────────────────────────── */

  document.querySelectorAll('.qty-card').forEach(function (card) {
    card.addEventListener('click', function () {
      card.classList.remove('spring');
      void card.offsetWidth;
      card.classList.add('spring');
      card.addEventListener('animationend', function () {
        card.classList.remove('spring');
      }, { once: true });
    });
  });


  /* ── 9. HERO CURSOR WARM GLOW TRACKING ─────────────────────────── */

  if (FINE && !REDUCED) {
    var hero = document.querySelector('.hero');
    if (hero) {
      hero.addEventListener('mousemove', function (e) {
        var r  = hero.getBoundingClientRect();
        var xp = ((e.clientX - r.left) / r.width)  * 100;
        var yp = ((e.clientY - r.top)  / r.height) * 100;
        hero.style.setProperty('--gx', xp.toFixed(1) + '%');
        hero.style.setProperty('--gy', yp.toFixed(1) + '%');
      });
      hero.addEventListener('mouseleave', function () {
        hero.style.setProperty('--gx', '50%');
        hero.style.setProperty('--gy', '80%');
      });
    }
  }


  /* ── 10. BREW READY TOAST — grain intensify ─────────────────────── */

  var toast = document.getElementById('brew-3min');
  var grain = document.getElementById('grain');
  if (toast && grain && !REDUCED) {
    var toastObs = new MutationObserver(function () {
      if ((toast.style.transform || '').indexOf('translateY(0') !== -1) {
        grain.style.transition = 'opacity 1.5s ease';
        grain.style.opacity    = '0.085';
        setTimeout(function () {
          grain.style.opacity = '';
          setTimeout(function () { grain.style.transition = ''; }, 2000);
        }, 6000);
      }
    });
    toastObs.observe(toast, { attributes: true, attributeFilter: ['style'] });
  }


  /* ── 11. HERO BOTTOM — scroll parallax ─────────────────────────── */
  /* Uses native scroll (brew page has no Lenis — script.js doesn't    */
  /* set window.PNC_LENIS here). Passive listener, no jank.            */

  if (FINE && !REDUCED) {
    var heroBottom = document.querySelector('.hero-bottom');
    var heroEl     = document.querySelector('.hero');
    if (heroBottom && heroEl) {
      window.addEventListener('scroll', function () {
        var r = heroEl.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        var progress = Math.max(0, -r.top / r.height);
        heroBottom.style.transform = 'translateY(' + (progress * 22).toFixed(1) + 'px)';
      }, { passive: true });
    }
  }


  /* ── 12. COORDINATE CURSOR COLOUR SHIFT ────────────────────────── */

  if (FINE && !REDUCED) {
    var coordLabel  = document.querySelector('.hero-coord-label');
    var heroForCoord = document.querySelector('.hero');
    if (coordLabel && heroForCoord) {
      heroForCoord.addEventListener('mousemove', function (e) {
        var r    = heroForCoord.getBoundingClientRect();
        var dist = Math.abs(e.clientY - (r.top + r.height * 0.85));
        var pct  = Math.max(0, 1 - dist / 120);
        coordLabel.style.opacity = (0.55 + pct * 0.45).toFixed(2);
      });
    }
  }

})();
