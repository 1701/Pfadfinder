# PRODUCT.md – Übungsplattform zur Vorbereitung auf Kompass 4 (BW)

Arbeitstitel: **Pfadfinder** (vor Release auf Namenskollisionen prüfen; "Kompass" nie im Produktnamen, das ist der amtliche Test)
Status: v0.2 (Entscheidungen eingearbeitet) · Stand 2026-10-11 · Owner: Markus

Dieses Dokument ist die fachliche Wahrheit für das Projekt. Jeder Prompt an Claude Code und jedes Review bezieht sich hierauf. Technik steht in `ARCHITECTURE.md`, das Item-Format in `CONTENT_SCHEMA.md`, Arbeitsregeln für den Agenten in `CLAUDE.md`.

---

## 1. Problem und Vision

**Problem.** Rund 100.000 Viertklässler in Baden-Württemberg schreiben jährlich im November "Kompass 4" (je 45 Min. Deutsch und Mathematik, Papier). Der Test ist Teil der Grundschulempfehlung und eröffnet einen zweiten Weg aufs Gymnasium. Der erste Durchgang 2024 war so schwer, dass 86 % in Mathe nur "grundlegendes Niveau" erreichten; seitdem ist der Test für Kinder und Eltern angstbesetzt. Der Test lässt sich nicht "auswendig lernen" (jährlich neue Aufgaben), aber Aufgabenformate, Zeitgefühl, Lesestrategien und Prüfungsroutine lassen sich trainieren – genau das fehlt als kindgerechtes, kostenloses Angebot.

**Vision.** Ein Kind öffnet die App, übt 10–15 Minuten, versteht danach etwas besser als vorher, und geht mit weniger Angst in den Test. Eltern sehen, wo ihr Kind steht, ohne Druck aufzubauen.

**Leitsatz.** Vertrautheit statt Drill. Können sichtbar machen statt Fehler zählen.

## 2. Was wir wissen (Faktenbasis)

| Fakt | Konsequenz fürs Produkt |
|---|---|
| Je Fach 45 Min., Papier, handschriftlich | Probetest-Modus braucht Timer **und** Druckversion |
| Deutsch: Lesen + Rechtschreibung; Mathe: nach Bildungsplan BW / IQB-Bildungsstandards | Kompetenzlandkarte folgt den IQB-Leitideen, nicht Schulbuchkapiteln |
| Niveauschwellen: E-Niveau ≥ 75 %, M-Niveau ≥ 50 % (Durchschnitt beider Fächer) | Mastery-Schwellen der App = exakt diese Werte |
| Originalaufgaben Mathe 2024 öffentlich (Quelle IBBW); IQB- und VERA-3-Beispielaufgaben öffentlich mit Lösungen | Kalibrierungsanker für Format, Sprache, Schwierigkeit |
| Amtliche Haltung: "ohne gezielte Vorbereitung" | Wir trainieren Kompetenzen und Formate, nie "die Fragen" – das steht auch so in der App |
| Kritik 2024: Aufgaben sprachlich zu anspruchsvoll, Zeit zu knapp | Vorlesefunktion für Mathe-Aufgaben; Zeittraining nur im Probetest, nie beim Üben |
| TestHelden bietet bereits Kompass-4-Vorbereitung (PDF, kostenpflichtig) | Differenzierung: kostenlos, adaptiv, kindgerechte UX, kein Login |

**ANNAHME (zu verifizieren):** Testtermin 2026 liegt wie 2025 in der 3. Novemberwoche. Daraus folgt Deadline MVP: **Ende Woche 4 (ca. 8. Nov 2026)**, Woche 5 Puffer.

## 3. Zielgruppen

**Primär: das Kind (9–10 Jahre).** Liest unterschiedlich sicher, Aufmerksamkeitsspanne 10–20 Min., nutzt Tablet oder Eltern-Laptop, tippt ungern, will sofort wissen, ob es richtig war. Drei Ausgangslagen:
- *Entdeckerin* (sicher, E-Niveau in Reichweite): will Herausforderung, langweilt sich bei Wiederholung.
- *Nachzügler* (unsicher, M/G-Niveau): braucht Erfolgserlebnisse früh, sonst Abbruch nach 3 Minuten.
- *Ängstliche* (Niveau egal): hat Angst vor dem Test selbst; braucht Vorhersehbarkeit und Ritual.

**Sekundär: das Elternteil.** Will wissen "wo steht mein Kind", will Prüfungsangst nicht verstärken, hat keine Zeit für Setup.

**Später: Lehrkraft** (Roadmap, nicht MVP).

## 4. Nicht-Ziele (MVP)

