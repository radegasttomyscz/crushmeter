# Fronta článků CrushMeter

Každé pondělí v 6:00 (v létě v 7:00) GitHub Action `Publikace článků z fronty` zveřejní
články z této složky, jejichž datum v názvu už nastalo. Vydané se přesunou do `vydane/`.

- Volitelně `K: Krátký nadpis karty v magazínu` (jinak se vezme nadpis H1 po dvojtečku)
- Název souboru: `RRRR-MM-DD-slug.txt` (slug = adresa článku, např. `pravda-nebo-ukol-pro-pary` → crushmeter.cz/pravda-nebo-ukol-pro-pary.html)
- Přesunout termín: přejmenuj soubor.
- Vyřadit článek: smaž soubor nebo ho přejmenuj na `.txt.off`.
- Zveřejnit hned: v GitHubu Actions → Publikace článků z fronty → Run workflow (vydá vše s datem dnes a dříve).

## Formát souboru

```
T: Titulek do Googlu (do 60 znaků)
D: Popis do Googlu (max. 160 znaků)
H: Nadpis H1
L: Štítek a drobečková navigace (např. Otázky pro dva)
G: hra na konci článku: know | quiz | guess | adult
C: Krátký popis na kartu v magazínu
R: /adresa.html | Text odkazu v Souvisejících (lze opakovat)

Odstavec. **tučně**, [odkaz](/adresa.html)
## Nadpis H2
### Nadpis H3
- odrážka
1. číslovaný bod
= odpověď (skrytá pod tlačítkem Ukázat odpovědi)
? Otázka do Častých otázek | Odpověď
// komentář, nezveřejní se
```

## Plán vydávání

| Pondělí | Článek | Adresa |
|---|---|---|
| 23. 11. 2026 | Pravda, nebo úkol pro páry | pravda-nebo-ukol-pro-pary |
| 30. 11. 2026 | Hry na Silvestra | hry-na-silvestra |
| 7. 12. 2026 | Otázky na první rande | otazky-na-prvni-rande |
| 14. 12. 2026 | Otázky Raději bys | otazky-radeji-bys |
| 21. 12. 2026 | Hry na Vánoce | hry-na-vanoce |
| 28. 12. 2026 | Otázky na konec roku | otazky-na-konec-roku |
| 4. 1. 2027 | Hry do auta | hry-do-auta |
| 11. 1. 2027 | Valentýn doma | valentyn-doma |
| 18. 1. 2027 | Kvíz pro páry | kviz-pro-pary |
| 25. 1. 2027 | Hry pro páry na doma | hry-pro-pary-na-doma |
| 1. 2. 2027 | Romantické otázky pro páry | romanticke-otazky-pro-pary |
| 8. 2. 2027 | 30denní výzva pro páry | vyzvy-pro-pary |
| 15. 2. 2027 | Nikdy jsem nikdy | nikdy-jsem-nikdy |
| 22. 2. 2027 | Hádanky s odpovědí | hadanky-s-odpovedi |
| 1. 3. 2027 | Hry na párty pro dospělé | hry-na-party |
| 8. 3. 2027 | Otázky na seznamce | otazky-na-seznamce |
| 15. 3. 2027 | Hry na Velikonoce | hry-na-velikonoce |
| 22. 3. 2027 | Vědomostní kvíz s odpověďmi | vedomostni-kviz |
| 29. 3. 2027 | Hry na chatu a chalupu | hry-na-chatu |
| 5. 4. 2027 | Otázky k zamyšlení | otazky-k-zamysleni |
| 12. 4. 2027 | Otázky pro nejlepší kamarádku | otazky-pro-nejlepsi-kamaradku |
| 19. 4. 2027 | Levné rande | levne-rande |
| 26. 4. 2027 | Hry venku pro dospělé | hry-venku-pro-dospele |
| 3. 5. 2027 | Hry na svatbu | hry-na-svatbu |
| 10. 5. 2027 | Otázky pro dlouholeté páry | otazky-pro-dlouhodobe-pary |
| 17. 5. 2027 | Hry na rozlučku se svobodou | hry-na-rozlucku-se-svobodou |
| 24. 5. 2027 | Hry k táboráku | hry-k-taboraku |
| 31. 5. 2027 | Hry na Den dětí | hry-na-den-deti |
