/* ─────────────────────────────────────────────────────────────────────────
   PNC BREAD · micro.js — Awwwards-grade micro-interactions
   Loaded after script.js. Zero conflicts with existing code.
   Each effect is guarded by prefers-reduced-motion.
───────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const RAF = requestAnimationFrame;

  /* ── 1. HERO HEADLINE — word-split stagger ──────────────────────── */
  // Split each word in the headline into an animatable span
  function splitHeadline() {
    const hl = document.querySelector('.hero-headline');
    if (!hl) return;
    // Only the first text node (not the span subtitle)
    const walker = document.createTreeWalker(hl, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) {
      // Skip text inside the subtitle span
      if (node.parentElement && node.parentElement.tagName === 'SPAN') continue;
      textNodes.push(node);
    }
    textNodes.forEach(tn => {
      const words = tn.textContent.split(/(\s+)/);
      const frag = document.createDocumentFragment();
      words.forEach((w, i) => {
        if (/^\s+$/.test(w)) {
          frag.appendChild(document.createTextNode(w));
        } else {
          const span = document.createElement('span');
          span.className = 'hero-hl-word';
          span.textContent = w;
          // Each word gets its delay
          const delay = 0.18 + i * 0.06;
          span.style.animationDelay = delay + 's';
          frag.appendChild(span);
        }
      });
      tn.parentNode.replaceChild(frag, tn);
    });
  }
  if (!REDUCED) splitHeadline();

  /* ── 2. ING-STAT VALS COUNT-UP ─────────────────────────────────── */
  // Animates numeric stat values to their final number on intersection
  function parseNumber(str) {
    // Extract leading number, ignoring units like "M yr", "km", "%"
    const m = str.match(/^~?([\d,.]+)/);
    return m ? parseFloat(m[1].replace(/,/g, '')) : null;
  }
  function animateCount(el, from, to, duration, prefix, suffix) {
    const start = performance.now();
    el.classList.add('counting');
    function tick(now) {
      const t = Math.min((now - start) / duration, 1);
      // ease out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const val = from + (to - from) * eased;
      el.textContent = prefix + Math.round(val).toLocaleString() + suffix;
      if (t < 1) {
        RAF(tick);
      } else {
        el.textContent = prefix + to.toLocaleString() + suffix;
        el.classList.remove('counting');
        el.setAttribute('data-counted', '1');
      }
    }
    RAF(tick);
  }

  if (!REDUCED) {
    const ingStatVals = document.querySelectorAll('.ing-stat-val');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const el = entry.target;
        if (!entry.isIntersecting || el.getAttribute('data-counted')) return;
        const original = el.textContent.trim();
        const num = parseNumber(original);
        if (num === null) return;
        // Detect prefix/suffix
        const prefix = original.startsWith('~') ? '~' : '';
        const suffix = original.replace(/^~?[\d,.]+/, '');
        animateCount(el, 0, num, 900, prefix, suffix);
      });
    }, { threshold: 0.6 });
    ingStatVals.forEach(el => obs.observe(el));
  }

  /* ── 3. TRUST BLOCK VALS — stagger reveal on intersection ───────── */
  if (!REDUCED) {
    const trustVals = document.querySelectorAll('.trust-val');
    if (trustVals.length) {
      const to = new IntersectionObserver((entries) => {
        entries.forEach((e, i) => {
          if (!e.isIntersecting) return;
          setTimeout(() => e.target.classList.add('visible'), i * 120);
          to.unobserve(e.target);
        });
      }, { threshold: 0.5 });
      trustVals.forEach(el => to.observe(el));
    }
  }

  /* ── 4. BLESSING QUOTES — underline reveal trigger ──────────────── */
  // The .visible class is added by the main reveal observer on the element.
  // We piggyback on a MutationObserver to trigger the ::after underline.
  if (!REDUCED) {
    const bqs = document.querySelectorAll('.blessing-quote');
    if (bqs.length) {
      const mo = new MutationObserver(() => {
        // Already done by CSS .blessing-quote.visible::after — nothing to do
      });
      bqs.forEach(el => mo.observe(el, { attributes: true, attributeFilter: ['class'] }));
    }
  }

  /* ── 5. FORMAT CARD — time number countdown on hover ─────────────── */
  // When you hover a format-card the big time number counts down to 1
  // like a timer running. Resets on mouse leave.
  if (!REDUCED) {
    document.querySelectorAll('.format-card').forEach(card => {
      const timeEl = card.querySelector('.format-time');
      if (!timeEl) return;
      const original = parseInt(timeEl.textContent, 10);
      if (isNaN(original)) return;

      let frame;
      let startTime;
      let startVal;
      let targetVal;
      let animDir = 0; // 1=down, -1=up

      function runAnim(fromVal, toVal, dur) {
        startTime = performance.now();
        startVal = fromVal;
        targetVal = toVal;
        function tick(now) {
          const t = Math.min((now - startTime) / dur, 1);
          const eased = 1 - Math.pow(1 - t, 2);
          const v = startVal + (targetVal - startVal) * eased;
          timeEl.textContent = Math.round(v);
          if (t < 1) {
            frame = RAF(tick);
          } else {
            timeEl.textContent = targetVal;
          }
        }
        cancelAnimationFrame(frame);
        frame = RAF(tick);
      }

      card.addEventListener('mouseenter', () => {
        // Count down from original to ~half (feels like a timer starting)
        const countTo = Math.max(1, Math.floor(original * 0.35));
        runAnim(original, countTo, 1400);
      });
      card.addEventListener('mouseleave', () => {
        const current = parseInt(timeEl.textContent, 10) || original;
        runAnim(current, original, 700);
      });
    });
  }

  /* ── 6. BREAD QTY CARD — spring click + sibling dimming ─────────── */
  if (!REDUCED) {
    const grid = document.querySelector('.bread-qty-grid');
    if (grid) {
      grid.addEventListener('click', e => {
        const card = e.target.closest('.bread-qty-card');
        if (!card) return;
        // Spring animation
        card.classList.remove('spring');
        void card.offsetWidth; // reflow
        card.classList.add('spring');
        card.addEventListener('animationend', () => card.classList.remove('spring'), { once: true });
      });
    }
  }

  /* ── 7. INGREDIENT ROWS — PARALLAX COORDINATE FLOAT ─────────────── */
  // On hover, the coordinate slightly parallaxes with mouse position
  if (!REDUCED && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.ing-row').forEach(row => {
      const coord = row.querySelector('.ing-coords');
      if (!coord) return;
      row.addEventListener('mousemove', e => {
        const rect = row.getBoundingClientRect();
        const cx = (e.clientX - rect.left) / rect.width - 0.5;
        const cy = (e.clientY - rect.top) / rect.height - 0.5;
        coord.style.transform = `translate(${cx * 4}px, ${cy * 3}px)`;
      });
      row.addEventListener('mouseleave', () => {
        coord.style.transform = '';
      });
    });
  }

  /* ── 8. HERO SCROLL INDICATOR — hide after first scroll ─────────── */
  const heroScroll = document.querySelector('.hero-scroll');
  if (heroScroll) {
    let scrolled = false;
    window.addEventListener('scroll', () => {
      if (!scrolled && window.scrollY > 80) {
        scrolled = true;
        heroScroll.classList.add('hidden');
      } else if (scrolled && window.scrollY < 20) {
        scrolled = false;
        heroScroll.classList.remove('hidden');
      }
    }, { passive: true });
  }

  /* ── 9. SHIP BADGE GLOBE — rotation on hover ─────────────────────── */
  // Tiny detail: globe rotates on hover via CSS. Nothing extra needed.
  // Extra: globe does a gentle idle pulse
  if (!REDUCED) {
    const globe = document.querySelector('.ship-globe');
    if (globe) {
      globe.style.animation = 'globePulse 4s ease-in-out infinite';
      const style = document.createElement('style');
      style.textContent = '@keyframes globePulse{0%,100%{opacity:.45}50%{opacity:.65}}';
      document.head.appendChild(style);
    }
  }

})();