- Kein Login, keine Accounts, keine Server-Datenhaltung
- Keine Werbung, keine Paywall, kein Tracking
- Keine Schreibaufgaben mit automatischer Bewertung (Freitext nur mit Musterlösung zur Selbstkontrolle)
- Keine Ranglisten / kein Vergleich mit anderen Kindern
- Keine Prognose "dein Kind kommt aufs Gymnasium" – nur Einordnung pro Kompetenzbereich
- Keine weiteren Bundesländer, kein Content-Editor, keine Mehrsprachigkeit

## 5. Lernmodell

### 5.1 Kompetenzlandkarte

Jedes Item ist genau einem **Bereich** zugeordnet. Bereiche sind das Rückgrat von Adaptivität, Fortschrittsanzeige und Content-Planung.

**Mathematik** (IQB-Leitideen)
1. Zahlen und Operationen (Stellenwert, Kopfrechnen, schriftliche Verfahren, Überschlag, Sachaufgaben)
2. Raum und Form (Figuren, Symmetrie, Lagebeziehungen, Würfelnetze, Flächen/Umfang anschaulich)
3. Größen und Messen (Geld, Zeit, Länge, Gewicht, Umrechnen, Sachsituationen)
4. Daten, Häufigkeit, Wahrscheinlichkeit (Tabellen, Diagramme lesen, "sicher/möglich/unmöglich")
5. Muster und Strukturen (Zahlenfolgen, Rechengesetze, Terme fortsetzen)

**Deutsch**
1. Lesen – Sachtext (Informationen entnehmen, Textsorte erkennen)
2. Lesen – literarischer Text (Figuren, Handlung, Schlussfolgern, Wirkung)
3. Rechtschreibung – Laut-Buchstaben (Dehnung, Doppelkonsonant, s-Laute, Auslautverhärtung)
4. Rechtschreibung – Strategien (Groß-/Kleinschreibung, Wortbausteine, Ableiten/Verlängern, Fehler finden)
5. Sprache untersuchen (Wortarten, Satzglieder, Zeitformen), auf der Karte „Wörter und Sätze“ – im MVP seit 2026-10-25 (vorher v1.1). Grund: Im Kompass-4-Deutsch-Test 2025 sind Aufgabe 14–24 (11 von 24) Sprache untersuchen. Im Probetest ist der Bereich noch nicht Pflicht, bis die Deutsch-Probetests neu gemischt sind (CONTENT_SCHEMA §6)

### 5.2 Anforderungsniveaus

Jedes Item hat ein Niveau nach IQB-Logik:
- **I – Reproduzieren**: bekanntes Verfahren direkt anwenden
- **II – Zusammenhänge herstellen**: mehrschrittig, Information aus Text/Tabelle holen und verarbeiten
- **III – Verallgemeinern/Reflektieren**: begründen, Fehler in fremder Lösung finden, Strategie übertragen

Zielverteilung im Pool und im Probetest: **40 % I / 40 % II / 20 % III**. (Kalibrierung gegen Originalaufgaben 2024 und IQB-Beispiele; wird nach dem Papier-Pilot mit Tochter angepasst.)

### 5.3 Aufgabenformate

Nur Formate, die im Papiertest tatsächlich vorkommen oder deren Denkweise trainieren:

| Format | Eingabe | Auto-Check |
|---|---|---|
| Einfachwahl (MC) | Tap | ja |
| Mehrfachwahl | Tap | ja |
| Zahleneingabe | Ziffernblock (kein Tastaturzwang) | ja |
| Zuordnen | Drag oder Tap-Tap | ja |
| Reihenfolge | Drag | ja |
| Lückentext (Auswahl) | Tap | ja |
| Im Text markieren (Wort/Satz) | Tap | ja |
| Fehler finden (Rechtschreibung) | Tap aufs falsche Wort | ja |
| Kurzantwort / Begründung | Freitext | **nein** – "Vergleichen" zeigt Musterlösung und Kernpunkte, dann "Hast du es getroffen?" Getroffen / Teils / Noch nicht |

Kein Format darf Tippen auf einer Volltastatur erfordern, außer Kurzantwort.

### 5.4 Modi

