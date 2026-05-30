/* ─────────────────────────────────────────────────────────────────────────
   PNC · cursor — hardened single-system cursor
   One rAF loop. One color check. No conflicts with cursor-magnetic.js.
   Color: cream on data-dark surfaces, brown on light surfaces.
───────────────────────────────────────────────────────────────────────── */
(function(){
  'use strict';

  /* Touch / no-cursor devices: bail immediately */
  if (window.matchMedia('(pointer:coarse)').matches) return;

  var dot  = document.getElementById('cur-dot');
  var ring = document.getElementById('cur-ring');
  if (!dot || !ring) return;

  /* ── Constants ──────────────────────────────────────────────────── */
  var C_ON_DARK  = '#F8F4EC'; /* cream — used on dark backgrounds    */
  var C_ON_LIGHT = '#4A3018'; /* brown — used on light backgrounds   */
  var DOT_R      = 5;         /* half dot size for centring          */
  var RING_HALF  = 48;        /* half ring size (96px / 2)           */
  var LERP       = 0.10;

  /* ── State ──────────────────────────────────────────────────────── */
  var mx = -9999, my = -9999;   /* raw mouse position                */
  var rx = -9999, ry = -9999;   /* ring lerp position                */
  var rafId    = null;
  var settled  = 0;
  var isDark   = false;         /* current surface type              */
  var inField  = false;         /* inside text input                 */
  var active   = false;         /* has mouse entered the window      */

  /* ── Apply color immediately, no transition ────────────────────── */
  function applyColor(dark) {
    var c = dark ? C_ON_DARK : C_ON_LIGHT;
    dot.style.background   = c;
    ring.style.borderColor = c;
  }

  /* ── Surface detection — walk DOM up from point ────────────────── */
  function checkSurface(x, y) {
    /* Temporarily move cursor elements off-screen so they don't
       block elementFromPoint — store and restore without display:none
       to avoid layout reflow */
    var dotVis  = dot.style.visibility;
    var ringVis = ring.style.visibility;
    dot.style.visibility  = 'hidden';
    ring.style.visibility = 'hidden';

    var el = document.elementFromPoint(x, y);

    dot.style.visibility  = dotVis  || '';
    ring.style.visibility = ringVis || '';

    if (!el) return false;
    var node = el;
    while (node && node !== document.documentElement) {
      if (node.hasAttribute && node.hasAttribute('data-dark')) return true;
      node = node.parentElement;
    }
    return false;
  }

  /* ── Main rAF loop — position + settle ─────────────────────────── */
  function loop() {
    var dx = (mx - RING_HALF) - rx;
    var dy = (my - RING_HALF) - ry;
    rx += dx * LERP;
    ry += dy * LERP;

    dot.style.transform  = 'translate3d(' + (mx - DOT_R) + 'px,' + (my - DOT_R) + 'px,0)';
    ring.style.transform = 'translate3d(' + Math.round(rx) + 'px,' + Math.round(ry) + 'px,0)';

    if (Math.abs(dx) < 0.3 && Math.abs(dy) < 0.3) {
      if (++settled > 4) { rafId = null; return; }
    } else { settled = 0; }
    rafId = requestAnimationFrame(loop);
  }

  function startLoop() {
    settled = 0;
    if (rafId === null) rafId = requestAnimationFrame(loop);
  }

  /* ── mousemove — the single source of truth ─────────────────────── */
  document.addEventListener('mousemove', function(e) {
    mx = e.clientX;
    my = e.clientY;

    if (!active) {
      active = true;
      dot.style.opacity  = '1';
      ring.style.opacity = '0.60';
    }

    /* Color check every move — visibility trick avoids layout reflow */
    var dark = checkSurface(mx, my);
    if (dark !== isDark) {
      isDark = dark;
      applyColor(dark);
    }

    if (!inField) startLoop();
  }, { passive: true });

  /* ── Window enter/leave ─────────────────────────────────────────── */
  document.addEventListener('mouseenter', function() {
    active = true;
    dot.style.opacity  = '1';
    ring.style.opacity = '0.60';
  });
  document.addEventListener('mouseleave', function() {
    active = false;
    dot.style.transform  = 'translate3d(-9999px,-9999px,0)';
    ring.style.transform = 'translate3d(-9999px,-9999px,0)';
    mx = -9999; my = -9999;
  });

  /* ── Click feedback ─────────────────────────────────────────────── */
  document.addEventListener('mousedown', function() {
    if (inField) return;
    dot.style.transform  = 'translate3d(' + (mx - DOT_R) + 'px,' + (my - DOT_R) + 'px,0) scale(0.75)';
    ring.style.transform = 'translate3d(' + Math.round(rx) + 'px,' + Math.round(ry) + 'px,0) scale(0.85)';
  }, { passive: true });
  document.addEventListener('mouseup', function() {
    if (inField) return;
    dot.style.transform  = 'translate3d(' + (mx - DOT_R) + 'px,' + (my - DOT_R) + 'px,0)';
    ring.style.transform = 'translate3d(' + Math.round(rx) + 'px,' + Math.round(ry) + 'px,0)';
  }, { passive: true });

  /* ── Text field caret mode ──────────────────────────────────────── */
  function enterField() {
    if (inField) return;
    inField = true;
    if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
    dot.style.width        = '2px';
    dot.style.height       = '20px';
    dot.style.borderRadius = '1px';
    dot.style.background   = isDark ? C_ON_DARK : C_ON_LIGHT;
    dot.style.animation    = 'textCursorBlink 1.1s step-end infinite';
    ring.style.opacity     = '0';
  }
  function leaveField() {
    if (!inField) return;
    inField = false;
    dot.style.animation    = 'none';
    dot.style.width        = '10px';
    dot.style.height       = '10px';
    dot.style.borderRadius = '0';
    dot.style.background   = isDark ? C_ON_DARK : C_ON_LIGHT;
    ring.style.opacity     = '0.60';
    rx = mx - RING_HALF;
    ry = my - RING_HALF;
    ring.style.transform   = 'translate3d(' + Math.round(rx) + 'px,' + Math.round(ry) + 'px,0)';
    startLoop();
  }

  document.addEventListener('focusin', function(e) {
    var t = e.target ? e.target.tagName : '';
    if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') enterField();
    else leaveField();
  });
  document.addEventListener('focusout', function() {
    leaveField();
  });

  /* ── Expose so cursor-magnetic.js can read isDark ───────────────── */
  window.PNC_CURSOR = {
    getIsDark: function() { return isDark; },
    startLoop: startLoop
  };

})();

