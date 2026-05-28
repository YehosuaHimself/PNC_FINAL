/* ─────────────────────────────────────────────────────────────────────────
   PNC HOME · micro.js — Awwwards-grade micro-interactions
   v2: fixed Lenis/parallax conflict, removed layout-thrashing will-change
───────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 1. PRODUCT CARD WARM SWEEP — cursor tracks warmth ─────────── */
  if (!REDUCED && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.hero-product').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var py = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--sweep-y', py + '%');
      });
      card.addEventListener('mouseleave', function () {
        card.style.setProperty('--sweep-y', '120%');
      });
    });
  }

  /* ── 2. HP-CTA ARROW WRAP — for CSS slide animation ────────────── */
  document.querySelectorAll('.hp-cta').forEach(function (el) {
    var text = el.textContent;
    if (text.indexOf('→') !== -1) {
      el.innerHTML = text.replace('→', '<span class="hp-arrow">→</span>');
    }
  });

  /* ── 3. HP-STAT VALS — count up on card entry ───────────────────── */
  if (!REDUCED) {
    function countUp(el, target, prefix, suffix, duration) {
      if (el.getAttribute('data-counted')) return;
      el.setAttribute('data-counted', '1');
      var start = null;
      function tick(now) {
        if (!start) start = now;
        var t = Math.min((now - start) / duration, 1);
        var eased = 1 - Math.pow(1 - t, 3);
        el.textContent = prefix + Math.round(target * eased).toLocaleString() + suffix;
        if (t < 1) requestAnimationFrame(tick);
        else el.textContent = prefix + target.toLocaleString() + suffix;
      }
      requestAnimationFrame(tick);
    }

    var statsObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var card = entry.target;
        card.querySelectorAll('.hp-stat-val').forEach(function (el, i) {
          if (el.getAttribute('data-counted')) return;
          var raw = el.textContent.trim();
          var numMatch = raw.match(/^[€]?([\d,]+)([+]?)$/);
          if (!numMatch) return;
          var num    = parseInt(numMatch[1].replace(/,/g, ''), 10);
          var suffix = numMatch[2] || '';
          setTimeout(function () { countUp(el, num, '', suffix, 800 + i * 100); }, i * 80);
        });
        statsObs.unobserve(card);
      });
    }, { threshold: 0.4 });
    document.querySelectorAll('.hero-product').forEach(function (c) { statsObs.observe(c); });
  }

  /* ── 4. PHILOSOPHY QUOTE — border pulse on enter ────────────────── */
  if (!REDUCED) {
    var philQuote = document.querySelector('.phil-quote');
    if (philQuote) {
      var mo = new MutationObserver(function () {
        if (philQuote.classList.contains('visible')) {
          philQuote.style.borderRightColor = 'var(--gold)';
        }
      });
      mo.observe(philQuote, { attributes: true, attributeFilter: ['class'] });
    }
  }

  /* ── 5. HERO PRODUCTS — parallax on scroll ──────────────────────── 
     Uses Lenis onScroll when available (avoids the virtual-scroll/
     window.scrollY mismatch that caused jank in v1).
     Falls back to passive scroll listener on non-Lenis pages.
  ─────────────────────────────────────────────────────────────────── */
  if (!REDUCED && window.matchMedia('(hover: hover)').matches) {
    var cards = document.querySelectorAll('.hero-product');
    var hero  = document.querySelector('.hero');
    if (cards.length === 2 && hero) {
      var heroH    = 0;
      var ticking  = false;

      function measureHero() {
        heroH = hero.offsetHeight;
      }
      measureHero();
      window.addEventListener('resize', measureHero, { passive: true });

      function applyParallax(scrollY) {
        if (heroH === 0) return;
        if (scrollY > heroH) {
          // Past hero — reset so no off-screen drift
          cards[0].style.transform = '';
          cards[1].style.transform = '';
          return;
        }
        var progress = scrollY / heroH;
        cards[0].style.transform = 'translateY(' + (progress * -10).toFixed(2) + 'px)';
        cards[1].style.transform = 'translateY(' + (progress * -16).toFixed(2) + 'px)';
      }

      // Try Lenis first — poll until it's initialised (script.js runs after us)
      var lenisPollAttempts = 0;
      var lenisPollTimer = setInterval(function () {
        lenisPollAttempts++;
        if (window.PNC_LENIS) {
          clearInterval(lenisPollTimer);
          window.PNC_LENIS.on('scroll', function (e) {
            applyParallax(e.scroll);
          });
        } else if (lenisPollAttempts > 40) {
          // Lenis not found after 2s — fall back to native scroll
          clearInterval(lenisPollTimer);
          window.addEventListener('scroll', function () {
            if (!ticking) {
              requestAnimationFrame(function () {
                applyParallax(window.scrollY);
                ticking = false;
              });
              ticking = true;
            }
          }, { passive: true });
        }
      }, 50);
    }
  }

  /* ── 6. FOOTER COPY — reveal tracking animation ─────────────────── */
  if (!REDUCED) {
    var footerCopy = document.querySelector('.footer-copy');
    if (footerCopy) {
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            obs.unobserve(e.target);
          }
        });
      }, { threshold: 0.5 });
      obs.observe(footerCopy);
    }
  }

  /* ── 7. TICKER — smooth resume after hover pause ────────────────── */
  var ticker = document.querySelector('.ticker-inner');
  if (ticker && !REDUCED) {
    var parentTicker = ticker.closest('.ticker');
    if (parentTicker) {
      parentTicker.addEventListener('mouseleave', function () {
        ticker.style.animationPlayState = 'running';
      });
    }
  }

})();