1. **Einstiegscheck** (einmalig und freiwillig je Fach, Mathe ~15 Min., Deutsch ~15 Min. mit zwei Lesetexten): bestimmt das Startniveau je Bereich; nur Formate mit Auto-Check, keine Kurzantwort. Rahmung (seit 2026-10-19): Intro "Wir erkunden Mathe." (bzw. "Deutsch.") mit "Ein paar Aufgaben zeigen, wo du startest. Das dauert etwa 15 Minuten." (beide Fächer; Mathe seit Aufgabe 15, vorher 10) – nie "Test". Festlegungen (2026-10-14):
   - *Angebot:* auf der Karte, solange das Fach keinen Mastery-Stand hat und mindestens 2 übbare Bereiche besitzt (Deutsch seit 2026-10-18 mit den beiden Rechtschreib-Bereichen). Angeboten wird immer nur ein Fach, das erste ohne Mastery-Stand (Mathe vor Deutsch). "Unerforscht: Mathe" bzw. "Unerforscht: Deutsch" ist dann die Überschrift der Karte, mit "Erkunden" (gelb) und "Später" daneben; Vorlesen liest Überschrift und Knopf ("Unerforscht: Mathe. Tippe auf Erkunden, oder wähle gleich ein Gebiet: …", ohne offene Gebiete ohne Nebensatz). Angebot und Intro nennen immer das Fach, auch beim ersten (seit 2026-10-18). Die Überschrift ist kurz, weil die Kopfzeile hoch in eine Reihe passen muss (gemessen 2026-10-19, Zeilenende Mathe/Deutsch bei 768 px Breite: "Mathe ist noch unerforscht." 824/849 px, mit kleinerem Abstand 812/837, "Noch unerforscht: Mathe" 768/793, "Unerforscht: Mathe" 686/711, mit normalem Abstand 698/723; vorher "Wo geht’s in Mathe los?"). Gestrichelte Gebiete ohne Aufgaben heißen für Screenreader "…, noch keine Aufgaben" (seit 2026-10-19), damit "unerforscht" nur das Angebot meint; das Tagesziel tritt so lange zurück (eine eigene Zeile hätte die Gebietsnamen in Safari unter 18 px gedrückt). Das Angebot erscheint nur, solange heute noch kein Fundstück gezählt ist: Die Tagesziel-Zeile wird nie durch ein Angebot ersetzt, ein erreichtes Tagesziel lässt das Angebot bis zum nächsten Tag ruhen (seit 2026-10-18). Höchstens ein Angebot pro Tag (seit 2026-10-18, Markus): "Später" gilt für den Tag, nicht für das Fach, und auch ein beendeter Einstieg verbraucht das Angebot des Tages; das nächste Fach kommt am nächsten Tag. Begründung: Ein Angebot ist eine neue Sache pro Tag, ein Einstieg ist eine ganze Sitzung. Ein abgebrochener Einstieg verbraucht nichts. Der Tag endet um Mitternacht (lokale Zeit, dieselbe Grenze wie beim Fortsetzen einer Übungsrunde), auch über Neuladen hinweg; am nächsten Tag ist das Angebot wieder da (seit 2026-10-14, vorher bis zum nächsten Öffnen der App). Läuft eine Übungsrunde über Mitternacht, gilt der Tag bis zu ihrem Ende weiter (seit 2026-10-18). Wer den Check schon gemacht oder im Fach geübt hat, sieht unter `/einstieg/…` nur "Deine Reise hat schon begonnen."
   - *Umfang:* nur übbare Bereiche, je 2–3 Items, höchstens 15 je Fach (3 je Bereich bei 5 Bereichen; Mathe seit Aufgabe 15, Deutsch seit 2026-10-25 mit Sprache untersuchen, vorher je 12). Erwartete Dauer Deutsch mit 15 Plätzen: etwa 17 Minuten (Mittel `estimatedSeconds` je Bereich × 3 plus zwei Texte zum Lesen, Rechnung 2026-10-25). Runde 1 und 2 gehen reihum über alle Bereiche; ein dritter Platz geht zuerst an Bereiche mit einer richtigen und einer falschen Antwort, gekürzt würde bei zweimal gleich beantworteten.
   - *Ablauf:* Item-Niveau 1 → 2 → 3 (richtig: hoch, falsch: bleibt). Kein Richtig/Falsch, nach jeder Antwort nur "Weiter". "Pause" fragt nach ("Wenn du jetzt gehst, fangen wir nächstes Mal von vorn an.", "Zur Karte" links, "Weitermachen" rechts); wer dann geht, beginnt beim nächsten Mal von vorn, nichts wird gespeichert. Das Wort "Check" steht nirgends in der UI.
   - *Ergebnis:* Startniveau = höchstes Niveau mit einer richtigen Antwort, mindestens 1 (ein zu niedriger Start korrigiert sich beim Üben, ein zu hoher schreibt Entdeckungen, die bleiben). Jede Etappe unter dem Startniveau wird Entdeckung. Der Check füllt weder Fehlerkiste noch Tagesziel. Ergebnis-Screen: die Insel des Fachs, "Deine Reise beginnt hier", keine Zahlen, keine Prozent.
   - Bereiche, die erst später Content bekommen, starten auf Niveau 1.
