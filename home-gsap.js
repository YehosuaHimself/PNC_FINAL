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

  /* ── PRELOADER TIMING ─────────────────────────────────────────────
     On first load the preloader holds for ~2.06s then lifts over 0.9s.
     Hero elements should emerge AS the curtain rises (at ~1.8s).
     On returning visits (pnc_visited set) — fire immediately.
  ───────────────────────────────────────────────────────────────── */
  var HERO_DELAY = sessionStorage.getItem('pnc_visited') ? 0 : 1.82;

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
      delay: HERO_DELAY,
      clearProps: 'transform,opacity'
    });

    var sub = document.querySelector('.hero-headline .hl-sub');
    if (sub) {
      gsap.set(sub, { opacity: 0, y: 16 });
      gsap.to(sub, {
        opacity: 1, y: 0,
        duration: 1.2, ease: 'expo.out', delay: HERO_DELAY + 0.52,
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
        duration: 1.4, ease: 'expo.out', delay: HERO_DELAY + 0.55,
        clearProps: 'filter,transform,opacity'
      }
    );
  })();

  /* ── 2b. HERO PANELS — clip-path wipe from below ─────────────────
     The two product panels wipe up from below, staggered.
     Bread first (left), brew follows 180ms later.
     The hero topbar and scroll indicator fade in with the panels.
  ───────────────────────────────────────────────────────────────── */
  (function heroPanelEntrance() {
    var panels  = document.querySelectorAll('.hero-panel');
    var topbar  = document.querySelector('.hero-topbar');
    var scroll  = document.querySelector('.hero-scroll');

    if (panels.length) {
      gsap.set(panels, { clipPath: 'inset(100% 0 0 0)', opacity: 1 });
      gsap.to(panels, {
        clipPath: 'inset(0% 0 0 0)',
        duration: 1.2,
        ease: 'expo.inOut',
        stagger: 0.14,
        delay: HERO_DELAY + 0.18,
        clearProps: 'clipPath'
      });
    }

    if (topbar) {
      gsap.fromTo(topbar,
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out', delay: HERO_DELAY + 0.05 }
      );
    }

    if (scroll) {
      gsap.fromTo(scroll,
        { opacity: 0 },
        { opacity: 1, duration: 0.7, ease: 'expo.out', delay: HERO_DELAY + 1.2 }
      );
    }
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

    /* Quote — word stagger — preserve <em> attribution */
    if (quote) {
      quote.classList.remove('reveal');

      /* Collect only direct text content (before the em tag) */
      var emEl = quote.querySelector('em');
      var mainText = '';
      quote.childNodes.forEach(function(node) {
        if (node.nodeType === 3) mainText += node.textContent;
      });
      mainText = mainText.trim();

      /* Rebuild: word spans + preserved em */
      var fullLabel = quote.getAttribute('aria-label') || quote.textContent;
      quote.setAttribute('aria-label', fullLabel);

      /* Clear text nodes but keep em */
      var toRemove = [];
      quote.childNodes.forEach(function(node) {
        if (node.nodeType === 3) toRemove.push(node);
      });
      toRemove.forEach(function(n) { quote.removeChild(n); });

      /* Insert word spans at the start */
      var frag = document.createDocumentFragment();
      mainText.split(/(\s+)/).forEach(function(w) {
        if (!w) return;
        var s = document.createElement('span');
        s.className = 'gsap-word';
        s.setAttribute('aria-hidden', 'true');
        s.style.cssText = 'display:inline-block;overflow:hidden;vertical-align:bottom;';
        var inner = document.createElement('span');
        inner.style.cssText = 'display:inline-block;will-change:transform;';
        inner.textContent = /^\s+$/.test(w) ? '\u00A0' : w;
        s.appendChild(inner);
        frag.appendChild(s);
      });
      quote.insertBefore(frag, quote.firstChild);

      var words = quote.querySelectorAll('.gsap-word > span');
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
      /* Zero targets count DOWN from a small number — the resolution
         to 0 is the dramatic beat (no fillers, no additives, no shortcuts) */
      var from = target === 0 ? 7 : 0;
      function tick(now) {
        if (!start) start = now;
        var progress = Math.min((now - start) / duration, 1);
        var eased = easeOutExpo(progress);
        var current = Math.round(from + (target - from) * eased);
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
      anticipatePin: 1,
      scrub: 1.0,
      start: 'top top',
      end: () => '+=' + ((totalPanels - 1) * window.innerHeight * 1.5) + 'px',
      onUpdate: function (self) {
        var p = self.progress;
        if (bar) bar.style.width = (p * 100) + '%';
        if (hint) {
          if (p > 0.05) hint.classList.add('hidden');
          else hint.classList.remove('hidden');
        }
        /* Mark the active panel for breathing animation */
        var activeIdx = Math.min(
          Math.floor(p * totalPanels),
          totalPanels - 1
        );
        panels.forEach(function (panel, i) {
          if (i === activeIdx) panel.classList.add('mp-active');
          else panel.classList.remove('mp-active');
        });
        /* Counter-scroll the subliminal Latin text layer */
        /* Moves opposite direction: right as panels scroll left */
        section.style.setProperty('--mp-offset', (p * 180) + 'px');

        /* Velocity-driven blur — fast scrub blurs the text; slowing to read
           sharpens it into crystal clarity. Reading feels earned.           */
        var vel = Math.abs(self.getVelocity ? self.getVelocity() : 0);
        var blur = Math.min(vel * 0.0032, 5.5); /* cap at 5.5px */
        track.style.filter = blur > 0.1 ? 'blur(' + blur.toFixed(2) + 'px)' : '';
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


/* ── RITUAL SECTION — staggered reveals ─────────────────────────── */
(function ritualReveal() {
  var section = document.querySelector('.ritual-section');
  if (!section) return;

  var headline = section.querySelector('.ritual-headline');
  var body     = section.querySelector('.ritual-body');
  var ctaRow   = section.querySelector('.ritual-cta-row');
  var images   = section.querySelectorAll('.ritual-image');
  var caption  = section.querySelector('.ritual-caption');

  if (headline) {
    gsap.fromTo(headline,
      { opacity: 0, y: 36 },
      { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out',
        scrollTrigger: { trigger: headline, start: 'top 80%', toggleActions: 'play none none none' }
      }
    );
  }

  if (body) {
    gsap.fromTo(body,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 1.0, ease: 'expo.out', delay: 0.15,
        scrollTrigger: { trigger: body, start: 'top 82%', toggleActions: 'play none none none' }
      }
    );
  }

  if (ctaRow) {
    gsap.fromTo(ctaRow,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', delay: 0.25,
        scrollTrigger: { trigger: ctaRow, start: 'top 85%', toggleActions: 'play none none none' }
      }
    );
  }

  images.forEach(function (img, i) {
    gsap.fromTo(img,
      { opacity: 0, scale: 0.94, y: i === 0 ? -20 : 20 },
      { opacity: 1, scale: 1, y: i === 0 ? -8 : 8,
        duration: 1.3, ease: 'expo.out', delay: i * 0.1,
        scrollTrigger: { trigger: img, start: 'top 85%', toggleActions: 'play none none none' }
      }
    );
  });
})();


/* ── ORIGIN SECTION — staggered card entrance ────────────────────────
   Cards slide up from below on scroll enter.
   Map SVG country path draws its stroke.
────────────────────────────────────────────────────────────────────── */
(function originReveal() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  var cards = document.querySelectorAll('.origin-card');
  if (!cards.length) return;

  cards.forEach(function (card, i) {
    card.classList.remove('reveal', 'reveal-d2');
    gsap.fromTo(card,
      { opacity: 0, y: 40 },
      {
        opacity: 1, y: 0,
        duration: 0.9, ease: 'expo.out',
        delay: i * 0.12,
        clearProps: 'transform,opacity',
        scrollTrigger: {
          trigger: card,
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      }
    );
  });

  /* Origin headline clip-up */
  var headline = document.querySelector('.origin-headline');
  if (headline) {
    headline.classList.remove('reveal');
    gsap.fromTo(headline,
      { opacity: 0, y: 36 },
      {
        opacity: 1, y: 0,
        duration: 1.1, ease: 'expo.out',
        clearProps: 'transform,opacity',
        scrollTrigger: {
          trigger: headline,
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      }
    );
  }

  /* Pulse rings scale up dramatically on card hover */
  cards.forEach(function (card) {
    var pulses = card.querySelectorAll('.oc-pulse');
    card.addEventListener('mouseenter', function () {
      pulses.forEach(function (p) {
        p.style.animationDuration = '1.4s';
      });
    });
    card.addEventListener('mouseleave', function () {
      pulses.forEach(function (p) {
        p.style.animationDuration = '2.8s';
      });
    });
  });

})();


/* ── HERO WATERMARK — deep parallax scroll drift ─────────────────────
   The giant PNC watermark drifts at a different rate than the hero,
   creating a parallax depth illusion. Combined with slight scale.
────────────────────────────────────────────────────────────────────── */
(function watermarkParallax() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;

  var wm = document.querySelector('.hero-watermark-text');
  if (!wm) return;

  gsap.to(wm, {
    yPercent: -18,
    scale: 1.04,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 1.4
    }
  });

})();


/* ── HERO PRODUCTS — parallax depth scroll ───────────────────────────
   The two cards drift at slightly different speeds on scroll,
   creating a depth separation between bread and coffee.
────────────────────────────────────────────────────────────────────── */
(function heroProductsParallax() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  if (!window.matchMedia('(hover:hover) and (min-width:768px)').matches) return;

  var cards = document.querySelectorAll('.hero-product');
  if (cards.length < 2) return;

  /* Card 1: bread — slower parallax (feels heavier) */
  gsap.to(cards[0], {
    y: -32,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero-products',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1.6
    }
  });

  /* Card 2: brew — faster parallax (feels lighter) */
  gsap.to(cards[1], {
    y: -52,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero-products',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1.0
    }
  });

})();