/* ── 3D CARD TILT — spring physics mousemove ──────────────────────────
   Each card tilts toward the cursor with spring-smoothed rotation.
   Custom props --rx / --ry drive the CSS transform.
   Separate spring per axis for organic feel.
────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  if (window.matchMedia('(pointer:coarse)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;

  var MAX_TILT = 7;    /* degrees */
  var MAX_TZ   = 8;    /* translateZ px when hovering */
  var SPRING_K = 0.12; /* stiffness */
  var SPRING_D = 0.72; /* damping */

  var cards = document.querySelectorAll('.hero-product');
  if (!cards.length) return;

  cards.forEach(function (card) {
    /* Spring state per card per axis */
    var state = {
      rx: 0, ry: 0, tz: 0,
      vx: 0, vy: 0, vz: 0,
      targetRx: 0, targetRy: 0, targetTz: 0,
      cx: 50, cy: 120, /* cursor pct within card */
      hovering: false,
      raf: null
    };

    function tick() {
      /* Spring toward target */
      state.vx += (state.targetRx - state.rx) * SPRING_K;
      state.vy += (state.targetRy - state.ry) * SPRING_K;
      state.vz += (state.targetTz - state.tz) * SPRING_K;
      state.vx *= SPRING_D;
      state.vy *= SPRING_D;
      state.vz *= SPRING_D;
      state.rx += state.vx;
      state.ry += state.vy;
      state.tz += state.vz;

      card.style.setProperty('--rx', state.rx.toFixed(3) + 'deg');
      card.style.setProperty('--ry', state.ry.toFixed(3) + 'deg');
      card.style.setProperty('--tz', state.tz.toFixed(3) + 'px');
      card.style.setProperty('--cx', state.cx.toFixed(1) + '%');
      card.style.setProperty('--cy', state.cy.toFixed(1) + '%');

      var moving = Math.abs(state.vx) + Math.abs(state.vy) + Math.abs(state.vz);
      if (moving > 0.001 || state.hovering) {
        state.raf = requestAnimationFrame(tick);
      } else {
        state.raf = null;
      }
    }

    function startRaf() {
      if (!state.raf) state.raf = requestAnimationFrame(tick);
    }

    card.addEventListener('mousemove', function (e) {
      var rect = card.getBoundingClientRect();
      var mx   = e.clientX - rect.left;
      var my   = e.clientY - rect.top;
      var nx   = (mx / rect.width  - 0.5) * 2; /* -1 … +1 */
      var ny   = (my / rect.height - 0.5) * 2;

      /* Invert Y: cursor top → tilt back = negative rotateX */
      state.targetRx = -ny * MAX_TILT;
      state.targetRy =  nx * MAX_TILT;
      state.targetTz = MAX_TZ;

      /* Cursor spotlight position */
      state.cx = (mx / rect.width  * 100);
      state.cy = (my / rect.height * 100);
      state.hovering = true;

      startRaf();
    }, { passive: true });

    card.addEventListener('mouseenter', function () {
      state.hovering = true;
      startRaf();
    });

    card.addEventListener('mouseleave', function () {
      state.hovering    = false;
      state.targetRx    = 0;
      state.targetRy    = 0;
      state.targetTz    = 0;
      startRaf();
    });
  });

})();