2. **Üben** (Kern): Kind wählt Bereich (oder "Überrasch mich"), bekommt Items auf aktuellem Niveau, sofortiges Feedback, Erklärung. Session-Ziel: 8–10 Items, dann Pause-Vorschlag. Wer heute schon im Gebiet war und die Runde nicht beendet hat, wählt beim Betreten "Fortsetzen" oder "Neu anfangen" (ohne Rückfrage: Antworten, Tagesziel, Niveau und Entdeckungen bleiben, nur die Zählung "x von 10" beginnt neu).
   - *Lesetexte* (Festlegungen 2026-10-16): Keine Scroll-Seite, nur der Textkasten scrollt: quer als linke Spalte, hoch als Block oben mit fester Höhe je Aufgabenformat. Absätze stehen mit Nummer am linken Rand, Aufgaben verweisen auf Absätze, nie auf Zeilen. Ein ruhiger Verlauf am unteren Rand zeigt, dass es weitergeht, am oberen, dass schon gescrollt ist. Vor der ersten Aufgabe eines Textes in einer Runde kommt ein Lese-Screen („Lies den Text.“, Titel, der ganze Text, Vorlesen, gelb „Weiter“); der Titel steht nur dort. Die Aufgaben eines Textes kommen hintereinander, erst danach ein anderer Text; der Kasten behält dabei seine Scrollposition. Der Kasten hat einen eigenen Vorlesen-Knopf (nur wenn der Text es erlaubt); der Vorlesen-Knopf der Aufgabe liest nie den Text. Wiederholungen aus der Fehlerkiste zeigen den Text ohne Lese-Screen. Im Einstieg kommen die 2–3 Aufgaben eines Lesen-Bereichs aus einem Text, als Block. Im Probetest ist Vorlesen für Lesetexte aus.
3. **Fehlerkiste**: falsch beantwortete Items kommen nach 1 Tag und nach 3 Tagen wieder (einfaches Intervall, kein SRS-Algorithmus im MVP).
4. **Probetest**: 45 Min., Timer, gemischte Bereiche, Niveau-Verteilung wie Original, am Ende Auswertung pro Bereich. Zusätzlich **als PDF druckbar** (Aufgaben + separates Lösungsblatt), weil der echte Test auf Papier stattfindet. Empfehlung in der App: höchstens 2 Probetests pro Woche. Festlegungen (2026-10-15):
   - *Einstieg:* eine ruhige Zeile „Probetest Mathe“ links in der Zeile unter der Karte, nur wenn es einen Probetest gibt (quer direkt unter der Insel; hoch ist zwischen den Inseln kein Platz für 48 px, Messung 2026-10-15). Intro: „45 Minuten, wie in der Schule. Du kannst vor und zurück.“ mit Vorlesen und „Starten“. Nach einem abgegebenen Lauf zusätzlich „Du hast diesen Probetest schon gemacht.“ und leise „Auswertung ansehen“ (dort kann die Selbsteinschätzung nachgeholt werden). Ein zweiter Durchlauf ist erlaubt.
   - *Zeit:* verbleibende Minuten rechts im Kopf, ohne Sekunden, kein Rot, keine Animation; ab 5 Minuten ersetzt „Noch 5 Minuten“ … „Noch 1 Minute“ die Anzeige. Die Zeit läuft nach Wanduhr ab Start, auch über Neuladen und Hintergrund. Endet sie, während die App genutzt wird, folgt die Auswertung; war die App weg, ist der Lauf ohne Auswertung vorbei und das Intro zeigt sich normal. Keine Pause.
   - *Ablauf:* kein Feedback, kein Band, keine „Falle“. Jedes Item hat „Zurück“ und „Weiter“, der Kopf links leise „Übersicht“, mittig „7 von 24“. „Weiter“ beim letzten Item führt in die Übersicht (Wegstriche antippbar, beantwortet/offen, Ring an der Aufgabe, von der das Kind kommt). Im Band links „Weitermachen“ (zurück zu dieser Aufgabe), rechts „Abgeben“; gelb ist „Weitermachen“, solange Aufgaben offen sind, sonst „Abgeben“. Die Rückfrage bei offenen Items („Noch N Aufgaben sind offen.“) bietet „Abgeben“ und gelb „Weitermachen“ (zurück in die Übersicht). „Zur Karte“ in der Übersicht fragt „Dann ist der Probetest vorbei.“ und bricht ab. Kurzantworten werden nur eingegeben. Vorlesen ist in Mathe an; Deutsch schaltet es für Lesetexte ab.
   - *Auswertung:* je Bereich „gelöst von gesamt“ als Wegstriche und Zahl, darunter gesamt; kein Prozent, keine Note, kein Vergleich. Offene Items zählen als nicht gelöst. Eingetragene Kurzantworten erscheinen als gestrichelter Strich (wie unerforschte Gebiete), darunter die Legende „gestrichelt: noch nicht verglichen“ und ein leiser Knopf „N Antworten vergleichen“ (seit Aufgabe 11), der nur die wartenden Kurzantworten durchsehen lässt; nach der letzten Einschätzung führt „Zur Auswertung“ (gelb) zurück; nach der Selbsteinschätzung zählt „Getroffen“ als gelöst, „Teils“ und „Noch nicht“ nicht. „Durchsehen“ zeigt jedes Item mit eigener Antwort, Lösung und dem normalen Band inkl. „Falle“, mit „Zurück“ links neben „Weiter“ (nicht beim ersten Item) und leise „Zur Auswertung“ oben links, „Übersicht“ oben rechts. Die Übersicht im Durchsehen zeigt alle Striche (gelöst gefüllt, wartend gestrichelt, sonst leer, Legende nur für die ersten beiden); ein Tipp springt hin und beendet den Filter, „Weiter durchsehen“ kehrt zurück. Ein Item ohne Antwort zeigt „Hier fehlt deine Antwort.“ und die Erklärung, ohne „Falle“.
   - Probetest-Antworten verändern weder Niveau noch Fehlerkiste noch Tagesziel.
   - *Druck:* `/probetest/:id/print`, nur per Adresse, kein Link auf Kinder-Screens: Aufgabenblatt wie ein Papiertest (Zahlenaufgaben mit etwa 4 cm Rechenplatz vor dem Ergebniskästchen), Lösungsblatt auf eigener Seite, A4 hoch.

