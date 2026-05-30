/* ─────────────────────────────────────────────────────────────────────────
   PNC HOME · micro.js — Awwwards-grade micro-interactions
   v2: fixed Lenis/parallax conflict, removed layout-thrashing will-change
───────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 1. HERO PANEL WARM SWEEP — cursor tracks gold warmth ──────── */
  /* Targets .hero-panel (current panel structure). --sweep-x/y drives */
  /* the radial-gradient ::before in home-micro.css                    */
  if (!REDUCED && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.hero-panel').forEach(function (panel) {
      var sweepRaf = null;
      var lastE = null;
      panel.addEventListener('mousemove', function (e) {
        lastE = e;
        if (sweepRaf) return;
        sweepRaf = requestAnimationFrame(function () {
          sweepRaf = null;
          if (!lastE) return;
          var rect = panel.getBoundingClientRect();
          var px = ((lastE.clientX - rect.left) / rect.width) * 100;
          var py = ((lastE.clientY - rect.top) / rect.height) * 100;
          panel.style.setProperty('--sweep-x', px + '%');
          panel.style.setProperty('--sweep-y', py + '%');
        });
      });
      panel.addEventListener('mouseleave', function () {
        panel.style.setProperty('--sweep-x', '50%');
        panel.style.setProperty('--sweep-y', '120%');
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
    '#main-content',     /* 01 Hero */
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
  var hero = document.querySelector('#main-content');
  if (hero) hideObs.observe(hero);

})();


/* ── ORIGIN MAP SVG PATH TRACE — stroke-dashoffset on scroll entry ───
   When origin cards enter the viewport, the country highlight path
   draws itself like a border being traced by hand.
   The continent silhouette draws in simultaneously but slower.
   Feels like the map is being discovered, not displayed.
────────────────────────────────────────────────────────────────────── */
(function originPathTrace() {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  if (typeof IntersectionObserver === 'undefined') return;

  var cards = document.querySelectorAll('.origin-card');
  if (!cards.length) return;

  cards.forEach(function(card) {
    var continentPath = card.querySelector('.oc-continent');
    var countryPath   = card.querySelector('.oc-country');

    /* Set up dash arrays based on actual path lengths */
    [continentPath, countryPath].forEach(function(path) {
      if (!path) return;
      try {
        var len = path.getTotalLength();
        path.style.strokeDasharray  = len;
        path.style.strokeDashoffset = len;
        path.style.transition = 'none';
      } catch(e) {}
    });

    var done = false;
    var io = new IntersectionObserver(function(entries) {
      if (!entries[0].isIntersecting || done) return;
      done = true;
      io.disconnect();

      /* Continent: draws in over 1.8s */
      if (continentPath) {
        var cLen = parseFloat(continentPath.style.strokeDasharray) || 0;
        continentPath.style.transition = 'stroke-dashoffset 1.8s cubic-bezier(0.16,1,0.3,1) 0.1s';
        requestAnimationFrame(function() {
          continentPath.style.strokeDashoffset = '0';
        });
      }

      /* Country highlight: draws in over 1.2s with delay */
      if (countryPath) {
        countryPath.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1) 0.55s, fill 0.4s ease 1.6s';
        requestAnimationFrame(function() {
          countryPath.style.strokeDashoffset = '0';
        });
      }
    }, { threshold: 0.3 });

    io.observe(card);
  });

})();


