/* ─────────────────────────────────────────────────────────────────────
   PNC · cursor-magnetic.js
   Magnetic pull + text-label morph on interactive elements.
   HARDENED: does NOT manage color (script.js owns that).
   Does NOT fight the ring position rAF — uses a separate
   overlay transform on top of script.js's translate.
────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  if (window.matchMedia('(pointer:coarse)').matches) return;

  var dot  = document.getElementById('cur-dot');
  var ring = document.getElementById('cur-ring');
  if (!dot || !ring) return;

  /* ── Label span ───────────────────────────────────────────────── */
  var label = document.createElement('span');
  label.id = 'cur-label';
  label.setAttribute('aria-hidden', 'true');
  label.style.cssText = [
    'position:absolute',
    'top:50%', 'left:50%',
    'transform:translate(-50%,-50%)',
    'font-family:"Courier New",monospace',
    'font-size:9px', 'font-weight:600',
    'letter-spacing:0.22em', 'text-transform:uppercase',
    'white-space:nowrap',
    'opacity:0',
    'transition:opacity 0.18s ease',
    'pointer-events:none',
    'color:inherit'
  ].join(';');
  ring.style.position       = 'fixed';
  ring.style.display        = 'flex';
  ring.style.alignItems     = 'center';
  ring.style.justifyContent = 'center';
  ring.appendChild(label);

  /* ── Config ──────────────────────────────────────────────────── */
  var MAG_PULL   = 0.36;
  var MAG_RADIUS = 90;

  var mx = -9999, my = -9999;
  var magActive = false;
  var magEl     = null;
  var magCX = 0, magCY = 0;
  var curLabelText = '';

  function getLabel(el) {
    var node = el;
    while (node && node !== document.body) {
      if (node.dataset && node.dataset.cursorLabel) return node.dataset.cursorLabel;
      if (node.classList && (node.classList.contains('hero-product--bread') || node.classList.contains('hero-panel--bread'))) return 'BREAD';
      if (node.classList && (node.classList.contains('hero-product--brew')  || node.classList.contains('hero-panel--brew')))  return 'BREW';
      if (node.classList && node.classList.contains('nav-link')) return (node.textContent || '').trim().toUpperCase();
      if (node.tagName === 'A' && node.href) return 'OPEN';
      if (node.tagName === 'BUTTON') return (node.textContent || '').trim().toUpperCase().slice(0, 8) || '●';
      node = node.parentElement;
    }
    return '';
  }

  function setLabel(text) {
    if (text === curLabelText) return;
    curLabelText = text;
    label.textContent  = text;
    label.style.opacity = text ? '1' : '0';
    dot.style.opacity   = text ? '0' : '1';
  }

  function enterMag(el) {
    if (magEl === el) return;
    magEl = el;
    magActive = true;
    var rect = el.getBoundingClientRect();
    magCX = rect.left + rect.width  / 2;
    magCY = rect.top  + rect.height / 2;
    var isCard = el.classList.contains('hero-product') || el.classList.contains('hero-panel');
    ring.style.width   = isCard ? '120px' : '72px';
    ring.style.height  = isCard ? '120px' : '72px';
    ring.style.opacity = '0.55';
    setLabel(getLabel(el));
  }

  function leaveMag() {
    if (!magActive) return;
    magActive = false;
    magEl = null;
    ring.style.width   = '80px';
    ring.style.height  = '80px';
    ring.style.opacity = '0.60';
    setLabel('');
  }

  /* ── Target cache ─────────────────────────────────────────────── */
  var magTargets = [];
  var magTargetRects = [];

  function buildCache() {
    var els = document.querySelectorAll('.hero-product,.hero-panel,a,button,[role=button]');
    magTargets = Array.prototype.slice.call(els);
    magTargetRects = new Array(magTargets.length);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildCache);
  } else {
    buildCache();
  }

  window.addEventListener('scroll', function() {
    /* Invalidate rects on scroll */
    magTargetRects = new Array(magTargets.length);
  }, { passive: true });
  window.addEventListener('resize', buildCache, { passive: true });

  /* ── mousemove — detect magnetic targets ─────────────────────── */
  document.addEventListener('mousemove', function(e) {
    mx = e.clientX;
    my = e.clientY;

    var hit = null;
    for (var i = 0; i < magTargets.length; i++) {
      if (!magTargetRects[i]) {
        magTargetRects[i] = magTargets[i].getBoundingClientRect();
      }
      var r   = magTargetRects[i];
      var cx  = r.left + r.width  / 2;
      var cy  = r.top  + r.height / 2;
      var d   = Math.sqrt((mx - cx) * (mx - cx) + (my - cy) * (my - cy));
      var rad = (magTargets[i].classList.contains('hero-product') || magTargets[i].classList.contains('hero-panel'))
                ? MAG_RADIUS * 1.8 : MAG_RADIUS;
      if (d < rad) { hit = magTargets[i]; break; }
    }

    if (hit) {
      enterMag(hit);
      var hr = hit.getBoundingClientRect();
      magCX = hr.left + hr.width  / 2;
      magCY = hr.top  + hr.height / 2;
    } else {
      leaveMag();
    }
  }, { passive: true, capture: true });

  /* ── Magnetic rAF — only adjusts position when in mag zone ───── */
  var magRafId = null;

  function magLoop() {
    if (magActive && magEl) {
      var ringW  = parseFloat(ring.style.width)  || 80;
      var ringH  = parseFloat(ring.style.height) || 80;
      var tx     = magCX - ringW / 2;
      var ty     = magCY - ringH / 2;
      var cTx    = mx - ringW / 2;
      var cTy    = my - ringH / 2;
      var finalX = Math.round(cTx + (tx - cTx) * MAG_PULL);
      var finalY = Math.round(cTy + (ty - cTy) * MAG_PULL);
      ring.style.transform = 'translate3d(' + finalX + 'px,' + finalY + 'px,0)';
    }
    /* When not magnetic, script.js loop owns the ring transform — we stay out */
    magRafId = requestAnimationFrame(magLoop);
  }

  magRafId = requestAnimationFrame(magLoop);

  document.addEventListener('visibilitychange', function() {
    if (document.hidden && magRafId) {
      cancelAnimationFrame(magRafId);
      magRafId = null;
    } else if (!document.hidden && !magRafId) {
      magRafId = requestAnimationFrame(magLoop);
    }
  });

})();
