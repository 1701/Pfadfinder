# DEPLOY.md – Auslieferung über Cloudflare Workers (Static Assets)

Pfadfinder ist eine reine Client-App: `dist/` wird als statische Assets eines Workers ausgeliefert, ohne Worker-Code. Cloudflare baut selbst, sobald auf GitHub gepusht wird (Workers Builds). Es gibt dafür keinen eigenen GitHub-Workflow; der bestehende CI-Workflow (Lint, Content, Tests, e2e) läuft unabhängig davon weiter.

## 1. Der Ablauf

| Ereignis | Was Cloudflare tut | Ergebnis |
|---|---|---|
| Push auf `main` | Build-Befehl, dann `npx wrangler deploy` | neue Produktionsversion unter der Live-URL |
| Push auf einen anderen Branch | Build-Befehl, dann `npx wrangler versions upload` | Vorschau-Version mit eigener URL, Produktion bleibt unverändert |
| `npm run deploy:preview` (lokal) | Build, dann `wrangler versions upload` | Vorschau-Version vom eigenen Rechner, braucht `npx wrangler login` |

Die Konfiguration steht in `wrangler.jsonc`:
- `assets.directory: "./dist"`: Es wird genau das ausgeliefert, was `npm run build` erzeugt.
- `not_found_handling: "single-page-application"`: Unbekannte Pfade liefern `index.html`. Dadurch funktionieren React-Router-Pfade wie `/ueben/mathe/zahlen-operationen` beim direkten Aufruf und beim Neuladen.

Die Node-Version für den Build kommt aus `.nvmrc`.

## 2. Einmalige Einrichtung im Cloudflare-Dashboard (Markus)

1. Workers & Pages → Erstellen → Repository importieren → GitHub `1701/Pfadfinder`. Der Projektname muss `pfadfinder` sein (wie `name` in `wrangler.jsonc`).
2. Build-Einstellungen:
   - Produktions-Branch: `main`
   - Build-Befehl: **`npm run check`** (empfohlen) oder `npm run build`
   - Deploy-Befehl: `npx wrangler deploy`
   - Builds für andere Branches: an. Deploy-Befehl dort: `npx wrangler versions upload`
3. Speichern; der erste Build startet mit dem nächsten Push.

Warum `npm run check` als Build-Befehl: Cloudflare wartet nicht auf die GitHub-CI. Mit `npm run check` laufen Lint, Content-Prüfung und Unit-Tests vor jedem Deploy (zusätzlich etwa eine Minute). Ein roter Stand geht dann nicht live. `npm run build` allein prüft nur Typen und Bundle.

## 3. Wo die URL steht

- **Produktion:** `https://pfadfinder.<konto-subdomain>.workers.dev`. Die Subdomain gehört zum Cloudflare-Konto. Sie steht im Dashboard unter Workers & Pages → pfadfinder → Einstellungen → Domains & Routen, und in der Ausgabe von `wrangler deploy` im Build-Log.
- Eine eigene Domain lässt sich später dort ergänzen; im Code ändert sich nichts, weil alle Pfade relativ zu `/` sind.

## 4. Vorschau eines Branches finden

- **GitHub:** Am Commit bzw. Pull Request erscheint der Check von Workers Builds; sein Link führt zum Build-Log mit der Vorschau-URL.
- **Dashboard:** Workers & Pages → pfadfinder → Bereitstellungen bzw. Versionen. Jede hochgeladene Version hat eine eigene Vorschau-URL der Form `https://<versions-präfix>-pfadfinder.<konto-subdomain>.workers.dev`.
- **Feste Branch-URL:** Cloudflare kann je Branch einen festen Alias vergeben (Form etwa `<branch>-pfadfinder.<konto-subdomain>.workers.dev`). Nach dem ersten Branch-Build prüfen und hier eintragen.

Vorschau-Versionen teilen sich nichts mit der Produktion außer dem Namen. Fortschritt liegt ohnehin nur im Browser (IndexedDB je Herkunft), also auch getrennt je URL.

## 5. Prüfen nach einem Deploy

Lokal lässt sich dieselbe Auslieferung mit `npm run build && npx wrangler dev` nachstellen (Port 8787). Stand 2026-10-12 geprüft:

- `/` und `/ueben/mathe/zahlen-operationen` liefern `index.html` (200).
- `/sw.js` und `/registerSW.js` kommen als JavaScript, `/manifest.webmanifest` als `application/manifest+json`, die Schriften als `font/woff2`.
- Alle Antworten tragen `Cache-Control: public, max-age=0, must-revalidate`. Der Browser fragt also jedes Mal nach, und ein neuer Service Worker wird sofort gefunden.
- Der Service Worker registriert sich mit Scope `/` und steuert die Seite nach dem Neuladen. Der Precache hat 20 Einträge. Offline lädt eine direkt aufgerufene Unterseite (`/ueben/…`).

Gegen die Live-URL: dieselben Punkte im Browser (DevTools → Anwendung → Manifest und Service Worker), danach Lighthouse.

## 6. Bekanntes Verhalten

- **Fehlende Dateien liefern `index.html` mit Status 200**, auch für Skripte (SPA-Fallback gilt für alle Anfragen). Normalfall: Nach einem Deploy liefert der alte Service Worker die alten Chunks aus seinem Precache, bis die neue Version übernimmt (`registerType: autoUpdate`). Nur ohne Service Worker (erster Besuch, gelöschte Website-Daten) und mitten in einem Deploy könnte ein alter Chunk als HTML ankommen; ein Neuladen behebt das. Falls das je auffällt: ein kleiner Worker mit `run_worker_first` für `/assets/*`, der bei fehlender Datei 404 liefert.
- **Keine Laufzeit-Netzwerkaufrufe:** Die App lädt nur ihre eigenen Assets (CLAUDE.md); der Worker hat keine Bindings.
