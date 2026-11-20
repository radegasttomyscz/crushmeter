/* Kdo ví víc — kvízový souboj pro dva na jednom telefonu.
   Kdo odpovídá, vybere kategorii a obtížnost. Druhý mu otázku přečte, spustí čas a rozhodne.
   Otázky jsou v quiz-data.js, použité se pamatují jen v tomto prohlížeči. */
(function () {
  'use strict';
  const DATA = window.CM_QUIZ;
  const form = document.getElementById('quiz-setup');
  if (!DATA || !form) return;

  const KEY_USED = 'crushmeter.quiz.used';
  const KEY_SESSION = 'crushmeter.quiz.session';
  const KEY_PREFS = 'crushmeter.quiz.prefs';
  const PTS = { 1: 1, 2: 2, 3: 3 };
  const LVL = { 1: 'Lehká', 2: 'Střední', 3: 'Těžká' };
  const CATS = {};
  DATA.cats.forEach(c => { CATS[c.id] = c; });

  const $ = (s, el = document) => el.querySelector(s);
  const E = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const get = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const del = k => { try { localStorage.removeItem(k); } catch (e) {} };
  const track = (n, p) => { try { window.CM && CM.track && CM.track(n, p); } catch (e) {} };
  const vibrate = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };
  const bodu = n => n === 1 ? '1 bod' : (n >= 2 && n <= 4 ? n + ' body' : n + ' bodů');

  /* ---------- Lobby ---------- */
  const prefs = get(KEY_PREFS, null);
  if (prefs) {
    if (prefs.names) { form.p1.value = prefs.names[0] || ''; form.p2.value = prefs.names[1] || ''; }
    ['time', 'len'].forEach(n => { const r = form.querySelector(`input[name=${n}][value="${prefs[n]}"]`); if (r) r.checked = true; });
    if (Array.isArray(prefs.cats)) form.querySelectorAll('input[name=cat]').forEach(c => { c.checked = prefs.cats.includes(c.value); });
  }
  const resumeBox = document.getElementById('quiz-resume');
  const saved = get(KEY_SESSION, null);
  if (resumeBox && saved && saved.phase !== 'end') {
    resumeBox.hidden = false;
    $('#quiz-resume-detail').textContent = `${saved.names[0]} ${saved.score[0]} : ${saved.score[1]} ${saved.names[1]}, otázka ${Math.min(saved.asked + 1, saved.total)} z ${saved.total}`;
    $('#quiz-resume-go').addEventListener('click', () => { g = saved; open(); render(); });
    $('#quiz-resume-drop').addEventListener('click', () => { del(KEY_SESSION); resumeBox.hidden = true; });
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const cats = [...form.querySelectorAll('input[name=cat]:checked')].map(c => c.value);
    const msg = $('#quiz-cat-msg');
    if (!cats.length) { msg.hidden = false; return; }
    msg.hidden = true;
    const names = [form.p1.value.trim().slice(0, 18) || 'Hráč 1', form.p2.value.trim().slice(0, 18) || 'Hráč 2'];
    const time = Number(new FormData(form).get('time')) || 60;
    const len = Number(new FormData(form).get('len')) || 5;
    set(KEY_PREFS, { names: [form.p1.value.trim(), form.p2.value.trim()], time, len, cats });
    start({ names, time, len, cats });
  });
  form.addEventListener('change', e => {
    if (e.target.name === 'cat') $('#quiz-cat-msg').hidden = true;
  });
  const allBtn = document.getElementById('quiz-cats-all');
  if (allBtn) allBtn.addEventListener('click', () => {
    const boxes = [...form.querySelectorAll('input[name=cat]')];
    const on = boxes.some(b => !b.checked);
    boxes.forEach(b => { b.checked = on; });
    allBtn.textContent = on ? 'Zrušit vše' : 'Vybrat vše';
  });

  /* ---------- Hra ---------- */
  let g = null, timer = null;
  const app = document.createElement('div');
  app.className = 'quiz';
  app.id = 'quiz';
  app.hidden = true;
  (document.getElementById('obsah') || document.body).appendChild(app);
  const lobby = document.getElementById('game-setup');

  function start(o) {
    g = { names: o.names, time: o.time, total: o.len * 2, cats: o.cats, score: [0, 0], right: [0, 0], asked: 0,
      turn: Math.random() < 0.5 ? 0 : 1, phase: 'pick', pick: null, q: null, hint: false, left: o.time, running: false, ok: null };
    track('game_start', { game: 'kdo-vi-vic', mode: 'free', rounds: g.total });
    open();
    render();
  }
  function open() {
    app.hidden = false;
    if (lobby) lobby.hidden = true;
    document.body.classList.add('quiz-active');
    window.scrollTo(0, 0);
  }
  function close() {
    stopTimer();
    app.hidden = true;
    if (lobby) lobby.hidden = false;
    document.body.classList.remove('quiz-active');
    window.scrollTo(0, 0);
  }
  const save = () => { if (g) set(KEY_SESSION, Object.assign({}, g, { running: false })); };

  const used = () => new Set(get(KEY_USED, []));
  function free(cat, lvl) {
    const u = used();
    return CATS[cat].q.map((q, i) => i).filter(i => CATS[cat].q[i][0] === lvl && !u.has(cat + ':' + i));
  }
  function left(cat) { return [1, 2, 3].reduce((n, l) => n + free(cat, l).length, 0); }
  function draw(cat, lvl, avoid) {
    let pool = free(cat, lvl).filter(i => i !== avoid);
    if (!pool.length) {
      const u = get(KEY_USED, []).filter(k => !(k.startsWith(cat + ':') && CATS[cat].q[+k.split(':')[1]][0] === lvl));
      set(KEY_USED, u);
      pool = free(cat, lvl).filter(i => i !== avoid);
    }
    const i = pool[Math.floor(Math.random() * pool.length)];
    const u = get(KEY_USED, []); u.push(cat + ':' + i); set(KEY_USED, u);
    return { cat, i };
  }

  const answerer = () => g.names[g.turn];
  const reader = () => g.names[1 - g.turn];
  const worth = () => g.hint ? 1 : PTS[g.pick.lvl];

  function bar() {
    const p = i => `<div class="qz-player${g.turn === i && g.phase !== 'end' ? ' is-on' : ''}"><span>${E(g.names[i])}</span><b>${g.score[i]}</b></div>`;
    return `<header class="qz-top"><strong class="qz-title">Kdo ví víc</strong>
<div class="qz-top-right"><span class="qz-count">Otázka ${Math.min(g.asked + 1, g.total)} z ${g.total}</span><button type="button" class="qz-menu-btn" data-act="menu" aria-label="Pauza a nabídka">Pauza</button></div></header>
<div class="qz-score">${p(0)}${p(1)}</div><div class="qz-progress" aria-hidden="true"><i style="width:${(g.asked / g.total) * 100}%"></i></div>`;
  }

  const REPORT=(game,lines)=>{const body='Hra: '+game+'\n'+lines.filter(Boolean).join('\n')+'\n\nCo je špatně:\n';return `<a class="report-link" href="mailto:info@tomys.cz?subject=${encodeURIComponent('CrushMeter: chyba ve hře '+game)}&body=${encodeURIComponent(body)}">Nahlásit chybu</a>`};
  function offerCats() {
    const pool = g.cats.slice(), fresh = pool.filter(id => left(id) > 0), base = fresh.length >= 6 ? fresh : pool;
    for (let i = base.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [base[i], base[j]] = [base[j], base[i]]; }
    return base.slice(0, 6);
  }
  function render() {
    if (!g) return;
    save();
    const ph = g.phase;
    let body = '';
    if (ph === 'pick') {
      if (!g.offer || g.offer.some(id => !g.cats.includes(id))) g.offer = offerCats();
      const cats = g.offer.map(id => {
        const n = left(id);
        return `<button type="button" class="qz-cat${g.pick && g.pick.cat === id ? ' is-on' : ''}" data-cat="${id}"><strong>${E(CATS[id].name)}</strong><small>${n ? n + ' nových otázek' : 'vše odehráno, zamícháme znovu'}</small></button>`;
      }).join('');
      const lv = g.pick ? [1, 2, 3].map(l => `<button type="button" class="qz-lvl l${l}" data-lvl="${l}"><strong>${LVL[l]}</strong><small>${bodu(PTS[l])}</small></button>`).join('') : '';
      body = `<section class="qz-panel"><h1 data-focus tabindex="-1">${E(answerer())}, vyber si otázku</h1>
<p class="qz-lead">Kategorii i obtížnost volíš sám. Těžší otázka, víc bodů.</p>
<div class="qz-cats">${cats}</div>${g.cats.length > g.offer.length ? '<button type="button" class="text-button qz-other" data-act="other">Jiné kategorie</button>' : ''}
${g.pick ? `<h2 class="qz-sub">Jak těžkou?</h2><div class="qz-lvls">${lv}</div>` : ''}</section>`;
    } else if (ph === 'hand') {
      body = `<section class="qz-panel qz-hand"><div class="qz-hand-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/></svg></div>
<p class="qz-kicker">${E(CATS[g.pick.cat].name)}, ${LVL[g.pick.lvl].toLowerCase()} otázka za ${bodu(PTS[g.pick.lvl])}</p>
<h1 data-focus tabindex="-1">Telefon přebírá ${E(reader())}</h1>
<p class="qz-lead">${E(reader())} přečte otázku nahlas a spustí čas. ${E(answerer())}, do displeje nekoukej.</p>
<button type="button" class="btn qz-go" data-act="read">Mám telefon, čtu otázku</button></section>`;
    } else if (ph === 'read' || ph === 'time') {
      const q = CATS[g.q.cat].q[g.q.i];
      const pct = g.left / g.time;
      body = `<section class="qz-panel qz-read">
<div class="qz-chips"><span class="qz-chip">${E(CATS[g.q.cat].name)}</span><span class="qz-chip l${q[0]}">${LVL[q[0]]}, ${bodu(PTS[q[0]])}</span></div>
<p class="qz-for">Odpovídá ${E(answerer())}. Přečti otázku nahlas:</p>
<h1 class="qz-q" data-focus tabindex="-1">${E(q[1])}</h1>
<details class="qz-answer"><summary>Ukázat odpověď</summary><p>${E(q[2])}</p></details>
<div class="qz-timer${ph === 'time' ? ' is-out' : ''}${g.running ? ' is-run' : ''}" role="timer" aria-live="off"><b id="qz-left">${ph === 'time' ? 'Čas!' : g.left}</b><span class="qz-bar"><i id="qz-bar" style="width:${pct * 100}%"></i></span></div>
${ph === 'read' && !g.running ? `<button type="button" class="btn qz-start" data-act="go">${g.left < g.time ? 'Pokračovat v čase' : 'Spustit čas'} (${g.time} s)</button>` : ''}
${g.running ? `<button type="button" class="btn btn-ghost qz-start" data-act="stop">Pozastavit čas</button>` : ''}
${q[0] > 1 ? `<label class="qz-hint"><input type="checkbox" data-act="hint"${g.hint ? ' checked' : ''}><span>Napověděl/a jsem, správná odpověď je jen za 1 bod</span></label>` : ''}
<div class="qz-judge"><button type="button" class="btn qz-ok" data-act="ok">Správně, +${bodu(worth())}</button><button type="button" class="btn qz-bad" data-act="bad">Špatně</button></div>
<button type="button" class="qz-swap" data-act="swap">Otázka je nejasná, dát jinou</button></section>`;
    } else if (ph === 'result') {
      const q = CATS[g.q.cat].q[g.q.i];
      const win = g.ok;
      body = `<section class="qz-panel qz-result ${win ? 'is-ok' : 'is-bad'}"><p class="qz-kicker">${E(answerer())}</p>
<h1 data-focus tabindex="-1">${win ? `Správně! +${bodu(g.got)}` : 'Tentokrát ne'}</h1>
<div class="qz-solution"><small>Správná odpověď</small><strong>${E(q[2])}</strong></div>
<p class="qz-next-info">${g.asked + 1 >= g.total ? 'To byla poslední otázka.' : `Teď odpovídá ${E(reader())} a otázku vybírá sám.`}</p>
<button type="button" class="btn qz-go" data-act="next">${g.asked + 1 >= g.total ? 'Ukázat výsledek' : 'Další otázka'}</button>
<p class="report-row">${REPORT('Kdo ví víc',['Kategorie: '+CATS[g.q.cat].name,'Otázka: '+q[1],'Odpověď ve hře: '+q[2]])}</p></section>`;
    } else if (ph === 'end') {
      const [a, b] = g.score;
      const w = a === b ? -1 : a > b ? 0 : 1;
      body = `<section class="qz-panel final-screen qz-final"><p class="qz-kicker">Kdo ví víc</p><h1 data-focus tabindex="-1">${w < 0 ? 'Remíza' : 'Vyhrává ' + E(g.names[w])}</h1>
<div class="qz-final-score"><div><span>${E(g.names[0])}</span><b>${a}</b><small>${g.right[0]} z ${g.total / 2} správně</small></div><div><span>${E(g.names[1])}</span><b>${b}</b><small>${g.right[1]} z ${g.total / 2} správně</small></div></div>
<div class="qz-final-actions"><button type="button" class="btn qz-go" data-act="again">Odveta</button><button type="button" class="btn btn-ghost" data-act="lobby">Změnit nastavení</button></div>
<p class="qz-final-tip">Na pauzu od otázek zkuste <a href="/predved-a-hadej.html">Předveď a hádej</a>.</p></section>`;
    }
    app.innerHTML = bar() + `<main class="qz-main">${body}</main><div class="qz-sheet" hidden></div>`;
    const f = app.querySelector('[data-focus]');
    if (f) f.focus({ preventScroll: true });
  }

  function tick() {
    g.left = Math.max(0, g.left - 1);
    const el = document.getElementById('qz-left'), barEl = document.getElementById('qz-bar');
    if (el) el.textContent = g.left;
    if (barEl) barEl.style.width = (g.left / g.time) * 100 + '%';
    if (g.left <= 5 && g.left > 0) vibrate(30);
    if (g.left === 0) { stopTimer(); g.phase = 'time'; vibrate([250, 120, 250]); render(); }
  }
  function startTimer() { if (timer) return; g.running = true; timer = setInterval(tick, 1000); render(); }
  function stopTimer() { if (timer) clearInterval(timer); timer = null; if (g) g.running = false; }

  function judge(ok) {
    stopTimer();
    g.ok = ok;
    g.got = ok ? worth() : 0;
    if (ok) { g.score[g.turn] += g.got; g.right[g.turn]++; }
    vibrate(ok ? 40 : 15);
    g.phase = 'result';
    render();
  }
  function next() {
    g.asked++;
    if (g.asked >= g.total) {
      g.phase = 'end';
      track('game_complete', { game: 'kdo-vi-vic', mode: 'free', rounds: g.total });
      render();
      del(KEY_SESSION);
      return;
    }
    g.turn = 1 - g.turn;
    g.phase = 'pick'; g.pick = null; g.offer = null; g.q = null; g.hint = false; g.left = g.time; g.ok = null;
    render();
  }

  function menu() {
    const wasRunning = g.running;
    stopTimer();
    const sheet = app.querySelector('.qz-sheet');
    sheet.innerHTML = `<div class="qz-sheet-in" role="dialog" aria-modal="true" aria-labelledby="qz-sheet-h"><h2 id="qz-sheet-h">Pauza</h2><p>Hra se průběžně ukládá. Když ji ukončíte, můžete se k ní vrátit z úvodní obrazovky hry.</p>
<button type="button" class="btn qz-go" data-act="resume">Hrát dál</button><button type="button" class="btn btn-ghost" data-act="quit">Ukončit hru</button><button type="button" class="qz-swap" data-act="restart">Začít úplně znovu</button></div>`;
    sheet.hidden = false;
    sheet.dataset.run = wasRunning ? '1' : '';
    sheet.querySelector('button').focus();
  }

  app.addEventListener('click', e => {
    const t = e.target.closest('[data-cat],[data-lvl],[data-act]');
    if (!t || !g) return;
    if (t.dataset.cat) { g.pick = { cat: t.dataset.cat, lvl: null }; render(); const l = app.querySelector('.qz-lvls'); if (l) l.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); return; }
    if (t.dataset.lvl) { g.pick.lvl = Number(t.dataset.lvl); g.phase = 'hand'; render(); return; }
    const a = t.dataset.act;
    if (a === 'hint') { g.hint = t.checked; const ok = app.querySelector('.qz-ok'); if (ok) ok.textContent = 'Správně, +' + bodu(worth()); save(); return; }
    if (a === 'other') { const prev = g.offer || []; let next = offerCats(), tries = 0; while (tries++ < 5 && next.every(id => prev.includes(id))) next = offerCats(); g.offer = next; g.pick = null; render(); return; }
    if (a === 'read') { g.q = draw(g.pick.cat, g.pick.lvl); g.phase = 'read'; g.left = g.time; render(); }
    else if (a === 'go') startTimer();
    else if (a === 'stop') { stopTimer(); render(); }
    else if (a === 'ok') judge(true);
    else if (a === 'bad') judge(false);
    else if (a === 'swap') { stopTimer(); g.q = draw(g.q.cat, g.pick.lvl, g.q.i); g.left = g.time; g.hint = false; g.phase = 'read'; render(); }
    else if (a === 'next') next();
    else if (a === 'again') { const o = { names: g.names, time: g.time, len: g.total / 2, cats: g.cats }; start(o); }
    else if (a === 'lobby') { close(); g = null; }
    else if (a === 'menu') menu();
    else if (a === 'resume') { const s = app.querySelector('.qz-sheet'); const run = s.dataset.run; s.hidden = true; if (run) startTimer(); }
    else if (a === 'quit') { save(); close(); location.reload(); }
    else if (a === 'restart') { del(KEY_SESSION); close(); g = null; }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && g && !app.hidden && g.phase !== 'end') { const s = app.querySelector('.qz-sheet'); if (s && s.hidden) menu(); }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && g && g.running) { stopTimer(); render(); }
  });
})();
