/* statement.js — OUR DAILY BREAD. viewport reveal + fluid font fill
   v2: preloader-aware — delays reveal until after the curtain lifts
   on first cold load, fires immediately on returning visits.
*/
(function() {
  'use strict';

  var section = document.querySelector('.statement-hero');
  if (!section) return;

  /* ── Fluid font scaling: make BREAD./BREW. fill viewport width ── */
  var bigWord = section.querySelector('.stmt-line--lg .stmt-word');

  function fitBigWord() {
    if (!bigWord) return;
    bigWord.style.fontSize = '10px';
    var containerW = section.offsetWidth - (
      parseFloat(getComputedStyle(section).paddingLeft) +
      parseFloat(getComputedStyle(section).paddingRight)
    );
    var wordW = bigWord.scrollWidth;
    if (wordW === 0) return;
    bigWord.style.fontSize = (10 * (containerW / wordW) * 0.97) + 'px';
  }

  fitBigWord();
  window.addEventListener('resize', fitBigWord, { passive: true });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(fitBigWord);
  }

  /* ── Preloader-aware reveal ─────────────────────────────────────
     On first visit (no pnc_visited flag) the preloader holds for
     ~2.06s then lifts over 0.9s. The statement-hero sits at the
     very top of the page, so IntersectionObserver fires immediately.
     Without a delay the words reveal UNDER the preloader — wasted.
     We delay by 1.9s on first load to sync with curtain lift.
  ─────────────────────────────────────────────────────────────── */
  var FIRST_LOAD = !sessionStorage.getItem('pnc_visited');
  var REVEAL_DELAY = FIRST_LOAD ? 1900 : 0;

  var revealed = false;

  function reveal() {
    if (revealed) return;
    revealed = true;
    section.classList.add('is-visible');
  }

  var io = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        setTimeout(reveal, REVEAL_DELAY);
        io.unobserve(section);
      }
    });
  }, { threshold: 0.05 });

  io.observe(section);

})();
