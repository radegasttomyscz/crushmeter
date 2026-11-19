# Placená hra Odvážně 18+: SimpleShop + Make

Frontend je hotový a otestovaný proti simulovanému webhooku. Tady je přesný návod, jak ho propojit se skutečnými službami. Žádné přihlašovací údaje ani webhooky v repozitáři nejsou, doplňují se do `assets/config.js`.

## Jak to funguje

1. Zákazník zaplatí v SimpleShopu.
2. SimpleShop pošle do Make informaci o stavu objednávky.
3. Make při stavu „uhrazeno“ uloží nebo prodlouží přístup v Data Storu.
4. Zákazník dostane e-mail s odkazem na `/odvazne-18-hrat.html`.
5. Na webu zadá e-mail z objednávky. Stránka zavolá **jednou** ověřovací webhook v Make.
6. Make vrátí stav a při aktivním přístupu celou herní sadu (234 karet). Telefon si ji uloží.
7. Hra běží dál bez dalších volání. Znovu se ověřuje po 14 dnech (při připojení), bez ověření smí běžet 30 dní.

Přístup nezávisí na doručení e-mailu: kdo má e-mail z objednávky, vstoupí i bez něj.

## Co kde leží

| Co | Kde |
|---|---|
| 234 karet (soukromě), z toho 84 erotických s příznakem `ero` | soubor `pack-v1.json`, který ti předávám zvlášť. **Nikdy ho nenahrávej do repozitáře.** Je v `.gitignore`. |
| 10 karet ukázky | `assets/adult-preview.js` (veřejné) |
| Seznam zákazníků | Make Data Store `pristupy` |
| Adresa ověřovacího webhooku, URL obchodu | `assets/config.js` |

## 1. SimpleShop

1. Vytvoř produkt Odvážně 18+, cena 99 Kč. Poznamenej si jeho **ID produktu**.
2. V objednávkovém formuláři ověř, že je u digitálního obsahu souhlas s okamžitým poskytnutím a odkaz na podmínky. Text nech zkontrolovat podle svých podmínek (nejsem právník).
3. V SimpleShopu nastav odchozí webhook (oznámení) při změně stavu objednávky. Přesné umístění v nabídce se může lišit, hledej Automatizace nebo Napojení. Poslouchat má stav **uhrazeno** a také **vráceno/zrušeno**.
4. Do děkovné stránky nebo e-mailu zákazníkovi dej odkaz `https://crushmeter.cz/odvazne-18-hrat.html` a větu: „Zadej e-mail z objednávky.“
5. V `assets/config.js` doplň `shopUrl` (adresa objednávkového formuláře) a případně změň `productId`.

## 2. Make: Data Store

Vytvoř Data Store `pristupy` (volný tarif má 1 MB, stačí). Struktura:

| Pole | Typ | Obsah |
|---|---|---|
| klíč záznamu | text | e-mail **malými písmeny bez mezer** |
| email | text | stejný normalizovaný e-mail |
| order_id | text | číslo objednávky |
| product_id | text | ID produktu v SimpleShopu |
| activated_at | datum | první aktivace |
| expires_at | datum | konec přístupu |
| status | text | `active` nebo `inactive` |

Normalizace v Make: `lower(trim(email))`. Stejně ji dělá web před odesláním.

## 3. Make: scénář „Objednávky“ (aktivace, prodloužení, vrácení)

1. **Webhook** od SimpleShopu.
2. **Filtr:** `product_id` se rovná ID tvého produktu (jinak scénář skončí).
3. **Router:**
   - **Uhrazeno:**
     1. *Data Store → Get a record* (klíč `lower(trim(email))`).
     2. Pokud záznam existuje a `expires_at` je v budoucnu: nová expirace = `addMonths(expires_at; 12)`. Nákup před vypršením tedy prodlouží od současného data konce.
     3. Jinak: nová expirace = `addMonths(now; 12)`. Nákup po vypršení začíná od nové platby.
     4. *Data Store → Add/replace a record* (`status = active`, nová `expires_at`, `order_id`, `product_id`).
     5. *E-mail* zákazníkovi s odkazem. U chyby e-mailu nastav **Ignore**, aby selhání e-mailu nezablokovalo aktivaci. Přístup je už uložený.
   - **Vráceno nebo zrušeno:** *Data Store → Update a record*, `status = inactive`.