/* ========== LENIS SMOOTH SCROLL ========== */

document.addEventListener('DOMContentLoaded', function(){
  if (typeof Lenis === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;

  var lenis = new Lenis({
    duration: 1.3,
    easing: function(t){ return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); },
    smoothWheel: true,
    wheelMultiplier: 0.85,
    touchMultiplier: 1.8,
  });
  window.PNC_LENIS = lenis;

  var prog  = document.getElementById('prog');
  var progR = document.getElementById('prog-r');
  var rafId2 = null;
  function lenisRaf(time) { lenis.raf(time); rafId2 = requestAnimationFrame(lenisRaf); }
  rafId2 = requestAnimationFrame(lenisRaf);

  if (prog) {
    window.addEventListener('scroll', function(){
      var max = document.body.scrollHeight - window.innerHeight;
      var h = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
      prog.style.height = h;
      if (progR) progR.style.height = h;
    }, { passive: true });
  }

  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click', function(e){
      var t = document.querySelector(this.getAttribute('href'));
      if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -62, duration: 1.4 }); }
    });
  });
});

/* ========== REVEAL OBSERVER ========== */

(function(){
  var obs = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -16px 0px' });
  document.querySelectorAll('.reveal').forEach(function(el){ obs.observe(el); });
})();

/* ========== SCROLL-AWARE NAV ========== */

document.addEventListener('DOMContentLoaded', function(){
  document.body.classList.add('ready');
  if (sessionStorage.getItem('pnc_visited')) {
    document.body.classList.add('pnc-revealed');
  }
  var nav = document.getElementById('site-nav');
  if (!nav) return;
  window.addEventListener('scroll', function(){
    nav.classList.toggle('scrolled', (window.scrollY || window.pageYOffset) > 40);
  }, { passive: true });
});

/* ========== MOBILE NAV DRAWER ========== */

(function(){
  var btn    = document.getElementById('nav-hamburger');
  var drawer = document.getElementById('nav-drawer');
  if (!btn || !drawer) return;

  var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

  function getFocusable(){
    return Array.prototype.slice.call(drawer.querySelectorAll(FOCUSABLE)).filter(function(el){
      return !el.closest('[hidden]') && el.offsetParent !== null;
    });
  }
  function trapTab(e){
    if (e.key !== 'Tab') return;
    var nodes = getFocusable();
    if (!nodes.length) { e.preventDefault(); return; }
    var first = nodes[0], last = nodes[nodes.length - 1];
    if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
    else            { if (document.activeElement === last)  { e.preventDefault(); first.focus(); } }
  }
  function openDrawer(){
    drawer.classList.add('open');
    btn.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    if (window.PNC_LENIS) window.PNC_LENIS.stop();
    requestAnimationFrame(function(){ var n = getFocusable(); if (n.length) n[0].focus(); });
    drawer.addEventListener('keydown', trapTab);
  }
  function closeDrawer(){
    drawer.classList.remove('open');
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    if (window.PNC_LENIS) window.PNC_LENIS.start();
    drawer.removeEventListener('keydown', trapTab);
    btn.focus();
  }
  btn.addEventListener('click', function(){
    drawer.classList.contains('open') ? closeDrawer() : openDrawer();
  });
  drawer.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', closeDrawer); });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer();
  });
  document.addEventListener('pointerdown', function(e){
    if (drawer.classList.contains('open') && !drawer.contains(e.target) && e.target !== btn && !btn.contains(e.target)) closeDrawer();
  });
})();

