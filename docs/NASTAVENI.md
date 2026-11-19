# Nastavení před spuštěním

Všechna veřejná nastavení jsou v `assets/config.js`. Prázdná hodnota znamená, že funkce je vypnutá.

| Klíč | Co doplnit | Když je prázdný |
|---|---|---|
| `ga4Id` | ID měření GA4 (`G-…`) | Žádné měření a žádná lišta souhlasu |
| `accessEndpoint` | URL ověřovacího webhooku z Make | Plná hra hlásí, že se připravuje |
| `shopUrl` | adresa objednávkového formuláře SimpleShopu | Tlačítka Koupit se nezobrazí, ukáže se „Objednávka se právě připravuje“ |
| `productId` | identifikátor produktu (výchozí `odvazne-18`) | použije se výchozí |
| `recheckDays`, `offlineGraceDays` | frekvence ověřování | 14 a 30 dní |

## Měření (GA4)

Skript se načte až po souhlasu. Posílají se jen tyto události, vždy bez odpovědí, jmen a e-mailů:

| Událost | Kdy |
|---|---|
| `game_start`, `game_complete` | spuštění a dokončení bezplatné hry (`game`: predved-a-hadej, jak-dobre-se-znate, kdo-driv, kdo-vi-vic; `mode=free`) |
| `adult_preview_open`, `adult_preview_start`, `adult_preview_complete` | ukázka 18+ |
| `adult_offer_view` | zobrazení nabídky plné hry (`placement`) |
| `shop_click` | klik do SimpleShopu (`placement`) |
| `access_verify_success`, `access_verify_failure` | ověření přístupu (`reason`) |
| `paid_game_start`, `paid_game_complete` | placená hra (`rounds`, `level`, `audience`, `skipped`) |
| `click_putovani_svetem`, `click_virtualni_kartarka`, `click_syte_a_lehce` | klik na partnerské projekty (`placement`) |
| `article_game_click`, `adult_preview_click` | klik z článku nebo prodejní stránky do hry |

V GA4 si označ jako klíčové události minimálně `shop_click`, `paid_game_start` a `adult_preview_complete`.

## Nasazení na GitHub Pages

1. Zkontroluj pull request z větve `claude/redesign`, vyzkoušej na telefonu a sluč do `main`.
2. Settings → Pages: zdroj ponech jako dosud (`main`, `/ (root)`). `CNAME` a `.nojekyll` jsou v repozitáři.
3. Po nasazení otevři web na telefonu a **zavři a znovu otevři** stránku, ať se načte nový service worker. Verze cache je v `sw.js` (`CACHE`). Při každé změně souborů ji zvyš.
4. V Search Console odešli `sitemap.xml`.

## Kontrola po nasazení (5 minut na telefonu)

1. Úvod, tři karty, přepnutí světlého a tmavého vzhledu.
2. Jak dobře se znáte? a Předveď a hádej: rozehrát, zavřít, vrátit se.
3. Ukázka 18+: potvrdit věk, projít deset karet, na konci uvidíš nabídku.
4. Plná hra: zadat e-mail z testovací objednávky, 10 kol, přeskočit kartu, zavřít a pokračovat, režim letadlo.
5. Souhlas s měřením: v GA4 DebugView ověř, že se události posílají jen po souhlasu.

## Co dodat z Search Console později

- Dotazy, zobrazení, CTR a pozice po stránkách. Podle nich rozhodnout o sloučení překrývajících se článků (seznam v `docs/AUDIT.md`).
- Které z 64 starších článků skutečně přivádějí návštěvníky.
