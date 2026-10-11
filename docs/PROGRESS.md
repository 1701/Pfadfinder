# PROGRESS

Neueste Einträge oben. Je Eintrag max. 10 Zeilen: Datum, was gebaut, was offen, Entscheidungen.

## 2026-10-11 – Aufgabe 3A: React 19, Doku, Content
- **Gebaut:** React 19.3 und React Router 8.4. Das ist möglich, weil `@dnd-kit/core` und `@dnd-kit/sortable` nur `react >=16.8` verlangen. `engines.node` steht auf ≥ 22.22 (Vorgabe von React Router 8). Ergänzt: PRODUCT §5.4 „Einstiegscheck nur Auto-Check“, CLAUDE.md Ziffernblock-Regel. `zahlen-operationen.json` mit 21 Items eingespielt, Validierung grün ohne Änderungen.
- **Offen:** Mathe Zahlen & Operationen hat 9/8/4 Items auf Niveau I/II/III; Ziel bei 30 Items ist 12/12/6.

## 2026-10-11 – Aufgabe 2C: Mastery
- **Gebaut:** `src/domain/mastery`: `updateMastery(state, result)` → `{ state, transition }`, `initialMasteryFromCheck()`, `checkLadderNiveau()` (liefert auch das Niveau des nächsten Check-Items) und `masteryStateSchema`. 29 Tests.
- **Entscheidungen:** Neben `probetest` lassen auch `check`-Attempts Mastery unverändert, damit das Fenster nach dem Einstiegscheck leer startet (ARCHITECTURE §5). Auf der Leiter steigt nur `true`, ein 0,5 bleibt stehen. Eine Rückmeldung `mastered` gibt es nur einmal; dabei wird das Fenster nicht geleert. Bereiche ohne Check-Ergebnis starten auf Niveau 1. Ob es 2–3 Items je Bereich sind, prüft die Check-Zusammenstellung, nicht diese Funktion. ARCHITECTURE §4: `window` ist jetzt `(0 | 0.5 | 1)[]`. PRODUCT §5.5: Präzisierungen eingetragen.
- **Offen:** `AttemptMode` liegt vorerst in `mastery` und zieht nach `learner` um, sobald es das Attempt-Modell gibt.

## 2026-10-11 – Aufgabe 2B: Antwortprüfung
- **Gebaut:** `src/domain/evaluation`: `evaluate(item, answer)` für alle 9 Formate mit `detail` fürs Feedback. Dazu Answer-Schemas (Zod) mit `parseAnswer()`, `parseGermanNumber()` und `correctnessScore()`. 72 Tests.
- **Entscheidungen:** Auswertung über eine Tabelle je Format, ohne Format-Switch im aufrufenden Code. `multi-choice` und `find-error` prüfen Mengen, doppelte Einträge sind egal. `match` ist falsch, sobald es ein zusätzliches Paar gibt oder der Distraktor benutzt wird. `parseGermanNumber` gibt `null` zurück für leere, unvollständige (`3,`) und mehrdeutige (`1.5`) Eingaben; der Punkt gilt nur in Dreiergruppen als Tausendertrenner. `short-answer`: Bewertung 1 → `true`, 0 → `false`, 0,5 → `0.5`; der Freitext ist optional.

## 2026-10-11 – Aufgabe 2A: Aufräumen
- **Gebaut:** Upgrade auf Vite 8, React Router 7 (Paket `react-router`), Tailwind 4 CSS-first (`@tailwindcss/vite`, Tokens per `@theme`), Vitest 5, Playwright 1.63. Neue `.npmrc` mit `min-release-age=14`. Schema 1.0.1: `minSelect` = Anzahl richtiger Optionen. Doku nachgezogen (CLAUDE.md, ARCHITECTURE §2, PRODUCT §11).
- **Entscheidungen:** React Router 7 statt 8, weil 8 React 19 voraussetzt. vite-plugin-pwa bleibt 1.3, weil 2.0 jünger als 14 Tage ist. `react-router-dom` → `react-router`, `postcss`/`autoprefixer` → `@tailwindcss/vite` in der Dependency-Liste. `schemaVersion` bleibt `"1.0"` (nur Major.Minor).
- **Offen:** `npm audit` (dev): 1 Lücke in `source-map-js` (Build-Werkzeug). Der Fix 1.2.2 ist erst ab 14.10. installierbar.

## 2026-10-11 – Aufgabe 1: Projektgerüst
- **Gebaut:** Toolchain nach ARCHITECTURE.md §2/§3, Verzeichnisstruktur mit README-Stubs, Zod-Schemas für alle 9 Formate + ReadingText + Probetest, `validate-content.ts` (Schema, Ablageort, eindeutige IDs, textRef, assetId, Probetest-Regeln), 3 Beispiel-Items, CI, 90 Unit-Tests.
- **Entscheidungen:** Versionen: TS 5.9 (typescript-eslint unterstützt TS 7 noch nicht), ESLint 9 (jsx-a11y unterstützt ESLint 10 noch nicht), Zod 4. Objekte sind strikt (unbekannte Felder = Fehler). `niveauMix`/`bereichMix` sind Anzahlen, nicht Anteile. Probetest-Umfang 18–24 Items auch für Deutsch. `mark-in-text` zählt Einheiten mit `splitUnits()` (Wörter: Leerzeichen; Sätze: nach . ! ?). Die Lesetext-Liste `itemIds` muss zu den `textRef`s der Items passen.
- **Warnungen statt Fehler:** `wordCount` weicht um mehr als 10 Wörter ab; `order`-Item steht schon in Lösungsreihenfolge.
- **Offen:** @types/react, @types/react-dom, @types/node fehlten in CLAUDE.md und sind dort nachgetragen (bitte bestätigen). `npm audit` meldet Lücken in den festgelegten älteren Major-Versionen (Vite 5, Vitest 3, Tailwind 3, React Router 6). Es gibt noch keine Icons im Manifest. Schriftart Andika ist noch nicht eingebunden.
