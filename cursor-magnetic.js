/* ─────────────────────────────────────────────────────────────────────
   PNC · cursor-magnetic.js
   Magnetic pull + text-label morph on interactive elements.
   The cursor ring snaps toward links/buttons with spring physics,
   and morphs to display a text label (BREAD / BREW / OPEN / →).
────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  if (window.matchMedia('(pointer:coarse)').matches) return;

  var dot  = document.getElementById('cur-dot');
  var ring = document.getElementById('cur-ring');
  if (!dot || !ring) return;

  /* ── Inject label span into ring ─────────────────────────────── */
  var label = document.createElement('span');
  label.id = 'cur-label';
  label.setAttribute('aria-hidden', 'true');
  label.style.cssText = [
    'position:absolute',
    'top:50%','left:50%',
    'transform:translate(-50%,-50%)',
    'font-family:"Courier New",monospace',
    'font-size:9px','font-weight:600',
    'letter-spacing:0.22em','text-transform:uppercase',
    'white-space:nowrap',
    'opacity:0',
    'transition:opacity 0.18s cubic-bezier(.16,1,.3,1)',
    'pointer-events:none',
    'color:inherit'
  ].join(';');
  ring.style.position = 'fixed';
  ring.style.display = 'flex';
  ring.style.alignItems = 'center';
  ring.style.justifyContent = 'center';
  ring.appendChild(label);

  /* ── Magnetic targets ────────────────────────────────────────── */
  var MAG_PULL   = 0.36;  /* 0=no pull, 1=full snap */
  var MAG_RADIUS = 90;    /* px radius for magnetic effect */

  function getLabel(el) {
    /* Walk up to find a meaningful label */
    var node = el;
    while (node && node !== document.body) {
      /* Explicit data-cursor-label */
      if (node.dataset && node.dataset.cursorLabel) return node.dataset.cursorLabel;
      /* Product card */
      if (node.classList && (node.classList.contains('hero-product--bread') || node.classList.contains('hero-panel--bread'))) return 'BREAD';
      if (node.classList && (node.classList.contains('hero-product--brew')  || node.classList.contains('hero-panel--brew')))  return 'BREW';
      /* Nav links */
      if (node.classList && node.classList.contains('nav-link')) {
        return (node.textContent || '').trim().toUpperCase();
      }
      /* Generic links */
      if (node.tagName === 'A' && node.href) return 'OPEN';
      /* Buttons */
      if (node.tagName === 'BUTTON') return (node.textContent || '').trim().toUpperCase().slice(0,8) || '●';
      node = node.parentElement;
    }
    return '';
  }

  var mx = -9999, my = -9999;
  var magActive = false;
  var magEl     = null;
  var magCX = 0, magCY = 0; /* magnetic target centre */
  var curLabelText = '';

  function setLabel(text) {
    if (text === curLabelText) return;
    curLabelText = text;
    if (text) {
      label.textContent = text;
      label.style.opacity = '1';
      /* Shrink dot when label shows */
      dot.style.opacity = '0';
    } else {
      label.style.opacity = '0';
      dot.style.opacity = '1';
    }
  }

  function enterMag(el) {
    if (magEl === el) return;
    magEl = el;
    magActive = true;
    var rect = el.getBoundingClientRect();
    magCX = rect.left + rect.width  / 2;
    magCY = rect.top  + rect.height / 2;

    /* Expand ring */
    var isCard = el.classList.contains('hero-product') || el.classList.contains('hero-panel');
    ring.style.width  = isCard ? '120px' : '72px';
    ring.style.height = isCard ? '120px' : '72px';
    ring.style.opacity = '0.55';

    setLabel(getLabel(el));
  }

  function leaveMag() {
    if (!magActive) return;
    magActive = false;
    magEl = null;
    ring.style.width  = '80px';
    ring.style.height = '80px';
    ring.style.opacity = '0.60';
    setLabel('');
  }

  /* Cache magnetic targets once on load + on any DOM mutation */
  var magTargets = [];
  var magTargetRects = [];

  function buildMagCache() {
    var selectors = '.hero-product,.hero-panel,a,button,[role=button]';
    var els = document.querySelectorAll(selectors);
    magTargets = Array.prototype.slice.call(els);
    magTargetRects = new Array(magTargets.length);
  }

  /* Build on load */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildMagCache);
  } else {
    buildMagCache();
  }

  /* Rebuild on scroll (rects change) — throttled */
  var rectRafPending = false;
  window.addEventListener('scroll', function() {
    if (!rectRafPending) {
      rectRafPending = true;
      requestAnimationFrame(function() {
        magTargetRects = new Array(magTargets.length);
        rectRafPending = false;
      });
    }
  }, { passive: true });

  /* Rebuild on resize */
  window.addEventListener('resize', buildMagCache, { passive: true });

  /* Override the existing mousemove to add magnetic pull */
  document.addEventListener('mousemove', function (e) {
    mx = e.clientX;
    my = e.clientY;

    /* Test magnetic attraction against cached targets */
    var hit = null;
    for (var i = 0; i < magTargets.length; i++) {
      /* Lazily compute and cache rects */
      if (!magTargetRects[i]) {
        magTargetRects[i] = magTargets[i].getBoundingClientRect();
      }
      var rect = magTargetRects[i];
      var cx = rect.left + rect.width  / 2;
      var cy = rect.top  + rect.height / 2;
      var dist = Math.sqrt((mx - cx) * (mx - cx) + (my - cy) * (my - cy));
      var r = (magTargets[i].classList.contains('hero-product') || magTargets[i].classList.contains('hero-panel')) ? MAG_RADIUS * 1.8 : MAG_RADIUS;
      if (dist < r) { hit = magTargets[i]; break; }
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

  /* Hook into the existing ring rAF by patching the ring's position */
  var origRingTransform = null;
  var magRafId = null;

  function magLoop() {
    if (magActive && magEl) {
      /* Pull ring centre toward the element's centre */
      var tx = magCX - parseFloat(ring.style.width)  / 2;
      var ty = magCY - parseFloat(ring.style.height) / 2;

      /* Blend: partial pull (MAG_PULL fraction toward target, rest follows cursor) */
      var ringW = parseFloat(ring.style.width)  || 80;
      var ringH = parseFloat(ring.style.height) || 80;
      var cursorTx = mx - ringW / 2;
      var cursorTy = my - ringH / 2;

      var finalTx = cursorTx + (tx - cursorTx) * MAG_PULL;
      var finalTy = cursorTy + (ty - cursorTy) * MAG_PULL;

      ring.style.transform = 'translate3d(' + Math.round(finalTx) + 'px,' + Math.round(finalTy) + 'px,0)';
    }
    magRafId = requestAnimationFrame(magLoop);
  }

  magRafId = requestAnimationFrame(magLoop);

  /* Clean up on page hide */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && magRafId) {
      cancelAnimationFrame(magRafId);
      magRafId = null;
    } else if (!document.hidden && !magRafId) {
      magRafId = requestAnimationFrame(magLoop);
    }
  });

})();
