# ARCHITECTURE.md – Pfadfinder

Status: v1.0 · gilt für das MVP · Erweiterungspunkte in Abschnitt 9

## 1. Grundsatz

Client-only PWA. Kein Backend, keine Datenbank außerhalb des Geräts, kein Netzwerkzugriff nach dem Laden. Alles, was fachlich ist (Mastery, Scheduling, Probetest-Auswertung), lebt in reinen TypeScript-Funktionen ohne React-Abhängigkeit und ist unit-getestet. React ist nur Darstellung.

## 2. Stack (festgelegt)

Versionen: aktuelle stabile Majors, Stand siehe `package.json`.

| Zweck | Wahl | Begründung |
|---|---|---|
| Build | Vite + TypeScript strict | schnell, PWA-Plugin ausgereift |
| UI | React, React Router (Library-Modus, kein Framework-Modus) | Claude-Code-Stärke, großes Ökosystem |
| Styling | Tailwind CSS (CSS-first, Tokens per `@theme`) | schnell iterierbar, Design-Tokens zentral |
| State | Zustand | klein, kein Boilerplate; Persistenz über eigenen Adapter |
| Persistenz | Dexie (IndexedDB) | strukturiert, migrierbar, Export/Import als JSON |
| Validierung | Zod | Schema aus `CONTENT_SCHEMA.md` 1:1 als Zod-Types; Build-Zeit-Validierung |
| PWA/Offline | vite-plugin-pwa (Workbox) | Precache aller Content-Dateien |
| Drag & Drop | @dnd-kit/core | Touch-tauglich, zugänglich |
| Vorlesen | Web Speech API (SpeechSynthesis, `de-DE`) | kein externer Dienst; Fallback: Button ausgeblendet |
| Druck | Print-Stylesheet + `window.print()` | PDF via Browser; keine PDF-Lib im MVP |
| Tests | Vitest + Testing Library; Playwright (3 Smoke-Flows) | Domain 100 % unit, UI pro Format ein Test |
| Lint | ESLint (typescript-eslint, react-hooks, jsx-a11y), Prettier | |
| CI | GitHub Actions: lint → content-validate → test → build | Content-Fehler brechen den Build |
| Hosting | Cloudflare Workers mit Static Assets, gebaut von Workers Builds bei Push (`wrangler.jsonc`, `docs/DEPLOY.md`) | kostenlos, keine Betriebslast, Vorschau-URL je Branch |

Keine weiteren Laufzeit-Dependencies ohne Eintrag in `CLAUDE.md` Abschnitt "Dependencies".

## 3. Verzeichnisstruktur

```
pfadfinder/
  content/                     siehe CONTENT_SCHEMA.md (kein Code)
  docs/                        PRODUCT.md, ARCHITECTURE.md, CONTENT_SCHEMA.md, CHANGELOG.md, PROGRESS.md
  scripts/
    validate-content.ts        lädt alle content/**/*.json, prüft gegen Zod, prüft Referenzen (textRef, assetId, probetest.itemIds)
  src/
    domain/                    REIN, kein React, kein Dexie
      content/                 Zod-Schemas, Typen, Loader-Interfaces
      mastery/                 Mastery-Score, Niveaulogik (PRODUCT.md 5.5)
      scheduler/               Item-Auswahl fürs Üben, Fehlerkiste-Intervalle
      probetest/               Zusammenstellung, Timer-Modell, Auswertung
      evaluation/              Antwortprüfung je Format (pure)
      learner/                 Learner-Modell, Export/Import, Migrationen
      practice/                ein Übungsschritt: Antwort → Attempt, Mastery, Fehlerkiste, Session
      check/                   Einstiegscheck: Antwort → Attempt (mode "check"), Abschluss → Startniveaus, Entdeckungen, Session
      progress/                Karte und Tagesziel: mapRegionState, todayProgress (Zod-frei, Startseite)
      presentation/            Reihenfolge auf dem Bildschirm je Format (gemischt) und Vorlesetext
      parents/                 Rechenfrage vor dem Eltern-Bereich
    data/                      Dexie-DB, Repositories (Dexie + In-Memory), Anwendungsdienste, Zustand-Stores
    content-runtime/           lazy Loader für content/*.json (per Bereich)
    ui/
      formats/                 ein Renderer je Format, registriert in formats/registry.ts
      screens/                 Karte, Einstiegscheck, Üben, Fehlerkiste, Probetest, Auswertung, Eltern
      components/              Buttons, Feedback-Panel, Ziffernblock, Timer, Vorlesen-Button
      map/                     SVG-Expeditionskarte
      theme/                   Tokens (Farben, Typo, Abstände), Print-Styles
    app/                       Router, Providers, PWA-Registrierung
  tests/
    domain/                    Vitest
    e2e/                       Playwright
```

