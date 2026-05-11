CrushMeter.cz – sjednocený header/footer

Co je v balíčku:
- index.html – hlavní stránka s napojeným společným header/footerem
- dekujeme.html – děkovací stránka s napojeným společným header/footerem
- blog.html – rozcestník blogu
- ochrana-soukromi.html
- obchodni-podminky.html
- blog/*.html – články
- assets/site.css – společné styly pro blog, právní stránky a header/footer
- assets/site.js – vkládá společný header/footer do všech stránek
- partials/ – referenční HTML fragmenty

DŮLEŽITÉ:
V souboru index.html je řádek:
const MAKE_FORM_WEBHOOK_URL = 'VLOZ_SEM_MAKE_WEBHOOK_PRO_FORMULAR';

Pokud už máš na GitHubu produkční Make webhook URL, před nahráním tohoto index.html ji do souboru znovu vlož, jinak se formulář nepřesměruje na platbu.

Jak nahrát:
1. Nahraj/přepiš soubory v rootu repozitáře.
2. Nahraj/přepiš složku assets/.
3. Nahraj/přepiš složku blog/.
4. partials/ jsou pouze pomocné, web je pro běh nepotřebuje.

Po nasazení ověř:
- hlavní stránka má jednotný header/footer
- blog a články mají jednotný header/footer
- děkovací stránka funguje na /dekujeme.html
- formulář má stále správnou Make webhook URL
