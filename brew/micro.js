/* ═══════════════════════════════════════════════════════════
   PNC BREW — MICRO.JS  v3  COMPLETE
   Surgical JS micro-interactions. Nothing that CSS alone can do.
   Awwwards-grade. Runs after script.js.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var fine         = window.matchMedia('(hover:hover) and (pointer:fine)');
  var reduced      = window.matchMedia('(prefers-reduced-motion:reduce)');


  /* ── 1. HERO HEADLINE — word-split stagger ─────────────────── */

  function splitHeroHeadline() {
    var hl = document.querySelector('.hero-headline');
    if (!hl) return;
    var walker = document.createTreeWalker(hl, NodeFilter.SHOW_TEXT);
    var nodes  = [];
    var node;
    while ((node = walker.nextNode())) {
      if (node.parentElement && node.parentElement.tagName === 'SPAN') continue;
      nodes.push(node);
    }
    nodes.forEach(function (tn) {
      var parts = tn.textContent.split(/(\s+)/);
      var frag  = document.createDocumentFragment();
      var wordIdx = 0;
      parts.forEach(function (w) {
        if (/^\s+$/.test(w)) {
          frag.appendChild(document.createTextNode(w));
        } else {
          var span = document.createElement('span');
          span.className = 'brew-hl-word';
          span.textContent = w;
          span.style.animationDelay = (0.2 + wordIdx * 0.065) + 's';
          frag.appendChild(span);
          wordIdx++;
        }
      });
      tn.parentNode.replaceChild(frag, tn);
    });
  }
  if (!reduced.matches) splitHeroHeadline();


  /* ── 2. HERO SCROLL HIDE ───────────────────────────────────── */

  var heroScroll = document.querySelector('.hero-scroll');
  if (heroScroll) {
    var lastScrollY = 0;
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      if (y > 80)  heroScroll.classList.add('hidden');
      if (y < 20)  heroScroll.classList.remove('hidden');
      lastScrollY = y;
    }, { passive: true });
  }


  /* ── 3. MAGNETIC PULL ON STEP TITLES ──────────────────────── */

  if (fine.matches && !reduced.matches) {
    document.querySelectorAll('.step').forEach(function (step) {
      var title = step.querySelector('.step-title');
      if (!title) return;
      var rect;

      step.addEventListener('mouseenter', function () {
        rect = step.getBoundingClientRect();
      });
      step.addEventListener('mousemove', function (e) {
        if (!rect) rect = step.getBoundingClientRect();
        var rx = (e.clientX - rect.left)  / rect.width  - 0.5;
        var ry = (e.clientY - rect.top)   / rect.height - 0.5;
        title.style.transform = 'translate(' + (rx * 5) + 'px,' + (ry * 3) + 'px)';
      });
      step.addEventListener('mouseleave', function () {
        title.style.transform = '';
        rect = null;
      });
    });
  }


  /* ── 4. STEP TIMER ANIMATION ────────────────────────────────── */

  document.querySelectorAll('.step').forEach(function (step) {
    var meta = step.querySelector('.step-meta');
    if (!meta) return;
    var text = meta.textContent;
    var m = text.match(/(\d+)\s*(min|sec|s\b)/i);
    if (!m) return;
    var origNum   = parseInt(m[1]);
    var unit      = m[2];
    var targetNum = Math.round(origNum * 0.34);

    function animateNum(from, to, duration, done) {
      var start = null;
      function tick(now) {
        if (!start) start = now;
        var t = Math.min((now - start) / duration, 1);
        var eased = 1 - Math.pow(1 - t, 2);
        var val = Math.round(from + (to - from) * eased);
        meta.textContent = text.replace(m[0], val + ' ' + unit);
        if (t < 1) requestAnimationFrame(tick);
        else if (done) done();
      }
      requestAnimationFrame(tick);
    }

    if (!reduced.matches) {
      step.addEventListener('mouseenter', function () {
        animateNum(origNum, targetNum, 900, null);
      });
      step.addEventListener('mouseleave', function () {
        animateNum(targetNum, origNum, 500, function () {
          meta.textContent = text;
        });
      });
    }
  });


  /* ── 5. TASTING NOTES — sequential attention ──────────────── */

  if (fine.matches && !reduced.matches) {
    var notes = document.querySelectorAll('.tasting-note');
    notes.forEach(function (note) {
      note.addEventListener('mouseenter', function () {
        var idx = Array.from(notes).indexOf(note);
        notes.forEach(function (n, i) {
          if (i < idx) {
            n.style.opacity = '0.38';
            n.style.transition = 'opacity 0.35s ease';
          }
        });
      });
      note.addEventListener('mouseleave', function () {
        notes.forEach(function (n) {
          n.style.opacity = '';
          n.style.transition = 'opacity 0.4s ease';
        });
      });
    });
  }


  /* ── 6. SOURCE STAT COUNT-UP ────────────────────────────────── */

  function parseStatNum(str) {
    var clean = str.replace(/[€,\s]/g, '');
    var m = clean.match(/^~?([0-9]+)/);
    return m ? parseInt(m[1]) : null;
  }

  function countUp(el, from, to, duration, prefix, suffix) {
    var start = null;
    function tick(now) {
      if (!start) start = now;
      var t = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      var val = Math.round(from + (to - from) * eased);
      el.textContent = prefix + val.toLocaleString() + suffix;
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  if (!reduced.matches) {
    var ssVals = document.querySelectorAll('.ss-val');
    var ssObs  = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el   = entry.target;
        var orig = el.textContent.trim();
        var num  = parseStatNum(orig);
        if (num === null) { ssObs.unobserve(el); return; }
        var prefix = orig.match(/^[€\s]*/)[0].replace(/[0-9]/g, '');
        var m      = orig.match(/^~?([€,\s0-9]+)(.*)/);
        var suffix = m ? m[2] : '';
        countUp(el, 0, num, 900, prefix, suffix);
        ssObs.unobserve(el);
      });
    }, { threshold: 0.5 });
    ssVals.forEach(function (el) { ssObs.observe(el); });
  }


  /* ── 7. PRODUCT NAME & SOURCE HEADLINE REVEAL ─────────────── */

  var revealEls = document.querySelectorAll(
    '.product-name, .source-headline, .sc-title, .sc-text, .reveal'
  );
  var revObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach(function (el) { revObs.observe(el); });


  /* ── 8. QTY CARD SPRING CLICK ───────────────────────────────── */

  document.querySelectorAll('.qty-card').forEach(function (card) {
    card.addEventListener('click', function () {
      card.classList.remove('spring');
      void card.offsetWidth; // reflow
      card.classList.add('spring');
      card.addEventListener('animationend', function () {
        card.classList.remove('spring');
      }, { once: true });
    });
  });


  /* ── 9. HERO CURSOR WARM GLOW TRACKING ─────────────────────── */

  if (fine.matches && !reduced.matches) {
    var hero = document.querySelector('.hero');
    if (hero) {
      hero.addEventListener('mousemove', function (e) {
        var r  = hero.getBoundingClientRect();
        var xp = ((e.clientX - r.left) / r.width)  * 100;
        var yp = ((e.clientY - r.top)  / r.height) * 100;
        hero.style.setProperty('--gx', xp.toFixed(1) + '%');
        hero.style.setProperty('--gy', yp.toFixed(1) + '%');
      });
    }
  }


  /* ── 10. BREW READY TOAST — grain intensify ─────────────────── */

  var toast = document.getElementById('brew-3min');
  var grain = document.getElementById('grain');
  if (toast && grain && !reduced.matches) {
    var toastObs = new MutationObserver(function () {
      var s = toast.style.transform || '';
      if (s.indexOf('translateY(0') !== -1) {
        grain.style.transition = 'opacity 1.5s ease';
        grain.style.opacity    = '0.085';
        setTimeout(function () {
          grain.style.opacity = '';
          setTimeout(function () {
            grain.style.transition = '';
          }, 2000);
        }, 6000);
      }
    });
    toastObs.observe(toast, { attributes: true, attributeFilter: ['style'] });
  }


  /* ── 11. HERO SCROLL PARALLAX — cards at different rates ───── */

  if (fine.matches && !reduced.matches) {
    var heroBottom = document.querySelector('.hero-bottom');
    if (heroBottom) {
      var heroEl = document.querySelector('.hero');
      window.addEventListener('scroll', function () {
        if (!heroEl) return;
        var r = heroEl.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        var progress = Math.max(0, -r.top / r.height);
        var shift    = progress * 22;
        heroBottom.style.transform = 'translateY(' + shift + 'px)';
      }, { passive: true });
    }
  }


  /* ── 12. COORDINATE CURSOR COLOUR SHIFT ────────────────────── */

  if (fine.matches && !reduced.matches) {
    var coordLabel = document.querySelector('.hero-coord-label');
    if (coordLabel) {
      var heroForCoord = document.querySelector('.hero');
      if (heroForCoord) {
        heroForCoord.addEventListener('mousemove', function (e) {
          var r    = heroForCoord.getBoundingClientRect();
          var dist = Math.abs(e.clientY - (r.top + r.height * 0.85));
          var pct  = Math.max(0, 1 - dist / 120);
          coordLabel.style.opacity = (0.55 + pct * 0.45).toFixed(2);
        });
      }
    }
  }

})();