## 4. Domänenmodell (persistiert in IndexedDB)

```ts
Learner        { id; name?: string; createdAt; settings: { readAloud: boolean; bundesland: "BW" } }
Attempt        { id; learnerId; itemId; fach; bereich; niveau; format; correct: boolean | 0.5; answer: unknown;
                 durationMs; mode: "check" | "practice" | "review" | "probetest"; at: ISO }
MasteryState   { learnerId; fach; bereich; niveau: 1|2|3; window: (0 | 0.5 | 1)[] /* letzte 8, Kurzantwort "teils" = 0.5 */; mastered: boolean; updatedAt }
ReviewEntry    { learnerId; itemId; dueAt: ISO; stage: 1 | 2 | "done" }         // Fehlerkiste: +1 Tag, +3 Tage
Session        { id; learnerId; mode; startedAt; endedAt?; attemptIds: string[]; goalReached: boolean }
ProbetestRun   { id; learnerId; probetestId; startedAt; status: "running"|"submitted"|"aborted"; endedAt?; endReason?: "submit"|"time"|"leave"|"expired";
                 currentIndex; answers: Record<itemId, Draft>; itemMs; attemptIndex; ratings: Record<itemId, 1|0.5|0>; attemptIds;
                 result?: { byBereich: Record<Bereich, {solved, total, pending}>; total: {solved, total, pending} } }   // kein Prozent (2026-10-15)
Collectibles   { learnerId; unlocked: string[] }                                 // Entdeckungen je gemeisterter Etappe
PostponedOffer { fach; at: ISO }                                                  // "Später" beim Einstieg-Angebot, je Fach; geräteweit, nicht im Export (Dexie v2)
```

Export-Format: `{ version: "2", exportedAt, learner, attempts, mastery, reviews, sessions, probetestRuns, collectibles }` als JSON-Datei. Import validiert mit Zod und migriert nach Versionsnummer: v1 → v2 (2026-10-15) gibt jedem Probetest-Lauf einen Status (mit `submittedAt` „submitted“, sonst „aborted“/„expired“), leere Entwürfe und ein Ergebnis ohne Prozent mit abgerundeten gelösten Items. Das Export-Format ist das spätere Sync-Format (Roadmap v2).

## 5. Kernabläufe

**Üben.** `scheduler.pickNext(bereich, masteryState, recentItemIds, pool)` → Item auf aktuellem Niveau, nicht in den letzten 20 gesehen, Formatwechsel bevorzugt. Nach Antwort: `evaluation.check(item, answer)` → `mastery.update(state, correct)` → bei falsch `scheduler.enqueueReview(itemId, now)`; gebündelt in `practice.recordPracticeAnswer`. Session-Ziel 10 Items, danach Abschluss-Screen. Gezogen werden nur Items mit registriertem Renderer; ein Bereich ist erst ab `MIN_ITEMS_FOR_PRACTICE` (10) solcher Items übbar. **Tagesgrenze:** Eine offene Session (ohne `endedAt`) wird nur am Kalendertag ihrer letzten Aktivität fortgesetzt (Zeit des neuesten Attempts, ohne Attempts `startedAt`; lokale Zeit des Geräts), und nur, wenn alle ihre Attempts im gewählten Bereich liegen. Wer um 23:55 beginnt und um 00:03 noch antwortet, setzt um 00:10 dieselbe Session fort. Offene Sessions, deren letzte Aktivität an einem früheren Tag lag, schließt `practice.planSessionStart` beim Start eines Bereichs (`endedAt` = jetzt, `goalReached` = false), danach beginnt eine neue. Eine Session wird erst mit ihrer ersten Antwort gespeichert. **Fortsetzen oder neu anfangen** (seit 2026-10-14): Gibt es eine solche Session von heute mit Antworten, zeigt der Store den Status `choosing` (`ui/screens/UebenWahl`). „Fortsetzen“ macht dort weiter; „Neu anfangen“ (`data/practice.restartPractice`) schließt sie mit `practice.closeSession` (`endedAt` = jetzt, `goalReached` = false, ohne Abschluss-Screen) und beginnt eine neue Runde mit `SESSION_GOAL` Items über `pickNext`. Attempts, Mastery, Fehlerkiste und Entdeckungen bleiben, das Tagesziel springt also nicht zurück. **Entdeckungen:** Ein Aufstieg von Niveau n schreibt `"<bereich>:<n>"`, „gemeistert“ schreibt `"<bereich>:3"` in `Collectibles.unlocked`; Einträge werden nie gelöscht, so bleibt eine erreichte Etappe auf der Karte gefüllt, auch wenn das Niveau sinkt. **Tagesziel:** `todayProgress(attempts, now)` zählt `practice`- und `review`-Attempts des lokalen Kalendertags, höchstens 10; Karte und Abschluss-Screen zeigen dieselbe Zahl.

