/* Doporučení po dohrané bezplatné hře. Mimo hru: žádné reklamy během hraní.
   Box se zobrazí až pod závěrečnou obrazovkou a zmizí, když se hra restartuje. */
(() => {
  'use strict';
  const stage = document.getElementById('game-stage');
  if (!stage) return;
  const UTM = '?utm_source=crushmeter&utm_medium=referral&utm_campaign=';
  const know = document.body.classList.contains('know-page');
  const guess = document.body.classList.contains('guess-page');
  if (!know && !guess) return;
  const html = know
    ? '<aside class="promo is-tarot play-wrap" id="end-promo" aria-label="Další projekt autora"><span class="promo-mark" aria-hidden="true">✦</span><div><small>Další projekt autora</small><strong>Co vám karty řeknou o vás dvou?</strong><p>Virtuální kartářka vytáhne karty a odpoví česky. Zábava, ne rozhodnutí za vás.</p><a href="https://virtualnikartarka.cz/' + UTM + 'konec_hry_poznavani" target="_blank" rel="noopener" data-track="click_virtualni_kartarka" data-track-placement="game-end">Vytáhnout karty →</a></div></aside>'
    : '<aside class="promo play-wrap" id="end-promo" aria-label="Další projekt autora"><span class="promo-mark" aria-hidden="true">↗</span><div><small>Další projekt autora</small><strong>Hra na večer je. A kam na výlet?</strong><p>Putování světem pomůže vybrat další společnou cestu.</p><a href="https://putovanisvetem.cz/kam-vyrazit/' + UTM + 'konec_hry_hadani" target="_blank" rel="noopener" data-track="click_putovani_svetem" data-track-placement="game-end">Vybrat cestu →</a></div></aside>';
  function sync() {
    const done = !!stage.querySelector('.final-screen, .game-result') && !stage.hidden;
    const box = document.getElementById('end-promo');
    if (done && !box) stage.insertAdjacentHTML('afterend', html);
    if (!done && box) box.remove();
  }
  new MutationObserver(sync).observe(stage, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
})();
