# CHANGELOG

Format angelehnt an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/). Zwei Spuren: **App** (Code) und **Content-Schema** (`CONTENT_SCHEMA.md`). Jede Schema-Änderung braucht einen Versionssprung und einen Eintrag hier.

## Content-Schema

### 1.0.13 – 2026-10-18
- §4.1/§4.2/§4.5/§4.9/§7 Deutsch: Grenzen für Items mit `stimulus.textRef`, festgelegt von Markus nach `text-inhalt-*.json` (`text-layout.spec`, Batch lesen-sachtext und Patches 1–2, vier Viewports) und der Fixture t-sach-900: `order` höchstens 4 Elemente zu je 30 Zeichen; `short-answer` `model` höchstens 90 Zeichen, höchstens 2 `keyPoints`, `feedback.incorrect` und `feedback.misconception` zusammen höchstens 150 Zeichen; `single-choice` mit zusätzlichem `stimulus.text` höchstens 3 Optionen; `multi-choice` mit 5 Optionen nur bei `prompt` bis 60 Zeichen. Befunde davor: d-lsa-2-004 mit 5 Elementen −14 px (hoch), d-lsa-3-001 mit 111 Zeichen und 3 Kernpunkten −8 px (hoch, vergleichen), d-lsa-3-002 mit 176 Zeichen Rückmeldung −20 px (Safari quer, noch nicht), d-lsa-2-003 mit 4 Optionen und Zitat 2 px, d-lsa-2-001 mit 5 Optionen und 99 Zeichen Prompt 17 px. Der Validator warnt nur (`WITH_TEXT`). Fixture t-sach-900 dafür gekürzt (d-lsa-2-951 Prompt 62 → 52, d-lsa-3-950 `model` 93 → 89 Zeichen). Keine Feldänderung, `schemaVersion` bleibt `"1.0"`.

### 1.0.12 – 2026-10-18
- §4.1/§4.2: Optionen von `single-choice` und `multi-choice` haben ein optionales Feld `readAloud` (nicht leer). Vorlesen liest es statt `text`, ohne es zu verändern; angezeigt und gedruckt wird weiter `text`. Befund d-rsl-2-001: „Flu_“, „Ku_“, „Nu_“ klingen vorgelesen wie offene Silben mit langem u und führen beim Hinhören zum ß. Der Validator lehnt `readAloud` an anderen Stellen (match, order, find-error) und leere Werte ab. Optionales Feld, jedes bisherige Item bleibt gültig, `schemaVersion` bleibt `"1.0"`.

### 1.0.11 – 2026-10-16
- §4.7/§7 Deutsch: `mark-in-text` mit `stimulus.textRef` hat in `payload.text` höchstens 4 Sätze und 200 Zeichen. Messung Aufgabe 9 (Fixture t-sach-900, Safari quer 1024 × 660, Textspalte 34 %): ein ganzer Absatz mit 5 Sätzen war der knappste Screen (18 px Luft, bei 36 % −6 px). Der Validator warnt (`MARK_IN_TEXT_WITH_TEXT`). Keine Feldänderung, `schemaVersion` bleibt `"1.0"`.

### 1.0.10 – 2026-10-16
- §5 `paragraphs`: „Absätze werden nummeriert; Items verweisen auf Absätze, nie auf Zeilen“ statt „Zeilen werden im Test nummeriert“. Grund: Der Lesetext steht in der App in einem Kasten, dessen Zeilenumbruch von Bildschirm und Ausrichtung abhängt; eine Zeilennummer wäre auf jedem Gerät eine andere. Die App zeigt die Absatznummer am linken Rand. Nur Doku, keine Feldänderung, `schemaVersion` bleibt `"1.0"`.

### 1.0.9 – 2026-10-15
- §6: Summe `estimatedSeconds` je Probetest für Mathe 24–32 Min. bei 18–24 Items statt 35–42 Min. Befund mathe-01: Der Pool hat im Mittel 65 s je Item, mathe-01 kommt auf 26,7 Min.; selbst die 24 längsten Items ergäben nur 39 Min. und verletzten den Niveau-Mix. Die `estimatedSeconds` sind App-Zeiten, das Papier rechnet mit Lesen und Schreiben. Der Timer bleibt 45 Min. Deutsch bleibt bei 35–42 Min., vorläufig, wird mit `deutsch-01` festgelegt. Der Validator prüft die Grenzen je Fach.
- §1: `manifest.json` nennt zusätzlich die Probetest-IDs je Fach (die Karte zeigt die Zeile „Probetest Mathe“ nur, wenn es einen gibt). Keine Feldänderung, `schemaVersion` bleibt `"1.0"`.