**Startseite und Content-Laden.** `scripts/validate-content.ts` erzeugt bei gültigem Content `content/manifest.json`: je Bereich die Zahl der aktiven Items (ohne `retired`) je Format und Niveau sowie die Text-IDs, dazu die Probetest-IDs je Fach (seit 1.0.9). Die Datei ist erzeugt, nicht handgeschrieben, und kein Teil des Item-Vertrags (CONTENT_SCHEMA). Ein Test vergleicht sie mit dem Content, in CI ist ein veraltetes Manifest ein Fehler, und der pre-commit-Hook verlangt das Stagen. Die Startseite ist die Karte (`src/ui/map`, Liste als Fallback unter `/?liste`). Sie liest das Manifest und danach aus dem lazy Chunk `map-progress` (Dexie) Mastery, Entdeckungen und die Attempts für das Tagesziel; `mapRegionState(manifest, mastery, unlocked, formats)` ergibt je Gebiet unerforscht / neu / unterwegs / gemeistert mit den erreichten Etappen. Die Items eines Bereichs lädt erst die Üben-Route, aus je einem Content-Chunk pro Bereich. Store, Dexie, Zod und die Renderer liegen im lazy Chunk `practice-route`. `scripts/check-bundle.ts` hält das JS der Startseite unter 300 kB und frei von Zod und Dexie. React Router läuft deklarativ (`BrowserRouter`/`Routes`), der Daten-Router wird nicht gebraucht.

**Einstiegscheck.** Pro Fach einmal, nur übbare Bereiche (`practiceableBereiche`), je 2–3 Items, höchstens `CHECK_ITEM_COUNT` (12). `scheduler.buildCheck(fach, pool, { bereiche, seed })` liefert einen Plan (Bereiche in Rundenreihenfolge, `total`, gemischte Kandidaten; Seed = Session-ID). `nextCheckItem(plan, answers)` wählt das Item der aktuellen Leiterstufe (`checkLadderNiveau`: richtig hoch, falsch bleibt) und nach Runde 2 die Bereiche mit drittem Item (zuerst gemischt beantwortete). Das Startniveau ist `checkStartNiveau` = höchstes Niveau mit richtiger Antwort, mindestens 1. `check.completeCheck` erzeugt daraus je geprüftem Bereich einen `MasteryState` (Fenster leer), Entdeckungen für die Etappen darunter und eine Session mit mode "check". `data/check.finishCheck` speichert Attempts, Session, Mastery und Entdeckungen in **einer** Transaktion, erst nach der letzten Antwort und nur, wenn das Fach noch keinen `MasteryState` hat; vorher steht alles nur im Store (`data/check-store`). Ein Abbruch hinterlässt deshalb nichts. Check-Attempts ändern weder Mastery noch Fehlerkiste noch Tagesziel. Die Karte bietet den Check an, solange `progress.isCheckOffered` gilt (kein `MasteryState` im Fach, mindestens `CHECK_MIN_BEREICHE` = 2 übbare Bereiche) und der Speicher lesbar ist; "Später" speichert `data/map-progress.postponeOffer` als `PostponedOffer` in Dexie; `progress.postponedFaecher` blendet das Angebot bis zum Ende des lokalen Kalendertags aus (Grenze wie beim Fortsetzen), auch nach Neuladen. UI: Route `/einstieg/:fach` im lazy Chunk `check-route` (eigener Store, `CheckStoreContext`), Screens in `ui/screens/Einstieg*`. Der Item-Screen ist derselbe wie beim Üben, mit `submitLabel` "Weiter" und `pause.onPause` statt Link. Das Ergebnis zeigt `Karte` mit `fach` (zugeschnitten über `islandViewBox`) und `interactive={false}`. Status `unavailable` unterscheidet `started` (Hinweis "Deine Reise hat schon begonnen.", auch wenn `finishCheck` nichts schreibt) und `empty`. Vorschau unter `/dev/einstieg?zustand=…` (nur Dev).

