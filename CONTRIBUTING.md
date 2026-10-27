# Beitragen

Ohne Technik: Aufgaben und Fehler per E-Mail an pfadfinder@steireif.de oder als Issue „Aufgabe vorschlagen“. Wir prüfen, passen bei Bedarf an und veröffentlichen unter CC BY-SA 4.0, auf Wunsch mit Nennung.

Mit Pull Request:

- Lies `docs/CONTENT_SCHEMA.md` (Aufgaben) oder `docs/ARCHITECTURE.md` (Code), bevor du anfängst.
- Neue Aufgaben: in die Datei des Fachs und Bereichs unter `content/items/<fach>/<bereich>.json`, IDs nach dem Vertrag, `npm run content:validate` grün, `content/manifest.json` und `content/typen.json` mit committen.
- Code: `npm run check` grün; UI-Änderungen zusätzlich mit den Playwright-Smoke-Projekten (siehe `CLAUDE.md`).
- Keine echten Prüfungsaufgaben, Testhefte oder Scans – auch nicht umformuliert. Das Repo ist öffentlich.
- Alles, was ein Kind sieht: Deutsch, Du-Form, kurze Sätze, nie „Falsch“, nie rotes X (`CLAUDE.md`, Kinder-UX-Checkliste).
- Commits nach Conventional Commits (`feat:`, `fix:`, `content:`, `docs:`, `chore:`).
