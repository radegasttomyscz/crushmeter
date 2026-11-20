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

## Plán témat

| Datum | Článek | Stav |
|---|---|---|
| 23. 11. 2026 | Pravda, nebo úkol pro páry | napsáno |
| 30. 11. 2026 | Hry na Silvestra | napsáno |
| 7. 12. 2026 | Otázky na první rande | napsáno |
| 14. 12. 2026 | Raději bys…? | napsáno |
| 21. 12. 2026 | Hry na Vánoce s rodinou | téma |
| 28. 12. 2026 | Novoroční předsevzetí pro páry | téma |
| 4. 1. 2027 | Hry do auta | téma |
| 11. 1. 2027 | Valentýn doma: nápady | téma |
| 18. 1. 2027 | Kvíz pro páry: jak dobře se znáte | téma |
| 25. 1. 2027 | Hry pro páry na doma | téma |
