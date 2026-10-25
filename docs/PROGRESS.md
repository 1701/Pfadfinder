# PROGRESS

Neueste Einträge oben. Je Eintrag max. 10 Zeilen: Datum, was gebaut, was offen, Entscheidungen, lokaler Teststatus. Der CI-Link steht ab 2026-10-19 im Abschlussbericht, nicht hier (CLAUDE.md, DoD 3).

## 2026-10-25 – Niveau-Band (Schema 1.0.23) und Probetest mathe-03 (Aufgabe T)
- **Band-Regel:** `PROBETEST_NIVEAU_BAND` in `taxonomy.ts` statt 40/40/20 ± 1: I 29–44 %, II 38–55 %, III 16–23 %, `min·n ≤ Anzahl ≤ max·n` ohne Rundung. III 23 % statt 22 % (Entscheidung Markus), weil deutsch-90 (7/7/4 bei 18) und der Deutsch-Testaufbau in integrity.test (8/9/5 bei 22) sonst durchfallen. Band-Tests: gültig 10/10/4, 9/8/4, 7/13/4, 7/7/4 (18); ungültig 24/0/0, 12/12/0, 0/12/12, 6/14/4, 11/9/4, 7/6/5 (18).
- **mathe-03** (Zip t Fassung 2, wörtlich): 24 Items, 29,00 Min., 7/13/4, 12 Bild-Items, Reihenfolge wie Kompass 4 Mathe 2025, keine Überschneidung mit mathe-01/02. check.py vorher und `--applied` 0/0, content:validate 0/0.
- **Abweichung, Content-Patch m-dz-3-003** (keyPoints 1–2, incorrect, misconception gekürzt, Text aus dem Chat): in Safari quer lief die Lösung im Zustand „fehlt“ 8 px unter das Band, Durchsehen hatte 16 px. Danach fehlt 44, Durchsehen 68 px.
- **LONGEST** bleibt m-rf-3-001 (engster Kopf-Fall, Entscheidung Markus). Zusatzmessung m-dz-3-003 zeit45/zeit5: Luft ≥ 163 px (m-rf-3-001: 149), Kopf in einer Zeile.
- **Knappstes:** Ziel-Items unverändert (fehlt iPad quer m-dz-3-002 114, Safari quer m-gm-1-009 36, hoch m-gm-3-002 279/155; Durchsehen Safari quer m-gm-1-009 36); die seit B7 veralteten PNGs nachgezogen. mathe-01/02-Blöcke im Budget unverändert.
- **Sweep mathe-03 Durchsehen** (24 Items): knappste Luft iPad quer 176, iPad hoch 273, Safari quer 68, Safari hoch 149 px (jeweils m-dz-3-003); kein Item unter 18 px.
- **Offen:** `layout-bild-*` zeigt seit früheren Batches ein anderes Bild-Item (m-gm-2-009 statt Vogel-Diagramm), nicht committet.
- **Lokal:** `npm run check` grün (Unit 1 095), Smoke 39/39, Layout mit Schalter 52/52 in 24,6 Min.

## 2026-10-25 – Content: Batch SU sprache-untersuchen, 20 Items, kein SVG (Branch `su`)
- **Zip su Fassung 4 (wörtlich):** `items/deutsch/sprache-untersuchen.json` war leer, jetzt der Zip-Inhalt (byte-gleich). Kein Retire, kein Probetest geändert. check.py vorher und `--applied`: 0 Fehler, 1 Warnung (d-su-3-002, bekannt); content:validate 0/0.
- **Manifest Deutsch I/II/III:** lsa 9/8/4, lli 8/8/4, rsl 8/8/4, rss 8/8/4, su 8/9/3 = 101 aktiv, 0 retired. deutsch-01/02/03 25,98/26,23/24,18 Min. unverändert; Mathe 150/28. CONTENT_SCHEMA §7: Block „Kalibrierung Deutsch – Sprache untersuchen“ (kein Versionssprung).
- **Abweichung:** `tests/ui/map/Angebot.test.tsx:261` Regex endet jetzt auf „Schreibtricks, Wörter und Sätze.“, sonst nichts an der Datei. Unit 1 083 → 1 086 (MarkInText +3; order prüft su in einer Schleife, kein eigener Fall).
- **Sweep Fassung 2, 20 Items:** knappste Luft Üben/Durchsehen iPad quer 56/56, iPad hoch 284/244, Safari quer −52/−52, Safari hoch 160/120 px; unter 18 px nur Safari quer d-su-1-003 (−52, Match-Karten überlappen, Layout 50/52) und d-su-3-003 (3).
- **Abweichung, Patch vor dem Commit (Zip Fassung 4, Entscheidung Markus):** nur d-su-1-003 (kurze Match-Karten, Erklärungen im Stimulus) und d-su-3-003 (order-Elemente ≤ 31 Zeichen) ersetzt. Sweep danach Safari quer 156 bzw. 32 px (vorher −52 / 3), kein Wert unter 18, keine Befunde.
- **Karte `/`:** Schild-Luft quer 20,1 / 15,3, hoch 50,4 / 42,9 px (iPad/Safari), Rand +2,0 / +2,2 / +15,1 / +13,1, kleinstes Gebiet 146 / 119 / 153 / 131.
- **Lokal:** `npm run check` grün, Smoke 39/39, Layout mit Schalter 52/52 in 24,6 Min. Committet: karte-angebot-*.png, karte-budget-{ipad,safari}-portrait.json, probetest-karte-*.png; einstieg-ergebnis-deutsch-*, karte-*.png und karte-angebot-budget-* unverändert.

## 2026-10-25 – SU Phase B: fünfter Deutsch-Bereich `sprache-untersuchen` im Code (Branch `su`)
- **Gebaut:** Bereich `sprache-untersuchen` (su, „Wörter und Sätze“), leere Datei `items/deutsch/sprache-untersuchen.json`, Manifest. Schema 1.0.22: `PROBETEST_REQUIRED_BEREICHE` (Mathe alle 5, Deutsch die bisherigen 4), su-Items im Deutsch-Probetest nach den Lesen-Blöcken. `CHECK_ITEM_COUNT.deutsch` 15 mit Schutztest für die Lesen-Blöcke. Vorlesen: Rechtschreib-Bereiche aus der Taxonomie.
- **Karte:** hoch T1, quer W1b aus Phase A; „Sachtexte lesen“ und „Geschichten lesen“ 6 Einheiten tiefer (Rand quer −3,7 → +2,0). `mapLabels` in `tests/e2e/helpers.ts` prüft Schild-Luft (hoch ≥ 18, quer ≥ 15), Rand ≥ 0 und Inselname in `karte.spec` (neu `/dev/karte?alle`) und `einstieg-layout.spec` (neu `ergebnis-deutsch`).
- **Entscheidungen (Markus):** Branch `su`, `ci.yml` um `su` erweitert, lokal committet, Push mit dem su-Batch. Intro-Text „etwa 15 Minuten“ bleibt; Rechnung mit 15 Plätzen ≈ 17,2 Min.
- **Offen:** su wird Pflicht und „endet mit Rechtschreibung“ wird angepasst beim Neu-Mischen der Deutsch-Probetests.
- **Lokal:** `npm run check` grün (1 069 → 1 083 Tests), Smoke 39/39, Layout mit Schalter 52/52 in 23,8 Min.; committet nur Karten-, Ergebnis-, Probetest-Karte- und Deutsch-Intro-Screenshots samt Karten-Budgets.

## 2026-10-23 – Fix: currentItem bei gleichem Prompt und offener Lücke
- **Ursache des roten Smoke nach B9:** m-zo-2-025 (seit B7) hat denselben Prompt wie m-zo-1-016 ohne Stimulus. Die Prüfung über den Antwortbereich verlangte die Optionen aller Lücken, sichtbar ist nur die offene. Im Einstieg tritt das in ≈ 5 % der Läufe auf; m-gm-2-012 erreicht diese Spec nie (gm immer falsch, Leiter bleibt auf 1).
- **Gebaut (nur `tests/e2e/helpers.ts`):** Stimulus = Text und Bildbeschreibung (`aria-label`); das Item mit vollständig sichtbarem Stimulus gewinnt, sonst nur Items ohne Stimulus. Danach entscheidet der Antwortbereich, bei Lückentexten nur mit der offenen Lücke aus dem DOM; alles außer genau einem Treffer schlägt mit den IDs fehl. Die Bildbeschreibung brauchte es für m-rf-1-015/m-rf-2-014 (gleicher Prompt, Optionen A–D).
- **Lokal:** einstieg `--repeat-each=20` auf beiden Smoke-Projekten 160/160 (m-zo-2-025 zweimal dran), Smoke 39/39, blatt-layout 4/4.

## 2026-10-23 – Content: Batch B9 groessen-messen, 10 Items, 2 SVG
- **Zip b9 (wörtlich):** 2 SVG neu (gm-preisschild-1, gm-tabelle-1), 10 Items angehängt (m-gm-1-011, 1-012, 2-009…015, 3-005), textuell ans Dateiende, keine bestehende Zeile geändert. Kein Retire, kein Probetest geändert. check.py vorher und `--applied`: 0 Fehler, 0 Warnungen.
- **Manifest Mathe I/II/III:** zo 17/20/7, rf 15/16/6, gm 12/14/4, dz 9/7/4, ms 8/8/3 = 150 aktiv, 28 retired. mathe-01 26,92 Min., mathe-02 27,33 Min. unverändert.
- **Sweep, 10 Items:** knappste Luft Üben/Durchsehen iPad quer 166/222, iPad hoch 205/296, Safari quer 114/132, Safari hoch 81/172 px, kein Wert unter 18 px, keine Befunde.
- **Abweichung (Entscheidung Markus):** `tests/ui/formats/NumberInput.test.tsx:110` legt die Geld-Items mit allowDecimal fest; Liste um 7,50 € (m-gm-1-011) und 10 € (m-gm-2-009) ergänzt, sonst nichts an der Datei.
- **Lokal:** content:validate 0/0, Smoke 39/39, Layout ohne Schalter 52/52 in 23,5 Min., `tests/e2e/screenshots/` unverändert.

## 2026-10-23 – Content: Batch B7 zahlen-operationen und Patch P2
- **Zip b7-p2 (wörtlich):** 6 SVG neu, 20 Items angehängt (m-zo-1-021…023, 2-015…027, 3-007…010), retired mit pilotNote: m-ms-2-001, m-rf-3-004, m-rf-2-005, m-zo-2-007, m-dz-2-004, m-gm-2-007. Kopien m-dz-1-009 und m-gm-1-010 angehängt, mathe-01 ersetzt (drei Tausche). check.py vorher und `--applied`: 0 Fehler.
- **Schritt 1 (grep):** Treffer nur `m-rf-3-004` als `LONGEST` in probetest-layout.spec.ts. Entscheidung Markus: `m-rf-3-001` (kein Hinweis auf „längstes des ganzen Pools“).
- **Manifest Mathe I/II/III:** zo 17/20/7, rf 15/16/6, gm 10/7/3, dz 9/7/4, ms 8/8/3 = 140 aktiv, 28 retired. mathe-01 26,92 Min., mathe-02 27,33 Min.
- **Sweep, 25 Items:** knappste Luft Üben/Durchsehen iPad quer 166/184, iPad hoch 234/298, Safari quer 100/76, Safari hoch 110/174 px, kein Wert unter 18 px, keine Befunde.
- **Lokal:** content:validate 0/0, Smoke 39/39, Layout mit Schalter 52/52 in 22,9 Min. Committet: probetest-budget-* (Kopf minGap +5, Safari quer Durchsehen mathe-01 jetzt m-zo-3-003), probetest-aufgabe-zeit45/zeit5-* (LONGEST), probetest-druck.pdf. Rauschen und veraltete Knappstes-PNGs zurückgesetzt.

## 2026-10-23 – Content: B6 Würfelbilder Rahmen und Lücke
- **Zip b6-schraegbild-2 (wörtlich, Sichtprüfung Markus):** rf-gedreht-1 mit schmalerem Rahmen, der nicht mehr durch das A läuft. rf-wuerfel-1 ohne leere Reihe zwischen vorne und hinten, weiter 7 Würfel, Lösung unverändert. Keine Item-Änderung.
- **Sweep m-rf-1-012, m-rf-2-013:** knappste Luft Üben/Durchsehen iPad quer 166/198, iPad hoch 237/336, Safari quer 114/146, Safari hoch 113/212 px, keine Befunde. Kein Layout-Projekt.
- **Lokal:** content:validate 0/0, `npm run check` grün (1070 Tests).

## 2026-10-23 – Content: B6 Würfelbilder als Schrägbild
- **Grund (Sichtprüfung Markus):** Die Würfelgebäude waren isometrisch (Grundfläche als Raute), der Bauplan ist ein Quadrat mit „vorne ist unten“. Die Zuordnung verlangte eine 45°-Drehung im Kopf. Jetzt Schrägbild wie im Kompass-Test: vordere Reihe frontal, Tiefe nach rechts oben, verdeckte Flächen entfernt.
- **Unsichtbare Würfel:** Jeder oberste Würfel eines Stapels ist von vorne sichtbar. Verdeckt sind nur untere Würfel, die man erschließen muss.
- **Fehler behoben:** In rf-ansicht-1 waren die Antwortbilder B und C gleich (links = vorne bei diesem Gebäude). Jetzt vier verschiedene Bilder, Lösung weiter A.
- **Zip b6-schraegbild (wörtlich):** 6 SVG ersetzt (rf-wuerfel-1, rf-ansicht-1, rf-ansicht-2, rf-gedreht-1, rf-bauplan-2, rf-bauplan-3), gleiche viewBox 480 × 260. Feedback-Patch nur an m-rf-2-010 (misconception), m-rf-2-013 (incorrect, misconception), m-rf-2-015 (correct, misconception). Diff-Kontrolle: HEAD plus Patch ist gleich der neuen Datei, Lösungen unverändert.
- **Sweep, 6 Items:** knappste Luft Üben/Durchsehen iPad quer 166/198, iPad hoch 237/304, Safari quer 114/146, Safari hoch 113/180 px, keine Befunde. Kein Wert unter 30 px, daher kein Layout-Projekt.
- **Lokal:** content:validate 0/0, `npm run check` grün (1070 Tests).

## 2026-10-23 – Content: Batch B6 raum-form, 20 Items, 19 SVG
- **Zip b6 (wörtlich):** 19 SVG, 20 Items angehängt (m-rf-1-012…015, 2-010…021, 3-005…008), an m-rf-2-009 Bild rf-symm-2 und Optionen A–E (sechs Felder). Der erste Lauf war rot (hoch bis −134 px), darauf folgte Aufgabe 19.
- **Danach (Entscheidungen Markus):** Textpatch b6-texte an acht Items (nur `stimulus.text` und `prompt`, bei m-rf-1-012, 2-012 und 2-021 fällt der Stimulus-Text weg). m-rf-3-008 wird single-choice (format, prompt, payload, solution, feedback, estimatedSeconds 110 → 90), weil short-answer mit Bild seit 1.0.21 ein Fehler ist.
- **Ohne `git stash pop`:** Nur Content-Dateien kamen aus dem Stash. Die vier layout-bild-PNGs darin stammten noch aus dem alten Layout.
- **Manifest raum-form:** 39 Items, I/II/III = 15/17/7. Mathe 124 aktiv, 22 retired.
- **Sweep, 21 Items:** knappste Luft Üben/Durchsehen iPad quer 166/142, iPad hoch 237/280, Safari quer 114/90, Safari hoch 113/156 px, keine Befunde.
- **Lokal:** content:validate 0/0, `npm run check` grün (1070 Tests), Layout-Projekt mit Schalter 52/52 in 22,3 Min. Kein Screenshot geändert außer Rauschen und `layout-bild-ipad-landscape` (Umbruch aus Aufgabe 19), alles zurückgesetzt.

## 2026-10-23 – Aufgabe 19: Bild hoch unter dem Text, Schema 1.0.21
- **Befund (B6, auch HEAD):** Hoch stand ein Bild bis 2 : 1 mit 240 px neben dem Text. Für die Spalte blieben 70–107 px, lange Wörter liefen ins Bild (m-dz-1-003, -1-006, -2-001, -2-004, -3-001, m-rf-2-005). screen-checks sah es nicht: SVG war ausgenommen, der `<p>` ragte aus seiner Spalte, nicht der Text aus dem `<p>`.
- **Gebaut (Variante b, Freigabe Markus):** Das Bild steht einmal im DOM zwischen Stimulus und Frage (`.sheet-body`). Quer setzt ein Grid Bilder bis 2 : 1 daneben. Hoch 200 px wie quer, portrait-Regel und `--spacing-asset-tall` entfallen. `overlapProblems` zählt `.content-asset > svg` als Kasten. Gegenprobe: vorher je 30 Befunde hoch, danach grün.
- **Validator (integrity.ts, `WITH_PICTURE`):** Bild-Items mit mehr als zwei Sätzen Stimulus → Warnung, short-answer mit Bild → Fehler (Entscheidung Markus: m-rf-3-008 hatte trotz 80/114 Zeichen 2 px in Durchsehen Safari hoch). CONTENT_SCHEMA 1.0.21 §4.9, §7; PRODUCT §11 nennt es beim Umbau des Bands.
- **Gemessen (Prototyp, 45 Bild-Items):** 240 px unter dem Text: Safari hoch Üben 0 px (m-rf-3-008); 200 px: ≥ 81 px ohne m-rf-3-008. Die 14 Items mit Bild bis 2 : 1 ändern sich hoch, alle ≥ 81 px.
- **Quer:** Die Luft ist bei allen 24 Bild-Items gleich. Die Textspalte ist etwas breiter: m-dz-3-001 bricht auf dem iPad quer ein Wort später um, m-rf-1-005 hat in Safari quer 1 statt 2 Prompt-Zeilen. Den Screenshot `layout-bild-ipad-landscape` habe ich nicht committet, er ist im Bericht genannt. Nachtrag: Nach der Freigabe von Markus habe ich ihn mit Schalter nachgezogen (chore).
- **Lokal:** `npm run check` grün (1070 Tests), Layout-Projekt mit Schalter 52/52 in 21,0 Min., Chromium-Projekte 39/39. Committet: layout-bild hoch (2), format-multi-choice hoch (4), probetest-aufgabe-knappstes hoch (2), probetest-budget hoch (2).

## 2026-10-23 – Content-Patch P: Kompass-4-Anker, Schema 1.0.20, mathe-02 neu
- **Schema 1.0.20 (Doku):** §2 Niveauwechsel nur durch retire + Kopie mit neuer ID, §3 `calibration: "kompass4-2025"`, §7 Block „Kalibrierung Mathe (Kompass 4 2025)“ ersetzt. **Markus:** In der Zeile in §7 Mathematik steht jetzt „Zahlenraum 10 000 (siehe Kalibrierung Mathe)“ statt „bis 1.000.000“. Der Enum-Wert steht auch im Zod-Validator (`schemas.ts`) und hat einen Test. Im CHANGELOG steht deshalb „Doku und Enum-Wert im Zod-Validator“ statt „kein Validator-Code“ (Entscheidung Markus).
- **Content (Zip patch-p, wörtlich):** 15 Items retired (pilotNote aus retire.json), 9 neue IDs angehängt, mathe-02 neu (24 Items, 27,33 Min., 10/10/4), in mathe-01 wird m-ms-3-001 zu m-ms-2-009 (10/10/4). Mathe hat 104 aktive und 22 zurückgezogene Items. groessen-messen.json bleibt kompakt formatiert, das neue Item steht dort wie in der Zip ausgeklappt.
- **Tests:** m-rf-2-008 ist retired. Order.test.tsx und formate.spec.ts nutzen deshalb das inhaltsgleiche m-rf-1-011 (Entscheidung Markus). speech.test.ts testet weiter am retired m-ms-3-001, unverändert.
- **Budget:** Das Layout-Projekt lief mit Schalter. Committet sind nur `probetest-budget-*` (4), knappstes mathe-02 Safari quer: Durchsehen m-gm-1-009 mit 36 px.
- **Sweep, 9 neue Items:** knappste Luft Üben/Durchsehen iPad quer 168/144, iPad hoch 370/360, Safari quer 60/36, Safari hoch 246/236 px.
- **Lokal:** `npm run check` grün (1066 Tests), content:validate 0 Fehler, 0 Warnungen, check.py der Zip „OK – 0 Fehler“ (nicht im Repo). Layout-Projekt 52/52 in 20,9 Min., Chromium-Projekte 39/39.