### 1.0.8 – 2026-10-14
- §7 Bilder: Die 24-Zeichen-Regel für Optionen bei Items mit Bild gilt für `single-choice` und `multi-choice`. Messung Aufgabe 7 an m-dz-2-007 (Tabelle unter dem Text, Safari quer, nach Prüfen): einspaltig mit 32–52 Zeichen −23 px, zweispaltig mit höchstens 24 Zeichen +89 px. Nur dokumentiert, der Validator prüft es nicht.
- §4.9: `solution.model` hat höchstens `payload.maxChars` Zeichen. Neu im Validator (Fehler). Befund Aufgabe 7: m-dz-3-003 hatte 133 Zeichen bei maxChars 80, mit daten-zufall v7 behoben. Keine Feldänderung, `schemaVersion` bleibt `"1.0"`.

### 1.0.7 – 2026-10-13
- §7 Bilder: Bei `single-choice` mit Bild hat jede Option höchstens 24 Zeichen (zweispaltige Darstellung). Befund Batch 4: In Safari quer verdeckte die Rückmeldung einspaltige Optionen. Nur dokumentiert, der Validator prüft es nicht (Roadmap, PRODUCT §11).
- §7 Niveau: neuer Absatz „Kalibrierung Mathe (Pilot Oktober 2026)“ mit der Zuordnung I/II/III nach dem Stoff bis Ende Klasse 3. Präzisierung, keine Feldänderung.
- §7 Niveau, Zeile II: „zwei Schritte, oder zwei Informationen aus Tabelle/Text/Bild verknüpfen“ statt „… Information aus Tabelle/Text/Bild zu holen“. Ein einzelner abgelesener Wert ist damit I, passend zur Kalibrierung Mathe.

### 1.0.6 – 2026-10-12
- §7 Bilder: Mindestschrift relativ zur viewBox statt fest: `font-size` ≥ viewBox-Höhe / 8 (vorher ≥ 22). Begründung: 144 px kleinste Bildhöhe × font / viewBox-Höhe ≥ 18 px. Eine 260 hohe Uhr braucht jetzt 32,5 statt 22. Keine Feldänderung.

### 1.0.5 – 2026-10-12
- §7 Bilder: Schrift unter 22 im viewBox ist jetzt ein Fehler statt einer Warnung. Keine Feldänderung.

### 1.0.4 – 2026-10-12
- §4.1/§4.2: optionales `payload.keepOrder` (boolean) für `single-choice` und `multi-choice`: Optionen, die Beschriftungen im Bild benennen, werden nicht gemischt. Alle bisherigen Items bleiben gültig, `schemaVersion` bleibt `"1.0"`; die Versionsregel im Kopf nennt solche optionalen Felder jetzt ausdrücklich als Patch.
- §7 Bilder: `assetAlt` verrät die Lösung nicht; Schrift in SVGs mindestens 22 im viewBox (Warnung im Validator).

### 1.0.3 – 2026-10-12
- §7 Bilder: Regeln für `content/assets/svg` (keine Skripte und Verweise, Farben nur `currentColor`, Schrift nur `inherit`), weil die App die SVGs inline einbettet. Der Validator prüft sie. Keine Feldänderung, `schemaVersion` bleibt `"1.0"`.

### 1.0.2 – 2026-10-12
- §1 Dateistruktur nennt `content/manifest.json`: erzeugt von `npm run content:validate`, nie von Hand bearbeitet, kein Teil des Item-Vertrags. Keine Feldänderung, `schemaVersion` bleibt `"1.0"`.

### 1.0.1 – 2026-10-11
- `multi-choice.minSelect` muss exakt der Anzahl richtiger Optionen entsprechen (vorher: höchstens so viele). Der Validator erzwingt die Gleichheit.
- Versionierung präzisiert: `schemaVersion` im Item und `content/schema-version.json` tragen nur `Major.Minor` und bleiben `"1.0"`; Patch-Versionen ändern keine Felder.

### 1.0 – 2026-10-11
- Eingefroren für das MVP: Item mit 9 Formaten, ReadingText, Probetest, Dateistruktur unter `content/`.
- Umgesetzt als Zod-Schemas in `src/domain/content/schemas.ts`, geprüft durch `npm run content:validate`.

## App

