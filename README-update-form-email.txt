CrushMeter update – formulář, texty, e-mail, právní stránky

Co je změněno:
- Na hlavní stránce je výrazně méně používáno slovo AI. Veřejná komunikace jde více směrem „analýza / kompatibilitní rozbor“.
- AI / jazykový model je zmíněn hlavně tam, kde to dává smysl: FAQ, právní poznámky, ochrana soukromí.
- Formulář je přepracovaný: méně slepého klikání, více vlastních textových odpovědí.
- Payload do Make obsahuje nová pole: selfDescription, analysisQuestion, crush.description, crush.signals, crush.uncertainty, relationStory, goodThingsText, biggestProblem, lastSituation.
- Do SimpleShop note se už neposílá celý dlouhý payload, ale jen krátké metadata. Plná data zůstávají v Make přes webhook.
- Upravené obchodní podmínky a ochrana soukromí podle aktuálního flow.
- Přidána HTML e-mail šablona: email-sablona-crushmeter.html
- Přidán nový Claude prompt: claude-prompt-v2.txt

Důležité před nahráním:
- V index.html zkontroluj konstantu MAKE_FORM_WEBHOOK_URL. Pokud je tam placeholder, vrať tam svou ostrou URL Make webhooku pro příjem formuláře.
- Po nahrání otestuj celý flow, protože formulář má nová pole a Claude prompt musí odpovídat novému payloadu.
- V Make v Claude modulu nahraď prompt obsahem souboru claude-prompt-v2.txt.
- V Gmail modulu nastav Body type = rawHtml a použij HTML šablonu z email-sablona-crushmeter.html.


Aktualizace formuláře v2:
- první krok, frekvence komunikace a konkrétní matoucí situace jsou volitelné;
- přidáno pole pro typ vztahové situace;
- Claude prompt dává vyšší váhu psaným odpovědím a volitelné prázdné odpovědi nepovažuje automaticky za negativní signál.