## 2026-10-23 – Chore: Repo wird öffentlich
- **Historie umgeschrieben (git filter-repo, Go Markus):** Name der Tochter → „Tochter“ (24 Vorkommen in `git log -p`, 0 in Messages), Autor-Adresse → pfadfinder@steireif.de, Cloudflare-Account-ID → `REDACTED-CLOUDFLARE-ACCOUNT-ID`. 227 Commits, Stand des HEAD gleich dem alten bis auf die Ersetzungen, Force-Push auf main. Andere Klone müssen neu geklont werden.
- **Historienprüfung danach:** keine Tokens, Schlüssel, `.env`, Account- oder Zone-IDs; E-Mails nur pfadfinder@, die Anthropic-Trailer und i@izs.me (npm-Text in package-lock, erlaubt).
- **Lizenzen:** `LICENSE` (MIT), `content/LICENSE` (CC BY-SA 4.0, Text von creativecommons.org), neues `README.md` mit Zweck, Lizenzabsatz (Andika: `public/fonts/andika/OFL.txt`) und dem Hinweis, dass echte Prüfungsaufgaben nie im Repo liegen. `package.json` hatte „MIT“ schon.
- **Account-ID:** nicht mehr in `wrangler.jsonc`; `deploy:preview` braucht `CLOUDFLARE_ACCOUNT_ID` (DEPLOY §3). Testnamen: Lerner „Mia“, Stimme „Helena“.
- **CLAUDE.md:** keine echten Kompass-Aufgaben, Testhefte oder Scans; Kindernamen ab jetzt als „Tochter“.
- **layout.yml:** Nachtlauf 01:00 UTC wieder aktiv, mit dem Job „kein neuer Commit, kein Lauf“ aus 8f80fcf^, jetzt mit Playwright-Container. DEPLOY §9 nachgezogen.
- **Lokal:** `npm run check` grün. Keine UI-Änderung, keine Playwright-Projekte.
- **Nachtrag:** Layout-Lauf im Container nach dem Umschalten grün in 23 Min. (vorher ~40). CLAUDE.md „Befehle“ ohne „kostet Minuten“, Dauer dort und in DEPLOY §9 ~23 Min.

## 2026-10-23 – Chore: E2E-Jobs im Playwright-Image, kein apt mehr
- **Befund (Run 39907709670, webkit):** Für WebKit brauchte apt 181 Pakete mit 80–90 kB/s, beide 6-Min.-Versuche liefen ab.
- **Entscheidung Markus (a):** `smoke` und `webkit` (ci.yml) und der Layout-Job (layout.yml) laufen im Container `mcr.microsoft.com/playwright:v1.63.0-noble`, genau die Version von `@playwright/test` aus package-lock.json. Bei jedem Playwright-Update muss der Tag mitgezogen werden.
- **Ausgebaut:** Browser-Install, Retry, Warten auf die dpkg-Sperre, Browser-Cache und die `timeout-minutes` am Setup-Schritt. `.github/actions/setup` macht nur noch Node und den `node_modules`-Cache. `check` läuft ohne Container. DEPLOY §9 angepasst, CLAUDE.md DoD 3 nannte den Install nicht.
- **Lokal im Image geprüft:** Klon von a765eb9, `npm ci`, Chromium- und WebKit-Projekte: 71 grün, 6 übersprungen (Service-Worker-Tests in WebKit, gewollt). Keine Versionsabweichung, Browser liegen unter `/ms-playwright`, git 2.43 ist im Image, versionierte Screenshots blieben unberührt.
- **Nicht committet (Korrektur):** probetest-layout.spec lief mit Schalter (6/6, 6,6 Min.). Die „knappstes“-Screenshots zeigen Mathe-Items, nicht deutsch-03. Die Unterschiede waren eine Feedback-Animation mitten im Einblenden. `probetest-text-durchsehen-knappstes-ipad-landscape` war diesmal gleich. `probetest-druck.pdf` unterscheidet sich nur im Zeitstempel. Alles zurückgesetzt.
- **Nachtrag (Run 39910965609):** Im Container läuft root auf einem Checkout des Runner-Nutzers, und `actions/checkout` setzt `safe.directory` nur für seinen eigenen Schritt. `npm ci` (prepare: `git config core.hooksPath`) brach mit 128 ab. Die Setup-Action setzt `safe.directory` jetzt selbst. Lokal im Image nachgestellt: ohne den Eintrag 128, mit ihm 0.
- **Lokal:** `npm run check` grün. Der Layout-Job im Container ist noch nicht gelaufen (nur von Hand).

## 2026-10-23 – Chore: WebKit-Install 6 Min., probetest-layout.spec parallel, Budget deutsch-03
- **Befund (Run 39871704554, webkit):** Der Retry griff, aber der Azure-Spiegel lieferte ~54 kB/s, beide Versuche liefen über 4 Min. Der Rerun war grün.
- **`setup/action.yml`:** 6 Min. je Versuch für WebKit, Chromium bleibt bei 4. In ci.yml hat der Setup-Schritt des WebKit-Jobs `timeout-minutes: 14`, die anderen behalten 12.
- **`probetest-layout.spec`:** Die Tests teilen keinen Zustand. Jeder Viewport-Test hat einen eigenen Browser-Kontext, eigenes `report`/`red` und Dateien mit dem Viewport im Namen. Die Drucktests schreiben eigene Dateien, auf Modulebene gibt es nur Konstanten. Daher `mode: 'parallel'`, allein 6,5 statt 26,8 Min.
- **Budget:** probetest-layout.spec einmal mit Schalter. `probetest-budget-*` (4) bekommen den Block deutsch-03 und sind ohne ihn byte-gleich. Nur diese vier Dateien committet. `probetest-druck.pdf` und zwei „knappstes“-PNGs (iPad quer, jetzt ein deutsch-03-Item) habe ich zurückgesetzt.
- **CLAUDE.md (Markus):** Ein neu eingespielter Probetest schreibt sein Budget mit Schalter, im selben Commit.
- **Lokal:** `npm run check` grün. Das Layout-Projekt lief 52/52 in 21,4 Min. Vorher waren es 27,7 Min., vor beiden Chores 43,2 Min. Engpass ist jetzt die text-layout.spec (10,3 Min., nicht parallel).

## 2026-10-23 – Chore: Browser-Install mit freier dpkg-Sperre, layout.spec parallel
- **Befund (Run 39866922436, smoke):** `timeout` beendete nach 4 Min. nur npx. `apt-get` lief als root unter sudo weiter und hielt die dpkg-Sperre, der zweite Versuch scheiterte sofort („Could not get lock“), auch beim Rerun.
- **`setup/action.yml`:** Vor dem zweiten Versuch `sudo pkill apt-get || true`, dann bis zu 60 s warten, bis `fuser` die Sperren frei meldet, danach `dpkg --configure -a` und Retry.
- **`timeout-minutes: 12`:** Composite-Schritte kennen es nicht. Es steht deshalb am Schritt `uses: ./.github/actions/setup` in ci.yml (check, smoke, webkit) und layout.yml.
- **`layout.spec`:** `test.describe.configure({ mode: 'parallel' })`. Die vier Viewports liefen lokal in 12,5 statt nacheinander 42 Min. Engpass ist jetzt die probetest-layout.spec (26,8 Min., Viewports nacheinander), nicht gebaut. In CI läuft 1 Worker, dort ändert sich nichts.
- **Lokal:** `npm run check` grün, Layout-Projekt 52/52 in 27,7 statt 43,2 Min. `karte-budget-*` byte-gleich. `probetest-budget-*` ist ohne den Block deutsch-03 inhaltsgleich. Den fehlt der versionierten Datei seit dem Content-Eintrag vom 22.10. (ohne Schalter), seine Werte stimmen mit jenem Eintrag überein. Keine Screenshots mit Schalter.

## 2026-10-23 – Aufgabe 17: Satz vor dem ersten Fundstück
- **Befund (iPad):** Das Kind verstand die Striche, nicht ihren Sinn. Bis zum allerersten Fundstück steht im Tagesziel „Jede Aufgabe, die du übst, bringt dir ein Fundstück.“ (Wortlaut Markus) in Tinte. Quer an Stelle der leeren Wegstriche über „Heute …“, hoch in einer Zeile an Stelle von Strichen und „Heute …“.
- **Mechanik:** Fundstück = `practice`- oder `review`-Attempt (`isFundstueck`, auch in `todayProgress`). `hasFundstueck` → `MapProgress.foundAny` aus den ohnehin gelesenen Attempts, kein Dexie-Feld, kein Store-Status. Check und Probetest zählen nicht.
- **Entscheidungen (Markus):** Variante C, normale Tinte, ein Satz. Kein Satz, solange das Angebot steht oder der Speicher nicht lesbar ist. Vorlesen über den Titel-Knopf, neu mit Punkt nach „Heute: n von 10 Fundstücken“. Dev: `/dev/karte?erstes` (auch mit `&neu`).
- **Gemessen (Prototyp):** Ein Zweizeiler unter dem Tagesziel oder statt der Striche auch hoch drückte die Namen in Safari hoch auf 16,8 bzw. 17,8 px, mit „Neu laden“ auf 15,6 bzw. 16,5 px. C lässt in allen vier Viewports Namen, Gebiete und Kopfhöhe gleich (karte.spec prüft das).
- **Tests:** domain (0 Attempts, nur Check/Probetest, practice, review), map-progress, Import einer Sicherung (ElternScreen), Karte mit Testing-Library inkl. Vorlesen. In karte.spec `?erstes`, `?erstes&neu` und `/` nach „Später“, im Budget-JSON jetzt Kopf- und Kartenhöhe und Luft. In einstieg-, eltern- und ueben.spec heißt es `expectFirstHint` statt „Heute: 0 von 10“ sichtbar.
- **Lokal:** `npm run check` grün (1065 Tests), Chromium-Projekte 39/39, Layout-Projekt 52/52 (43,2 Min., die layout.spec läuft ~10,5 Min. je Viewport nacheinander in einem Worker). Screenshots mit Schalter: karte-erstes (4, neu), start (2), karte-budget (4).

## 2026-10-22 – Chore: CI je Push ~3 Min., Layout-Projekt lokal statt in CI
- **Diagnose:** 43–52 Min. je Push. Das Layout-Projekt brauchte 37 Min. davon (layout.spec ~19, probetest-layout.spec ~11). Install und Build < 1,5 Min. Das Repo ist privat: 2-vCPU-Runner, Playwright mit 1 Worker.
- **`ci.yml`:** Bei jedem Push laufen drei parallele Jobs: check, Chromium-Smoke, WebKit-Smoke. Die Scope-Logik ist entfernt. **`layout.yml`:** nur das Layout-Projekt und nur von Hand. Der nächtliche Lauf ist ausgesetzt, solange das Repo privat ist.
- **Gemeinsames Setup** `.github/actions/setup`: Cache für `node_modules` und für die Playwright-Browser. `report.json` (Zeiten je Test) liegt in jedem E2E-Artefakt.
- **Entscheidungen (Markus):** Layout nicht per Pfad, weil 27 von 219 Commits Layout-Wirkung außerhalb von src/ui, content und tests/e2e hatten. WebKit läuft im Push-Workflow. Kein dist-Artefakt, die Config baut im webServer selbst. Specs, Viewports und `playwright.config.ts` sind unverändert.
- **Hinweis, nicht gebaut:** layout.spec besteht aus 2 Tests à ~9,5 Min. Auch mit mehr Workern bliebe der Layout-Lauf ≥ 10 Min.
- **Warum ohne cron (Markus):** In ~45 Layout-Läufen im Oktober (~30 h) gab es einen echten Fund (m-rf-1-004, Safari quer), zwei Abstürze („Page crashed“) und zwei Fehler, die auch Smoke-Tests zeigten. Der Oktober liegt geschätzt bei ~2.650 Actions-Minuten. Neu: Das Layout-Projekt läuft vor UI- und Content-Commits lokal (DoD 1).
- **Doku:** DEPLOY.md §9 und CLAUDE.md (DoD 1, DoD 3 nennt nur ci.yml, Befehle).
- **Nachtrag:** Der Browser-Install bricht nach 4 Min. ab und versucht es einmal neu (`timeout` im Shell-Schritt, weil Composite-Schritte kein `timeout-minutes` haben). Grund: apt hing in 2 von 5 Läufen 9–10 Min. `layout.yml` ist in `paths-ignore` von `ci.yml`.
- **Lokal:** `npm run check` grün. Chromium-Projekte mit `--reporter=dot,json` 39/39, `report.json` in tests/e2e/output, `git status` danach sauber.

## 2026-10-22 – Aufgabe 18: Vorlesen verrät keine Fehlschreibung
- **Befund (iPad):** Vorlesen sprach bei Rechtschreib-Items die Fehlerwörter, „Hunt“ klang englisch und verriet die Lösung. Regel: Falsch geschriebene Wörter werden nie vorgelesen.
- **(1) Code:** `itemSpeech` liest bei find-error und cloze-select in rs-laut-buchstabe und rs-strategien nach dem Prompt-Teil den Satz in richtiger Schreibung aus `solution` (`spelledSentence`), ohne „Antworten“, „Lücke“ und Optionen. Fehlt eine Korrektur oder Lösung, nur der Prompt-Teil. Betroffen genau 15 Items (Test). Mathe- und Lese-cloze-select (12) und andere RS-Formate unverändert. ARCHITECTURE §5 nachgezogen.
- **Fallback:** `content:validate` lehnt beide Fälle schon heute als Fehler ab (corrections genau je errorId; Lösung je Lücke, Platzhalter = Lücken).
- **(2) Schema 1.0.19 (§7 Rechtschreibung):** Regel für Optionen und Stimuli mit Fehlschreibung. Option-`readAloud` an d-rsl-1-002, d-rsl-2-005, d-rss-1-005, d-rss-2-003; Item-`readAloud` an d-rsl-3-001, d-rss-3-001. d-rss-1-008, d-rss-2-004 bleiben. Der Validator prüft das nicht. Manifest unverändert.
- **Lokal:** `npm run check` grün (1057 Tests), `content:validate` 0/0, Chromium-Projekte 39/39. Keine Screenshots.

## 2026-10-22 – Nachtrag Release-Liste: (1), (2), (5); (3)/(4) zurückgehalten
- **(1) /eltern:** Titel „… sichern, einlesen oder löschen.“ Eine Sicherung aus einer neueren Version (`parseImport` → `newerVersion: true`) zeigt „Diese Sicherung ist aus einer neueren Version. Warte, bis unter der Karte „Neu laden“ steht, tipp darauf und versuch es dann noch einmal.“ (Wortlaut Markus). Kaputte Dateien zeigen weiter „Das ist keine Pfadfinder-Sicherung.“
- **(2) CLAUDE.md:** Zwei Arbeitsregeln: Messungen nur in der App mit Andika, keine Dateiänderungen während eines Playwright-Laufs.
- **(5) Datenschutz/Hosting:** Ergänzt um die Übermittlung in die USA auf Grundlage des DPF und, soweit erforderlich, der Standardvertragsklauseln (Cloudflare DPA). Die Anschrift stimmte schon.
- **(3)/(4) nicht gebaut (Entscheidung Markus):** Item-`readAloud` ersetzt nur den Prompt, `itemSpeech` hängt immer „Antworten: …“ an (Optionen, find-error-Wörter, cloze-Satz). „Nur Prompt“ geht ohne Code- oder Schema-Änderung nicht. Schema bleibt 1.0.18. Die Vorschläge (a)/(b) stehen im Bericht.
- **Lokal:** `npm run check` grün, Chromium-Projekte 39/39, `blatt-layout` 4/4 in vier Viewports. Screenshots mit Schalter: eltern-loeschen, datenschutz (je 4).

## 2026-10-22 – Release-Liste (1)–(11)
- **(1) /so-gehts** „So funktioniert Pfadfinder“: Text von Markus wörtlich (korrigierte Fassung), Spalte `max-w-measure` 30rem (längste Zeile 67 Zeichen), nur der Text scrollt, „Zurück“ zur Karte im Band. Verlinkt als „So geht’s“ auf /eltern und neben „Für Eltern“ am Ende von Impressum und Datenschutz. **Nicht auf der Karte:** Die Zeile bräuchte hoch 723 von 720 px (Entscheidung Markus), karte.spec unverändert.
- **(2)/(3)** Name, Anschrift, E-Mail (mailto, `EmailText`) in Impressum und Datenschutz, keine Marker mehr in `src`; Impressum: „… gehört zu keinem Pfadfinderverband.“ CLAUDE.md: Seiten für Erwachsene von „≤ 2 Sätze“ ausgenommen.
- **(5)/(11) /eltern:** Premium-Stimme-Hinweis über den Knöpfen; „Sicherung einlesen“ (Datei, `parseImport`, Rückfrage, `importLearnerData`, Karte neu). Eigener Satz bei Schreibfehler: „Das Einlesen hat nicht geklappt. …“. /eltern scrollt weiter nicht (vier Viewports).
- **(6)** Probetest-Liste: „gemacht“ ohne Datum; Daten und Export unverändert. **(7)** Druck einer Aufgabe mit Lesetext: ganzer Text vor der Aufgabe (`print.css`), Chromium-PDF d-lsa-1-001 und d-lsa-3-004 je 5/5 Absätze. **(8)** `content:validate` nennt je Probetest die Zeit (`formatProbetestTime`), Regeln unverändert.
- **(10)** Nach grüner CI für (1)–(9): `noindex` aus `index.html` entfernt, `robots.txt` erlaubt alles, keine Sitemap vorhanden.
- **(9)** Kein Bug: Nach „Später“ ruht das Angebot bis Mitternacht, Deutsch kommt erst, wenn Mathe einen Stand hat (PRODUCT §5.4, `check-offer.ts`).
- **Lokal:** `npm run check` grün, Chromium-Projekte 39/39, Layout-Projekt in vier Viewports 52 Tests: erster Lauf 50/52 (karte, blatt-layout iPad quer: Seite lud während des Laufs neu, weil ich eine Datei bearbeitet hatte), Wiederholung beider Specs 9/9 grün. Screenshots mit Schalter: eltern-frage, eltern-loeschen, impressum, datenschutz, probetest-liste, so-gehts (neu).

## 2026-10-22 – Content: Probetest deutsch-03 eingespielt
- **Eingespielt:** `content/probetests/deutsch-03.json` unverändert (21 Items, t-sach-004 und t-lit-004), Manifest neu erzeugt. Vorab per Python geprüft: alle IDs vorhanden, nicht retired, keine in deutsch-01/02, niveauMix 9/8/4 und bereichMix stimmen. `content:validate` 0 Fehler, 0 Warnungen.
- **Zeit:** 1205 s Items + 246 s Lesezeit = 1451 s = 24,18 Min.; geprüfte Untergrenze ≥ 24 Min. (1440 s). Der Validator nennt die Summe nur im Fehlerfall.
- **Gemessen (`probetest-layout`, knappstes deutsch-03-Item; iPad quer, hoch, Safari quer, hoch):** Antworten d-lsa-2-008 222, d-lli-2-008 191, d-rss-2-005 172, d-lsa-1-009 184; Durchsehen d-lsa-2-008 53, d-lsa-3-004 44, d-lsa-2-007 1, d-lsa-3-004 44; Fehlt d-lsa-2-008 145/117/37/105; Vergleichen d-lsa-3-004 209/126/101/126.
- **Ausnahme (bekannt, kein Patch):** Durchsehen Safari quer d-lsa-2-007 1, d-lli-2-007 1, d-lsa-2-008 15 px (≥ 0); alle anderen Items dort ≥ 19 px.
- **Lokal:** `npm run check` grün, `probetest-layout` 6/6 in vier Viewports, Chromium-Projekte 39/39. Keine Screenshots mit Schalter.

## 2026-10-22 – Content: Lese-Batch 004 (t-sach-004, t-lit-004), Sweep „Luft je Item“
- **Eingespielt:** t-sach-004 „Vom Regen zum Wasserhahn“, t-lit-004 „Die Murmel“ und je 5 Items (d-lsa-1-008, 1-009, 2-007, 2-008, 3-004; d-lli-1-007, 1-008, 2-007, 2-008, 3-004), unverändert angehängt. `content:validate` 0 Fehler, 0 Warnungen. Nichts ausgelassen.
- **Spec:** `tests/e2e/sweep-luft-items.spec.ts` (Projekt `sweep`, `PFADFINDER_SWEEP=1`, IDs in `PFADFINDER_SWEEP_ITEMS`) ersetzt die temporäre Spec aus muster-strukturen Patch 2, die nicht mehr da war; neu geschrieben, m-ms-1-004 liefert alle 12 Werte gleich. `/dev/probetest` zeigt dafür auch Items außerhalb des Probetests (nur Dev, `dist` byte-gleich).
- **Knappste Luft (Üben / Durchsehen):** d-lsa-1-008 130/194, 1-009 132/198, 2-007 42/1 (Safari quer), 2-008 56/15 (Safari quer), 3-004 44/19 (Safari quer); d-lli-1-007 130/194, 1-008 37/68, 2-007 42/1 (Safari quer), 2-008 74/135, 3-004 44/19 (Safari quer). Durchsehen außerhalb Safari quer überall ≥ 44 px.
- **Lokal:** `npm run check` grün, `text-layout` („echte Lesetexte“) 4/4, `layout.spec` 4/4 in vier Viewports; beide Lese-Screens ohne Überlauf. Keine Screenshots mit Schalter.

