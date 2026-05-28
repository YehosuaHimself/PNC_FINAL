(function(){
  var dot  = document.getElementById('cur-dot');
  var ring = document.getElementById('cur-ring');
  if (!dot || window.matchMedia('(pointer:coarse)').matches) return;

  var C_DARK  = '#4A3018';
  var C_LIGHT = '#F8F4EC';
  var DOT_R   = 32;
  var RING_RX = 32, RING_RY = 35;
  var LERP    = 0.18;
  var BEAN_W  = '64px', BEAN_H = '70px';
  var BEAN_BR = 'none'; // unused for SVG
  var BEAN_CP = ''; // SVG shape, no clip-path needed
  var BEAN_ROT = '175deg';

  var mx = -9999, my = -9999;
  var rx = -9999, ry = -9999;
  var rafId = null, settled = 0;
  var currentDark = false;
  var inTextField = false;

  dot.style.willChange  = 'transform, color';
  if (ring) ring.style.willChange = 'transform, color';
  // SVG dot — no clipPath needed

  /* ── Color detection via elementFromPoint — zero stale cache ── */
  function isDarkUnder(x, y) {
    dot.style.display  = 'none';
    if (ring) ring.style.display = 'none';
    var el = document.elementFromPoint(x, y);
    dot.style.display  = '';
    if (ring) ring.style.display = '';
    if (!el) return false;
    var node = el;
    while (node && node !== document.documentElement) {
      if (node.hasAttribute && node.hasAttribute('data-dark')) return true;
      node = node.parentElement;
    }
    return false;
  }

  function applyColor(dark) {
    var c = dark ? C_LIGHT : C_DARK;
    dot.style.transition  = 'color 0ms';
    if (ring) ring.style.transition = 'color 0ms, opacity 200ms ease, width 180ms ease, height 180ms ease';
    dot.style.color   = c;
    if (ring) ring.style.color = c;
  }

  function loop() {
    var dx = (mx - RING_RX) - rx;
    var dy = (my - RING_RY) - ry;
    rx += dx * LERP;
    ry += dy * LERP;
    dot.style.transform  = 'translate3d(' + (mx - DOT_R) + 'px,' + (my - DOT_R) + 'px,0) rotate(' + BEAN_ROT + ')';
    if (ring) ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0) rotate(' + BEAN_ROT + ')';

    if (Math.abs(dx) < 0.3 && Math.abs(dy) < 0.3) {
      if (++settled > 4) { rafId = null; return; }
    } else { settled = 0; }
    rafId = requestAnimationFrame(loop);
  }
  function startLoop() { settled = 0; if (rafId === null) rafId = requestAnimationFrame(loop); }

  document.addEventListener('mousemove', function(e) {
    mx = e.clientX; my = e.clientY;
    var dark = isDarkUnder(mx, my);
    if (dark !== currentDark) { currentDark = dark; applyColor(dark); }
    if (inTextField) {
      dot.style.transform = 'translate3d(' + (mx - 1) + 'px,' + (my - 10) + 'px,0)';
      return;
    }
    startLoop();
  }, {passive:true});

  document.addEventListener('mouseleave', function() {
    mx = -9999; my = -9999;
    dot.style.transform  = 'translate3d(-9999px,-9999px,0)';
    if (ring) ring.style.transform = 'translate3d(-9999px,-9999px,0)';
  });

  document.addEventListener('mousedown', function() {
    if (inTextField) return;
    dot.style.transform  = 'translate3d(' + (mx - DOT_R) + 'px,' + (my - DOT_R) + 'px,0) rotate(' + BEAN_ROT + ') scale(0.8)';
    if (ring) ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0) rotate(' + BEAN_ROT + ') scale(0.85)';
  }, {passive:true});

  document.addEventListener('mouseup', function() {
    if (inTextField) return;
    dot.style.transform  = 'translate3d(' + (mx - DOT_R) + 'px,' + (my - DOT_R) + 'px,0) rotate(' + BEAN_ROT + ')';
    if (ring) ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0) rotate(' + BEAN_ROT + ')';
  }, {passive:true});

  document.querySelectorAll('a,button,[role=button],select').forEach(function(el) {
    el.addEventListener('mouseenter', function() {
      if (ring) { ring.style.width = '96px'; ring.style.height = '106px'; ring.style.opacity = '0.65'; }
      startLoop();
    });
    el.addEventListener('mouseleave', function() {
      if (ring) { ring.style.width = '80px'; ring.style.height = '88px'; ring.style.opacity = '0.45'; }
      startLoop();
    });
  });

  function enterTextField() {
    if (inTextField) return;
    inTextField = true;
    if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
    dot.style.transition   = 'width 70ms ease, height 70ms ease, border-radius 70ms ease';
    // SVG dot
    dot.style.width        = '3px';
    dot.style.height       = '20px';
    dot.style.borderRadius = '1px';
    dot.style.color   = currentDark ? C_LIGHT : C_DARK;
    dot.style.animation    = 'textCursorBlink 1.1s step-end infinite';

  }

  function leaveTextField() {
    if (!inTextField) return;
    inTextField = false;
    dot.style.animation    = 'none';
    dot.style.transition   = 'width 120ms ease, height 120ms ease, border-radius 180ms ease';
    dot.style.width        = BEAN_W;
    dot.style.height       = BEAN_H;
    dot.style.borderRadius = BEAN_BR;
    // SVG dot
    dot.style.color   = currentDark ? C_LIGHT : C_DARK;

    // SVG ring




    startLoop();
  }

  document.querySelectorAll('input[type="text"],input[type="email"],input:not([type]),textarea').forEach(function(el) {
    el.addEventListener('focus', enterTextField);
    el.addEventListener('blur',  leaveTextField);
  });

  document.addEventListener('focusin', function(e) {
    var tag = e.target ? e.target.tagName : '';
    if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
      if (inTextField) leaveTextField();
    }
  });

})();

