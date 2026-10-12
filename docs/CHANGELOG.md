# CHANGELOG

Format angelehnt an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/). Zwei Spuren: **App** (Code) und **Content-Schema** (`CONTENT_SCHEMA.md`). Jede Schema-Änderung braucht einen Versionssprung und einen Eintrag hier.

## Content-Schema

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