## 2026-10-22 – Content: muster-strukturen Patch 2, Schema 1.0.18
- **Eingespielt:** m-ms-1-004, m-ms-2-005, m-ms-1-008: Gleichungen im Stimulus mit „und“ statt Komma, die gesuchte Aufgabe als Frage im Prompt, `readAloud` nachgezogen, Lösungen unverändert. `content:validate` 0 Fehler, 0 Warnungen.
- **Gemessen (Luft antworten/richtig/noch nicht; iPad quer, hoch, Safari quer, hoch):** m-ms-1-004 280/394/354, 442/628/589, 172/286/246, 318/504/465; m-ms-2-005 280/394/354, 442/628/565, 172/286/246, 318/504/441; m-ms-1-008 392/338/336, 632/552/552, 284/230/228, 508/428/428.
- **Schema 1.0.18 (nur Doku):** §7 Mathematik „Mehrere Gleichungen nie durch Komma trennen“, CHANGELOG. Der Validator prüft das nicht.
- **Lokal:** `npm run check` grün, `layout.spec` in vier Viewports grün.

## 2026-10-22 – Content: lesen-sachtext Patch 5, deutsch-02 eingespielt
- **Eingespielt:** d-lsa-3-002 (Musterlösung 83 → 72, Kernpunkte 51/36 → 29/36, correct 67 → 57), danach deutsch-02 (1573,5 s = 26,23 Min.). `content:validate` 0 Fehler, 0 Warnungen.
- **Gemessen:** d-lsa-3-002 Durchsehen Safari quer −7 → 19 px, Prompt weiter 2 Zeilen. Knappstes deutsch-02 im Durchsehen (iPad quer/hoch, Safari quer/hoch): d-lli-2-002 79, d-lli-1-001 18, d-lsa-2-004 1 (Ausnahme ≥ 0), d-lli-1-001 18. Üben d-lsa-3-002 ≥ 44 px (`text-inhalt`).
- **Lokal:** `npm run check` grün, `probetest-layout` 6/6 und `text-layout` 8/8 in vier Viewports. `probetest-budget-*` mit Schalter (jetzt mit `promptLines`).

## 2026-10-21 – Aufgabe 16 Nachlauf (1): Lesen-Patch für deutsch-02, deutsch-02 weiter ausgelassen
- **Eingespielt:** d-lli-2-002 (Prompt 52 → 43, Elemente 103 → 84 Zeichen), d-lsa-3-002 (Prompt 64 → 53, misconception 73 → 69), d-lsa-2-004 (Prompt 64 → 54). `content:validate` 0 Fehler, 0 Warnungen, auch mit deutsch-02.
- **Gemessen, Durchsehen Safari quer vorher → nachher:** d-lli-2-002 −29 → 1 (keine Überlappung mehr), d-lsa-3-002 −7 → −7, d-lsa-2-004 1 → 1. Prompt-Zeilen dort jeweils 2 → 2. Hoch wird d-lli-2-002 einzeilig, die beiden anderen bleiben zweizeilig.
- **Ausgelassen:** deutsch-02 scheitert weiter an d-lsa-3-002 (Regel ≥ 0); Datei draußen, nicht nachgepatcht. Schema 1.0.18 und Validator (Nachlauf 2, 3) entfallen, weil nicht alle drei Items ≥ 18 px haben.
- **Spec:** `probetest-layout` schreibt die Prompt-Zeilen neben dem Text ins Budget (`deutsch.<id>.promptLines`); `promptLines` liegt jetzt in `helpers.ts` (vorher `sweep-match.spec`).
- **Lokal:** `npm run check` grün (1023 Tests), Chromium-Projekte 39/39, Layout-Projekt 46/46 in vier Viewports (ohne deutsch-02). Üben (`text-inhalt`) knappste Luft: d-lsa-3-002 „noch nicht“ hoch 18 px. Keine versionierte Datei geändert.

## 2026-10-21 – Aufgabe 16 (4): mathe-02 eingespielt, deutsch-02 ausgelassen
- **Eingespielt:** mathe-02 (24 Items, 1550 s = 25,83 Min.). `content:validate` 0 Fehler, 0 Warnungen; mit beiden Dateien ebenfalls 0 Fehler (deutsch-02: 1305 s + Lesezeit 268,5 s = 1573,5 s = 26,23 Min.; laut README ≈ 255 s Lesezeit).
- **Ausgelassen (Regel nicht geändert):** deutsch-02 scheitert im Durchsehen neben dem Text in Safari quer (Regel ≥ 0, keine Überlappung): d-lli-2-002 (order) −29 px, „Richtig ist“ überlappt „Falle“; d-lsa-3-002 (Kurzantwort) −7 px. Sonst grün (d-lsa-2-004 dort 1 px, d-lli-3-001 19 px).
- **Spec:** `probetest-layout` misst jetzt alle Dateien in `content/probetests` (Budget je Probetest unter `mathe`/`deutsch`), Timeout 20 Min. je Viewport.
- **Gemessen mathe-02 (knappste Luft, iPad quer/hoch, Safari quer/hoch):** Aufgabe m-dz-1-001 85/165/33/41; Durchsehen m-gm-3-003 144 / m-dz-1-001 247 / m-gm-3-003 36 / m-dz-1-001 123; fehlt m-gm-3-003 144 / m-rf-1-004 277 / m-gm-3-003 36 / m-rf-1-004 153.
- **Lokal:** `npm run check` grün, `probetest-layout` und `probetest-liste` 10/10 in vier Viewports (ohne deutsch-02). Mit Schalter: `probetest-budget-*`, `probetest-durchsehen-knappstes-safari-landscape`, `probetest-fehlt-knappstes-{ipad-portrait,safari-landscape,safari-portrait}` (knappstes Item jetzt aus mathe-02).

## 2026-10-21 – Aufgabe 16 (3): Stand je Probetest
- **Gebaut:** `probetestStand(ids, runs)` (domain) und `loadProbetestList(repos, ids)` (data, liest nur): „gemacht am …“ = `endedAt` des letzten abgegebenen Laufs, also desselben wie bei „Auswertung ansehen“. Gespeichert wird nichts Neues. Die Route liest den Stand aus Dexie; ist der Speicher nicht lesbar, stehen nur die Namen da. Der Chunk `probetest-liste-route` ist im Precache.
- **Entscheidungen:** Abgebrochene und laufende Läufe zählen als „noch nicht gemacht“, das Datum steht ohne Jahr in lokaler Zeit.
- **Tests:** Memory-Repos mit zwei Probetests, einer gemacht (echter Lauf über den Store): gleicher Stand bei erneutem Lesen und nach Export → Import in ein leeres Gerät. `probetest.spec`: „gemacht am“ nach Abgabe und nach Neuladen. DEPLOY §8 Prüfschritt 7.
- **Lokal:** `npm run check` grün (1023 Tests), Chromium-Projekte 39/39, `probetest-liste` 4/4.

## 2026-10-21 – Aufgabe 16 (2): Fußzeile der Karte zeigt auf die Übersicht
- **Gebaut:** „Probetest Mathe“ und „Probetest Deutsch“ führen auf `/probetest/mathe` bzw. `/probetest/deutsch` (`KartenView.probetests` sind jetzt die Fächer mit mindestens einem Probetest), Namen und Zeile sind gleich geblieben. `probetest.spec` geht über die Übersicht zur Startseite.
- **Gemessen (`karte.spec`, kleinster Name ohne „Neu laden“ / mit / `/`):** iPad quer 23,4/23,4/23,4, iPad hoch 21,8/20,5/22,7, Safari quer 19,1/19,1/19,1, Safari hoch 18,4/17,2/19,4 px. Das ist unverändert, die Zeile ist einzeilig (hoch mit „Neu laden“ zwei Zeilen wie beschlossen).
- **Lokal:** `npm run check` grün, Chromium-Projekte 39/39, `karte` 5/5. Keine Screenshots mit Schalter, weil sich optisch nichts geändert hat.

## 2026-10-21 – Aufgabe 16 (1): Seite /probetest/:fach
- **Gebaut:** `ProbetestListe` unter `/probetest/mathe` und `/probetest/deutsch`: statische Routen vor `/probetest/:id` (lazy Chunk `probetest-liste-route`). Titel `probetestName`, je Probetest ein Eintrag (≥ 64 px, volle Breite) „Probetest Mathe n“ mit Stand, „Zurück“ im Band zur Karte, ohne Probetest der Satz „Hier gibt es noch keinen Probetest.“ Den Stand liefert die Route erst ab (3). Dev-Seite `/dev/probetest-liste?fach=…&stand=keiner|einer|alle&anzahl=0|2|3`.
- **Entschieden (Markus):** Die Startseite des Probetests heißt `listEntryName(fach, n)` mit n = Position im Manifest (`probetestNumber`), „Zur Karte“ bleibt bei `/`, der Druck-Titel bleibt unverändert.
- **Gemessen (`probetest-liste.spec`, iPad quer/hoch, Safari quer/hoch; Luft über dem Band bei 3 Einträgen):** 412/668/304/544 px, Einträge 64 px, Stand in jedem Viewport einzeilig neben dem Namen, kein Scrollen, Fallback nicht nötig.
- **Lokal:** `npm run check` grün (1018 Tests), Chromium-Projekte 39/39, `probetest-liste` 4/4. Screenshots `probetest-liste-*` und `probetest-intro-*` mit Schalter.

## 2026-10-21 – Content: lesen-sachtext Patch 3 (d-lsa-2-005, Regel 1.0.17)
- **Eingespielt:** d-lsa-2-005 Prompt 74 → 60 Zeichen („Verbinde jedes Wort mit seiner Bedeutung. Eine bleibt übrig.“), sonst unverändert. `content:validate` 0 Fehler, 0 Warnungen.
- **Gemessen (iPad quer/hoch, Safari quer/hoch):** antworten 145/144/56/144, richtig 214/206/125/206, noch nicht 105/95/39/95 (Safari quer vorher 37/106/21). Prompt-Zeilen 3/2/2/2: iPad quer 3, weil die Textspalte ab 768 px Höhe 42 % statt 34 % breit ist; Luft dort 105.
- **Entschieden (Markus):** Kürzung in Runde 3 des Einstiegs bleibt im Code.
- **Lokal:** `npm run check` grün, `text-layout` (echte Lesetexte) 4/4.

## 2026-10-21 – Content: muster-strukturen Patch 1 (Pilot Tochter)
- **Eingespielt:** m-ms-2-002 Zahlenmauer als Bild `ms-mauer-1.svg` (400 × 230, Schrift 36 ≥ 28,75), Stimulus ein Satz; m-ms-2-008 misconception nennt 350 und 410; `pilotNote` an beiden, Status `draft`. `content:validate` 0 Fehler, 1 Warnung (d-lsa-2-005, aus 1.0.17, unverändert).
- **Gemessen (knappste Luft, iPad quer/hoch, Safari quer/hoch; antworten/richtig/noch nicht):** m-ms-2-002 166/189/114/65 (antworten), m-ms-2-008 264/448/156/324; kein Scrollen.
- **Lokal:** `npm run check` grün, `layout.spec` 4/4 (vier Viewports).

## 2026-10-21 – Aufgabe 15 (3): Validator match neben Text (1.0.17)
- **Gebaut:** `WITH_TEXT.match` = höchstens 3 Paare, 140 Zeichen auf allen Karten, `prompt` 60; drei Warnungen einzeln (Pfade `payload.left`, `payload`, `prompt`), Meldung nennt Ist und Grenze. Warnung je Karte (35/52) entfällt. Test vor dem Umbau rot („left höchstens 35 Zeichen, hier 36“).
- **content:validate:** 0 Fehler, 1 Warnung: d-lsa-2-005 `prompt` 74 > 60 (nicht gepatcht, Chat-Claude kürzt im nächsten Batch). Luft Üben noch nicht (iPad quer/hoch, Safari quer/hoch) 105/95/21/95, antworten 145/144/37/144.
- **Fixture:** d-lsa-2-952 Prompt 65 → 60 („… Wozu dient das? Eine Karte ist zu viel.“), damit sie warnungsfrei bleibt; quer weiter 2 Zeilen, Durchsehen Safari quer 15 px. Screenshots `text-match-*`, `probetest-text-aufgabe-knappstes-{ipad,safari}-landscape`, `text-budget-{ipad,safari}-landscape.json` mit Schalter.
- **Lokal:** `npm run check` grün (1004 Tests), `text-layout`/`probetest-layout` 14/14.

## 2026-10-21 – Aufgabe 15 (2): Schema 1.0.17, match neben Text dreiteilig
- **Entschieden (Markus):** höchstens 3 Paare (plus 1 Distraktor), Kartentexte zusammen ≤ 140, `prompt` ≤ 60 Zeichen; Rückmeldung ohne Grenze (bis 195 gemessen, bindet nicht). 35/52 je Karte bleiben als Umbruchgrenzen ohne Warnung, der 110-Hinweis entfällt.
- **Doku:** CONTENT_SCHEMA §4.4/§7 und Status 1.0.17, CHANGELOG 1.0.17, ARCHITECTURE §5 (Sweep-Specs, Schalter `PFADFINDER_SWEEP=1`, Durchsehen Safari quer +15 / −20 je nach Prompt-Zeilen), PRODUCT §11 nach MVP: Band im Durchsehen umbauen.
- **Lokal:** `npm run check` grün. Validator folgt in (3).

## 2026-10-21 – Aufgabe 15 (1c): Messpunkt Prompt 60 Zeichen
- **Gebaut:** d-lsa-3-980 (3 Paare, Summe 140, F 195, Prompt 60), dritter Test `-g Prompt` mit Zeilenzahl des Prompts, Ausgabe `sweep-match-prompt.json`.
- **Gemessen (iPad quer/hoch, Safari quer/hoch):** Üben 87/71/20/71, Aufgabe 277/264/184/252, Durchsehen 108/95/**15**/83, alle Regeln erfüllt, keine Überlappung. Prompt quer in Aufgabe/Durchsehen 2 Zeilen (74 Zeichen: 3, Durchsehen Safari quer −20), im Üben quer 3 (Vorlesen daneben), hoch überall 2.
- **Lokal:** `npm run check` grün.

## 2026-10-21 – Aufgabe 15 (1b): Sweep Rückmeldungslänge – angehalten (Entscheidungspunkt)
- **Gebaut:** zweiter Test in `sweep-match.spec.ts` (`-g Rückmeldung`), Fixture um die Rückmeldungslänge F erweitert (3/4 Paare × Summe 100/140 × F 95/120/150/180/195, etwa 45/55; IDs d-lsa-3-960…979, weil d-lsa-2-… bei 999 endet). Ausgabe `sweep-match-feedback.json`.
- **Befund:** Durchsehen Safari quer hängt nicht von F ab: 3 Paare −20, 4 Paare −76 bei jedem F. Damit kein F ≥ 120 für 3 Paare → Layout-Aufgabe. Nur Üben: 3 Paare bis F 195 ≥ 18 (Safari quer 44 bis F 150, 20 ab 180); 4 Paare Safari quer −12 schon bei F 95.
- **Ground Truth:** Hoch passt der Sweep zu d-lsa-2-952, quer liegt er 35 px darunter: Der Prompt (74 statt 65 Zeichen) hat quer 3 statt 2 Zeilen, Antwortbereich und Band sind gleich hoch. d-lsa-2-005 (74 Zeichen) bricht hoch in 2 Zeilen um, der Sweep-Prompt in 3. Die Luft folgt Zeilen, nicht Zeichensummen.
- **Lokal:** `npm run check` grün; Sweep 2 5,4 min; `text-layout` und `probetest-layout` 14/14.

## 2026-10-21 – Aufgabe 15 (1): Sweep Summenregel match – angehalten (Fallback)
- **Gebaut:** `tests/e2e/sweep-match.spec.ts` (Projekt `sweep`, nur mit `PFADFINDER_SWEEP=1`, nie in CI), Fixture `tests/fixtures/sweep-match` (37 Items neben t-sach-901, Prompt 74, Rückmeldung 195 = m-dz-2-008; 3/4 Paare × 80–180 × gleichmäßig/Schieflage, 5 Paare bei 80). Dev-Seiten `/dev/text` und `/dev/probetest` (deutsch-90) zeigen die Sweep-Items. Ausgabe `tests/e2e/output/sweep-match.json`.
- **Befund:** Keine Summe erfüllt die Regel; N = –, auch Üben allein (4 Paare überall −4 hoch, −36 Safari quer). 3 Paare: Üben bis 140 ≥ 18 (Safari quer 20), aber Durchsehen Safari quer −20 schon bei 80 (Überlappung mit „Falle“). Die Luft hängt bis etwa 130 nicht von der Summe ab, sondern von Paaren und Rückmeldung. 5 Paare bei 80: −92 px. Keine Karte dreizeilig.
- **Offen:** Entscheidung Markus (Regel ist Layout, nicht Content); (2)–(4) nicht begonnen. Zwei Läufe zahlengleich.
- **Lokal:** `npm run check` grün; Sweep 2 × 10 min, grün (misst nur).

## 2026-10-21 – Aufgabe 15 (0): Einstieg Mathe 15 Items, Arbeitsregel check && commit
- **Gebaut:** `CHECK_ITEM_COUNT` je Fach (Mathe 15 = 3 je Bereich bei 5 Bereichen, Deutsch unverändert 12). Runde 3 erreicht in Mathe jetzt jeden Bereich; die Kürzung bleibt im Code, die jetzigen Bereichszahlen erreichen sie nicht mehr. Intro Mathe „etwa 15 Minuten“ (Entscheidung Markus), Dev-Vorschau Einstieg mit 15 Plätzen.
- **Befund:** „etwa 10 Minuten“ stimmte schon bei 12 Items nicht: 12 × 62 s (Mittel `estimatedSeconds` Mathe ohne Kurzantwort) = 12,4 Min., bei 15 rund 15,5 Min.
- **CLAUDE.md:** „Vor jedem Commit: check && commit, nie getrennt“.
- **Lokal:** `npm run check` grün, Chromium-Projekte 39/39, `einstieg-layout` 4/4; Screenshots `einstieg-intro-*`, `einstieg-aufgabe-*`, `einstieg-pause-*` mit Schalter (15 Plätze, 15 Minuten).

## 2026-10-21 – Content muster-strukturen (18 Items), Roadmap Screenshots
- **Gebaut:** 18 Items (m-ms-1-001…3-004, draft) angehängt, `ms-kette-1.svg`, `ms-figur-1.svg`; Pool 20 Items, Niveau 8/8/4. `content:validate` 0 Fehler, 0 Warnungen. Alle Mathe-Bereiche sind jetzt übbar: die Tests für einen zu dünnen Bereich nutzen einen synthetischen Loader (`thinMatheContent`), der Check-Test R W R leitet die Bereiche mit drittem Item ab (12 Items für 5 Bereiche).
- **Gemessen (knappste Luft, iPad quer/hoch, Safari quer/hoch):** m-ms-2-006 179/371/127/247, m-ms-3-004 168/384/60/260, m-ms-2-003 360/616/252/492 px; alle 18 Items ≥ 60 px.
- **Roadmap v1.1:** Screenshots deterministisch (PRODUCT §11).
- **Lokal:** `npm run check` grün (995 Tests), Chromium-Projekte 39/39, `layout.spec` 4/4, `karte`/`einstieg-layout`/`probetest-layout` grün.

## 2026-10-21 – Aufgabe 14 (7): Screenshots bereinigt
- 45 versionierte Screenshots mit Schalter erneuert (`npm run screenshots`, Layout- und Chromium-Projekte), kein Code; Gründe je Gruppe im Bericht vom 21.10.

## 2026-10-21 – Aufgabe 14 (6): Zeile unter der Karte
- **Gebaut:** Links „Probetest Mathe · Probetest Deutsch“, rechts „Impressum · Datenschutz“, gleicher Stil (`QuietLinks`), beide an den Rändern. „Neu laden“ quer links von Impressum, hoch eigene rechtsbündige Zeile darüber. Startseite hoch dauerhaft 8 statt 12 px Rand oben/unten (Variante b, Entscheidung Markus).
- **Gemessen (kleinster Name; ohne „Neu laden“ / mit / `/`):** iPad quer 23,4/23,4/23,4, iPad hoch 21,8/20,5/22,7, Safari quer 19,1/19,1/19,1, Safari hoch 18,4/17,2/19,4 px. Zeile mit „Neu laden“ hoch 96 px (2 Zeilen), sonst 48 px. Ausnahme ≥ 17 px nur Safari hoch mit „Neu laden“ (ARCHITECTURE §5), nicht gesenkt.
- **Lokal:** `karte`, `probetest-layout`, `einstieg-layout` in vier Viewports grün, Screenshots `karte-*`, `karte-angebot-*`, `probetest-karte-*` mit Schalter.

