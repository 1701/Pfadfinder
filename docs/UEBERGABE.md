# UEBERGABE.md – Wiedereinstieg nach der Entwicklungspause

Stand: Commit `97d2498` (27.10.2026) plus die Übergabe vom 28.10.2026, `package.json` 0.1.0, Content-Schema 1.0.28. Dieses Dokument reicht, um ohne weitere Notizen weiterzuarbeiten. Es fasst zusammen und verweist; die Regeln selbst stehen in den Dokumenten aus Abschnitt 2.

## 1. Stand

Pfadfinder ist eine kostenlose PWA für Kinder der 4. Klasse in Baden-Württemberg zur Vorbereitung auf Kompass 4 (Mathe und Deutsch), live unter https://kompassheld.de. Ein Kind übt auf einer Karte mit zehn Gebieten, bekommt Aufgaben auf seinem Niveau mit Erklärung statt „Falsch“, sammelt Fundstücke und Entdeckungen, beginnt freiwillig mit einem Einstieg je Fach und kann Probetests mit 45 Minuten, Auswertung je Gebiet und Druckfassung machen. Alles läuft offline nach dem ersten Laden, ohne Konto und ohne Server-Daten; Fortschritt bleibt im Browser des Geräts und lässt sich als Datei sichern und einlesen. Für Erwachsene gibt es `/eltern`, `/so-gehts`, Impressum, Datenschutz und den Gerätebereich `/eltern/geraet`.

| Größe | Wert | Quelle |
|---|---|---|
| Items aktiv | Mathe 160, Deutsch 124 (dazu 28 Mathe `retired`, alle aktiven `draft`) | `content/manifest.json`, `content/items/**` |
| Lesetexte | 9 | `npm run content:validate` |
| Probetests | mathe-01 26,92 · mathe-02 27,33 · mathe-03 30,00 · deutsch-01 25,89 · deutsch-02 26,73 · deutsch-03 25,97 Min. geplante Zeit (Timer immer 45 Min.) | `npm run content:validate` |
| Formate | 10 (single-choice, multi-choice, number-input, match, order, cloze-select, mark-in-text, find-error, segment-text, short-answer) | CONTENT_SCHEMA §4 |
| Schema | 1.0.28, `schemaVersion` `"1.0"` | CONTENT_SCHEMA, CHANGELOG |
| Vitest | 1 190 Tests (Projekte `unit` und `content-smoke`) | `npm run check` |
| Smoke Chromium | 49 | CI-Lauf 40598574031, Job `smoke` |
| WebKit | 38 bestanden, 8 übersprungen | CI-Lauf 40598574031, Job `webkit` |
| Layout | lokal 64 Tests in vier Viewports; CI 56, weil `layout.spec` und `probetest-layout` dort nur die beiden Safari-Viewports messen | PROGRESS 27.10. (Aufgabe N), Layout-Lauf 40643752248 vom 28.10. |
| Laufzeit lokal | `npm run check` 28 s (28.10.); Layout komplett 31,1–31,4 Min. (Standard-Worker, PROGRESS 27.10.) | Kommandoausgabe, PROGRESS |
| Laufzeit CI | `ci.yml` ~2 Min. (drei parallele Jobs); `layout.yml` 27,9 Min. Tests, Job 28 m 42 s | Läufe 40598574031, 40643752248 |

## 2. Wo was steht

| Dokument | Rolle |
|---|---|
| `docs/PRODUCT.md` | Fachliche Wahrheit: Zielgruppe, Lernmodell, Modi, UX-Prinzipien, Roadmap |
| `docs/ARCHITECTURE.md` | Technik: Stack, Verzeichnisse, Domänenmodell, Kernabläufe, Teststrategie (§8) |
| `docs/CONTENT_SCHEMA.md` | Item-Vertrag, eingefroren; jede Änderung mit Versionssprung und `docs/CHANGELOG.md` |
| `docs/DEPLOY.md` | Betrieb und Tests: Cloudflare, Updates der App, GitHub-CI, Layout-Lauf, TMPDIR (§9) |
| `CLAUDE.md` | Regeln für Agenten: Sprache, Arbeitsweise, Screenshots, Tests und Läufe, Definition of Done |
| `.claude/skills/pfadfinder-ui/SKILL.md` | UI-Regeln für jede sichtbare Oberfläche |
| `docs/PROGRESS.md` | Verlauf, neueste Einträge oben, mit Entscheidungen und lokalem Teststatus |

Ergänzend: `tests/e2e/README.md` (was jede Playwright-Spec prüft), `README.md` und `CONTRIBUTING.md` (für Mitmachende).

## 3. Wieder einsteigen

```sh
npm ci                     # Node aus .nvmrc
npm run check              # Lint, Content, Vitest, Build; Pflicht vor jedem Commit
npx playwright test --project=chromium-landscape --project=chromium-portrait   # Smoke
npm run e2e                # alle Projekte außer Sweep; WebKit braucht die Ubuntu/Debian-Bibliotheken
npx playwright test --project=layout                                           # Layout, ~31 Min.
PFADFINDER_UPDATE_SCREENSHOTS=1 npx playwright test --project=layout <spec>    # nur betroffene Specs
PFADFINDER_SWEEP=1 PFADFINDER_SWEEP_ITEMS=<id>,<id> \
  npx playwright test --project=sweep sweep-luft-items                         # Luft je Item
```

