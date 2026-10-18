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

**Üben.** `scheduler.pickNext(bereich, masteryState, recentItemIds, pool)` → Item auf aktuellem Niveau, nicht in den letzten 20 gesehen, Formatwechsel bevorzugt. Nach Antwort: `evaluation.check(item, answer)` → `mastery.update(state, correct)` → bei falsch `scheduler.enqueueReview(itemId, now)`; gebündelt in `practice.recordPracticeAnswer`. Session-Ziel 10 Items, danach Abschluss-Screen. Gezogen werden nur Items mit registriertem Renderer; ein Bereich ist erst ab `MIN_ITEMS_FOR_PRACTICE` (10) solcher Items übbar. **Tagesgrenze:** Eine offene Session (ohne `endedAt`) wird nur am Kalendertag ihrer letzten Aktivität fortgesetzt (Zeit des neuesten Attempts, ohne Attempts `startedAt`; lokale Zeit des Geräts), und nur, wenn alle ihre Attempts im gewählten Bereich liegen. Wer um 23:55 beginnt und um 00:03 noch antwortet, setzt um 00:10 dieselbe Session fort. Offene Sessions, deren letzte Aktivität an einem früheren Tag lag, schließt `practice.planSessionStart` beim Start eines Bereichs (`endedAt` = jetzt, `goalReached` = false), danach beginnt eine neue. Eine Session wird erst mit ihrer ersten Antwort gespeichert. **Fortsetzen oder neu anfangen** (seit 2026-10-14): Gibt es eine solche Session von heute mit Antworten, zeigt der Store den Status `choosing` (`ui/screens/UebenWahl`). „Fortsetzen“ macht dort weiter; „Neu anfangen“ (`data/practice.restartPractice`) schließt sie mit `practice.closeSession` (`endedAt` = jetzt, `goalReached` = false, ohne Abschluss-Screen) und beginnt eine neue Runde mit `SESSION_GOAL` Items über `pickNext`. Attempts, Mastery, Fehlerkiste und Entdeckungen bleiben, das Tagesziel springt also nicht zurück. **Entdeckungen:** Ein Aufstieg von Niveau n schreibt `"<bereich>:<n>"`, „gemeistert“ schreibt `"<bereich>:3"` in `Collectibles.unlocked`; Einträge werden nie gelöscht, so bleibt eine erreichte Etappe auf der Karte gefüllt, auch wenn das Niveau sinkt. **Lesetexte** (seit 2026-10-16): Hat das letzte Item der Runde einen `textRef`, nimmt `pickNext` zuerst die Items dieses Textes, die in der Runde noch nicht dran waren (`sessionItemIds`, aus `session.attemptIds`), das Niveau am nächsten zum Mastery-Niveau zuerst, bei Gleichstand das leichtere. Erst wenn keins übrig ist, gelten wieder Fehlerkiste, Niveau und die letzten 20. **Abweichung vom bisherigen Verhalten (gewollt):** Solange ein Text läuft, darf `pickNext` Items aus den letzten 20 wiederholen, und fällige Wiederholungen warten bis zum Textende (Test `pick-next-text`). `practice.readingStep(item, source, shownTextIds)` entscheidet: erstes Item eines Textes in der Runde → Status `reading` (Lese-Screen) vor dem Item; weitere Items und Fehlerkiste-Wiederholungen → Text neben dem Item, ohne Lese-Screen. `shownTextIds` hält der Store nur im Speicher, nach Neuladen kommt der Lese-Screen wieder. Die Zeit des Items beginnt nach „Weiter“ auf dem Lese-Screen. **UI** (seit 2026-10-16, Teil C): `ui/screens/LeseScreen` (Zeile „Lies den Text.“ mit Vorlesen für Anweisung und Titel, darunter `TextKasten` mit Titel, gelb „Weiter“). Beim Item steht `ItemScreen.text` = `TextKasten` ohne Titel (`.item-with-text`): quer eine Spalte links, `--spacing-reading-column` 34 % unter 768 px Höhe und `--spacing-reading-column-tall` 42 % ab 768 px; hoch ein Block mit der Höhe Bildschirm − `--spacing-reading-reserve-<format>` (gemessen in `text-layout.spec`: je Format die Reserve, bei der der engste Zustand 18 px Luft behält; innerhalb eines Items stabil, mindestens `--spacing-reading-box-min`). Nur der Kasten scrollt; der Verlauf unten zeigt weiteren Text, oben (`data-more-above`) schon gelesenen, beide statisch. `ui/text-scroll` hält die Scrollposition je Text über die Items einer Runde, nach dem Lese-Screen beginnt sie oben. Vorlesen: Der Item-Knopf liest `itemSpeech` (nie den Text), der Kasten-Knopf `textSpeech` (Titel und Absätze, unverändert), nur bei `ReadingText.readAloud`; im Probetest ist `probetest.probetestTextReadAloud(fach, item, text)` vorgesehen (Deutsch: aus). Vorschau `/dev/text/:id?item=…&zustand=…` und eine echte Runde `/dev/text/:id?runde` (In-Memory-Repos, Fixture `tests/fixtures/lesen`, nur Dev). **Tagesziel:** `todayProgress(attempts, day, sessions)` zählt `practice`- und `review`-Attempts des lokalen Kalendertags von `day`, höchstens 10. Seit Aufgabe 10 zählt eine Antwort für den Tag, an dem ihre Runde begann (`Session.startedAt`), nicht für ihre eigene Uhrzeit. Der Abschluss-Screen nimmt den Starttag seiner Runde; die Karte `progress.practiceDay`: den Starttag einer offenen Runde von einem früheren Tag, die nach Mitternacht noch weiterläuft (letzte Antwort heute, sie würde also fortgesetzt), sonst jetzt. Nach dem Abschluss einer solchen Runde zeigt die Karte den neuen Tag.

