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

  /* ── 1. HERO HEADLINE — clip-mask wipe ─────────────────────────
     Each .hl-inner slides up from its overflow:hidden parent.
     CSS animation handles it; GSAP enhances with smoother control.
  ───────────────────────────────────────────────────────────────── */
  (function heroHeadline() {
    var inners = document.querySelectorAll('.hero-headline .hl-inner');
    if (!inners.length) return;

    /* Override CSS animation with GSAP for better control */
    gsap.set(inners, { yPercent: 108, opacity: 0 });
    gsap.to(inners, {
      yPercent: 0,
      opacity: 1,
      duration: 1.15,
      ease: 'expo.out',
      stagger: 0.13,
      delay: 0.05,
      clearProps: 'transform,opacity'
    });

    var sub = document.querySelector('.hero-headline .hl-sub');
    if (sub) {
      gsap.set(sub, { opacity: 0, y: 16 });
      gsap.to(sub, {
        opacity: 1, y: 0,
        duration: 1.2, ease: 'expo.out', delay: 0.52,
        clearProps: 'transform,opacity'
      });
    }
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

/* ── 8. PROOF STRIP — staggered number count-up + line draw ─────
   Numbers count up from 0 as each enters viewport.
   Column dividers draw down. Labels fade in with stagger.
───────────────────────────────────────────────────────────────── */
(function proofStrip() {
  var nums = document.querySelectorAll('.proof-num');
  var labels = document.querySelectorAll('.proof-label');
  var dividers = document.querySelectorAll('.proof-divider');
  if (!nums.length) return;

  function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function countUp(el, target, prefix, suffix, duration, delay) {
    setTimeout(function () {
      var start = null;
      var isFloat = !Number.isInteger(target);
      function tick(now) {
        if (!start) start = now;
        var progress = Math.min((now - start) / duration, 1);
        var eased = easeOutExpo(progress);
        var current = Math.round(target * eased);
        el.textContent = (prefix || '') + current.toLocaleString() + (suffix || '');
        if (progress < 1) requestAnimationFrame(tick);
        else el.textContent = (prefix || '') + target.toLocaleString() + (suffix || '');
      }
      requestAnimationFrame(tick);
    }, delay || 0);
  }

  var triggered = false;
  var strip = document.querySelector('.proof-strip');
  if (!strip) return;

  ScrollTrigger.create({
    trigger: strip,
    start: 'top 75%',
    onEnter: function () {
      if (triggered) return;
      triggered = true;

      /* Draw dividers */
      dividers.forEach(function (d, i) {
        setTimeout(function () { d.classList.add('visible'); }, i * 80);
      });

      /* Animate numbers */
      nums.forEach(function (el, i) {
        var target = parseInt(el.dataset.target, 10);
        var prefix = el.dataset.prefix || '';
        var suffix = el.dataset.suffix || '';
        var delay = i * 90;

        /* GSAP fade-up */
        gsap.to(el, {
          opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', delay: delay / 1000
        });

        /* Count-up */
        countUp(el, target, prefix, suffix, 1200, delay);
      });

      /* Fade labels */
      labels.forEach(function (el, i) {
        setTimeout(function () { el.classList.add('visible'); }, i * 90 + 300);
      });
    }
  });
})();


/* ── HORIZONTAL MANIFESTO — ScrollTrigger pinned ─────────────────────
   On desktop: pins the section, translates the track horizontally
   as user scrolls. On mobile: stacked vertically (CSS).
────────────────────────────────────────────────────────────────────── */
(function manifestoScroll() {
  if (!window.matchMedia('(min-width: 641px)').matches) return;

  var section = document.querySelector('.manifesto');
  var track   = document.querySelector('.manifesto-track');
  var bar     = document.querySelector('.manifesto-progress-bar');
  var hint    = document.querySelector('.manifesto-hint');
  if (!section || !track) return;

  var panels = document.querySelectorAll('.manifesto-panel');
  var totalPanels = panels.length;
  /* The track moves left by (totalPanels-1) × 100vw */
  var travelPct   = (totalPanels - 1) * 100;

  /* xPercent moves the 300vw track: -100/3 per panel means each 33.3% = 100vw */
  /* We want to end at -200/3 * 100 ... simpler: move by -(totalPanels-1)*100 vw
     but xPercent is relative to element width (300vw), so -(200/300)*100 = -66.6% */
  var xEnd = -((totalPanels - 1) / totalPanels) * 100;

  gsap.to(track, {
    xPercent: xEnd,
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      pin: true,
      scrub: 1.2,
      start: 'top top',
      end: '+=' + ((totalPanels - 1) * window.innerHeight * 1.6) + 'px',
      onUpdate: function (self) {
        var p = self.progress;
        if (bar) bar.style.width = (p * 100) + '%';
        if (hint) {
          if (p > 0.05) hint.classList.add('hidden');
          else hint.classList.remove('hidden');
        }
      }
    }
  });

  /* Animate panel text on enter — GSAP scrub */
  panels.forEach(function (panel, i) {
    var claim  = panel.querySelector('.mp-claim');
    var detail = panel.querySelector('.mp-detail');
    var lbl    = panel.querySelector('.mp-label');

    if (lbl) {
      gsap.fromTo(lbl,
        { opacity: 0, y: 20, letterSpacing: '0.12em' },
        {
          opacity: 1, y: 0, letterSpacing: '0.36em',
          duration: 0.8, ease: 'expo.out',
          scrollTrigger: {
            trigger: panel,
            containerAnimation: gsap.getById && null, /* use global scroll */
            start: 'top 80%',
            toggleActions: 'play none none none'
          }
        }
      );
    }

    if (claim) {
      var claimWords = claim.querySelectorAll('br');
      gsap.fromTo(claim,
        { opacity: 0, y: 40 },
        {
          opacity: 1, y: 0,
          duration: 1.0, ease: 'expo.out', delay: i === 0 ? 0 : 0.1,
          scrollTrigger: {
            trigger: panel,
            start: 'top 80%',
            toggleActions: 'play none none none'
          }
        }
      );
    }

    if (detail) {
      gsap.fromTo(detail,
        { opacity: 0, y: 24 },
        {
          opacity: 1, y: 0,
          duration: 1.0, ease: 'expo.out', delay: 0.2,
          scrollTrigger: {
            trigger: panel,
            start: 'top 80%',
            toggleActions: 'play none none none'
          }
        }
      );
    }
  });
})();