## 2026-10-21 – Aufgabe 14: Befunde iPad-Durchlauf deutsch-01 (1)–(5), (6) offen
- **Gebaut:** (1) `probetestName(fach)` für Startseite, Karte und Druck (`INTRO_TITLE`/`MAP_LINE` entfernt); Fluss-Test deutsch-90 (Start bis Durchsehen) vor der Reparatur nur an der Startseite rot. (2) multi-choice ohne Sperre unter und über `minSelect`, ohne Hinweis; zu wenig oder zu viel = „noch nicht“. (3) Leeres match-Feld = leere Lücke (`emptyTileClass`, „…“). (4) order: FLIP 180 ms (`--duration-move`), 1 s Tönung `touch-soft`, bei reduce nur Tönung. (5) short-answer `enterKeyHint="done"`, Enter schließt die Tastatur.
- **Entscheidungen (Markus):** Obergrenze multi-choice fällt; Tönung `--color-touch-soft` #dce7e2 (ink 9,9:1); match in `layout.spec` Luft ≥ 18.
- **Gemessen:** match knappste Luft (layout/text-layout) iPad quer 105, hoch 95, Safari quer 21, hoch 95 px; Probetest d-lsa-2-952 Aufgabe 292/264/184/252, Durchsehen 123/95/15 (Ausnahme)/83.
- **Offen (6):** Kartenzeile gebaut, liegt auf lokalem Zweig `wip/karte-zeile`: Safari hoch mit „Neu laden“ 16,955 px (Grenze 17), iPad hoch 20,3 px, ohne „Neu laden“ unverändert (18,2/19,1). Wartet auf Entscheidung.
- **Lokal:** `npm run check` grün (994 Tests), Chromium-Projekte 39/39, Layout-Projekt 42/42 in vier Viewports.

## 2026-10-20 – Aufgabe 13 (2)–(4): Lese-Screen im Probetest, deutsch-01
- **Gebaut:** Store-Status `reading` vor dem ersten Item eines Textes im Durchgang (`shownTextIds` nur im Speicher), `ProbetestLesen` mit Kopf, ohne Vorlesen; Item-Zeit erst nach „Weiter“, die Frist läuft weiter. Kasten mit Scrollposition je Text auch im Durchsehen. Druck: Text mit nummerierten Absätzen vor seinen Items, der zweite auf neuer Seite. `/dev/probetest-lauf/:id` (Fixture deutsch-90) für den E2E-Lauf. deutsch-01 eingespielt: 0 Fehler, 0 Warnungen, 25,98 Min.
- **Fallbacks (vorab entschieden):** Durchsehen neben Text quer: Falle/Zurück/Weiter untereinander (vorher iPad quer order −123 px); hoch Reserve + Kopfhöhe (`--reading-extra`, vorher short-answer −30, order −6).
- **Entschieden (Markus):** Ausnahme Durchsehen neben Text Safari quer Luft ≥ 0 (ARCHITECTURE §5). deutsch-01 dort: d-lsa-2-002 und d-lli-2-005 (order) je 1 px bei 185 bzw. 102 Zeichen Rückmeldung, d-lsa-3-001 19 px; alles andere ≥ 18.
- **Gemessen:** knappste Luft deutsch-01 (Aufgabe/Durchsehen/fehlt/vergleichen) iPad quer 224/85/132/209, iPad hoch 138/42/84/126, Safari quer 116/1/24/101, Safari hoch 138/42/84/126. Kartenzeile mit beiden Probetests in allen vier Viewports einzeilig, Einträge 48 px, kleinster Name 19,1 px (Safari quer); Fallback nicht nötig.
- **Offen:** Sweep Summenregel 1.0.17 (match); order neben Text bindet im Durchsehen Safari quer unabhängig von der Rückmeldungslänge. Kartenzeile mit „Neu laden“ und zwei Probetests nicht gemessen.
- **Lokal:** `npm run check` grün, Chromium-Projekte grün, Layout `probetest-layout`/`karte`/`text-layout` in vier Viewports grün.

## 2026-10-20 – Aufgabe 13 (1): Textkasten im Probetest, Befund match 35/52
- **Gebaut:** Schema 1.0.16 (Deutsch 24–32 Min. mit Lesezeit, Textblöcke als Fehler). Probetest-Kontext lädt die Texte; Kasten neben Text-Items in Aufgabe und Durchsehen, Vorlesen über `probetestTextReadAloud` (Deutsch aus; Gegenprobe rot). ARCHITECTURE §5 an `not-reading-texts` angepasst (Entscheidung Markus). Fixtures: d-lsa-2-952 (match), t-lit-900, RS-Klone, deutsch-90 (18 Items, der Loader parst das volle Schema).
- **Befund match neben Text (Safari quer, „noch nicht“):** Kartentexte zusammen 112 Zeichen → 63 px (d-lli-2-003), 119 → 21 (d-lsa-2-005), 172 → −6 (Fixture mit je einer Karte an 35/52; iPad quer −15). Vier Karten nahe 52: bis −91 px.
- **Entschieden (Markus):** Fixture in der Form von d-lli-2-003 (57 + 55 = 112 Zeichen); vorläufiger Hinweis in CONTENT_SCHEMA §4.4 (≤ 110 Zeichen zusammen), ohne Versionssprung, Validator bleibt bei 35/52.
- **Offen:** Folgeauftrag „Sweep Summenregel 1.0.17“ (Summe variieren, Prompt und Rückmeldung fest, vier Viewports).
- **Lokal:** `npm run check` grün; `text-layout` und `lesen` 10/10 (vier Viewports), match-Fixture knappste Luft 128 / 95 / 63 / 95 px (iPad quer, hoch, Safari quer, hoch).

## 2026-10-20 – match ohne Text: die Karte hat Vorrang (m-dz-2-008)
- **Entschieden (Markus):** Ohne Textkasten ist die Kartenspalte `max-content` statt `fit-content`; das Label bricht in der Restbreite um.
- **Gemessen (alle neun match-Items, vier Viewports):** m-dz-2-008 Karten einzeilig („möglich, aber nicht sicher“ vorher zweizeilig), Label quer zweizeilig, Luft ≥ 157 px quer, ≥ 257 hoch. Alle Items ohne Befund, knappste Luft weiter 21 px (d-lsa-2-005 neben dem Text, unverändert). m-rf-1-004 und m-zo-1-009 unverändert einzeilig, 26 px zwischen Labeltext und Feld.
- **Lokal:** `npm run check` grün (960 Tests), Chromium-Projekte 37/37, Layout-Projekt 41/41. Lauf mit Schalter: keine versionierte Datei geändert, die zu match gehört (`format-match-*` byte-gleich, m-dz-2-008 hat keinen versionierten Screenshot); Messbilder unter `tests/e2e/output/dz8/`.

## 2026-10-20 – Nachtrag Paket 3: match ohne Text gepackt, Tasten 72–90 px, Reserve 666, Trenner „ – “
- **Entschieden (Markus):** Karten unter den Zeilen neben dem Textkasten bleiben. 60-%-Kappung und Karten unter den Zeilen nur neben einem Textkasten (`.item-with-text`); ohne Text Label `auto`, Zielfeld `fit-content`, Raster gepackt. Ziffertasten `minmax(72px, 90px)` (neu `--spacing-key-max`). `--spacing-reading-reserve-short-answer` 704 → 666 px. Lösungszeile bei match „Würfel – 6 gleich große Quadrate“.
- **Gemessen (vier Viewports):** m-rf-1-004 und m-zo-1-009 Karten einzeilig, vom Labeltext bis zum Feld 26 px (Innenabstand + Abstand). Tasten 90 px, neben dem Text iPad quer 75 px, „Löschen“ ohne Überlauf; mit Komma 90 px. short-answer mit Text hoch ≥ 18 px (d-lsa-3-002 und Fixture: noch nicht 18).
- **Dazu:** Neben dem Text hat der Zahlenbereich `gap-lg` statt `gap-3xl` (sonst 30 px zu breit bei 72-px-Tasten). `matchProblems`: 60 % nur neben dem Text; ohne Text höchstens 28 px zwischen Labeltext und Feld, wenn kein Label umbricht. Container-Query `--container-match-beside` entfällt.
- **Offen:** m-dz-2-008 quer ohne Text: längstes Label und längste Karte passen zusammen nicht in die Zeile, beide brechen um; das ausgeglichene Label lässt 77 px frei.
- **Lokal:** `npm run check` grün (960 Tests), Chromium-Projekte 37/37, Layout-Projekt 41/41 (vier Viewports). Screenshots mit Schalter: `format-match-*`, `item-match-*`, `probetest-fehlt-knappstes-*`, `item-number-input-*`, `eltern-frage-*`, `probetest-aufgabe-knappstes-*`, `text-short-answer-*-portrait`, `text-budget-*-portrait.json`.

, iPad-Befunde (Einschätzung, Löschen, match), Prüfung auf Überlauf und Überlappung
- **Einschätzung:** Das Band richtet sich nach seiner Breite (Container-Query auf einem Rahmen, Knöpfe bleiben direkte Kinder): ab 50rem eine Zeile, ab 34rem Vorlesen links und die Frage über drei gleichen Knöpfen, darunter die Frage über der ganzen Knopfreihe. Neue Button-Größe `fill`. Luft vergleichen (5 Items mit Text, 4 Viewports) ≥ 40 px, hoch +56.
- **Ziffernblock:** ohne Komma „0 | Löschen“ über zwei Spalten, Spalten 72 px, schrumpfen bis 48 px; mit Komma unverändert (m-gm-1-003/2-007: Löschen 90 px, kein Überlauf).
- **match:** Zielfeld so breit wie die längste Karte mit Haken, höchstens 60 %; Label nimmt den Rest, `text-balance`. Unsichtbarer Messblock im ersten Feld; im Feld hält jede Karte den Platz des Hakens frei (sonst springt die Zeile beim Prüfen). **Abweichung:** Ist der Antwortbereich schmaler als 48rem (neben dem Text, hoch), stehen die Karten unter den Zeilen; nur so wird d-lli-2-003 einzeilig. Sweep: Schema 1.0.15 (links 35, rechts 52 statt 27/43).
- **Prüfung:** `screen-checks.ts` (`overflowProblems`, `overlapProblems`) in `layout.spec` und `text-layout.spec` für jeden Zustand; SVG-Diagramme ausgenommen. `matchProblems`: Feld ≤ 60 %, Label ≤ 2 Zeilen, ab 4 Wörtern keine Ein-Wort-Zeile.
- **Gegenprobe:** alter RatingBand und Ziffernblock, neue Prüfung: `layout.spec` iPad quer 28 Befunde, beide `text-layout`-Tests rot (Frage/Vorlesen über „Getroffen“ 56 px, „Löschen“ 10 px aus der Taste, Tasten 2 px übereinander). Mit dem neuen Code grün.
- **Offen:** Reserve `short-answer` hoch könnte 666 statt 704 px sein (Textkasten +38 px). Kurze match-Karten lassen Leerraum zwischen Label und Feld (m-zo-1-009). „Richtig ist: Ihre Hand zittert.: große Angst“ (Satzzeichen doppelt, schon vorher).
- **Lokal:** `npm run check` grün (960 Tests), Chromium-Projekte 37/37, Layout-Projekt 41/41 (alle vier Viewports, mit Schalter für die genannten Screenshots). WebKit läuft lokal nicht.

