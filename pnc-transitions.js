/* ─────────────────────────────────────────────────────────────────────
   PNC · pnc-transitions.js v2
   Full-screen ink wipe on internal navigation.
   A dark panel covers the screen, then lifts revealing the next page.
   Works with Lenis. Zero dependencies beyond GSAP (optional fallback).
────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* ── Build the transition overlay ───────────────────────────── */
  var overlay = document.createElement('div');
  overlay.id = 'pnc-transition';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.style.cssText = [
    'position:fixed',
    'inset:0',
    'background:var(--ink,#2A1810)',
    'z-index:99998',
    'pointer-events:none',
    'transform:translateY(100%)', /* starts below screen */
    'will-change:transform'
  ].join(';');
  document.body.appendChild(overlay);

  /* Build PNC monogram in the overlay */
  var mono = document.createElement('div');
  mono.style.cssText = [
    'position:absolute',
    'top:50%','left:50%',
    'transform:translate(-50%,-50%)',
    'font-family:"Fraunces",Georgia,serif',
    'font-weight:900',
    'font-variation-settings:"opsz" 144,"WONK" 1',
    'font-style:italic!important',
    'font-size:clamp(40px,7vw,96px)',
    'letter-spacing:0.12em',
    'text-transform:uppercase',
    'color:rgba(248,244,236,0.06)',
    'user-select:none',
    'opacity:0',
    'transition:opacity 0.2s'
  ].join(';');
  mono.textContent = 'PNC';
  overlay.appendChild(mono);

  var EASE_IN  = 'cubic-bezier(0.76, 0, 0.24, 1)';
  var EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
  var DUR_IN   = 520; /* ms */
  var DUR_OUT  = 560;

  function animTo(el, props, duration, easing, delay) {
    return new Promise(function (resolve) {
      setTimeout(function () {
        el.style.transition = 'transform ' + duration + 'ms ' + easing;
        Object.keys(props).forEach(function (k) { el.style[k] = props[k]; });
        setTimeout(resolve, duration);
      }, delay || 0);
    });
  }

  /* ── Wipe in (covers screen) ─────────────────────────────────── */
  function wipeIn() {
    overlay.style.transition = 'none';
    overlay.style.transform  = 'translateY(100%)';
    mono.style.opacity = '0';
    /* Force reflow */
    overlay.offsetHeight;
    overlay.style.transition = 'transform ' + DUR_IN + 'ms ' + EASE_IN;
    overlay.style.transform  = 'translateY(0)';
    setTimeout(function () { mono.style.opacity = '1'; }, DUR_IN * 0.6);
    return new Promise(function (r) { setTimeout(r, DUR_IN); });
  }

  /* ── Wipe out (reveals new page) ────────────────────────────── */
  function wipeOut() {
    mono.style.opacity = '0';
    overlay.style.transition = 'transform ' + DUR_OUT + 'ms ' + EASE_OUT;
    overlay.style.transform  = 'translateY(-100%)';
    return new Promise(function (r) { setTimeout(r, DUR_OUT); });
  }

  /* ── Intercept internal links ────────────────────────────────── */
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href]');
    if (!link) return;

    var href = link.getAttribute('href');
    /* Skip: external, hash-only, mailto, tel, download, noTransition */
    if (!href) return;
    if (href.startsWith('http') || href.startsWith('//')) return;
    if (href.startsWith('#')) return;
    if (href.startsWith('mailto:') || href.startsWith('tel:')) return;
    if (link.hasAttribute('download')) return;
    if (link.hasAttribute('data-no-transition')) return;
    if (link.target === '_blank') return;

    e.preventDefault();

    wipeIn().then(function () {
      window.location.href = href;
    });
  });

  /* ── Reveal on page load (wipe out from top) ────────────────── */
  (function revealOnLoad() {
    /* If we arrived via internal nav, overlay starts at 0 (covering screen) */
    /* Otherwise start from below — nothing to reveal */
    var came = sessionStorage.getItem('pnc_transitioning');
    if (came) {
      sessionStorage.removeItem('pnc_transitioning');
      overlay.style.transition = 'none';
      overlay.style.transform  = 'translateY(0)';
      overlay.offsetHeight; /* reflow */
      setTimeout(function () {
        wipeOut();
      }, 60);
    }
  })();

  /* Flag before navigation so next page knows */
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href]');
    if (link && !link.href.startsWith('http') && !link.href.startsWith('//')) {
      sessionStorage.setItem('pnc_transitioning', '1');
    }
  });

})();