**Startseite und Content-Laden.** `scripts/validate-content.ts` erzeugt bei gültigem Content `content/manifest.json`: je Bereich die Zahl der aktiven Items (ohne `retired`) je Format und Niveau sowie die Text-IDs, dazu die Probetest-IDs je Fach (seit 1.0.9). Die Datei ist erzeugt, nicht handgeschrieben, und kein Teil des Item-Vertrags (CONTENT_SCHEMA). Ein Test vergleicht sie mit dem Content, in CI ist ein veraltetes Manifest ein Fehler, und der pre-commit-Hook verlangt das Stagen. Die Startseite ist die Karte (`src/ui/map`, Liste als Fallback unter `/?liste`). Sie liest das Manifest und danach aus dem lazy Chunk `map-progress` (Dexie) Mastery, Entdeckungen und die Attempts für das Tagesziel; `mapRegionState(manifest, mastery, unlocked, formats)` ergibt je Gebiet unerforscht / neu / unterwegs / gemeistert mit den erreichten Etappen. Die Items eines Bereichs lädt erst die Üben-Route, aus je einem Content-Chunk pro Bereich; mit ihnen `loadTexts(fach, bereich)` die Lesetexte (ein lazy Chunk je Textdatei, im Precache, geprüft von `check-bundle`), zugeordnet über `ReadingText.kind` (sachtext → lesen-sachtext, literarisch → lesen-literarisch), nicht über den Dateinamen. `createContentLoader(modules)` nimmt andere Quellen nur für Tests und Dev-Seiten (Fixture `tests/fixtures/lesen`). Store, Dexie, Zod und die Renderer liegen im lazy Chunk `practice-route`. `scripts/check-bundle.ts` hält das JS der Startseite unter 300 kB und frei von Zod und Dexie. React Router läuft deklarativ (`BrowserRouter`/`Routes`), der Daten-Router wird nicht gebraucht.