### 0.8.0 – 2026-10-16
- Lesetexte beim Üben und im Einstieg: Lese-Screen vor der ersten Aufgabe eines Textes, danach der Text im Kasten neben (quer) oder über (hoch) jeder Aufgabe, mit Absatznummern, eigenem Vorlesen und ruhigem Verlauf oben und unten. Die Aufgaben eines Textes bleiben zusammen, die Scrollposition bleibt.
- Einstieg: Lesen-Bereiche als Block aus einem Text. Fehlerkiste: Wiederholungen zeigen den Text ohne Lese-Screen.
- Content-Loader lädt Lesetexte je Bereich (über `kind`), offline im Precache.

### 0.7.1 – 2026-10-16
- Vorlesen wählt keine Stimme mehr, nur Deutsch: iOS nimmt die Stimme aus den Bedienungshilfen.
- Eltern-Seite: „Sicherung herunterladen“ speichert alle Daten als Datei (`pfadfinder-sicherung-JJJJ-MM-TT.json`).

### 0.7.0 – 2026-10-15
- Probetest: Zeile „Probetest Mathe“ auf der Karte, Intro, Aufgaben mit „Zurück“/„Weiter“ und ruhiger Zeitanzeige („Noch 5 Minuten“), Übersicht zum Springen, Abgeben mit Rückfrage, Auswertung je Bereich ohne Prozent, Durchsehen mit Selbsteinschätzung der Kurzantwort. Alles wird sofort gespeichert; Neuladen setzt fort, die Zeit läuft nach Wanduhr.
- Druckansicht `/probetest/:id/print`: Aufgabenblatt und Lösungsblatt, A4 hoch.
- Exportformat Version 2 (Probetest-Läufe mit Status und Entwürfen), v1-Dateien werden umgewandelt.

### 0.6.0 – 2026-10-14
- Renderer für alle neun Formate: Mehrfachwahl, Zuordnen (Tippen und Ziehen), Reihenfolge (Ziehen und Pfeile), Lückentext, Im Text markieren, Fehler finden, Kurzantwort mit Vergleichen und Selbsteinschätzung. dnd-kit nur in den Chunks von Zuordnen und Reihenfolge.
- Vorlesen liest die Antworten in der Reihenfolge auf dem Bildschirm.

### 0.5.0 – 2026-10-12
- Startseite ist die Expeditionskarte: 9 Gebiete auf zwei Inseln, Höhenstufen als Etappen, unerforschte Gebiete gestrichelt; zwei Layouts für quer und hoch. Tagesziel mit Wegstrichen. Liste unter `/?liste`.
- Entdeckungen je erreichter Etappe in `Collectibles`; Abschluss-Screen zählt wie die Karte.
- Aufgabenbilder (SVG) inline im Aufgabenblatt.

### 0.4.0 – 2026-10-11
- Design-Tokens nach Token-Plan v1 (Kartentinte, kühles Papier, Wegmarken-Gelb, Seeblau, Felsgrau); Tailwind-Standardpalette entfernt.
- Andika 7.000 (SIL, OFL) selbst gehostet unter `public/fonts/andika/`, im Precache.
- Router (React Router 8), Entwicklerseite `/dev/tokens` nur im Dev-Build; `scripts/check-bundle.ts` prüft das nach jedem Build.
- `npm run screenshots` für iPad quer und hoch.

### 0.3.0 – 2026-10-11
- React 19 und React Router 8 (Library-Modus); `@dnd-kit` erlaubt React ≥ 16.8.
- Content: `items/mathe/zahlen-operationen.json` mit 21 Items (Pilot-Batch).

### 0.2.0 – 2026-10-11
- Upgrade: Vite 8, React Router 7 (statt `react-router-dom` 6), Tailwind 4 CSS-first mit `@tailwindcss/vite` (ersetzt PostCSS/Autoprefixer und `tailwind.config.ts`), Vitest 5, Playwright 1.63. vite-plugin-pwa bleibt 1.3 (2.0 ist jünger als 14 Tage).
- `.npmrc` mit `min-release-age=14`; `npm audit --omit=dev`: 0 Lücken.

### 0.1.0 – 2026-10-11
- Projektgerüst: Vite 5, React 18, TypeScript strict, Tailwind 3, Zustand, Dexie, Zod 4, vite-plugin-pwa, Vitest, Playwright, ESLint, Prettier.
- `src/domain/content`: Schemas, abgeleitete Typen, Integritätsprüfung, `ContentLoader`-Interface.
- `scripts/validate-content.ts`, `npm run check`, GitHub-Actions-CI, pre-commit-Hook für die Content-Validierung.
- `content/` mit den drei Beispiel-Items aus CONTENT_SCHEMA.md §8.