/* ========== */

document.addEventListener('DOMContentLoaded',function(){
  if(typeof Lenis==='undefined')return;
  if(window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;

  var lenis = new Lenis({
    duration: 1.1,
    easing: function(t){ return t===1?1:1-Math.pow(2,-10*t); },
    smoothWheel: true,
    wheelMultiplier: 0.9,
    touchMultiplier: 1.8,
  });
  window.PNC_LENIS = lenis;

  var prog   = document.getElementById('prog');
  var progR  = document.getElementById('prog-r');
  var rafId2 = null;

  function lenisRaf(time){ lenis.raf(time); rafId2 = requestAnimationFrame(lenisRaf); }
  rafId2 = requestAnimationFrame(lenisRaf);

  if(prog){
    window.addEventListener('scroll', function(){
      var max = document.body.scrollHeight - window.innerHeight;
      var h = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
      prog.style.height = h;
      if(progR) progR.style.height = h;
    }, {passive:true});
  }

  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click', function(e){
      var t = document.querySelector(this.getAttribute('href'));
      if(t){ e.preventDefault(); lenis.scrollTo(t, {offset:-62, duration:1.4}); }
    });
  });
});

/* ========== */

(function(){
  var SUPA_URL  = 'https://ktigsrojpkvioamldvrp.supabase.co';
  var SUPA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0aWdzcm9qcGt2aW9hbWxkdnJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4OTUwMDksImV4cCI6MjA5MzQ3MTAwOX0.lRYGhJqn8AGQfVRmFNFNAj8H7iv7vMXKij8l8_YWmtA';

  /* ── QTY CARD SELECTION — wired here unconditionally so EUR users
     and exchange-API-fail users can always change quantity.
     The currency callback adds local price display on top of this. ── */
  var _qtyMap = {'5':'From € 15 per box · 5 to 50 loaves · Gluten Free','10':'€ 30 per box · 10 loaves · Gluten Free','20':'€ 60 per box · 20 loaves · Gluten Free','50':'€ 150 per box · 50 loaves · Gluten Free'};
  var _priceNote = document.querySelector('.price-note');
  var _qtyHidden = document.getElementById('bread-qty');
  document.querySelectorAll('.bread-qty-card').forEach(function(card){
    card.addEventListener('click', function(){
      document.querySelectorAll('.bread-qty-card').forEach(function(c){
        c.classList.remove('selected'); c.setAttribute('aria-pressed','false');
      });
      card.classList.add('selected'); card.setAttribute('aria-pressed','true');
      if(_qtyHidden) _qtyHidden.value = card.dataset.sku;
      if(_priceNote) _priceNote.innerHTML = (_qtyMap[card.dataset.sku] || _qtyMap['5']) + '<br>Ships in 3–5 business days';
    });
  });

  var btn     = document.getElementById('bread-submit');
  var nameEl  = document.getElementById('bread-name');
  var emailEl = document.getElementById('bread-email');
  var cntryEl = document.getElementById('bread-country');
  var msgEl   = document.getElementById('order-msg');
  if(!btn) return;

  function emailValid(e){return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)}

  /* ── Live inline validation ──────────────────────────────────────
     Shows green check or red border immediately as user types.
     Clears error state on fix. Gives feedback before submit.         */
  function setFieldValid(el){ el.setAttribute('aria-invalid','false'); el.classList.remove('field-error'); el.classList.add('field-ok'); }
  function setFieldError(el){ el.setAttribute('aria-invalid','true'); el.classList.add('field-error'); el.classList.remove('field-ok'); }
  function clearField(el){ el.setAttribute('aria-invalid','false'); el.classList.remove('field-error','field-ok'); }

  if(nameEl){
    nameEl.addEventListener('input', function(){
      if(this.value.trim().length >= 2) setFieldValid(this);
      else if(this.value.trim().length > 0) setFieldError(this);
      else clearField(this);
    });
    nameEl.addEventListener('blur', function(){
      if(this.value.trim().length < 2 && this.value.trim().length > 0) setFieldError(this);
    });
  }
  if(emailEl){
    emailEl.addEventListener('input', function(){
      var v = this.value.trim();
      if(emailValid(v)) setFieldValid(this);
      else if(v.length > 5) setFieldError(this);
      else clearField(this);
    });
    emailEl.addEventListener('blur', function(){
      var v = this.value.trim();
      if(v.length > 0 && !emailValid(v)) setFieldError(this);
    });
  }
  if(cntryEl){
    cntryEl.addEventListener('change', function(){
      if(this.value) setFieldValid(this);
      else setFieldError(this);
    });
  }
  /* ── end live validation ──────────────────────────────────────── */

  function setErr(msg,fieldEl){
    msgEl.className='err';msgEl.textContent=msg;
    // Clear previous aria-invalid
    [nameEl,emailEl,cntryEl].forEach(function(el){if(el)el.setAttribute('aria-invalid','false');});
    if(fieldEl){fieldEl.setAttribute('aria-invalid','true');}
  }
  function clearMsg(){msgEl.className='';msgEl.textContent=''}

  btn.addEventListener('click', async function(){
    clearMsg();
    var name    = nameEl.value.trim();
    var email   = emailEl.value.trim().toLowerCase();
    var country = cntryEl.value;
    var qtyCard = document.querySelector('.bread-qty-card.selected');
    var sku     = qtyCard ? qtyCard.dataset.sku : '5';

    var ok = true;
    if(name.length < 2){setErr('Enter your full name — we need this for your order confirmation.',nameEl);nameEl.focus();ok=false;}
    if(ok && !emailValid(email)){setErr('Email must include @ and a domain — for example, name@gmail.com.',emailEl);emailEl.focus();ok=false;}
    if(ok && !country){setErr('Select your shipping country so we know where to send your bread.',cntryEl);cntryEl.focus();ok=false;}
    if(!ok) return;

    var orig = btn.textContent;
    var origW = btn.offsetWidth;
    btn.style.minWidth = origW + 'px';
    btn.disabled = true;
    btn.textContent = 'Connecting…';

    /* Client-side timeout guard — if edge function takes >15s, restore button */
    var timeoutId = setTimeout(function(){
      btn.disabled = false;
      btn.textContent = orig;
      btn.style.minWidth = '';
      setErr('Taking too long — please check your connection and try again, or email hello@pncbread.love');
    }, 15000);

    try {
      var res = await fetch(SUPA_URL + '/functions/v1/preorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPA_ANON,
          'Authorization': 'Bearer ' + SUPA_ANON,
        },
        body: JSON.stringify({
          email: email,
          name: name,
          sku: sku,
          country: country,
          lang: 'en',
        }),
      });
      var data = await res.json();
      if(!res.ok || !data.url) throw new Error(data.error || 'no_checkout_url');
      clearTimeout(timeoutId);
      window.location.href = data.url;
    } catch(err) {
      clearTimeout(timeoutId);
      btn.disabled = false;
      btn.textContent = orig;
      btn.style.minWidth = '';
      setErr('Something went wrong — please try again or email hello@pncbread.love');
      /* Best-effort lead capture: save to waitlist even if checkout fails */
      try {
        fetch(SUPA_URL + '/rest/v1/waitlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPA_ANON,
            'Authorization': 'Bearer ' + SUPA_ANON,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ email: email, name: name, sku: sku, country: country, product: 'bread' })
        }).catch(function(){});
      } catch(e2) {}
    }
  });
})();