/* ── PROOF STRIP NUMBERS — letter-spacing expand on enter ────────────
   Numbers expand their tracking as they count up for extra drama.
────────────────────────────────────────────────────────────────────── */
(function proofTracking() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  var nums = document.querySelectorAll('.proof-num');
  nums.forEach(function (el) {
    gsap.fromTo(el,
      { letterSpacing: '-0.06em', opacity: 0, y: 20 },
      {
        letterSpacing: '-0.03em', opacity: 1, y: 0,
        duration: 1.0, ease: 'expo.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 80%',
          toggleActions: 'play none none none'
        }
      }
    );
  });

})();


/* ── MANIFESTO CLAIM — char-by-char color fill on scroll ─────────────
   As the user scrolls through each panel, the claim text chars
   light up from left to right — like words becoming real.
────────────────────────────────────────────────────────────────────── */
(function manifestoClaims() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  if (!window.matchMedia('(min-width: 641px)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;

  var claims = document.querySelectorAll('.mp-claim');
  claims.forEach(function (claim) {
    /* Split into chars */
    var text = claim.innerText;
    claim.innerHTML = '';
    claim.setAttribute('aria-label', text);

    text.split('').forEach(function (ch) {
      var s = document.createElement('span');
      s.setAttribute('aria-hidden', 'true');
      s.style.cssText = 'display:inline-block;color:rgba(248,244,236,0.10);transition:none;';
      s.textContent = ch === '\n' ? '\u00A0' : ch;
      if (ch === '\n') { claim.appendChild(document.createElement('br')); return; }
      claim.appendChild(s);
    });

    var chars = claim.querySelectorAll('span');

    gsap.to(chars, {
      color: 'rgba(248,244,236,1)',
      duration: 0.01,
      stagger: {
        each: 0.025,
        from: 'start'
      },
      scrollTrigger: {
        trigger: claim,
        start: 'top 70%',
        end: 'top 20%',
        scrub: 0.8
      }
    });
  });

})();


/* ── RITUAL IMAGES — clip-path scrub reveal ──────────────────────────
   Both images wipe open from bottom, staggered.
────────────────────────────────────────────────────────────────────── */
(function ritualClip() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;

  var images = document.querySelectorAll('.ritual-image');
  images.forEach(function (img, i) {
    gsap.fromTo(img,
      { clipPath: 'inset(100% 0 0 0)' },
      {
        clipPath: 'inset(0% 0 0 0)',
        duration: 1.4,
        ease: 'expo.inOut',
        delay: i * 0.18,
        scrollTrigger: {
          trigger: img,
          start: 'top 82%',
          toggleActions: 'play none none none'
        }
      }
    );
  });

})();