Spotřeba: asi 4 operace na jednu platbu. Dva scénáře (Objednávky a Ověření) se vejdou do bezplatného tarifu.

## 4. Make: scénář „Ověření přístupu“

1. **Webhooks → Custom webhook.** Přijímá pole `email`, `product`, `v` (formulářová data). Adresu webhooku vlož do `config.js` jako `accessEndpoint`.
2. *Data Store → Get a record* (klíč `lower(trim(email))`).
3. **Router:**
   - Záznam existuje, `status = active`, `product_id` odpovídá a `expires_at` je v budoucnu → **Webhook response** 200:
     ```json
     {"status":"active","expires":"2027-11-18","pack":{ …obsah pack-v1.json… }}
     ```
     Celý `pack-v1.json` (asi 18 kB) vlož přímo do těla odpovědi, ušetříš operaci. Pokud pole tolik nepřijme, ulož sadu do Data Storu (případně na dva záznamy) a načti ji dalším modulem.
   - Záznam existuje a `expires_at` je v minulosti → `{"status":"expired","expires":"2026-01-10"}`.
   - Záznam existuje a `status = inactive` → `{"status":"inactive"}`.
   - Záznam neexistuje nebo nesedí produkt → `{"status":"unknown"}`.
4. **U každé odpovědi nastav hlavičky:**
   - `Content-Type: application/json`
   - `Access-Control-Allow-Origin: https://crushmeter.cz`

   Web posílá formulářový požadavek, který nevyžaduje předběžný dotaz (preflight). Make na něj neodpovídá, proto se tak posílá.

Spotřeba: 3 operace na jedno ověření. Web ověřuje při prvním vstupu na telefonu, po 14 dnech při připojení a při novém přihlášení. Jedno zařízení je asi 2 ověření měsíčně, tedy zhruba 6 operací. Bezplatný tarif (1 000 operací měsíčně) tak vystačí na řádově 100+ zařízení. Pokud by to nestačilo, prodluž `recheckDays` v `config.js`.

## 5. Test před spuštěním

Z terminálu (nahraď adresu a e-mail):

```
curl -s -X POST "https://hook.eu1.make.com/TVUJ-WEBHOOK" \
  -d "email=test@example.com" -d "product=odvazne-18" -d "v=1"
```

Zkus: neexistující e-mail (`unknown`), aktivní (`active` + `pack`), expirovaný (`expired`), `inactive`. Pak otevři `/odvazne-18-hrat.html` na telefonu, zadej e-mail s různou velikostí písmen a mezerami, dohraj hru a zkus režim letadlo.

## Rizika a kompromisy

- **Sdílení e-mailu** je vědomě přijaté riziko. Brání mu jen to, že e-mail není veřejný. Kdyby se objevilo zneužití, šlo by přidat omezení počtu zařízení, ale to by vyžadovalo účty nebo token, které jsi nechtěl.
- **Herní sada v telefonu.** Kdo zaplatí, má kartičky v úložišti prohlížeče a může si je přečíst. To je cena za hru bez připojení.
- **Webhook je veřejná adresa.** Kdokoli ji může volat, ale odpověď s kartami dostane jen pro existující aktivní e-mail. Web omezuje pokusy (6 za 10 minut na zařízení), ale útok mimo web nezastaví. Make počítá každé volání jako operaci.
- **Vrácená platba** se v telefonu projeví nejpozději po `offlineGraceDays` (30 dní), nebo hned při dalším ověření online.