### 5.5 Adaptivität (MVP-Variante, bewusst simpel)

Pro Bereich und Fach ein **Mastery-Score** = Trefferquote der letzten 8 Items dieses Bereichs.
- ≥ 75 % → Niveau steigt (I→II→III); bei III und ≥ 75 %: Bereich gilt als "gemeistert"
- < 50 % → Niveau sinkt (nie unter I)
- dazwischen → bleibt

Präzisierungen (2026-10-11): Eine Selbsteinschätzung "teils" zählt 0,5. Entschieden wird erst ab 6 Einträgen im Fenster. Nach einem Niveauwechsel wird das Fenster geleert. "Gemeistert" wird nie zurückgesetzt, auch nicht, wenn das Niveau später wieder sinkt. Einstiegscheck und Probetest verändern das Fenster nicht.

Die Schwellen sind absichtlich identisch mit den Kompass-Niveaugrenzen. Kein IRT, keine Item-Parameter im MVP – Erweiterungspunkt für später (siehe Roadmap).

### 5.6 Feedback-Design

- Richtig: kurze Bestätigung, bei Niveau II/III zusätzlich "so geht's auch" (alternativer Lösungsweg)
- Falsch: nie rotes X, nie "Falsch!". Stattdessen "Noch nicht ganz" + Erklärung in Kindersprache (max. 3 Sätze) + häufiger Denkfehler benannt ("Viele vergessen hier den Übertrag"). Der Denkfehler steht hinter dem Tipp „Falle" im Band und wird beim Vorlesen immer mitgelesen.
- Kurzantwort (seit 2026-10-14): Die App urteilt nicht. Nach der Selbsteinschätzung zeigt das Band keine Überschrift, bei "Getroffen" die Bestätigung des Items, bei "Teils" und "Noch nicht" die Erklärung und "Falle".
- Fehler finden: Das Band nennt die richtige Schreibung ("So schreibt man es: Samstag"), auch wenn das Kind den Fehler gefunden hat.
- Jede Erklärung ist Teil des Items (siehe `CONTENT_SCHEMA.md`), nicht generisch

## 6. Gamification-Prinzipien

Metapher: **Pfadfinder-Expedition.** Die Kompetenzlandkarte ist eine Karte mit 10 Gebieten (5 Mathe, 5 Deutsch; seit 2026-10-25, vorher 9). Jedes Gebiet hat drei Etappen (= Niveaus). Gemeisterte Etappen werden sichtbar "erschlossen".