**Einstiegscheck.** Pro Fach einmal, nur übbare Bereiche (`practiceableBereiche`), je 2–3 Items, höchstens `CHECK_ITEM_COUNT` (12). `scheduler.buildCheck(fach, pool, { bereiche, seed })` liefert einen Plan (Bereiche in Rundenreihenfolge, `total`, gemischte Kandidaten; Seed = Session-ID). `nextCheckItem(plan, answers)` wählt das Item der aktuellen Leiterstufe (`checkLadderNiveau`: richtig hoch, falsch bleibt) und nach Runde 2 die Bereiche mit drittem Item (zuerst gemischt beantwortete). In einem Lesen-Bereich kommen alle 2–3 Items aus einem Text: Der Seed wählt einen Text mit mindestens 2 prüfbaren Items, nur dessen Items sind Kandidaten (seit 2026-10-16). Lesen-Bereiche stehen als zusammenhängender Block nach den Runden der übrigen Bereiche (seit Aufgabe 10, vorher davor: erst die kurzen Aufgaben, der lange Text am Ende), mit allen ihren Plätzen (2–3, ohne Runde-3-Auswahl; gekürzt auf 12 wird nur Runde 3); vor dem ersten Item kommt der Lese-Screen (Status `reading` im Check-Store, „Pause“ kehrt dorthin zurück). Das Startniveau ist `checkStartNiveau` = höchstes Niveau mit richtiger Antwort, mindestens 1. `check.completeCheck` erzeugt daraus je geprüftem Bereich einen `MasteryState` (Fenster leer), Entdeckungen für die Etappen darunter und eine Session mit mode "check". `data/check.finishCheck` speichert Attempts, Session, Mastery und Entdeckungen in **einer** Transaktion, erst nach der letzten Antwort und nur, wenn das Fach noch keinen `MasteryState` hat; vorher steht alles nur im Store (`data/check-store`). Ein Abbruch hinterlässt deshalb nichts. Check-Attempts ändern weder Mastery noch Fehlerkiste noch Tagesziel. Die Karte bietet den Check an, solange `progress.isCheckOffered` gilt (kein `MasteryState` im Fach, mindestens `CHECK_MIN_BEREICHE` = 2 übbare Bereiche) und der Speicher lesbar ist; "Später" speichert `data/map-progress.postponeOffer` als `PostponedOffer` in Dexie; `progress.postponedFaecher` blendet das Angebot bis zum Ende des lokalen Kalendertags aus (Grenze wie beim Fortsetzen), auch nach Neuladen; solange eine Runde von diesem Tag nach Mitternacht weiterläuft (`practiceDay`), gilt es weiter (seit Aufgabe 10). UI: Route `/einstieg/:fach` im lazy Chunk `check-route` (eigener Store, `CheckStoreContext`), Screens in `ui/screens/Einstieg*`. Der Item-Screen ist derselbe wie beim Üben, mit `submitLabel` "Weiter" und `pause.onPause` statt Link. Das Ergebnis zeigt `Karte` mit `fach` (zugeschnitten über `islandViewBox`) und `interactive={false}`. Status `unavailable` unterscheidet `started` (Hinweis "Deine Reise hat schon begonnen.", auch wenn `finishCheck` nichts schreibt) und `empty`. Vorschau unter `/dev/einstieg?zustand=…` (nur Dev).

**Eltern-Bereich** (seit 2026-10-14, Teilumfang). Route `/eltern` im lazy Chunk `eltern-route`, erreichbar per URL und seit Aufgabe 11 über „Für Eltern“ am Ende von Impressum und Datenschutz (die installierte App hat keine Adresszeile). Nach der Rechenfrage gibt es „Sicherung herunterladen“ (seit 2026-10-16: `data/backup.backupFile` erzeugt Name `pfadfinder-sicherung-JJJJ-MM-TT.json` nach lokalem Kalendertag und JSON über `exportLearnerData`/`serialize`, `ui/download.downloadTextFile` gibt es als Blob-Download weiter; ohne Learner wird zuerst einer angelegt, damit die Datei gültig ist) und darunter einen Knopf „Alles löschen“ mit Rückfrage; er leert alle Dexie-Tabellen (`Repositories.clear`, auch `postponedOffers`) und lädt danach die Startseite neu (`location.replace('/')`), weil die Stores dieses Laufs den gelöschten Learner noch kennen. Die Karte bietet dann wieder den Einstieg an. Übersicht und Import folgen. Oben rechts stehen in jedem Schritt die Links „Impressum“ und „Datenschutz“ (seit Aufgabe 10): `/impressum` und `/datenschutz` sind statische Seiten (`ui/screens/RechtlichesScreen`, Texte in `ui/text/rechtliches`, ein gemeinsamer lazy Chunk), dürfen scrollen und haben kein Vorlesen; „Zurück“ geht in der Historie zurück, beim direkten Öffnen zur Karte. Seit Aufgabe 11 verlinkt sie auch die Legendenzeile der Karte, in jedem Viewport (`eltern.spec`, `karte.spec`).

