/* Odvážně 18+ — herní logika „Večer v kolech“.
   Pět typů kol: Přiznání, Radši, Nikdy jsem, Kdo z nás, Výzva.
   Nic se neskrývá a telefon se nepředává. Aplikace nic neposílá.
   Karty (data) jsou odděleně: ukázka v adult-preview.js, plná sada se načte po ověření přístupu. */
(() => {
  'use strict';
  const { storage, escapeHTML: E, shuffle } = window.CM;
  const app = document.getElementById('adult-app');
  if (!app) return;
  const mode = app.dataset.mode; // 'preview' | 'full'
  const cfg = window.CM_CONFIG || {};
  const track = (n, p) => window.CM.track && window.CM.track(n, p);
  const REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  const TYPES = {
    priznani: { kicker: 'PŘIZNÁNÍ', prefix: '', how: 'Odpověz nahlas a upřímně. Druhý poslouchá.', personal: true, main: 'Řečeno, další' },
    radsi: { kicker: 'RADŠI', prefix: '', how: (p, o) => `${p} si potichu vybere. ${o} hádá, co to bude. Pak ${p} prozradí volbu a proč.`, personal: true, guess: true },
    nikdy: { kicker: 'NIKDY JSEM…', prefix: 'Nikdy jsem ', how: (p, o) => `${o} tipne, jestli to ${p} někdy udělal/a. Pak ${p} řekne pravdu, a když ano, i příběh.`, personal: true, guess: true },
    kdo: { kicker: 'KDO Z NÁS…', prefix: 'Kdo z nás ', how: (p, o) => `${p} si v duchu odpoví. ${o} hádá, koho z vás ${p} označí. Pak se to vysvětlí.`, personal: true, guess: true },
    vyzva: { kicker: 'VÝZVA', prefix: '', how: 'Splň ji, nebo ji přeskoč. Nikdo tě nenutí.', personal: true, main: 'Splněno, další' }
  };
  const LEVELS = { 1: 'Lehce osobní', 2: 'Odvážné', 3: 'Velmi žhavé' };
  const PATTERN = ['priznani', 'radsi', 'nikdy', 'kdo', 'priznani', 'vyzva'];

  const AGE_KEY = 'crushmeter.adult.age';
  const SESSION_KEY = 'crushmeter.adult.session.' + mode;
  const USED_KEY = 'crushmeter.adult.used';
  const NAMES_KEY = 'crushmeter.adult.names';
  const lsGet = (k, f) => { try { const r = localStorage.getItem(k); return r === null ? f : JSON.parse(r); } catch { return f; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const lsDel = k => { try { localStorage.removeItem(k); } catch {} };

  let pool = [];          // všechny karty dostupné v tomto režimu
  let access = null;      // uložený přístup (jen plná hra)
  let s = null;           // rozehraná hra
  let timer = null;

  /* ---------- Pomocné ---------- */
  const byId = id => pool.find(c => c.id === id);
  const fmtDate = iso => new Date(iso).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' });
  const shopLink = (placement, label) => cfg.shopUrl
    ? `<a class="arcade-button a-buy" href="${E(cfg.shopUrl)}" target="_blank" rel="noopener" data-track="shop_click" data-track-placement="${E(placement)}">${label}</a>`
    : `<span class="a-soon" role="note">Objednávka se právě připravuje.</span>`;

  const REPORT=(game,lines)=>{const body='Hra: '+game+'\n'+lines.filter(Boolean).join('\n')+'\n\nCo je špatně:\n';return `<a class="report-link" href="mailto:info@tomys.cz?subject=${encodeURIComponent('CrushMeter: chyba ve hře '+game)}&body=${encodeURIComponent(body)}">Nahlásit chybu</a>`};
  function screen(html, focusSel) {
    clearInterval(timer);
    app.innerHTML = html;
    const el = app.querySelector(focusSel || '[data-focus]');
    if (el) el.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  const topbar = (right = '') => `<div class="a-top"><a class="a-brand" href="/" aria-label="CrushMeter — hlavní stránka">crushmeter<span>.</span></a><div class="a-top-right">${right}${window.CM_THEME ? window.CM_THEME.button() : ''}</div></div>`;

  /* ---------- Sestavení balíčku ---------- */
  function nearest(list, target) {
    if (!list.length) return null;
    const exact = list.filter(c => c.lvl === target);
    if (exact.length) return exact[0];
    const lower = list.filter(c => c.lvl < target).sort((a, b) => b.lvl - a.lvl);
    return (lower[0] || list.sort((a, b) => a.lvl - b.lvl)[0]);
  }

  /* Erotické karty jsou jen pro páry a jen na vyžádání: ero = 'bez' | 'mix' | 'jen'. */
  function fits(c, o) {
    const ero = o.aud === 'par' ? (o.ero || 'bez') : 'bez';
    if (c.ero) return ero !== 'bez' && c.aud === 'par' && c.lvl <= Math.max(o.max, 2);
    return ero !== 'jen' && (c.aud === 'oba' || c.aud === o.aud) && c.lvl <= o.max;
  }
  const hasEro = () => pool.some(c => c.ero);

  function buildDeck({ aud, max, rounds, ero }) {
    const used = new Set(lsGet(USED_KEY, []));
    let eligible = pool.filter(c => fits(c, { aud, max, ero }));
    let fresh = eligible.filter(c => !used.has(c.id));
    if (fresh.length < rounds) { fresh = eligible; lsDel(USED_KEY); }
    const bag = {};
    Object.keys(TYPES).forEach(t => { bag[t] = shuffle(fresh.filter(c => c.type === t)); });
    const deck = [];
    const take = (type, target) => {
      const pick = nearest(bag[type], target);
      if (!pick) return null;
      bag[type].splice(bag[type].indexOf(pick), 1);
      return pick;
    };
    for (let i = 0; i < rounds; i++) {
      const f = rounds > 1 ? i / (rounds - 1) : 1;
      const target = f >= 1 ? max : Math.min(max, Math.floor(f * max) + 1);
      let card = take(PATTERN[i % PATTERN.length], target);
      if (!card) {
        const others = Object.keys(TYPES).filter(t => bag[t].length).sort((a, b) => bag[b].length - bag[a].length);
        if (others.length) card = take(others[0], target);
      }
      if (card) deck.push(card.id);
    }
    return deck;
  }

  /* ---------- Obrazovky ---------- */
  function ageGate() {
    screen(`${topbar()}<section class="a-panel a-gate"><span class="a-sticker">18+</span><h1 data-focus tabindex="-1">Hra pro dospělé</h1><p>Obsahuje otevřené otázky o vztazích a intimitě. Je určená lidem od 18 let. Nikdo tě k ničemu nenutí a každou kartu můžeš přeskočit.</p><div class="a-actions"><button type="button" class="arcade-button" data-act="age-yes">Je mi 18 nebo víc</button><a class="text-button" href="/">Odejít</a></div></section>`);
  }

  function accessGate(message = '', tone = '') {
    const paid = /[?&]zaplaceno=1/.test(location.search);
    const lead = paid
      ? 'Platba dorazila, děkujeme! Zadej e-mail, který jsi použil/a při nákupu, a hra se odemkne.'
      : 'Zadej e-mail, který jsi použil/a při nákupu. Telefon si hru zapamatuje, takže to stačí udělat jednou.';
    const hint = paid ? '' : `<aside class="a-buyhint" aria-label="Ještě nemáte hru koupenou?"><p><strong>Ještě nemáte hru koupenou?</strong> Plná hra stojí 99 Kč na 12 měsíců, bez předplatného. Nejdřív si můžete zdarma zahrát 10 karet.</p><div class="a-buyhint-links"><a class="is-buy" href="/odvazne-18.html#cena" data-track="adult_buy_click" data-track-placement="play-gate">Koupit za 99 Kč</a><a href="/odvazne-18-ukazka.html" data-track="adult_preview_click" data-track-placement="play-gate">Zkusit zdarma</a><a href="/odvazne-18.html">Co hra obsahuje</a></div></aside>`;
    screen(`${topbar()}${hint}<section class="a-panel"><span class="a-sticker">18+</span><h1 data-focus tabindex="-1">Hrát plnou hru</h1><p>${lead} Žádné heslo není potřeba.</p><form id="access-form" class="a-form" novalidate><label for="access-email">E-mail z objednávky</label><input id="access-email" name="email" type="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" required placeholder="jmeno@email.cz"><button class="arcade-button" type="submit">Odemknout a hrát</button></form><p id="access-msg" class="a-msg ${tone}" role="status">${message}</p><p class="a-small">Hru můžete otevřít i na druhém telefonu, stačí tam zadat stejný e-mail. Potíže? Napište na <a href="mailto:info@tomys.cz">info@tomys.cz</a>.</p></section>`, '#access-email');
  }


  function expiredScreen(expires, inactive) {
    screen(`${topbar()}<section class="a-panel"><span class="a-sticker">18+</span><h1 data-focus tabindex="-1">${inactive ? 'Přístup už není aktivní' : 'Přístup vypršel'}</h1><p>${inactive ? 'Tahle objednávka už přístup neotevírá. Pokud si myslíš, že je to omyl, napiš na info@tomys.cz.' : `Přístup platil do ${E(fmtDate(expires))}. Nový rok si můžeš koupit jednorázově, bez předplatného.`}</p><div class="a-actions">${shopLink('expired', 'Koupit další rok za 99 Kč')}<button type="button" class="text-button" data-act="other-email">Zkusit jiný e-mail</button></div></section>`);
  }

  function setup() {
    const names = lsGet(NAMES_KEY, ['', '']);
    const full = mode === 'full';
    const saved = lsGet(SESSION_KEY, null);
    const resume = saved && saved.cards && saved.cards.every(id => byId(id)) && saved.i < saved.cards.length;
    const soon = full && access && Date.parse(access.expires) - Date.now() < 30 * 864e5;
    screen(`${topbar(full && access ? `<span class="a-badge">do ${E(fmtDate(access.expires))}</span>` : '')}
<section class="a-panel a-setup"><span class="a-sticker">18+</span><h1 data-focus tabindex="-1">${full ? 'Odvážně 18+' : 'Ukázka: 10 karet'}</h1>
<p class="a-lead">${full ? 'Nastavte si večer a hrajte. Každou kartu můžete přeskočit.' : 'Deset karet ze všech pěti typů kol. Plná hra jich má 234, z toho 84 erotických pro páry.'}</p>
${resume ? `<div class="a-resume"><div><strong>Rozehraná hra</strong><span>Kolo ${saved.i + 1} z ${saved.cards.length}</span></div><button type="button" class="arcade-button small" data-act="resume">Pokračovat</button></div>` : ''}
<form id="setup-form" class="a-form" novalidate>
<fieldset><legend>Kdo hraje</legend><div class="a-names"><input name="p1" maxlength="20" autocomplete="off" placeholder="Křestní jméno" aria-label="Jméno prvního hráče" value="${E(names[0] || '')}"><input name="p2" maxlength="20" autocomplete="off" placeholder="Křestní jméno" aria-label="Jméno druhého hráče" value="${E(names[1] || '')}"></div></fieldset>
${full ? `<fieldset><legend>Jste</legend><div class="a-choice"><label><input type="radio" name="aud" value="par" checked><span>Pár</span></label><label><input type="radio" name="aud" value="kamaradi"><span>Kamarádi</span></label></div></fieldset>
${hasEro() ? `<fieldset class="a-ero-set" id="ero-set"><legend>Erotické karty <small>jen pro páry</small></legend><div class="a-choice a-choice-3"><label><input type="radio" name="ero" value="bez" checked><span>Bez nich</span></label><label><input type="radio" name="ero" value="mix"><span>Přimíchat</span></label><label><input type="radio" name="ero" value="jen"><span>Jen erotika</span></label></div><p class="a-hint">Zapněte je, jen když jste pro oba. Nejpřímější karty přijdou jen při intenzitě Velmi žhavé.</p></fieldset>` : ''}
<fieldset><legend>Nejvyšší intenzita</legend><div class="a-choice a-choice-3"><label><input type="radio" name="max" value="1"><span>Lehce osobní</span></label><label><input type="radio" name="max" value="2" checked><span>Odvážné</span></label><label><input type="radio" name="max" value="3"><span>Velmi žhavé</span></label></div><p class="a-hint">Hra začíná jemně a postupně stoupá až k vybrané hranici.</p></fieldset>
<fieldset><legend>Délka</legend><div class="a-choice a-choice-3"><label><input type="radio" name="rounds" value="10"><span>10 kol<small>asi 15 min</small></span></label><label><input type="radio" name="rounds" value="20" checked><span>20 kol<small>asi 30 min</small></span></label><label><input type="radio" name="rounds" value="30"><span>30 kol<small>asi 45 min</small></span></label></div></fieldset>` : ''}
<button class="arcade-button" type="submit">${full ? 'Jdeme na to' : 'Spustit ukázku'}</button></form>
${soon ? `<p class="a-notice">Přístup brzy vyprší. Nákup před vypršením prodlouží platnost od původního data. ${shopLink('expiring', 'Prodloužit o rok')}</p>` : ''}
${full && access ? `<p class="a-small"><button type="button" class="text-button" data-act="logout">Odhlásit tento telefon</button></p>` : ''}</section>`);
  }

  function cardScreen() {
    const id = s.cards[s.i];
    const card = byId(id);
    const meta = TYPES[card.type];
    const total = s.cards.length;
    const player = meta.personal ? s.players[s.t % 2] : null;
    const other = meta.personal ? s.players[(s.t + 1) % 2] : null;
    const how = typeof meta.how === 'function' ? meta.how(E(player), E(other)) : meta.how;
    const body = card.type === 'radsi'
      ? `<p class="a-prefix">Radši…</p><div class="a-ab"><div><b>A</b><span>${E(card.a)}</span></div><div class="a-or" aria-hidden="true">nebo</div><div><b>B</b><span>${E(card.b)}</span></div></div>`
      : `${meta.prefix ? `<p class="a-prefix">${E(meta.prefix.trim())}</p>` : ''}<h2 class="a-text" data-focus tabindex="-1">${E(card.text)}</h2>`;
    const lvl = [1, 2, 3].map(n => `<i class="${n <= card.lvl ? '' : 'off'}"></i>`).join('');
    screen(`${topbar('<button type="button" class="pause-button" data-act="menu" aria-label="Pozastavit hru"><span class="pause-bars" aria-hidden="true"></span> Pauza</button>')}
<div class="a-progress" role="progressbar" aria-valuemin="1" aria-valuemax="${total}" aria-valuenow="${s.i + 1}" aria-label="Postup hry"><span style="width:${((s.i + 1) / total) * 100}%"></span></div>
<p class="a-count">Kolo ${s.i + 1} z ${total}</p>
<article class="a-card t-${card.type}" id="a-card">
<div class="a-card-top"><span class="a-type">${meta.kicker}</span>${card.ero ? '<span class="a-ero">Erotika</span>' : ''}<span class="a-lvl" role="img" aria-label="Intenzita: ${LEVELS[card.lvl]}">${lvl}</span></div>
<p class="a-who">${meta.guess ? `Odpovídá <b>${E(player)}</b>, hádá <b>${E(other)}</b>` : player ? `Na řadě: <b>${E(player)}</b>` : 'Hrajete oba'}</p>
${body}
<p class="a-how">${how}</p>
</article>
<div class="a-actions">${meta.guess ? `<div class="a-guess"><button type="button" class="arcade-button a-main" data-act="hit" id="a-main">${E(other)} uhádl/a</button><button type="button" class="arcade-button is-ghost" data-act="miss">Neuhádl/a</button></div>` : `<button type="button" class="arcade-button a-main" data-act="next" id="a-main">${meta.main}</button>`}<button type="button" class="text-button" data-act="skip">Přeskočit kartu</button></div>
<p class="report-row">${REPORT('Odvážně 18+',['Karta: '+card.id,card.type==='radsi'?'Radši: '+card.a+' / '+card.b:'Text: '+card.text])}</p>`, card.type === 'radsi' ? '#a-main' : '[data-focus]');
  }

  function endScreen() {
    lsDel(SESSION_KEY);
    const played = s.cards.length - (s.dropped || 0);
    const sc = s.score || [0, 0];
    const guessed = sc[0] + sc[1] > 0 || s.guesses;
    const verdict = sc[0] === sc[1] ? 'Znáte se navzájem stejně dobře.' : `Líp odhaduje ${E(s.players[sc[0] > sc[1] ? 0 : 1])}.`;
    const scoreHtml = guessed ? `<div class="a-score" aria-label="Uhádnuté odpovědi"><div><span>${E(s.players[0])}</span><b>${sc[0]}</b></div><div><span>${E(s.players[1])}</span><b>${sc[1]}</b></div></div><p class="a-verdict">${verdict}</p>` : '';
    track(mode === 'full' ? 'paid_game_complete' : 'adult_preview_complete', { game: 'odvazne-18', mode, rounds: s.cards.length, skipped: s.skipped });
    const offer = mode === 'preview'
      ? `<section class="a-offer" id="a-offer"><span class="a-sticker">18+</span><h2>Chcete dál?</h2><p>Plná hra má 234 karet v pěti typech kol, z toho 84 erotických pro páry. Pár nebo kamarádi, intenzitu si nastavíte. Přístup na 12 měsíců za 99 Kč, jednorázově, bez předplatného.</p><div class="a-actions">${shopLink('preview-end', 'Koupit za 99 Kč')}<a class="text-button" href="/odvazne-18.html" data-track="adult_offer_click" data-track-placement="preview-end">Co hra obsahuje</a><a class="text-button" href="/odvazne-18-hrat.html">Už mám přístup</a></div></section>`
      : '';
    screen(`${topbar()}<section class="a-panel a-end"><span class="a-sticker">18+</span><h1 data-focus tabindex="-1">${mode === 'full' ? 'To byl večer.' : 'To byla ochutnávka.'}</h1><p class="a-lead">Odehráno ${played} ${played === 1 ? 'kolo' : played >= 2 && played <= 4 ? 'kola' : 'kol'}${s.skipped ? `, přeskočeno ${s.skipped}` : ''}.</p>${scoreHtml}${offer}<aside class="promo is-tarot" data-partner-slot><span class="promo-mark" aria-hidden="true">✦</span><div><small>Něco jiného</small><strong>Co vám karty řeknou o vás dvou?</strong><p>Virtuální kartářka vám vytáhne karty a odpoví česky.</p><a href="https://virtualnikartarka.cz/?utm_source=crushmeter&amp;utm_medium=referral&amp;utm_campaign=konec_hry_18" target="_blank" rel="noopener" data-track="click_virtualni_kartarka" data-track-placement="adult-end">Vytáhnout karty →</a></div></aside><div class="a-actions"><button type="button" class="arcade-button" data-act="again">Zahrát znovu</button><a class="text-button" href="/">Zpět na hry</a></div></section>`);
    if (mode === 'preview') track('adult_offer_view', { game: 'odvazne-18', placement: 'preview-end' });
    s = null;
  }

  /* ---------- Akce ---------- */
  function startGame(opts) {
    const names = [opts.p1 || 'Hráč 1', opts.p2 || 'Hráč 2'];
    lsSet(NAMES_KEY, [opts.p1 || '', opts.p2 || '']);
    const cards = mode === 'preview' ? pool.map(c => c.id) : buildDeck({ aud: opts.aud, max: opts.max, rounds: opts.rounds, ero: opts.ero });
    if (!cards.length) { accessGate('Pro toto nastavení se nenašly karty. Zkus vyšší intenzitu.', 'bad'); return; }
    s = { players: names, cards, i: 0, t: Math.random() < 0.5 ? 0 : 1, skipped: 0, score: [0, 0], guesses: 0, aud: opts.aud || 'oba', max: opts.max || 3, ero: opts.ero || 'bez' };
    lsSet(SESSION_KEY, s);
    track(mode === 'full' ? 'paid_game_start' : 'adult_preview_start', { game: 'odvazne-18', mode, rounds: cards.length, level: s.max, audience: s.aud });
    cardScreen();
  }

  function markUsed(id) { if (mode !== 'full') return; const u = lsGet(USED_KEY, []); u.push(id); lsSet(USED_KEY, u.slice(-400)); }

  function advance() {
    const card = byId(s.cards[s.i]);
    markUsed(card.id);
    if (TYPES[card.type].personal) s.t += 1;
    s.i += 1;
    if (s.i >= s.cards.length) return endScreen();
    lsSet(SESSION_KEY, s);
    cardScreen();
  }

  function skip() {
    const card = byId(s.cards[s.i]);
    markUsed(card.id);
    s.skipped += 1;
    if (TYPES[card.type].personal) s.t += 1;
    if (mode === 'full') {
      const inDeck = new Set(s.cards);
      const used = new Set(lsGet(USED_KEY, []));
      const ok = c => !inDeck.has(c.id) && !used.has(c.id) && fits(c, s);
      const sameType = shuffle(pool.filter(c => ok(c) && c.type === card.type));
      const repl = nearest(sameType, card.lvl) || nearest(shuffle(pool.filter(ok)), card.lvl);
      if (repl) { s.cards[s.i] = repl.id; lsSet(SESSION_KEY, s); return cardScreen(); }
    }
    s.dropped = (s.dropped || 0) + 1;
    s.i += 1;
    if (s.i >= s.cards.length) return endScreen();
    lsSet(SESSION_KEY, s);
    cardScreen();
  }



  function formValues(form) {
    const f = new FormData(form);
    return { p1: String(f.get('p1') || '').trim(), p2: String(f.get('p2') || '').trim(), aud: f.get('aud') || 'oba', max: Number(f.get('max') || 3), rounds: Number(f.get('rounds') || 10), ero: f.get('aud') === 'par' ? String(f.get('ero') || 'bez') : 'bez' };
  }

  app.addEventListener('click', async e => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act;
    if (act === 'age-yes') { lsSet(AGE_KEY, new Date().toISOString().slice(0, 10)); return boot(); }
    if (act === 'resume') { s = lsGet(SESSION_KEY, null); if (s) return cardScreen(); }
    if (act === 'hit' || act === 'miss') { if (!s.score) s.score = [0, 0]; s.guesses = (s.guesses || 0) + 1; if (act === 'hit') s.score[(s.t + 1) % 2] += 1; return advance(); }
    if (act === 'next') return advance();
    if (act === 'skip') return skip();
    if (act === 'menu') { clearInterval(timer); lsSet(SESSION_KEY, s); return setup(); }
    if (act === 'again') return setup();
    if (act === 'logout') { window.CM.access.clear(); lsDel(SESSION_KEY); access = null; return boot(); }
    if (act === 'other-email') return accessGate();
  });

  document.addEventListener('change', e => { if (e.target.name === 'aud') { const f = document.getElementById('ero-set'); if (f) f.hidden = e.target.value !== 'par'; } });
  app.addEventListener('submit', async e => {
    e.preventDefault();
    if (e.target.id === 'setup-form') { lsDel(SESSION_KEY); return startGame(formValues(e.target)); }
    if (e.target.id === 'access-form') {
      const msg = document.getElementById('access-msg');
      const btn = e.target.querySelector('button');
      btn.disabled = true; msg.className = 'a-msg'; msg.textContent = 'Ověřuji…';
      const res = await window.CM.access.login(e.target.elements.email.value);
      btn.disabled = false;
      if (res.status === 'active') { access = { expires: res.expires, pack: res.pack }; pool = res.pack.cards; return setup(); }
      if (res.status === 'expired') return expiredScreen(res.expires, false);
      if (res.status === 'inactive') return expiredScreen(res.expires, true);
      const texts = {
        invalid: 'Zkontroluj e-mail. Vypadá neúplně.',
        throttled: 'Příliš mnoho pokusů. Zkus to za deset minut.',
        unknown: 'Tenhle e-mail mezi zaplacenými objednávkami nevidíme. Použij e-mail z objednávky. Pokud jsi platil/a převodem, hra se odemkne po připsání platby, obvykle do 1–2 pracovních dnů.',
        network: 'Nepodařilo se spojit. Zkontroluj připojení a zkus to znovu.',
        error: 'Ověření se nepovedlo. Zkus to za chvíli, případně napiš na info@tomys.cz.',
        unconfigured: 'Plná hra se právě připravuje. Zkus to prosím později.'
      };
      msg.className = 'a-msg bad'; msg.textContent = texts[res.status] || texts.error;
    }
  });

  /* ---------- Start ---------- */
  async function boot() {
    if (!lsGet(AGE_KEY, null)) return ageGate();
    if (mode === 'preview') { pool = window.CM_ADULT_PREVIEW || []; return setup(); }
    app.innerHTML = '<p class="a-loading" role="status">Načítám…</p>';
    const res = await window.CM.access.refresh();
    if (res.status === 'active') { access = res.record; pool = access.pack.cards; return setup(); }
    if (res.status === 'expired') return expiredScreen(res.expires, false);
    if (res.status === 'inactive') return expiredScreen(res.expires, true);
    return accessGate();
  }

  if (mode === 'preview') track('adult_preview_open', { game: 'odvazne-18', mode: 'preview' });
  else track('paid_page_open', { game: 'odvazne-18', mode: 'full' });
  boot();
})();