**Tun**
- Fortschritt als Fläche auf der Karte, nicht als Prozentzahl
- Sammelobjekte pro erschlossener Etappe (**Entdeckungen**), rein dekorativ
- Tagesziel klein und fix: "10 Fundstücke" = 10 bearbeitete Items ≈ 10–15 Min. Eine Runde über Mitternacht zählt ganz für den Tag, an dem sie begann (seit 2026-10-18). Bis zum allerersten Fundstück sagt die Karte im Tagesziel, wofür sie da sind: "Jede Aufgabe, die du übst, bringt dir ein Fundstück." (seit Aufgabe 17, iPad-Befund: Das Kind verstand die Striche, nicht ihren Sinn). (Begriffe seit 2026-10-11: Fundstück = bearbeitetes Item, Entdeckung = Sammelobjekt einer Etappe)
- Streak mit automatischem Freeze (ein verpasster Tag bricht nichts)
- Session endet immer mit etwas Positivem ("Heute 3 Gebiete besucht")

**Lassen**
- Keine Ranglisten, keine Vergleiche, keine Abzüge, keine Countdown-Timer beim Üben
- Kein Lootbox-/Zufallsmechanismus
- Keine Push-Nachrichten, keine Gilt-nur-heute-Belohnungen

Begründung: Zielgruppe ist angstbesetzt; Wettbewerbsmechaniken erhöhen bei unsicheren Kindern die Abbruchquote. Mastery-Sichtbarkeit und kleine, sichere Erfolge sind die belegten Motivatoren in dieser Altersgruppe.

## 7. Kinder-UX-Prinzipien

- Tablet-first (Hoch- und Querformat), Laptop zweitrangig, Smartphone funktional aber nicht optimiert
- Touch-Ziele ≥ 48 px, eine Aufgabe pro Bildschirm, kein Scrollen innerhalb einer Aufgabe
- Vorlesen-Button an jeder Aufgabe (Web Speech API, deutsch) – damit Lesen nicht zur Mathe-Hürde wird
- Schrift: gut lesbare Grundschulschrift (z. B. Andika), Mindestgröße 18 px, hoher Kontrast
- Maximal 2 Sätze Anweisung pro Aufgabe; Anweisungen stets mit Beispiel beim ersten Auftreten eines Formats
- Kein Text, den ein Neunjähriger nicht versteht – auch nicht in Buttons ("Weiter", "Nochmal", "Zeig mir")
- Erklärseite für Eltern `/so-gehts` „So funktioniert Pfadfinder“ (seit 2026-10-22): statisch, Text von Markus, ohne Vorlesen, nur der Text scrollt, „Zurück“ zur Karte im Band. Verlinkt als „So geht’s“ auf `/eltern` (oben rechts) und neben „Für Eltern“ am Ende von Impressum und Datenschutz, nicht auf der Karte (die Zeile unter der Karte bräuchte hoch 723 von 720 px). Seiten für Erwachsene sind von „≤ 2 Sätze“ ausgenommen (CLAUDE.md)
- Eltern-Bereich nicht hinter Login, erreichbar über die Adresse `/eltern` und über „Für Eltern“ am Ende von Impressum und Datenschutz (seit Aufgabe 11, die installierte App hat keine Adresszeile); kein Kinder-Screen verlinkt ihn, das ist der eigentliche Schutz. Davor steht eine Rechenfrage (Summe zweier zweistelliger Zahlen, Ziffernblock) als Schild „für Eltern“, keine Kindersicherung (ARCHITECTURE §7)

## 8. Eltern-Sicht (MVP, minimal)

- Übersicht: Karte mit Niveau je Bereich, Anzahl geübter Items, letzte Probetest-Auswertung
- Probetest-Auswertung: Prozent je Bereich (bei der Anzeige aus gelöst/gesamt berechnet, nicht gespeichert, seit 2026-10-15), Hinweis welche Bereiche unter 50 % liegen – ohne Schulartprognose
- Einstellungen: Daten löschen, Export/Import des Fortschritts als Datei (Gerätewechsel)
- Stand 2026-10-14: gebaut ist nur "Alles löschen" mit Rückfrage ("Wirklich alles löschen? Das kann nicht rückgängig gemacht werden."); danach zeigt die Karte wieder das Einstieg-Angebot. Übersicht und Export/Import folgen.
- Stand 2026-10-16: Über "Alles löschen" steht "Sicherung herunterladen" (nicht gelb). Er lädt alle Daten dieses Geräts als `pfadfinder-sicherung-JJJJ-MM-TT.json` herunter (Exportformat Version 2, erzeugt auf dem Gerät, kein Netz). Die Übersicht folgt.
- Stand 2026-10-22: Zwischen „Sicherung herunterladen“ und „Alles löschen“ steht „Sicherung einlesen“ (nicht gelb, nur nach der Rechenfrage). Dateiauswahl (.json), die App prüft die Datei (`parseImport`); keine Sicherung: „Das ist keine Pfadfinder-Sicherung.“, sonst Rückfrage „Ersetzt alles auf diesem Gerät. Weiter?“ mit „Abbrechen“ und „Einlesen“. Danach ersetzt sie alles auf dem Gerät und lädt die Karte neu, ohne eigene Erfolgsmeldung. Scheitert das Schreiben: „Das Einlesen hat nicht geklappt. Versuch es bitte noch einmal.“
- Hinweis für Eltern (seit 2026-10-22 auf `/eltern` nach der Rechenfrage, über den Knöpfen, ohne Schalter; nicht auf der Karte): „Auf dem iPad klingt das Vorlesen besser, wenn du in Einstellungen → Bedienungshilfen → Gesprochene Inhalte eine Premium-Stimme für Deutsch lädst.“ Die App wählt keine Stimme selbst, nur die Sprache Deutsch; iOS nimmt dann die dort eingestellte Standardstimme (seit 2026-10-16).
- Klartext-Hinweis: "Diese App ersetzt keine Beratung durch die Lehrkraft und sagt kein Testergebnis voraus."

