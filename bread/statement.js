/* statement.js — OUR DAILY BREAD. viewport reveal + fluid font fill */
(function() {
  'use strict';

  const section = document.querySelector('.statement-hero');
  if (!section) return;

  /* ── Fluid font scaling: make BREAD. literally fill viewport width ── */
  const bigWord = section.querySelector('.stmt-line--lg .stmt-word');

  function fitBigWord() {
    if (!bigWord) return;
    bigWord.style.fontSize = '10px'; // reset
    const containerW = section.offsetWidth - (parseFloat(getComputedStyle(section).paddingLeft) + parseFloat(getComputedStyle(section).paddingRight));
    const wordW = bigWord.scrollWidth;
    if (wordW === 0) return;
    const scale = containerW / wordW;
    bigWord.style.fontSize = (10 * scale * 0.97) + 'px'; // 97% fill — tiny breath on edges
  }

  // Run on load and resize
  fitBigWord();
  window.addEventListener('resize', fitBigWord, { passive: true });
  // Re-run after fonts load
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
  }, { threshold: 0.15 });

  io.observe(section);

})();