/* ── TICKER VELOCITY SKEW — scroll speed bends the tape ─────────────
   As the user scrolls fast, the ticker text skews like magnetic tape.
   Snaps back to neutral when scroll slows.
────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;

  var ticker = document.querySelector('.ticker-inner');
  if (!ticker) return;

  var lastY   = window.scrollY;
  var vel     = 0;
  var skew    = 0;
  var targetSkew = 0;
  var raf     = null;

  var MAX_SKEW = 12; /* degrees */
  var SKEW_K   = 0.08;
  var SKEW_D   = 0.78;

  function tick() {
    skew += (targetSkew - skew) * SKEW_K;
    skew *= SKEW_D + 0.18; /* sticky return */
    skew = skew * 0.82; /* decay */

    ticker.style.transform = 'skewX(' + skew.toFixed(3) + 'deg)';
    ticker.style.willChange = 'transform';

    if (Math.abs(skew) > 0.01) {
      raf = requestAnimationFrame(tick);
    } else {
      ticker.style.transform = '';
      raf = null;
    }
  }

  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    vel = y - lastY;
    lastY = y;

    targetSkew = Math.max(-MAX_SKEW, Math.min(MAX_SKEW, -vel * 0.6));
    skew = skew + vel * 0.3;

    if (!raf) raf = requestAnimationFrame(tick);
  }, { passive: true });

})();


/* ── TEXT SCRAMBLE — chars randomise before settling ─────────────────
   Applied to .hp-stat-val on card hover, and .ocs-val on origin
   card enter. Classic hacker-text but warm — uses bread/grain chars.
────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·—';

  function scramble(el, finalText, duration) {
    duration = duration || 600;
    var frames   = Math.round(duration / 40);
    var frame    = 0;
    var orig     = finalText || el.textContent;

    if (el._scrambleRaf) cancelAnimationFrame(el._scrambleRaf);

    function tick() {
      frame++;
      var progress = frame / frames;
      var result   = '';
      for (var i = 0; i < orig.length; i++) {
        if (orig[i] === ' ' || orig[i] === '\u00A0') {
          result += orig[i];
          continue;
        }
        if (progress > i / orig.length + 0.1) {
          result += orig[i];
        } else {
          result += CHARS[Math.floor(Math.random() * CHARS.length)];
        }
      }
      el.textContent = result;
      if (frame < frames) {
        el._scrambleRaf = requestAnimationFrame(tick);
      } else {
        el.textContent = orig;
      }
    }
    tick();
  }

  /* Apply to product card stat values on card hover */
  if (!window.matchMedia('(prefers-reduced-motion:reduce)').matches) {
    document.querySelectorAll('.hero-product').forEach(function (card) {
      var entered = false;
      card.addEventListener('mouseenter', function () {
        if (entered) return;
        entered = true;
        card.querySelectorAll('.hp-stat-val').forEach(function (el, i) {
          setTimeout(function () {
            scramble(el, el.textContent, 480);
          }, i * 80);
        });
        setTimeout(function () { entered = false; }, 1400);
      });
    });

    /* Apply to origin card stat values on viewport enter */
    var originCards = document.querySelectorAll('.origin-card');
    if (typeof IntersectionObserver !== 'undefined') {
      originCards.forEach(function (card) {
        var done = false;
        var io = new IntersectionObserver(function (entries) {
          if (entries[0].isIntersecting && !done) {
            done = true;
            card.querySelectorAll('.ocs-val').forEach(function (el, i) {
              setTimeout(function () {
                scramble(el, el.textContent, 560);
              }, i * 120);
            });
          }
        }, { threshold: 0.4 });
        io.observe(card);
      });
    }
  }

})();


