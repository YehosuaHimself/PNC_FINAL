/* ─────────────────────────────────────────────────────────────────────────
   PNC HOME · home-gsap.js
   GSAP + ScrollTrigger world-class scroll choreography.
   Char-split hero headline, section reveals, pinned philosophy.
   Loads after DOM. Requires GSAP 3 + ScrollTrigger from CDN.
───────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  gsap.registerPlugin(ScrollTrigger);

  /* ── Lenis integration ─────────────────────────────────────────── */
  /* Sync ScrollTrigger with Lenis virtual scroll */
  (function syncLenis() {
    if (window.PNC_LENIS) {
      window.PNC_LENIS.on('scroll', ScrollTrigger.update);
      gsap.ticker.lagSmoothing(0);
    } else {
      /* Poll up to 2s for Lenis init */
      var attempts = 0;
      var t = setInterval(function () {
        attempts++;
        if (window.PNC_LENIS) {
          clearInterval(t);
          window.PNC_LENIS.on('scroll', ScrollTrigger.update);
          gsap.ticker.lagSmoothing(0);
        } else if (attempts > 40) {
          clearInterval(t);
        }
      }, 50);
    }
  })();

  /* ── UTIL: split text into char spans ──────────────────────────── */
  function splitChars(el) {
    var text = el.textContent;
    el.innerHTML = '';
    el.setAttribute('aria-label', text);
    text.split('').forEach(function (ch) {
      var s = document.createElement('span');
      s.className = 'gsap-char';
      s.setAttribute('aria-hidden', 'true');
      s.style.display = 'inline-block';
      s.style.willChange = 'transform, opacity';
      s.textContent = ch === ' ' ? '\u00A0' : ch;
      el.appendChild(s);
    });
    return el.querySelectorAll('.gsap-char');
  }

  /* ── UTIL: split text into word spans ──────────────────────────── */
  function splitWords(el) {
    var text = el.textContent;
    el.innerHTML = '';
    el.setAttribute('aria-label', text);
    text.split(/(\s+)/).forEach(function (w) {
      if (!w) return;
      var s = document.createElement('span');
      s.className = 'gsap-word';
      s.setAttribute('aria-hidden', 'true');
      s.style.display = 'inline-block';
      s.style.overflow = 'hidden';
      s.style.verticalAlign = 'bottom';
      var inner = document.createElement('span');
      inner.style.display = 'inline-block';
      inner.style.willChange = 'transform';
      inner.textContent = /^\s+$/.test(w) ? '\u00A0' : w;
      s.appendChild(inner);
      el.appendChild(s);
    });
    return el.querySelectorAll('.gsap-word > span');
  }

  /* ── 1. HERO HEADLINE — char stagger rise ───────────────────────
     "THE BEST THINGS IN LIFE." — each char lifts from below
     with a warm, weighted organic feel.
  ───────────────────────────────────────────────────────────────── */
  (function heroHeadline() {
    var headline = document.querySelector('.hero-headline');
    if (!headline) return;

    /* Split the headline text nodes only (not the <span> sub-line) */
    var inner = headline.querySelector('.hero-headline-inner') || headline;
    var textNodes = [];
    inner.childNodes.forEach(function (node) {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
        textNodes.push(node);
      }
    });

    /* Wrap each line's text in a split wrapper */
    var charGroups = [];
    textNodes.forEach(function (node) {
      var wrapper = document.createElement('span');
      wrapper.style.display = 'inline';
      wrapper.textContent = node.textContent;
      node.parentNode.replaceChild(wrapper, node);
      var chars = splitChars(wrapper);
      charGroups.push(chars);
    });

    /* Flatten all chars */
    var allChars = [];
    charGroups.forEach(function (g) {
      g.forEach(function (c) { allChars.push(c); });
    });

    if (!allChars.length) return;

    /* Set initial state */
    gsap.set(allChars, { y: '110%', opacity: 0, rotateX: -18 });

    /* Animate — staggered rise */
    gsap.to(allChars, {
      y: '0%',
      opacity: 1,
      rotateX: 0,
      duration: 1.1,
      ease: 'expo.out',
      stagger: { each: 0.022, from: 'start' },
      delay: 0.1,
      clearProps: 'transform,opacity,rotateX'
    });
  })();

  /* ── 2. HERO DECREE — word-by-word blur rise ────────────────────
     The tagline under the headline breathes in word by word.
  ───────────────────────────────────────────────────────────────── */
  (function heroDecree() {
    var decree = document.querySelector('.hero-decree');
    if (!decree) return;

    gsap.fromTo(decree,
      { opacity: 0, y: 18, filter: 'blur(6px)' },
      {
        opacity: 1, y: 0, filter: 'blur(0px)',
        duration: 1.4, ease: 'expo.out', delay: 0.55,
        clearProps: 'filter,transform,opacity'
      }
    );
  })();

  /* ── 3. PHILOSOPHY SECTION — pinned horizontal text draw ─────────
     As you scroll into the section, the quote "draws" itself in
     word by word against the dark background.
  ───────────────────────────────────────────────────────────────── */
  (function philosophyReveal() {
    var section = document.querySelector('.philosophy');
    if (!section) return;

    var quote = section.querySelector('.phil-quote');
    var textEl = section.querySelector('.phil-text');
    var attr   = section.querySelector('.phil-attr');
    var eyebrow = section.querySelector('.eyebrow');

    /* Eyebrow tracking expand */
    if (eyebrow) {
      gsap.fromTo(eyebrow,
        { opacity: 0, letterSpacing: '0.08em', y: 16 },
        {
          opacity: 1, letterSpacing: '0.32em', y: 0,
          duration: 1.2, ease: 'expo.out',
          scrollTrigger: {
            trigger: eyebrow,
            start: 'top 85%',
            toggleActions: 'play none none none'
          }
        }
      );
    }

    /* Quote — word stagger */
    if (quote) {
      /* Remove the .reveal class so our GSAP handles it */
      quote.classList.remove('reveal');
      var words = splitWords(quote);
      gsap.set(words, { y: '105%' });
      gsap.to(words, {
        y: '0%',
        duration: 1.0,
        ease: 'expo.out',
        stagger: { each: 0.04, from: 'start' },
        scrollTrigger: {
          trigger: quote,
          start: 'top 82%',
          toggleActions: 'play none none none'
        }
      });
    }

    /* Body text fade-up */
    if (textEl) {
      textEl.classList.remove('reveal');
      gsap.fromTo(textEl,
        { opacity: 0, y: 32 },
        {
          opacity: 1, y: 0,
          duration: 1.2, ease: 'expo.out',
          scrollTrigger: {
            trigger: textEl,
            start: 'top 80%',
            toggleActions: 'play none none none'
          }
        }
      );
    }

    /* Attribution */
    if (attr) {
      attr.classList.remove('reveal');
      gsap.fromTo(attr,
        { opacity: 0, x: -20 },
        {
          opacity: 1, x: 0,
          duration: 1.0, ease: 'expo.out',
          delay: 0.3,
          scrollTrigger: {
            trigger: attr,
            start: 'top 88%',
            toggleActions: 'play none none none'
          }
        }
      );
    }
  })();

  /* ── 4. PRODUCT CARDS — staggered lift-in with clip ─────────────
     Cards clip in from bottom with slight rotation, like bread
     being lifted from a board.
  ───────────────────────────────────────────────────────────────── */
  (function productCards() {
    var cards = document.querySelectorAll('.hero-product');
    if (!cards.length) return;

    /* Override the CSS animation (already played) — add a scroll-
       driven parallax depth effect on larger viewports */
    if (window.matchMedia('(hover: hover) and (min-width: 768px)').matches) {
      cards.forEach(function (card, i) {
        ScrollTrigger.create({
          trigger: card,
          start: 'top bottom',
          end: 'bottom top',
          onUpdate: function (self) {
            var p = self.progress;
            /* Subtle vertical drift: card 0 slower, card 1 faster */
            var drift = i === 0 ? (p - 0.5) * -20 : (p - 0.5) * -30;
            gsap.set(card, { y: drift });
          }
        });
      });
    }
  })();

  /* ── 5. HORIZONTAL RULE LINES — draw in from edges ──────────────
     Any .section-rule or hr draws outward from centre.
  ───────────────────────────────────────────────────────────────── */
  (function ruleLines() {
    document.querySelectorAll('.section-divider, .phil-rule').forEach(function (el) {
      gsap.fromTo(el,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.6,
          ease: 'expo.out',
          transformOrigin: 'left center',
          scrollTrigger: {
            trigger: el,
            start: 'top 90%',
            toggleActions: 'play none none none'
          }
        }
      );
    });
  })();

  /* ── 6. FOOTER COPY — tracking letter-space reveal ──────────────
     The footer Roman numeral text expands tracking on enter.
  ───────────────────────────────────────────────────────────────── */
  (function footerReveal() {
    var fc = document.querySelector('.footer-copy');
    if (!fc) return;
    gsap.fromTo(fc,
      { opacity: 0, letterSpacing: '0.04em' },
      {
        opacity: 1, letterSpacing: '0.14em',
        duration: 1.4, ease: 'expo.out',
        scrollTrigger: {
          trigger: fc,
          start: 'top 95%',
          toggleActions: 'play none none none'
        }
      }
    );
  })();

  /* ── 7. SHIP BADGE — scale in from 0 with overshoot ─────────────*/
  (function shipBadge() {
    var badge = document.querySelector('.ship-badge');
    if (!badge) return;
    gsap.fromTo(badge,
      { opacity: 0, scale: 0.88, y: 24 },
      {
        opacity: 1, scale: 1, y: 0,
        duration: 1.0, ease: 'back.out(1.3)',
        scrollTrigger: {
          trigger: badge,
          start: 'top 88%',
          toggleActions: 'play none none none'
        }
      }
    );
  })();

})();