/* ========== */

(function(){
  if(!window.matchMedia('(hover:hover) and (min-width:769px)').matches) return;
  var banner = document.getElementById('desk-banner');
  if(!banner) return;

  /* Trigger: formats section (2nd section after hero on bread) */
  var triggerEl = document.querySelector('section.formats-section');
  /* Hide threshold: first text input of the order form */
  var hideEl    = document.getElementById('bread-name');

  if(!triggerEl || !hideEl) return;

  var shown  = false;
  var hidden = false;
  var bannerLink = banner.querySelector('a');

  var showObs = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting && !shown){
        shown = true;
        banner.classList.add('visible');
        if(bannerLink) bannerLink.removeAttribute('tabindex');
      }
    });
  }, { threshold: 0.15 });

  var hideObs = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){
        banner.classList.remove('visible');
        if(bannerLink) bannerLink.setAttribute('tabindex','-1');
        hidden = true;
      } else {
        if(shown && hidden){
          banner.classList.add('visible');
          if(bannerLink) bannerLink.removeAttribute('tabindex');
          hidden = false;
        }
      }
    });
  }, { threshold: 0, rootMargin: '0px 0px -40px 0px' });

  showObs.observe(triggerEl);
  hideObs.observe(hideEl);
})();

/* ========== */

document.addEventListener('DOMContentLoaded', function(){
  const obs=new IntersectionObserver(function(entries){
    entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);}});
  },{threshold:0.05,rootMargin:'0px 0px -16px 0px'});
  document.querySelectorAll('.reveal').forEach(function(el){obs.observe(el);});

  /* Ingredient row in-view for bar animations */
  const rowObs=new IntersectionObserver(function(entries){
    entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in-view');}});
  },{threshold:0.25});
  document.querySelectorAll('.ing-row').forEach(function(el){rowObs.observe(el);});
});

/* ========== */

/* Scroll-aware nav + mobile sticky CTA */
document.addEventListener('DOMContentLoaded',function(){
  document.body.classList.add('ready');
  var nav=document.getElementById('site-nav');
  var mcta=document.getElementById('mobile-cta');
  var hero=document.getElementById('main');
  if(!nav)return;
  window.addEventListener('scroll',function(){
    var y=window.scrollY||window.pageYOffset;
    if(y>40){nav.classList.add('scrolled')}else{nav.classList.remove('scrolled')}
    /* Show sticky CTA after hero clears viewport */
    if(mcta&&hero){
      var heroBottom=hero.getBoundingClientRect().bottom;
      var mctaLink = mcta.querySelector('a');
      if(heroBottom<0){
        mcta.classList.add('visible');
        if(mctaLink) mctaLink.removeAttribute('tabindex');
      }else{
        mcta.classList.remove('visible');
        if(mctaLink) mctaLink.setAttribute('tabindex','-1');
      }
    }
  },{passive:true});

  /* ── visualViewport: hide CTA when keyboard is open ─────────────
     iOS/Android raise the keyboard inside visualViewport, shrinking
     it. When viewport height drops >150px below window height,
     the keyboard is open — hide the CTA so it doesn't overlap.
  ── */
  if(window.visualViewport&&mcta){
    function onVPResize(){
      var keyboardOpen=(window.innerHeight-window.visualViewport.height)>150;
      if(keyboardOpen){mcta.style.display='none';}
      else{mcta.style.display='';}
    }
    window.visualViewport.addEventListener('resize',onVPResize,{passive:true});
    window.visualViewport.addEventListener('scroll',onVPResize,{passive:true});
  }
});

/* ========== */

