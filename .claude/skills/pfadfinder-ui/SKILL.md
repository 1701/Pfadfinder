---
name: pfadfinder-ui
description: Design- und UX-Regeln für jede sichtbare Oberfläche in Pfadfinder (Screens, Komponenten, Karte, Probetest, Eltern-Bereich). Immer laden, wenn eine Aufgabe UI baut oder verändert.
---

# Pfadfinder UI

Du gestaltest für Kinder von 9 bis 10 Jahren, die sich auf einen Test vorbereiten, vor dem viele Angst haben. Jede Gestaltungsentscheidung dient zwei Zielen: Klarheit und Ruhe.

## Welt und Ton
- Welt: Expedition, Landkarte, Entdecken. Referenz ist ein gutes Kinder-Sachbuch, nicht eine Spiele-App.
- Ton: warm, ruhig, kompetent. Nicht niedlich, keine Comic-Augen, keine Konfetti, keine Ausrufezeichen-Ketten.
- Sprache in der UI: Deutsch, Du-Form, Sätze ≤ 2 pro Element, Wörter, die ein Neunjähriger kennt. Buttons sagen, was passiert: "Prüfen", "Weiter", "Nochmal", "Vorlesen".

## Tokens
- Alle Farben, Schriften, Abstände, Radien und Bewegungsdauern kommen aus `src/ui/theme/tokens.css`. Keine Hex-Werte, keine Pixelabstände in Komponenten.
- Palette: Karten-Tinte (tiefes Grün) für Text, kühles helles Papier als Grund, eine Signalfarbe für Markierung und Primärbutton, eine ruhige Farbe für "richtig", eine neutrale (nicht rote) für "noch nicht ganz". Kontrast WCAG AA überall.
- Schrift: Andika für alles Lesbare, Grundgröße 18 px. Eine zweite Familie nur für Überschriften und nur, wenn der Token-Plan sie begründet.
- Radien tragen Bedeutung: Interaktive Elemente runder als Flächen. Nicht ein Radius für alles.

## Vermeide generierte Defaults
- Creme-Hintergrund mit Terrakotta-Akzent; SaaS-Kartenraster mit identischem Schatten; All-Caps-Labels; "→" in Buttontexten; Gradient-Flächen als Dekoration; Zahlenmarker (01/02/03) ohne echte Reihenfolge; Einblend-Animation an jedem Element.
- Test: Würde diese Entscheidung bei jeder anderen Lern-App genauso herauskommen? Dann ist sie nicht spezifisch genug.

## Das eine merkenswerte Element
- Auf der Startseite: die Karte. Auf dem Item-Screen: der Moment der Prüfung (Feedback-Einblendung). Im Probetest: die ruhige Zeitanzeige. Alles andere bleibt still.
- Bewegung nur als Antwort auf eine Handlung des Kindes, ≤ 300 ms, `prefers-reduced-motion` respektieren.

## Item-Screen (fester Aufbau)
- Fortschritt oben, dezent, "3 von 10", keine Prozentzahl, kein Timer außerhalb des Probetests
- Aufgabe groß, max. 2 Zeilen, Vorlesen-Button daneben
- Antwortbereich mittig, eine Aufgabe pro Screen, kein Scrollen auf iPad quer (1024×768) und hoch (768×1024)
- Prüfen-Button unten rechts, ≥ 56 px hoch; Feedback erscheint inline und schiebt den Button nicht aus dem Bild
- Feedback: nie rotes X, nie "Falsch". "Noch nicht ganz" + Erklärung + Button "Weiter"

## Eingabe
- Touch-Ziele ≥ 48 px, Fokus sichtbar, jedes Bild mit `alt`
- Zahlen über den Ziffernblock, nie über die Systemtastatur; Komma nur bei `allowDecimal`, nie Punkt
- Optionen und Elemente werden deterministisch gemischt (Seed: itemId + attemptIndex)
- `mark-in-text` nutzt zwingend `splitUnits()` aus `src/domain/content/units.ts`

## Arbeitsweise bei UI-Aufgaben
1. Token-Plan oder Wireframe zuerst, gegen dieses Dokument prüfen, dann bauen.
2. Screenshots in beiden iPad-Formaten erzeugen und selbst kritisch ansehen, bevor du abgibst.
3. Kinder-UX-Checkliste aus `CLAUDE.md` im Abschlussbericht Punkt für Punkt bestätigen.
4. Zum Schluss ein Element entfernen, das nichts erklärt.