/* ========== COOKIE BAR ========== */

(function(){
  if (localStorage.getItem('pnc_cookie_consent')) return;
  var bar = document.getElementById('cookie-bar');
  if (!bar) return;
  setTimeout(function(){ bar.classList.add('visible'); }, 800);
  function dismiss(val){
    localStorage.setItem('pnc_cookie_consent', val);
    bar.classList.add('dismissing');
    bar.classList.remove('visible');
    setTimeout(function(){ bar.style.display = 'none'; }, 480);
  }
  var ess = document.getElementById('cookie-essential');
  var acc = document.getElementById('cookie-accept');
  if (ess) ess.addEventListener('click', function(){ dismiss('essential'); });
  if (acc) acc.addEventListener('click', function(){ dismiss('all'); });
})();

  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'&&drawer.classList.contains('open'))closeDrawer();
  });
  document.addEventListener('pointerdown',function(e){
    if(drawer.classList.contains('open')&&!drawer.contains(e.target)&&e.target!==btn&&!btn.contains(e.target))closeDrawer();
  });
})();

/* ========== */

(function(){
  if(localStorage.getItem('pnc_cookie_consent'))return;
  var bar=document.getElementById('cookie-bar');
  if(!bar)return;
  setTimeout(function(){bar.classList.add('visible');},800);
  function dismiss(val){
    localStorage.setItem('pnc_cookie_consent',val);
    bar.classList.add('dismissing');
    bar.classList.remove('visible');
    setTimeout(function(){bar.style.display='none';},480);
  }
  document.getElementById('cookie-essential').addEventListener('click',function(){dismiss('essential');});
  document.getElementById('cookie-accept').addEventListener('click',function(){dismiss('all');});
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

  /* ── 2. FETCH RATE — 24h localStorage cache reduces API dependency ── */
  var _CACHE_KEY = 'pnc_fx_' + currency;
  var _CACHE_TTL = 86400000; /* 24 hours */
  var _cachedRate = null;
  try {
    var _raw = localStorage.getItem(_CACHE_KEY);
    if (_raw) {
      var _c = JSON.parse(_raw);
      if (_c && _c.ts && (Date.now() - _c.ts < _CACHE_TTL) && _c.rate) {
        _cachedRate = _c.rate;
      }
    }
  } catch(e) {}

  function _doWithRate(rate) {

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

        /* form-note: add currency note so non-EUR visitors see it before filling form */
        var fn = document.querySelector('.form-note');
        if(fn) fn.insertAdjacentHTML('beforeend',
          ' · <span style="opacity:0.75">Priced in EUR — your card converts automatically.</span>');
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
              '<span class="pl" style="font-size:10px;margin-top:5px;opacity:0.45;letter-spacing:.12em;">≈ '+fmtLocal(qtyEur[i])+'</span>');
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

        /* form-note: add currency note so non-EUR visitors see it before filling form */
        var fn = document.querySelector('.form-note');
        if(fn) fn.insertAdjacentHTML('beforeend',
          ' · <span style="opacity:0.75">Priced in EUR — your card converts automatically.</span>');
      }

  }

  function _fetchRate() {
    /* Primary: open.er-api.com. Secondary: frankfurter.app. Final: stale cache. */
    function trySecondary() {
      fetch('https://api.frankfurter.app/latest?from=EUR&to=' + currency)
        .then(function(r){ return r.json(); })
        .then(function(data){
          if(!data || !data.rates || !data.rates[currency]) throw new Error('no_rate');
          var rate = data.rates[currency];
          try { localStorage.setItem(_CACHE_KEY, JSON.stringify({rate:rate, ts:Date.now()})); } catch(e) {}
          _doWithRate(rate);
        }).catch(function(){
          if (_cachedRate) _doWithRate(_cachedRate); /* final fallback: stale cache */
        });
    }
    fetch('https://open.er-api.com/v6/latest/EUR')
      .then(function(r){ return r.json(); })
      .then(function(data){
        if(!data || !data.rates || !data.rates[currency]) throw new Error('no_rate');
        var rate = data.rates[currency];
        try { localStorage.setItem(_CACHE_KEY, JSON.stringify({rate:rate, ts:Date.now()})); } catch(e) {}
        _doWithRate(rate);
      }).catch(function(){
        trySecondary();
      });
  }

  if (_cachedRate) {
    _doWithRate(_cachedRate); /* instant render from cache */
    /* Background refresh if cache older than 12h */
    try {
      if ((Date.now() - JSON.parse(localStorage.getItem(_CACHE_KEY)).ts) > 43200000) _fetchRate();
    } catch(e) {}
  } else {
    _fetchRate();
  }
})();