/* ── PRINCIPLES — staggered slide-in + line draw ─────────────────────
   Each principle item slides in from the left with a delay.
   The horizontal rule draws outward from left.
────────────────────────────────────────────────────────────────────── */
(function principlesReveal() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  var items = document.querySelectorAll('.principle-item');
  items.forEach(function (item, i) {
    item.classList.remove('reveal', 'reveal-d1', 'reveal-d2');

    gsap.fromTo(item,
      { opacity: 0, x: -40 },
      {
        opacity: 1, x: 0,
        duration: 1.0, ease: 'expo.out',
        delay: i * 0.10,
        clearProps: 'transform,opacity',
        scrollTrigger: {
          trigger: item,
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      }
    );

    var line = item.querySelector('.pi-line');
    if (line) {
      gsap.fromTo(line,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.4, ease: 'expo.out',
          delay: i * 0.10 + 0.2,
          transformOrigin: 'left center',
          scrollTrigger: {
            trigger: item,
            start: 'top 85%',
            toggleActions: 'play none none none'
          }
        }
      );
    }
  });

})();




/* ── PHILOSOPHY ACCENT NUMBER — scroll parallax ─────────────────────
   The large background "03" drifts slower than the section scroll.
────────────────────────────────────────────────────────────────────── */
(function philAccentParallax() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;

  var num = document.querySelector('.phil-accent-num');
  if (!num) return;

  gsap.to(num, {
    y: -60,
    ease: 'none',
    scrollTrigger: {
      trigger: '.philosophy',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 2.0
    }
  });

})();


