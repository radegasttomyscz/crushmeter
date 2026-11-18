# CrushMeter.cz

Statický web (HTML, CSS, vanilla JS, bez sestavování) pro GitHub Pages.

- Nastavení před spuštěním, měření a nasazení: [docs/NASTAVENI.md](docs/NASTAVENI.md)
- Placená hra Odvážně 18+, SimpleShop a Make: [docs/MAKE-SIMPLESHOP.md](docs/MAKE-SIMPLESHOP.md)
- Audit repozitáře: [docs/AUDIT.md](docs/AUDIT.md)

## Kde co upravit

- Vizuál: `assets/pop.css` (tokeny a přepisy), starší základ `assets/styles.css`, `assets/play.css`.
- Bezplatné hry: `assets/data.js`, `assets/guess.js`, `assets/know.js`.
- Odvážně 18+: `assets/adult.js` (logika), `assets/adult.css`, `assets/adult-preview.js` (10 veřejných karet), `assets/access.js` (ověření). Plná sada karet **není** v repozitáři.
- Měření a souhlas: `assets/analytics.js`. Veřejné nastavení: `assets/config.js`.
- Offline a verze: `sw.js` (při každé změně zvyš `CACHE`).
