/* ── Blend · Bake · Break — Awwwards-level letter effects ── */
(function(){
  if(!window.gsap || !window.ScrollTrigger) return;
  if(!window.matchMedia('(hover:hover) and (min-width:769px)').matches) {
    /* Mobile: simple stagger reveal only */
    document.querySelectorAll('.sum-label').forEach(function(el){
      el.style.opacity = '0';
      el.style.transform = 'translateY(40px)';
      var obs = new IntersectionObserver(function(entries){
        if(entries[0].isIntersecting){
          el.style.transition = 'opacity .7s ease, transform .7s ease';
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
          obs.disconnect();
        }
      },{threshold:0.2});
      obs.observe(el);
    });
    return;
  }

  /* ── 1. Split text into letter spans ── */
  document.querySelectorAll('.sum-label').forEach(function(el){
    var word = el.textContent.trim();
    el.textContent = '';
    el.style.overflow = 'hidden';
    el.style.display = 'block';
    el.style.position = 'relative';

    /* Wrapper for clip-path masking */
    var wrap = document.createElement('span');
    wrap.style.cssText = 'display:inline-block;overflow:hidden;line-height:inherit;';

    word.split('').forEach(function(ch, i){
      var s = document.createElement('span');
      s.textContent = ch;
      s.dataset.i = i;
      s.style.cssText = [
        'display:inline-block',
        'position:relative',
        'transform-origin:50% 100%',
        /* initial state: clipped from bottom, scaled down, tilted */
        'transform:translateY(110%) rotateX(40deg) scaleY(0.6)',
        'opacity:0',
        'will-change:transform,opacity',
      ].join(';');
      wrap.appendChild(s);
    });

    el.appendChild(wrap);
    el._letters = wrap.children;
    el._wrap = wrap;
  });

  /* ── 2. ScrollTrigger entrance — per-letter stagger ── */
  document.querySelectorAll('.sum-label').forEach(function(el){
    var letters = Array.from(el._letters);

    gsap.set(el._wrap, {perspective: 600});

    ScrollTrigger.create({
      trigger: el,
      start: 'top 82%',
      once: true,
      onEnter: function(){
        gsap.to(letters, {
          y: 0,
          rotateX: 0,
          scaleY: 1,
          opacity: 1,
          duration: 0.9,
          ease: 'expo.out',
          stagger: {
            each: 0.055,
            from: 'start'
          }
        });
      }
    });
  });

  /* ── 3. Magnetic hover — letters repel/attract to cursor ── */
  document.querySelectorAll('.sum-label').forEach(function(el){
    var letters = Array.from(el._letters);
    var rect;

    el.addEventListener('mouseenter', function(){
      rect = el.getBoundingClientRect();
    });

    el.addEventListener('mousemove', function(e){
      if(!rect) rect = el.getBoundingClientRect();
      var cx = e.clientX - rect.left;
      var cy = e.clientY - rect.top;

      letters.forEach(function(s){
        var lr = s.getBoundingClientRect();
        var lx = lr.left + lr.width / 2 - e.clientX;
        var ly = lr.top + lr.height / 2 - e.clientY;
        var dist = Math.sqrt(lx*lx + ly*ly);
        var maxD = 120;
        if(dist < maxD){
          var pull = (1 - dist / maxD);
          var mx = -lx * pull * 0.35;
          var my = -ly * pull * 0.35;
          var rot = lx * pull * 4;
          gsap.to(s, {
            x: mx, y: my,
            rotation: rot,
            scale: 1 + pull * 0.12,
            duration: 0.35,
            ease: 'power2.out',
            overwrite: 'auto'
          });
        } else {
          gsap.to(s, {
            x:0, y:0, rotation:0, scale:1,
            duration: 0.6,
            ease: 'elastic.out(1,0.4)',
            overwrite: 'auto'
          });
        }
      });
    });

    el.addEventListener('mouseleave', function(){
      gsap.to(letters, {
        x:0, y:0, rotation:0, scale:1,
        duration: 0.8,
        ease: 'elastic.out(1,0.35)',
        stagger: 0.02,
        overwrite: 'auto'
      });
    });
  });

  /* ── 4. Shimmer sweep on scroll — gold glint moves across letters ── */
  var shimmerCSS = document.createElement('style');
  shimmerCSS.textContent = [
    '.sum-label-shimmer{',
    '  background:linear-gradient(90deg,transparent 0%,rgba(196,149,10,0.55) 50%,transparent 100%);',
    '  position:absolute;top:0;left:-100%;width:60%;height:100%;',
    '  pointer-events:none;z-index:2;mix-blend-mode:overlay;',
    '  border-radius:inherit;',
    '}',
  ].join('');
  document.head.appendChild(shimmerCSS);

  document.querySelectorAll('.sum-label').forEach(function(el){
    var shim = document.createElement('span');
    shim.className = 'sum-label-shimmer';
    el.style.position = 'relative';
    el.appendChild(shim);

    ScrollTrigger.create({
      trigger: el,
      start: 'top 75%',
      once: true,
      onEnter: function(){
        setTimeout(function(){
          gsap.fromTo(shim,
            {left:'-60%', opacity:0},
            {left:'120%', opacity:1, duration:1.1, ease:'power2.inOut',
             onComplete:function(){ gsap.set(shim,{opacity:0}); }
            }
          );
        }, 300);
      }
    });
  });

})();
