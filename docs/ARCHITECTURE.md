# ARCHITECTURE.md – Pfadfinder

Status: v1.0 · gilt für das MVP · Erweiterungspunkte in Abschnitt 9

## 1. Grundsatz

Client-only PWA. Kein Backend, keine Datenbank außerhalb des Geräts, kein Netzwerkzugriff nach dem Laden. Alles, was fachlich ist (Mastery, Scheduling, Probetest-Auswertung), lebt in reinen TypeScript-Funktionen ohne React-Abhängigkeit und ist unit-getestet. React ist nur Darstellung.

## 2. Stack (festgelegt)

| Zweck | Wahl | Begründung |
|---|---|---|
| Build | Vite 5 + TypeScript strict | schnell, PWA-Plugin ausgereift |
| UI | React 18, React Router 6 | Claude-Code-Stärke, großes Ökosystem |
| Styling | Tailwind CSS + CSS-Variablen für Theme | schnell iterierbar, Design-Tokens zentral |
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
| Hosting | Statisch (Cloudflare Pages oder GitHub Pages) | kostenlos, keine Betriebslast |

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
    data/                      Dexie-DB, Repositories, Zustand-Stores
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
MasteryState   { learnerId; fach; bereich; niveau: 1|2|3; window: boolean[] /* letzte 8 */; mastered: boolean; updatedAt }
ReviewEntry    { learnerId; itemId; dueAt: ISO; stage: 1 | 2 | "done" }         // Fehlerkiste: +1 Tag, +3 Tage
Session        { id; learnerId; mode; startedAt; endedAt?; attemptIds: string[]; goalReached: boolean }
ProbetestRun   { id; learnerId; probetestId; startedAt; submittedAt?; attemptIds; result?: { byBereich: Record<Bereich, {correct, total}>; percent } }
Collectibles   { learnerId; unlocked: string[] }                                 // Fundstücke je gemeisterter Etappe
```

Export-Format: `{ version: "1", exportedAt, learner, attempts, mastery, reviews, sessions, probetestRuns, collectibles }` als JSON-Datei. Import validiert mit Zod und migriert nach Versionsnummer. Das Export-Format ist das spätere Sync-Format (Roadmap v2).

## 5. Kernabläufe

**Üben.** `scheduler.pickNext(bereich, masteryState, recentItemIds, pool)` → Item auf aktuellem Niveau, nicht in den letzten 20 gesehen, Formatwechsel bevorzugt. Nach Antwort: `evaluation.check(item, answer)` → `mastery.update(state, correct)` → bei falsch `scheduler.enqueueReview(itemId, now)`. Session-Ziel 10 Items, danach Abschluss-Screen.

**Einstiegscheck.** Pro Fach 12 Items: je Bereich 2–3, Niveau-Leiter 1→2→3 adaptiv (richtig: hoch, falsch: bleibt). Ergebnis setzt `MasteryState.niveau` je Bereich; `window` startet leer.

**Fehlerkiste.** `ReviewEntry` fällig → erscheint vor neuen Items im Üben-Modus (max. 3 pro Session). Richtig: stage 1→2 (+3 Tage) → done. Falsch: stage bleibt, +1 Tag.

**Probetest.** Timer läuft im Domain-Modell (startedAt + 45 Min.), UI zeigt verbleibende Zeit nur dezent (kein rotes Blinken). Navigation vor/zurück erlaubt wie auf Papier. Abgabe manuell oder bei Ablauf. Auswertung pro Bereich und gesamt; Attempts fließen **nicht** in Mastery (Probetest ist Messung, nicht Training).

**Vorlesen.** Jeder Item-Screen hat einen Button; Text = `readAloud ?? stimulus.text + prompt`. Im Probetest deaktiviert, außer bei Mathe (Lesehürde ist dort nicht Testgegenstand – Entscheidung Markus, Default: an).

**Druck.** Route `/probetest/:id/print` rendert alle Items im Papier-Layout (Nummerierung, Antwortfelder, Zeilen für Kurzantwort) plus Lösungsblatt auf separater Seite. `@media print` blendet Chrome aus.

## 6. Format-Renderer

`src/ui/formats/registry.ts` mappt `Item.format` → React-Komponente mit einheitlichem Vertrag:

```ts
type FormatProps<P, A> = {
  item: Item & { payload: P };
  answer: A | null;
  onChange(answer: A): void;
  disabled: boolean;              // nach Abgabe
  revealed?: { correct: boolean; solution: Solution };  // Feedback-Darstellung
};
```

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
- E2E: (1) Einstiegscheck → Karte zeigt Niveaus, (2) Üben 10 Items → Abschluss-Screen, (3) Probetest starten → abgeben → Auswertung
- `scripts/validate-content.ts` läuft in CI und als pre-commit
- Lighthouse PWA ≥ 90, Accessibility ≥ 90

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
