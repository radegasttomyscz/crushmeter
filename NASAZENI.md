# CrushMeter — bezplatné hry, verze 2

Aktualizace z 29. října 2026. Kompletní statický web pro **crushmeter.cz** připravený pro GitHub Pages, bez sestavování a bez placených závislostí. Make, SimpleShop ani přístup do placených kategorií nejsou pro tuto verzi potřeba.

## Co se změnilo

- Nový vizuál poznávací hry: oddělené nastavení, barevné profily hráčů, průběžné skóre, kroky otázky a předávání telefonu.
- Volba tématu pomocí karet, dvě délky hry, jména bez povinné registrace.
- Odpověď se nejprve označí. Až potvrzovací tlačítko ji odešle. Před potvrzením lze volbu změnit.
- Samostatná obrazovka předání neobsahuje otázku, možnosti ani vybranou odpověď. Při hádání se původní výběr neoznačuje.
- Odhalení skutečné odpovědi a tipu, krátká pobídka k povídání, jasné přidělení bodu.
- Výsledková karta s počtem správných odhadů, osobními výsledky a rozbalovacím přehledem odpovědí celé partie.
- Mobilní styly s odpověďmi pod sebou, většími dotykovými plochami, formulářovými poli bez vynuceného přiblížení na iOS a prostorem pro okraje displeje.
- Sjednocený úvod, herní karty a společné prvky druhé hry.
- Zachované dosavadní URL, články, metadata a herní data. Uloženou partii první verze lze obnovit. Přehled všech odpovědí se shromažďuje až v této verzi.
- Zvýšená verze offline cache, aby aktualizace zahrnula i nové styly.

## Nasazení na GitHub Pages

1. Stáhněte si zálohu současného repozitáře. Balíček navazuje na dodanou první verzi; nemá přístup k případným vlastním úpravám vašeho repozitáře.
2. Rozbalte ZIP. **Do kořene publikované větve nahrajte jeho obsah**, aby na nejvyšší úrovni byly `index.html`, `CNAME`, `assets/` a `blog/`. Nenahrávejte samotný ZIP ani složku, která vše obaluje.
3. Pokud už běží první herní verze, stačí přepsat soubory a přidat nový `assets/know.css`. Není nutné znovu mazat celý obsah repozitáře. Zachovejte svou `.github` složku s případným publikačním workflow.
4. Nahrajte i `.nojekyll`. Balíček obsahuje `CNAME` s hodnotou `crushmeter.cz`.
5. V Settings → Pages zachovejte funkční publikování z používané větve a `/ (root)`, případně vlastní Actions workflow. DNS při aktualizaci obsahu neměňte.
6. Po publikaci zkontrolujte obě hry přes HTTPS, kontakt a dostupnost `sitemap.xml`.

Web používá odkazy od kořene domény. Samotné otevření `index.html` z disku proto nenahrazuje nasazení. Pokud už máte starší verzi otevřenou v telefonu, zavřete a znovu otevřete stránku, případně ji obnovte.

## Rozsah bezplatné verze

**Předveď a hádej:** 597 unikátních pojmů v 15 tématech, popis, pantomima a kreslení prstem. Při losování se hlídají také duplicity pojmu mezi tématy.

**Jak dobře se znáte?:** 48 otázek ze tří témat nebo jejich mixu. Každý odpovídá sám za sebe, druhý odhaduje. Za správný tip získá hádající bod. Přeskočené otázky se nezahrnou do počtu vyhodnocených odpovědí. Procento na konci popisuje správné odhady v této hře; není to hodnocení vztahu.

Přezdívky, historie a rozehrané hry se ukládají jen do prohlížeče. Přehled odpovědí poslední poznávací hry se při spuštění další partie přepíše. V nastavení každé hry lze její data smazat.

