# tests/e2e

Playwright (ARCHITECTURE.md §8).

- `ueben.spec.ts`: Üben → 10 Items → Abschluss inkl. Fortsetzen nach Neuladen und Offline-Nutzung; Chromium und WebKit, iPad quer und hoch. Screenshots → `screenshots/`.
- `layout.spec.ts`: jedes übbare Item in jedem Zustand auf 1024×768, 768×1024, 1024×660 und 768×900 (Dev-Seite `/dev/item/:id`).

WebKit braucht Systembibliotheken, die Playwright nur für Ubuntu/Debian mitliefert (`npx playwright install --with-deps webkit`).
