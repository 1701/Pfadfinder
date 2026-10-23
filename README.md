# Pfadfinder

Pfadfinder ist eine kostenlose Übungs-App (PWA) für Viertklässler in Baden-Württemberg zur Vorbereitung auf Kompass 4 in Deutsch und Mathematik. Kinder üben jeden Tag ein paar Minuten mit Aufgaben im Format des Tests, ohne Druck, ohne Konto und offline nach dem ersten Laden. Ziel ist Vertrautheit statt Drill: Das Kind geht mit weniger Angst in den Test, und Eltern sehen, wo es steht.

Alle Aufgaben in `content/` sind eigene Übungsaufgaben. Echte Kompass-Prüfungsaufgaben, Testhefte oder Scans liegen nie in diesem Repo.

Entwicklung: `npm ci`, dann `npm run dev`; `npm run check` prüft Lint, Inhalte, Tests und Build. Fachliches steht in `docs/PRODUCT.md`, Technik in `docs/ARCHITECTURE.md`, Auslieferung in `docs/DEPLOY.md`.

## Lizenz

- **Code:** MIT, siehe [`LICENSE`](LICENSE).
- **Inhalte** in `content/` (Aufgaben, Lesetexte, Probetests, Bilder): CC BY-SA 4.0, Urheber Markus Steireif, siehe [`content/LICENSE`](content/LICENSE).
- **Schrift Andika** (SIL Global): SIL Open Font License 1.1, siehe [`public/fonts/andika/OFL.txt`](public/fonts/andika/OFL.txt).