**Fehlerkiste.** `ReviewEntry` fällig → erscheint vor neuen Items im Üben-Modus (max. 3 pro Session). Richtig: stage 1→2 (+3 Tage) → done. Falsch: stage bleibt, +1 Tag. Fällig ist ein Eintrag ab Beginn seines Fälligkeitstags (lokale Zeit des Geräts).

**Probetest** (seit 2026-10-15, Domain und Daten). Reine Funktionen in `domain/probetest`, Dienst `data/probetest`, Store `data/probetest-store`.
- *Zeit:* `deadlineOf` = `startedAt` + `durationMinutes` nach Wanduhr; `remainingMinutes` rundet auf. `onOpen` (Laden, Rückkehr in den Vordergrund) setzt fort oder bricht ab (`expired`, ohne Auswertung). `onDeadline({ deadline, firedAt, visible })` gibt nur dann ab (`time`, mit Auswertung), wenn die Seite sichtbar ist und der Timer höchstens `FOREGROUND_GRACE_MS` (60 s) zu spät feuert; sonst ist die Zeit abgelaufen, ohne dass das Kind es gesehen hat. Die Timer selbst liegen in der UI, sie ruft `timeUp(visible)` und `checkTime()`.
- *Speichern:* Der Lauf hält Entwürfe (`answers`), Position (`currentIndex`) und Verweildauer (`itemMs`) und wird bei jeder Änderung gespeichert (Promise-Kette, Reihenfolge bleibt). `attemptIndex` wird beim Start festgelegt, die Reihenfolge der Optionen bleibt so über Neuladen und Durchsehen gleich. Höchstens ein laufender Lauf je Probetest-ID (`beginRun` setzt einen laufenden fort).
- *Ende:* `finishRun` schreibt für jedes beantwortete Item ein Attempt mit mode "probetest" in derselben Transaktion wie den Lauf; Abgabe (`submit`) und Zeitablauf (`time`) ergeben `submitted` mit `result`, „Zur Karte“ (`leave`) und abgelaufene Zeit (`expired`) `aborted` ohne `result`. Eine Kurzantwort bekommt ihr Attempt erst mit der Selbsteinschätzung beim Durchsehen (`rateShortAnswer`, einmal, auch später über „Auswertung ansehen“), weil ein gespeichertes Kurzantwort-Attempt seine Wertung trägt.
- *Auswertung:* `scoreRun` zählt je Bereich und gesamt `solved`/`total`/`pending`. Gelöst ist ein richtiges Item oder eine Kurzantwort mit „Getroffen“; Teils, Noch nicht und offene Items zählen nicht (keine halben Striche); eingetragene, noch nicht eingeschätzte Kurzantworten sind `pending`. Kein Prozent wird gespeichert.
- Probetest-Attempts verändern weder Mastery noch Fehlerkiste noch Tagesziel (`updateMastery` und `todayProgress` filtern den Modus, `finishRun` ruft die Fehlerkiste nicht). Der Scheduler sieht sie wie alle Attempts (zuletzt gesehen, `attemptIndex`).
- *Intro:* `introState` liefert den laufenden Lauf, den letzten abgegebenen (für „Auswertung ansehen“) und `doneBefore` (nur nach einem abgegebenen Lauf).
- *Vorlesen:* `probetestReadAloud(fach, item)` mit `PROBETEST_READ_ALOUD` (Mathe `all`, Deutsch `not-reading-texts`); der Schalter für Deutsch ist vorgesehen, aber nicht verdrahtet.
- *UI* (seit 2026-10-15): Route `/probetest/:id` im lazy Chunk `probetest-route` (Store `createProbetestStore`, `ProbetestStoreContext`), Screens `ui/screens/Probetest*` (Kopf mit Zeit, Aufgabe, Übersicht, Rückfragen, Auswertung, Durchsehen, seit Aufgabe 11 die Übersicht im Durchsehen; Striche und Raster gemeinsam in `ProbetestStrich`) als reine Darstellung; der Store hält beim Vergleichen der wartenden Kurzantworten `reviewOnly` (die Indizes beim Start) und den Status `reviewOverview`, `ProbetestScreen` verbindet sie mit dem Store. `ItemScreen` nimmt dafür einen eigenen Kopf (`header`), eigene Bandknöpfe beim Antworten (`actions`), einen Knopf links von „Vergleichen“ (`bandStart`), `locked`; `FeedbackPanel` nimmt `back`, `nextLabel` und `missing` (Überschrift ohne „Falle“). `ui/probetest-clock` sieht jede Sekunde auf die Wanduhr, meldet dem Store das Fristende samt Sichtbarkeit (`timeUp`) und die Rückkehr in den Vordergrund (`checkTime`, `visibilitychange`/`pageshow`). Die Karte zeigt „Probetest Mathe“ aus `manifest.probetests` in der Legendenzeile. Vorschau `/dev/probetest?zustand=…` (nur Dev).
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
- Statische Hülle (seit Aufgabe 10): `index.html` zeigt vor dem JS „Pfadfinder“ in Andika Bold auf Papier (Inline-Style mit den Farben aus `tokens.css`, Schrift per Preload, geprüft in `tokens.test` und `pwa.spec` ohne JS). React ersetzt den Inhalt von `#root` beim ersten Rendern
- Kein Toast, kein Modal im Üben-Flow; Feedback inline unter der Aufgabe
- Updates (seit Aufgabe 11): Die App registriert den Service Worker selbst (`app/pwa-update.ts`, `registerType: 'prompt'`) und fragt beim Start und bei jeder Rückkehr in den Vordergrund nach einer neuen Version. Eine neue Version wartet, bis ein Erwachsener „Neue Version – Neu laden“ auf `/eltern` oder „Neu laden“ in der Legendenzeile der Karte tippt. Nie lädt die App von selbst neu, also nie mitten in einer Runde oder einem Probetest. `/eltern` zeigt die Build-Kennung (kurzer Git-Hash + Build-Tag)
- Eltern-Bereich `/eltern` hinter einer Rechenfrage (Summe zweier zweistelliger Zahlen, `domain/parents.gateQuestion`, Eingabe über den Ziffernblock), kein Passwort (seit 2026-10-14, vorher 6 × 7 … 9 × 9). Die Rechenfrage ist **kein Schutz**, sondern ein Schild „für Eltern“: Weder Einmaleins noch zweistellige Addition ist für ein Kind der 4. Klasse eine Hürde. Der Schutz ist, dass kein Kinder-Screen zu `/eltern` verlinkt; der einzige Link steht leise am Ende von Impressum und Datenschutz (seit Aufgabe 11, sonst erreicht die installierte App `/eltern` nicht). Geprüft in `eltern.spec` (Karte) und `RechtlichesScreen.test`. Wer hier mehr Schutz braucht, muss etwas anderes bauen, nicht die Rechenfrage schwerer machen

## 8. Qualität

- Domain: 100 % Branch-Coverage angestrebt, mindestens: Mastery-Übergänge, Scheduler-Auswahl, Evaluation je Format, Review-Intervalle, Probetest-Auswertung, Export/Import-Roundtrip
- UI: je Format ein Rendering-/Interaktionstest
- E2E: (1) Einstiegscheck → Karte zeigt Niveaus, (2) Üben 10 Items → Abschluss-Screen, (3) Probetest starten → abgeben → Auswertung (seit 2026-10-14: (1) ist `einstieg.spec`, Layout und Screenshots der Einstieg-Screens in `einstieg-layout.spec`, vier Viewports; seit 2026-10-15: (3) ist `probetest.spec` mit Neuladen, Fake-Clock und abgelaufener Zeit, Layout aller Probetest-Screens und Druck-PDF in `probetest-layout.spec`; seit 2026-10-16: Übungsrunde mit Lesetext in `lesen.spec` auf `/dev/text/t-sach-900?runde`, Layout mit Textkasten und Budget je Format in `text-layout.spec`, vier Viewports)
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
