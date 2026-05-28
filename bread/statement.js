/* statement.js — OUR DAILY BREAD. viewport reveal + fluid font fill */
(function() {
  'use strict';

  const section = document.querySelector('.statement-hero');
  if (!section) return;

  /* ── Fluid font scaling: make BREAD. literally fill viewport width ── */
  const bigWord = section.querySelector('#stmt-big-word') || section.querySelector('.stmt-line--lg .stmt-word');

  function fitBigWord() {
    if (!bigWord) return;
    bigWord.style.fontSize = '10px'; // reset
    const containerW = section.offsetWidth
      - parseFloat(getComputedStyle(section).paddingLeft)
      - parseFloat(getComputedStyle(section).paddingRight)
      // leave room for coord marker on desktop
      - (window.innerWidth > 600 ? clamp(30, window.innerWidth * 0.04, 80) : 0);
    const wordW = bigWord.scrollWidth;
    if (wordW === 0) return;
    const scale = containerW / wordW;
    bigWord.style.fontSize = (10 * scale * 0.975) + 'px';
  }

  function clamp(min, val, max) { return Math.min(Math.max(val, min), max); }

  fitBigWord();
  window.addEventListener('resize', fitBigWord, { passive: true });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(fitBigWord);
  }

  /* ── Intersection Observer: class-based reveal ── */
  const io = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        section.classList.add('is-visible');
        io.unobserve(section);
      }
    });
  }, { threshold: 0.1 });

  io.observe(section);
})();
