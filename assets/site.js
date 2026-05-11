(() => {
  const rootPath = location.pathname.includes('/blog/') ? '../' : '';

  const header = `
    <header class="site-header">
      <nav class="site-nav" aria-label="Hlavní navigace">
        <div class="site-nav-inner">
          <a class="brand" href="${rootPath}index.html" aria-label="CrushMeter.cz - hlavní stránka">
            <span class="brand-mark">❤</span>
            <span>CrushMeter<span style="color:#ff5ab8">.cz</span></span>
          </a>
          <div class="nav-links">
            <a href="${rootPath}index.html#jak-to-funguje">Jak to funguje</a>
            <a href="${rootPath}index.html#pro-koho">Pro koho</a>
            <a href="${rootPath}index.html#formular" class="nav-cta">Spustit analýzu</a>
          </div>
        </div>
      </nav>
    </header>`;

  const footer = `
    <footer class="site-footer">
      <div class="site-footer-inner">
        <div>
          <a class="footer-brand" href="${rootPath}index.html">CrushMeter<span>.cz</span></a>
          <p class="footer-text">AI kompatibilitní analýza dvou lidí podle zadaných údajů. Orientační výstup, ne psychologická diagnóza, terapie ani odborné vztahové poradenství.</p>
          <p class="footer-hashtag">Sdílíš výsledek? Přidej <strong>#crushmeter</strong></p>
        </div>
        <div class="footer-links" aria-label="Odkazy v patičce">
          <a href="${rootPath}obchodni-podminky.html">Obchodní podmínky</a>
          <a href="${rootPath}ochrana-soukromi.html">Ochrana soukromí</a>
          <a href="${rootPath}blog.html">Blog</a>
        </div>
      </div>
    </footer>`;

  document.querySelectorAll('[data-site-header]').forEach(el => el.outerHTML = header);
  document.querySelectorAll('[data-site-footer]').forEach(el => el.outerHTML = footer);
})();