(function(){
  var btn=document.getElementById('nav-hamburger');
  var drawer=document.getElementById('nav-drawer');
  if(!btn||!drawer)return;

  /* ── US2 AC6: Focus trap ── */
  var FOCUSABLE='a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

  function getFocusable(){
    return Array.prototype.slice.call(drawer.querySelectorAll(FOCUSABLE)).filter(function(el){
      return !el.closest('[hidden]') && el.offsetParent!==null;
    });
  }

  function trapTab(e){
    if(e.key!=='Tab')return;
    var nodes=getFocusable();
    if(!nodes.length){e.preventDefault();return;}
    var first=nodes[0], last=nodes[nodes.length-1];
    if(e.shiftKey){
      if(document.activeElement===first){e.preventDefault();last.focus();}
    } else {
      if(document.activeElement===last){e.preventDefault();first.focus();}
    }
  }

  function openDrawer(){
    drawer.classList.add('open');
    btn.classList.add('open');
    btn.setAttribute('aria-expanded','true');
    document.body.style.overflow='hidden';
    if(window.PNC_LENIS){window.PNC_LENIS.stop();}
    /* Move focus into drawer on next frame */
    requestAnimationFrame(function(){
      var nodes=getFocusable();
      if(nodes.length)nodes[0].focus();
    });
    drawer.addEventListener('keydown',trapTab);
  }

  function closeDrawer(){
    drawer.classList.remove('open');
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded','false');
    document.body.style.overflow='';
    if(window.PNC_LENIS){window.PNC_LENIS.start();}
    drawer.removeEventListener('keydown',trapTab);
    /* Return focus to trigger */
    btn.focus();
  }

  btn.addEventListener('click',function(){
    if(drawer.classList.contains('open')){closeDrawer();}else{openDrawer();}
  });
  drawer.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click',closeDrawer);
  });
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'&&drawer.classList.contains('open'))closeDrawer();
  });
  document.addEventListener('pointerdown',function(e){
    if(drawer.classList.contains('open')&&!drawer.contains(e.target)&&e.target!==btn&&!btn.contains(e.target))closeDrawer();
  });
})();

/* ========== */

(function(){
  /* Ingredient source coordinates */
  var sources = {
    de: { lat: 51.5, lon: 14.0, el: document.getElementById('dist-de') },  /* Lausitz, Germany */
    at: { lat: 47.6, lon: 13.8, el: document.getElementById('dist-at') },  /* Altaussee, Austria */
    in: { lat: 22.3, lon: 72.1, el: document.getElementById('dist-in') }   /* Gujarat, India */
  };

  /* Haversine great-circle distance in km */
  function haversine(lat1, lon1, lat2, lon2) {
    var R = 6371;
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLon = (lon2 - lon1) * Math.PI / 180;
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
  }

  /* Format km with locale-style thousands separator */
  function fmt(km) {
    if (km < 100) return '< 100 km';
    var rounded = km < 1000 ? Math.round(km / 10) * 10 : Math.round(km / 50) * 50;
    return '~' + rounded.toLocaleString() + ' km';
  }

  /* Update elements with visitor's real distances */
  function updateDistances(lat, lon) {
    for (var key in sources) {
      var s = sources[key];
      if (s.el) {
        var km = haversine(lat, lon, s.lat, s.lon);
        /* Animate the number change */
        s.el.style.transition = 'opacity .4s';
        s.el.style.opacity = '0';
        (function(el, val) {
          setTimeout(function() {
            el.textContent = val;
            el.style.opacity = '1';
          }, 400);
        })(s.el, fmt(km));
      }
    }
  }

  /* Fetch IP location — no key required, CORS-friendly */
  fetch('https://ipapi.co/json/')
    .then(function(r) { return r.json(); })
    .then(function(d) {
      if (d && d.latitude && d.longitude) {
        updateDistances(d.latitude, d.longitude);
      }
    })
    .catch(function() { /* silently keep static fallback values */ });
})();

/* ========== */

(function(){
  var el = document.getElementById('bread-77');
  if(!el) return;
  // Appear at exactly 55 seconds
  var hideTimer = null;
  var showTimer = setTimeout(function(){
    el.classList.add('visible');
    hideTimer = setTimeout(function(){
      el.classList.add('gone');
    }, 7000);
  }, 55000);
  // Clean up both timers if user leaves
  window.addEventListener('pagehide', function(){
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
  });
})();

/* ========== */

(function(){
  if(localStorage.getItem('pnc_cookie_consent'))return;
  var bar=document.getElementById('cookie-bar');
  if(!bar)return;
  setTimeout(function(){
    bar.classList.add('visible');
    document.body.classList.add('cookie-visible');
    // measure actual height for accurate push
    document.documentElement.style.setProperty('--cookie-h', bar.offsetHeight+'px');
  },800);
  function dismiss(val){
    localStorage.setItem('pnc_cookie_consent',val);
    bar.classList.remove('visible');
    document.body.classList.remove('cookie-visible');
    setTimeout(function(){bar.style.display='none';},500);
  }
  document.getElementById('cookie-essential').addEventListener('click',function(){dismiss('essential');});
  document.getElementById('cookie-accept').addEventListener('click',function(){dismiss('all');});
})();

/* ========== */

