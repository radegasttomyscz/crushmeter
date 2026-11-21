/* Ověření přístupu do placené hry Odvážně 18+.
   Jedno volání webhooku v Make ověří e-mail a vrátí celou herní sadu. Další otázky se nevolají.
   Výsledek zůstává v tomto prohlížeči, takže hra běží i bez připojení po dobu odkladu.
   Žádné heslo ani účet: přístup se ověřuje e-mailem z objednávky. */
(() => {
  'use strict';
  const cfg = window.CM_CONFIG || {};
  const KEY = 'crushmeter.adult.access';
  const ATTEMPTS = 'crushmeter.adult.attempts';
  const DAY = 864e5;
  const RECHECK_AFTER = (cfg.recheckDays || 14) * DAY;       // po této době se při připojení ověří znovu
  const OFFLINE_GRACE = (cfg.offlineGraceDays || 30) * DAY;  // tak dlouho smí hra běžet bez ověření
  const TYPES = ['priznani', 'radsi', 'nikdy', 'kdo', 'vyzva', 'casovac', 'sazka', 'tajny', 'ruleta'];
  const AUDS = ['par', 'kamaradi', 'oba'];

  const normalize = v => String(v || '').normalize('NFKC').trim().toLowerCase();
  const validEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  const now = () => Date.now();

  function validCard(c) {
    if (!c || typeof c.id !== 'string' || !TYPES.includes(c.type) || !AUDS.includes(c.aud)) return false;
    if (![1, 2, 3].includes(c.lvl)) return false;
    return c.type === 'radsi' ? typeof c.a === 'string' && typeof c.b === 'string' : typeof c.text === 'string' && c.text.length > 0;
  }
  function validPack(pack) {
    return !!pack && pack.version === 1 && Array.isArray(pack.cards) && pack.cards.length >= 50 && pack.cards.every(validCard);
  }

  function read() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; } }
  function write(rec) { try { localStorage.setItem(KEY, JSON.stringify(rec)); return true; } catch { return false; } }
  function clear() { try { localStorage.removeItem(KEY); } catch {} }

  function throttled() {
    let list = [];
    try { list = JSON.parse(localStorage.getItem(ATTEMPTS) || '[]').filter(t => now() - t < 10 * 60 * 1000); } catch {}
    if (list.length >= 6) return true;
    list.push(now());
    try { localStorage.setItem(ATTEMPTS, JSON.stringify(list)); } catch {}
    return false;
  }

  /* Jedno volání. Vrací { status } a při aktivním přístupu { expires, pack }. */
  async function call(email) {
    if (!cfg.accessEndpoint) return { status: 'unconfigured' };
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    try {
      const body = new URLSearchParams({ email, product: cfg.productId || 'odvazne-18', v: '1' });
      const res = await fetch(cfg.accessEndpoint, { method: 'POST', body, signal: ctrl.signal });
      if (!res.ok) return { status: 'error' };
      const data = await res.json();
      if (data.status === 'active') {
        const exp = Date.parse(data.expires);
        if (!Number.isFinite(exp) || !validPack(data.pack)) return { status: 'error' };
        return { status: 'active', expires: data.expires, pack: data.pack };
      }
      return { status: ['expired', 'inactive', 'unknown'].includes(data.status) ? data.status : 'error', expires: data.expires };
    } catch { return { status: 'network' }; }
    finally { clearTimeout(timer); }
  }

  /* Použitelný uložený přístup, jinak null. */
  function stored() {
    const rec = read();
    if (!rec || !validPack(rec.pack)) return null;
    const exp = Date.parse(rec.expires);
    if (!Number.isFinite(exp) || exp + DAY <= now()) return null;
    if (now() - (rec.checkedAt || 0) > OFFLINE_GRACE) return null;
    return rec;
  }

  async function login(rawEmail) {
    const email = normalize(rawEmail);
    if (!validEmail(email)) return { status: 'invalid' };
    if (throttled()) return { status: 'throttled' };
    const res = await call(email);
    if (res.status === 'active') {
      write({ v: 1, email, expires: res.expires, checkedAt: now(), pack: res.pack });
      window.CM.track?.('access_verify_success', { game: 'odvazne-18' });
    } else {
      if (['expired', 'inactive', 'unknown'].includes(res.status)) clear();
      window.CM.track?.('access_verify_failure', { game: 'odvazne-18', reason: res.status });
    }
    return res;
  }

  /* Tiché obnovení při otevření hry. Při výpadku připojení se nic nemaže. */
  async function refresh() {
    const rec = read();
    if (!rec || !rec.email) return stored() ? { status: 'active', record: stored() } : { status: 'none' };
    if (now() - (rec.checkedAt || 0) < RECHECK_AFTER && stored()) return { status: 'active', record: stored() };
    const res = await call(rec.email);
    if (res.status === 'active') {
      const next = { v: 1, email: rec.email, expires: res.expires, checkedAt: now(), pack: res.pack };
      write(next);
      return { status: 'active', record: next };
    }
    if (['expired', 'inactive', 'unknown'].includes(res.status)) { clear(); return { status: res.status, expires: res.expires || rec.expires }; }
    return stored() ? { status: 'active', record: stored(), offline: true } : { status: 'none' };
  }

  window.CM = window.CM || {};
  window.CM.access = { normalize, validEmail, validPack, stored, login, refresh, clear };
})();
