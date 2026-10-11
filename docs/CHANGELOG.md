# CHANGELOG

Format angelehnt an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/). Zwei Spuren: **App** (Code) und **Content-Schema** (`CONTENT_SCHEMA.md`). Jede Schema-Änderung braucht einen Versionssprung und einen Eintrag hier.

## Content-Schema

### 1.0 – 2026-10-11
- Eingefroren für das MVP: Item mit 9 Formaten, ReadingText, Probetest, Dateistruktur unter `content/`.
- Umgesetzt als Zod-Schemas in `src/domain/content/schemas.ts`, geprüft durch `npm run content:validate`.

## App

### 0.1.0 – 2026-10-11
- Projektgerüst: Vite 5, React 18, TypeScript strict, Tailwind 3, Zustand, Dexie, Zod 4, vite-plugin-pwa, Vitest, Playwright, ESLint, Prettier.
- `src/domain/content`: Schemas, abgeleitete Typen, Integritätsprüfung, `ContentLoader`-Interface.
- `scripts/validate-content.ts`, `npm run check`, GitHub-Actions-CI, pre-commit-Hook für die Content-Validierung.
- `content/` mit den drei Beispiel-Items aus CONTENT_SCHEMA.md §8.
