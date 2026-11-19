/* Kdo dřív — souboj reflexů pro dva na jednom telefonu.
   Telefon leží mezi hráči, každý má svou polovinu displeje.
   Nic se neodesílá; jména se pamatují jen v tomto prohlížeči. */
(function () {
  'use strict';
  const NAMES_KEY = 'crushmeter.duel.names';
  const $ = (s, el = document) => el.querySelector(s);
  const form = $('#duel-setup');
  if (!form) return;

  const ROUNDS = {
    reakce: { title: 'Reakce', rule: 'Ťukni, až tvoje půlka zezelená. Kdo ťukne dřív, než zezelená, kolo prohrává.' },
    barvy: { title: 'Barvy', rule: 'Ťukni, až bude slovo napsané svou barvou. Třeba ZELENÁ zeleně. Špatné ťuknutí prohrává.' },
    pocty: { title: 'Počty', rule: 'Nahoře je příklad, pod ním naskakují čísla. Ťukni na správný výsledek. Špatné ťuknutí prohrává.' },
    tukani: { title: 'Ťukání', rule: 'Pět sekund. Ťukej co nejrychleji. Kdo má víc ťuknutí, bere bod.' }
  };
  const COLORS = [
    { word: 'ČERVENÁ', c: '#ff5c5c' },
    { word: 'ZELENÁ', c: '#40c057' },
    { word: 'MODRÁ', c: '#4dabf7' },
    { word: 'ŽLUTÁ', c: '#ffd43b' }
  ];

  const track = (name, params) => { try { window.CM && CM.track && CM.track(name, params); } catch (e) {} };
  const vibrate = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- Lobby ---------- */
  try {
    const saved = JSON.parse(localStorage.getItem(NAMES_KEY) || 'null');
    if (Array.isArray(saved)) { form.p1.value = saved[0] || ''; form.p2.value = saved[1] || ''; }
  } catch (e) {}

  form.addEventListener('submit', e => {
    e.preventDefault();
    const names = [form.p1.value.trim().slice(0, 18) || 'Hráč 1', form.p2.value.trim().slice(0, 18) || 'Hráč 2'];
    try { localStorage.setItem(NAMES_KEY, JSON.stringify([form.p1.value.trim(), form.p2.value.trim()])); } catch (e) {}
    const total = parseInt(new FormData(form).get('rounds'), 10) || 7;
    start(names, total);
  });

  /* ---------- Hra ---------- */
  let g = null; // stav hry
  const root = document.createElement('div');
  root.className = 'duel';
  root.id = 'duel';
  root.hidden = true;
  root.innerHTML =
    '<button type="button" class="duel-half is-top" data-p="1" aria-label="Půlka hráče 2"><div class="duel-face"></div></button>' +
    '<div class="duel-mid"><span class="duel-score is-top" aria-hidden="true"></span><span class="duel-round"></span><button type="button" class="duel-exit" aria-label="Ukončit hru">✕</button><span class="duel-score is-bottom"></span><div class="duel-timer"><i></i></div></div>' +
    '<button type="button" class="duel-half is-bottom" data-p="0" aria-label="Půlka hráče 1"><div class="duel-face"></div></button>' +
    '<div class="duel-overlay" hidden></div>';
  document.body.appendChild(root);
  const halves = [$('.duel-half.is-bottom', root), $('.duel-half.is-top', root)];
  const faces = halves.map(h => $('.duel-face', h));
  const overlay = $('.duel-overlay', root);
  const timerBar = $('.duel-timer i', root);

  function plan(total) {
    const types = ['reakce', 'barvy', 'pocty', 'tukani'];
    const out = [];
    let bag = [];
    while (out.length < total) {
      if (!bag.length) bag = types.slice().sort(() => Math.random() - 0.5);
      let t = bag.shift();
      if (out.length && out[out.length - 1] === t && bag.length) { bag.push(t); t = bag.shift(); }
      out.push(t);
    }
    if (out[0] !== 'reakce') { const i = out.indexOf('reakce'); if (i > 0) { out[i] = out[0]; out[0] = 'reakce'; } }
    return out;
  }

  function start(names, total) {
    g = { names, total, score: [0, 0], round: 0, plan: plan(total), timers: [], state: 'idle' };
    root.hidden = false;
    overlay.hidden = true;
    document.body.classList.add('game-active', 'duel-active');
    track('game_start', { game: 'kdo-driv', mode: 'free', rounds: total });
    intro();
  }

  function clearTimers() { g.timers.forEach(t => { clearTimeout(t); clearInterval(t); }); g.timers = []; }
  const later = (fn, ms) => { const t = setTimeout(fn, ms); g.timers.push(t); return t; };
  const every = (fn, ms) => { const t = setInterval(fn, ms); g.timers.push(t); return t; };

  function setHalf(i, cls, html) {
    halves[i].className = 'duel-half ' + (i ? 'is-top' : 'is-bottom') + (cls ? ' ' + cls : '');
    faces[i].innerHTML = html;
  }
  function both(cls, html) { setHalf(0, cls, html); setHalf(1, cls, html); }
  function mid() {
    $('.duel-round', root).textContent = 'Kolo ' + (g.round + 1) + ' z ' + g.total;
    $('.duel-score.is-bottom', root).textContent = g.names[0] + ' ' + g.score[0];
    $('.duel-score.is-top', root).textContent = g.names[1] + ' ' + g.score[1];
    timerBar.style.transition = 'none';
    timerBar.style.width = '0';
  }

  /* úvod kola: oba potvrdí připravenost */
  function intro() {
    clearTimers();
    mid();
    const type = g.plan[g.round];
    g.type = type;
    g.state = 'intro';
    g.ready = [false, false];
    const r = ROUNDS[type];
    for (let i = 0; i < 2; i++) {
      setHalf(i, 'is-intro', '<small>' + esc(g.names[i]) + '</small><strong>' + r.title + '</strong><p>' + r.rule + '</p><span class="duel-ready">Ťukni, až budeš připravený</span>');
    }
  }

  function readyTap(p) {
    if (g.ready[p]) return;
    g.ready[p] = true;
    const r = ROUNDS[g.type];
    setHalf(p, 'is-intro is-ready', '<small>' + esc(g.names[p]) + '</small><strong>' + r.title + '</strong><p>' + r.rule + '</p><span class="duel-ready">Připraven. Čeká se na druhého.</span>');
    if (g.ready[0] && g.ready[1]) countdown(() => play());
  }

  function countdown(done) {
    g.state = 'countdown';
    let n = 3;
    const show = () => both('is-count', '<b class="duel-big">' + n + '</b>');
    show();
    every(() => { n--; if (n <= 0) { clearTimers(); done(); } else show(); }, 650);
  }

  function play() {
    g.state = 'play';
    g.taps = [0, 0];
    if (g.type === 'reakce') playReakce();
    else if (g.type === 'barvy') playStream(colorStream());
    else if (g.type === 'pocty') playStream(mathStream());
    else playTukani();
  }

  /* Reakce */
  function playReakce() {
    g.go = false;
    both('is-wait', '<strong>Čekej…</strong>');
    later(() => {
      g.go = true;
      both('is-go', '<b class="duel-big">Teď!</b>');
    }, rnd(1400, 4200));
  }

  /* Proud slov nebo čísel, ťuká se na správný */
  function colorStream() {
    let sinceMatch = 0;
    return {
      head: '',
      next() {
        const word = pick(COLORS);
        let ink;
        const force = sinceMatch >= 4;
        if (force || Math.random() < 0.28) ink = word; else { do { ink = pick(COLORS); } while (ink === word); }
        const match = ink === word;
        sinceMatch = match ? 0 : sinceMatch + 1;
        return { html: '<b class="duel-word" style="color:' + ink.c + '">' + word.word + '</b>', match };
      }
    };
  }
  function mathStream() {
    const a = Math.floor(rnd(3, 13)), b = Math.floor(rnd(3, 13)), plus = Math.random() < 0.7;
    const x = plus ? a : Math.max(a, b), y = plus ? b : Math.min(a, b);
    const right = plus ? x + y : x - y;
    const head = x + (plus ? ' + ' : ' − ') + y;
    let sinceMatch = 0, last = null;
    return {
      head,
      next() {
        let v;
        const force = sinceMatch >= 4;
        if (force || Math.random() < 0.26) v = right;
        else { do { v = right + pick([-3, -2, -1, 1, 2, 3, 10, -10]); } while (v === right || v < 0 || v === last); }
        last = v;
        const match = v === right;
        sinceMatch = match ? 0 : sinceMatch + 1;
        return { html: '<span class="duel-sum">' + head + ' =</span><b class="duel-word">' + v + '</b>', match };
      }
    };
  }
  function playStream(stream) {
    g.match = false;
    let speed = 1050;
    const step = () => {
      const item = stream.next();
      g.match = item.match;
      both('is-stream', item.html);
      speed = Math.max(720, speed - 25);
      later(step, speed);
    };
    step();
  }

  /* Ťukání */
  function playTukani() {
    const LEN = 5000;
    for (let i = 0; i < 2; i++) setHalf(i, 'is-tap', '<b class="duel-big">0</b><small>ťukej!</small>');
    requestAnimationFrame(() => {
      timerBar.style.transition = 'width ' + LEN + 'ms linear';
      timerBar.style.width = '100%';
    });
    later(() => {
      const [a, b] = g.taps;
      if (a === b) roundEnd(-1, 'Remíza ' + a + ' : ' + b);
      else roundEnd(a > b ? 0 : 1, a + ' : ' + b + ' ťuknutí');
    }, LEN);
  }

  function tap(p) {
    if (!g) return;
    if (g.state === 'intro') return readyTap(p);
    if (g.state === 'result') return next();
    if (g.state !== 'play') return;
    if (g.type === 'reakce') {
      if (g.go) roundEnd(p, 'Rychlejší ruka.');
      else roundEnd(1 - p, 'Moc brzo, zelená ještě nesvítila.', p);
    } else if (g.type === 'barvy' || g.type === 'pocty') {
      if (g.match) roundEnd(p, 'Správně a jako první.');
      else roundEnd(1 - p, 'Vedle, tohle nebylo ono.', p);
    } else if (g.type === 'tukani') {
      g.taps[p]++;
      const big = faces[p].querySelector('.duel-big');
      if (big) big.textContent = g.taps[p];
    }
  }

  function roundEnd(winner, reason, faulty) {
    clearTimers();
    g.state = 'locked';
    timerBar.style.transition = 'none';
    if (winner >= 0) g.score[winner]++;
    vibrate(winner >= 0 ? 40 : 15);
    mid();
    for (let i = 0; i < 2; i++) {
      let cls, head;
      if (winner < 0) { cls = 'is-draw'; head = 'Remíza'; }
      else if (winner === i) { cls = 'is-win'; head = 'Bod pro tebe'; }
      else { cls = 'is-lose' + (faulty === i ? ' is-fault' : ''); head = 'Bod má ' + esc(g.names[winner]); }
      setHalf(i, cls, '<strong>' + head + '</strong><p>' + esc(reason) + '</p><span class="duel-score-big">' + g.score[i] + ' : ' + g.score[1 - i] + '</span><span class="duel-ready" hidden>Ťukni a pokračujte</span>');
    }
    later(() => {
      g.state = 'result';
      faces.forEach(f => { const r = f.querySelector('.duel-ready'); if (r) r.hidden = false; });
    }, 900);
  }

  function next() {
    g.round++;
    if (g.round >= g.total) return finish();
    intro();
  }

  function finish() {
    clearTimers();
    g.state = 'end';
    const [a, b] = g.score;
    const winner = a === b ? -1 : a > b ? 0 : 1;
    const title = winner < 0 ? 'Remíza' : 'Vyhrává ' + esc(g.names[winner]);
    overlay.innerHTML =
      '<div class="final-screen duel-final"><small>Kdo dřív</small><h2>' + title + '</h2>' +
      '<p class="duel-final-score"><span>' + esc(g.names[0]) + '</span><b>' + a + ' : ' + b + '</b><span>' + esc(g.names[1]) + '</span></p>' +
      '<div class="duel-final-actions"><button type="button" class="arcade-button" data-act="again">Odveta</button><a class="btn btn-ghost" href="/#hry">Vybrat jinou hru</a></div>' +
      '<p class="duel-final-tip">Na klidnější kolo zkuste <a href="/jak-dobre-se-znate.html">Jak dobře se znáte?</a></p></div>';
    overlay.hidden = false;
    track('game_complete', { game: 'kdo-driv', mode: 'free', rounds: g.total });
  }

  function exit() {
    if (g) clearTimers();
    g = null;
    root.hidden = true;
    overlay.hidden = true;
    document.body.classList.remove('game-active', 'duel-active');
    window.scrollTo(0, 0);
  }

  halves.forEach((h, i) => {
    h.addEventListener('pointerdown', e => { e.preventDefault(); tap(i); });
    h.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tap(i); } });
    h.addEventListener('click', e => e.preventDefault());
    h.addEventListener('contextmenu', e => e.preventDefault());
  });
  $('.duel-exit', root).addEventListener('click', () => {
    if (!g || g.state === 'end') return exit();
    const prev = g.state;
    clearTimers();
    g.state = 'paused';
    overlay.innerHTML = '<div class="duel-confirm"><h2>Ukončit hru?</h2><p>Skóre ' + g.score[0] + ' : ' + g.score[1] + ' se neuloží.</p><div class="duel-final-actions"><button type="button" class="arcade-button" data-act="quit">Ukončit</button><button type="button" class="btn btn-ghost" data-act="resume">Hrát dál</button></div></div>';
    overlay.hidden = false;
    g.prev = prev;
  });
  overlay.addEventListener('click', e => {
    const act = e.target.closest('[data-act]');
    if (!act) return;
    const a = act.dataset.act;
    if (a === 'again' && g) { const n = g.names, t = g.total; start(n, t); }
    else if (a === 'quit') exit();
    else if (a === 'resume' && g) { overlay.hidden = true; intro(); }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && g && (g.state === 'play' || g.state === 'countdown')) { clearTimers(); intro(); }
  });
})();
