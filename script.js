(function(){
  var dot  = document.getElementById('cur-dot');
  var ring = document.getElementById('cur-ring');
  if (!dot || !ring || window.matchMedia('(pointer:coarse)').matches) return;

  var C_DARK  = '#4A3018';
  var C_LIGHT = '#F8F4EC';
  var DOT_R   = 5;
  var RING_RX = 48, RING_RY = 48;
  var LERP    = 0.10;
  var SQ_W    = '10px', SQ_H = '10px';
  var SQ_BR   = '0';
  var SQ_ROT  = '0deg';

  var mx = -9999, my = -9999;
  var rx = -9999, ry = -9999;
  var rafId = null, settled = 0;
  var currentDark = false;
  var inTextField = false;

  dot.style.willChange  = 'transform, background';
  ring.style.willChange = 'transform, border-color';

  function isDarkUnder(x, y) {
    dot.style.display  = 'none';
    ring.style.display = 'none';
    var el = document.elementFromPoint(x, y);
    dot.style.display  = '';
    ring.style.display = '';
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
    dot.style.transition   = 'background 0ms';
    ring.style.transition  = 'border-color 0ms, width .22s cubic-bezier(.16,1,.3,1), height .22s cubic-bezier(.16,1,.3,1), opacity 160ms ease';
    dot.style.background   = c;
    ring.style.borderColor = c;
    if (!inTextField) ring.style.opacity = dark ? '0.55' : '0.60';
  }

  function loop() {
    var dx = (mx - RING_RX) - rx;
    var dy = (my - RING_RY) - ry;
    rx += dx * LERP;
    ry += dy * LERP;
    dot.style.transform  = 'translate3d(' + (mx - DOT_R) + 'px,' + (my - DOT_R) + 'px,0) rotate(' + SQ_ROT + ')';
    ring.style.transform = 'translate3d(' + Math.round(rx) + 'px,' + Math.round(ry) + 'px,0) rotate(' + (ring.dataset.rot || SQ_ROT) + ')';
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
    ring.style.transform = 'translate3d(-9999px,-9999px,0)';
  });

  document.addEventListener('mousedown', function() {
    if (inTextField) return;
    dot.style.transform  = 'translate3d(' + (mx - DOT_R) + 'px,' + (my - DOT_R) + 'px,0) rotate(' + SQ_ROT + ') scale(0.8)';
    ring.style.transform = 'translate3d(' + Math.round(rx) + 'px,' + Math.round(ry) + 'px,0) rotate(' + (ring.dataset.rot || SQ_ROT) + ') scale(0.85)';
  }, {passive:true});

  document.addEventListener('mouseup', function() {
    if (inTextField) return;
    dot.style.transform  = 'translate3d(' + (mx - DOT_R) + 'px,' + (my - DOT_R) + 'px,0) rotate(' + SQ_ROT + ')';
    ring.style.transform = 'translate3d(' + Math.round(rx) + 'px,' + Math.round(ry) + 'px,0) rotate(' + (ring.dataset.rot || SQ_ROT) + ')';
  }, {passive:true});

  document.querySelectorAll('a,button,[role=button],select').forEach(function(el) {
    el.addEventListener('mouseenter', function() {
      ring.style.width = '96px'; ring.style.height = '96px';
      ring.style.opacity = currentDark ? '0.40' : '0.35';
      startLoop();
    });
    el.addEventListener('mouseleave', function() {
      ring.style.width = '96px'; ring.style.height = '96px';
      ring.style.opacity = currentDark ? '0.55' : '0.60';
      startLoop();
    });
  });

  function enterTextField() {
    if (inTextField) return;
    inTextField = true;
    if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
    dot.style.transition   = 'width 70ms ease, height 70ms ease, border-radius 70ms ease';
    dot.style.width        = '2px';
    dot.style.height       = '20px';
    dot.style.borderRadius = '1px';
    dot.style.background   = currentDark ? C_LIGHT : C_DARK;
    dot.style.animation    = 'textCursorBlink 1.1s step-end infinite';
    ring.style.opacity     = '0';
    ring.style.transform   = 'translate3d(-9999px,-9999px,0)';
  }

  function leaveTextField() {
    if (!inTextField) return;
    inTextField = false;
    dot.style.animation    = 'none';
    dot.style.transition   = 'width 120ms ease, height 120ms ease, border-radius 180ms ease';
    dot.style.width        = SQ_W;
    dot.style.height       = SQ_H;
    dot.style.borderRadius = SQ_BR;
    dot.style.background   = currentDark ? C_LIGHT : C_DARK;
    rx = mx - RING_RX; ry = my - RING_RY;
    ring.style.transform   = 'translate3d(' + Math.round(rx) + 'px,' + Math.round(ry) + 'px,0) rotate(' + SQ_ROT + ')';
    ring.style.opacity     = currentDark ? '0.55' : '0.60';
    ring.style.width       = '96px';
    ring.style.height      = '96px';
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
    duration: 1.3,
    easing: function(t){ return t===1?1:1-Math.pow(2,-10*t); },
    smoothWheel: true,
    wheelMultiplier: 0.85,
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
  const obs=new IntersectionObserver(function(entries){
    entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);}});
  },{threshold:0.05,rootMargin:'0px 0px -16px 0px'});
  document.querySelectorAll('.reveal').forEach(function(el){obs.observe(el);});
})();

/* ========== */

/* Scroll-aware nav */
document.addEventListener('DOMContentLoaded',function(){
  document.body.classList.add('ready');
  /* Return visits: no preloader — fire revealed immediately so CSS animations run */
  if (sessionStorage.getItem('pnc_visited')) {
    document.body.classList.add('pnc-revealed');
  }
  var nav=document.getElementById('site-nav');
  if(!nav)return;
  window.addEventListener('scroll',function(){
    var y=window.scrollY||window.pageYOffset;
    if(y>40){nav.classList.add('scrolled')}else{nav.classList.remove('scrolled')}
  },{passive:true});
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