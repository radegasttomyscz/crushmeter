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
    vyzva: { kicker: 'VÝZVA', prefix: '', how: 'Splň ji, nebo ji přeskoč. Nikdo tě nenutí.', personal: true, main: 'Splněno, další' },
    casovac: { kicker: 'NA ČAS', prefix: '', how: (p, o) => `Spusť odpočet. ${o} hlídá, jestli to ${p} dodrží.`, personal: true, timer: true, main: 'Splněno, další' },
    sazka: { kicker: 'SÁZKA', prefix: '', how: (p, o) => `${o} nahlas tipne, co odpoví ${p}. Pak ${p} řekne pravdu. Netrefa znamená trest pro ${o}.`, personal: true, guess: true, bet: true },
    tajny: { kicker: 'TAJNÝ ÚKOL', prefix: '', personal: true, secret: true },
    reveal: { kicker: 'ODHALENÍ', prefix: '' },
    ruleta: { kicker: 'RULETA', prefix: '', how: (p, o) => `${o} se nehýbe a nereaguje. Když se pohne, bere trest.`, personal: true, timer: true, ruleta: true, main: 'Splněno, další' }
  };
  const PENALTY = { obleceni: 'Odlož jeden kus oblečení. Který, vybírá druhý.', panak: 'Napij se. Pořádně, ne jen smočit rty.', pusa: 'Dej druhému pusu tam, kam si řekne.', prani: 'Splň druhému jedno přání do konce večera.' };
  const PATTERN_LOZ = ['priznani', 'casovac', 'sazka', 'vyzva', 'ruleta', 'priznani', 'tajny', 'casovac', 'vyzva', 'sazka', 'ruleta', 'vyzva'];
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
  const byId = id => {
    if (typeof id === 'string' && id.startsWith('reveal:')) { const sec = s && s.secrets && s.secrets[+id.slice(7)]; return sec ? { id, type: 'reveal', lvl: sec.lvl, text: sec.text, sec } : null; }
    return pool.find(c => c.id === id);
  };
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
    if ((c.mode || 'klasika') !== (o.mode || 'klasika')) return false;
    if (c.mode) return true;
    const ero = o.aud === 'par' ? (o.ero || 'bez') : 'bez';
    if (c.ero) return ero !== 'bez' && c.aud === 'par' && c.lvl <= Math.max(o.max, 2);
    return ero !== 'jen' && (c.aud === 'oba' || c.aud === o.aud) && c.lvl <= o.max;
  }
  const hasEro = () => pool.some(c => c.ero);

  function buildLoz(rounds) {
    const used = new Set(lsGet(USED_KEY, []));
    let eligible = pool.filter(c => c.mode === 'loznice');
    let fresh = eligible.filter(c => !used.has(c.id));
    if (fresh.length < rounds) fresh = eligible;
    const bag = {};
    PATTERN_LOZ.forEach(t => { bag[t] = shuffle(fresh.filter(c => c.type === t)); });
    const deck = []; let secrets = 0;
    for (let i = 0; i < rounds; i++) {
      const target = Math.min(3, Math.floor((i / Math.max(rounds, 1)) * 3) + 1);
      let type = PATTERN_LOZ[i % PATTERN_LOZ.length];
      if (type === 'tajny' && (secrets >= 2 || i > rounds - 4)) type = 'vyzva';
      let pick = nearest(bag[type] || [], target);
      if (!pick) { const t = Object.keys(bag).filter(k => k !== 'tajny' && bag[k].length).sort((a, b) => bag[b].length - bag[a].length)[0]; if (t) pick = nearest(bag[t], target); }
      if (!pick) break;
      bag[pick.type].splice(bag[pick.type].indexOf(pick), 1);
      if (pick.type === 'tajny') secrets++;
      deck.push(pick.id);
    }
    return deck;
  }
  const hasLoz = () => pool.some(c => c.mode === 'loznice');
  const RUL = () => (access && access.pack && access.pack.ruleta) || null;
  const pickOne = list => list[Math.floor(Math.random() * list.length)];
  function rollRuleta(lvl) {
    const r = RUL(); if (!r) return { part: 'krk', way: 'jen rty', sec: 45 };
    const parts = [].concat(...[1, 2, 3].filter(n => n <= lvl).map(n => (r.parts[n] || []))).filter(Boolean);
    const top = r.parts[lvl] || parts;
    return { part: pickOne(Math.random() < 0.7 ? top : parts), way: pickOne(r.ways), sec: pickOne(r.secs) };
  }

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

  const ICON = {
    loznice: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 54c-9-7-22-15-22-28a12 12 0 0 1 22-7 12 12 0 0 1 22 7c0 13-13 21-22 28z" fill="currentColor" opacity=".18"/><path d="M8 33c6-6 14-9 24-4 10-5 18-2 24 4-7 9-15 13-24 13S15 42 8 33z" fill="currentColor"/><path d="M8 33c9 3 16 3 24 0 8 3 15 3 24 0" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="2.4" stroke-linecap="round"/></svg>',
    klasika: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M8 14h30a6 6 0 0 1 6 6v14a6 6 0 0 1-6 6H22l-9 8v-8H8a6 6 0 0 1-6-6V20a6 6 0 0 1 6-6z" fill="currentColor" opacity=".9"/><path d="M28 26h28a6 6 0 0 1 6 6v12a6 6 0 0 1-6 6h-3v8l-9-8H28a6 6 0 0 1-6-6V32a6 6 0 0 1 6-6z" fill="currentColor" opacity=".45"/><circle cx="15" cy="27" r="2.6" fill="rgba(0,0,0,.4)"/><circle cx="23" cy="27" r="2.6" fill="rgba(0,0,0,.4)"/><circle cx="31" cy="27" r="2.6" fill="rgba(0,0,0,.4)"/></svg>',
    obleceni: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M11 4l5 3 5-3 7 5-3 5-3-2v16H10V12l-3 2-3-5z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></svg>',
    panak: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M8 5h16l-2 21a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M9.5 13h13l-1 12H10.5z" fill="currentColor" opacity=".45"/></svg>',
    pusa: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M3 16c3-4 8-6 13-3 5-3 10-1 13 3-4 6-8 8-13 8s-9-2-13-8z" fill="currentColor"/><path d="M3 16c5 2 9 2 13 0 4 2 8 2 13 0" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="1.8" stroke-linecap="round"/></svg>',
    prani: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3l3.6 8 8.4.8-6.4 5.6 2 8.6L16 21.6 8.4 26l2-8.6L4 11.8l8.4-.8z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></svg>'
  };
  let pick = null;
  function modeScreen() {
    const saved = lsGet(SESSION_KEY, null);
    const resume = saved && saved.cards && saved.cards.every(id => byId(id)) && saved.i < saved.cards.length;
    const soon = access && Date.parse(access.expires) - Date.now() < 30 * 864e5;
    const loz = pool.filter(c => c.mode === 'loznice').length;
    const cls = pool.filter(c => !c.mode).length;
    screen(`${topbar(access ? `<span class="a-badge">do ${E(fmtDate(access.expires))}</span>` : '')}
<section class="a-modes"><h1 data-focus tabindex="-1">Jak dnes hrajete?</h1>
${resume ? `<div class="a-resume"><div><strong>Rozehraná hra</strong><span>Kolo ${saved.i + 1} z ${saved.cards.length}</span></div><div class="a-resume-actions"><button type="button" class="arcade-button small" data-act="resume">Pokračovat</button><button type="button" class="a-reset" data-act="reset">Začít znovu</button></div></div>` : ''}
<button type="button" class="a-mode is-loznice" data-act="pick" data-mode="loznice"><span class="a-mode-art">${ICON.loznice}</span><span class="a-mode-new">Novinka</span><span class="a-mode-body"><strong>Ložnice</strong><span class="a-mode-desc">Jen pro vás dva. Tresty za odmítnutí, ruleta doteků, tajné úkoly a odpočet. Každých pár kol to přitvrdí.</span><span class="a-mode-tags"><span>Pro páry</span><span>${loz} karet</span><span>Bez cenzury, bez vulgarit</span></span></span><span class="a-mode-go" aria-hidden="true">Hrát</span></button>
<button type="button" class="a-mode is-klasika" data-act="pick" data-mode="klasika"><span class="a-mode-art">${ICON.klasika}</span><span class="a-mode-body"><strong>Klasika</strong><span class="a-mode-desc">Přiznání, volby, hádání a výzvy. Hodí se na rande i mezi kamarády. Intenzitu si nastavíte sami.</span><span class="a-mode-tags"><span>Páry i kamarádi</span><span>${cls} karet</span><span>Od jemných po žhavé</span></span></span><span class="a-mode-go" aria-hidden="true">Hrát</span></button>
${soon ? `<p class="a-notice">Přístup brzy vyprší. Nákup před vypršením prodlouží platnost od původního data. ${shopLink('expiring', 'Prodloužit o rok')}</p>` : ''}
${lsGet(USED_KEY, []).length ? `<p class="a-small">Odehrané karty se hned neopakují. <button type="button" class="text-button" data-act="reset-used">Zamíchat znovu všechny karty</button></p>` : ''}
${access ? `<p class="a-small"><button type="button" class="text-button" data-act="logout">Odhlásit tento telefon</button></p>` : ''}</section>`);
  }

  function setup() {
    const names = lsGet(NAMES_KEY, ['', '']);
    const full = mode === 'full';
    if (full && hasLoz() && !pick) return modeScreen();
    const gm = full && hasLoz() ? pick : 'klasika';
    const isLoz = gm === 'loznice';
    const saved = lsGet(SESSION_KEY, null);
    const resume = !(full && hasLoz()) && saved && saved.cards && saved.cards.every(id => byId(id)) && saved.i < saved.cards.length;
    const soon = !(full && hasLoz()) && full && access && Date.parse(access.expires) - Date.now() < 30 * 864e5;
    const head = full && hasLoz()
      ? `<div class="a-mode-head is-${gm}"><span class="a-mode-art">${ICON[gm]}</span><div><small>Režim</small><strong>${isLoz ? 'Ložnice' : 'Klasika'}</strong></div><button type="button" class="a-mode-change" data-act="pick-back">Změnit</button></div>`
      : `<span class="a-sticker">18+</span><h1 data-focus tabindex="-1">${full ? 'Odvážně 18+' : 'Ukázka: 10 karet'}</h1><p class="a-lead">${full ? 'Nastavte si večer a hrajte.' : 'Deset karet ze všech pěti typů kol. Plná hra jich má 234, z toho 84 erotických pro páry.'}</p>`;
    const pen = (v, label, on) => `<label><input type="radio" name="pen" value="${v}"${on ? ' checked' : ''}><span class="a-pen-opt">${ICON[v]}<b>${label}</b></span></label>`;
    screen(`${topbar(full && access ? `<span class="a-badge">do ${E(fmtDate(access.expires))}</span>` : '')}
<section class="a-panel a-setup">${head}
${resume ? `<div class="a-resume"><div><strong>Rozehraná hra</strong><span>Kolo ${saved.i + 1} z ${saved.cards.length}</span></div><div class="a-resume-actions"><button type="button" class="arcade-button small" data-act="resume">Pokračovat</button><button type="button" class="a-reset" data-act="reset">Začít znovu</button></div></div>` : ''}
<form id="setup-form" class="a-form" novalidate>
${full && hasLoz() ? `<input type="hidden" name="mode" value="${gm}">` : ''}
<fieldset><legend>Kdo hraje</legend><div class="a-names"><input name="p1" maxlength="20" autocomplete="off" placeholder="Křestní jméno" aria-label="Jméno prvního hráče" value="${E(names[0] || '')}"><input name="p2" maxlength="20" autocomplete="off" placeholder="Křestní jméno" aria-label="Jméno druhého hráče" value="${E(names[1] || '')}"></div></fieldset>
${isLoz ? `<fieldset><legend>Trest za odmítnutí</legend><div class="a-choice a-choice-2x2 a-pens">${pen('obleceni', 'Kus oblečení', true)}${pen('panak', 'Napít se')}${pen('pusa', 'Pusa, kam si druhý řekne')}${pen('prani', 'Splnit přání')}</div><p class="a-hint">Kartu jde odmítnout, ale stojí to trest.</p></fieldset>` : ''}
${full && !isLoz ? `<fieldset><legend>Jste</legend><div class="a-choice"><label><input type="radio" name="aud" value="par" checked><span>Pár</span></label><label><input type="radio" name="aud" value="kamaradi"><span>Kamarádi</span></label></div></fieldset>
${hasEro() ? `<fieldset class="a-ero-set" id="ero-set"><legend>Erotické karty <small>jen pro páry</small></legend><div class="a-choice a-choice-3"><label><input type="radio" name="ero" value="bez" checked><span>Bez nich</span></label><label><input type="radio" name="ero" value="mix"><span>Přimíchat</span></label><label><input type="radio" name="ero" value="jen"><span>Jen erotika</span></label></div><p class="a-hint">Zapněte je, jen když jste pro oba. Nejpřímější karty přijdou jen při intenzitě Velmi žhavé.</p></fieldset>` : ''}
<fieldset><legend>Nejvyšší intenzita</legend><div class="a-choice a-choice-3"><label><input type="radio" name="max" value="1"><span>Lehce osobní</span></label><label><input type="radio" name="max" value="2" checked><span>Odvážné</span></label><label><input type="radio" name="max" value="3"><span>Velmi žhavé</span></label></div><p class="a-hint">Hra začíná jemně a postupně stoupá až k vybrané hranici.</p></fieldset>` : ''}
${full ? `<fieldset><legend>Délka</legend><div class="a-choice a-choice-3"><label><input type="radio" name="rounds" value="10"><span>10 kol<small>asi 15 min</small></span></label><label><input type="radio" name="rounds" value="20" checked><span>20 kol<small>asi 30 min</small></span></label><label><input type="radio" name="rounds" value="30"><span>30 kol<small>asi 45 min</small></span></label></div></fieldset>` : ''}
<button class="arcade-button" type="submit">${full ? 'Jdeme na to' : 'Spustit ukázku'}</button></form>
${soon ? `<p class="a-notice">Přístup brzy vyprší. Nákup před vypršením prodlouží platnost od původního data. ${shopLink('expiring', 'Prodloužit o rok')}</p>` : ''}
${full && !hasLoz() && lsGet(USED_KEY, []).length ? `<p class="a-small">Odehrané karty se hned neopakují. <button type="button" class="text-button" data-act="reset-used">Zamíchat znovu všechny karty</button></p>` : ''}
${full && !hasLoz() && access ? `<p class="a-small"><button type="button" class="text-button" data-act="logout">Odhlásit tento telefon</button></p>` : ''}</section>`);
  }


  function cardScreen() {
    const id = s.cards[s.i];
    const card = byId(id);
    const meta = TYPES[card.type];
    const total = s.cards.length;
    const player = meta.personal ? s.players[s.t % 2] : null;
    const other = meta.personal ? s.players[(s.t + 1) % 2] : null;
    const how = typeof meta.how === 'function' ? meta.how(E(player), E(other)) : meta.how;
    const loz = s.mode === 'loznice';
    if (meta.ruleta && !(s.roll && s.roll[s.i])) { s.roll = s.roll || {}; s.roll[s.i] = rollRuleta(card.lvl); lsSet(SESSION_KEY, s); }
    const roll = meta.ruleta ? s.roll[s.i] : null;
    const secs = roll ? roll.sec : card.sec;
    const body = card.type === 'reveal'
      ? `<p class="a-prefix">Odhalení</p><h2 class="a-text" data-focus tabindex="-1">${E(s.players[card.sec.p])} měl/a tajný úkol. ${E(s.players[1 - card.sec.p])}, víš jaký?</h2><div class="a-secret" id="a-secret" hidden><small>Úkol byl</small><p>${E(card.text)}</p></div>`
      : meta.secret
      ? `<h2 class="a-text" data-focus tabindex="-1">Tajný úkol</h2><p class="a-how">${E(other)}, teď se nedívej. ${E(player)} si úkol přečte a schová.</p><div class="a-secret" id="a-secret" hidden><small>Jen pro tebe</small><p>${E(card.text)}</p><span>Za pár kol přijde odhalení. Když ${E(other)} uhádne, co to bylo, bereš trest.</span></div>`
      : meta.ruleta
      ? `<h2 class="a-text" data-focus tabindex="-1">${E(player)} → ${E(other)}</h2><dl class="a-roll"><div><dt>Kde</dt><dd>${E(roll.part)}</dd></div><div><dt>Čím</dt><dd>${E(roll.way)}</dd></div><div><dt>Jak dlouho</dt><dd>${roll.sec} s</dd></div></dl>`
      : card.type === 'radsi'
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
${how && !meta.secret && card.type !== 'reveal' ? `<p class="a-how">${how}</p>` : ''}
${meta.timer ? `<div class="a-timer" id="a-timer" data-sec="${secs}" aria-live="polite"><b>${secs}</b><span>sekund</span></div>` : ''}
</article>
<div class="a-actions">${card.type === 'reveal'
  ? `<div class="a-guess"><button type="button" class="arcade-button a-main" data-act="rev-hit" id="a-main">${E(s.players[1 - card.sec.p])} uhádl/a</button><button type="button" class="arcade-button is-ghost" data-act="rev-miss">Neuhádl/a</button></div>`
  : meta.secret ? `<button type="button" class="arcade-button a-main" data-act="secret-show" id="a-main">Ukázat úkol</button>`
  : meta.timer ? `<button type="button" class="arcade-button a-main" data-act="timer" id="a-main">Spustit ${secs} s</button>`
  : meta.guess ? `<div class="a-guess"><button type="button" class="arcade-button a-main" data-act="hit" id="a-main">${E(other)} uhádl/a</button><button type="button" class="arcade-button is-ghost" data-act="miss">Neuhádl/a</button></div>` : `<button type="button" class="arcade-button a-main" data-act="next" id="a-main">${meta.main}</button>`}${card.type === 'reveal' ? '' : `<button type="button" class="text-button" data-act="${loz ? 'penalty' : 'skip'}">${loz ? `Nechci, beru trest` : 'Přeskočit kartu'}</button>`}<button type="button" class="text-button a-quit" data-act="quit">Ukončit hru</button></div>
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
    screen(`${topbar()}<section class="a-panel a-end"><span class="a-sticker">18+</span><h1 data-focus tabindex="-1">${mode === 'full' ? 'To byl večer.' : 'To byla ochutnávka.'}</h1><p class="a-lead">Odehráno ${played} ${played === 1 ? 'kolo' : played >= 2 && played <= 4 ? 'kola' : 'kol'}${s.skipped ? `, přeskočeno ${s.skipped}` : ''}${s.penalties ? `, trestů ${s.penalties}` : ''}.</p>${scoreHtml}${offer}${mode === 'full' ? '' : `<aside class="promo is-tarot" data-partner-slot><span class="promo-mark" aria-hidden="true">✦</span><div><small>Něco jiného</small><strong>Co vám karty řeknou o vás dvou?</strong><p>Virtuální kartářka vám vytáhne karty a odpoví česky.</p><a href="https://virtualnikartarka.cz/?utm_source=crushmeter&amp;utm_medium=referral&amp;utm_campaign=konec_hry_18" target="_blank" rel="noopener" data-track="click_virtualni_kartarka" data-track-placement="adult-end">Vytáhnout karty →</a></div></aside>`}<div class="a-actions"><button type="button" class="arcade-button" data-act="again">Zahrát znovu</button><a class="text-button" href="/">Zpět na hry</a></div></section>`);
    if (mode === 'preview') track('adult_offer_view', { game: 'odvazne-18', placement: 'preview-end' });
    s = null;
  }

  /* ---------- Akce ---------- */
  function startGame(opts) {
    const names = [opts.p1 || 'Hráč 1', opts.p2 || 'Hráč 2'];
    lsSet(NAMES_KEY, [opts.p1 || '', opts.p2 || '']);
    const loz = mode === 'full' && opts.gmode === 'loznice' && hasLoz();
    const cards = mode === 'preview' ? pool.map(c => c.id) : loz ? buildLoz(opts.rounds) : buildDeck({ aud: opts.aud, max: opts.max, rounds: opts.rounds, ero: opts.ero });
    if (!cards.length) { accessGate('Pro toto nastavení se nenašly karty. Zkus vyšší intenzitu.', 'bad'); return; }
    s = { players: names, cards, i: 0, t: Math.random() < 0.5 ? 0 : 1, skipped: 0, score: [0, 0], guesses: 0, aud: opts.aud || 'oba', max: opts.max || 3, ero: opts.ero || 'bez', mode: loz ? 'loznice' : 'klasika', pen: opts.pen || 'obleceni', secrets: [], roll: {}, penalties: 0 };
    lsSet(SESSION_KEY, s);
    track(mode === 'full' ? 'paid_game_start' : 'adult_preview_start', { game: 'odvazne-18', mode, rounds: cards.length, level: s.max, audience: s.aud });
    cardScreen();
  }

  function penaltyScreen(who, why) {
    const name = s.players[who];
    const txt = PENALTY[s.pen] || PENALTY.obleceni;
    screen(`${topbar()}<section class="a-panel a-penalty"><span class="a-sticker">Trest</span><h1 data-focus tabindex="-1">${E(name)}</h1><p class="a-lead">${E(why)}</p><p class="a-pen-text">${E(txt)}</p><div class="a-actions"><button type="button" class="arcade-button" data-act="pen-done">Hotovo, hrajeme dál</button></div></section>`);
  }
  function runTimer() {
    const box = document.getElementById('a-timer'); const btn = document.getElementById('a-main');
    if (!box || !btn) return;
    let n = +box.dataset.sec; btn.disabled = true; btn.textContent = 'Běží…'; box.classList.add('is-run');
    clearInterval(timer);
    timer = setInterval(() => {
      n -= 1; box.querySelector('b').textContent = Math.max(n, 0);
      if (n <= 0) {
        clearInterval(timer); box.classList.remove('is-run'); box.classList.add('is-done'); box.querySelector('span').textContent = 'Čas!';
        try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch {}
        btn.disabled = false; btn.textContent = 'Splněno, další'; btn.dataset.act = 'next'; btn.focus({ preventScroll: true });
      }
    }, 1000);
  }
  function scheduleSecret(card) {
    s.secrets = s.secrets || [];
    s.secrets.push({ p: s.t % 2, text: card.text, lvl: card.lvl });
    const at = Math.min(s.i + 4, s.cards.length);
    s.cards.splice(at, 0, 'reveal:' + (s.secrets.length - 1));
  }

  function markUsed(id) { if (mode !== 'full' || String(id).startsWith('reveal:')) return; const u = lsGet(USED_KEY, []); u.push(id); lsSet(USED_KEY, u.slice(-400)); }

  function advance() {
    const card = byId(s.cards[s.i]);
    markUsed(card.id);
    if (TYPES[card.type] && TYPES[card.type].personal) s.t += 1;
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
    return { p1: String(f.get('p1') || '').trim(), p2: String(f.get('p2') || '').trim(), aud: f.get('aud') || 'oba', max: Number(f.get('max') || 3), rounds: Number(f.get('rounds') || 10), ero: f.get('aud') === 'par' ? String(f.get('ero') || 'bez') : 'bez', gmode: String(f.get('mode') || 'klasika'), pen: String(f.get('pen') || 'obleceni') };
  }

  app.addEventListener('click', async e => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act;
    if (act === 'age-yes') { lsSet(AGE_KEY, new Date().toISOString().slice(0, 10)); return boot(); }
    if (act === 'resume') { s = lsGet(SESSION_KEY, null); if (s) return cardScreen(); }
    if (act === 'hit' || act === 'miss') {
      if (!s.score) s.score = [0, 0]; s.guesses = (s.guesses || 0) + 1;
      const guesser = (s.t + 1) % 2; if (act === 'hit') s.score[guesser] += 1;
      const card = byId(s.cards[s.i]);
      if (act === 'miss' && card && TYPES[card.type].bet) { markUsed(card.id); s.t += 1; s.i += 1; lsSet(SESSION_KEY, s); return penaltyScreen(guesser, 'Netrefa v sázce.'); }
      return advance();
    }
    if (act === 'pick') { pick = el.dataset.mode; return setup(); }
    if (act === 'pick-back') { pick = null; return setup(); }
    if (act === 'next') return advance();
    if (act === 'timer') return runTimer();
    if (act === 'secret-show') { const box = document.getElementById('a-secret'); box.hidden = false; el.textContent = 'Mám to, schovat a hrát dál'; el.dataset.act = 'secret-done'; return; }
    if (act === 'secret-done') { scheduleSecret(byId(s.cards[s.i])); return advance(); }
    if (act === 'rev-hit' || act === 'rev-miss') { const c = byId(s.cards[s.i]); const loser = act === 'rev-hit' ? c.sec.p : 1 - c.sec.p; s.i += 1; lsSet(SESSION_KEY, s); s.after = true; return penaltyScreen(loser, act === 'rev-hit' ? `Úkol byl: ${c.text}` : `Neuhádl/a. Úkol byl: ${c.text}`); }
    if (act === 'penalty') { const who = s.t % 2; s.penalties = (s.penalties || 0) + 1; markUsed(s.cards[s.i]); s.t += 1; s.i += 1; lsSet(SESSION_KEY, s); s.after = true; return penaltyScreen(who, 'Karta odmítnuta.'); }
    if (act === 'pen-done') { s.after = false; if (s.i >= s.cards.length) return endScreen(); lsSet(SESSION_KEY, s); return cardScreen(); }
    if (act === 'reset') { window.CM.confirmAction('Začít novou hru?', 'Rozehraná hra se zahodí a nastavíte si novou.').then(ok => { if (ok) { lsDel(SESSION_KEY); s = null; setup(); } }); return; }
    if (act === 'quit') { window.CM.confirmAction('Ukončit hru?', 'Ukážeme výsledek a můžete začít znovu.').then(ok => { if (ok && s) endScreen(); }); return; }
    if (act === 'reset-used') { window.CM.confirmAction('Zamíchat všechny karty?', 'Hra zapomene, které karty už padly, a můžou přijít znovu.').then(ok => { if (ok) { lsDel(USED_KEY); setup(); window.CM.toast && window.CM.toast('Karty jsou zamíchané.'); } }); return; }
    if (act === 'skip') return skip();
    if (act === 'menu') { clearInterval(timer); lsSet(SESSION_KEY, s); pick = null; return setup(); }
    if (act === 'again') return setup();
    if (act === 'logout') { window.CM.access.clear(); lsDel(SESSION_KEY); access = null; return boot(); }
    if (act === 'other-email') return accessGate();
  });

  document.addEventListener('change', e => {
    if (e.target.name === 'aud') { const f = document.getElementById('ero-set'); if (f) f.hidden = e.target.value !== 'par'; }
    if (e.target.name === 'mode') { const loz = e.target.value === 'loznice'; app.querySelectorAll('[data-loz]').forEach(x => { x.hidden = !loz; }); app.querySelectorAll('[data-classic]').forEach(x => { x.hidden = loz; }); const f = document.getElementById('ero-set'); if (f && !loz) { const a = app.querySelector('[name=aud]:checked'); f.hidden = a && a.value !== 'par'; } }
  });
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