/* ── HERO PRICE ANCHORS — count-up on load ───────────────────────────
   The price numbers in the top-right of each card count from 0
   on page load — subtle but adds life to the hero.
────────────────────────────────────────────────────────────────────── */
(function heroPriceCount() {
  'use strict';
  if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;

  /* Find the two hp-price-anchor elements */
  var anchors = document.querySelectorAll('.hp-price-anchor');
  if (!anchors.length) return;

  var targets = [3, 1]; /* € 3 and € 1 */
  var currencies = ['€', '€'];

  anchors.forEach(function (anchor, i) {
    var sub = anchor.querySelector('span');
    var subText = sub ? sub.textContent : '';
    var target = targets[i];
    var prefix = currencies[i] + '\u00A0';
    var start  = null;
    var dur    = 900 + i * 300;
    var delay  = 600 + i * 200;

    setTimeout(function () {
      function tick(now) {
        if (!start) start = now;
        var p = Math.min((now - start) / dur, 1);
        var ease = 1 - Math.pow(1 - p, 4); /* easeOutQuart */
        var val = Math.ceil(ease * target);
        /* Rebuild: number + original span */
        anchor.childNodes[0] && anchor.childNodes[0].nodeType === 3
          ? (anchor.childNodes[0].textContent = prefix + val)
          : (anchor.insertBefore(document.createTextNode(prefix + val), anchor.firstChild));

        /* Remove extra text nodes */
        while (anchor.childNodes.length > 2) anchor.removeChild(anchor.firstChild);

        if (p < 1) requestAnimationFrame(tick);
        else {
          anchor.childNodes[0].textContent = prefix + target;
        }
      }
      requestAnimationFrame(tick);
    }, delay);
  });

})();


/* ── ORIGIN MAP MOUSEMOVE — spotlight tracks cursor ─────────────────
   The warm radial light on the map follows the mouse.
────────────────────────────────────────────────────────────────────── */
(function originMapCursor() {
  'use strict';
  if (window.matchMedia('(pointer:coarse)').matches) return;

  var cards = document.querySelectorAll('.origin-card');
  cards.forEach(function (card) {
    var map = card.querySelector('.origin-map');
    if (!map) return;
    card.addEventListener('mousemove', function (e) {
      var rect = map.getBoundingClientRect();
      var x = ((e.clientX - rect.left) / rect.width  * 100).toFixed(1) + '%';
      var y = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1) + '%';
      map.style.setProperty('--mx', x);
      map.style.setProperty('--my', y);
    }, { passive: true });
  });

})();


/* ── SECTION COUNTER — 01/07 fixed indicator ─────────────────────────
   Tracks the 7 main sections via IntersectionObserver.
   Counter fades in after first scroll, updates on each section entry.
────────────────────────────────────────────────────────────────────── */
(function sectionCounter() {
  'use strict';

  var counter = document.getElementById('sec-counter');
  var curEl   = document.getElementById('sec-cur');
  if (!counter || !curEl || typeof IntersectionObserver === 'undefined') return;

  /* The 7 narrative sections in reading order */
  var SECTIONS = [
    '#main',             /* 01 Hero */
    '.proof-strip',      /* 02 Proof */
    '.ritual-section',   /* 03 Ritual */
    '.principles-section', /* 04 Principles */
    '#origins',          /* 05 Origins */
    '#manifesto',        /* 06 Manifesto */
    '#philosophy',       /* 07 Philosophy */
  ];

  var total = SECTIONS.length;
  document.getElementById('sec-tot').textContent =
    total < 10 ? '0' + total : '' + total;

  var active = 0; /* index of the section most in view */

  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var idx = parseInt(entry.target.dataset.secIdx, 10);
        if (!isNaN(idx)) active = idx;
        var n = active + 1;
        curEl.style.opacity = '0';
        setTimeout(function () {
          curEl.textContent = n < 10 ? '0' + n : '' + n;
          curEl.style.opacity = '1';
        }, 120);
        counter.classList.add('visible');
      }
    });
  }, { threshold: 0.25 });

  SECTIONS.forEach(function (sel, i) {
    var el = document.querySelector(sel);
    if (!el) return;
    el.dataset.secIdx = i;
    obs.observe(el);
  });

  /* Hide counter when at very top */
  var hideObs = new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting) counter.classList.remove('visible');
    else counter.classList.add('visible');
  }, { threshold: 0.98 });
  var hero = document.querySelector('#main');
  if (hero) hideObs.observe(hero);

})();
