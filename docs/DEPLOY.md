# DEPLOY.md – Auslieferung über Cloudflare Workers (Static Assets)

Pfadfinder ist eine reine Client-App: `dist/` wird als statische Assets eines Workers ausgeliefert, ohne Worker-Code. Cloudflare baut selbst, sobald auf GitHub gepusht wird (Workers Builds). Es gibt dafür keinen eigenen GitHub-Workflow; die GitHub-Workflows `CI` und `Layout` (Abschnitt 9) laufen unabhängig davon.

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

- **Produktion:** https://pfadfinder.accounts-ea5.workers.dev/ (Konto-Subdomain `accounts-ea5`, Account-ID in `wrangler.jsonc`). Sie steht auch im Dashboard unter Workers & Pages → pfadfinder → Einstellungen → Domains & Routen und in der Ausgabe von `wrangler deploy` im Build-Log.
- Eine eigene Domain lässt sich später dort ergänzen; im Code ändert sich nichts, weil alle Pfade relativ zu `/` sind.

## 4. Vorschau eines Branches finden

- **GitHub:** Am Commit bzw. Pull Request erscheint der Check von Workers Builds; sein Link führt zum Build-Log mit der Vorschau-URL.
- **Dashboard:** Workers & Pages → pfadfinder → Bereitstellungen bzw. Versionen. Jede hochgeladene Version hat eine eigene Vorschau-URL der Form `https://<versions-präfix>-pfadfinder.accounts-ea5.workers.dev`.
- **Feste Branch-URL:** Cloudflare kann je Branch einen festen Alias vergeben (Form etwa `<branch>-pfadfinder.accounts-ea5.workers.dev`). Nach dem ersten Branch-Build prüfen und hier eintragen.

Vorschau-Versionen teilen sich nichts mit der Produktion außer dem Namen. Fortschritt liegt ohnehin nur im Browser (IndexedDB je Herkunft), also auch getrennt je URL.

## 5. Prüfen nach einem Deploy

Lokal lässt sich dieselbe Auslieferung mit `npm run build && npx wrangler dev` nachstellen (Port 8787). Stand 2026-10-12 geprüft:

- `/` und `/ueben/mathe/zahlen-operationen` liefern `index.html` (200).
- `/sw.js` und `/registerSW.js` kommen als JavaScript, `/manifest.webmanifest` als `application/manifest+json`, die Schriften als `font/woff2`.
- Alle Antworten tragen `Cache-Control: public, max-age=0, must-revalidate`. Der Browser fragt also jedes Mal nach; ein neuer Service Worker wird gefunden, sobald die App nachfragt (Abschnitt 8).
- Der Service Worker registriert sich mit Scope `/` und steuert die Seite nach dem Neuladen. Der Precache hat 20 Einträge. Offline lädt eine direkt aufgerufene Unterseite (`/ueben/…`).

Gegen die Live-URL am 2026-10-12 (Stand `db8afaa`, Bundle-Hash identisch mit dem lokalen Build) dieselben Punkte: Antworten und Header wie oben. Der Service Worker hat Scope `/`, steuert die Seite und hat 20 Einträge im Precache. Offline laden `/ueben/mathe/raum-form` und die Karte.

**Lighthouse 13.5** (Chromium von Playwright, `npx lighthouse <url>` bzw. mit `--preset=desktop`), Stand `2e2c58e`:

| | Performance | Barrierefreiheit | Best Practices | SEO |
|---|---|---|---|---|
| Mobil (simuliertes langsames 4G, 4× CPU), 4 Läufe | 73, 98, 100, 74 | 100 | 100 | 100 |
| Desktop | 100 | 100 | 100 | 100 |

