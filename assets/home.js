/* Úvodní stránka: přepínání ukázek her. Bez JavaScriptu jsou vidět všechny. */
(function () {
  var tabs = [].slice.call(document.querySelectorAll('.demo-tab'));
  if (!tabs.length) return;
  function show(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(t.getAttribute('aria-controls'));
      if (panel) panel.hidden = !on;
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { show(t); });
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { e.preventDefault(); show(tabs[(i + d + tabs.length) % tabs.length], true); }
    });
  });
  show(tabs[0]);
})();

/* Lightbox pro ukázky her: zvětšení, listování šipkami, zavření Esc nebo kliknutím vedle. */
(function () {
  var zooms = [].slice.call(document.querySelectorAll('.demo-zoom'));
  if (!zooms.length) return;
  var box = document.createElement('dialog');
  box.className = 'lightbox';
  box.setAttribute('aria-label', 'Ukázka hry');
  box.innerHTML =
    '<div class="lb-inner"><div class="lb-phone"><img alt=""></div>' +
    '<div class="lb-side"><p class="lb-game"></p><p class="lb-cap"></p><p class="lb-count"></p>' +
    '<div class="lb-nav"><button type="button" class="lb-prev" aria-label="Předchozí ukázka">‹</button><button type="button" class="lb-next" aria-label="Další ukázka">›</button></div></div>' +
    '<button type="button" class="lb-close" aria-label="Zavřít">✕</button></div>';
  document.body.appendChild(box);
  var img = box.querySelector('img'), cap = box.querySelector('.lb-cap'), game = box.querySelector('.lb-game'), count = box.querySelector('.lb-count');
  var list = [], idx = 0;

  function render() {
    var b = list[idx], src = b.querySelector('img');
    img.src = src.src;
    img.alt = src.alt;
    var fig = b.closest('figure'), li = b.closest('li');
    var c = fig ? fig.querySelector('figcaption') : li && li.querySelector('p');
    cap.textContent = c ? c.textContent : '';
    var panel = b.closest('.demo-panel'), rule = b.closest('.rule');
    var tab = panel ? document.getElementById(panel.getAttribute('aria-labelledby')) : rule && rule.querySelector('h2');
    game.textContent = tab ? tab.textContent : '';
    count.textContent = 'Krok ' + (idx + 1) + ' ze ' + list.length;
    box.querySelector('.lb-prev').disabled = idx === 0;
    box.querySelector('.lb-next').disabled = idx === list.length - 1;
  }
  function open(b) {
    list = [].slice.call(b.closest('.demo-panel, .rule-steps').querySelectorAll('.demo-zoom'));
    idx = list.indexOf(b);
    render();
    if (box.showModal) box.showModal(); else box.setAttribute('open', '');
    document.documentElement.classList.add('lb-open');
  }
  function close() {
    if (box.close) box.close(); else box.removeAttribute('open');
  }
  box.addEventListener('close', function () {
    document.documentElement.classList.remove('lb-open');
    if (list[idx]) list[idx].focus();
  });
  function go(d) { var n = idx + d; if (n >= 0 && n < list.length) { idx = n; render(); } }
  zooms.forEach(function (b) { b.addEventListener('click', function () { open(b); }); });
  box.querySelector('.lb-close').addEventListener('click', close);
  box.querySelector('.lb-prev').addEventListener('click', function () { go(-1); });
  box.querySelector('.lb-next').addEventListener('click', function () { go(1); });
  box.addEventListener('click', function (e) { if (e.target === box || e.target.classList.contains('lb-inner')) close(); });
  box.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
  });
  var sx = null;
  box.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', function (e) {
    if (sx === null) return;
    var dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    sx = null;
  });
})();