**Eltern-Bereich** (seit 2026-10-14, Teilumfang). Route `/eltern` im lazy Chunk `eltern-route`, nur per URL erreichbar. Nach der Rechenfrage gibt es „Sicherung herunterladen“ (seit 2026-10-16: `data/backup.backupFile` erzeugt Name `pfadfinder-sicherung-JJJJ-MM-TT.json` nach lokalem Kalendertag und JSON über `exportLearnerData`/`serialize`, `ui/download.downloadTextFile` gibt es als Blob-Download weiter; ohne Learner wird zuerst einer angelegt, damit die Datei gültig ist) und darunter einen Knopf „Alles löschen“ mit Rückfrage; er leert alle Dexie-Tabellen (`Repositories.clear`, auch `postponedOffers`) und lädt danach die Startseite neu (`location.replace('/')`), weil die Stores dieses Laufs den gelöschten Learner noch kennen. Die Karte bietet dann wieder den Einstieg an. Übersicht und Import folgen.

**Fehlerkiste.** `ReviewEntry` fällig → erscheint vor neuen Items im Üben-Modus (max. 3 pro Session). Richtig: stage 1→2 (+3 Tage) → done. Falsch: stage bleibt, +1 Tag. Fällig ist ein Eintrag ab Beginn seines Fälligkeitstags (lokale Zeit des Geräts).

