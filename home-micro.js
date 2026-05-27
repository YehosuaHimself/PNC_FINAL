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