/* ── HERO PANEL CURSOR PARALLAX ─────────────────────────────────────
   When the cursor moves inside a hero panel, the background image
   drifts subtly in the opposite direction — creating genuine depth.
   Clean layer separation: GSAP owns .hp2-img (scroll yPercent),
   this code owns .hp2-img-inner (cursor translateX/Y).
   No rAF loop — runs only on mousemove inside panels.
──────────────────────────────────────────────────────────────────── */
(function heroPanelCursorParallax() {
  if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  /* Touch devices: no cursor, skip entirely */
  if (!window.matchMedia('(pointer:fine)').matches) return;

  var DRIFT = 14; /* max px drift in each direction */

  var panels = document.querySelectorAll('.hero-panel');
  if (!panels.length) return;

  panels.forEach(function(panel) {
    var inner = panel.querySelector('.hp2-img-inner');
    if (!inner) return;

    /* On enter: kill transition so drift is immediate/fluid */
    panel.addEventListener('mouseenter', function() {
      inner.style.transition = 'transform 0.1s linear';
    });

    /* On leave: restore smooth transition and centre the image */
    panel.addEventListener('mouseleave', function() {
      inner.style.transition = 'transform 0.9s cubic-bezier(.16,1,.3,1)';
      inner.style.transform = '';
    });

    panel.addEventListener('mousemove', function(e) {
      var rect = panel.getBoundingClientRect();
      /* Normalise cursor to [-1, 1] within the panel */
      var nx = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
      var ny = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;

      /* Drift opposite to cursor direction (parallax feel) */
      var tx = -nx * DRIFT;
      var ty = -ny * DRIFT;

      /* Compose with hover scale — scale stays on the element,
         we just replace the translate. The CSS hover scale
         only fires on :hover which conflicts here, so we bake
         it into the JS transform and remove the CSS hover rule
         via the data attribute trick below. */
      inner.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(1.06)';
    });
  });

  /* Mark panels as JS-enhanced so CSS hover scale steps back */
  panels.forEach(function(p) { p.setAttribute('data-cursor-parallax', ''); });
})();


/* ── PHILOSOPHY GOLD MARK — scaleY draw on scroll entry ─────────────
   The right-hand gold border on .phil-quote draws downward like a
   deliberate editorial mark being made. Fires once, stays drawn.
──────────────────────────────────────────────────────────────────── */
(function philMarkDraw() {
  var quote = document.querySelector('.phil-quote');
  if (!quote) return;
  if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) {
    quote.classList.add('mark-drawn');
    return;
  }
  var io = new IntersectionObserver(function(entries) {
    if (entries[0].isIntersecting) {
      /* Small delay so the word-stagger fires first, then the mark seals */
      setTimeout(function() { quote.classList.add('mark-drawn'); }, 320);
      io.disconnect();
    }
  }, { threshold: 0.3 });
  io.observe(quote);
})();


/* ── PAGE TRANSITION — dark curtain exit ────────────────────────────
   On internal link click: ink curtain drops from top, then navigates.
   On page load: curtain lifts away. Eliminates hard white flash.
   Uses sessionStorage to track whether we came from an internal nav.
──────────────────────────────────────────────────────────────────── */
(function pageTransitions() {
  if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;

  /* Create the curtain element */
  var curtain = document.createElement('div');
  curtain.id = 'page-curtain';
  curtain.style.cssText = [
    'position:fixed',
    'inset:0',
    'background:var(--ink,#2A1810)',
    'z-index:99998',
    'pointer-events:none',
    'transform:translateY(-100%)',
    'transition:transform 0.52s cubic-bezier(0.76,0,0.24,1)',
    'will-change:transform'
  ].join(';');
  document.body.appendChild(curtain);

  /* On page load: if we came from an internal nav, lift the curtain */
  if (sessionStorage.getItem('pnc-nav')) {
    sessionStorage.removeItem('pnc-nav');
    curtain.style.transform = 'translateY(0)';
    curtain.style.transition = 'none';
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        curtain.style.transition = 'transform 0.62s cubic-bezier(0.76,0,0.24,1)';
        curtain.style.transform = 'translateY(-100%)';
      });
    });
  }

  /* Intercept internal link clicks */
  document.addEventListener('click', function(e) {
    var link = e.target.closest('a[href]');
    if (!link) return;

    var href = link.getAttribute('href');
    /* Only internal, non-hash, non-external links */
    if (!href || href.startsWith('#') || href.startsWith('http') ||
        href.startsWith('mailto') || href.startsWith('tel') ||
        link.target === '_blank') return;

    e.preventDefault();
    sessionStorage.setItem('pnc-nav', '1');

    /* Drop the curtain, then navigate */
    curtain.style.transform = 'translateY(0)';
    setTimeout(function() {
      window.location.href = href;
    }, 480);
  }, true);
})();


