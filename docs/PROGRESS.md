# PROGRESS

Neueste Einträge oben. Je Eintrag max. 10 Zeilen: Datum, was gebaut, was offen, Entscheidungen, CI-Status.

## 2026-10-12 – Karte nachgeschärft, Schriftregel als Fehler
- **Gebaut:** Schrift unter 22 im SVG-viewBox ist ein Fehler im Validator (CONTENT_SCHEMA 1.0.5; die Gegenprobe bricht ab). Karte: innere Höhenlinien 1 px (`non-scaling-stroke`), Farbe `line`, runde Ecken; Konturen 24 und 44 statt 14 und 28. Der Marker des aktuellen Niveaus hat immer einen Ring, auch wenn die Etappe schon erreicht ist (gefüllt plus Ring). `rs-strategien` heißt „Schreibtricks“ (einzeilig).
- **Entscheidungen:** Füllung und Ring sind zwei getrennte Zeichen: die Füllung für „erreicht“, der Ring für „hier bist du“. Damit sieht der aktuelle offene Marker auf der Karte anders aus als der aktuelle Wegstrich im Item-Screen (dort Rand ohne Abstand). Der Name „Rechtschreib-Tricks“ aus Teil 0 ist damit ersetzt.
- **Offen:** Durch das kleinere Plateau ragen längere Namen in den Hang; der Halo in Plateaufarbe zeigt dort einen leichten hellen Schein (am deutlichsten bei „Zahlen und Rechnen“ quer).
- **CI:** [CI #38249249951](https://github.com/1701/Pfadfinder/actions/runs/38249249951) grün (a124b71…91ad144); 477 Tests, e2e 19 bestanden, 2 übersprungen (WebKit offline). Lokal grün: `npm run check`, `npm run e2e:chromium` (15/15).

## 2026-10-12 – Schema 1.0.4: keepOrder, Bildregeln
- **Gebaut:** Neues optionales Feld `payload.keepOrder` für `single-choice`/`multi-choice`. SingleChoice behält damit die Reihenfolge, ein Test prüft fünf Attempts. `content:validate` warnt, wenn alle Optionen nur Bildbeschriftungen sind und `keepOrder` fehlt, und wenn Schrift im SVG kleiner als 22 ist. CONTENT_SCHEMA 1.0.4 (§4.1/4.2, §7: assetAlt verrät die Lösung nicht, Schrift ≥ 22), CLAUDE.md und Skill nennen die Ausnahme vom Mischen.
- **Entscheidungen:** 1.0.4 statt 1.1, obwohl ein Feld dazukommt. Die Versionsregel im Kopf nennt jetzt optionale Felder, mit denen alle bisherigen Items gültig bleiben, als Patch. Die Schriftregel ist vorerst eine Warnung, weil `rf-spiegel-1` (18) und `rf-bauplan-1` (20) sie noch verletzen.
- **Nachtrag Patch:** `raum-form-patch.zip` ist eingespielt: `keepOrder` bei den drei A–D-Items, neutrale `assetAlt` (keine Zählhilfe, keine gefragte Eigenschaft), SVG-Schrift 22–26. `content:validate`: 0 Fehler, 0 Warnungen; Layout-Test grün in 4 Viewports. CI: [CI #38223737536](https://github.com/1701/Pfadfinder/actions/runs/38223737536) grün (92a9a23).
- **Offen:** Die Schriftregel könnte jetzt ein Fehler statt einer Warnung sein (Entscheidung Markus).
- **CI:** [CI #38221352735](https://github.com/1701/Pfadfinder/actions/runs/38221352735) grün (c02e35d…3da7ed7); 477 Tests, e2e 19 bestanden, 2 übersprungen (WebKit offline). Lokal grün: `npm run check`.

## 2026-10-12 – Aufgabe 5, Teil B: Expeditionskarte
- **Gebaut:** Startseite ist die Karte (`src/ui/map`): 9 Gebiete auf zwei Inseln, zwei Layouts (quer nebeneinander, hoch untereinander), Geometrie nur in `geometry.ts`. Jedes Gebiet ist ein SVG-`<a>` („Zahlen und Rechnen, Niveau 2“), unerforschte sind gestrichelt und ohne Tab-Stopp, eine Legendenzeile erklärt das einmal. Tagesziel mit Wegstrichen. `mapRegionState`, `todayProgress` (Zod-frei, `domain/progress`). Entdeckungen beim Aufstieg in `Collectibles`. Fortschritt kommt aus dem lazy Chunk `map-progress`; Startseite 273 kB ohne Zod/Dexie. Liste unter `/?liste`, Vorschau `/dev/karte`.
- **Entscheidungen:** Die Höhenlinien laufen in festem Abstand parallel zur Küste statt verkleinert zu einem Gipfelpunkt. Mit Gipfelpunkt kreuzten die Namen die Linien, und für Hügel plus Name übereinander sind die Gebiete zu klein. Fortschritt wächst von der Küste nach innen, der Name steht auf dem Gipfel-Plateau, mit Halo in dessen Farbe. Offene Gebiete haben ihren Umriss in `ink-muted`, weil `line-strong` auf `land` unter 3 : 1 liegt. Neue Tokens `land`, `land-soft`, `water` (ein Test verbietet sie außerhalb der Karte und `correct`/`notyet` auf der Karte). Der Abschluss zählt mit `todayProgress`; damit ist der Mitternachtspunkt aus Teil 0 erledigt.
- **Offen:** Bei „Rechtschreib-“ (quer) reicht der Name über den Plateaurand hinaus, der Halo deckt die Höhenlinie dort ab. Die erste Etappe ist nur ein schmaler Streifen an der Küste und deshalb weniger auffällig als eine große Fläche.
- **CI:** [CI #38219419480](https://github.com/1701/Pfadfinder/actions/runs/38219419480) grün (49675bc…755ee12); 473 Tests, e2e 19 bestanden, 2 übersprungen (WebKit offline). Lokal grün: `npm run check`, `npm run e2e:chromium` (15/15).

## 2026-10-12 – Zwischenschritt: Batch 2 raum-form und Bilder
- **Gebaut:** 21 Items und 7 SVGs eingespielt; 15 Items haben einen Renderer, „Formen und Raum“ ist damit übbar. `ContentAsset` bettet SVGs inline ein (`?raw`); `assetAlt` wird zum Namen des Bildes und vor dem Prompt vorgelesen. `content:validate` lehnt SVGs mit Skripten, Event-Attributen, Verweisen, festen Farben oder fremden Schriften ab (Gegenprobe schlägt an). CONTENT_SCHEMA 1.0.3: §7 „Bilder“. Der Layout-Test prüft jetzt alle übbaren Items aus allen Dateien (36 × 3 Zustände × 4 Viewports) und macht einen Screenshot `layout-bild-*`.
- **Entscheidungen:** Bilder bis zum Seitenverhältnis 2 : 1 stehen neben dem Text, breitere darunter, sonst passen Zahleneingabe und Bild nicht auf 1024×660 (bis zu 107 px zu viel). Höhe: quer 200 px, auf kurzen Bildschirmen `100dvh − 516px` (144 px bei 660 px Höhe), hoch 240 px.
- **Offen:** Optionen „A–D“, die auf Bildbeschriftungen zeigen, werden gemischt (z. B. C, B, D, A). Bei 144 px Bildhöhe sind „Figur“ und „Spiegelachse“ in `rf-spiegel-1` etwa 15 px groß, „Bauplan“ etwa 14 px. Die Bildbeschreibungen von `m-rf-1-005` und `m-rf-1-002` verraten beim Vorlesen fast die Lösung.
- **CI:** [CI #38216479314](https://github.com/1701/Pfadfinder/actions/runs/38216479314) grün (73ab7b4…f3761a4); 426 Tests, e2e 14 bestanden, 2 übersprungen (WebKit offline). Lokal grün: `npm run check`, `npm run e2e:chromium` (10/10).

## 2026-10-12 – Aufgabe 5, Teil 0: Nacharbeiten
- **Gebaut:** Die Tagesgrenze gilt jetzt ab der letzten Antwort statt ab `startedAt` (`lastActivity`): Beginn 23:55 und Antwort 00:03 heißt, dass die Session um 00:10 fortgesetzt wird. Die misconception steht in `ink-muted`. Nach dem Prüfen ist der Ziffernblock gedimmt (`line` + `ink-muted`). Fokus, den die App nach einem Tipp selbst setzt, zeigt keinen Ring (`focusQuietly`); nach einer Taste ist er wieder sichtbar. In Stimulus und Prompt bleibt eine Zahl mit dem folgenden Wort zusammen (`keepNumbersWithWords`, auch „5 €“). CONTENT_SCHEMA 1.0.2: §1 nennt `manifest.json` als erzeugte Datei.
- **Entschieden (offene Punkte aus 4C/4F):** Der Name „Rechtschreib-Tricks“ bleibt. Die Wegstriche im Fortschritt bleiben. Feedback hat bis zu 3 Sätze Erklärung plus 1 Satz misconception. WebKit läuft nur extern in CI, nicht lokal.
- **Befund:** Chromium zeigt den Ring nach einem Tipp auch ohne die Korrektur nicht (Gegenprobe lokal). Der neue e2e-Test schützt die Korrektur also nur in den WebKit-Projekten in CI.
- **Offen:** Eine über Mitternacht fortgesetzte Session endet mit „Heute geschafft: 10 Fundstücke“, obwohl ein Teil davon am Vortag beantwortet wurde.
- **CI:** [CI #38212964128](https://github.com/1701/Pfadfinder/actions/runs/38212964128) grün (9d14a57…5ff7366); e2e 14 bestanden, 2 übersprungen (WebKit offline), der Fokustest auch in WebKit grün. Lokal grün: `npm run check` (418 Tests), `npm run e2e:chromium`.

## 2026-10-12 – Aufgabe 4F: Bundle der Startseite
- **Messung** (`npm run analyze`, minifiziert/gzip): Das Hauptbundle hatte vorher **542,7 kB / 167,4 kB**, jetzt **262,5 kB / 82,8 kB**. Der neue lazy Chunk `practice-route` hat 226,1 kB / 69,1 kB, die Content-Chunks je Bereich sind unverändert (z. B. 18,5 kB).
- **Befund:** Der Content lag nicht im Hauptbundle. Hineingezogen wurden aber Zod (Startseite parste alle Items), Dexie (Store in `main.tsx`) und der Daten-Router von React Router.
- **Gebaut:** `validate-content.ts` schreibt `content/manifest.json` (je Bereich die aktiven Items je Format und Niveau sowie die Text-IDs; in CI ist ein veraltetes Manifest ein Fehler, der pre-commit verlangt das Stagen). Die Startseite liest nur das Manifest. Die Üben-Route mit Store, Dexie, Zod und Renderern ist ein lazy Chunk. React Router läuft deklarativ statt mit `createBrowserRouter` (−55 kB). `check-bundle.ts` prüft ein Budget von 300 kB und dass die Startseite ohne Zod und Dexie auskommt; die Gegenprobe schlägt an.
- **Offen:** CONTENT_SCHEMA §1 nennt `manifest.json` nicht (das Manifest ist erzeugt, kein Item-Vertrag); soll es dort stehen, wäre das Version 1.0.2.
- **CI:** [CI #38211577488](https://github.com/1701/Pfadfinder/actions/runs/38211577488) grün (gemeinsamer Lauf für 6183ebc…c764cde, kein eigener Lauf je Commit); e2e 10 bestanden, 2 übersprungen (WebKit offline). Lokal grün: `npm run check`, `npm run e2e:chromium` (8/8, inkl. offline).

## 2026-10-12 – Aufgabe 4E: Vorlesen für Rückmeldung, Start und Abschluss
- **Gebaut:**
  - Das FeedbackPanel hat denselben VorlesenButton wie das Item; ein zweiter Tipp stoppt. Vorgelesen werden Urteil, Erklärung und misconception (nur bei „noch nicht“).
  - Start- und Abschluss-Screen lesen ihre Überschrift vor.
  - Neue reine Funktion `speakable()`: „4 735“ → „4735“, „6 · 40“ → „6 mal 40“, „84 : 4“ → „84 geteilt durch 4“, „−“, „+“, „=“ als Wörter. Sie gilt fürs Feedback und für Items ohne `readAloud`.
- **Entscheidungen:** Operatoren werden nur mit Leerzeichen auf beiden Seiten ersetzt, sodass „8:30 Uhr“ und „20-Euro-Schein“ bleiben, wie sie sind. Ein `readAloud` aus dem Content wird nie verändert. Der Layout-Test prüft wieder alle Items in 4 Viewports, auch mit dem Button im Feedback.
- **CI:** [CI #38211577488](https://github.com/1701/Pfadfinder/actions/runs/38211577488) grün (gemeinsamer Lauf für 6183ebc…c764cde, kein eigener Lauf je Commit). Lokal grün: `npm run check`, `npm run e2e:chromium` (8/8).

## 2026-10-12 – Aufgabe 4D: Tagesgrenze der Übungssession
- **Gebaut:** `planSessionStart` (rein, `domain/practice`): Eine offene Übungssession wird nur am selben Kalendertag (lokale Zeit, gemessen an `startedAt`) fortgesetzt. Offene Sessions früherer Tage schließt `startPractice` beim Start mit `endedAt` = jetzt und `goalReached` = false. Tests: Domain-Fälle und ein Store-Durchlauf mit Uhr über Mitternacht (23:55 → 00:01 Berlin).
- **Entscheidungen:** Geschlossen werden alle offenen Sessions früherer Tage, egal welcher Bereich. Offene Sessions von heute in anderen Bereichen bleiben offen.
- **CI:** [CI #38211577488](https://github.com/1701/Pfadfinder/actions/runs/38211577488) grün (gemeinsamer Lauf für 6183ebc…c764cde, kein eigener Lauf je Commit). Lokal grün: `npm run check`.

## 2026-10-11 – Aufgabe 4C: Üben-Flow (Einfachwahl, Zahleneingabe)
- **Gebaut:** Komponenten Button, ZiffernBlock, VorlesenButton, FeedbackPanel, Fortschritt. Format-Registry mit SingleChoice und NumberInput. Screens: Start (Liste der übbaren Bereiche), `/ueben/:fach/:bereich` (ItemScreen + Abschluss „Heute geschafft: 10 Fundstücke“). Dev-Seite `/dev/item/:id`. Der Store kommt über Context, die Repos sind Dexie. Tests: 13 Testing-Library-Dateien; Playwright `ueben.spec` (Flow, Neuladen, offline) und `layout.spec` (alle Items × 3 Zustände × 4 Viewports).
- **Entscheidungen:** „Prüfen“ wird an derselben Stelle zu „Weiter“. Der Antwortbereich ist oben ausgerichtet, damit beim Prüfen nichts springt. Für 1024×660 wurden Abstände gekürzt; Optionen und Tasten sind 48 px hoch, die Schrift blieb gleich, „misconception auf Tipp“ war nicht nötig (knappster Fall: 46 px Luft). Zahlengruppen („10 000“) werden auf dem Bildschirm nie umbrochen. Neue Tokens: `spacing-action`, `spacing-key`. Manifest-Farben = Tokens. ARCHITECTURE §6: `attemptIndex` + `onChange(… | null)`.
- **Offen:** WebKit läuft lokal auf Arch nicht (fehlende Bibliotheken: flite, libbacktrace, ICU 74, libxml2.so.2; kein Docker-Zugriff), nur in CI. Das Haupt-Bundle hat 541 kB (Vite-Warnung). Die Wegstriche im Fortschritt zur Entscheidung (siehe Bericht). Bereichsname „Rechtschreib-Tricks“ prüfen.
- **CI:** [CI #38211577488](https://github.com/1701/Pfadfinder/actions/runs/38211577488) grün (gemeinsamer Lauf für 6183ebc…c764cde, kein eigener Lauf je Commit). Der e2e-Job lief mit Chromium und WebKit: 10 bestanden, 2 übersprungen (Offline-Test, den Playwright-WebKit nicht unterstützt); der WebKit-Smoke-Flow ist in beiden iPad-Formaten grün. Lokal grün: `npm run check` (387 Tests), `npm run e2e:chromium` (8/8).

## 2026-10-11 – Aufgabe 4A: Persistenz und Session-Store
- **Gebaut:** Dexie-DB `pfadfinder` v1 mit 7 Tabellen (Indizes `learnerId`, `[learnerId+bereich]`, `[learnerId+dueAt]`). Dazu 7 Repository-Interfaces mit einer Dexie- und einer In-Memory-Implementierung; dieselbe Contract-Suite läuft gegen beide (Dexie über fake-indexeddb). Neu: `domain/practice` (`recordPracticeAnswer`), `practice.ts` (laden → Domain → speichern), `backup.ts` (Export/Import ersetzt alles in einer Transaktion), Zustand-Store `session` und Content-Loader per `import.meta.glob`. Getestet: eine 10er-Session mit echtem Content, Fortsetzen nach Pause, Fehlerkiste am Folgetag.
- **Entscheidungen:** Übbar sind nur Items mit Renderer, ein Bereich ab `MIN_ITEMS_FOR_PRACTICE = 10`. Eine Session wird erst mit der ersten Antwort gespeichert. Eine offene Session wird fortgesetzt, wenn alle ihre Attempts im gewählten Bereich liegen; der Bereich wird aus den Attempts abgeleitet, das Schema bleibt gleich. Eine falsche Übungsantwort setzt einen vorhandenen Fehlerkiste-Eintrag auf Stufe 1 zurück. Begriffe: Fundstück = bearbeitetes Item, Entdeckung = Sammelobjekt (PRODUCT §6).
- **Offen:** Eine offene Session von gestern wird heute fortgesetzt und zählt dann ins „Heute geschafft“.
- **CI:** [CI #38211577488](https://github.com/1701/Pfadfinder/actions/runs/38211577488) grün (gemeinsamer Lauf für 6183ebc…c764cde, kein eigener Lauf je Commit). Lokal grün: `npm run check` (333 Tests).

## 2026-10-11 – Aufgabe 4 (Teil 0): pre-commit
- **Gebaut:** `.githooks/pre-commit` prüft gestagete Dateien mit ESLint (`*.ts`, `*.tsx`, `*.js`) und `prettier --check`, danach wie bisher `content:validate`. Von Hand getestet: ein Lint-Fehler und ein Format-Fehler brechen den Commit ab.
- **Entscheidungen:** Geprüft wird die Datei im Arbeitsverzeichnis, nicht der gestagete Stand (steht im Hook). Ab jetzt nennt jeder Eintrag den CI-Status (CLAUDE.md DoD 3).
- **CI:** [CI #38175651091](https://github.com/1701/Pfadfinder/actions/runs/38175651091) grün.

## 2026-10-11 – Aufgabe 4B: Design-Tokens
- **Gebaut:** `tokens.css` nach Token-Plan v1 (`@theme static`; Tailwind-Standardfarben, -radien und -schatten entfernt). Andika 7.000 Regular und Bold mit OFL.txt unter `public/fonts/andika/`. Router mit `/dev/tokens` nur im Dev-Build. Tests: Kontraste aus `tokens.css` (AA), keine Hex- und Pixelwerte in `src/ui` und `src/app`. `check-bundle.ts` nach dem Build prüft Dev-Seiten und Schrift-Precache. `npm run screenshots`.
- **Entscheidungen:** Eine gewählte Option bekommt `signal-soft` + `signal-edge`, volles Gelb gibt es nur für Prüfen/Weiter. Die Schrift ist einmalig heruntergeladen und committet; der Build geht nie ins Netz (Archiv SHA-256 `88ba6ea4…c070`). Keine Schatten. Keine zweite Schriftfamilie. `.claude/` ist von Prettier ausgenommen (seit dem Skill-Commit war `check` unbemerkt rot).
- **Palette:** Wegmarke-Gelb und Seeblau, von Markus über die Farbprobe bestätigt (Alternativen waren Ocker/Sonnengelb und Fjordblau/Petrol).
- **Offen:** Andika ist nicht verkleinert (≈ 290 KB je Schnitt); wer sie verkleinert, muss sie nach OFL umbenennen.

## 2026-10-11 – Aufgabe 3C: Scheduler
- **Gebaut:** `src/domain/scheduler`: `seededShuffle` (xmur3 + mulberry32) mit `presentationSeed(itemId, attemptIndex)`, `pickNext`, `enqueueReview`, `onReviewResult` und `isReviewDue`, außerdem `buildCheck` und `nextCheckItem`. 47 Tests.
- **Entscheidungen:** `pickNext` braucht zusätzlich `now`, `reviewsInSession` (für max. 3) und `seed`; das Ergebnis enthält `source: 'review' | 'practice'`. Fallback-Reihenfolge: gleiches Niveau ungesehen → ±1 ungesehen → Wiederholung (nicht das letzte Item) → jedes Niveau. `null` kommt nur, wenn der Bereich leer ist. Bei Reviews gilt die 20er-Sperre nicht. `enqueueReview` bekommt `learnerId` als ersten Parameter. Ein Review ist ab Beginn des Fälligkeitstags fällig, gemessen in lokaler Zeit. Ein 0,5 zählt bei Reviews als „noch nicht“. Der Check ist ein Plan plus `nextCheckItem`, im Rundlauf über die Bereiche (die ersten Items sind alle Niveau 1). Fehlt eine Stufe, wird das nächstgelegene Niveau genommen, bei Gleichstand das leichtere.
- **Offen:** Beim Lesen sollten die Check-Items aus demselben Lesetext kommen; das wird erst mit den Lesetexten relevant.

## 2026-10-11 – Aufgabe 3B: Learner-Modell und Export
- **Gebaut:** `src/domain/learner`: Zod-Schemas für Learner, Attempt, ReviewEntry, Session, ProbetestRun und Collectibles; `AttemptMode` ist aus `mastery` hierher umgezogen. `serialize(data, exportedAt)` erzeugt ExportFile v1, `parseImport(json)` liefert `{ ok, data } | { ok: false, errors[] }`. 18 Tests, darunter ein Roundtrip.
- **Entscheidungen:** `Attempt.answer` wird gegen das Answer-Schema des jeweiligen Formats geprüft. Der Import prüft zusätzlich Bezüge: alle Daten gehören zu einem Learner, IDs sind eindeutig, Mastery gibt es je Bereich und Fehlerkiste-Einträge je Item nur einmal, Sessions und Probetest-Läufe verweisen nur auf vorhandene Attempts. Die Fehlermeldungen sind deutsch, weil Eltern sie sehen. Eine Datei aus einer neueren App-Version bekommt einen eigenen Hinweis. Migrationen gibt es erst, wenn eine Version 2 existiert. ESLint: Variablen mit `_`-Präfix gelten als absichtlich ungenutzt.

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
