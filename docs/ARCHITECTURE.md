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
ProbetestRun   { id; learnerId; probetestId; startedAt; submittedAt?; attemptIds; result?: { byBereich: Record<Bereich, {correct, total}>; percent } }
Collectibles   { learnerId; unlocked: string[] }                                 // Entdeckungen je gemeisterter Etappe
PostponedOffer { fach; at: ISO }                                                  // "Später" beim Einstieg-Angebot, je Fach; geräteweit, nicht im Export (Dexie v2)
```

Export-Format: `{ version: "1", exportedAt, learner, attempts, mastery, reviews, sessions, probetestRuns, collectibles }` als JSON-Datei. Import validiert mit Zod und migriert nach Versionsnummer. Das Export-Format ist das spätere Sync-Format (Roadmap v2).

## 5. Kernabläufe

**Üben.** `scheduler.pickNext(bereich, masteryState, recentItemIds, pool)` → Item auf aktuellem Niveau, nicht in den letzten 20 gesehen, Formatwechsel bevorzugt. Nach Antwort: `evaluation.check(item, answer)` → `mastery.update(state, correct)` → bei falsch `scheduler.enqueueReview(itemId, now)`; gebündelt in `practice.recordPracticeAnswer`. Session-Ziel 10 Items, danach Abschluss-Screen. Gezogen werden nur Items mit registriertem Renderer; ein Bereich ist erst ab `MIN_ITEMS_FOR_PRACTICE` (10) solcher Items übbar. **Tagesgrenze:** Eine offene Session (ohne `endedAt`) wird nur am Kalendertag ihrer letzten Aktivität fortgesetzt (Zeit des neuesten Attempts, ohne Attempts `startedAt`; lokale Zeit des Geräts), und nur, wenn alle ihre Attempts im gewählten Bereich liegen. Wer um 23:55 beginnt und um 00:03 noch antwortet, setzt um 00:10 dieselbe Session fort. Offene Sessions, deren letzte Aktivität an einem früheren Tag lag, schließt `practice.planSessionStart` beim Start eines Bereichs (`endedAt` = jetzt, `goalReached` = false), danach beginnt eine neue. Eine Session wird erst mit ihrer ersten Antwort gespeichert. **Fortsetzen oder neu anfangen** (seit 2026-10-14): Gibt es eine solche Session von heute mit Antworten, zeigt der Store den Status `choosing` (`ui/screens/UebenWahl`). „Fortsetzen“ macht dort weiter; „Neu anfangen“ (`data/practice.restartPractice`) schließt sie mit `practice.closeSession` (`endedAt` = jetzt, `goalReached` = false, ohne Abschluss-Screen) und beginnt eine neue Runde mit `SESSION_GOAL` Items über `pickNext`. Attempts, Mastery, Fehlerkiste und Entdeckungen bleiben, das Tagesziel springt also nicht zurück. **Entdeckungen:** Ein Aufstieg von Niveau n schreibt `"<bereich>:<n>"`, „gemeistert“ schreibt `"<bereich>:3"` in `Collectibles.unlocked`; Einträge werden nie gelöscht, so bleibt eine erreichte Etappe auf der Karte gefüllt, auch wenn das Niveau sinkt. **Tagesziel:** `todayProgress(attempts, now)` zählt `practice`- und `review`-Attempts des lokalen Kalendertags, höchstens 10; Karte und Abschluss-Screen zeigen dieselbe Zahl.

**Startseite und Content-Laden.** `scripts/validate-content.ts` erzeugt bei gültigem Content `content/manifest.json`: je Bereich die Zahl der aktiven Items (ohne `retired`) je Format und Niveau sowie die Text-IDs. Die Datei ist erzeugt, nicht handgeschrieben, und kein Teil des Item-Vertrags (CONTENT_SCHEMA). Ein Test vergleicht sie mit dem Content, in CI ist ein veraltetes Manifest ein Fehler, und der pre-commit-Hook verlangt das Stagen. Die Startseite ist die Karte (`src/ui/map`, Liste als Fallback unter `/?liste`). Sie liest das Manifest und danach aus dem lazy Chunk `map-progress` (Dexie) Mastery, Entdeckungen und die Attempts für das Tagesziel; `mapRegionState(manifest, mastery, unlocked, formats)` ergibt je Gebiet unerforscht / neu / unterwegs / gemeistert mit den erreichten Etappen. Die Items eines Bereichs lädt erst die Üben-Route, aus je einem Content-Chunk pro Bereich. Store, Dexie, Zod und die Renderer liegen im lazy Chunk `practice-route`. `scripts/check-bundle.ts` hält das JS der Startseite unter 300 kB und frei von Zod und Dexie. React Router läuft deklarativ (`BrowserRouter`/`Routes`), der Daten-Router wird nicht gebraucht.

**Einstiegscheck.** Pro Fach einmal, nur übbare Bereiche (`practiceableBereiche`), je 2–3 Items, höchstens `CHECK_ITEM_COUNT` (12). `scheduler.buildCheck(fach, pool, { bereiche, seed })` liefert einen Plan (Bereiche in Rundenreihenfolge, `total`, gemischte Kandidaten; Seed = Session-ID). `nextCheckItem(plan, answers)` wählt das Item der aktuellen Leiterstufe (`checkLadderNiveau`: richtig hoch, falsch bleibt) und nach Runde 2 die Bereiche mit drittem Item (zuerst gemischt beantwortete). Das Startniveau ist `checkStartNiveau` = höchstes Niveau mit richtiger Antwort, mindestens 1. `check.completeCheck` erzeugt daraus je geprüftem Bereich einen `MasteryState` (Fenster leer), Entdeckungen für die Etappen darunter und eine Session mit mode "check". `data/check.finishCheck` speichert Attempts, Session, Mastery und Entdeckungen in **einer** Transaktion, erst nach der letzten Antwort und nur, wenn das Fach noch keinen `MasteryState` hat; vorher steht alles nur im Store (`data/check-store`). Ein Abbruch hinterlässt deshalb nichts. Check-Attempts ändern weder Mastery noch Fehlerkiste noch Tagesziel. Die Karte bietet den Check an, solange `progress.isCheckOffered` gilt (kein `MasteryState` im Fach, mindestens `CHECK_MIN_BEREICHE` = 2 übbare Bereiche) und der Speicher lesbar ist; "Später" speichert `data/map-progress.postponeOffer` als `PostponedOffer` in Dexie; `progress.postponedFaecher` blendet das Angebot bis zum Ende des lokalen Kalendertags aus (Grenze wie beim Fortsetzen), auch nach Neuladen. UI: Route `/einstieg/:fach` im lazy Chunk `check-route` (eigener Store, `CheckStoreContext`), Screens in `ui/screens/Einstieg*`. Der Item-Screen ist derselbe wie beim Üben, mit `submitLabel` "Weiter" und `pause.onPause` statt Link. Das Ergebnis zeigt `Karte` mit `fach` (zugeschnitten über `islandViewBox`) und `interactive={false}`. Status `unavailable` unterscheidet `started` (Hinweis "Deine Reise hat schon begonnen.", auch wenn `finishCheck` nichts schreibt) und `empty`. Vorschau unter `/dev/einstieg?zustand=…` (nur Dev).

**Fehlerkiste.** `ReviewEntry` fällig → erscheint vor neuen Items im Üben-Modus (max. 3 pro Session). Richtig: stage 1→2 (+3 Tage) → done. Falsch: stage bleibt, +1 Tag. Fällig ist ein Eintrag ab Beginn seines Fälligkeitstags (lokale Zeit des Geräts).

**Probetest.** Timer läuft im Domain-Modell (startedAt + 45 Min.), UI zeigt verbleibende Zeit nur dezent (kein rotes Blinken). Navigation vor/zurück erlaubt wie auf Papier. Abgabe manuell oder bei Ablauf. Auswertung pro Bereich und gesamt; Attempts fließen **nicht** in Mastery (Probetest ist Messung, nicht Training).

**Vorlesen.** Jeder Item-Screen hat einen Button; Text = `readAloud ?? stimulus.text + stimulus.assetAlt + prompt`. Im Probetest deaktiviert, außer bei Mathe (Lesehürde ist dort nicht Testgegenstand – Entscheidung Markus, Default: an).

**Druck.** Route `/probetest/:id/print` rendert alle Items im Papier-Layout (Nummerierung, Antwortfelder, Zeilen für Kurzantwort) plus Lösungsblatt auf separater Seite. `@media print` blendet Chrome aus.

## 6. Format-Renderer

`src/ui/formats/registry.ts` mappt `Item.format` → React-Komponente mit einheitlichem Vertrag:

```ts
type FormatProps<F extends Format> = {
  item: ItemOf<F>;
  attemptIndex: number;           // Seed fürs Mischen: presentationSeed(item.id, attemptIndex)
  answer: AnswerOf<F> | null;
  onChange(answer: AnswerOf<F> | null): void;  // null = noch keine gültige Eingabe ("3,"), Prüfen bleibt aus
  disabled: boolean;              // nach Abgabe
  revealed?: { correct: Correctness; solution: SolutionOf<F> };  // Feedback-Darstellung
};
```
Seit 2026-10-11: `attemptIndex` und `onChange(… | null)` ergänzt, weil das Mischen formatspezifisch ist und unfertige Eingaben gemeldet werden müssen. Übbar sind nur Items, deren Format hier registriert ist (`SUPPORTED_FORMATS`).

Neue Formate = neue Komponente + Eintrag in Registry + Evaluator in `domain/evaluation`. Kein Format-Switch im Screen-Code.

## 7. UI-Regeln (technisch)

- Theme-Tokens in `theme/tokens.css`; Flat-Illustration, Palette ≤ 6 Farben + Neutrals; Schrift: Andika (self-hosted, OFL), Grundgröße 18 px
- Jeder interaktive Bereich ≥ 48 × 48 px; Fokus-Ringe sichtbar; jedes Bild mit `alt`
- Eine Aufgabe = ein Screen, keine vertikale Scrollnotwendigkeit auf 1024 × 768 (iPad quer) und 768 × 1024 (hoch)
- Animationen ≤ 300 ms, `prefers-reduced-motion` respektieren
- Kein Toast, kein Modal im Üben-Flow; Feedback inline unter der Aufgabe
- Eltern-Bereich hinter Rechenfrage (zufällig aus 6 × 7 … 9 × 9), kein Passwort

## 8. Qualität

- Domain: 100 % Branch-Coverage angestrebt, mindestens: Mastery-Übergänge, Scheduler-Auswahl, Evaluation je Format, Review-Intervalle, Probetest-Auswertung, Export/Import-Roundtrip
- UI: je Format ein Rendering-/Interaktionstest
- E2E: (1) Einstiegscheck → Karte zeigt Niveaus, (2) Üben 10 Items → Abschluss-Screen, (3) Probetest starten → abgeben → Auswertung (seit 2026-10-14: (1) ist `einstieg.spec`, Layout und Screenshots der Einstieg-Screens in `einstieg-layout.spec`, vier Viewports)
- `scripts/validate-content.ts` läuft in CI und als pre-commit
- PWA (seit 2026-10-12, Lighthouse hat keine PWA-Kategorie mehr): installierbar auf dem iPad (manuell bestätigt), Offline-E2E grün
- Layout-Test (jedes übbare Item × 3 Zustände): lokal in allen vier Viewports, in CI nur in 1024 × 660 und 768 × 900. Das sind die engsten (iPad mit Safari-Leisten); was dort ohne Scrollen passt, passt auch auf 1024 × 768 und 768 × 1024. Er wächst mit jedem Batch, vier Viewports hätten die CI-Laufzeit mit jedem Batch weiter verlängert. Die Karte (`karte.spec`) läuft weiter in allen vier
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
