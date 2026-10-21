# CLAUDE.md – Arbeitsregeln für dieses Repo

Du baust **Pfadfinder**, eine kostenlose Übungs-PWA für Viertklässler in Baden-Württemberg zur Vorbereitung auf Kompass 4. Nutzer sind 9–10 Jahre alt und teils prüfungsängstlich. Jede Entscheidung, die du triffst, muss das berücksichtigen.

## Pflichtlektüre vor jeder Aufgabe
1. `docs/PRODUCT.md` – was und warum (fachliche Wahrheit)
2. `docs/ARCHITECTURE.md` – wie (Stack, Struktur, Domänenmodell)
3. `docs/CONTENT_SCHEMA.md` – Item-Vertrag, **eingefroren**
4. `docs/PROGRESS.md` – was zuletzt passiert ist

Widerspricht eine Aufgabe einem dieser Dokumente: nicht stillschweigend abweichen, sondern den Konflikt am Anfang deiner Antwort benennen und einen Vorschlag machen.

## Sprache
- Code, Kommentare, Commits, Dateinamen: Englisch
- Alles, was ein Kind oder Elternteil sieht: Deutsch, Du-Form, kindgerecht (siehe PRODUCT.md Abschnitt 7). Keine Anglizismen in der UI ("Weiter", nicht "Next"; "Entdeckungen", nicht "Badges")
- Content-Dateien: Deutsch
- Rückfragen und Berichte an Markus (Chat, Abschlussbericht): Deutsch

## Arbeitsweise
- Lies erst, dann plane in 3–6 Stichpunkten, dann baue. Bei Aufgaben > 1 Stunde: Plan zuerst zeigen, auf Freigabe warten
- Kleine, vollständige Schritte: jede Aufgabe endet mit grünem `npm run check` (lint + content-validate + test + build)
- Domain-Logik (`src/domain`) immer mit Tests, bevor UI darauf aufsetzt
- Keine neue Laufzeit-Dependency ohne Eintrag unten unter "Dependencies" mit Begründung
- Keine Änderung an `docs/CONTENT_SCHEMA.md` ohne Versionssprung und CHANGELOG-Eintrag; im Zweifel Rückfrage
- Keine Netzwerkaufrufe zur Laufzeit außer dem Laden der eigenen Assets
- Keine Platzhalter-Items im Code erfinden; nutze `content/` oder frage nach Testdaten
- Renderer für mark-in-text nutzen zwingend splitUnits() aus src/domain/content/units.ts.
- Option-/Element-Reihenfolge wird zur Laufzeit deterministisch gemischt (Seed: itemId + attemptIndex). Ausnahme: `payload.keepOrder: true` (Optionen benennen Bildbeschriftungen A–D), dann bleibt die Reihenfolge wie im Content.

## Screenshots
- Ein normaler Lauf (`npm run e2e`, einzelne Specs, `npm run screenshots`) schreibt Screenshots und Budget-JSON nach `tests/e2e/output/` (gitignored, in CI Artefakt `e2e-output`). Danach ist `git status` sauber.
- `PFADFINDER_UPDATE_SCREENSHOTS=1` nur bei einer bewussten UI-Änderung (sichtbare Oberfläche, Texte oder Layout-Budget): Dann schreiben die Specs ins versionierte `tests/e2e/screenshots/`. Committet werden nur die Dateien, die zur Änderung gehören, und der Abschlussbericht nennt sie. In CI wird der Schalter nie gesetzt
- Versionierte Screenshots entstehen nur aus einem Lauf mit Schalter, auch wenn ein Lauf ohne Schalter denselben Code hatte: nie Dateien aus `tests/e2e/output/` nach `tests/e2e/screenshots/` kopieren (Entscheidung Markus, 2026-10-21)
- Beispiel: `PFADFINDER_UPDATE_SCREENSHOTS=1 npx playwright test --project=layout einstieg-layout`

