# CHANGELOG

Format angelehnt an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/). Zwei Spuren: **App** (Code) und **Content-Schema** (`CONTENT_SCHEMA.md`). Jede Schema-Änderung braucht einen Versionssprung und einen Eintrag hier.

## Content-Schema

### 1.0.7 – 2026-10-13
- §7 Bilder: Bei `single-choice` mit Bild hat jede Option höchstens 24 Zeichen (zweispaltige Darstellung). Befund Batch 4: In Safari quer verdeckte die Rückmeldung einspaltige Optionen. Nur dokumentiert, der Validator prüft es nicht (Roadmap, PRODUCT §11).
- §7 Niveau: neuer Absatz „Kalibrierung Mathe (Pilot Oktober 2026)“ mit der Zuordnung I/II/III nach dem Stoff bis Ende Klasse 3. Präzisierung, keine Feldänderung.

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