/* ── HERO PANEL IMAGES — scroll parallax depth ───────────────────────
   The background images drift upward at different rates as user
   scrolls past the hero, creating true photographic depth.
   GPU-safe: only transforms animated, no background-position.
────────────────────────────────────────────────────────────────────── */
(function heroPanelParallax() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  if (!window.matchMedia('(min-width:640px)').matches) return;

  var imgs = document.querySelectorAll('.hp2-img');
  if (!imgs.length) return;

  imgs.forEach(function(img, i) {
    /* bread (0) drifts slower — feels heavier, earthier */
    /* brew (1) drifts faster — feels lighter, vaporous */
    var yEnd = i === 0 ? '-12%' : '-18%';

    gsap.to(img, {
      yPercent: i === 0 ? -6 : -9,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1.2
      }
    });
  });

})();


/* ── PRE-FOOTER STATEMENT — letter-space prayer unfold ───────────────
   "PANEM NOSTRUM COTIDIANUM DA NOBIS HODIE" expands its tracking
   as the section enters the viewport — like a breath being taken.
   The eyebrow surfaces first, then the main text unfolds outward.
────────────────────────────────────────────────────────────────────── */
(function preFooterReveal() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  var section = document.querySelector('.pre-footer-statement');
  if (!section) return;

  var eyebrow = section.querySelector('.pfs-eyebrow');
  var main    = section.querySelector('.pfs-main');

  if (eyebrow) {
    gsap.fromTo(eyebrow,
      { opacity: 0, letterSpacing: '0.12em' },
      {
        opacity: 1, letterSpacing: '0.32em',
        duration: 1.4, ease: 'expo.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 78%',
          toggleActions: 'play none none none'
        }
      }
    );
  }

  if (main) {
    gsap.fromTo(main,
      { opacity: 0, letterSpacing: '-0.04em', y: 28 },
      {
        opacity: 1, letterSpacing: '-0.02em', y: 0,
        duration: 1.8, ease: 'expo.out', delay: 0.2,
        clearProps: 'transform',
        scrollTrigger: {
          trigger: section,
          start: 'top 75%',
          toggleActions: 'play none none none'
        }
      }
    );
  }

})();