**Probetest** (seit 2026-10-15, Domain und Daten). Reine Funktionen in `domain/probetest`, Dienst `data/probetest`, Store `data/probetest-store`.
- *Zeit:* `deadlineOf` = `startedAt` + `durationMinutes` nach Wanduhr; `remainingMinutes` rundet auf. `onOpen` (Laden, Rückkehr in den Vordergrund) setzt fort oder bricht ab (`expired`, ohne Auswertung). `onDeadline({ deadline, firedAt, visible })` gibt nur dann ab (`time`, mit Auswertung), wenn die Seite sichtbar ist und der Timer höchstens `FOREGROUND_GRACE_MS` (60 s) zu spät feuert; sonst ist die Zeit abgelaufen, ohne dass das Kind es gesehen hat. Die Timer selbst liegen in der UI, sie ruft `timeUp(visible)` und `checkTime()`.
- *Speichern:* Der Lauf hält Entwürfe (`answers`), Position (`currentIndex`) und Verweildauer (`itemMs`) und wird bei jeder Änderung gespeichert (Promise-Kette, Reihenfolge bleibt). `attemptIndex` wird beim Start festgelegt, die Reihenfolge der Optionen bleibt so über Neuladen und Durchsehen gleich. Höchstens ein laufender Lauf je Probetest-ID (`beginRun` setzt einen laufenden fort).
- *Ende:* `finishRun` schreibt für jedes beantwortete Item ein Attempt mit mode "probetest" in derselben Transaktion wie den Lauf; Abgabe (`submit`) und Zeitablauf (`time`) ergeben `submitted` mit `result`, „Zur Karte“ (`leave`) und abgelaufene Zeit (`expired`) `aborted` ohne `result`. Eine Kurzantwort bekommt ihr Attempt erst mit der Selbsteinschätzung beim Durchsehen (`rateShortAnswer`, einmal, auch später über „Auswertung ansehen“), weil ein gespeichertes Kurzantwort-Attempt seine Wertung trägt.
- *Auswertung:* `scoreRun` zählt je Bereich und gesamt `solved`/`total`/`pending`. Gelöst ist ein richtiges Item oder eine Kurzantwort mit „Getroffen“; Teils, Noch nicht und offene Items zählen nicht (keine halben Striche); eingetragene, noch nicht eingeschätzte Kurzantworten sind `pending`. Kein Prozent wird gespeichert.
- Probetest-Attempts verändern weder Mastery noch Fehlerkiste noch Tagesziel (`updateMastery` und `todayProgress` filtern den Modus, `finishRun` ruft die Fehlerkiste nicht). Der Scheduler sieht sie wie alle Attempts (zuletzt gesehen, `attemptIndex`).
- *Intro:* `introState` liefert den laufenden Lauf, den letzten abgegebenen (für „Auswertung ansehen“) und `doneBefore` (nur nach einem abgegebenen Lauf).
- *Vorlesen:* `probetestReadAloud(fach, item)` mit `PROBETEST_READ_ALOUD` (Mathe `all`, Deutsch `not-reading-texts`); der Schalter für Deutsch ist vorgesehen, aber nicht verdrahtet.
- *UI* (seit 2026-10-15): Route `/probetest/:id` im lazy Chunk `probetest-route` (Store `createProbetestStore`, `ProbetestStoreContext`), Screens `ui/screens/Probetest*` (Kopf mit Zeit, Aufgabe, Übersicht, Rückfragen, Auswertung, Durchsehen) als reine Darstellung, `ProbetestScreen` verbindet sie mit dem Store. `ItemScreen` nimmt dafür einen eigenen Kopf (`header`), eigene Bandknöpfe beim Antworten (`actions`), einen Knopf links von „Vergleichen“ (`bandStart`), `locked`; `FeedbackPanel` nimmt `back`, `nextLabel` und `missing` (Überschrift ohne „Falle“). `ui/probetest-clock` sieht jede Sekunde auf die Wanduhr, meldet dem Store das Fristende samt Sichtbarkeit (`timeUp`) und die Rückkehr in den Vordergrund (`checkTime`, `visibilitychange`/`pageshow`). Die Karte zeigt „Probetest Mathe“ aus `manifest.probetests` in der Legendenzeile. Vorschau `/dev/probetest?zustand=…` (nur Dev).
- *Bekannt:* Gespeichert wird wenige Millisekunden nach dem Tipp (IndexedDB ist asynchron); wird die App genau in diesem Moment beendet, fehlt die letzte Änderung.

**Vorlesen.** Die Äußerung setzt nur `lang = "de-DE"` und `rate = 0.9`, keine `voice` (seit 2026-10-16): iOS nimmt dann die in den Bedienungshilfen eingestellte Standardstimme, die Auswahl der ersten deutschen Stimme hatte sie überstimmt. Jeder Item-Screen hat einen Button; Text = `presentation.itemSpeech`: `readAloud ?? stimulus.text + stimulus.assetAlt + prompt`, danach „Antworten: …“ in der Reihenfolge auf dem Bildschirm (seit 2026-10-14, für alle Formate einschließlich single-choice; number-input hängt nichts an). match liest erst die Zeilen, dann die Karten als Antworten; order die aktuelle Reihenfolge; cloze-select den Satz mit „Lücke 1“ und je Lücke ihre Optionen; mark-in-text und find-error die Einheiten mit Komma, ohne `speakable()` (sonst würde „100 200“ zu „100200“); short-answer den Tipp. Beim Vergleichen liest das Band Frage, Musterlösung und Kernpunkte (`comparisonSpeech`). Rechtschreib-Items bekommen keine Absicherung, Groß-/Kleinschreibung hört man nicht. Mischen und Vorlesen nutzen dieselben Funktionen (`domain/presentation`: `presentedOptions`, `presentedMatch`, `presentedOrder`, `presentedGapOptions`). Im Probetest deaktiviert, außer bei Mathe (Lesehürde ist dort nicht Testgegenstand – Entscheidung Markus, Default: an).