(function(){
  'use strict';

  if(window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  /* Only desktop+tablet — touch devices get a lighter version below */

  var hero   = document.getElementById('main');
  var hint   = document.getElementById('scatter-hint');
  var ring   = document.getElementById('scatter-ring');
  var flour  = document.getElementById('sw-flour');
  var husk   = document.getElementById('sw-husk');
  var salt   = document.getElementById('sw-salt');
  if(!hero||!ring||!flour||!husk||!salt) return;

  /* ── PHYSICS: viewport-relative displacement ─────────────────────
     Each ingredient has a scatter profile derived from its physical
     properties. Distances are in vw/vh so they read on any screen.

     Flour  — finely milled grain, lightest, disperses furthest,
              drifts upward and left, slight counter-clockwise rotation.
     Husk   — fibrous psyllium, medium weight, tumbles sideways,
              slight clockwise spin, settles lower than it started.
     Salt   — crystalline, densest of the three, shortest burst,
              drops sharply, rotates most aggressively.
  ──────────────────────────────────────────────────────────────── */
  function vw(n){ return window.innerWidth  * n / 100; }
  function vh(n){ return window.innerHeight * n / 100; }

  function getProfiles(){
    return {
      flour: { tx:  vw(4),  ty: -vh(18), rot: -12, scale: 1.06, dur: '1.55s', delay: 0   },
      husk:  { tx: -vw(6),  ty:  vh(10), rot:  10, scale: 0.92, dur: '1.72s', delay: 60  },
      salt:  { tx:  vw(8),  ty:  vh(14), rot: -20, scale: 1.0,  dur: '1.38s', delay: 120 }
    };
  }

  /* ── STATE ───────────────────────────────────────────────────── */
  var state       = 'idle'; /* idle | settling | settled | holding | scattered | returning */
  var holdTimer   = null;
  var hintTimer   = null;
  var returnTimer = null;
  var staggerTimers = [];
  var originX = 0, originY = 0;
  var HOLD_MS = 1500;
  var MOVE_THRESHOLD = 14; /* px — cancel hold if cursor drifts */

  /* ── INITIAL POSITIONING ─────────────────────────────────────── */
  function place(el){
    el.style.left      = el.dataset.baseX + '%';
    el.style.top       = el.dataset.baseY + '%';
    el.style.transform = 'translate(-50%,-50%) rotate(0deg) scale(1)';
  }

  function settleAll(){
    if(state === 'scattered' || state === 'returning') return;
    state = 'settling';
    [flour,husk,salt].forEach(function(w){
      w.classList.remove('scattered','returning');
      w.classList.add('settled');
      place(w);
    });
    setTimeout(function(){ if(state==='settling') state='settled'; }, 3100);
  }

  setTimeout(settleAll, 1600);

  /* ── SCATTER ─────────────────────────────────────────────────── */
  function doScatter(){
    if(state === 'scattered') return;
    clearTimers();
    state = 'scattered';

    hint.classList.add('gone');
    ringOff();

    var profiles = getProfiles();
    var pairs = [
      { el: flour, key: 'flour' },
      { el: husk,  key: 'husk'  },
      { el: salt,  key: 'salt'  }
    ];

    pairs.forEach(function(pair){
      var p  = profiles[pair.key];
      var el = pair.el;
      var bx = parseFloat(el.dataset.baseX);
      var by = parseFloat(el.dataset.baseY);

      var t = setTimeout(function(){
        el.style.setProperty('--scatter-dur', p.dur);
        el.classList.remove('settled','returning');
        el.classList.add('scattered');
        /* Apply viewport-relative displacement */
        el.style.transform =
          'translate(-50%,-50%)' +
          ' translate(' + p.tx + 'px,' + p.ty + 'px)' +
          ' rotate(' + p.rot + 'deg)' +
          ' scale(' + p.scale + ')';
      }, p.delay);

      staggerTimers.push(t);
    });

    /* Auto-return */
    returnTimer = setTimeout(returnAll, 3200);
  }

  /* ── RETURN ──────────────────────────────────────────────────── */
  function returnAll(){
    if(state !== 'scattered') return;
    state = 'returning';

    [flour,husk,salt].forEach(function(w, i){
      var t = setTimeout(function(){
        w.classList.remove('scattered');
        w.classList.add('returning');
        place(w);
      }, i * 80);
      staggerTimers.push(t);
    });

    /* After longest return transition completes, mark settled */
    setTimeout(function(){
      [flour,husk,salt].forEach(function(w){
        w.classList.remove('returning');
        w.classList.add('settled');
      });
      state = 'settled';
      /* Re-enable hold after a cooldown */
      setTimeout(function(){ }, 400);
    }, 3400);
  }

  /* ── RING ─────────────────────────────────────────────────────── */
  function ringOn(x, y){
    ring.style.left = x + 'px';
    ring.style.top  = y + 'px';
    ring.classList.add('active');
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        ring.classList.add('filling');
      });
    });
  }

  function ringOff(){
    ring.classList.remove('filling');
    ring.classList.remove('active');
    /* Force reflow so transition resets cleanly for next hold */
    void ring.offsetWidth;
  }

  /* ── HOLD ─────────────────────────────────────────────────────── */
  function startHold(x, y){
    if(state === 'scattered' || state === 'returning' || state === 'holding') return;
    state    = 'holding';
    originX  = x;
    originY  = y;

    ringOn(x, y);

    hintTimer = setTimeout(function(){
      if(state === 'holding'){
        hint.classList.remove('gone');
        hint.classList.add('hinting');
      }
    }, 700);

    holdTimer = setTimeout(function(){
      if(state === 'holding') doScatter();
    }, HOLD_MS);
  }

  function cancelHold(){
    if(state !== 'holding') return;
    state = 'settled';
    clearTimeout(holdTimer);
    clearTimeout(hintTimer);
    holdTimer = hintTimer = null;
    ringOff();
    hint.classList.remove('hinting');
  }

  function clearTimers(){
    clearTimeout(holdTimer);
    clearTimeout(hintTimer);
    clearTimeout(returnTimer);
    staggerTimers.forEach(clearTimeout);
    staggerTimers = [];
    holdTimer = hintTimer = returnTimer = null;
  }

  /* ── MOUSE ────────────────────────────────────────────────────── */
  /* mouseenter: start hold only if cursor arrives stationary        */
  /* (velocity-based: we check if no mousemove fires within 120ms)  */
  var enterTimer = null;

  hero.addEventListener('mouseenter', function(e){
    clearTimeout(enterTimer);
    var ex = e.clientX, ey = e.clientY;
    var moved = false;
    var onMove = function(ev){
      var dx = ev.clientX - ex, dy = ev.clientY - ey;
      if(Math.sqrt(dx*dx+dy*dy) > 4) moved = true;
    };
    document.addEventListener('mousemove', onMove, {once:false});
    enterTimer = setTimeout(function(){
      document.removeEventListener('mousemove', onMove);
      if(!moved && state !== 'scattered' && state !== 'returning'){
        startHold(ex, ey);
      }
    }, 140);
  });

  hero.addEventListener('mousemove', function(e){
    /* Update ring position while holding */
    if(state === 'holding'){
      ring.style.left = e.clientX + 'px';
      ring.style.top  = e.clientY + 'px';
      var dx = e.clientX - originX;
      var dy = e.clientY - originY;
      if(Math.sqrt(dx*dx+dy*dy) > MOVE_THRESHOLD){
        cancelHold();
        /* Restart hold at new position after brief pause */
        var nx = e.clientX, ny = e.clientY;
        var restartTimer = setTimeout(function(){
          startHold(nx, ny);
        }, 300);
        staggerTimers.push(restartTimer);
      }
    }
  });

  hero.addEventListener('mouseleave', function(){
    clearTimeout(enterTimer);
    cancelHold();
  });
  hero.addEventListener('mousedown',  cancelHold);

  /* ── TOUCH (long press) ──────────────────────────────────────── */
  var touchOriginX = 0, touchOriginY = 0;

  hero.addEventListener('touchstart', function(e){
    var t = e.touches[0];
    touchOriginX = t.clientX;
    touchOriginY = t.clientY;
    startHold(t.clientX, t.clientY);
  }, {passive:true});

  hero.addEventListener('touchmove', function(e){
    var t = e.touches[0];
    var dx = t.clientX - touchOriginX;
    var dy = t.clientY - touchOriginY;
    if(Math.sqrt(dx*dx+dy*dy) > 10) cancelHold();
    if(state === 'holding'){
      ring.style.left = t.clientX + 'px';
      ring.style.top  = t.clientY + 'px';
    }
  }, {passive:true});

  hero.addEventListener('touchend',    cancelHold);
  hero.addEventListener('touchcancel', cancelHold);

})();

