CrushMeter layout update

Obsah:
- dekujeme.html: upravená děkovací stránka bez odkazu na blog/magazín, se zvýrazněným sdílením.
- assets/site.js: společný header/footer pro statické stránky přes data-site-header a data-site-footer.
- assets/site.css: základní styly pro společný header/footer.
- partials/header.html a partials/footer.html: ruční HTML snippety, pokud bys chtěl header/footer vložit napevno přímo do každé stránky.

Jak použít JS variantu:
1) Nahraj assets/site.js a assets/site.css do /assets/.
2) Do <head> stránky přidej:
   <link rel="stylesheet" href="assets/site.css">
3) Na místo headeru vlož:
   <div data-site-header></div>
4) Na místo footeru vlož:
   <div data-site-footer></div>
5) Před </body> přidej:
   <script src="assets/site.js"></script>

Poznámka k SimpleShop embed formuláři:
Vložený formulář jde použít, ale aktuální flow je bezpečnější přes přesměrování. Web nejdřív ukládá formulář do Make/Data Store a až potom posílá člověka na platbu. Embed bych řešil až po ověření, že SimpleShop widget umí spolehlivě pracovat s e-mailem a případně předvyplněnými hodnotami.