**Druck.** Route `/probetest/:id/print` (lazy Chunk `print-route`, ohne Store und Renderer) rendert alle Items im Papier-Layout plus Lösungsblatt auf separater Seite (`break-before: page`). Papierformen je Format in `ui/print/papier.tsx` (eine Tabelle wie die Registry, kein Format-Switch): Zahl mit 40 mm Rechenplatz vor dem Ergebniskästchen, Optionen zum Ankreuzen, Zuordnen mit Punkten zum Verbinden, Reihenfolge mit Kästchen zum Nummerieren, Lückentext mit Optionen in Klammern, Markieren über `splitUnits`, Kurzantwort mit Linien. Reihenfolge der Optionen wie bei einem ersten Durchgang (`attemptIndex` 0); das Lösungsblatt nennt Lösungen als Text. Maße in mm und Farben (`print-ink`, `print-paper`) nur in `ui/theme/print.css`; `@media print` setzt A4 hoch und blendet den Knopf „Drucken“ aus. Kein Link auf Kinder-Screens.

## 6. Format-Renderer

`src/ui/formats/registry.ts` mappt `Item.format` → React-Komponente mit einheitlichem Vertrag:

```ts
type FormatProps<F extends Format> = {
  item: ItemOf<F>;
  attemptIndex: number;           // Seed fürs Mischen: presentationSeed(item.id, attemptIndex)
  answer: DraftOf<F> | null;      // = AnswerOf<F>, bei short-answer nur { text } (die Wertung kommt aus dem Band)
  onChange(answer: DraftOf<F> | null): void;  // null = noch keine gültige Eingabe ("3,"), Prüfen bleibt aus
  disabled: boolean;              // nach Abgabe und beim Vergleichen
  revealed?: { correct: Correctness; solution: SolutionOf<F> };  // Feedback-Darstellung
  showSolution?: boolean;         // short-answer: Musterlösung zeigen (Vergleichen und danach)
};
type FormatEntry<F> = { component; selfRated?: true; submitLabel?: string; bandNote?(item): { label; text } };
```
Seit 2026-10-11: `attemptIndex` und `onChange(… | null)` ergänzt, weil das Mischen formatspezifisch ist und unfertige Eingaben gemeldet werden müssen. Seit 2026-10-14 (Aufgabe 7) sind alle neun Formate registriert (`SUPPORTED_FORMATS`), `MIN_ITEMS_FOR_PRACTICE` zählt damit alle aktiven Items. Ein Registry-Eintrag kann mehr als die Komponente: `selfRated` (short-answer: der Knopf heißt `submitLabel` „Vergleichen“, der ItemScreen zeigt danach Musterlösung und Selbsteinschätzung „Getroffen / Teils / Noch nicht“ im Band, erst diese Wahl ruft `onSubmit(answer)` mit `rating`; das Band zeigt danach keine Überschrift), `bandNote` (find-error: „So schreibt man es: …“ im Band, bei richtig und noch nicht). match und order bringen dnd-kit mit und liegen in eigenen Chunks: `preloadFormats()` lädt sie, sobald die Üben- oder Einstieg-Route ihren Store anlegt; das Promise trägt Reacts Statusfelder, `use()` liest ein geladenes Modul also synchron. `scripts/check-bundle.ts` prüft, dass dnd-kit (Marker `DndDescribedBy`) in keiner Datei steckt, die Startseite oder eine Route statisch laden. Ziehen ist nie der einzige Weg: match geht mit Tippen (Zeile, dann Karte), order mit den Knöpfen ↑/↓.

Neue Formate = neue Komponente + Eintrag in Registry + Evaluator in `domain/evaluation`. Kein Format-Switch im Screen-Code.

## 7. UI-Regeln (technisch)

- Theme-Tokens in `theme/tokens.css`; Flat-Illustration, Palette ≤ 6 Farben + Neutrals; Schrift: Andika (self-hosted, OFL), Grundgröße 18 px
- Jeder interaktive Bereich ≥ 48 × 48 px; Fokus-Ringe sichtbar; jedes Bild mit `alt`
- Eine Aufgabe = ein Screen, keine vertikale Scrollnotwendigkeit auf 1024 × 768 (iPad quer) und 768 × 1024 (hoch)
- Animationen ≤ 300 ms, `prefers-reduced-motion` respektieren
- Kein Toast, kein Modal im Üben-Flow; Feedback inline unter der Aufgabe
- Eltern-Bereich `/eltern` hinter einer Rechenfrage (Summe zweier zweistelliger Zahlen, `domain/parents.gateQuestion`, Eingabe über den Ziffernblock), kein Passwort (seit 2026-10-14, vorher 6 × 7 … 9 × 9). Die Rechenfrage ist **kein Schutz**, sondern ein Schild „für Eltern“: Weder Einmaleins noch zweistellige Addition ist für ein Kind der 4. Klasse eine Hürde. Der Schutz ist allein, dass kein Link in der App zu `/eltern` führt (geprüft in `eltern.spec`). Wer hier mehr Schutz braucht, muss etwas anderes bauen, nicht die Rechenfrage schwerer machen

