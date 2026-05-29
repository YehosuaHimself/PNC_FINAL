/* ─────────────────────────────────────────────────────────────────────────
   PNC · pnc-preloader.js
   First-load ritual: "Fiat panis." draws, then lifts to reveal the page.
   
   Behavior:
   - Only fires on cold first load (sessionStorage flag prevents re-fire
     on internal navigation — transitions.js handles those)
   - The overlay is injected synchronously in <head> so there is zero
     flash of unstyled content
   - GSAP-free: pure CSS transitions — works before GSAP loads
   - Reduced-motion: skips animation, fades in 200ms
   - Locks body scroll during preload
─────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  /* Already showed this session (internal nav) — skip */
  if (sessionStorage.getItem('pnc_visited')) return;

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Build overlay ─────────────────────────────────────────────── */
  var overlay = document.createElement('div');
  overlay.id = 'pnc-preloader';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.setAttribute('aria-label', 'Loading PNC');
  overlay.setAttribute('role', 'status');

  overlay.innerHTML = [
    '<div class="pl-inner">',
      '<div class="pl-monogram">PNC</div>',
      '<div class="pl-tagline">',
        '<span class="pl-word">Fiat</span>',
        '<span class="pl-word">panis.</span>',
      '</div>',
      '<div class="pl-progress">',
        '<div class="pl-bar"></div>',
      '</div>',
      '<div class="pl-sub">Panem Nostrum Cotidianum</div>',
    '</div>'
  ].join('');

  /* Inject critical inline CSS before anything paints */
  var style = document.createElement('style');
  style.textContent = [
    '#pnc-preloader {',
      'position:fixed;inset:0;z-index:999999;',
      'background:#2A1810;',
      'display:flex;align-items:center;justify-content:center;',
      'transition:opacity 0.7s cubic-bezier(0.16,1,0.3,1),',
                  'transform 0.9s cubic-bezier(0.76,0,0.24,1);',
      'will-change:transform,opacity;',
    '}',
    '#pnc-preloader.pl-exit {',
      'transform:translateY(-100%);',
      'opacity:0;',
    '}',
    '.pl-inner {',
      'display:flex;flex-direction:column;align-items:center;gap:1.6rem;',
      'text-align:center;',
    '}',
    '.pl-monogram {',
      'font-family:"Helvetica Neue",Arial,sans-serif;',
      'font-weight:900;font-size:clamp(28px,5vw,52px);',
      'letter-spacing:0.18em;color:#F8F4EC;',
      'opacity:0;transform:translateY(12px);',
      'transition:opacity 0.6s ease,transform 0.6s cubic-bezier(0.16,1,0.3,1);',
    '}',
    '.pl-monogram.pl-vis { opacity:1;transform:translateY(0); }',
    '.pl-tagline {',
      'font-family:"Fraunces",Georgia,serif;',
      'font-style:italic;',
      'font-size:clamp(13px,2vw,20px);',
      'letter-spacing:0.06em;',
      'color:rgba(248,244,236,0.55);',
      'display:flex;gap:0.4em;',
      'overflow:hidden;',
    '}',
    '.pl-word {',
      'display:inline-block;',
      'opacity:0;transform:translateY(110%);',
      'transition:opacity 0.5s ease,transform 0.6s cubic-bezier(0.16,1,0.3,1);',
    '}',
    '.pl-word.pl-vis { opacity:1;transform:translateY(0); }',
    '.pl-progress {',
      'width:clamp(80px,12vw,140px);height:1px;',
      'background:rgba(248,244,236,0.12);',
      'position:relative;overflow:hidden;',
    '}',
    '.pl-bar {',
      'position:absolute;inset:0 100% 0 0;',
      'background:linear-gradient(90deg,rgba(209,155,64,0.4),rgba(209,155,64,0.9));',
      'transition:inset-right 1.1s cubic-bezier(0.16,1,0.3,1);',
    '}',
    '.pl-bar.pl-vis { inset-right:0; }',
    '.pl-sub {',
      'font-family:"Helvetica Neue",Arial,sans-serif;',
      'font-size:9px;letter-spacing:0.28em;text-transform:uppercase;',
      'color:rgba(248,244,236,0.22);',
      'opacity:0;',
      'transition:opacity 0.5s ease 0.3s;',
    '}',
    '.pl-sub.pl-vis { opacity:1; }',
    /* Reduced motion override */
    '@media (prefers-reduced-motion:reduce) {',
      '#pnc-preloader { transition:opacity 0.2s ease !important; transform:none !important; }',
      '#pnc-preloader.pl-exit { transform:none !important; opacity:0 !important; }',
      '.pl-monogram,.pl-word,.pl-sub { opacity:1 !important; transform:none !important; transition:none !important; }',
      '.pl-bar { inset-right:0 !important; transition:none !important; }',
    '}'
  ].join('\n');

  document.head.appendChild(style);

  /* Lock scroll while preloading */
  document.documentElement.style.overflow = 'hidden';

  document.body.appendChild(overlay);

  /* ── Sequence ──────────────────────────────────────────────────── */
  function dismiss() {
    overlay.classList.add('pl-exit');
    /* Unlock scroll */
    document.documentElement.style.overflow = '';
    /* Remove from DOM after exit */
    setTimeout(function () {
      overlay.parentNode && overlay.parentNode.removeChild(overlay);
      style.parentNode && style.parentNode.removeChild(style);
    }, 1000);
    sessionStorage.setItem('pnc_visited', '1');
  }

  if (REDUCED) {
    setTimeout(dismiss, 300);
    return;
  }

  /* Staggered entrance */
  setTimeout(function () {
    overlay.querySelector('.pl-monogram').classList.add('pl-vis');
  }, 100);

  setTimeout(function () {
    overlay.querySelector('.pl-word:first-child').classList.add('pl-vis');
  }, 340);

  setTimeout(function () {
    overlay.querySelector('.pl-word:last-child').classList.add('pl-vis');
  }, 480);

  setTimeout(function () {
    overlay.querySelector('.pl-bar').classList.add('pl-vis');
    overlay.querySelector('.pl-sub').classList.add('pl-vis');
  }, 560);

  /* Dismiss after bar completes (1.1s) + small breath (0.4s) = 1.5s after bar starts */
  var DISMISS_AT = 560 + 1100 + 400; /* ~2060ms total */

  setTimeout(function () {
    dismiss();
  }, DISMISS_AT);

})();
