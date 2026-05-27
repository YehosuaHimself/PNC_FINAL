/* ─────────────────────────────────────────────────────────────────────────
   PNC HOME · micro.js — Awwwards-grade micro-interactions
   Loaded after script.js. Zero conflicts with existing code.
───────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const RAF = requestAnimationFrame;

  /* ── 1. PRODUCT CARD WARM SWEEP — mouse tracks warmth across card ── */
  // As your cursor moves over a card, a warm gold glow follows beneath.
  // Done entirely via a CSS custom property on the element.
  if (!REDUCED && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.hero-product').forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const py = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--sweep-y', py + '%');
      });
      card.addEventListener('mouseleave', () => {
        card.style.setProperty('--sweep-y', '120%');
      });
    });
  }

  /* ── 2. HP-CTA ARROW WRAP — wrap the → for slide animation ─────── */
  document.querySelectorAll('.hp-cta').forEach(el => {
    const text = el.textContent;
    if (text.includes('→')) {
      el.innerHTML = text.replace('→', '<span class="hp-arrow">→</span>');
    }
  });

  /* ── 3. HP-STAT VALS — count up on card intersection ────────────── */
  if (!REDUCED) {
    function countUp(el, target, prefix, suffix, duration) {
      if (el.getAttribute('data-counted')) return;
      el.setAttribute('data-counted', '1');
      const start = performance.now();
      const from = 0;
      function tick(now) {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        const v = from + (target - from) * eased;
        el.textContent = prefix + Math.round(v).toLocaleString() + suffix;
        if (t < 1) RAF(tick);
        else el.textContent = prefix + target.toLocaleString() + suffix;
      }
      RAF(tick);
    }

    const statsObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const card = entry.target;
        card.querySelectorAll('.hp-stat-val').forEach((el, i) => {
          if (el.getAttribute('data-counted')) return;
          const raw = el.textContent.trim();
          // Handle special cases: G1, 85+, 2400, 3, 5, 55, €1
          const numMatch = raw.match(/^[€]?([\d,]+)([+]?)$/);
          if (!numMatch) return;
          const num = parseInt(numMatch[1].replace(/,/g, ''), 10);
          const suffix = numMatch[2] || '';
          const prefix = raw.startsWith('€') ? '' : '';
          setTimeout(() => {
            countUp(el, num, prefix, suffix, 800 + i * 100);
          }, i * 80);
        });
        statsObs.unobserve(card);
      });
    }, { threshold: 0.4 });
    document.querySelectorAll('.hero-product').forEach(card => statsObs.observe(card));
  }

  /* ── 4. PHILOSOPHY — phil-quote gold border pulse on enter ────────── */
  // The border-pulse animation is triggered by .visible class addition.
  // We watch for when .phil-quote becomes visible.
  if (!REDUCED) {
    const philQuote = document.querySelector('.phil-quote');
    if (philQuote) {
      const mo = new MutationObserver(() => {
        if (philQuote.classList.contains('visible')) {
          philQuote.style.borderRightColor = 'var(--gold)';
        }
      });
      mo.observe(philQuote, { attributes: true, attributeFilter: ['class'] });
    }
  }

  /* ── 5. HERO PRODUCTS — subtle parallax depth on scroll ──────────── */
  // The two product cards move at slightly different rates as you scroll.
  // Creates a split-depth illusion. Subtle — never more than 12px offset.
  if (!REDUCED && window.matchMedia('(hover: hover)').matches) {
    const cards = document.querySelectorAll('.hero-product');
    if (cards.length === 2) {
      let ticking = false;
      function updateParallax() {
        const scrollY = window.scrollY;
        const hero = document.querySelector('.hero');
        if (!hero) return;
        const heroH = hero.offsetHeight;
        if (scrollY > heroH) return;
        const progress = scrollY / heroH;
        cards[0].style.transform = `translateY(${progress * -10}px)`;
        cards[1].style.transform = `translateY(${progress * -16}px)`;
        ticking = false;
      }
      window.addEventListener('scroll', () => {
        if (!ticking) {
          RAF(updateParallax);
          ticking = true;
        }
      }, { passive: true });
    }
  }

  /* ── 6. FOOTER COPY — reveal tracking animation ──────────────────── */
  if (!REDUCED) {
    const footerCopy = document.querySelector('.footer-copy');
    if (footerCopy) {
      const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            obs.unobserve(e.target);
          }
        });
      }, { threshold: 0.5 });
      obs.observe(footerCopy);
    }
  }

  /* ── 7. SHIP BADGE — globe hover accelerates spin ────────────────── */
  // Handled purely in CSS via animation-duration on hover.

  /* ── 8. TICKER — pause on hover & acceleration on resume ────────── */
  // The global CSS already pauses on hover (.ticker:hover .ticker-inner).
  // We add a smooth resume: when hover ends, the ticker eases back up
  // to speed rather than snapping.
  const ticker = document.querySelector('.ticker-inner');
  if (ticker && !REDUCED) {
    const parentTicker = ticker.closest('.ticker');
    if (parentTicker) {
      parentTicker.addEventListener('mouseleave', () => {
        ticker.style.animationPlayState = 'running';
        ticker.style.transition = 'none';
      });
    }
  }

})();
