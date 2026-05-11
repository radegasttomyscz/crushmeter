NASAZENÍ CRUSHMETER UPDATE

1) Nahraj obsah této složky do rootu repozitáře.
2) Důležité: soubor index-crushmeter-v2.html z minula nebyl automaticky root index webu. Tady je už přejmenovaný jako index.html.
3) Složku assets nahraj také, nové podstránky ji používají pro společný header/footer a styl.
4) Složku blog nahraj do rootu.
5) Blog je schovaný: není v horní navigaci, je jen v patičce a v sitemap.xml.
6) Po commitu ověř Vercel/GitHub Pages deployment.

BLOG AUTOMATIZACE
- Bez backendu nejde bezpečně, aby AI sama commitovala články do GitHubu.
- Jednoduchá varianta: jednou měsíčně ti připravím HTML článek a ty ho nahraješ.
- Poloautomatická varianta: Make scénář vygeneruje článek, založí GitHub commit přes GitHub API a přidá URL do sitemap.xml. To uděláme později, až bude hotový platební tok.