## 8. Qualität

- Domain: 100 % Branch-Coverage angestrebt, mindestens: Mastery-Übergänge, Scheduler-Auswahl, Evaluation je Format, Review-Intervalle, Probetest-Auswertung, Export/Import-Roundtrip
- UI: je Format ein Rendering-/Interaktionstest
- E2E: (1) Einstiegscheck → Karte zeigt Niveaus, (2) Üben 10 Items → Abschluss-Screen, (3) Probetest starten → abgeben → Auswertung (seit 2026-10-14: (1) ist `einstieg.spec`, Layout und Screenshots der Einstieg-Screens in `einstieg-layout.spec`, vier Viewports; seit 2026-10-15: (3) ist `probetest.spec` mit Neuladen, Fake-Clock und abgelaufener Zeit, Layout aller Probetest-Screens und Druck-PDF in `probetest-layout.spec`)
- `scripts/validate-content.ts` läuft in CI und als pre-commit
- PWA (seit 2026-10-12, Lighthouse hat keine PWA-Kategorie mehr): installierbar auf dem iPad (manuell bestätigt), Offline-E2E grün
- Layout-Test (jedes aktive Item × 3 Zustände, short-answer zusätzlich „vergleichen“): lokal in allen vier Viewports, in CI nur in 1024 × 660 und 768 × 900. Ein Viewport misst alle Items und scheitert dann einmal mit der vollständigen Befundliste (seit Aufgabe 7). `formate.spec` spielt je neuem Format ein echtes Item auf `/dev/item/:id?state=spielen` (antworten, Prüfen, Band, Weiter; Ziehen bei match und order) mit Screenshots vor und nach Prüfen in vier Viewports. Der Preview-Server für die Smoke-Flows wird nie wiederverwendet (`reuseExistingServer: false`, Befund 5d). Das sind die engsten (iPad mit Safari-Leisten); was dort ohne Scrollen passt, passt auch auf 1024 × 768 und 768 × 1024. Er wächst mit jedem Batch, vier Viewports hätten die CI-Laufzeit mit jedem Batch weiter verlängert. Die Karte (`karte.spec`) läuft weiter in allen vier
- Lighthouse gegen die Live-URL, mobil: Performance ≥ 90, Barrierefreiheit 100, Best Practices 100 (SEO zählt nicht, solange `noindex` gilt)

## 9. Erweiterungspunkte (nicht bauen, aber nicht verbauen)

| Roadmap | Vorkehrung im MVP |
|---|---|
| Accounts/Sync (v2) | Learner-Entität existiert; Export-Format versioniert; Repositories hinter Interfaces |
| Mehrere Kinder | `learnerId` auf allen Datensätzen, UI zeigt nur den ersten |
| Item-Statistiken / IRT | `Attempt` speichert Dauer und Antwort vollständig |
| Content-Editor | Content ist reines JSON, Zod-Schema ist die einzige Wahrheit |
| Weitere Bundesländer | `Learner.settings.bundesland`, Items tragen künftig `region` (Schema v1.1) |
| Echtes SRS | `ReviewEntry.stage` ist erweiterbar; Scheduler ist austauschbares Modul |
| Hörverstehen | Format-Registry nimmt `audio-*`-Formate ohne Screen-Änderung auf |

## 10. Bewusst nicht

- Kein Next.js/SSR, kein Backend, kein Auth, kein Analytics, kein Error-Tracking-Dienst (Fehler landen in `console` + optional lokaler Fehlerliste im Eltern-Bereich)
- Keine PDF-Bibliothek, keine State-Machine-Lib, kein CSS-in-JS
- Keine KI-Aufrufe zur Laufzeit