## 9. Content-Ziele

| | MVP (bis Woche 4) | Danach |
|---|---|---|
| Mathe-Items | 150 (30 je Bereich, verteilt I/II/III) | 400 |
| Deutsch-Items | 120 (30 je Bereich 1–4) + 20 Sprache untersuchen (seit 2026-10-25) | 350 |
| Lesetexte | 6 (3 Sach-, 3 literarische, je 150–250 Wörter) | 20 |
| Probetests | 2 je Fach | 5 je Fach |

Produktionsweg: Claude generiert Items nach `CONTENT_SCHEMA.md` in Batches à 20, kalibriert gegen Originalaufgaben 2024 und IQB/VERA-3-Beispiele. **Qualitätssicherung ohne Lehrkraft:** (a) jeder Batch wird auf Niveauverteilung, Sprachniveau (Satzlänge, Fachwörter) und Distraktorqualität geprüft, (b) die ersten 30 Items je Fach werden mit Tochter auf Papier getestet, (c) Items mit auffälliger Trefferquote (<20 % oder >95 %) werden markiert und überarbeitet. Offen: eine Lehrkraft als Gegenleserin nach dem Test gewinnen (Klassenlehrerin der Tochter, Elternbeirat).

## 10. MVP-Scope (harte Liste)

Drin:
1. Startbildschirm mit Expeditionskarte (10 Gebiete, Fortschritt sichtbar)
2. Einstiegscheck je Fach
3. Üben-Modus mit allen 9 Formaten, sofortigem Feedback, Mastery-Logik
4. Fehlerkiste (Wiederholung nach 1 und 3 Tagen)
5. Probetest mit Timer und Auswertung
6. Probetest als druckbares PDF (Aufgaben + Lösungen)
7. Vorlesen-Button
8. Eltern-Bereich (Übersicht, Löschen, Export/Import)
9. Fortschritt lokal gespeichert, PWA installierbar, offline nutzbar
10. Impressum, Datenschutzerklärung (trivial, da keine Datenverarbeitung außerhalb des Geräts)

Nicht drin: alles aus Abschnitt 4 und Abschnitt 11.

**Done-Kriterien MVP:** Tochter nutzt die App an 5 Tagen freiwillig mindestens 10 Min.; sie kann jede Formatart ohne Erklärung durch Eltern bedienen; ein Probetest liefert eine Bereichsauswertung, die mit Markus' Einschätzung plausibel übereinstimmt; keine Abstürze auf Tablet und Laptop.

## 11. Roadmap (Big Picture)