## 2026-10-19 – Klein-Paket Screenshots: normale Läufe schreiben nach tests/e2e/output/
- **Entschieden (Markus):** Specs und `npm run screenshots` schreiben Screenshots, Budget-JSON und das Druck-PDF nach `tests/e2e/output/` (gitignored, in CI Artefakt `e2e-output`). Nur mit `PFADFINDER_UPDATE_SCREENSHOTS=1` geht es ins versionierte `tests/e2e/screenshots/`, und zwar nur bei einer bewussten UI-Änderung, die im Abschlussbericht genannt wird. Abnahme: `git status` ist nach einem normalen Lauf sauber.
- **Gebaut:** `tests/e2e/output-dir.ts` (Ordner nach Schalter, legt ihn an). `helpers.ts` und `scripts/screenshots.ts` nutzen es, `.gitignore` und `ci.yml` sind angepasst. Dazu Regeln in CLAUDE.md („Screenshots“, Befehle), DEPLOY.md §9 und `tests/e2e/README.md`.
- **Abnahme lokal:** `npm run check` grün. Danach liefen `npm run e2e` (Chromium und Layout 78/78; WebKit startet lokal nicht, weil Systembibliotheken fehlen) und `npm run screenshots`. 332 Dateien landeten in `output/`, `git status` zeigte nur die Quelländerungen. Gegenprobe mit Schalter: `karte.spec` schreibt nach `screenshots/` (byte-gleich).
- **Aufgeräumt:** die von früheren Läufen geänderten versionierten Screenshots auf den Commit-Stand zurückgesetzt. Ein Teil davon (start, eltern, impressum, datenschutz, feedback, item-*) weicht vom aktuellen Stand ab und braucht einmal einen bewussten Lauf mit Schalter.
- **CI:** [CI #39281125717](https://github.com/1701/Pfadfinder/actions/runs/39281125717) grün (1a049e3), Workers Builds grün; 955 Tests, e2e 100 bestanden, 6 übersprungen (WebKit offline). Artefakt `e2e-output` mit 242 Dateien (30 MB) hochgeladen.

## 2026-10-19 – Nachtrag Einstiegsangebot: „noch keine Aufgaben“, gap-md zurück
- **Entschieden (Markus):** Gestrichelte Gebiete heißen für Screenreader „…, noch keine Aufgaben“. „Unerforscht“ bleibt für das Angebot. Vorlesen ohne offene Gebiete bleibt, wie es ist. Der Angebots-Header bekommt wieder `gap-md`.
- **Gebaut:** `regionLabel` in `Karte.tsx` (nur aria-label, sichtbar ändert sich nichts), `Karte.test` angepasst, Kommentar `KartenView` und PRODUCT §5.4 nachgezogen.
- **Gemessen (hoch, 768 px, Zeilenende Mathe/Deutsch):** mit `gap-md` 698/723 px, 45 px Rand bei Deutsch (vorher 37 mit „Wo geht’s …“). Quer 326/301 px Rand. Kleinste Namen unverändert. `karte-angebot-budget-*.json` und `karte-angebot-*` neu.
- **Nicht committet:** die übrigen von den Läufen neu geschriebenen Screenshots.
- **CI:** [CI #39269459191](https://github.com/1701/Pfadfinder/actions/runs/39269459191) grün (be7cd4f), Workers Builds grün; 955 Tests, e2e 100 bestanden, 6 übersprungen (WebKit offline). Lokal grün: `npm run check`, Chromium-Projekte 37/37, Layout `einstieg-layout`/`karte`/`blatt-layout` 13/13.

## 2026-10-19 – Klein-Paket Einstiegsangebot: „Unerforscht: Mathe“, „Erkunden“, „Wir erkunden …“
- **Entschieden (Markus):** Messstufen hoch: 1 „… ist noch unerforscht.“, 2 `gap-md` → `gap-sm`, 3 „Noch unerforscht: …“, 4 „Unerforscht: …“, 5 Stopp. Intro „Wir erkunden Mathe.“ / „… Deutsch.“ mit „Ein paar Aufgaben zeigen, wo du startest.“ plus 10 Minuten (Mathe) bzw. 15 Minuten (Deutsch: zwölf Aufgaben, zwei Texte). Vorlesen wie bisher, mit „Tippe auf Erkunden“; ohne offene Gebiete fällt der Nebensatz weg. CLAUDE.md: Rückfragen und Berichte auf Deutsch.
- **Gemessen (iPad hoch, 768 px, Zeilenende Mathe/Deutsch):** Stufe 1 824/849, Stufe 2 812/837, Stufe 3 768/793, Stufe 4 686/711 px. Gebaut ist Stufe 4 mit `gap-sm`, für beide Fächer und alle Viewports, 57 px Rand bei Deutsch (vorher 37). Kleinste Namen unverändert (23,4 / 22,5 / 19,1 px). `karte-angebot-budget-*.json` war in zwei Läufen byte-gleich.
- **Gebaut:** In `einstieg.ts` gibt es `offerSpeech` (bisher fest in `KartenView`) und `introText(fach)`. Beide stehen in `EINSTIEG_TEXTS` und werden damit sprachgeprüft. Der Vorlese-Text setzt einen Punkt hinter die Überschrift, weil diese keinen eigenen Punkt hat.
- **Tests:** Zwei Vorlese-Tests in `Angebot`. Die Gegenprobe mit dem alten Satz war 2/2 rot. Dazu Intro Deutsch (15 Minuten) und die neuen Texte in Unit- und E2E-Tests. Screenshots `karte-angebot-*` und `einstieg-intro(-deutsch)-*` sind neu und angesehen.
- **Zur Entscheidung:** „Unerforscht“ heißt auf der Karte bisher „noch keine Aufgaben“ (gestrichelt, z. B. Muster und Zahlenfolgen). Die Überschrift nutzt das Wort jetzt für „noch nicht erkundet“, während die Gebiete darunter schon wählbar sind.
- **Nicht committet:** die übrigen von den Läufen neu geschriebenen Screenshots (start, eltern, impressum, item-*, …).
- **CI:** [CI #39262500692](https://github.com/1701/Pfadfinder/actions/runs/39262500692) grün (fa9a705…c555cd9), Workers Builds grün; 955 Tests, e2e 100 bestanden, 6 übersprungen (WebKit offline). Lokal grün: `npm run check`, Chromium-Projekte 37/37, Layout `einstieg-layout`/`karte`/`blatt-layout` 13/13 (zweimal).

## 2026-10-19 – formate.spec und probetest-layout.spec warten auf den lazy Renderer
- **Entschieden (Markus):** m-gm-1-004 (−15 bis −31 px) und das Wort-für-Wort-Label bei d-lli-2-003 bleiben so.
- **Gebaut:** Beide Specs maßen, sobald Überschrift bzw. Band stand; jetzt warten sie wie `layout.spec`/`text-layout.spec`, bis kein Suspense-Platzhalter (`aria-busy`) im Antwortbereich steht.
- **Gemessen:** zwei Läufe, `probetest-budget-*.json` byte-gleich. Safari quer unverändert 33 / 52 / 44 / 94 px (Aufgabe, Durchsehen, fehlt, vergleichen), auch iPad quer. Hoch ist „fehlt“ jetzt m-gm-1-004 (Safari hoch 155 → 140, iPad hoch 279 → 264 px): Folge der match-Spalte (9ffe452), nicht der Wartebedingung. Budgets und die zwei `probetest-fehlt-knappstes-*`-Screenshots hoch committet.
- **CI:** [CI #39253831163](https://github.com/1701/Pfadfinder/actions/runs/39253831163) grün (f0efd31), Workers Builds grün; 947 Tests, e2e 100 bestanden, 6 übersprungen (WebKit offline). Lokal grün: `npm run check`, `formate` + `probetest-layout` 14/14 (zweimal).

## 2026-10-19 – match-Renderer: Zeile links ≤ 40 %, Schema 1.0.14
- **Gebaut:** `Match.tsx` Zeilen `fit-content(40 % − Abstand)` + Rest (≥ 60 %), mit und ohne Textkasten; kurze Labels bleiben schmal, lange brechen um. `matchProblems` (helpers) in `layout.spec` (alle Items) und `text-layout.spec` (Lesetexte): Label ≤ 40 %, kein Text und kein Haken außerhalb von Label oder Feld. Gegenprobe mit alter Spalte: beide rot (d-lli-2-003, m-dz-2-008, m-gm-1-004). Schema 1.0.14: match mit `textRef` links ≤ 27, rechts ≤ 43 Zeichen (Validator-Warnung, Test mit Gegenprobe, CONTENT_SCHEMA §4.4/§7, CHANGELOG).
- **Abnahme:** d-lli-2-003 Safari quer 42 → 58 px (richtig 44 → 68), Feld 28 → 60 %, rechts 2 Zeilen statt 3, nichts ragt heraus. d-lsa-2-005, d-rsl-2-006, d-rss-1-006, d-rss-2-005, m-rf-1-004, m-zo-1-009 in vier Viewports unverändert; m-dz-2-008 quer +8 px, hoch −15. **Abweichung:** m-gm-1-004 verliert 15–31 px (Safari quer 116 → 85), weil seine Labels (25 Zeichen) jetzt zweizeilig sind; folgt aus „Label ≤ 40 %“.
- **Verworfen:** `min-w-0` + Silbentrennung im Feld: trennte „zerklei-nert“ (d-lsa-2-005), iPad quer 18 → −11 px.
- **Sweep neu:** Jetzt bindet links (Umbruch im 40-%-Label): L 35 → Safari quer −1 px unabhängig von R; R 52 bei L ≥ 23 → iPad quer −3; bis L 27 / R 43 überall ≥ 21 px; bei L ≤ 12 R bis 52. Daraus 27/43.
- **Befund CI:** Lauf 39239177965 rot: `layout.spec` maß m-rf-1-004 im Suspense-Platzhalter („match rows missing“). `openItem` wartet jetzt auf `aria-busy` wie `text-layout`, auch für `fitProblems`.
- **CI:** [CI #39246796040](https://github.com/1701/Pfadfinder/actions/runs/39246796040) grün (9ffe452…adcf809), Workers Builds grün; 947 Tests, e2e 100 bestanden, 6 übersprungen (WebKit offline). Lokal grün: `npm run check`, Layout- und Chromium-Projekte 78/78, `layout.spec` nach dem Fix 4/4. Messdaten und Vorher/Nachher-Screenshots nicht im Repo.

## 2026-10-19 – Content: lesen-literarisch auf main, Patch d-lli-2-003, Messung match neben dem Text
- **Entschieden (Markus):** Content zuerst; zwei Lesen-Blöcke im Einstieg bleiben (PRODUCT §5.4); text-budget und Fixture-Screenshots aus 7b7ee3a als chore-Commit.
- **Eingespielt:** `patch-lesen-literarisch.json` ersetzt d-lli-2-003 (Prompt 60 Zeichen, links ≤ 23, rechts ≤ 18). `content:validate` 0/0. `text-layout` zweimal grün, `text-inhalt-*.json` und `text-budget-*.json` byte-gleich; 2-003 jetzt ≥ 42 px (Safari quer, noch nicht), iPad quer 108, hoch 95. Batch und Patch per Rebase auf main.
- **Befund (nicht behoben, eigener Bau-Punkt):** Der match-Renderer gibt der linken Spalte `auto` ([Match.tsx:38](../src/ui/formats/Match.tsx)), das Zielfeld bekommt den Rest. In Safari quer bricht die zugeordnete Erklärung im Zielfeld weiterhin nach jedem Wort um („ein / bisschen / Angst“), „keine Angst mehr“ mit Haken ragt über den Rand.
- **Gemessen (Sweep, nicht committet):** d-lli-2-003 mit längstem Text links L und rechts R, Luft ≥ 18 px in allen vier Viewports nur bei L ≤ 12 (R bis 38 gemessen) oder R ≤ 18 (L bis 35). Hoch immer ≥ 71 px; Safari quer bindet (L 18–35: R 23/28 → 13 px, R 34 → −17…−47). Vorschlag Warnung für match mit `textRef`: rechts höchstens 18 Zeichen, außer links alle höchstens 12. Gemessen an einem Text und einem Item, Regel = Schemaänderung (1.0.14).
- **CI:** [CI #39227230960](https://github.com/1701/Pfadfinder/actions/runs/39227230960) grün (c82fe8c…705b56a), Workers Builds grün; 946 Tests, e2e 100 bestanden, 6 übersprungen (WebKit offline). Lokal grün: `npm run check`, Layout- und Chromium-Projekte 78/78. Nicht committet: neu geschriebene Screenshots ohne Befund, `text-inhalt-*.json`, `text-t-*-lesen-*.png`.

## 2026-10-19 – Content: d-lsa-3-002 gekürzt, Batch lesen-literarisch gemessen (nicht auf main)
- **Gebaut:** PROGRESS-Eintrag zu 1.0.13 auf die festgelegten Grenzen korrigiert. d-lsa-3-002 incorrect „Im 2. Absatz steht, was die Feuerwehrleute sonst arbeiten.“ (Rückmeldung 131 Zeichen), `content:validate` 0/0.
- **Batch lesen-literarisch** (t-lit-001…003, d-lli-1-001…3-003, Niveau 6/6/3): `content:validate` 0/0, `pilot-lli.md` nicht im Repo. Liegt als Commit c8ca439 auf dem lokalen Branch `content/lesen-literarisch`, nicht auf main: `text-layout` ist zweimal rot, beide Läufe in `text-inhalt-*.json` byte-gleich.
- **Befund:** d-lli-2-003 (match) quer unter dem Band: iPad quer −11 px (richtig, noch nicht), Safari quer −93 (richtig) / −119 px (noch nicht); hoch 71 px. Die rechte Spalte bricht Wort für Wort um; in Safari quer liegt „Richtig ist: …“ über den Zielfeldern. Safari quer läuft in CI, auf main wäre e2e rot. Alle übrigen Items ≥ 18 px (knappste: 1-001 hoch 18, 2-002 Safari quer 19). Lese-Screens der drei Texte ohne Befund, keine Seite scrollt.
- **Einstieg Deutsch:** Mit beiden Lesen-Bereichen gibt es zwei Blöcke, je einer pro Bereich (PRODUCT §5.4: 2–3 Aufgaben eines Lesen-Bereichs aus einem Text), nicht einen Block aus sechs Texten: 6 Rechtschreib-Fragen, dann zwei Lese-Screens mit je 3 Fragen, 12 insgesamt. 300 Seeds: jeder Text 93–106-mal, alle 9 Paare 29–38-mal. Test `check-session` darauf umgestellt (auf dem Branch).
- **Zur Entscheidung:** (1) d-lli-2-003 kürzen oder den match-Renderer neben dem Text ändern. (2) Ein oder zwei Lesen-Blöcke im Einstieg.
- **Nicht committet:** die von den Läufen neu geschriebenen Screenshots und `text-budget-*.json` (quer: die Kürzung der Fixture aus 7b7ee3a), `text-inhalt-*.json`, `text-t-*-lesen-*.png`, Befund-Screenshots `text-d-lli-2-003-*`.
- **CI:** [CI #39212735193](https://github.com/1701/Pfadfinder/actions/runs/39212735193) grün (4f22c49…9821e72), Workers Builds grün; 944 Tests, e2e 100 bestanden, 6 übersprungen (WebKit offline). Lokal grün: `npm run check` (main); Branch: 946 Unit-Tests grün.

## 2026-10-18 – Schema 1.0.13: Grenzen für Items neben einem Lesetext
- **Gebaut:** Der Validator warnt bei Items mit `textRef` (`WITH_TEXT` in `integrity.ts`): order höchstens 4 Elemente zu je 30 Zeichen; short-answer `model` höchstens 90 Zeichen, höchstens 2 `keyPoints`, `feedback.incorrect` + `feedback.misconception` zusammen höchstens 150 Zeichen; single-choice mit zusätzlichem `stimulus.text` höchstens 3 Optionen; multi-choice mit 5 Optionen nur bei `prompt` ≤ 60 Zeichen. CONTENT_SCHEMA §4.1/§4.2/§4.5/§4.9/§7, CHANGELOG 1.0.13.
- **Ableitung:** Grenzen festgelegt von Markus nach der Luft über dem Band in allen vier Viewports (`text-inhalt-*.json`, Fixture t-sach-900): order-Element 30 bei d-lsa-2-002; Rückmeldung 176 Zeichen bei 3-002 −20 px (Safari quer), 158 noch 22 px; 5 Optionen passten mit 60 und 62 Zeichen Prompt, mit 99 fehlte 1 px (2-001). Im ursprünglichen Batch warnen damit 2-001, 2-003, 2-004, 3-001 und 3-002. Fixture warnungsfrei gekürzt (d-lsa-2-951 Prompt 62 → 52, d-lsa-3-950 `model` 93 → 89). Tests mit Gegenprobe.
- **Offen:** d-lsa-3-002 warnt (incorrect + misconception 158 Zeichen), Content-Patch folgt.
- **CI:** [CI #39160815614](https://github.com/1701/Pfadfinder/actions/runs/39160815614) grün (f3bb232…e74a38f); [CI #39164144313](https://github.com/1701/Pfadfinder/actions/runs/39164144313) grün (cda2b10…7b7ee3a), Workers Builds grün; 944 Tests, e2e 100 bestanden, 6 übersprungen (WebKit offline). Lokal grün: `npm run check`.

## 2026-10-18 – Content: Lesen Sachtexte (3 Texte, 16 Items), Einstieg Deutsch mit Lesen-Block
- **Eingespielt:** Batch vom 2026-10-18: t-sach-001 „Der Igel im Winter“, t-sach-002 „Notruf 112: Was dann passiert“, t-sach-003 „Aus alt mach neu: Papier“ und `lesen-sachtext.json` (d-lsa-1-001 … d-lsa-3-003, draft, Niveau 7/6/3), dazu Patch 1 (2-001, 2-003, 2-004, 3-001, 3-002) und Patch 2 (2-004 mit 4 Elementen). `content:validate` 0/0; `text` neben `textRef` (2-003) wird angenommen. `pilot-lsa.md` nicht im Repo.
- **Gebaut:** `/dev/text` zeigt auch Texte und Items aus `content/`. `text-layout.spec` prüft jeden echten Lesetext: Lese-Screen und jedes Item in jedem Zustand, ≥ 18 px Luft über dem Band; Werte je Item und Zustand in `text-inhalt-*.json`, Screenshots nur von Befunden.
- **Gemessen:** Batch: 2-004 order bis −138 px (Safari quer, noch nicht), 3-001/3-002 short-answer bis −20 px, 2-003 2 px, 2-001 17 px. Nach Patch 1 nur noch 2-004 noch nicht −14 (hoch) / −7 (Safari quer), Ursache das fünfte Element. Nach Patch 2 überall ≥ 18 px (knappste: 1-001, 1-004, 2-002, 3-002 hoch 18; 2-005 iPad quer 18), zwei Läufe byte-gleich. Lese-Screens aller drei Texte ohne Befund, mark-in-text ≥ 93 px.
- **Einstieg Deutsch:** lesen-sachtext ist übbar, der Einstieg endet mit dem Lesen-Block (Aufgabe 10): 6 Rechtschreib-Fragen, Lese-Screen, 3 Fragen aus einem Text. Test mit echtem Content; 300 Seeds verteilen sich auf t-sach-001/002/003 mit 101/106/93.
- **Nicht committet:** die rund 50 von den Läufen neu geschriebenen Screenshots sowie `text-inhalt-*.json` und `text-t-sach-*-lesen-*.png`.
- **CI:** [CI #39158653997](https://github.com/1701/Pfadfinder/actions/runs/39158653997) grün (ca46ef8), Workers Builds grün; 937 Tests, e2e 100 bestanden, 6 übersprungen (WebKit offline). Lokal grün: `npm run check`, Chromium-Projekte 37/37, Layout-Specs 29/29, `text-layout` 8/8 (zweimal).

## 2026-10-18 – Aufgabe 12, Nachtrag: Apostroph, Messung der Lesetexte
- **Entschieden (Markus):** typografischer Apostroph in „Wo geht’s in Mathe los?“, „Wo geht’s in Deutsch los?“ und „Wohin geht’s heute?“ (Code, Tests, PRODUCT §5.4, Karten-Screenshots). Das Intro bleibt zweizeilig. Zeilenende hoch jetzt Mathe 706 / Deutsch 731 px (37 px bis zum Rand). „so geht’s auch“ in PRODUCT §5.6 und CONTENT_SCHEMA (Anleitung für Content, keine UI) nicht geändert.
- **Gebaut:** `text-layout.spec` wartet in `open()`, bis der Suspense-Platzhalter (`aria-busy`) im Antwortbereich weg ist. Ursache der Schwankung: Bei match/order wurde der 48-px-Platzhalter statt der Aufgabe gemessen, so dass order 168 px zu viel Luft zeigte (iPad hoch 200 px: 492 statt 324; Safari quer und hoch: die ganze Zeile „richtig“, z. B. 46 %: 189 statt −49 px). Die Dateien werden weiter nur geschrieben, nicht verglichen.
- **Gemessen:** zwei Läufe nach dem Fix, `text-budget-*.json` in allen vier Viewports byte-gleich (0 Abweichungen). Korrigierte Werte committet.
- **Bestätigt:** order und match mit Lesetext bestätigt; die Reserven aus Aufgabe 9 halten, lange order-Elemente und Kurzantworten sind Content-Regeln (Schema 1.0.13).
- **CI:** [CI #39150432417](https://github.com/1701/Pfadfinder/actions/runs/39150432417) grün (6818839…d645790), Workers Builds grün; 935 Tests, e2e 98 bestanden, 6 übersprungen (WebKit offline). Lokal grün: `npm run check`, Chromium-Projekte 37/37, Layout `einstieg-layout`/`karte` 9/9, `text-layout` 4/4 (zweimal).

## 2026-10-18 – Aufgabe 12: Content-Patch rs-strategien, ein Angebot pro Tag, Fach im Angebot
- **Gebaut:** (0) d-rss-1-001 misconception („Zeitangabe“), d-rss-2-003 Option c „Fräund“ und correct, d-rss-3-004 incorrect; `content:validate` 0/0. (1) `mapOffer` + `offerSpentToday` (domain/progress): Angebot nur bei 0 Fundstücken heute; „Später“ (egal welches Fach) und ein beendeter Einstieg (Session `check` mit `endedAt` heute) verbrauchen den Tag, das nächste Fach kommt am nächsten Morgen. `MapProgress.postponed[]` → `offerSpent`; Repo-Format `{ fach, at }` und Dexie bleiben. (2) „Wo geht's in Mathe/Deutsch los?“, Intro „Wir schauen, wo deine Reise in Mathe/Deutsch losgeht.“, beide Fächer in `EINSTIEG_TEXTS`.
- **Entschieden (Markus):** Angebot nur bei 0 Fundstücken; jedes gezeigte Angebot zählt, auch nach „Los“. Begründung in PRODUCT §5.4: Ein Angebot ist eine neue Sache pro Tag, ein Einstieg ist eine ganze Sitzung. Passt der lange Titel hoch nicht, gilt die kurze Frage für beide Fächer.
- **Gemessen:** „Wo geht deine Reise in Mathe los?“ endete hoch bei 864 px (Deutsch 889) bei 768 px Breite, also kurze Variante gebaut. Jetzt Zeilenende Mathe 704 / Deutsch 729 px (hoch 39 px bis zum Rand), eine Reihe in vier Viewports. Kleinster Name: iPad quer 23,4, iPad hoch 22,5, Safari quer und hoch 19,1 px (`karte-angebot-budget-*.json`).
- **Tests:** Domain, `map-progress`, `Angebot` (Später → Mathe geübt → kein Deutsch; 3 und 10 Fundstücke → Tagesziel-Zeile). Gegenproben: ohne Zählung 2 rot, ohne Check-Session 2 rot, „Später“ nur je Fach 6 rot. E2E: `einstieg.spec` mit fester Uhr (nach Mathe-Einstieg kein Angebot, am nächsten Morgen Deutsch); `postponeDeutschOffer` entfernt; `einstieg-layout` misst beide Angebote und beide Intros.
- **Befund text-budget:** Die Werte schwanken vermutlich, weil der Sweep nach `setToken` nur zwei Frames wartet und den ersten Schritt misst, bevor der lazy geladene Renderer (order) fertig ist. Die Dateien werden nur geschrieben (in CI nur Safari, als Artefakt) und nie verglichen. Nicht behoben.
- **CI:** [CI #39147386778](https://github.com/1701/Pfadfinder/actions/runs/39147386778) grün (f66d0a5…7ab17b1), Workers Builds grün; 935 Tests, e2e 98 bestanden, 6 übersprungen (WebKit offline). Lokal grün: `npm run check`, Chromium-Projekte 37/37, Layout `einstieg-layout`/`karte`/`blatt-layout` 13/13.

## 2026-10-18 – Content: Rechtschreibung „Strategien“ (20 Items), Einstieg Deutsch
- **Eingespielt:** Batch vom 2026-10-18 ersetzt `rs-strategien.json` (vorher 2 Items): d-rss-1-001 … d-rss-3-004, draft, Niveau 8/8/4. 1-001 absichtlich geändert (Prompt „Tippe alle Nomen an.“, neue misconception), 1-002 unverändert. `content:validate`: 0 Fehler, 0 Warnungen. `pilot-rss.md` nicht im Repo.
- **Layout:** `layout.spec` lokal 4/4 (alle 139 Items, vier Viewports), übriges Layout-Projekt 33/33, Chromium-Projekte 37/37.
- **Einstieg Deutsch:** Deutsch hat jetzt zwei übbare Bereiche, der Einstieg ist verfügbar. Die Karte bietet ihn an, sobald Mathe einen Mastery-Stand hat (immer nur ein Fach, Mathe zuerst). Neuer Test spielt den Deutsch-Check mit echtem Content durch (beide Bereiche, keine Kurzantwort). PRODUCT §5.4 nachgezogen.
- **Tests angepasst:** „zu wenige Bereiche“ jetzt mit einem Ein-Bereich-Fixture statt Deutsch. E2E (`einstieg`, `ueben`, `eltern`): Nach der ersten Mathe-Runde erscheint auf der Karte das Deutsch-Angebot; der Test erwartet es und tippt „Später“ (Helper `postponeDeutschOffer`).
- **Zur Entscheidung:** (1) Nach „Später“ für Mathe und einer Mathe-Runde steht beim Zurückkehren sofort das Deutsch-Angebot da, das Tagesziel („10 von 10. Geschafft.“) tritt zurück. (2) Nach dem Mathe-Einstieg fragt die Karte gleich wieder „Wo geht deine Reise los?“, ohne das Fach zu nennen; das Intro nennt es auch nicht. (3) „Später“ für Mathe lässt Deutsch an diesem Tag ebenfalls ruhen.
- **Content-Befunde (nicht behoben):** 1-001 misconception nennt „morgen“ ein „Zeitwort“ (in der Grundschule = Verb, 1-008 sagt „Tunwort“). 2-003 Option „häute“ ist als Verbform (ich häute, von Haut) richtig geschrieben. 3-004 incorrect „Der morgen kommt Oma geht nicht.“ ist schwer lesbar.
- **Befund:** `text-budget-*.json` schwankt zwischen Läufen im ersten Schritt (order, 200 px: 492 statt 324 px); Messung vor dem Einschwingen? Dateien nicht übernommen.
- **CI:** [CI #39143230227](https://github.com/1701/Pfadfinder/actions/runs/39143230227) grün (0f4784e), Workers Builds grün; 924 Tests, e2e 98 bestanden, 6 übersprungen (WebKit offline). Lokal grün: `npm run check`.

## 2026-10-18 – Aufgabe 11, Nachtrag: Kartenlegende gestrichen
- **Entschieden (Markus):** „Gestrichelt: noch unerforscht.“ entfällt hoch und quer, samt Beispielstrich und `text/karte.ts`. Begründung (Markus): Der gestrichelte Zustand ist vorübergehend, der Einstieg wird von der App selbst angeboten und macht die Gebiete durchgezogen; ein Zustand, der ohne Zutun des Kindes verschwindet, braucht keine Legende. Die Probetest-Legende „gestrichelt: noch nicht verglichen“ bleibt. Gestrichelte Gebiete bleiben Bilder ohne Link.
- **Gebaut:** Gestrichelte Gebiete heißen für Screenreader „…, noch unerforscht“ (gab es schon, jetzt mit Test auf der ganzen Karte, Gegenprobe rot). Zeile unter der Karte: links „Probetest Mathe“, rechts „Neu laden“ und „Impressum · Datenschutz“, einreihig in vier Viewports; kleinster Name Safari hoch 18,2 / `/` 19,1 px, Safari quer 19,1, iPad hoch 21,5, iPad quer 23,4. `karte.spec` ohne Legendenprüfungen, `karte-legende-*` gelöscht, `karte-rechtliches-*` neu.
- **CI:** [CI #39140317281](https://github.com/1701/Pfadfinder/actions/runs/39140317281) grün (b30c375), Workers Builds grün; 920 Tests, e2e 98 bestanden, 6 übersprungen (WebKit offline). Lokal grün: `npm run check`, Chromium-Projekte 37/37, Layout `karte`/`einstieg-layout`/`probetest-layout` 14/14.

## 2026-10-18 – Aufgabe 11, Nachtrag: Legende ins Meer der Karte
- **Gebaut:** „Gestrichelt: noch unerforscht.“ steht mit gestricheltem Beispielstrich im Meer, in Namensgröße (24 Einheiten), `ink-muted`, ohne Rahmen; nur auf der ganzen Karte, nicht auf der Einzelinsel im Einstieg. Hoch: Kanal zwischen den Inseln rechts von „Deutsch“, einzeilig (viewBox x 190, Box 374 × 38). Quer: oben rechts neben „Deutsch“ über der Küste, zweizeilig nach dem Doppelpunkt (x 750, Box 242 × 66). Die Zeile unter der Karte hat links „Probetest Mathe“, rechts „Neu laden“ und Rechtliches.
- **Verworfen (gemessen):** quer der Streifen unter der Deutsch-Insel (40 Einheiten hoch, eine Zeile braucht 38): 0,3 bzw. 0,9 px zur Küste.
- **Messung** (`karte-budget-*.json`, Abstand zur Küste / zu Namen): Safari quer 19,1 px Schrift, 8,1 / 13,6 px; iPad quer 23,4 px, 9,5 / 16; Safari hoch 18,2 px, 12,2 / 39,6; iPad hoch 21,5 px, 14,4 / 45,6. Die Zeile bleibt überall einreihig; „Neu laden“ passt in Safari hoch mit 18,2 px Namen, die Regel „erst ab 1024 px Höhe“ entfällt.
- **Tests:** `karte.spec` prüft Legende im viewBox, ≥ 18 px, ≥ 4 px zu Küste, Gebieten und Namen, Zeile einreihig, „Neu laden“ überall; Screenshots `karte-legende-*`. Budget als Objekte, damit Prettier die Datei annimmt.
- **Entschieden (Markus):** Einschätzung im Durchsehen bleibt, wie sie ist; ob sie änderbar sein muss, zeigt die iPad-Sitzung (dann Knöpfe mit Markierung).
- **CI:** [CI #39137078588](https://github.com/1701/Pfadfinder/actions/runs/39137078588) grün (49fad92), Workers Builds grün; 921 Tests, e2e 98 bestanden, 6 übersprungen (WebKit offline). Lokal grün: `npm run check`, Chromium-Projekte 37/37, Layout `karte`/`einstieg-layout`/`probetest-layout` 14/14.

## 2026-10-18 – Aufgabe 11, Punkt 3 und Nachtrag: Antworten vergleichen, „Für Eltern“
- **Gebaut:** (Nachtrag) „Für Eltern“ leise am Ende von Impressum und Datenschutz, weil die installierte App `/eltern` sonst nicht erreicht; ARCHITECTURE §7 und PRODUCT angepasst (kein Kinder-Screen verlinkt `/eltern`). (3) Auswertung: Legende „gestrichelt: noch nicht verglichen“ und Knopf „1 Antwort vergleichen“ (nicht gelb) → Durchsehen nur der wartenden Kurzantworten („1 von 1“, kein „Zurück“), nach der Einschätzung „Zur Auswertung“ (gelb). Im Durchsehen oben rechts „Übersicht“: alle 24 Striche, Legende nur „gelöst“ und „gestrichelt …“, ein Tipp springt und beendet den Filter, „Weiter durchsehen“ zurück. Store: `reviewOnly`, Status `reviewOverview`.
- **Entschieden:** Wireframe freigegeben mit vier Änderungen (Markus). Der gestrichelte Strich (16 × 8, `3 2`) wirkte am iPad gepunktet; jetzt `4 3`, gemeinsames Bauteil `ProbetestStrich` für Auswertung, beide Übersichten und Legenden.
- **Befund:** Das bisherige Durchsehen markiert die gewählte Einschätzung nach dem Tipp nicht (das Band ersetzt die drei Knöpfe); unverändert gelassen, zur Entscheidung.
- **Messung:** Luft unverändert (Safari quer: Aufgabe 33, Durchsehen 52, fehlt 44, vergleichen 94 px), „nur wartende“ 163 px, Übersicht im Durchsehen ohne Scrollen in vier Viewports.
- **Tests:** Store (Filter, Rückkehr, Sprung; Gegenprobe ohne Filter → 2 rot), Testing Library, `probetest.spec` (vergleichen → Auswertung, Übersicht → Sprung), `probetest-layout` mit zwei neuen Zuständen. CLAUDE.md: Nach UI-Änderungen auch die Chromium-Smoke-Projekte lokal.
- **Offen:** DEPLOY §8 Schritt 6 am iPad: Liefert iOS die Sicherung in der installierten App als Datei?
- **CI:** [CI #39133484467](https://github.com/1701/Pfadfinder/actions/runs/39133484467) grün (f4aabad…c2920e9), Workers Builds grün; 920 Tests, e2e 98 bestanden, 6 übersprungen (WebKit offline). Lokal grün: `npm run check`, Chromium-Projekte 37/37, `probetest-layout` in vier Viewports.

## 2026-10-18 – Aufgabe 11, Punkte 0–2: Schema 1.0.12, App-Updates, Rechtliches auf der Karte (Punkt 3 wartet auf Freigabe des Wireframes)
- **Gebaut:** (0) Optionen von single-/multi-choice haben `readAloud` (Schema 1.0.12, Validator lehnt es anderswo und leer ab); d-rsl-2-001 liest „Fluss, Fuß, Kissen, Straße, Nuss“ statt „Flu_ … Nu_“, Option c ist jetzt „Ki_en“. (1) Die App registriert den Service Worker selbst (`prompt`), fragt beim Start und bei `visibilitychange` nach; eine neue Version wartet auf „Neue Version – Neu laden“ (`/eltern`) bzw. „Neu laden“ (Karte), nie automatisch. `/eltern` zeigt `Version <hash> · <Tag>`. (2) „Impressum · Datenschutz“ rechts in der Legendenzeile, in jedem Viewport.
- **Ist-Stand vorher:** `autoUpdate` ohne Wirkung, weil vite-plugin-pwa `skipWaiting`/`clientsClaim` nur bei `injectRegister: 'auto'` setzt; keine eigene Update-Prüfung. Live-`sw.js`: `max-age=0, must-revalidate`.
- **Entschieden (Markus):** Legende „Gestrichelt: noch unerforscht.“ (lang brach die Zeile in Safari hoch um, ≈ 17 px). „Neu laden“ auf der Karte hoch erst ab 1024 px Höhe (64rem), Safari hoch nur `/eltern`. Kleinster Gebietsname: Safari hoch 18,2 / `/` 19,1 px, Safari quer 19,1, iPad hoch mit „Neu laden“ 20,3, iPad quer 23,4 (`karte-budget-*.json`).
- **Tests:** `update.spec` mit echtem Zweitbuild und umschaltbarem Server (nur chromium-landscape, +2 s Laufzeit); Unit-Test der Update-Logik; `check-bundle` prüft: kein Selbst-Übernehmen, kein `registerSW.js`, Kennung gesetzt. Gegenproben: Neuladen ohne Flag → Unit rot; ohne `SKIP_WAITING` → E2E rot; `autoUpdate`/`auto` → Build rot.
- **Befund:** CI-Lauf 39125686398 war rot: `eltern.spec` sicherte noch „Rechtliches nur aus /eltern“; ich hatte nach Punkt 2 nur das Layout-Projekt lokal laufen lassen. Test auf die neue Regel umgestellt.
- **Offen:** Wechsel auf diese Version geht noch auf die alte Art (App ganz schließen). Die Home-Bildschirm-App erreicht `/eltern` nicht (keine Adresszeile), dort bleibt nur die Karte. Manueller Prüfschritt am iPad: DEPLOY §8. Punkt 3 (Antworten vergleichen) nach Freigabe des Wireframes.
- **CI:** [CI #39127371448](https://github.com/1701/Pfadfinder/actions/runs/39127371448) grün (3b0d81f…7ee4002), Workers Builds grün; 906 Tests, e2e 98 bestanden, 6 übersprungen (WebKit offline). Lokal grün: `npm run check`, Chromium-Projekte 37/37, Layout-Projekt 37/37.

## 2026-10-18 – Content: Rechtschreibung „Laut und Buchstabe“ (20 Items)
- **Eingespielt:** Batch vom 2026-10-17 unverändert als `rs-laut-buchstabe.json` (vorher leer): d-rsl-1-001 … d-rsl-3-004, Status draft, Niveau 8/8/4, acht Formate, ohne Bilder und ohne `textRef`. `content:validate`: 0 Fehler, 0 Warnungen. Der Bereich ist jetzt übbar. Der Einstieg Deutsch ist noch zu, weil rs-strategien erst 2 Items hat.
- **Layout:** Das Layout-Projekt ist lokal grün (21/21, alle 121 Items in vier Viewports). Einzeln angesehen: 3-002 steht in einer Spalte, jede Option passt in eine Zeile. 3-004: Jede Karte passt in eine Zeile, hoch ist sie 540 px breit. 2-001: Der Unterstrich ist in Andika gut sichtbar.
- **Befund Vorlesen 2-001 (gemeldet, nicht behoben):** Vorlesen sagt „Antworten: Fu_. Flu_. Stra_e. Ku_. Nu_.“ Wie eine Stimme „_“ ausspricht, ist lokal nicht prüfbar (keine Stimme installiert). Schwerer wiegt: Jede Stimme spricht „Flu“, „Ku“, „Nu“ als offene Silbe mit langem u, und das führt bei „Hör auf den Selbstlaut“ zum ß. `readAloud` ersetzt nur den Aufgabenteil; die Antworten getrennt vertonen oder für ein Item weglassen geht nur mit einer Schemaänderung.
- **Offen:** Entscheidung zu 2-001 (Schema-Erweiterung oder Item umbauen).
- **CI:** [CI #39118886077](https://github.com/1701/Pfadfinder/actions/runs/39118886077) grün (d32253c), Workers Builds grün; 878 Tests, e2e 97 bestanden, 6 übersprungen (WebKit offline). Lokal grün: `npm run check`.

## 2026-10-18 – Aufgabe 10: Einstieg-Reihenfolge, Impressum/Datenschutz, Runde über Mitternacht, Hülle
- **Gebaut:** (0) Einstieg: Lesen-Blöcke nach den Runden statt davor; beim Kürzen auf 12 verliert nur Runde 3 Plätze. (1) `/impressum` und `/datenschutz` als statische Seiten (lazy Chunk, dürfen scrollen, kein Vorlesen), verlinkt nur aus `/eltern` oben rechts, schon vor der Rechenfrage; Marker `[NAME]`, `[ADRESSE]`, `[E-MAIL]`, Ersetzen steht in DEPLOY §6. (2) Eine Antwort zählt für den Tag, an dem ihre Runde begann: Abschluss mit dem Starttag, Karte über `practiceDay` (offene Runde von gestern, die nach Mitternacht weiterläuft), „Später“ gilt so lange weiter. (3) `index.html` zeigt vor dem JS „Pfadfinder“ in Andika Bold auf Papier.
- **Datenschutz-Inhalt:** Alles bleibt auf dem Gerät (IndexedDB, § 25 Abs. 2 Nr. 2 TDDDG), keine Cookies, kein Tracking, Sicherung entsteht auf dem Gerät. Cloudflare als Hoster mit Zugriffsprotokollen (Art. 6 Abs. 1 lit. f DSGVO, EU-US Data Privacy Framework). Neu und wahrheitsgemäß: Chrome mit Google-Stimmen schickt den vorzulesenden Text an Google; auf dem iPad bleibt er auf dem Gerät.
- **Entscheidungen:** Eine Runde, deren letzte Antwort vor Mitternacht lag, läuft nicht weiter (wie bisher `planSessionStart`), also zeigt die Karte dann schon den neuen Tag. Nach dem Abschluss einer Runde über Mitternacht zeigt die Karte den neuen Tag: 0 Fundstücke, das Angebot ist wieder da. `lastActivity` ist nach `domain/progress` umgezogen.
- **Befund:** `formate.spec` order wackelte schon vorher (1 von 3 rot auf 4ee168d): Der Helper las die Liste, bevor der lazy Renderer da war. Der Helper wartet jetzt auf die Liste (8 von 8 grün, 26 s statt 2,2 min).
- **Tests:** Gegenproben: alte Reihenfolge → 3 rot, ohne Starttag-Zuordnung → 2 rot, ohne Hülle → `pwa.spec` „ohne JS“ rot. Fake-Clock `settableClock` in den Store-Tests (23:50 → 00:01 → Abschluss).
- **Offen:** Daten für Impressum (Marker). DDG verlangt „leicht erkennbar, unmittelbar erreichbar“; ein Link nur aus der unverlinkten Seite `/eltern` reicht dafür vermutlich nicht.
- **Entschieden (Markus, 2026-10-18):** Nach dem Abschluss einer Runde über Mitternacht zeigt die Karte den neuen Tag, das bleibt so. Die Rechtsseiten bleiben in Du-Form. Die Cloudflare-Angaben prüft vor dem Release die Liste in DEPLOY §6 (Adresse, DPF, Auftragsverarbeitung, kein Web Analytics).
- **CI:** [CI #39114503949](https://github.com/1701/Pfadfinder/actions/runs/39114503949) grün (3411a3f…e6d56bd), Workers Builds grün; 876 Tests, e2e 97 bestanden, 6 übersprungen (WebKit offline). Lokal grün: `npm run check`, `npm run e2e:chromium` bis auf den order-Fall (danach behoben, einzeln 8/8).

## 2026-10-16 – Aufgabe 9, Teil C: Lesetexte beim Üben und im Einstieg, Schema 1.0.11
- **Gebaut:** Lese-Screen („Lies den Text.“, Vorlesen liest Anweisung und Titel; Titel nur hier) vor dem ersten Item eines Textes, in Üben und Einstieg (Check-Store `reading`, Pause kehrt zurück). Beim Item der Kasten ohne Titel, Verlauf unten und oben (`data-more-above`). `ui/text-scroll` hält die Scrollposition je Text, nach dem Lese-Screen oben. `buildCheck`: Lesen-Bereiche als Block vor den Runden. `probetestTextReadAloud` vorgesehen, `/dev/item` zeigt den Text, Dev-Runde `/dev/text/:id?runde` mit echtem Store.
- **Freigabe umgesetzt (gemessen):** hoch Reserve je Format (single-choice 574, mark-in-text 593, multi-choice 654, order 665, short-answer 704 px): in Safari 196–326 px, auf dem iPad 320–450 px Kasten, jedes Format genau 18 px Luft. Quer 34 % unter, 42 % ab 768 px Höhe (Media Query `48rem`: In Media Queries gilt 16 px je rem, und `px` verbietet der Literal-Test); knappste Luft 25 bzw. 52 px.
- **Schema 1.0.11:** mark-in-text mit `textRef` höchstens 4 Sätze und 200 Zeichen, Validator warnt; Fixture auf 4 Sätze gekürzt.
- **Tests:** `lesen.spec` (Lese-Screen → drei Items desselben Textes → Scrollposition bleibt → Item-Vorlesen ohne Text, Kasten-Vorlesen mit Text, beide iPad-Formate; Gegenprobe: Kasten je Item neu → rot). `text-layout.spec` prüft 18 px je Format und beide Spaltenbreiten. Store-Test Einstieg mit Lesetext.
- **Entschieden (Markus, 2026-10-17):** Vorlesen auf dem Lese-Screen liest Anweisung und Titel, den Text nur der Kasten. Die freie Fläche neben „Vorlesen“ im Kasten (quer) bleibt.
- **Beobachten:** Lokal einmal `blatt-layout` (ipad quer) „Prüfen“ nicht gefunden, einzeln 12/12 grün, in CI grün; Verdacht: bekannter Ladefehler des Dev-Servers unter Last. Tritt es noch einmal auf, wartet die Spec auf einen Marker „App bereit“ statt auf „Prüfen“.
- **CI:** [CI #38970869050](https://github.com/1701/Pfadfinder/actions/runs/38970869050) grün (dc84072), Workers Builds grün; 861 Tests, e2e 89 bestanden, 6 übersprungen (WebKit offline). Lokal grün: `npm run check`, `text-layout` und `lesen.spec` in allen Viewports.

## 2026-10-16 – Aufgabe 9, Teil B: Layout-Budget und Wireframes (freigegeben mit sieben Änderungen, siehe Teil C)
- **Gebaut (Messgerüst, bleibt für Teil C):** `TextKasten` (Absatznummern am Rand, `text-reading` 22 px/1,6, eigener Vorlesen mit `textSpeech`, Verlauf unten nur solange Text folgt, fokussierbar), `LeseScreen`, `ItemScreen` mit `text` (quer Spalte links, hoch Block oben, `.item-with-text`), `ItemKopf`. Dev-Seite `/dev/text/:id?item=…&zustand=…` mit dem Fixture, nur im Dev-Build (`check-bundle` sucht den Fixture-Titel).
- **Gemessen** (`text-layout.spec`, vier Viewports, `text-budget-*.json`): hoch kostet jedes Pixel Kasten genau ein Pixel Luft; Grenze short-answer „vergleichen“. Quer springt die Luft mit den Umbrüchen; Grenze mark-in-text mit ganzem Absatz. Vorschlag: hoch `100dvh − 704 px` (196 px Safari, 320 px iPad), quer fest 34 % (36 % bricht Safari quer um 6 px). Knappste Luft damit überall 18 px oder mehr.
- **Verworfen (gemessen):** Band quer über beide Spalten, bringt nur 38 % statt 34 % und kürzt den Kasten bei der Rückmeldung.
- **Befund:** `sr-only`-Absatznamen im Scroll-Kasten verlängerten die Seite um 238 px, bis der Scroller `relative` bekam.
- **Wireframes:** privates Artefakt mit 10 Screens quer und hoch (Safari und iPad) und 8 Fragen zur Freigabe.
- **CI:** [CI #38963521312](https://github.com/1701/Pfadfinder/actions/runs/38963521312) grün (6c088ad), Workers Builds grün; 849 Tests, e2e 87 bestanden, 6 übersprungen (WebKit offline). Lokal grün: `npm run check`, Layout-Projekt (35/35, `text-layout` in vier Viewports).

## 2026-10-16 – Aufgabe 9, Schritt 0 und Teil A: Schema 1.0.10, Lesetexte in Domain und Loader
- **Schema 1.0.10 (nur Doku):** §5 „Absätze werden nummeriert; Items verweisen auf Absätze, nie auf Zeilen“. CHANGELOG.
- **Gebaut:** `pickNext` hält einen laufenden Text zusammen (`sessionItemIds`), nächstes Niveau zuerst; `buildCheck` nimmt die 2–3 Items eines Lesen-Bereichs aus einem Text (Seed); `readingStep` (Lese-Screen vor dem ersten Item eines Textes in der Runde, nie bei Wiederholungen); Session-Store mit Status `reading`, `doneReading()`, `shownTextIds` nur im Speicher; Zeit des Items erst ab „Weiter“. `loadTexts` ordnet über `kind` zu (Freigabe), `createContentLoader(modules)` für Fixtures; `check-bundle` prüft Text-Chunks im Precache.
- **Abweichung (gewollt, Freigabe):** Solange ein Text läuft, wiederholt `pickNext` auch Items aus den letzten 20, und fällige Wiederholungen warten bis zum Textende (ARCHITECTURE §5, Test `pick-next-text`).
- **Fixture:** `tests/fixtures/lesen`: t-sach-900 „Baumeister am Bach“ (250 Wörter, fünf Formate) und t-sach-901 mit fünf Klonen; zusammen 10 Items, sonst wäre der Bereich nicht übbar. Eigener Test: gültig ohne Warnungen.
- **Offen:** Einstieg Deutsch ist erst erreichbar, wenn zwei Deutsch-Bereiche übbar sind (PRODUCT §5.4). Gegenproben: ohne Text-Regel 5 Tests rot, ohne Text-Wahl im Check 2.
- **CI:** [CI #38957542169](https://github.com/1701/Pfadfinder/actions/runs/38957542169) grün (723dd8c), Workers Builds grün; 840 Tests, e2e 85 bestanden, 6 übersprungen (WebKit offline). Lokal grün: `npm run check`.

## 2026-10-16 – Zwischenschritt: Vorlesen-Stimme und Sicherung
- **Vorlesen:** keine `voice` mehr, nur `lang` de-DE und `rate` 0,9. iOS nimmt so die in den Bedienungshilfen eingestellte Stimme; bisher setzte die App die erste deutsche Stimme der Liste fest (offen seit Aufgabe 7). Ein Test sichert, dass keine Stimme gesetzt und keine Liste gelesen wird. PRODUCT §8 hält den Elternhinweis „Premium-Stimme unter Bedienungshilfen laden“ als Text für später fest.
- **Eltern:** „Sicherung herunterladen“ über „Alles löschen“, nicht gelb, beide gleich breit. `backupFile` (data/backup) baut die Datei über `exportLearnerData`/`serialize` und benennt sie `pfadfinder-sicherung-JJJJ-MM-TT.json` nach dem lokalen Tag. Ausgeliefert wird sie als Blob-Download, ohne Netz. Ohne Learner wird zuerst einer angelegt, damit die Datei gültig ist. Schlägt die Sicherung fehl, steht ein Hinweis da, und es wird nichts gelöscht.
- **Abweichung vom Auftrag:** Die Datei ist ExportFile **Version 2**, nicht v1. Version 2 gilt seit Aufgabe 8; v1-Dateien werden beim Import umgewandelt. Die Tests prüfen gegen `EXPORT_VERSION`.
- **Tests:** Unit (Dateiname, Datei lesbar mit `parseImport`, Knopf-Reihenfolge, Fehlerfall). E2E mit echtem Download: zwei Attempts in der Datei, `parseImport` ok, in Chromium und WebKit. `blatt-layout` in vier Viewports grün.
- **Offen:** Import und Übersicht im Eltern-Bereich. Am iPad prüfen: Wie Safari den Download anbietet und ob die Premium-Stimme greift.
- **CI:** [CI #38952700004](https://github.com/1701/Pfadfinder/actions/runs/38952700004) grün (0248d4f), Workers Builds grün; 815 Tests, e2e 85 bestanden, 6 übersprungen (WebKit offline). Lokal grün: `npm run check`.

## 2026-10-15 – Aufgabe 8, Teil C: Probetest-Oberfläche und Druck
- **Gebaut:** `/probetest/:id` (lazy Chunk `probetest-route`):
  - Ablauf: Intro („schon gemacht“, „Auswertung ansehen“), Aufgaben mit „Zurück“/„Weiter“ und Minuten ohne Sekunden („Noch 5 Minuten“ … „Noch 1 Minute“), Übersicht mit antippbaren Strichen, Rückfragen vor dem Abgeben und vor „Zur Karte“.
  - Auswertung je Bereich ohne Prozent, wartende Kurzantwort gestrichelt. Durchsehen mit Band, „Hier fehlt deine Antwort.“ und Selbsteinschätzung.
  - Uhr-Hook mit `visibilitychange`/`pageshow`; die Karten-Zeile „Probetest Mathe“ steht in der Legendenzeile.
  - `/probetest/:id/print` (Chunk `print-route`): Papierformen je Format, 40 mm Rechenplatz, Lösungsblatt auf eigener Seite, A4.
- **Freigabe-Änderungen umgesetzt:** Übersicht „Weitermachen“/„Abgeben“, Gelb wechselt nach dem Stand (mit Test); Rückfrage „Weitermachen“ führt in die Übersicht; Item ohne Antwort ohne „Falle“; Rechenplatz im Druck.
- **Befund und Fix:** Im Durchsehen standen „Zurück“ und „Weiter“ nebeneinander. In Safari hoch blieb der Rückmeldung so nur ein Drittel der Breite, und m-gm-1-004 ohne Antwort lief 8 px unter das Band. Hoch stehen die Knöpfe jetzt untereinander; die knappste Luft beträgt 54 px. Die Übersicht hat Vorlesen bekommen (Kinder-UX-Checkliste).
- **Messung (vier Viewports):** knappste Luft beim Antworten 33 px (m-dz-2-002, Safari quer), beim Durchsehen 52 px. Kleinster Kartenname mit Zeile 19,1 px. Startseite 281,1 kB (vorher 278,4).
- **Bekannt:** Gespeichert wird wenige Millisekunden nach dem Tipp; endet die App genau dann, fehlt die letzte Änderung (in der E2E abgewartet). Kurzantwort ohne Einschätzung hat kein Attempt.
- **CI:** [CI #38752818290](https://github.com/1701/Pfadfinder/actions/runs/38752818290) grün (91257b2), Workers Builds grün; 807 Tests, e2e 81 bestanden, 6 übersprungen (WebKit offline). Lokal grün: `npm run check`, `npm run e2e:chromium` (61/61), `probetest-layout` in vier Viewports, `probetest.spec` 24/24 mit `--repeat-each=3`.

## 2026-10-15 – Aufgabe 8, Teil B: Layout-Budget und Wireframes (wartet auf Freigabe)
- **Gemessen** (`probetest-layout.spec` auf `/dev/probetest`, vier Viewports, Zahlen in `tests/e2e/screenshots/probetest-budget-*.json`): Kopf „Übersicht | 7 von 24 | 45 Min.“ 48 px hoch, mindestens 193 px Lücke („Noch 5 Minuten“, hoch). Mit 24 Wegstrichen bricht er hoch auf 78 px um (Beleg für die Entscheidung). Item im Test knappstes m-dz-2-002 mit 33 px Luft (Safari quer). Durchsehen „Zurück“ im Band ≥ 50 px, im Kopf ≥ 60 px. Übersicht ohne Scrollen, Tippziele 48 px.
- **Gebaut (Messgerüst, bleibt für Teil C):** ItemScreen nimmt einen eigenen Kopf und eigene Bandknöpfe. FeedbackPanel kann „Zurück“ und eine andere Beschriftung für „Weiter“. `fitMetrics` gibt die Luft zurück. In CI misst die Spec nur die Safari-Viewports.
- **Wireframes:** privates Artefakt mit 12 Screens quer und hoch und der Druckansicht als A4-Vorschau.
- **Offen zur Freigabe (aus der Messung):** A: Die Karte hat hoch unter der Mathe-Insel nur 21–24 px Wasser. Vorschlag: „Probetest Mathe“ links in der Legendenzeile. B: „Zurück“ beim Durchsehen im Band (Vorschlag) oder im Kopf. C: Eine wartende Kurzantwort ist ein gestrichelter Strich.
- **CI:** [CI #38739254593](https://github.com/1701/Pfadfinder/actions/runs/38739254593) grün (1b57c2e), Workers Builds grün; 735 Tests, e2e 62 bestanden, 4 übersprungen (WebKit offline). Lokal grün: `npm run check`, `probetest-layout` in vier Viewports.

## 2026-10-15 – Aufgabe 8, Schritt 0 und Teil A: Schema 1.0.9, mathe-01, Probetest-Domain
- **Schema 1.0.9:** Summe `estimatedSeconds` Mathe 24–32 Min. (statt 35–42), Deutsch bleibt 35–42 (vorläufig bis deutsch-01). Validator prüft je Fach, Obergrenze jetzt getestet. Das Manifest nennt die Probetest-IDs je Fach. `niveauMix`/`bereichMix` erwartet der Validator schon als Anzahlen, es gab nichts zu melden.
- **Content:** `content/probetests/mathe-01.json` unverändert aus der Zip (24 Items, 26,7 Min.).
- **Gebaut:** `domain/probetest` (Wanduhr-Zeit, `onOpen`/`onDeadline` mit 60 s Kulanz, `finishRun`, `rateShortAnswer`, `scoreRun` mit solved/total/pending, `introState`, Vorlese-Schalter je Fach), `data/probetest` und `data/probetest-store` (jede Änderung sofort gespeichert, in Reihenfolge). ProbetestRun mit Status, Entwürfen, Einschätzungen, Ergebnis ohne Prozent. Export Version 2 mit Migration v1 → v2.
- **Entscheidungen (Markus):** kein Prozent gespeichert, `FOREGROUND_GRACE_MS` 60 000, „Auswertung ansehen“ mit nachholbarer Einschätzung. Eigene: Unbeantwortete Kurzantwort zählt als offen, nicht als wartend. Attempts entstehen beim Ende des Durchgangs, Kurzantworten erst mit Einschätzung.
- **Bekannte Lücke:** Eine Kurzantwort ohne Einschätzung hat kein Attempt (der Text steht nur im Durchgang).
- **Beobachtung:** Der Scheduler zählt Probetest-Attempts wie alle für „zuletzt gesehen“ und `attemptIndex` (unverändert, „wie bisher“).
- **Tests:** 18 Domain-, 17 Store-Tests (Neuladen, abgelaufene Zeit beim Öffnen, Zeitablauf vorn/verdeckt, offene Items, Teils, kein Mastery/Fehlerkiste/Tagesziel, zweiter Durchgang, ein laufender je ID). Gegenprobe: Kulanz und Teils-Regel gebrochen → je 2 Tests rot.
- **CI:** [CI #38736144023](https://github.com/1701/Pfadfinder/actions/runs/38736144023) grün (c5998b2…8fe27cd), Workers Builds grün. Lokal grün: `npm run check` (732 Tests).

## 2026-10-15 – Nacharbeit Aufgabe 7: nichts springt nach Prüfen
- **Entschieden (Markus):** „Keine neue Bewegung“ gilt auch für Layout-Sprünge. formate.spec nur in Chromium ist hinnehmbar, Touch-Ziehen nimmt das iPad ab. WebKit in CI reicht über den Üben-Ablauf.
- **Gebaut:** order behält nach Prüfen die Plätze von Griff und Pfeilen (unsichtbar). match zeigt „Richtig ist:“ als Liste dort, wo der Vorrat war (quer rechts, hoch unten). Vorher standen die Hinweise je Zeile und brachen um, die Zeilen darunter rutschten nach unten (gefunden vom neuen Test). `formate.spec` vergleicht die Lage von order-Karten und match-Begriffen vor und nach Prüfen in vier Viewports.
- **Befund CI:** [#38721815778](https://github.com/1701/Pfadfinder/actions/runs/38721815778) rot: Chromium „Page crashed“ im Layout-Test nach etwa 300 Navigationen in einem Tab, kein Layout-Befund. Jetzt ein Tab je Item.
- **Offen für die iPad-Sitzung:** `/dev/item` gibt es live nicht (nur Dev-Build). Vorlesen setzt die erste deutsche Stimme fest, nicht die in iOS gewählte.
- **CI:** [CI #38724736120](https://github.com/1701/Pfadfinder/actions/runs/38724736120) grün (470420c…e66d00a), Workers Builds grün; 691 Tests, e2e 60 bestanden, 4 übersprungen (WebKit offline). Lokal grün: `npm run check`, Layout-Projekt (26/26).

## 2026-10-14 – Aufgabe 7: Renderer für die sieben restlichen Formate
- **Gebaut:** multi-choice, match (Tippen und Ziehen), order (Ziehen und ↑/↓), cloze-select, mark-in-text (splitUnits), find-error, short-answer („Vergleichen“, dann Getroffen/Teils/Noch nicht, Band ohne Überschrift). `domain/presentation` mischt und liefert den Vorlesetext („Antworten: …“, auch bei single-choice). Alle neun Formate sind übbar; kein neuer Bereich wird dadurch übbar (ms und rss je 2 Items). match/order in eigenen Chunks, `check-bundle` hält dnd-kit aus Startseite und Routen (Gegenprobe rot). Startseite 278,3 kB.
- **Content:** drei mark-in-text-Items (rs-strategien zusammengeführt, m-ms-3-001 „falsch geschrieben“), daten-zufall v7. Schema 1.0.8: 24-Zeichen-Regel auch für multi-choice mit Bild, `model` ≤ `maxChars` im Validator.
- **Messung:** m-dz-2-007 in Safari quer nach Prüfen −23 px vor, +89 px nach v7 (zweispaltig). Knappster Fall jetzt short-answer m-dz-3-003 mit +16 px.
- **Entscheidungen:** Freigaben aus Teil A (Artefakt), dazu: Prüfen bei order erst nach der ersten Bewegung, Korrektur bei find-error in beiden Zuständen, Knopf „Vergleichen“. match nutzt ein Raster für vorher und nachher (3 : 2), damit nichts springt.
- **Testwerkzeug:** Layout-Test über alle Items meldet je Viewport die ganze Liste (im Lauf gesehen: ein Befund −1 px bei match, behoben). `formate.spec` je Format mit Screenshots vor/nach Prüfen in vier Viewports. Preview-Server nie wiederverwendet. Gefunden: `currentItem` verwechselte Items mit gleichem Prompt.
- **Offen:** iPad-Tastatur bei short-answer nur am Gerät prüfbar (Markus’ Liste). Nach Prüfen rücken order-Karten um die Griffbreite nach links.
- **CI:** [CI #38604063472](https://github.com/1701/Pfadfinder/actions/runs/38604063472) grün (1e0f758…e48ecfb), Workers Builds grün; 691 Tests, e2e 60 bestanden, 4 übersprungen (WebKit offline). Lokal grün: `npm run check`, `npm run e2e:chromium` (46/46, Layout in vier Viewports).

## 2026-10-14 – Entscheidungen zu Aufgabe 6b, Rechenfrage ist ein Schild
- **Entschieden (Markus):** Der Auswahl-Screen „Fortsetzen“/„Neu anfangen“ bleibt; ein Tipp mehr beim Fortsetzen verhindert ein versehentliches Neu anfangen. „Später“ gilt je Gerät (im MVP ein Lernender pro Gerät, alles andere ist PRODUCT §11). Beim Löschen ist kein Knopf gelb, weil Löschen kein nächster Schritt auf dem Weg ist.
- **Geändert:** ARCHITECTURE §7 und PRODUCT §7: Die Rechenfrage ist kein Schutz, sondern ein Schild „für Eltern“. Der Schutz ist allein, dass kein Link zu `/eltern` führt. PRODUCT §7 sagt nicht mehr „Kindersicherung“, der Kommentar in `domain/parents/gate.ts` sagt dasselbe.
- **Offen (Pilot):** Der Weg vom Fehler zum Neustart ist Pause → Karte → Gebiet → „Neu anfangen“, vier Tipps. Wenn Tochter nach einem Fehler sichtbar den Neustart sucht, kommt „Neu anfangen“ zusätzlich in die Üben-Pause. Erst dann, nicht vorsorglich.
- **CI:** [CI #38581940617](https://github.com/1701/Pfadfinder/actions/runs/38581940617) grün (7330608), Workers Builds grün; 618 Tests, e2e 51 bestanden, 4 übersprungen (WebKit offline).

## 2026-10-14 – Aufgabe 6b: Neu anfangen, Später bis Tagesende, Eltern-Seite
- **A:** Mit einer offenen Runde von heute fragt das Gebiet zuerst: „Fortsetzen“ (gelb, rechts) oder „Neu anfangen“. Neu anfangen schließt die Runde mit `closeSession` ohne Abschluss und startet 10 neue Items über `pickNext`. Attempts, Mastery, Fehlerkiste und Entdeckungen bleiben, das Tagesziel springt nicht zurück (Store-, UI- und E2E-Test). Ohne offene Runde geht es wie bisher direkt los.
- **B:** „Später“ steht in Dexie (Tabelle `postponedOffers`, Schema v2, geräteweit, nicht im Export) und gilt bis zum Ende des lokalen Kalendertags (`postponedFaecher`). Tests: Remount und Neuladen am selben Tag ohne Angebot, am nächsten Tag mit Angebot, Upgrade einer v1-Datenbank.
- **C:** `/eltern` nur per URL (lazy Chunk `eltern-route`): Summe zweier zweistelliger Zahlen auf dem Ziffernblock, dann „Alles löschen“ mit Rückfrage. Danach werden alle Tabellen geleert und die Startseite neu geladen; die Karte zeigt wieder das Angebot. Kein Vorlesen dort.
- **Entscheidungen:** Einen „Fortsetzen“-Knopf gab es vorher nicht, der Wahl-Screen ist neu. Nach dem Löschen wird die Seite ganz neu geladen, weil die Stores sonst den gelöschten Learner behalten. ARCHITECTURE §7 nennt jetzt die Addition statt 6 × 7 … 9 × 9. `EinstiegBlatt` heißt jetzt `Blatt`.
- **Befund Wegstriche:** Beim Üben ist jeder bearbeitete Strich gleich gefüllt, richtig und „noch nicht“ sehen gleich aus.
- **Gefixt:** Der Einstieg-E2E suchte „richtig/falsch“ auf der ganzen Seite und traf Aufgabentexte. Er war je nach Session-ID rot, auch in [CI #38545341348](https://github.com/1701/Pfadfinder/actions/runs/38545341348) und [#38552493973](https://github.com/1701/Pfadfinder/actions/runs/38552493973).
- **Neu:** Offline-E2E für den Einstieg, `blatt-layout.spec` (Wahl und Eltern in vier Viewports mit Screenshots).
- **CI:** [CI #38554075122](https://github.com/1701/Pfadfinder/actions/runs/38554075122) grün (0eeb6aa…7cd4ffc), Workers Builds grün; 618 Tests, e2e 51 bestanden, 4 übersprungen (WebKit offline). Lokal grün: `npm run check`, `npm run e2e:chromium` (37/37).

## 2026-10-14 – Aufgabe 6, Teil B und C: Einstieg-Oberfläche
- **Teil B:** Fünf Wireframes, je quer und hoch, als private Artifact-Seite, von Markus mit fünf Änderungen freigegeben.
- **Gebaut:** Karte mit Angebot: Die Frage ist die Überschrift, daneben „Los“/„Später“, das Tagesziel tritt zurück. Kein Angebot, wenn der Speicher nicht lesbar ist. `/einstieg/:fach` im lazy Chunk `check-route` (8 kB) mit Intro (leere Wegstriche), Item-Screen mit „Weiter“ ohne Rückmeldung, Pause mit Rückfrage („Zur Karte“ links, „Weitermachen“ rechts) und Ergebnis (nur die Insel des Fachs, nicht antippbar). Hinweis „Deine Reise hat schon begonnen.“ bei vorhandenem Stand und wenn `finishCheck` nichts schreibt; bei Deutsch der Hinweis „Hier gibt es noch nicht genug Aufgaben.“.
- **Entscheidungen:** Gelb (primär) haben auch „Los“, „Starten“, „Weitermachen“ und „Zur Karte“ auf dem Ergebnis (Wireframe-Freigabe; der Kommentar in `Button.tsx` ist angepasst). `buttonClass(variant, size)` trennt Farbe und Größe. Kein Wort „Check“ in der UI (Test).
- **Messung:** Das Angebot ändert die Karte nicht: Kleinster Name auf `/` mit Angebot ≥ 18 px in allen vier Viewports. Im Hochformat wird die Karte größer, weil die Tagesziel-Zeile fehlt. Startseite 277,1 kB (Budget 300 kB).
- **Offen:** Sobald Deutsch übbar ist, kann das Tagesziel bei offenem Mathe-Angebot mehr als 0 zählen und ist dann trotzdem ausgeblendet.
- **CI:** [CI #38544063300](https://github.com/1701/Pfadfinder/actions/runs/38544063300) grün (4677421), Workers Builds grün; 576 Tests, e2e 37 bestanden, 2 übersprungen (WebKit offline), der Einstiegsflow auch in WebKit. Lokal grün: `npm run check`, `npm run e2e:chromium` (27/27, Layout in vier Viewports).

## 2026-10-14 – Aufgabe 6, Teil A: Einstiegscheck (Domain, Store, Speicherung)
- **Gebaut:** `buildCheck(fach, pool, { bereiche, seed })` prüft nur übbare Bereiche, je 2–3 Items, höchstens 12 (Mathe heute: 4 Bereiche, 12 Items). Neu: `checkStartNiveau`, `domain/check` (`recordCheckAnswer`, `completeCheck`, `startDiscoveries`), `progress/check-offer` (zodfrei), `data/check` und `data/check-store` (Status `intro`/`answering`/`paused`/`saving`/`finished`/`unavailable`).
- **Entscheidungen (Markus):** Das Startniveau ist das höchste Niveau mit einer richtigen Antwort (R W W → 1, R R → 2, R R R → 3); `checkLadderNiveau` wählt nur noch das nächste Item. Runde 3 geht zuerst an gemischt beantwortete Bereiche. MasteryState gibt es nur für geprüfte Bereiche. Alles wird erst nach der letzten Antwort in einer Transaktion gespeichert, mit erneuter Prüfung „kein MasteryState im Fach“. Der Check füllt weder Fehlerkiste noch Tagesziel. Seed = Session-ID. PRODUCT §5.4/§11 und ARCHITECTURE §3/§5 sind angepasst.
- **Tests:** Verteilung bei 3/4/5 Bereichen, Runde 3, Leiter, Entdeckungen, Angebot; Store mit echtem Content: Durchlauf, Pause/Weiter, Abbruch ohne Spuren, Doppelstart, Rollback, keine Fehlerkiste, Export/Import.
- **Offen:** Teil B (Wireframes) wartet auf Freigabe. Das Angebot passt nicht als eigene Zeile über die Karte (Namen in Safari 16,6 px), der Vorschlag steht deshalb in der Kopfzeile.
- **CI:** [CI #38532108002](https://github.com/1701/Pfadfinder/actions/runs/38532108002) grün (591a156), Workers Builds grün; 543 Tests, e2e 21 bestanden, 2 übersprungen (WebKit offline). Lokal grün: `npm run check`.

## 2026-10-13 – daten-zufall v5 und v6, Niveau-Zeile II
- **Content:** `daten-zufall.json` v5: Nur die Optionen von m-dz-2-006 und m-dz-3-001 sind gekürzt, Lösungen und IDs bleiben. Damit halten alle 10 `single-choice`-Items mit Bild die 24-Zeichen-Regel ein. `content:validate`: 98 Items, 0 Fehler, 0 Warnungen; das Manifest bleibt gleich.
- **Schema (bleibt 1.0.7):** §7 Niveau, Zeile II: „zwei Schritte, oder zwei Informationen aus Tabelle/Text/Bild verknüpfen“. Der abgrenzende Satz im Kalibrierungsabsatz ist gestrichen. CHANGELOG 1.0.7 ergänzt.
- **v6 (nur Texte):** m-dz-2-006 sagt jetzt „sehr oft“ gedreht, und die Rückmeldung verbindet „öfter“ bei vielen Drehungen mit „wahrscheinlicher“. m-dz-3-002 nennt in der misconception zusätzlich, dass 20 Würfe wenige sind. Optionen und Lösungen unverändert, Layout-Test in allen vier Viewports grün. Damit ist der Widerspruch zwischen „kommt öfter“ (m-dz-2-006) und dem Denkfehler aus m-dz-3-002 aufgelöst.
- **CI:** [CI #38462576304](https://github.com/1701/Pfadfinder/actions/runs/38462576304) grün (d0ec7a2), Workers Builds grün; 500 Tests, e2e 21 bestanden, 2 übersprungen (WebKit offline). Lokal grün: `npm run check`, Layout-Test in allen vier Viewports.
- **CI v6:** [CI #38465819671](https://github.com/1701/Pfadfinder/actions/runs/38465819671) grün (dace227), Workers Builds grün; 500 Tests, e2e 21 bestanden, 2 übersprungen (WebKit offline).

## 2026-10-13 – Schema 1.0.7: Optionslänge bei Bildern, Kalibrierung Mathe
- **Dokumentiert:** CONTENT_SCHEMA §7 Bilder: `single-choice` mit Bild hat Optionen mit höchstens 24 Zeichen (zweispaltig, Befund Batch 4). §7 Niveau: Absatz „Kalibrierung Mathe (Pilot Oktober 2026)“. CHANGELOG 1.0.7, PRODUCT §11 nennt die Validator-Prüfung als Roadmap. Kein Code, der Validator bleibt unverändert.
- **Entscheidungen:** Die alte Zeile „II: … Information aus Tabelle/Text/Bild zu holen“ blieb zunächst stehen, ein Satz im neuen Absatz grenzte ab. Ersetzt durch den Eintrag darüber.
- **Offen:** Zwei aktive Items hielten die 24-Zeichen-Regel nicht ein: m-dz-2-006 und m-dz-3-001. Erledigt durch den Eintrag darüber.
- **CI:** nicht abgewartet (Auftrag). Lokal grün: `npm run check`.

## 2026-10-13 – Tipp im Band heißt „Falle“
- **Geändert:** Der Knopf vor der misconception heißt „Falle“ statt „Warum?“; der zugängliche Name ist „Falle zeigen“ und beginnt mit dem sichtbaren Wort (Label in Name). Die Texte stehen in `src/ui/text/feedback.ts`. Verhalten unverändert: nur bei „noch nicht“ mit misconception, klappt im Band auf, Vorlesen liest sie mit. PRODUCT §5.6 nachgezogen. Tests angepasst, dazu ein Test für Label in Name; E2E-Selektoren nutzten „Warum?“ nicht.
- **Offen:** Der pfadfinder-ui-Skill verlangt, dass Buttons sagen, was passiert. „Falle“ ist ein Nomen; für prüfungsängstliche Kinder im Pilot beobachten, ob das Wort verstanden wird und nicht beunruhigt.
- **CI:** [CI #38458966991](https://github.com/1701/Pfadfinder/actions/runs/38458966991) grün (9951fcb), Workers Builds grün; 500 Tests, e2e 21 bestanden, 2 übersprungen (WebKit offline). Lokal grün: `npm run check`.

## 2026-10-13 – Batch 4 daten-zufall
- **Eingespielt:** `daten-zufall.json` v4 und 10 SVGs `dz-*`. v2 brachte `dz-tabelle-2` mit 480 × 210 und gestrafftes Feedback der 8 Items, die vor 5d rot waren. v3 und v4 änderten nur m-dz-3-002. `content:validate`: 98 Items, 0 Fehler, 0 Warnungen. Manifest: 20 Items, Niveau 8/8/4; Einfachwahl 9, Zahleneingabe 7, Mehrfachwahl 2, Zuordnen 1, Kurzantwort 1; 16 mit Renderer. „Daten und Zufall“ ist auf der Karte offen, eine Üben-Session mit Strichliste und Glücksrad lief durch.
- **Layout:** Lokal grün in allen vier Viewports. m-dz-3-002 hat in Safari quer mindestens +59,6 px Luft (vorher −52 px), weil alle Optionen ≤ 24 Zeichen haben und zweispaltig stehen. Mit v3 brachte kürzerer Text nichts, weil sich die Zahl der Zeilen nicht änderte.
- **SVG-Schrift bei 144 px Bildhöhe:** 18,0 px (Glücksräder) bis 20,8 px (Strichliste).
- **Entschieden:** PRODUCT §5.6 nennt jetzt „Warum?“: Der Denkfehler steht hinter dem Tipp und wird beim Vorlesen immer mitgelesen.
- **Offen:** Pilotfragen aus dem Batch-README (Strichbündel als 5, Säule zwischen Gitterlinien, „wahrscheinlich“ oder „am wahrscheinlichsten“).
- **CI:** [CI #38456825589](https://github.com/1701/Pfadfinder/actions/runs/38456825589) grün (431dca5), Workers Builds grün; 498 Tests, e2e 21 bestanden. Lokal grün: `npm run check`, Layout-Test in allen vier Viewports.

## 2026-10-13 – Aufgabe 5d: Item-Screen nach „Prüfen“
- **Gebaut:** Nach „Prüfen“ wird der Ziffernblock entfernt, nicht gedimmt. Die Zahl bleibt mit Einheit in derselben Größe stehen, beim nächsten Item ist der Block wieder da. Die misconception steht hinter „Warum?“ (48 px wie die Optionen) und klappt im Band auf; Vorlesen liest sie weiter mit. Tests: Block nach Prüfen nicht im DOM, Zahl sichtbar, Block beim nächsten Item zurück; „Warum?“ nur bei „noch nicht“ (auch 0,5) und nur mit misconception; Vorlesen enthält sie zugeklappt.
- **Entscheidungen:** „Warum?“ steht über „Weiter“ in der rechten Spalte, nicht unter der Erklärung. Dort ist neben dem Text ohnehin Platz, das Band wird zugeklappt also nicht höher; eine zweizeilige misconception wäre kaum höher gewesen als der Knopf. Nach dem Aufklappen geht der Fokus leise auf „Weiter“, weil der Knopf verschwindet. Die Layout-Helfer wählen „Prüfen“/„Weiter“ jetzt als letzten direkten Knopf des Bands. Aufgeklappt darf das Band überlappen, die Seite scrollt nicht (gemessen).
- **Offen:** PRODUCT §5.6 sagt „häufiger Denkfehler benannt“; er ist jetzt einen Tipp entfernt. Soll das dort stehen?
- **CI:** [CI #38449173350](https://github.com/1701/Pfadfinder/actions/runs/38449173350) grün (6e56d67), Workers Builds grün; 498 Tests, e2e 21 bestanden, 2 übersprungen (WebKit offline). Lokal grün: `npm run check`, Layout-Test in allen vier Viewports. Der lokale Lauf von `e2e:chromium` (17/17) prüfte Üben-Flow und PWA gegen einen alten `vite preview` aus einem abgebrochenen Lauf (`reuseExistingServer`); diese Teile hat nur CI frisch geprüft.

## 2026-10-12 – Schema 1.0.6: SVG-Schrift relativ zur viewBox, Layout-Test in CI
- **Gebaut:** SVG-Schrift muss mindestens viewBox-Höhe / 8 groß sein, statt fest 22 (144 px × font / Höhe ≥ 18 px). CONTENT_SCHEMA §7, CHANGELOG 1.0.6, Validator; jede zu kleine Größe wird je Datei einmal gemeldet. `svg-schrift-patch.zip` ist eingespielt (gm-uhr-1 Ziffern 33 mit kürzeren Zeigern, die „9“ ist frei; rf-spiegel-1 24; rf-wuerfelnetz-1 38). Alle SVGs halten die neue Regel ein; die Gegenprobe mit der alten Uhr schlägt an. Der Layout-Test läuft in CI nur in 1024×660 und 768×900, lokal in allen vier (ARCHITECTURE §8).
- **Befund:** Lokal liefen zwei Layout-Tests in die Zeitgrenze. Der Vite-Entwicklungsserver lieferte unter paralleler Last einmal „Failed to fetch dynamically imported module“ (`daten-zufall.json`), und die Testseite wartete dann ewig. Ein erneuter Lauf war grün. Jetzt lädt der Test eine Seite, die nach 20 s nicht steht, einmal neu, und die Zeitgrenze wächst mit der Zahl der Items.
- **Offen:** Die Ursache des vorübergehenden Ladefehlers ist nicht geklärt (nur unter paralleler Last auf dem Entwicklungsserver gesehen).
- **CI:** [CI #38297317019](https://github.com/1701/Pfadfinder/actions/runs/38297317019) grün (99f6603…1c54005), Workers Builds grün; 493 Tests, e2e 21 bestanden, 2 übersprungen (WebKit offline). Der e2e-Job braucht 6,2 statt 9,5 min. Lokal grün: `npm run check`, Layout-Test in allen vier Viewports (je etwa 2 min).

## 2026-10-12 – iPad-Test, Batch 3 groessen-messen, Geldbeträge
- **iPad:** Markus hat „Zum Home-Bildschirm“, Start ohne Safari-Leiste und Offline-Start auf dem iPad bestätigt (ohne Foto). Damit ist das Kriterium „installierbar auf dem iPad“ (ARCHITECTURE §8) erfüllt.
- **Content:** `groessen-messen.json` ersetzt (20 Items, `m-gm-2-004` unverändert) und `gm-uhr-1.svg` (7:45 Uhr, Zeiger nachgerechnet, Lösung passt). 13 Items haben einen Renderer, „Größen und Messen“ ist auf der Karte offen. `content:validate` grün, 78 Items.
- **Fix:** Bei Geld stand „Richtig ist: 2,2 €“. Beträge in € mit Cent haben jetzt immer zwei Nachkommastellen, auch wenn eine gespeicherte Antwort wieder angezeigt wird.
- **Tests:** Komma-Eingabe über den Ziffernblock mit den echten Items: „2,20“ und „4,55“ zählen als richtig, „2,2“ auch, ohne Punkttaste. Tests, die ein dünnes Gebiet oder die offenen Gebiete brauchen, lesen das jetzt aus dem Manifest (`tests/fixtures/content-state.ts`); vorher brachen sie, weil Batch 3 ein Gebiet öffnete.
- **Offen:** Batch-README nannte drei Komma-Items, es sind zwei (2,20 € und 4,55 €). In `gm-uhr-1` verdeckt der Minutenzeiger die „9“. Die Schriftregel „≥ 22 im viewBox“ passt nicht zu großen viewBoxen: Die Uhr (260 hoch) zeigt ihre Ziffern bei 144 px Bildhöhe mit etwa 12 px.
- **CI:** [CI #38292065730](https://github.com/1701/Pfadfinder/actions/runs/38292065730) grün (e9acff3…6eb2209), Workers Builds grün; 493 Tests, e2e 23 bestanden, 2 übersprungen (WebKit offline). Der e2e-Job braucht wegen des Layout-Tests über mehr Items jetzt 9,5 statt 6,5 min. Lokal grün: `npm run check`, `npm run e2e:chromium` (17/17).

## 2026-10-12 – App-Icon „Wegstriche“, nicht öffentlich, neues PWA-Kriterium
- **Gebaut:** Quelle `public/icon.svg` (Entwurf B3: drei Wegstriche bergauf, 16 % dick, 66 % breit, ganz in der maskable-Zone). `npm run icons` rendert daraus mit Playwright 180 (`apple-touch-icon`), 192, 512 und 512 maskable als RGB-PNG ohne Alpha (eigener Kodierer mit `node:zlib`, keine neue Dependency). Manifest mit Icons (`any`/`maskable`), `display: standalone`, `theme_color` Tinte, `background_color` Papier; `index.html` mit `apple-touch-icon`, SVG-Favicon, `theme-color`. Icons im Precache; `check-bundle` prüft Manifest und Precache und jetzt auch `/dev/karte`. `robots.txt` sperrt alles, dazu `noindex`. ARCHITECTURE §8: neues PWA-Kriterium.
- **Geprüft:** Live liefern alle vier PNGs `image/png` mit Farbtyp 2 (RGB), das Manifest hat `standalone`/Tinte/Papier. e2e `pwa.spec` in Chromium und WebKit grün.
- **Entscheidungen:** B3 statt B2: Bei 18 % Strichdicke passt die Treppe nur steil in die maskable-Zone und liest sich als Stapel. Das maskable-PNG ist dasselbe Bild wie das normale, weil der Grund vollflächig ist und das Motiv in der Zone liegt.
- **Offen:** iPad „Zum Home-Bildschirm“ und das Foto vom Homescreen (braucht Markus am Gerät). Danach ist das Kriterium „installierbar auf dem iPad“ erfüllt.
- **CI:** [CI #38272614311](https://github.com/1701/Pfadfinder/actions/runs/38272614311) grün (efba349), Workers Builds grün; 488 Tests, e2e 23 bestanden, 2 übersprungen (WebKit offline). Lokal grün: `npm run check`, `npm run e2e:chromium` (17/17).

## 2026-10-12 – Content: zahlen-operationen mit retired-Items
- **Eingespielt:** `zahlen-operationen.json` (von Markus ersetzt, nicht umgeschrieben): 15 neue Items, 7 auf `retired` gesetzt (nur `status` und `meta` geändert, keine ID entfernt). Aktiv sind 29 Items, Niveau 11/12/6; 20 davon haben einen Renderer. `content:validate` grün, Manifest neu erzeugt.
- **Geprüft:** `retired` wird schon überall ausgeschlossen: Manifest/Karte, `practiceableItems`, `pickNext` (auch fällige Fehlerkiste-Einträge), Einstiegscheck (`isCheckable`), Probetest-Validator, e2e-Helfer (Layout-Test). Attempts und Fehlerkiste-Einträge auf solche Items bleiben gespeichert, lesbar und importierbar; der Import prüft keine Item-IDs gegen den Content. Kein `fix:` nötig.
- **Ergänzt:** Zwei Tests, die das festhalten: eine Fehlerkiste mit einem stillgelegten Item, und ein Lernstand mit Attempts auf später stillgelegte Items (echter Content). Gegenprobe: Ohne die Filter schlagen drei Tests fehl.
- **Offen:** Fehlerkiste-Einträge auf stillgelegte Items bleiben dauerhaft fällig, aber unsichtbar. Sie stören nicht (kein Zähler zeigt sie), könnten aber im Eltern-Bereich auftauchen, sobald es ihn gibt.
- **CI:** [CI #38267759646](https://github.com/1701/Pfadfinder/actions/runs/38267759646) grün (7f40642…699dbc2), Workers Builds grün; 482 Tests, e2e 19 bestanden, 2 übersprungen (WebKit offline). Lokal grün: `npm run check`, `npm run e2e:chromium` (15/15).

## 2026-10-12 – Aufgabe 5c: Live-URL geprüft, Lighthouse
- **Geprüft:** https://pfadfinder.accounts-ea5.workers.dev/ liefert den aktuellen Build (Bundle-Hash wie lokal). Antworten und Header sind wie mit `wrangler dev`. Der Service Worker hat Scope `/`, 20 Einträge im Precache, offline laden Unterseite und Karte. Ein Push auf `main` war nach etwa 60 s live (`2e2c58e`).
- **Lighthouse 13.5:** Barrierefreiheit, Best Practices und SEO 100 (mobil und Desktop), Performance Desktop 100. Mobil schwankt sie zwischen 73 und 100 (erster Inhalt nach 1,5 s oder 4,4 s). Eine PWA-Kategorie gibt es nicht mehr.
- **Behoben:** `public/robots.txt`, weil der SPA-Fallback HTML lieferte (SEO 91 → 100). Die Karten-Namen „Formenund Raum“ passten nicht zum Link-Namen; jetzt steht ein Leerzeichen-Knoten zwischen den Zeilen, ein Test sichert das. `account_id` steht in `wrangler.jsonc`.
- **Offen:** `a6c3f89` hat Cloudflare nicht eigens gebaut (kein Workers-Builds-Check). Der nächste Push (`f1bed82`) hat ihn mitgebracht, der Namensfix ist live bestätigt. Icons für die Installierbarkeit fehlen weiterhin. Die Mobil-Performance ist unklar. SEO schwankt zwischen 91 und 100, wenn Lighthouse robots.txt nicht rechtzeitig abruft.
- **CI:** [CI #38263459386](https://github.com/1701/Pfadfinder/actions/runs/38263459386) grün (a6c3f89); 480 Tests, e2e grün. Lokal grün: `npm run check`.

## 2026-10-12 – Aufgabe 5c: Deployment über Cloudflare Workers Builds
- **Gebaut:** `wrangler.jsonc` (`pfadfinder`, `compatibility_date` 2026-09-26, Assets aus `dist/` mit SPA-Fallback, workers.dev und Vorschau-URLs). wrangler 4.142.0 als Dev-Dependency (in CLAUDE.md eingetragen), `npm run deploy:preview`. `docs/DEPLOY.md` beschreibt Ablauf, einmalige Einrichtung im Dashboard, wo die URL steht und wie man die Vorschau eines Branches findet. ARCHITECTURE §2 Hosting ist angepasst.
- **Geprüft (lokal mit `wrangler dev`, kein Deploy):** Router-Pfade liefern `index.html`. `sw.js` kommt als JavaScript, das Manifest als `application/manifest+json`, alles mit `max-age=0, must-revalidate`. Der Service Worker hat Scope `/` und steuert die Seite, der Precache hat 20 Einträge, offline lädt eine direkt aufgerufene Unterseite. `wrangler deploy --dry-run` liest 26 Dateien.
- **Entscheidungen:** Empfohlener Build-Befehl bei Cloudflare ist `npm run check`, weil Cloudflare nicht auf die GitHub-CI wartet. Fehlende Assets liefern wegen des SPA-Fallbacks `index.html` (200); das bleibt so, Begründung in DEPLOY.md §6.
- **Offen:** Das Repo ist noch nicht im Cloudflare-Dashboard verbunden, und hier ist niemand angemeldet; es gibt deshalb noch keinen Deploy und keine Live-URL. Lighthouse hat seit Version 12 keine PWA-Kategorie mehr (Konflikt mit ARCHITECTURE §8). Das Manifest hat keine Icons, die App ist damit nicht installierbar (seit Aufgabe 1 offen).
- **CI:** [CI #38259197020](https://github.com/1701/Pfadfinder/actions/runs/38259197020) grün (69f5043); 479 Tests, e2e 19 bestanden, 2 übersprungen (WebKit offline). Lokal grün: `npm run check`.

## 2026-10-12 – Namensschilder statt Halo, ein Ring für „hier bist du“
- **Gebaut:** Die Namen auf der Karte stehen auf einem abgerundeten Schild in Plateaufarbe (7 Einheiten Rand, keine Kontur). Das Schild unterbricht die Höhenlinien, den Halo gibt es nicht mehr. Die Größe wird an der Textbox gemessen (`getBBox`, erneut nach dem Laden der Schrift), in jsdom aus der Zeichenzahl geschätzt. Wegstriche im Item-Screen und im Tagesziel sprechen die Sprache der Karte: gefüllt = erledigt, Ring mit Abstand = hier bist du (auch nach dem Prüfen: gefüllt plus Ring).
- **Entscheidungen:** Der Abstand zwischen den Wegstrichen ist jetzt `xs` statt `2xs`, damit sich die Ringe nicht berühren. Dadurch passte die Kopfzeile der Karte bei 1024 px nicht mehr in eine Zeile (Namen 17,75 px; der Layout-Test schlug an). Im Tagesziel stehen die Striche deshalb quer über dem Text und hoch daneben.
- **Offen:** keine.
- **CI:** [CI #38256953028](https://github.com/1701/Pfadfinder/actions/runs/38256953028) grün (98fe8e3); 479 Tests, e2e 19 bestanden, 2 übersprungen (WebKit offline). Lokal grün: `npm run check`, `npm run e2e:chromium` (15/15).

## 2026-10-12 – Karte nachgeschärft, Schriftregel als Fehler
- **Gebaut:** Schrift unter 22 im SVG-viewBox ist ein Fehler im Validator (CONTENT_SCHEMA 1.0.5; die Gegenprobe bricht ab). Karte: innere Höhenlinien 1 px (`non-scaling-stroke`), Farbe `line`, runde Ecken; Konturen 24 und 44 statt 14 und 28. Der Marker des aktuellen Niveaus hat immer einen Ring, auch wenn die Etappe schon erreicht ist (gefüllt plus Ring). `rs-strategien` heißt „Schreibtricks“ (einzeilig).
- **Entscheidungen:** Füllung und Ring sind zwei getrennte Zeichen: die Füllung für „erreicht“, der Ring für „hier bist du“. Damit sieht der aktuelle offene Marker auf der Karte anders aus als der aktuelle Wegstrich im Item-Screen (dort Rand ohne Abstand). Der Name „Rechtschreib-Tricks“ aus Teil 0 ist damit ersetzt.
- **Offen:** Durch das kleinere Plateau ragen längere Namen in den Hang; der Halo in Plateaufarbe zeigt dort einen leichten hellen Schein (am deutlichsten bei „Zahlen und Rechnen“ quer). Erledigt durch die Namensschilder (Eintrag darüber).
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