- **Vor jedem Playwright-Lauf** die Vorab-Prüfung aus `CLAUDE.md` („Tests und Läufe“): Port 5199 frei, Speicher und Prozessreste ansehen, nie zwei Läufe gleichzeitig, keine Edits während eines Laufs.
- **TMPDIR:** `playwright.config.ts` legt lokal `TMPDIR` auf `~/.cache/pfadfinder-playwright`, wenn es nicht gesetzt ist. Grund: Ein `/tmp` als tmpfs mit Benutzerquota läuft mit parallelen Browsern voll, die Seiten hängen (DEPLOY §9, Issue #1).
- **Läufe ohne Schalter** schreiben nach `tests/e2e/output/`; Budgets werden per `cmp` gegen `tests/e2e/screenshots/` verglichen. Der Schalter `PFADFINDER_UPDATE_SCREENSHOTS=1` nur bei einer bewussten UI-Änderung und nur für die betroffenen Specs.
- **Jeder geänderte Screenshot** wird vor dem Commit geöffnet und angesehen; committet werden nur die Dateien, die zur Änderung gehören.
- **WebKit** läuft lokal nur mit den Systembibliotheken, die Playwright für Ubuntu/Debian mitliefert; sonst zählt der CI-Job `webkit`.

## 4. Ein Content-Batch

1. Items nach `docs/CONTENT_SCHEMA.md` in `content/items/<fach>/<bereich>.json`, Bilder unter `content/assets/svg/`, Texte unter `content/texts/deutsch/`; `content/typen.json` pflegen.
2. `npm run content:validate`: 0 Fehler; das Manifest wird neu erzeugt und mit committet.
3. Sweep je neuem Item am echten Platz (`sweep-luft-items`, Regeln im Kopfkommentar der Spec): ≥ 18 px Luft überall, weniger nur für die geschlossene Liste `AIR_EXCEPTIONS` in `tests/e2e/helpers.ts`. Ein neues Item darunter wird umgebaut oder vom Projektinhaber bewusst aufgenommen.
4. Probetest-Tausch, falls der Batch Plätze ersetzt; ein neuer oder geänderter Probetest schreibt sein Budget mit Schalter (`probetest-layout`), im selben Commit.
5. Layout-Projekt komplett ohne Schalter, alle vier Viewports, dazu Smoke.
6. `docs/PROGRESS.md`-Eintrag (≤ 10 Zeilen), dann `npm run check && git commit`.

## 5. Offene Punkte

Alle offenen Arbeiten stehen als Issues mit den Labels `aufgabe` und `pflege`: https://github.com/1701/Pfadfinder/issues?q=is%3Aopen+label%3Aaufgabe%2Cpflege

## 6. Entscheidungen, die man kennen muss, bevor man etwas „verbessert“

- **Name:** Das Produkt heißt Pfadfinder; kompassheld.de ist nur die Adresse, „Kompass“ steht nie im Produktnamen.
- **Daten:** Kein Login, keine Server-Daten; Dexie (IndexedDB) steckt nur in lazy Chunks; unter den Erwachsenenseiten lädt es allein der Gerätebereich, nie die Startseite (`scripts/check-bundle.ts`).
- **Gerät:** Zielgerät ist das iPad; Laptop geht, das Handy wird nicht empfohlen und nicht optimiert.
- **Ehrlichkeit:** Die Sätze über die Herkunft der Aufgaben sagen, was ist, und kündigen keine Durchsicht durch eine Lehrkraft an.
- **Anrede:** Erwachsenenseiten in Sie-Form; `/so-gehts`, Impressum, Datenschutz und `/eltern/geraet` duzen noch (Issues). Kinder werden geduzt.
- **Navigation:** Ein Konzept für alle Erwachsenenseiten, die Kopfzeile `ErwachsenenKopf`: „Zurück“ statisch, die anderen Seiten in fester Reihenfolge, kein Footer.
- **Luft:** 18 px über dem Band auf jedem Screen; weniger nur für die geschlossene Liste `AIR_EXCEPTIONS`, bis das Band neben Lesetexten umgebaut ist.
- **Sweep:** Er misst am echten Platz jedes Probetests, weil Platz 24 („Zur Auswertung“) das Band höher macht.
- **Layout-Lauf:** `probetest-layout` läuft parallel; lokal liegt `TMPDIR` auf der Platte statt im quotierten tmpfs. Die frühere Serialisierung ist zurückgenommen.
- **Kontakt:** Nur per E-Mail (mailto mit Vorlage) oder GitHub-Issue; keine Formulare, kein Backend.
- **Lizenz:** Code MIT, Inhalte unter `content/` CC BY-SA 4.0.