- **v1.1 (nach dem Test 2026):** Lehrkraft-Review der Items, Content-Verdopplung, echtes Spaced Repetition, Audio-Aufgaben (Hörverstehen), Feedback-Funktion "Diese Aufgabe ist komisch", Validator prüft die 24-Zeichen-Regel für Optionen bei Bild-Items (CONTENT_SCHEMA §7, seit 1.0.7 nur dokumentiert), Nach-Check für Bereiche, die nach dem Einstiegscheck erst Content bekommen (im MVP starten sie auf Niveau 1), Screenshots deterministisch: fester Seed für Üben/Lese-Runde in Tests, Build-Kennung, Datum und Rechenfrage maskieren (Bericht vom 21.10.2026: fünf Gruppen ändern sich je Lauf – Üben-Lauf, Lese-Runde, Eltern-Frage und Build-Kennung, Einblendung der Rückmeldung, PDF-Datum), Durchsehen neben Text Safari quer: Band umbauen, damit 3-zeilige Prompts passen (Aufgabe 15: match mit 3 Paaren, Prompt quer in 3 Zeilen −20 px; bis dahin Prompt ≤ 60 Zeichen, CONTENT_SCHEMA §4.4; danach auch `short-answer` mit Bild wieder prüfen, bis dahin nicht erlaubt, CONTENT_SCHEMA 1.0.21)
- **v2:** Optionale Accounts (Eltern), Multi-Kind, Sync über Geräte, Eltern-Dashboard, Content-Editor mit Review-Workflow, Item-Statistiken (Basis für IRT-Kalibrierung)
- **v3:** Lehrkräfte-Modus (Klasse anlegen, Übungspläne), weitere Bundesländer/Übergangsformate (Bayern Übertritt, NRW), Monetarisierungsoptionen prüfen (Schullizenz, Eltern-Premium, Non-Profit/Spenden)

Architekturfolgen aus der Roadmap, die das MVP **jetzt** berücksichtigen muss: Datenmodell kennt "Lernende" als Entität (auch wenn nur eine existiert); Fortschrittsdaten sind serialisierbar (Export = späteres Sync-Format); Bundesland: `Learner.settings.bundesland` im MVP, `Item.region` ab Schema 1.1; Content ist vom Code getrennt (JSON, versioniert).

## 12. Rechtliches und Datenschutz

- Keine personenbezogenen Daten verlassen das Gerät; kein Analytics, keine Cookies außer technisch notwendigen → Datenschutzerklärung kurz, DSGVO Art. 8 (Einwilligung bei Kindern) greift nicht
- Impressumspflicht nach DDG gilt trotzdem (Markus privat). Seit Aufgabe 10 (2026-10-18): `/impressum` und `/datenschutz` als statische Seiten, ohne Vorlesen, verlinkt aus `/eltern` (oben rechts, schon vor der Rechenfrage) und seit Aufgabe 11 auch rechts in der Zeile unter der Karte, in jedem Viewport („leicht erkennbar, unmittelbar erreichbar“, DDG); Name, Anschrift und E-Mail stehen dort seit 2026-10-22 ausgeschrieben (Markus Steireif, Maisenbachstraße 2, 76359 Marxzell, pfadfinder@steireif.de als mailto-Link). Die Datenschutzerklärung nennt Cloudflare als Hoster (Zugriffsprotokolle) und die Sprachausgabe des Browsers (Chrome mit Google-Stimmen schickt den vorzulesenden Text an Google)
- Produktname darf "Kompass 4" beschreibend nennen ("Übungen zur Vorbereitung auf Kompass 4"), nicht als Marke führen
- Alle Items sind Eigenschöpfungen; Originalaufgaben und IQB/VERA-Items dienen nur als Format- und Niveaureferenz, werden nicht übernommen
- Lizenz: offen – Code MIT, Content CC BY-SA 4.0

## 13. Zeitplan

| Woche | Code | Content |
|---|---|---|
| 1 (bis 18.10.) | Repo, Docs, Item-Player für MC + Zahleneingabe, Fortschritt lokal | Schema einfrieren, 30 Pilot-Items je Fach, Papier-Pilot mit Tochter |
| 2 (bis 25.10.) | Alle Formate, Üben-Modus, Mastery-Logik, Entdeckerkarte | +60 Items je Fach, Pilot-Erkenntnisse einarbeiten |
| 3 (bis 1.11.) | Einstiegscheck, Fehlerkiste, Probetest + Timer, Vorlesen | +60 Items, 2 Probetests je Fach, 6 Lesetexte |
| 4 (bis 8.11.) | PDF-Druck, Eltern-Bereich, PWA/offline, Polish | Letzte Lücken, Qualitätsrunde |
| 5 | Puffer, tägliche Nutzung durch Tochter | – |

## 14. Getroffene Entscheidungen (2026-10-11)

1. Arbeitstitel: Pfadfinder
2. Lizenz: Code MIT, Content CC BY-SA 4.0
3. "Sprache untersuchen": nicht im MVP – **revidiert 2026-10-25:** im MVP als fünfter Deutsch-Bereich „Wörter und Sätze“ (§5.1), weil der Kompass-4-Deutsch-Test 2025 ihn mit 11 von 24 Aufgaben prüft
4. Probetest: volle Länge (45 Min.); kein Kurz-Probetest
5. Visueller Stil: Flat Illustration, begrenzte Palette, Abenteuerkarte statt "niedlich"; SVG-Karte mit geometrischen Gebieten, Motive austauschbar