Součástí je všech 64 původních článků na zachovaných adresách, stránky s pravidly, cestovatelská stránka a kontextové odkazy na Putování světem. Původní dokumenty pro placené analýzy zůstávají v neindexovaném archivu.

## Ověření této verze

- JavaScript: kontroly syntaxe všech aplikačních souborů a service workeru prošly.
- 13 funkčních kontrol logiky a generovaného HTML v izolovaném prostředí: změna a potvrzení volby, skrytí odpovědi, střídání hráčů, body, přeskočení, obnovení výběru po načtení, další partie bez opakování, předvolba tématu, bezpečné vykreslení přezdívek, nedostatek zbývajících otázek, kompatibilita staré partie a smazání údajů.
- Celá kontrolní partie: 6 správných tipů ze 7 vyhodnocených odpovědí, 1 přeskočení; osobní výsledky 4/4 a 2/3. Přehled obsahuje 7 vyhodnocených otázek.
- Statická kontrola 78 HTML stránek: jedna H1, titulky, popisy, canonical, JSON-LD a místní odkazy včetně kotev prošly.
- Sitemap: 74 existujících URL. Offline jádro: 17 existujících souborů. Kontrola párování závorek CSS prošla.

**Limit ověření:** nový vzhled nebyl po úpravách dokončeně zkontrolován v prohlížeči. Interní náhled nejprve přestal běžet a následné otevření zablokovala automatická bezpečnostní kontrola. Funkční testy výše nejsou vizuálním testem vykreslení ani testem fyzického telefonu. Service worker také vyžaduje samostatné ověření na výsledné HTTPS doméně.

## Krátký kontrolní průchod na telefonu

1. Otevřete poznávací hru, zadejte dvě jména, vyberte téma a spusťte osm otázek. Zkontrolujte čitelnost i po otočení telefonu.
2. Vyberte odpověď, změňte ji a potvrďte. Předejte telefon. Druhý hráč nesmí vidět, která odpověď byla vybraná.
3. Udělejte jeden chybný i správný tip a jednu otázku přeskočte. Vyzkoušejte Pauzu a pokračování, potom obnovení stránky.
4. Dohrajte partii a otevřete přehled odpovědí. Zkontrolujte jména, skóre a další hru.
5. U druhé hry vyzkoušejte časovač a kreslení. Pro offline zkoušku nejdřív počkejte na oznámení dokončení offline přípravy na úvodu, pak zapněte režim letadlo a otevřete obě hry znovu.

## SEO po aktualizaci

Tituly, popisy, canonical, Open Graph, robots a sitemap jsou součástí balíčku. V existující Search Console zkontrolujte hlavní herní stránky a odešlete `sitemap.xml`. Technické nastavení samo o sobě nezaručuje návštěvnost ani indexaci. Při sdílení může sociální síť nějakou dobu používat starší náhled.

## Pozdější placená část

Zůstává samostatnou etapou: SimpleShop → Make → soukromý repozitář s oprávněními a placeným obsahem. První ověření může podle dohody používat jen zadaný e-mail a roční platnost. Do veřejného repozitáře nepatří seznam zákazníků, tokeny ani placená data. Tato verze žádné placené otázky neobsahuje.

Před vypnutím původní prodejní automatizace zkontrolujte nevyřízené zaplacené objednávky analýz.

## Kde co upravit

- Data her: `assets/data.js`.
- Společný vzhled a úvod: `assets/styles.css`, `index.html`.
- Poznávací hra: `jak-dobre-se-znate.html`, `assets/know.css`, `assets/know.js`.
- Hádací hra: `assets/guess.js` a `predved-a-hadej.html`.
- Úložiště, sdílení, offline registrace: `assets/common.js`.
- Offline seznam a verze cache: `sw.js`. Při další změně souborů zvyšte název cache.

Zdroje k SEO: [Google Search Essentials](https://developers.google.com/search/docs/essentials), [titulky](https://developers.google.com/search/docs/appearance/title-link), [sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
