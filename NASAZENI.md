# CrushMeter — bezplatné hry, první verze

Hotový statický web pro doménu **crushmeter.cz**. Nepotřebuje sestavení, npm, databázi, Make ani placené API. Platby a přihlášení nejsou součástí této verze.

## Nasazení na GitHub Pages

1. Před přepsáním si stáhněte zálohu současného repozitáře. Tento balíček vychází z veřejně dostupného webu a přiložených her, nikoliv z vašeho přihlášeného GitHub repozitáře.
2. Rozbalte ZIP. **Jeho obsah patří přímo do kořene publikované větve**, aby na nejvyšší úrovni byly `index.html`, `CNAME`, `assets/` a `blog/`. Nevkládejte tam složku, která je bude dále obalovat.
3. Nahrajte všechny soubory z balíčku včetně `.nojekyll`. Původní soubory se stejnými názvy se přepíší. Před mazáním dalších starých souborů zkontrolujte, zda neslouží starším zákazníkům nebo výsledkům objednávek.
4. V Settings → Pages ponechte publikování ze své používané větve a složky `/ (root)`. Pokud už publikujete pomocí Actions, zachovejte svůj funkční způsob publikování a publikujte tento obsah.
5. Vlastní doména je `crushmeter.cz`, je také v souboru `CNAME`. DNS kvůli této změně obsahu nepřepínejte. Po publikaci zkontrolujte HTTPS.
6. Otevřete obě hry, odehrajte alespoň jedno kolo a zkontrolujte kontakt. Potom předejte odkaz někomu, kdo hru nezná, a sledujte, zda začne bez vysvětlování.

Web se má otevírat přes HTTPS na vlastní doméně. Samotné otevření souboru `index.html` z disku nenahrazuje nasazení: odkazy jsou navržené od kořene domény a offline režim vyžaduje podporovaný bezpečný kontext.

## Co je v první verzi

- **Předveď a hádej:** 597 různých pojmů v 15 tématech, popis, pantomima a kreslení prstem na displej. Pojmy jsou převzaté ze dvou dodaných HTML sad, opakování stejného pojmu napříč tématy je hlídané globálně.
- **Jak dobře se znáte?:** 48 otázek ve třech tématech, skrytá vlastní odpověď, předání telefonu a tip druhého hráče. Výsledkem jsou správné odhady, nikoliv hodnocení vztahu.
- Rozehrané hry, přezdívky a historie zůstávají v prohlížeči. Každá hra má samostatné mazání svých dat.
- Příprava základních herních stránek pro offline používání a manifest pro přidání na plochu.
- Cestovatelská stránka s předvolenými tématy a odkazy na Putování světem označenými UTM parametry.
- Zachovaných všech 64 článků ze současného veřejného magazínu na stejných URL. Původní prodejní bloky byly nahrazené odkazy na hry.
- Kontakt a informace o lokálním ukládání. Původní podmínky a informace o soukromí pro placené analýzy jsou zachované v neindexovaném archivu.

## Po nasazení: SEO

1. Otevřete `https://crushmeter.cz/sitemap.xml` a `https://crushmeter.cz/robots.txt` a ověřte, že už obsahují novou verzi.
2. V existující vlastnosti Search Console znovu odešlete `sitemap.xml`.
3. Přes Kontrolu URL ověřte homepage, `/predved-a-hadej.html`, `/jak-dobre-se-znate.html` a `/hry-na-dovolenou.html`. U hlavních nových stránek můžete požádat o indexaci.
4. Ověřte sdílecí obrázek při vložení odkazu do sociální sítě. Starší náhled může síť nějakou dobu držet v mezipaměti.
5. Sledujte skutečné dotazy, zobrazení a prokliky v Search Console. Nastavené technické SEO samo o sobě nezaručuje indexaci ani návštěvnost.

Nová verze záměrně nepřebírá původní externí formulář, prodejní odkazy ani Make webhooky. Neobsahuje analytické a reklamní měřicí skripty. Pokud chcete později GA4, přidejte měření jako samostatnou úpravu spolu s odpovídajícím nastavením souhlasů a informací o soukromí.

## Kontroly dokončené před předáním

- Syntaxe JavaScriptu: bez chyb.
- Statická kontrola 78 HTML dokumentů: jedna H1 na stránku, popis, titulek, canonical, validní JSON-LD, interní odkazy a zdroje bez chyb.
- Sitemap: 74 indexovatelných stránek. Archiv, 404 a stránka pro staré objednávky jsou `noindex` a v sitemapě nejsou.
- Zachováno všech 68 adres z původní sitemap.
- V prohlížeči: deset kol hádací hry s výsledkem 2/10, body i přeskočení; kreslení tahem; pauza a obnova po obnovení stránky.
- V prohlížeči: osm otázek poznávací hry, šest správných odhadů ze sedmi vyhodnocených odpovědí, jedna přeskočená otázka. Ověřené i rozdělení bodů mezi hráče, skrytí odpovědi při předání a obnova rozehrané hry.
- Úzké zobrazení v Chrome při šířkách rámu 320 a 375 px: zkontrolovaný vzhled a ovládání, bez vodorovného přetékání. Samostatný fyzický iPhone ani Android nebyl v tomto prostředí dostupný.
- Offline režim je implementovaný a jeho soubory jsou součástí balíčku. Interní HTTP náhled neumožnil plnohodnotně ověřit service worker; **po publikaci na HTTPS ověřte načtení her v režimu letadlo**. Nezapínejte ho dřív, než homepage oznámí dokončení offline přípravy.

## Přechod od původního prodeje

Před vypnutím staré automatizace zkontrolujte, že nemáte nevyřízenou zaplacenou objednávku analýzy. Archiv původních podmínek nenahrazuje zpracování starších objednávek.

## Další fáze

Placenou kategorii 18+ doplnit zvlášť: SimpleShop → Make → soukromý repozitář s oprávněními a placeným obsahem. V souladu s dohodou může první verze přístupu kontrolovat jen zadaný e-mail a platnost jednoho roku. Do veřejného repozitáře nepatří seznam zákazníků, přístupové tokeny ani placená data.

Pokud chcete později balíčky zamykat, nepřidávejte je nyní do veřejného `assets/data.js`. Jeho obsah je určený výhradně pro bezplatné hry.

## Úpravy obsahu a cache

- Hádací pojmy a poznávací otázky: `assets/data.js`.
- Vzhled: `assets/styles.css`.
- Hádací hra: `assets/guess.js`.
- Poznávací hra: `assets/know.js`.
- Lokální ukládání, sdílení a registrace offline režimu: `assets/common.js`.
- Při další změně nasazených souborů zvýšit verzi cache v `sw.js`, aby se offline instalacím bezpečně aktualizovala data. Při přidání nové stránky se upraví i sitemap.

Zdroje k technickému SEO: [Google Search Essentials](https://developers.google.com/search/docs/essentials), [titulky stránek](https://developers.google.com/search/docs/appearance/title-link), [sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
