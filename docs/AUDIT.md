# Audit CrushMeter.cz — stav k 18. 11. 2026

Základ: `main` @ b3a4f05 (12. 11. 2026). Ověřeno čtením zdrojů, kontrolou syntaxe a vykreslením v Chromu (390 px mobil, 1280 px desktop) u 4 stránek. Živou doménu jsem neviděl (z prostředí nedostupná), takže se nic netvrdí o produkci ani o Search Console.

## Co je a funguje
- Statický web bez build kroku (HTML/CSS/vanilla JS), GitHub Pages, `CNAME`, `.nojekyll` v repu **chybí** (viz rizika).
- Dvě bezplatné hry: Předveď a hádej (597 pojmů, 15 témat, popis/pantomima/kresba), Jak dobře se znáte? (48 otázek, 8/12 otázek na partii).
- Světlý/tmavý/systémový motiv (`assets/theme.js`), uložení do localStorage, bez odesílání dat.
- Service worker (`sw.js`): síť napřed, cache jako záloha, verze cache ručně (`crushmeter-free-v5-20261112`).
- SEO základ: title, description, canonical, OG, Twitter karty, robots.txt, sitemap (74 URL, odpovídá souborům), `llms.txt`, 64 článků s Article schématem, jedna H1 a správný canonical u všech článků.
- Kontrola syntaxe všech JS souborů prošla. Na 4 testovaných stránkách žádná chyba v konzoli a žádné horizontální přetékání na 390 i 1280 px.

## Nalezené problémy a rizika
1. **Žádné měření.** Nikde není GA4/GTM ani souhlas. Žádná z požadovaných událostí neexistuje.
2. **Žádný placený produkt.** Neexistuje 18+ hra, prodejní stránka, ověření e-mailem ani napojení SimpleShop/Make. `NASAZENI.md` to uvádí jako „pozdější etapu“.
3. **Články nevedou ke hrám.** 0 z 64 článků odkazuje na konkrétní hru; jen obecně na `/#hry`. Návštěvník přijde z Googlu a hru nepotká.
4. **Obsah článků patří starému konceptu** (signály zájmu, crush, red flags). Přivádí návštěvnost, ale ne nutně hráče. Nic se nemaže.
5. **Kanibalizace – kandidáti na sloučení nebo přesné odlišení** (hodnoceno podle titulků, bez dat z GSC):
   - `mam-ji-napsat-nebo-cekat` × `mam-mu-napsat-nebo-cekat`
   - `co-je-crush-vyznam` × `co-znamena-crush`
   - `co-je-red-flag-ve-vztahu` × `red-flags-na-zacatku`
   - `smisene-signaly-ve-vztahu` × `co-znamena-mixed-signals`
   - `co-delat-kdyz-crush-neodepisuje` × `kdy-je-cas-prestat-cekavat-na-zpravu`
   - `vztah-bez-nazvu` × `co-je-situationship` × `tapajici-vztah`
   - `jak-poznat-ze-mu-na-me-zalezi` × `jak-poznat-ze-ji-na-me-zalezi` (záměrně dvě pohlaví – ponechat, ale křížově propojit)
   Doporučení: bez dat z GSC nic nepřesměrovávat; nejdřív je odlišit/propojit a rozhodnout po datech.
6. **Osiřelý soubor `assets/know.css` (30 kB).** Není nikde odkazován ani v cache; stránka se vykresluje správně i bez něj. `NASAZENI.md` ho ale uvádí jako součást. Smazat nebo dokončit sloučení.
7. **`play.css` má 66 kB** (a `styles.css` 36 kB) načítané společně na každé herní stránce – prostor pro zrychlení a úklid.
8. **Chybí `.nojekyll`** (NASAZENI.md ho požaduje). Bez něj Jekyll na Pages zpracovává soubory zbytečně.
9. **Značka a texty působí párově.** Logo srdce s tepem, ve článcích „crush“. Zadání chce neutrální značku pro páry, kamarády i sourozence.
10. **Právní stránky popisují jen bezplatné hry** a „dřívější placenou službu“. Po zavedení analytiky a placené hry je nutné je přepsat (souhlas, e-mail při ověření přístupu, doba uchování).
11. **Service worker:** cache se zvyšuje ručně – snadno se zapomene. Chybí informace o nové verzi. Placený obsah se do cache nesmí dostat bez rozmyslu.
12. **Reklama na další projekty:** je jen jeden box (Putování světem) bez měření kliknutí. Virtuální kartářka a Sytě a lehce nejsou nikde.
13. `NASAZENI.md` je zastaralý a obsahuje zmínku o ZIP balíčku; po přechodu na GitHub je potřeba jej přepsat.

## Co dodat z externích dat
- Google Search Console: dotazy, zobrazení, CTR a pozice po stránkách (rozhodnutí o kanibalizaci, co vyhodnotit jako „návštěvnost bez hráčů“).
- Skutečná živá doména a nastavení DNS/Pages (nemám přístup).
- SimpleShop: ID placeného produktu; Make: URL webhooku a API klíč; GA4: ID měření.
