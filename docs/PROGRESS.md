# PROGRESS

Neueste Einträge oben. Je Eintrag max. 10 Zeilen: Datum, was gebaut, was offen, Entscheidungen.

## 2026-10-11 – Aufgabe 2A: Aufräumen
- **Gebaut:** Upgrade auf Vite 8, React Router 7 (Paket `react-router`), Tailwind 4 CSS-first (`@tailwindcss/vite`, Tokens per `@theme`), Vitest 5, Playwright 1.63. Neue `.npmrc` mit `min-release-age=14`. Schema 1.0.1: `minSelect` = Anzahl richtiger Optionen. Doku nachgezogen (CLAUDE.md, ARCHITECTURE §2, PRODUCT §11).
- **Entscheidungen:** React Router 7 statt 8, weil 8 React 19 voraussetzt. vite-plugin-pwa bleibt 1.3, weil 2.0 jünger als 14 Tage ist. `react-router-dom` → `react-router`, `postcss`/`autoprefixer` → `@tailwindcss/vite` in der Dependency-Liste. `schemaVersion` bleibt `"1.0"` (nur Major.Minor).
- **Offen:** `npm audit` (dev): 1 Lücke in `source-map-js` (Build-Werkzeug). Der Fix 1.2.2 ist erst ab 14.10. installierbar.

## 2026-10-11 – Aufgabe 1: Projektgerüst
- **Gebaut:** Toolchain nach ARCHITECTURE.md §2/§3, Verzeichnisstruktur mit README-Stubs, Zod-Schemas für alle 9 Formate + ReadingText + Probetest, `validate-content.ts` (Schema, Ablageort, eindeutige IDs, textRef, assetId, Probetest-Regeln), 3 Beispiel-Items, CI, 90 Unit-Tests.
- **Entscheidungen:** Versionen: TS 5.9 (typescript-eslint unterstützt TS 7 noch nicht), ESLint 9 (jsx-a11y unterstützt ESLint 10 noch nicht), Zod 4. Objekte sind strikt (unbekannte Felder = Fehler). `niveauMix`/`bereichMix` sind Anzahlen, nicht Anteile. Probetest-Umfang 18–24 Items auch für Deutsch. `mark-in-text` zählt Einheiten mit `splitUnits()` (Wörter: Leerzeichen; Sätze: nach . ! ?). Die Lesetext-Liste `itemIds` muss zu den `textRef`s der Items passen.
- **Warnungen statt Fehler:** `wordCount` weicht um mehr als 10 Wörter ab; `order`-Item steht schon in Lösungsreihenfolge.
- **Offen:** @types/react, @types/react-dom, @types/node fehlten in CLAUDE.md und sind dort nachgetragen (bitte bestätigen). `npm audit` meldet Lücken in den festgelegten älteren Major-Versionen (Vite 5, Vitest 3, Tailwind 3, React Router 6). Es gibt noch keine Icons im Manifest. Schriftart Andika ist noch nicht eingebunden.
