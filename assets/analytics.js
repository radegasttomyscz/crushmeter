/* Měření návštěvnosti (GA4) se souhlasem uživatele.
   - Bez ga4Id v config.js nedělá nic a nezobrazuje žádnou lištu.
   - GA4 se načte až po souhlasu. Do té doby se události drží jen v paměti.
   - Posílají se jen povolené parametry. Odpovědi hráčů, jména a e-maily se neposílají. */
(() => {
  'use strict';
  const cfg = window.CM_CONFIG || {};
  const KEY = 'crushmeter.consent';
  const enabled = !!cfg.ga4Id;
  const ALLOWED = ['game', 'mode', 'rounds', 'level', 'audience', 'cards', 'skipped', 'partner', 'status', 'placement', 'reason'];
  const queue = [];
  let loaded = false;

  const read = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
  const write = v => { try { localStorage.setItem(KEY, v); } catch {} };
  let state = read();

  function clean(params) {
    const out = {};
    for (const k of Object.keys(params || {})) {
      if (!ALLOWED.includes(k)) continue;
      let v = params[k];
      if (typeof v === 'string') { if (v.includes('@')) continue; v = v.slice(0, 40); }
      else if (typeof v !== 'number' && typeof v !== 'boolean') continue;
      out[k] = v;
    }
    return out;
  }

  function load() {
    if (loaded || !enabled) return;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', cfg.ga4Id, { anonymize_ip: true, allow_google_signals: false, allow_ad_personalization_signals: false });
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(cfg.ga4Id);
    document.head.append(s);
    queue.splice(0).forEach(e => window.gtag('event', e[0], e[1]));
  }

  function track(name, params) {
    if (!enabled) return;
    const safe = clean(params);
    if (state === 'granted') { load(); window.gtag('event', name, safe); }
    else if (state === null) { queue.push([name, safe]); if (queue.length > 40) queue.shift(); }
  }

  function setConsent(value) {
    state = value; write(value);
    if (value === 'granted') load(); else queue.length = 0;
    document.getElementById('consent-bar')?.remove();
  }

  function showBar() {
    if (!enabled || document.getElementById('consent-bar')) return;
    const bar = document.createElement('section');
    bar.id = 'consent-bar'; bar.className = 'consent-bar'; bar.setAttribute('aria-label', 'Měření návštěvnosti');
    bar.innerHTML = '<p><strong>Můžeme měřit, co se na webu hraje?</strong> Jde o anonymní statistiku bez odpovědí hráčů a bez e-mailů. <a href="/cookies.html">Podrobnosti</a></p><div><button type="button" class="button small" data-consent="granted">Povolit</button><button type="button" class="button light small" data-consent="denied">Jen nutné</button></div>';
    bar.addEventListener('click', e => { const b = e.target.closest('[data-consent]'); if (b) setConsent(b.dataset.consent); });
    document.body.append(bar);
  }

  /* Kliknutí na odkazy s data-track="událost". Další parametry jsou v data-track-* atributech. */
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-track]');
    if (!el) return;
    const params = {};
    ALLOWED.forEach(k => { if (el.dataset['track' + k[0].toUpperCase() + k.slice(1)] !== undefined) params[k] = el.dataset['track' + k[0].toUpperCase() + k.slice(1)]; });
    track(el.dataset.track, params);
  });

  /* Automatické události bezplatných her bez zásahu do jejich kódu. */
  function watchFreeGame() {
    const game = document.body.classList.contains('guess-page') ? 'predved-a-hadej' : document.body.classList.contains('know-page') ? 'jak-dobre-se-znate' : null;
    if (!game) return;
    let started = false, finished = false;
    const stage = document.getElementById('game-stage');
    new MutationObserver(() => {
      const active = document.body.classList.contains('game-active');
      if (active && !started) { started = true; finished = false; track('game_start', { game, mode: 'free' }); }
      if (!active) started = false;
      if (stage && !finished && stage.querySelector('.final-screen, .game-result')) { finished = true; track('game_complete', { game, mode: 'free' }); }
    }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    if (stage) new MutationObserver(() => {
      if (!finished && stage.querySelector('.final-screen, .game-result')) { finished = true; track('game_complete', { game, mode: 'free' }); }
    }).observe(stage, { childList: true, subtree: true });
  }

  window.CM = window.CM || {};
  window.CM.track = track;
  window.CM.consent = { open: showBar, state: () => state, enabled };

  const init = () => { watchFreeGame(); if (enabled && state === null) showBar(); if (enabled && state === 'granted') load(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();
