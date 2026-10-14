# tests/e2e

Playwright (ARCHITECTURE.md §8).

- `ueben.spec.ts`: Üben → 10 Items → Abschluss inkl. Fortsetzen nach Neuladen und Offline-Nutzung; Chromium und WebKit, iPad quer und hoch. Screenshots → `screenshots/`.
- `layout.spec.ts`: jedes aktive Item in jedem Zustand auf 1024×768, 768×1024, 1024×660 und 768×900 (Dev-Seite `/dev/item/:id`); meldet je Viewport alle Befunde auf einmal.
- `formate.spec.ts`: je neuem Format ein echtes Item gespielt (`/dev/item/:id?state=spielen`), Screenshots `format-*-vorher|nachher-*` in vier Viewports.
- `einstieg.spec.ts`, `eltern.spec.ts`, `pwa.spec.ts`; Layout-Specs `einstieg-layout`, `blatt-layout`, `karte`.

WebKit braucht Systembibliotheken, die Playwright nur für Ubuntu/Debian mitliefert (`npx playwright install --with-deps webkit`).