- Eine PWA-Kategorie gibt es seit Lighthouse 12 nicht mehr; Installierbarkeit muss anders geprüft werden.
- Mobil-Performance schwankt zwischen zwei Zuständen: erster Inhalt nach 1,5 s oder nach 4,4 s. Vermutung: Ob Cloudflare die Dateien an der Kante schon im Cache hat. Die Seite rendert erst nach dem JavaScript (88 kB gzip), und die beiden Andika-Schnitte (zusammen 582 kB) teilen sich die Bandbreite.
- SEO war vor `public/robots.txt` bei 91 (der SPA-Fallback lieferte HTML als robots.txt). Seitdem 100; vereinzelt 91, wenn Lighthouse beim Abruf von robots.txt in eine Zeitüberschreitung läuft (Datei kommt korrekt als `text/plain`, der nächste Lauf ist wieder 100).
- Barrierefreiheit 100. Die versteckte Regel `label-content-name-mismatch` schlug bei den Karten-Links an (sichtbarer Name „Formenund Raum“); behoben in `a6c3f89`, live bestätigt mit `f1bed82`.

## 6. Noch nicht öffentlich

Seit 2026-10-22 ist Pfadfinder für Suchmaschinen freigegeben: `public/robots.txt` erlaubt alles (`Allow: /`), das `noindex` in `index.html` ist entfernt. Eine Sitemap gibt es nicht (eine Seite, eine Adresse). Die Angaben in Impressum und Datenschutz (`src/ui/text/rechtliches.ts`) sind seit 2026-10-22 eingetragen.

Prüfliste vor der Veröffentlichung (Datenschutzerklärung, Aufgabe 10, Markus 2026-10-18):

- Cloudflare-Adresse in der Datenschutzerklärung stimmt noch (Cloudflare, Inc., 101 Townsend St., San Francisco, CA 94107, USA).
- Cloudflare steht noch als zertifiziert in der Liste des EU-US Data Privacy Framework.
- Der Vertrag zur Auftragsverarbeitung (DPA) ist im Cloudflare-Dashboard akzeptiert.
- Cloudflare Web Analytics ist für die Seite nicht aktiv. Sonst stimmen „kein Tracking“ und „Wir selbst haben keine Daten über dich oder dein Kind.“ nicht mehr.

## 7. Bekanntes Verhalten

- **Fehlende Dateien liefern `index.html` mit Status 200**, auch für Skripte (SPA-Fallback gilt für alle Anfragen). Normalfall: Nach einem Deploy liefert der alte Service Worker die alten Chunks aus seinem Precache, bis die neue Version übernimmt (auf Tipp, Abschnitt 8). Nur ohne Service Worker (erster Besuch, gelöschte Website-Daten) und mitten in einem Deploy könnte ein alter Chunk als HTML ankommen; ein Neuladen behebt das. Falls das je auffällt: ein kleiner Worker mit `run_worker_first` für `/assets/*`, der bei fehlender Datei 404 liefert.
- **Zwei Fenster:** Tippt jemand in einem Browser-Tab „Neu laden“, übernimmt der neue Service Worker auch für einen zweiten offenen Tab. Der lädt nicht neu (so gewollt), läuft aber mit dem alten Code weiter; braucht er danach einen Chunk, den er noch nicht geladen hatte, kommt der als HTML an, und ein Neuladen behebt das. Die App auf dem Home-Bildschirm hat nur ein Fenster.
- **Cache-Header von `sw.js` prüfen:** `curl -I https://pfadfinder.accounts-ea5.workers.dev/sw.js` muss `max-age=0, must-revalidate` zeigen (Stand 2026-10-18: `public, max-age=0, must-revalidate`, `cf-cache-status: HIT`, mit ETag). Ein `max-age` über 0 ohne `must-revalidate` würde neue Versionen verzögern.
- **Keine Laufzeit-Netzwerkaufrufe:** Die App lädt nur ihre eigenen Assets (CLAUDE.md); der Worker hat keine Bindings.

## 8. Updates der installierten App

Bis Aufgabe 11 stand `registerType: 'autoUpdate'` in `vite.config.ts`, hatte aber keine Wirkung: Mit `injectRegister: 'script'` setzt vite-plugin-pwa weder `skipWaiting` noch `clientsClaim`. Eine neue Version wartete, bis kein Fenster der App mehr offen war. Die App auf dem iPad-Home-Bildschirm wird meist nur angehalten, also kam eine neue Version erst nach mehreren echten Neustarts.

