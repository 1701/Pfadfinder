# tests/e2e

Playwright (ARCHITECTURE.md §8).

- `ueben.spec.ts`: Üben → 10 Items → Abschluss inkl. Fortsetzen nach Neuladen und Offline-Nutzung; Chromium und WebKit, iPad quer und hoch. Screenshots → `screenshots/`.
- `layout.spec.ts`: jedes aktive Item in jedem Zustand auf 1024×768, 768×1024, 1024×660 und 768×900 (Dev-Seite `/dev/item/:id`); meldet je Viewport alle Befunde auf einmal.
- `formate.spec.ts`: je neuem Format ein echtes Item gespielt (`/dev/item/:id?state=spielen`), Screenshots `format-*-vorher|nachher-*` in vier Viewports.
- `probetest.spec.ts`: Start → 3 Items → Übersicht → springen → Abgeben → Auswertung → Durchsehen mit Selbsteinschätzung → Karte; Neuladen mittendrin; Zeitende per `page.clock`; Öffnen nach abgelaufener Zeit. Chromium und WebKit.
- `probetest-layout.spec.ts`: alle Probetest-Screens auf `/dev/probetest` in vier Viewports (CI: Safari-Viewports), jedes Item von mathe-01 beim Antworten und Durchsehen, Zeile auf der Karte, Druckansicht als `screenshots/probetest-druck.pdf` (nur Chromium). Zahlen in `screenshots/probetest-budget-*.json`.
- `einstieg.spec.ts`, `eltern.spec.ts`, `pwa.spec.ts`; Layout-Specs `einstieg-layout`, `blatt-layout`, `karte`.

WebKit braucht Systembibliotheken, die Playwright nur für Ubuntu/Debian mitliefert (`npx playwright install --with-deps webkit`).