/* ── FOOTER WATERMARK — staggered scale + opacity entrance ───────────
   PANEM then NOSTRUM rise from 0.88 scale into full size.
   Each line clips up from overflow:hidden parent.
   The creed and coords fade in after the lines settle.
────────────────────────────────────────────────────────────────────── */
(function footerWatermark() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;

  var lines  = document.querySelectorAll('.ft-statement-line');
  var creed  = document.querySelector('.ft-creed');
  var coords = document.querySelector('.ft-coords');
  var footer = document.querySelector('footer[data-dark]');
  if (!lines.length || !footer) return;

  /* Wrap each line in overflow:hidden so it clips cleanly */
  lines.forEach(function (line) {
    var wrap = document.createElement('div');
    wrap.style.overflow = 'hidden';
    line.parentNode.insertBefore(wrap, line);
    wrap.appendChild(line);
  });

  gsap.fromTo(lines,
    { yPercent: 105, opacity: 0 },
    {
      yPercent: 0,
      opacity: 1,
      duration: 1.4,
      ease: 'expo.out',
      stagger: 0.18,
      clearProps: 'transform,opacity',
      scrollTrigger: {
        trigger: footer,
        start: 'top 88%',
        toggleActions: 'play none none none'
      }
    }
  );

  if (creed) {
    gsap.fromTo(creed,
      { opacity: 0, y: 12 },
      {
        opacity: 1, y: 0,
        duration: 1.0, ease: 'expo.out', delay: 0.32,
        scrollTrigger: {
          trigger: footer,
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      }
    );
  }

  if (coords) {
    gsap.fromTo(coords,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 0.8, ease: 'expo.out', delay: 0.5,
        scrollTrigger: {
          trigger: footer,
          start: 'top 80%',
          toggleActions: 'play none none none'
        }
      }
    );
  }
})();


/* ── HERO PANEL NAMES — warm gold gradient shimmer on hover ──────────
   The OUR DAILY BREAD. / BREW. text warms from cream to gold
   as a gradient sweep when the panel is hovered.
   Uses CSS custom property driven by a tiny GSAP tween.
────────────────────────────────────────────────────────────────────── */
(function heroPanelNameShimmer() {
  if (typeof gsap === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  if (!window.matchMedia('(hover:hover)').matches) return;

  document.querySelectorAll('.hero-panel').forEach(function (panel) {
    var name = panel.querySelector('.hp2-name');
    if (!name) return;

    var proxy = { t: 0 };

    panel.addEventListener('mouseenter', function () {
      gsap.to(proxy, {
        t: 1, duration: 0.55, ease: 'expo.out',
        onUpdate: function () {
          var v = proxy.t;
          /* Interpolate: cream → gold at top, amber at bottom */
          name.style.backgroundImage =
            'linear-gradient(160deg,' +
            'rgba(248,244,236,1) ' + (100 - v * 30) + '%,' +
            'rgba(209,155,64,' + (0.4 + v * 0.6) + ') ' + (100 - v * 10) + '%,' +
            'rgba(184,100,20,' + (v * 0.7) + ') 100%)';
          name.style.webkitBackgroundClip = 'text';
          name.style.backgroundClip = 'text';
          name.style.webkitTextFillColor = v > 0.05 ? 'transparent' : '';
          name.style.color = v > 0.05 ? 'transparent' : '';
        }
      });
    });

    panel.addEventListener('mouseleave', function () {
      gsap.to(proxy, {
        t: 0, duration: 0.4, ease: 'power2.out',
        onUpdate: function () {
          var v = proxy.t;
          if (v < 0.02) {
            name.style.backgroundImage = '';
            name.style.webkitBackgroundClip = '';
            name.style.backgroundClip = '';
            name.style.webkitTextFillColor = '';
            name.style.color = '';
          } else {
            name.style.backgroundImage =
              'linear-gradient(160deg,' +
              'rgba(248,244,236,1) ' + (100 - v * 30) + '%,' +
              'rgba(209,155,64,' + (0.4 + v * 0.6) + ') ' + (100 - v * 10) + '%,' +
              'rgba(184,100,20,' + (v * 0.7) + ') 100%)';
          }
        }
      });
    });
  });
})();
