(() => {
  const rootPath = location.pathname.includes('/blog/') ? '../' : '';
  const header = `
    <nav class="site-nav">
      <div class="site-nav-inner">
        <a class="brand" href="${rootPath}index.html" aria-label="CrushMeter.cz">
          <span class="brand-mark">❤</span><span>CrushMeter<span style="color:#ff5ab8">.cz</span></span>
        </a>
        <div class="nav-links">
          <a href="${rootPath}index.html#jak-to-funguje">Jak to funguje</a>
          <a href="${rootPath}index.html#formular">Spustit test</a>
        </div>
      </div>
    </nav>`;
  const footer = `
    <footer class="site-footer">
      <div class="site-footer-inner">
        <div>
          <strong style="color:white">CrushMeter.cz</strong>
          <p style="margin:10px 0 0;line-height:1.6">Zábavná AI interpretace vztahové chemie. Nejsme terapeuti, věštci ani seznamka.</p>
        </div>
        <div class="footer-links">
          <a href="${rootPath}obchodni-podminky.html">Obchodní podmínky</a>
          <a href="${rootPath}ochrana-soukromi.html">Ochrana soukromí</a>
          <a href="${rootPath}blog.html">Blog</a>
        </div>
      </div>
    </footer>`;
  document.querySelectorAll('[data-site-header]').forEach(el => el.outerHTML = header);
  document.querySelectorAll('[data-site-footer]').forEach(el => el.outerHTML = footer);
})();