Seit Aufgabe 11 (`src/app/pwa-update.ts`):
- Die App registriert `/sw.js` selbst und ruft `registration.update()` beim Start und bei jeder Rückkehr in den Vordergrund (`visibilitychange`) auf.
- Ein neuer Service Worker installiert sich und wartet. Auf `/eltern` steht dann unten links neben der Kennung leise „Neue Version – Neu laden“, in der Zeile unter der Karte kurz „Neu laden“. Auf der Karte steht der Hinweis in jedem Viewport (die Zeile bleibt einreihig). Ein Tipp aktiviert ihn (`SKIP_WAITING`) und lädt neu, sobald er die Seite steuert.
- Von selbst lädt die App nie neu, also nie mitten in einer Runde oder einem Probetest. Ohne Tipp übernimmt die neue Version wie bisher, wenn die App ganz geschlossen war.
- `/eltern` zeigt die Build-Kennung, z. B. `Version d7f1924 · 18.10.2026` (kurzer Git-Hash, bei Cloudflare notfalls aus `WORKERS_CI_COMMIT_SHA`, und der Build-Tag in Europe/Berlin).
- `check-bundle.ts` prüft nach jedem Build: `sw.js` übernimmt nicht von selbst, kein `registerSW.js`, Kennung eingesetzt. `update.spec` (nur Chromium) baut eine zweite Version und spielt den Ablauf durch.

**Einmaliger Übergang:** Die Version vor Aufgabe 11 hat keine Update-Logik. Auf ein Gerät mit dieser alten Version kommt die neue nur auf die alte Art: App im App-Umschalter ganz schließen und neu öffnen (bei Bedarf zweimal). Danach gilt der Ablauf oben.

**Prüfschritt am iPad** (nach einem Deploy, wenn auf dem iPad schon eine Version ab Aufgabe 11 läuft):
1. Die App auf dem Home-Bildschirm öffnen. Sie hat keine Adresszeile; `/eltern` erreicht sie über Karte → „Impressum“ → „Für Eltern“. Kennung notieren. Safari hat auf dem iPad einen eigenen Speicher und einen eigenen Service Worker, `/eltern` in Safari zeigt die Version von Safari.
2. Einen neuen Stand auf `main` pushen und warten, bis Workers Builds grün ist.
3. Die App in den Hintergrund schicken und wieder holen (nicht neu starten). Nach wenigen Sekunden steht in der Zeile unter der Karte „Neu laden“.
4. Eine Runde beginnen, die App in den Hintergrund und zurück: kein Hinweis, kein Neuladen, die Runde läuft weiter.
5. Zur Karte, „Neu laden“ tippen: Die App lädt neu, der Hinweis ist weg, `/eltern` (über „Impressum“ → „Für Eltern“) zeigt die neue Kennung.
6. In der installierten App auf `/eltern` „Sicherung herunterladen“ tippen: Liefert iOS eine Datei (Teilen-Menü oder „In Dateien sichern“)? Ergebnis hier eintragen; ohne Datei braucht die Sicherung in der installierten App einen anderen Weg.
6b. Sicherung wieder einlesen (seit 2026-10-22): auf `/eltern` „Sicherung einlesen“ tippen, die Datei aus Schritt 6 wählen. Erwartet: Rückfrage „Ersetzt alles auf diesem Gerät. Weiter?“, nach „Einlesen“ die Karte mit dem Stand der Sicherung. Eine andere Datei (z. B. ein Foto, falls wählbar) ergibt „Das ist keine Pfadfinder-Sicherung.“ und ändert nichts.
7. Probetest-Liste zeigt Stand nach Update: Vor dem Update in der installierten App einen Probetest abgeben (oder einen schon abgegebenen nutzen). Nach „Neu laden“ Karte → „Probetest Mathe“ (bzw. „Probetest Deutsch“): Der Eintrag zeigt „gemacht“ (ohne Datum, seit 2026-10-22), die anderen „noch nicht gemacht“.