## Kinder-UX-Checkliste (vor jedem UI-Commit)
- [ ] Touch-Ziele ≥ 48 px, eine Aufgabe pro Screen, kein Scrollen innerhalb der Aufgabe (iPad quer und hoch)
- [ ] Kein rotes X, kein "Falsch", kein Countdown außerhalb des Probetests
- [ ] Jeder Text ≤ 2 Sätze, von einem Neunjährigen verständlich
- [ ] Vorlesen-Button vorhanden, wo Text zu lesen ist
- [ ] Fokus sichtbar, `alt` an Bildern, `prefers-reduced-motion` beachtet
- [ ] Funktioniert offline nach erstem Laden
- [ ] Ziffernblock bietet nur bei allowDecimal ein Komma an, nie einen Punkt.

## Definition of Done (je Aufgabe)
1. `npm run check` grün; nach UI-Änderungen lokal auch die Chromium-Smoke-Projekte (`npx playwright test --project=chromium-landscape --project=chromium-portrait`), nicht nur das Layout-Projekt
2. Betroffene Tests ergänzt/aktualisiert
3. `docs/PROGRESS.md`: Eintrag mit Datum, was gebaut, was offen, welche Entscheidungen getroffen, lokaler Teststatus (max. 10 Zeilen). Der CI-Status gehört nicht in PROGRESS, sondern in den Abschlussbericht: nach dem Push mit `gh run list --limit 1` lesen und als Link nennen, nie aus einem früheren Lauf übernehmen; kein eigener docs-Commit dafür. Ist `gh` nicht installiert oder nicht angemeldet: das melden, statt den Status zu raten
4. Commit-Message nach Conventional Commits (`feat:`, `fix:`, `content:`, `docs:`, `chore:`)
5. Abschlussbericht im Chat: Zusammenfassung (≤ 10 Zeilen), CI-Link, geänderte Dateien, offene Fragen, nächster sinnvoller Schritt – dieser Bericht wird extern reviewt

## Dependencies (Laufzeit, genehmigt)
react, react-dom, react-router (Library-Modus), zustand, dexie, zod, @dnd-kit/core, @dnd-kit/sortable, clsx

## Dependencies (Dev, genehmigt)
vite, @vitejs/plugin-react, typescript, tailwindcss, @tailwindcss/vite, vite-plugin-pwa, vitest, @testing-library/react, @testing-library/user-event, jsdom, @playwright/test, eslint, typescript-eslint, eslint-plugin-react-hooks, eslint-plugin-jsx-a11y, prettier, tsx, @types/react, @types/react-dom, @types/node, fake-indexeddb (dieselbe Repository-Contract-Suite läuft gegen Dexie: Indizes, Sortierung, Transaktionen), rollup-plugin-visualizer (`npm run analyze`: zeigt, welche Module in welchem Chunk landen; nur mit ANALYZE=1 aktiv, nie im normalen Build), wrangler (Cloudflare Workers Static Assets: `wrangler dev` prüft die Auslieferung lokal, `npm run deploy:preview` lädt eine Vorschau-Version hoch; Cloudflare baut bei Push auf main selbst, siehe docs/DEPLOY.md)

## Befehle
```
npm run dev              Vite Dev-Server
npm run check            lint + content:validate + test + build
npm run content:validate scripts/validate-content.ts
npm run test             Vitest
npm run e2e              Playwright
npm run build            Produktions-Build inkl. PWA und Bundle-Prüfung
npm run screenshots      Dev-Seiten in iPad quer/hoch → tests/e2e/output (mit PFADFINDER_UPDATE_SCREENSHOTS=1 → tests/e2e/screenshots)
npm run analyze          Build mit Modul-Treemap (bundle-stats.html) und Chunk-Größen
npm run deploy:preview   Build + Vorschau-Version bei Cloudflare (nur lokal, braucht wrangler login)
npm run icons            public/icon.svg → PNG-Icons in public/icons (RGB, ohne Alpha)
```