/* ── SCROLL INDICATOR — fade out once user has scrolled ─────────────
   The "SCROLL ↓" indicator fades away after the first meaningful
   scroll — once its purpose is served, it vanishes cleanly.
──────────────────────────────────────────────────────────────────── */
(function scrollIndicatorFade() {
  var indicator = document.querySelector('.hero-scroll');
  if (!indicator) return;

  var faded = false;
  window.addEventListener('scroll', function() {
    if (faded) return;
    if (window.scrollY > 80) {
      faded = true;
      indicator.style.transition = 'opacity 0.6s ease';
      indicator.style.opacity = '0';
      indicator.style.pointerEvents = 'none';
    }
  }, { passive: true });
})();


/* ── RITUAL TIMER — click "Set a timer" to start a 55-min countdown ─
   The bread bakes in 55 minutes. Click the hint and watch it count.
   A genuine product delight moment — this is what the site is about.
──────────────────────────────────────────────────────────────────── */
(function ritualTimer() {
  var hint = document.querySelector('.ritual-timer-hint');
  if (!hint) return;

  var BAKE_TIME = 55 * 60; /* 55 minutes in seconds */
  var remaining = BAKE_TIME;
  var interval = null;
  var running = false;

  hint.style.cursor = 'pointer';
  hint.setAttribute('role', 'button');
  hint.setAttribute('tabindex', '0');

  function formatTime(s) {
    var m = Math.floor(s / 60);
    var sec = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  function startTimer() {
    if (running) {
      /* Second click: cancel */
      clearInterval(interval);
      running = false;
      remaining = BAKE_TIME;
      hint.textContent = 'Set a timer. Stay with us.';
      hint.style.color = '';
      hint.style.letterSpacing = '';
      return;
    }
    running = true;
    hint.style.color = 'rgba(184,134,11,0.70)';
    hint.style.letterSpacing = '0.18em';

    interval = setInterval(function() {
      remaining--;
      hint.textContent = '— ' + formatTime(remaining) + ' remaining —';
      if (remaining <= 0) {
        clearInterval(interval);
        running = false;
        hint.textContent = 'Your bread is ready.';
        hint.style.color = 'rgba(184,134,11,0.90)';
        setTimeout(function() {
          hint.textContent = 'Set a timer. Stay with us.';
          hint.style.color = '';
          hint.style.letterSpacing = '';
          remaining = BAKE_TIME;
        }, 5000);
      }
    }, 1000);
  }

  hint.addEventListener('click', startTimer);
  hint.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startTimer(); }
  });
})();


/* ── PRINCIPLES KEYBOARD ACCESSIBILITY ────────────────────────────────
   principle-item divs have role="button" + tabindex="0".
   Enter/Space toggle .open class (mirrors hover expand).
   Escape closes the focused item.
   aria-expanded is kept in sync for screen readers.
──────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var items = document.querySelectorAll('.principle-item[role="button"]');
  if (!items.length) return;

  function open(item) {
    item.classList.add('open');
    item.setAttribute('aria-expanded', 'true');
  }

  function close(item) {
    item.classList.remove('open');
    item.setAttribute('aria-expanded', 'false');
  }

  function toggle(item) {
    if (item.classList.contains('open')) {
      close(item);
    } else {
      /* Close any sibling that's open */
      items.forEach(function(other) { if (other !== item) close(other); });
      open(item);
    }
  }

  items.forEach(function (item) {
    item.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle(item);
      }
      if (e.key === 'Escape') {
        close(item);
      }
    });

    /* Click also toggles (touch parity — hover doesn't fire on tap) */
    item.addEventListener('click', function () {
      toggle(item);
    });
  });
})();