## 9. GitHub-CI und Screenshots

Zwei GitHub-Workflows laufen neben Workers Builds und liefern nichts aus.

| Workflow | Wann | Was | Dauer |
|---|---|---|---|
| `CI` (`.github/workflows/ci.yml`) | jeder Push auf `main`, jeder Pull Request, von Hand | drei parallele Jobs: `check` (Lint, Content-Prüfung, Unit-Tests, Build), `smoke` (Projekte `chromium-landscape`, `chromium-portrait`), `webkit` (Projekte `webkit-landscape`, `webkit-portrait`) | ~3 Min. |
| `Layout` (`.github/workflows/layout.yml`) | nur von Hand | Projekt `layout`: jedes Item, Probetest und Lesetext in vier Viewports | ~40 Min. |

- **Welcher Lauf welchen Status liefert:** `CI` sagt, ob ein Commit baut, die Tests besteht und den Üben-, Einstieg-, Eltern-, Probetest- und PWA-Ablauf in Chromium und WebKit schafft. Ob alles auf den Bildschirm passt, sagt nur das Layout-Projekt. Ein grünes `CI` heißt also nicht, dass das Layout geprüft ist; das Layout-Projekt läuft vor jedem UI- oder Content-Commit lokal (CLAUDE.md, DoD 1).
- **Ohne Lauf:** Änderungen nur an `docs/**`, Markdown-Dateien, `tests/e2e/screenshots/**` oder `.github/workflows/layout.yml` starten kein `CI`.
- **Nächtlicher Layout-Lauf ausgesetzt:** Der nächtliche Layout-Lauf ist ausgesetzt, solange das Repo privat ist (Actions-Minuten werden abgerechnet, ~40 Min. je Lauf auf dem 2-Kern-Runner); wird es öffentlich, `schedule: cron '0 1 * * *'` in `layout.yml` wieder aktivieren.
- **Warum nicht per Pfad:** Das Layout hängt auch an `src/domain` (z. B. `presentation`, Grenzen neben Lesetexten), `src/app`, `index.html`, den Schriften und den Paketen. Ein Pfadfilter auf `src/ui/**` und `content/**` hätte 27 von 219 Commits (8.–22.10.) mit Layout-Wirkung übersehen.
- **Layout von Hand starten** (nur wenn Markus es will, z. B. vor einem Release): `gh workflow run layout.yml --ref main`, danach `gh run list --workflow=layout.yml --limit 1` für den Link. Alternativ auf GitHub unter Actions → Layout → „Run workflow“.
- **Status lesen:** `gh run list --workflow=ci.yml --limit 1` (CLAUDE.md, DoD 3).
- **Artefakte:** Jeder E2E-Job lädt `tests/e2e/output/` hoch (gitignored), auch wenn ein Test rot ist: `e2e-output` (Chromium), `e2e-output-webkit`, `e2e-output-layout`. Darin liegen Screenshots, Budget-JSON und `report.json` mit der Dauer jedes Tests.
- **Caches:** `node_modules` (Schlüssel: `.nvmrc` und `package-lock.json`) und die Playwright-Browser (Schlüssel: Playwright-Version und Browser). Die Systempakete (apt) lädt jeder Job neu; hängt ein Spiegel, bricht der Install-Schritt nach 4 Min. ab und versucht es einmal neu (`.github/actions/setup`).
- **Kein dist-Artefakt:** `playwright.config.ts` baut im `webServer` selbst (`npm run build && npm run preview`, nie ein alter Server). Jeder E2E-Job baut also einmal, etwa 10 s.
- **Screenshots:** In CI ist `PFADFINDER_UPDATE_SCREENSHOTS` nie gesetzt. Die versionierten Bilder in `tests/e2e/screenshots/` ändern sich nur lokal, bei einer bewussten UI-Änderung (CLAUDE.md, Abschnitt „Screenshots“).
