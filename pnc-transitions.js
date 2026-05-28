/* ─────────────────────────────────────────────────────────────────────────
   PNC · pnc-transitions.js
   Page transition curtain — cream panel sweeps up on enter, down on exit.
   Works across all PNC pages. No dependencies.
───────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* ── Inject curtain ──────────────────────────────────────────── */
  var curtain = document.createElement('div');
  curtain.id = 'pnc-curtain';
  curtain.setAttribute('aria-hidden', 'true');
  curtain.style.cssText = [
    'position:fixed',
    'inset:0',
    'background:var(--ink,#2A1810)',
    'z-index:99998',
    'pointer-events:none',
    'transform:translateY(100%)',
    'will-change:transform',
    'transition:transform 0.65s cubic-bezier(0.76,0,0.24,1)'
  ].join(';');

  /* Logo inside curtain */
  var logo = document.createElement('div');
  logo.style.cssText = [
    'position:absolute',
    'top:50%',
    'left:50%',
    'transform:translate(-50%,-50%)',
    'font-family:"Helvetica Neue",Helvetica,Arial,sans-serif',
    'font-weight:900',
    'font-size:clamp(28px,5vw,56px)',
    'letter-spacing:-0.03em',
    'color:rgba(248,244,236,0.12)',
    'text-transform:uppercase',
    'user-select:none',
    'pointer-events:none'
  ].join(';');
  logo.textContent = 'PNC';
  curtain.appendChild(logo);
  document.body.appendChild(curtain);

  /* ── Reveal page (curtain exits upward) ─────────────────────── */
  function revealPage() {
    requestAnimationFrame(function () {
      curtain.style.transition = 'transform 0.7s cubic-bezier(0.76,0,0.24,1)';
      curtain.style.transform = 'translateY(-100%)';
    });
  }

  /* Page enter — from bottom */
  curtain.style.transform = 'translateY(0%)';
  curtain.style.transition = 'none';

  /* Small delay so paint settles */
  setTimeout(revealPage, 60);

  /* ── Intercept internal links ────────────────────────────────── */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a) return;

    var href = a.getAttribute('href');
    if (!href) return;

    /* Skip: external, hash, new-tab, mailto, tel */
    if (
      href.startsWith('http') ||
      href.startsWith('//') ||
      href.startsWith('#') ||
      href.startsWith('mailto') ||
      href.startsWith('tel') ||
      a.target === '_blank' ||
      e.ctrlKey || e.metaKey || e.shiftKey
    ) return;

    e.preventDefault();
    var dest = href;

    /* Curtain drops from top */
    curtain.style.transition = 'transform 0.55s cubic-bezier(0.76,0,0.24,1)';
    curtain.style.transform = 'translateY(0%)';

    setTimeout(function () {
      window.location.href = dest;
    }, 560);
  });

})();