/* ========== */

/* ── GLOBAL PRICE COMPREHENSION — pncbread.love ─────────────────────────
   Architecture:
   - €3 and €1 are ALWAYS the anchor. Always large. Never touched.
   - Local currency appears as a calm second line, 10–11px, opacity 0.5.
   - Works on every page: homepage, /bread, /brew.
   - Covers 100+ countries via timezone → currency (most reliable proxy).
   - Min-value guard: currencies that round to 0 show 2 decimal places.
   - Silent fail: if API down, EUR prices stand alone, nothing broken.
───────────────────────────────────────────────────────────────────────── */
(function(){

  /* ── 1. DETECT CURRENCY ─────────────────────────────────────────── */
  var TZ_CURRENCY = {
    'America/New_York':'USD','America/Chicago':'USD','America/Denver':'USD',
    'America/Los_Angeles':'USD','America/Phoenix':'USD','America/Anchorage':'USD',
    'Pacific/Honolulu':'USD',
    'America/Toronto':'CAD','America/Vancouver':'CAD','America/Edmonton':'CAD',
    'America/Winnipeg':'CAD','America/Halifax':'CAD','America/St_Johns':'CAD',
    'Europe/London':'GBP','Europe/Dublin':'EUR',
    'Europe/Zurich':'CHF','Europe/Bern':'CHF',
    'Europe/Stockholm':'SEK','Europe/Oslo':'NOK','Europe/Copenhagen':'DKK',
    'Atlantic/Reykjavik':'ISK',
    'Europe/Warsaw':'PLN','Europe/Prague':'CZK','Europe/Budapest':'HUF',
    'Europe/Bucharest':'RON','Europe/Sofia':'BGN','Europe/Zagreb':'HRK',
    'Europe/Belgrade':'RSD','Europe/Kyiv':'UAH','Europe/Minsk':'BYN',
    'Europe/Moscow':'RUB','Europe/Kaliningrad':'RUB','Asia/Yekaterinburg':'RUB',
    'Asia/Novosibirsk':'RUB','Asia/Irkutsk':'RUB','Asia/Vladivostok':'RUB',
    'Europe/Istanbul':'TRY','Asia/Istanbul':'TRY',
    'Asia/Tokyo':'JPY','Asia/Seoul':'KRW',
    'Asia/Singapore':'SGD','Asia/Hong_Kong':'HKD','Asia/Taipei':'TWD',
    'Asia/Shanghai':'CNY','Asia/Urumqi':'CNY','Asia/Chongqing':'CNY',
    'Asia/Kolkata':'INR','Asia/Calcutta':'INR',
    'Asia/Bangkok':'THB','Asia/Ho_Chi_Minh':'VND','Asia/Saigon':'VND',
    'Asia/Manila':'PHP','Asia/Kuala_Lumpur':'MYR','Asia/Kuching':'MYR',
    'Asia/Jakarta':'IDR','Asia/Makassar':'IDR','Asia/Jayapura':'IDR',
    'Asia/Phnom_Penh':'KHR','Asia/Colombo':'LKR',
    'Asia/Dhaka':'BDT','Asia/Karachi':'PKR','Asia/Kabul':'AFN',
    'Asia/Tehran':'IRR','Asia/Baghdad':'IQD',
    'Asia/Amman':'JOD','Asia/Beirut':'LBP',
    'Asia/Jerusalem':'ILS','Asia/Tel_Aviv':'ILS',
    'Asia/Dubai':'AED','Asia/Muscat':'OMR',
    'Asia/Riyadh':'SAR','Asia/Qatar':'QAR','Asia/Bahrain':'BHD',
    'Asia/Kuwait':'KWD','Asia/Aden':'YER',
    'Pacific/Auckland':'NZD','Pacific/Chatham':'NZD',
    'Australia/Sydney':'AUD','Australia/Melbourne':'AUD','Australia/Brisbane':'AUD',
    'Australia/Adelaide':'AUD','Australia/Perth':'AUD','Australia/Darwin':'AUD',
    'America/Sao_Paulo':'BRL','America/Fortaleza':'BRL','America/Recife':'BRL',
    'America/Manaus':'BRL','America/Belem':'BRL','America/Maceio':'BRL',
    'America/Argentina/Buenos_Aires':'ARS','America/Argentina/Cordoba':'ARS',
    'America/Santiago':'CLP','America/Bogota':'COP','America/Lima':'PEN',
    'America/Caracas':'VES','America/Montevideo':'UYU','America/Asuncion':'PYG',
    'America/Guayaquil':'USD','America/La_Paz':'BOB',
    'America/Costa_Rica':'CRC','America/Guatemala':'GTQ',
    'America/Tegucigalpa':'HNL','America/El_Salvador':'USD',
    'America/Santo_Domingo':'DOP','America/Jamaica':'JMD',
    'America/Mexico_City':'MXN','America/Merida':'MXN','America/Monterrey':'MXN',
    'Africa/Johannesburg':'ZAR','Africa/Lagos':'NGN',
    'Africa/Accra':'GHS','Africa/Nairobi':'KES',
    'Africa/Dar_es_Salaam':'TZS','Africa/Kampala':'UGX',
    'Africa/Addis_Ababa':'ETB','Africa/Dakar':'XOF',
    'Africa/Casablanca':'MAD','Africa/Tunis':'TND',
    'Africa/Cairo':'EGP','Africa/Algiers':'DZD',
    'Africa/Harare':'USD','Africa/Douala':'XAF',
    'Africa/Luanda':'AOA','Africa/Maputo':'MZN',
    'Africa/Abidjan':'XOF','Africa/Bamako':'XOF','Africa/Conakry':'GNF',
    'Asia/Tbilisi':'GEL','Asia/Yerevan':'AMD','Asia/Baku':'AZN',
    'Asia/Almaty':'KZT','Asia/Tashkent':'UZS','Asia/Bishkek':'KGS',
    'America/Panama':'USD',
    /* Eurozone — explicit so we skip correctly */
    'Europe/Berlin':'EUR','Europe/Vienna':'EUR','Europe/Paris':'EUR',
    'Europe/Rome':'EUR','Europe/Madrid':'EUR','Europe/Lisbon':'EUR',
    'Europe/Brussels':'EUR','Europe/Amsterdam':'EUR','Europe/Luxembourg':'EUR',
    'Europe/Helsinki':'EUR','Europe/Athens':'EUR','Europe/Nicosia':'EUR',
    'Europe/Valletta':'EUR','Europe/Bratislava':'EUR','Europe/Ljubljana':'EUR',
    'Europe/Tallinn':'EUR','Europe/Riga':'EUR','Europe/Vilnius':'EUR',
    'Europe/Monaco':'EUR','Europe/Andorra':'EUR','Europe/Vatican':'EUR',
    'Europe/San_Marino':'EUR','Europe/Mariehamn':'EUR'
  };

  var tz = '';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch(e){}
  var currency = TZ_CURRENCY[tz] || 'EUR';

  /* Fallback: Intl.Locale region if tz not in map */
  if(currency === 'EUR' && tz.indexOf('America') === -1 && tz.indexOf('Asia') === -1) {
    try {
      var reg = new Intl.Locale(navigator.language || 'en').region;
      var RC = {'US':'USD','GB':'GBP','CH':'CHF','SE':'SEK','DK':'DKK',
                'NO':'NOK','IS':'ISK','PL':'PLN','CZ':'CZK','HU':'HUF',
                'RO':'RON','BG':'BGN','HR':'HRK','RS':'RSD','UA':'UAH',
                'RU':'RUB','TR':'TRY','JP':'JPY','KR':'KRW','SG':'SGD',
                'HK':'HKD','TW':'TWD','CN':'CNY','IN':'INR','TH':'THB',
                'VN':'VND','PH':'PHP','MY':'MYR','ID':'IDR','AU':'AUD',
                'NZ':'NZD','CA':'CAD','BR':'BRL','MX':'MXN','AR':'ARS',
                'ZA':'ZAR','NG':'NGN','EG':'EGP','IL':'ILS','AE':'AED',
                'SA':'SAR','KW':'KWD','QA':'QAR','BH':'BHD','OM':'OMR',
                'JO':'JOD','KZ':'KZT','GE':'GEL','AM':'AMD','AZ':'AZN'};
      if(reg && RC[reg]) currency = RC[reg];
    } catch(e){}
  }

  if(currency === 'EUR') return; /* EUR visitors see nothing extra */

  /* ── 2. FETCH RATE — primary: open.er-api.com, secondary: frankfurter.app ── */
  function _applyRate(rate) {

      /* ── 3. FORMAT ──────────────────────────────────────────────── */
      /* Smart decimal: if €1 * rate < 5, show 2 dp; else round to int */
      function fmtLocal(eurAmt){
        var local = eurAmt * rate;
        var opts = {
          style:'currency', currency:currency,
          minimumFractionDigits: local < 5 ? 2 : 0,
          maximumFractionDigits: local < 5 ? 2 : 0
        };
        try {
          return new Intl.NumberFormat(navigator.language || 'en', opts).format(local);
        } catch(e) {
          return currency + ' ' + local.toFixed(local < 5 ? 2 : 0);
        }
      }

      var c1  = fmtLocal(1);   /* €1  → local */
      var c3  = fmtLocal(3);   /* €3  → local */
      var c15 = fmtLocal(15);  /* €15 → local */
      var c12 = fmtLocal(12);  /* €12 → local */

      /* ── 4. CSS ─────────────────────────────────────────────────── */
      var s = document.createElement('style');
      s.textContent =
        /* Block: sits on its own line below the big EUR number */
        '.pl{display:block;font-family:"Courier New",monospace;font-size:11px;'+
        'font-weight:400;letter-spacing:0.18em;text-transform:uppercase;'+
        'opacity:0.5;margin-top:6px;line-height:1.3;color:inherit;white-space:normal;}'+
        /* Inline: floats beside text */
        '.pli{font-family:"Courier New",monospace;font-size:0.55em;'+
        'font-weight:400;letter-spacing:0.12em;opacity:0.45;'+
        'vertical-align:middle;margin-left:0.35em;color:inherit;}'+
        /* Ship strip: below submit button */
        '.pship{display:block;font-family:"Courier New",monospace;'+
        'font-size:11px;letter-spacing:0.2em;text-transform:uppercase;'+
        'opacity:0.4;margin-top:14px;line-height:1.5;text-align:center;'+
        'color:var(--cream,#F8F4EC);}';
      document.head.appendChild(s);

      var path = window.location.pathname;
      var onBread = path.indexOf('/bread') !== -1;
      var onBrew  = path.indexOf('/brew')  !== -1;
      var onHome  = !onBread && !onBrew;

      /* ── 5. HOMEPAGE INJECTIONS ─────────────────────────────────── */
      if(onHome){
        /* hp-price-anchor: absolute top-right of each card
           It contains: "€ 3" text + <span>/ loaf</span>
           We append a new <span class="pl"> AFTER the existing span  */
        var anchors = document.querySelectorAll('.hp-price-anchor');
        if(anchors[0]) anchors[0].insertAdjacentHTML('beforeend',
          '<span class="pl">≈ '+c3+' · worldwide</span>');
        if(anchors[1]) anchors[1].insertAdjacentHTML('beforeend',
          '<span class="pl">≈ '+c1+'</span>');

        /* hp-price: footer of each card — inline append */
        var hpPrices = document.querySelectorAll('.hp-price');
        if(hpPrices[0]) hpPrices[0].insertAdjacentHTML('beforeend',
          '<span class="pli">≈ '+c3+'</span>');
        if(hpPrices[1]) hpPrices[1].insertAdjacentHTML('beforeend',
          '<span class="pli">≈ '+c1+'</span>');
      }

      /* ── 6. BREAD PAGE INJECTIONS ───────────────────────────────── */
      if(onBread){
        /* price-main = the big "€ 3" */
        var pm = document.querySelector('.price-main');
        if(pm) pm.insertAdjacentHTML('beforeend',
          '<span class="pl">≈ '+c3+' per loaf · '+c15+' per box</span>');

        /* submit button — shipping note below */
        var sb = document.getElementById('bread-submit');
        if(sb) sb.insertAdjacentHTML('afterend',
          '<span class="pship">Order in EUR · Stripe converts to your currency · ships worldwide</span>');

        /* Qty price-note local currency update — selection is handled above,
           this only enriches the price display with local currency equivalent */
        var localMap = {'5':fmtLocal(15),'10':fmtLocal(30),'20':fmtLocal(60),'50':fmtLocal(150)};
        var eurQtyMap = {'5':'From € 15 per box · 5 to 50 loaves · Gluten Free','10':'€ 30 per box · 10 loaves · Gluten Free','20':'€ 60 per box · 20 loaves · Gluten Free','50':'€ 150 per box · 50 loaves · Gluten Free'};
        var priceNoteEl = document.querySelector('.price-note');
        /* Re-patch click handlers to include local currency in price note */
        document.querySelectorAll('.bread-qty-card').forEach(function(card){
          card.addEventListener('click', function(){
            var v = card.dataset.sku;
            var label = eurQtyMap[v] || eurQtyMap['5'];
            var loc = localMap[v];
            if(priceNoteEl) priceNoteEl.innerHTML = label + (loc ? ' · ≈ ' + loc : '') + '<br>Ships in 3–5 business days';
          });
        });
      }

      /* ── 7. BREW PAGE INJECTIONS ────────────────────────────────── */
      if(onBrew){
        /* order-h2 = the big "€1 PER CUP." headline in the order section */
        var oh2 = document.querySelector('.order-h2');
        if(oh2) oh2.insertAdjacentHTML('beforeend',
          '<span class="pl" style="font-size:13px;margin-top:10px;">≈ '+c1+' per cup · '+c12+' per box</span>');

        /* qty-price cards — add local inline to each */
        var qtyPrices = document.querySelectorAll('.qty-price');
        var qtyEur = [7, 30, 60, 90];
        qtyPrices.forEach(function(el, i){
          if(qtyEur[i] !== undefined)
            el.insertAdjacentHTML('beforeend',
              '<span class="pli">≈ '+fmtLocal(qtyEur[i])+'</span>');
        });

        /* p-stat-val for "€ 1" in the product stats */
        var stats = document.querySelectorAll('.p-stat-val');
        stats.forEach(function(el){
          if(el.textContent.trim() === '€ 1')
            el.insertAdjacentHTML('beforeend',
              '<span class="pli">≈ '+c1+'</span>');
        });

        /* submit button — shipping note below */
        var sb = document.getElementById('brew-submit');
        if(sb) sb.insertAdjacentHTML('afterend',
          '<span class="pship">Order in EUR · Stripe converts to your currency · ships worldwide</span>');
      }

  }

  fetch('https://open.er-api.com/v6/latest/EUR')
    .then(function(r){ return r.json(); })
    .then(function(data){
      if(!data || !data.rates || !data.rates[currency]) throw new Error('no_rate');
      _applyRate(data.rates[currency]);
    }).catch(function(){
      fetch('https://api.frankfurter.app/latest?from=EUR&to=' + currency)
        .then(function(r){ return r.json(); })
        .then(function(data2){
          if(data2 && data2.rates && data2.rates[currency]) _applyRate(data2.rates[currency]);
        }).catch(function(){});
    });
})();