# CONTENT_SCHEMA.md – Item-Format und Autorenregeln

Status: v1.0.26 **eingefroren** für das MVP · Änderungen nur mit Versionssprung und Eintrag in `CHANGELOG.md`
Versionierung: Das Feld `schemaVersion` und `content/schema-version.json` tragen nur `Major.Minor` (aktuell `"1.0"`). Patch-Versionen präzisieren Regeln oder ergänzen optionale Felder, mit denen jedes bisherige Item gültig bleibt (seit 1.0.4).
Dieses Dokument ist der Vertrag zwischen Content-Spur (Items) und Code-Spur (App). Der Code validiert jede Content-Datei beim Build gegen dieses Schema (Zod, siehe `ARCHITECTURE.md`). Ungültiger Content bricht den Build.

---

## 1. Dateistruktur

```
content/
  schema-version.json          { "version": "1.0" }
  items/
    mathe/
      zahlen-operationen.json  Item[]
      raum-form.json
      groessen-messen.json
      daten-zufall.json
      muster-strukturen.json
    deutsch/
      lesen-sachtext.json
      lesen-literarisch.json
      rs-laut-buchstabe.json
      rs-strategien.json
      sprache-untersuchen.json  seit 1.0.22; bis zum ersten Batch ein leeres Array []
  texts/
    deutsch/
      t-sach-001.json          ReadingText
      t-lit-001.json
  probetests/
    mathe-01.json              Probetest
    deutsch-01.json
  assets/
    svg/                       nur SVG, Dateiname = asset-id
  manifest.json                ERZEUGT von `npm run content:validate`, nie von Hand bearbeiten
```

`manifest.json` ist kein Teil des Item-Vertrags: Es fasst je Bereich die aktiven Items (ohne `retired`) je Format und Niveau sowie die Text-IDs zusammen, dazu die IDs der Probetests je Fach (seit 1.0.9), damit die Startseite keine Items laden muss. Autorinnen und Autoren committen es nach jeder Content-Änderung mit (der pre-commit-Hook verlangt das, in CI ist ein veraltetes Manifest ein Fehler).

## 2. Identifikatoren

Item-ID: `{fach}-{bereich}-{niveau}-{laufnr}` – z. B. `m-zo-2-014`, `d-rsl-1-003`. IDs sind stabil und werden nie wiederverwendet (gelöschte Items bekommen `status: "retired"`, bleiben in der Datei). Das Niveau steckt in der ID. Ein Item wechselt sein Niveau nie durch Umlabeln, sondern durch `retired` plus Kopie mit neuer ID; die `pilotNote` beider Items nennt die jeweils andere ID. Probetests verweisen danach auf die neue ID.

| Fach | Kürzel | Bereich | Kürzel |
|---|---|---|---|
| mathe | m | zahlen-operationen | zo |
| | | raum-form | rf |
| | | groessen-messen | gm |
| | | daten-zufall | dz |
| | | muster-strukturen | ms |
| deutsch | d | lesen-sachtext | lsa |
| | | lesen-literarisch | lli |
| | | rs-laut-buchstabe | rsl |
| | | rs-strategien | rss |
| | | sprache-untersuchen | su |

## 3. Item (gemeinsame Felder)

```ts
type Item = {
  id: string;                       // s. o.
  schemaVersion: "1.0";
  fach: "mathe" | "deutsch";
  bereich: Bereich;                 // Kürzel-Langform, z. B. "zahlen-operationen"
  niveau: 1 | 2 | 3;                // IQB: I Reproduzieren, II Zusammenhänge, III Reflektieren
  format: Format;                   // eins der 10 Formate aus Abschnitt 4 (segment-text seit 1.0.25)
  status: "draft" | "piloted" | "approved" | "retired";

  stimulus?: {                      // optionaler Kontext vor der Frage
    text?: string;                  // max. 3 Sätze (Mathe) – Lesetexte NIE hier, sondern textRef
    assetId?: string;               // SVG in content/assets/svg
    assetAlt?: string;              // Pflicht wenn assetId gesetzt; wird vorgelesen
    textRef?: string;               // ReadingText-ID (nur Deutsch Lesen)
  };
  prompt: string;                   // die eigentliche Frage/Anweisung, max. 2 Sätze
  readAloud?: string;               // Vorlese-Variante, falls prompt Symbole enthält (z. B. "3 × 4" → "3 mal 4")

  payload: Payload;                 // formatabhängig, s. Abschnitt 4
  solution: Solution;               // formatabhängig

  feedback: {
    correct: string;                // 1–2 Sätze, bestätigt + ggf. "so geht's auch"
    incorrect: string;              // 1–3 Sätze Erklärung in Kindersprache, nie "falsch"
    misconception?: string;         // der typische Denkfehler, benannt ("Viele vergessen den Übertrag")
  };

  tags: string[];                   // Feinthemen, z. B. ["schriftliche-addition", "uebertrag"]
  estimatedSeconds: number;         // realistische Bearbeitungszeit, für Probetest-Zusammenstellung
  meta: {
    author: "claude" | "markus" | string;
    createdAt: string;              // ISO-Datum
    calibration?: "original-2024" | "iqb" | "vera3" | "kompass4-2025" | "none";  // woran orientiert; kompass4-2025 = Kompass-4-Test 2025 als Anker (seit 1.0.20)
    pilotNote?: string;             // Beobachtung aus dem Papier-Pilot
  };
};
```

## 4. Formate: Payload und Solution

Zehn Formate: `single-choice`, `multi-choice`, `number-input`, `match`, `order`, `cloze-select`, `mark-in-text`, `find-error`, `short-answer`, `segment-text` (seit 1.0.25). Optionen und Elemente mischt die App deterministisch (Seed: Item-ID + Versuch), außer bei `keepOrder: true` (§4.1) und bei `segment-text` (§4.10: Die Reihenfolge ist der Satz).

### 4.1 `single-choice`
```ts
payload:  { options: { id: string; text: string; readAloud?: string; assetId?: string }[]; keepOrder?: boolean }   // 3–4 Optionen
solution: { optionId: string }
```
`keepOrder` (seit 1.0.4): `true`, wenn die Optionen Beschriftungen im Bild benennen („A“ bis „D“); dann bleibt die Reihenfolge wie geschrieben. Sonst werden Optionen gemischt. Der Validator warnt, wenn alle Optionen nur Bildbeschriftungen sind und `keepOrder` fehlt.

`readAloud` an einer Option (seit 1.0.12): Vorlesen liest diesen Text statt `text`, unverändert. Gedacht für Optionen, die man nicht vorlesen kann, ohne die Aufgabe zu verändern, z. B. Lückenwörter („Ki_en“ → „Kissen“). Nur an Optionen von `single-choice` und `multi-choice` erlaubt, nicht leer.

Mit `stimulus.textRef` und zusätzlichem `stimulus.text` (seit 1.0.13): höchstens 3 Optionen. Der zitierte Satz kostet hoch die Zeile, die eine vierte Option braucht (d-lsa-2-003 mit 4 Optionen: 2 px Luft, mit 3: 58 px). Der Validator warnt.
```ts
```

### 4.2 `multi-choice`
```ts
payload:  { options: { id: string; text: string; readAloud?: string }[]; minSelect: number; keepOrder?: boolean }  // 4–5 Optionen, 2–3 richtig; minSelect = exakt Anzahl richtiger Optionen (seit 1.0.1); keepOrder und readAloud wie 4.1
solution: { optionIds: string[] }                                         // exakt diese Menge
```
Mit `stimulus.textRef` (seit 1.0.13): 5 Optionen nur mit einem `prompt` von höchstens 60 Zeichen, sonst 4. Die Optionsanzahl allein entscheidet nicht: 5 Optionen passten mit 60 und 62 Zeichen Prompt, mit 99 Zeichen fehlte Safari quer 1 px zu 18 px Luft (d-lsa-2-001 vor Patch 1). Der Validator warnt.

### 4.3 `number-input`
```ts
payload:  { unit?: string; allowDecimal?: boolean; maxDigits: number }     // Ziffernblock, kein Tastaturzwang
solution: { value: number; tolerance?: number }                           // tolerance nur bei Schätzaufgaben
```
Geld (seit 1.0.24): Nennt die Aufgabe Euro („€“, „Euro“ oder `unit: "€"`) und steht ein Betrag mit Komma im Text, braucht das Item `allowDecimal: true`, auch bei einer ganzen Lösung (10 €). Sonst bietet der Ziffernblock kein Komma an. Der Validator warnt; eine Kommazahl als Lösung ohne `allowDecimal` ist schon ein Fehler.

### 4.4 `match`
```ts
payload:  { left: { id: string; text: string }[]; right: { id: string; text: string }[] }  // 3–5 Paare, right darf 1 Distraktor enthalten
solution: { pairs: [leftId: string, rightId: string][] }
```
Mit `stimulus.textRef` (seit 1.0.17): höchstens 3 Paare (3 Texte in `left`, in `right` dazu höchstens 1 Distraktor), alle Kartentexte (`left` und `right`, Distraktor eingeschlossen) zusammen höchstens 140 Zeichen, `prompt` höchstens 60 Zeichen. Die Rückmeldung hat keine eigene Grenze: bis 195 Zeichen (`incorrect` + `misconception`) gemessen, sie bindet nicht. Die App macht das Zielfeld so breit wie die längste Karte mit Haken, höchstens 60 % der Zeile; die Zeile links bekommt den Rest und bricht in ausgeglichenen Zeilen um. Neben dem Textkasten stehen die Karten unter den Zeilen. Messgrundlage (Aufgabe 15): zwei Sweeps und ein Messpunkt neben t-sach-901 (`tests/e2e/sweep-match.spec.ts`), Üben in drei Zuständen, Probetest-Aufgabe und Durchsehen, vier Viewports. 4 Paare ließen im Üben schon bei 80 Zeichen Safari quer −36 px (hoch −4), 5 Paare −92; 3 Paare hielten das Üben bis 140 Zeichen bei mindestens 18 px. Die Rückmeldung (95 bis 195 Zeichen; 195 ist die von m-dz-2-008, dem längsten match-Feedback im Content, Mathe ohne Text – eine konservative Messgrundlage) änderte das Durchsehen nicht. Gebunden hat der Prompt: mit 74 Zeichen quer 3 Zeilen, Durchsehen Safari quer −20 px; mit 60 Zeichen 2 Zeilen, +15 px. Zeichengrenzen sind Stellvertreter für Zeilen: Ein Prompt mit 74 Zeichen hat je nach Wörtern 2 oder 3 Zeilen, das sind 35 px Unterschied. Je Karte bleiben 35 Zeichen links und 52 rechts als Umbruchgrenzen (1.0.15, gemessen an d-lli-2-003): Darüber bricht eine Karte schlecht um; der Validator warnt dafür nicht mehr. Der Validator warnt bei jeder der drei Grenzen einzeln.

### 4.5 `order`
```ts
payload:  { items: { id: string; text: string }[] }                        // 3–5 Elemente, gemischt geliefert
solution: { orderedIds: string[] }
```
Mit `stimulus.textRef` (seit 1.0.13): höchstens 4 Elemente, jedes höchstens 30 Zeichen (Stichworte statt Sätze). Bei „noch nicht“ steht unter der Liste die Zeile „Richtig ist: …“; ein fünftes Element lief hoch 14 px und Safari quer 7 px unter das Band (d-lsa-2-004), Sätze ab etwa 40 Zeichen brechen quer um. Der Validator warnt.

### 4.6 `cloze-select`
```ts
payload:  { template: string;                                              // "Der Hund {1} über den Zaun."
            gaps: { key: string; options: string[] }[] }                   // 1–3 Lücken, je 3 Optionen
solution: { gaps: Record<string, string> }                                 // { "1": "springt" }
```

### 4.7 `mark-in-text`
```ts
payload:  { text: string; unit: "word" | "sentence"; maxSelect: number }   // Kind tippt Wort/Satz an
solution: { indices: number[] }                                            // 0-basierte Index der Einheiten
```
Mit `stimulus.textRef` (seit 1.0.11): `payload.text` hat höchstens 4 Sätze und 200 Zeichen. Neben dem Textkasten bleibt weniger Platz; ein ganzer Absatz mit 5 Sätzen war quer der knappste Screen (Messung Aufgabe 9). Der Validator warnt.

### 4.8 `find-error`
```ts
payload:  { words: { id: string; text: string }[]; errorCount: number }   // Satz als Wortliste, 1–2 Fehler
solution: { errorIds: string[]; corrections: Record<string, string> }     // id → richtige Schreibung
```

### 4.9 `short-answer`
```ts
payload:  { maxChars: number; hint?: string }
solution: { model: string; keyPoints: string[] }                           // Musterlösung + 1–3 Kernpunkte
// kein Auto-Check: Kind vergleicht und wählt "getroffen / teils / nein"; Selbsteinschätzung zählt 1 / 0.5 / 0
```
`model` hat höchstens `maxChars` Zeichen (seit 1.0.8): Das Kind vergleicht mit einer Antwort, die es selbst hätte schreiben können. Der Validator prüft das.

Mit `stimulus.textRef` (seit 1.0.13): `model` höchstens 90 Zeichen, höchstens 2 `keyPoints`, `feedback.incorrect` und `feedback.misconception` zusammen höchstens 150 Zeichen. Beim Vergleichen stehen Musterlösung und Kernpunkte neben dem Kasten; mit 111 Zeichen und 3 Kernpunkten lief der Screen hoch 8 px unter das Band (d-lsa-3-001). Bei „noch nicht“ zählt die Rückmeldung: mit 176 Zeichen lief d-lsa-3-002 Safari quer 20 px unter das Band, mit 158 blieben 22 px. Das Antwortfeld hat immer 3 Zeilen, `maxChars` ändert die Höhe nicht. Der Validator warnt.

Mit Bild (`stimulus.assetId`) nicht erlaubt (seit 1.0.21), bis das Band umgebaut ist (PRODUCT §11). Grund: m-rf-3-008 hatte in Durchsehen Safari hoch nur 2 px Luft, obwohl `model` mit 80 und `incorrect` + `misconception` mit 114 Zeichen unter den Grenzen am Lesetext lagen. Der Validator meldet einen Fehler.

### 4.10 `segment-text` (seit 1.0.25)
```ts
payload:  { text: string; unit: "word" | "letter" }
solution: { boundaries: number[] }   // 0-basierte Lückenindizes: Lücke k liegt zwischen Einheit k und k+1
```
Das Kind setzt Trennstriche zwischen die Wörter eines Satzes, z. B. für „Kreise alle Satzglieder ein“ (Kompass 4 Deutsch 2024 und 2025). „Am Nachmittag spielt der kleine Hund mit seinem roten Ball.“ mit den Satzgliedern „Am Nachmittag | spielt | der kleine Hund | mit seinem roten Ball.“ hat `boundaries: [1, 2, 5]`.
- Einheiten bei `unit: "word"` kommen **zwingend** aus `splitUnits(text, "word")` wie bei `mark-in-text`: Satzzeichen bleiben am Wort, nach der letzten Einheit gibt es keine Lücke. n Wörter haben n − 1 Lücken. Ein Wort mit Bindestrich ist eine Einheit, ein Gedankenstrich zwischen Leerzeichen eine eigene (dann zwei Lücken um ihn; solche Sätze vermeiden)
- Fehler (Schema): `boundaries` aufsteigend, ohne Dubletten, jede im Bereich 0 … n−2, Anzahl 1 … n−2
- `unit: "letter"` erlaubt das Schema, der Validator meldet aber einen Fehler „Renderer für unit letter nicht gebaut“, bis ein Batch ihn braucht
- `stimulus.text` erlaubt (ein Satz Kontext); `stimulus.textRef` und `stimulus.assetId` sind Fehler: Das Format steht allein auf dem Screen
- Keine Mischung zur Laufzeit, `keepOrder` gibt es hier nicht
- Bewertung: richtig genau dann, wenn die getippten Lücken als Menge gleich `boundaries` sind; kein Teilpunkt
- Vorlesen liest Stimulus, Prompt und den Satz wie einen Satz, ohne Lücken und ohne „Antworten“
- **Richtwert** (Warnung, kein Fehler): `text` höchstens 14 Wörter und 85 Zeichen. Gemessen auf `/dev/format/segment-text` (`format-segment-text-layout.spec`) in drei Zuständen (leer, noch nicht mit „Richtig ist“, Durchsehen); Luft über dem Band im knappsten Zustand je Viewport:

  | Viewport | 10 Wörter / 57 Zeichen | 14 Wörter / 85 Zeichen |
  |---|---|---|
  | iPad quer 1024 × 768 | 294 px (2 Zeilen) | 265 px (2 Zeilen) |
  | iPad hoch 768 × 1024 | 457 px (2 Zeilen) | 401 px (3 Zeilen) |
  | Safari quer 1024 × 660 | 186 px (2 Zeilen) | 157 px (2 Zeilen) |
  | Safari hoch 768 × 900 | 333 px (2 Zeilen) | 277 px (3 Zeilen) |

  Jede Lücke ist 48 × 48 px, nirgends scrollt die Seite. Längere Sätze sind nicht gemessen, darüber warnt der Validator.

## 5. ReadingText

```ts
type ReadingText = {
  id: string;                        // t-sach-001 | t-lit-001
  kind: "sachtext" | "literarisch";
  title: string;
  wordCount: number;                 // 150–250 (MVP)
  paragraphs: string[];              // je Absatz ein String; Absätze werden nummeriert; Items verweisen auf Absätze, nie auf Zeilen
  readAloud: boolean;                // true: Vorlesen erlaubt im Üben-Modus; im Probetest immer aus
  itemIds: string[];                 // 4–7 Items (seit 1.0.25, vorher 4–6), die diesen Text referenzieren, aufsteigend nach Niveau
};
```

## 6. Probetest

```ts
type Probetest = {
  id: string;                        // mathe-01
  fach: "mathe" | "deutsch";
  durationMinutes: 45;
  itemIds: string[];                 // feste Reihenfolge, 18–24 Items; Deutsch mit 1 oder 2 Texten (aus den textRefs, kein eigenes Feld; seit 1.0.25)
  niveauMix: { 1: number; 2: number; 3: number };   // Band je Niveau (seit 1.0.23, s. u.), wird validiert
  bereichMix: Partial<Record<Bereich, number>>;     // jeder Pflichtbereich ≥ 2 Items (seit 1.0.22, s. u.)
};
```

Regeln:
- Zeit (Mathe seit 1.0.9, Deutsch seit 1.0.16): **Mathe 24–32 Min.** Summe `estimatedSeconds` bei 18–24 Items. **Deutsch 24–32 Min.** bei 18–24 Items und 1 oder 2 Texten: Summe `estimatedSeconds` der Items plus Lesezeit je referenziertem Text = `wordCount` × 0,75 s (80 Wörter/Min.). Grund: Die Item-Uhr startet nach dem Lese-Screen, die Lesezeit steckt in keinem Item. Der Timer bleibt 45 Min.: Die `estimatedSeconds` sind App-Zeiten, das Papier-Original rechnet zusätzlich mit Lesen und Schreiben auf Papier (etwa 110 s je Aufgabe). Wer früher fertig ist, gibt früher ab, wie im Original.
- Niveau-Band (seit 1.0.23, `PROBETEST_NIVEAU_BAND` in `taxonomy.ts`): Anteil je Niveau an der Itemzahl n: **I 29–44 %, II 38–55 %, III 16–23 %**, geprüft als `min·n ≤ Anzahl ≤ max·n`, ohne Rundung und ohne ±1. Bei 24 Items I 7–10, II 10–13, III 4–5; bei 21 Items I 7–9, II 8–11, III 4; bei 18 Items III 3–4. Die Summe ist die Itemzahl, `niveauMix` muss zu den Items passen. Gültig sind der Pool-Mix 10/10/4 (mathe-01/02), 8/12/4 (deutsch-01/02, seit 1.0.26) und der Testmix 7/13/4 (mathe-03, wie Kompass 4 Mathe 2025; deutsch-03 seit 1.0.26)
- kein `short-answer`-Anteil über 15 %
- Pflichtbereiche je Fach (seit 1.0.22, `PROBETEST_REQUIRED_BEREICHE` in `taxonomy.ts`): Mathe alle 5 Bereiche, Deutsch `lesen-sachtext`, `rs-laut-buchstabe`, `rs-strategien`, `sprache-untersuchen` (seit 1.0.26; vorher `lesen-literarisch` statt `sprache-untersuchen`). Jeder Pflichtbereich hat mindestens 2 Items. `lesen-literarisch` ist erlaubt, aber nicht Pflicht; fehlt sein Schlüssel, ist das kein Fehler. Ein vorhandener Schlüssel muss zur Zählung der Items passen wie jeder andere. `bereich` wird nie ohne Entscheidung über diese Liste erweitert
- Deutsch beginnt mit Lesen und endet mit Rechtschreibung oder Sprache untersuchen (seit 1.0.25, vorher nur Rechtschreibung; Kompass 4 Deutsch 2024 und 2025 enden mit Sprache untersuchen). Items aus `sprache-untersuchen` stehen nach den Lesen-Blöcken, nie davor oder dazwischen (seit 1.0.22, Fehler im Validator), vor, zwischen oder nach den Rechtschreib-Items. Gültig ist damit auch der Aufbau des echten Tests: ein Sachtext mit bis zu 7 Items, Rechtschreibung, Sprache untersuchen (deutsch-03 seit 1.0.26)
- Deutsch (seit 1.0.16, 1.0.25): Die Texte ergeben sich aus den `textRef`s der Items. 1 oder 2 Texte (seit 1.0.25, vorher genau 2); bei zweien ein Sachtext und ein literarischer (verschiedene `kind`). Die Items eines Textes stehen zusammen, weil der Lese-Screen einmal vor dem ersten Item eines Textes kommt. Kein Item ohne `textRef` steht vor einem Item mit `textRef`. Alles sind Fehler im Validator

## 7. Autorenregeln (gelten für jeden Batch)

**Sprache**
- Sätze ≤ 15 Wörter, kein Passiv, keine Nebensatzketten, keine Fremdwörter ohne Not
- Anweisung immer als Imperativ in Du-Form: "Rechne aus.", "Kreuze an."
- Mathe-Texte dürfen keine Lesehürde sein: wenn der Text schwerer ist als die Mathematik, ist das Item falsch gebaut
- Vornamen gemischt und alltagsnah (Mia, Elias, Amira, Jonas, Leyla, Ben), keine Marken, keine Religion/Politik/Gewalt, kein Essen als Belohnung

**Mathematik**
- Zahlenraum 10 000 (siehe Kalibrierung Mathe), schriftliche Verfahren mit Übertrag, Geld in € und ct, Zeit in h/min, Längen mm–km, Gewicht g–kg–t
- Distraktoren sind *echte* Fehlwege (Zahlendreher, vergessener Übertrag, falsche Einheit, "Anzahl statt Position"), nie Zufallszahlen
- Sachaufgaben enthalten nie überflüssige Zahlen auf Niveau I; ab Niveau II gezielt eine Ablenkzahl
- Mehrere Gleichungen nie durch Komma trennen (Verwechslung mit Dezimalkomma); mit „und“ oder als eigene Sätze

**Deutsch**
- Lesetexte altersgerecht, abgeschlossen, mit klarem Kern; Items dazu steigen im Niveau: Entnehmen (I) → Verknüpfen (II) → Deuten/Begründen (III)
- Items zu einem Lesetext verweisen auf Absätze („Lies Absatz 3.“), nie auf Zeilen (§5); `mark-in-text` dazu mit höchstens 4 Sätzen und 200 Zeichen (§4.7), `order` mit höchstens 4 Elementen zu je 30 Zeichen (§4.5), `short-answer` mit `model` bis 90 Zeichen, höchstens 2 `keyPoints` und Rückmeldung (incorrect + misconception) bis 150 Zeichen (§4.9), `single-choice` mit zitiertem `stimulus.text` mit höchstens 3 Optionen (§4.1), `multi-choice` mit 5 Optionen nur bei `prompt` bis 60 Zeichen (§4.2), `match` mit höchstens 3 Paaren, Kartentexten zusammen bis 140 Zeichen und `prompt` bis 60 Zeichen (§4.4). Grundlage ist die Luft über dem Band in allen vier Viewports (mindestens 18 px); darüber ist nichts gemessen. Der Validator warnt nur
- Rechtschreibung nur mit Grundschul-Regelwissen lösbar (Verlängern, Ableiten, Silben, Wortbausteine, Groß-/Kleinschreibung); keine Ausnahmewörter als Fehlerquelle
- Falsch geschriebene Wörter werden nie vorgelesen. Bei find-error und cloze-select in den RS-Bereichen liest die App den Satz in richtiger Schreibung aus solution und keine Optionen (Code). Choice-Optionen mit Fehlschreibung tragen ein readAloud mit der korrekten Schreibung. Ein Stimulus mit Fehlschreibung bekommt ein Item-readAloud mit richtiger Schreibung. Der Validator warnt bei find-error und cloze-select in den RS-Bereichen seit 1.0.24, wenn ein falsch geschriebenes Wort in `readAloud`, `stimulus` oder `prompt` steht; Choice-Optionen prüft er nicht
- `find-error` enthält pro Satz nur Fehlertypen eines Bereichs

**Niveau**
- I: ein Schritt, bekanntes Verfahren
- II: zwei Schritte, oder zwei Informationen aus Tabelle/Text/Bild verknüpfen
- III: begründen, Fehler in fremder Lösung finden, Regel übertragen
- Zielverteilung je Bereich im Pool: 12 / 12 / 6 (bei 30 Items)

**Kalibrierung Mathe (Kompass 4 2025, seit 1.0.20)**
- Anker ist der Kompass-4-Test 2025 (liegt nie im Repo). Übernommen werden nur Niveau, Aufgabentypen, Zahlenräume, Textlängen und Fehlerquellen, nie Aufgaben oder Umformulierungen davon. Neue Items tragen `calibration: "kompass4-2025"`; Items mit `vera3` sind am Klasse-3-Stoff kalibriert und in II/III tendenziell zu leicht
- Zahlenraum **10 000** in allen Niveaus. Zehntausender und größer kommen weder im Test noch bis November in der Klasse vor
- I (Reproduzieren): schriftlich vierstellig ± dreistellig mit Übertrag, Einmaleins-Erweiterung (5 · 18, 6 · 38, 48 : 4), einschrittige Sachaufgabe dreistellig, Nachbarzehner/-hunderter, Größenvorstellung zuordnen, sicher/möglich/unmöglich
- II (Zusammenhänge): Darstellungswechsel Situation ↔ Bild ↔ Term, nicht-kanonische Bündelung (H 5 / Z 13 / E 2), Mitte zwischen zwei Zahlen, Zahlenreihe mit Regelwechsel verbalisieren, Zahlenmauer optimieren, räumlich operieren **mit Bild** (Figuren zusammensetzen, Flächen vergleichen, gedrehte Figur erkennen, Ansicht eines Würfelgebäudes, Spiegelachsen jenseits Rechteck, Netz ergänzen), zwei Informationen aus Tabelle oder Preisschild verknüpfen, Uhrzeit mit Minutenübergang über die volle Stunde, Dezimal-Längen in cm umrechnen
- III (Reflektieren): begründen („Der Deckstein ist am größten, wenn …“), fremde Rechenstrategie fortsetzen, Verhältnis auf eine andere Anzahl übertragen, Fehler in fremder Lösung finden
- Stimulus 17–30 Wörter; ein Bild trägt die Aufgabe in rund jeder zweiten Teilaufgabe des Tests. Begriffs- und Körperwissen ohne Bild kommt im Test nicht vor und wird nur auf I gepflegt
- Testmix je 24 Teilaufgaben: zo 8 / rf 6 / gm 5 / ms 3 / dz 2, Niveau 7 / 13 / 4. Seit 1.0.23 prüft der Validator ein Band je Niveau (§6); mathe-03 folgt dem Testmix, mathe-01/02 dem Pool-Mix 10 / 10 / 4

**Kalibrierung Deutsch (Kompass 4 2024/2025)**
- Anker sind die Deutsch-Tests 2024 und 2025 (Lesen 1–7 an einem Sachtext, RS 8–13 und 17, SU 14–24), `calibration: "kompass4-2025"`
- Lesen: Entnehmen, Aussagen prüfen, Satzteile verbinden, zwei Gründe nennen, Ablauf ordnen, Überschrift zum Absatz, Wortbedeutung – nur Sachtexte, literarische Texte kommen im Test nicht vor
- RS: Wortfamilien-Lücke ss/ß, Großschreibung mit Satzanfang, Verlängern/Ableiten mit Begründung, Fehler finden und berichtigen, wörtliche Rede, Wortstamm
- SU: I Wortart erkennen, Grundform, Steigerung, Satz ↔ Zeitform, zusammengesetztes Nomen; II unregelmäßiges Präteritum, Perfekt, Adjektiv-Endung, Bestimmungswort, Satzglieder (Umstellprobe), Kongruenz; III Wortart begründen, Fehler in fremder Einteilung, Prüfschritte ordnen; dazu Satzglieder trennen (Format `segment-text` §4.10), Verbformen-Tabelle, Perfekt erkennen

**Feedback**
- `incorrect` erklärt den Weg, verrät nicht nur das Ergebnis
- `misconception` benennt den wahrscheinlichsten Fehler des gewählten Distraktors (bei MC) oder des Formats
- Ton: freundlich, sachlich, nie ironisch, nie "leider"

**Längen (Richtwerte, seit 1.0.24)**
- `segment-text`-Sätze bis 14 Wörter und 85 Zeichen (gemessen, §4.10; der Validator warnt)
- Match-Karten bis 24 Zeichen, `order`-Elemente bis 40, Kurzantwort-Stichpunkte (`keyPoints`) bis 45, `feedback.incorrect` und `feedback.misconception` je bis 90: Erfahrungswerte aus Layout-Befunden 25.10., keine Validator-Regel; was zählt, ist der Sweep ≥ 18 px

**Bilder (`content/assets/svg`)**
- Die App bettet jedes SVG direkt in die Seite ein. Deshalb gilt, geprüft von `npm run content:validate`: `<svg>` mit `viewBox`; kein `<script>`, `<foreignObject>`, `<style>`, `<image>`, `<iframe>`; keine Event-Attribute (`onload` …); keine Verweise (`href`, `url()`); kein `style`-Attribut
- Farben nur `currentColor` oder `none` (Abstufung über `fill-opacity`/`stroke-opacity`), Schrift nur `font-family="inherit"`. So übernimmt das Bild Tinte und Andika und druckt schwarz auf weiß
- Höhe im Aufgabenblatt: 200 px (quer auf kurzen Bildschirmen bis etwa 144 px). Quer stehen Bilder bis zum Seitenverhältnis 2 : 1 neben dem Text, breitere darunter. Hoch steht jedes Bild zwischen Stimulus und Frage (seit 1.0.21). Grund: Neben einem 240 px hohen Bild blieben hoch 70–107 px für den Text, lange Wörter liefen ins Bild (m-dz-3-001, Batch B6)
- Bild-Items haben höchstens zwei Sätze `stimulus.text` (seit 1.0.21). Grund: Hoch steht das Bild über der Frage, jeder weitere Satz schiebt Frage und Antworten nach unten (Aufgabe 19, Batch B6: acht Stimuli auf höchstens zwei Sätze gekürzt). Der Validator warnt
- `short-answer` mit Bild ist nicht erlaubt (seit 1.0.21, §4.9). Der Validator meldet einen Fehler
- Schrift im Bild: `font-size` mindestens viewBox-Höhe / 8 (seit 1.0.6; Beispiel: Höhe 260 → mindestens 32,5). Ein Bild ist mindestens 144 px hoch, und 144 px × Schriftgröße / viewBox-Höhe ≥ 18 px, die kleinste Schrift der App. Darunter ist es ein Fehler im Validator
- `assetAlt` beschreibt, was zu sehen ist, und verrät die Lösung nicht: keine Zählhilfe („4 Kästchen und 3 weitere“), keine Nennung der gefragten Eigenschaft („ein Dreieck mit zwei gleich langen Seiten“, wenn nach Symmetrie gefragt ist). Es wird vorgelesen und ist der Name des Bildes für Screenreader
- Optionen, die auf Beschriftungen im Bild zeigen, bekommen `keepOrder: true` (§4.1)
- `single-choice` und `multi-choice` mit Bild: jede Option höchstens 24 Zeichen, damit die Optionen zweispaltig stehen (`LONG_OPTION_CHARS` im Renderer). Längere Optionen nur bei Items ohne Bild. Grund: In Safari quer (1024 × 660) passen Bild, einspaltige Optionen und Rückmeldung nicht zusammen (Befund Batch 4, seit 1.0.7; `multi-choice` seit 1.0.8, gemessen an m-dz-2-007: einspaltig −23 px, zweispaltig +89 px). Der Validator prüft das nicht

**Batch-Abgabe**
- 20 Items je Batch, ein Bereich, als valide JSON-Datei
- Jeder Batch enthält eine Kopfzeile im Chat: Niveauverteilung, Formatverteilung, Kalibrierungsquelle
- Status bei Abgabe: `draft`; nach Papier-Pilot `piloted`; nach Markus-Freigabe `approved`

## 8. Beispiele

```json
{
  "id": "m-zo-1-001",
  "schemaVersion": "1.0",
  "fach": "mathe",
  "bereich": "zahlen-operationen",
  "niveau": 1,
  "format": "number-input",
  "status": "draft",
  "prompt": "Rechne aus: 4 735 + 2 868",
  "readAloud": "Rechne aus: 4735 plus 2868",
  "payload": { "maxDigits": 5 },
  "solution": { "value": 7603 },
  "feedback": {
    "correct": "Richtig! Du hast an jeder Stelle den Übertrag mitgenommen.",
    "incorrect": "Rechne stellenweise von rechts: 5 + 8 = 13, die 1 wandert zur nächsten Stelle. Prüfe jede Stelle so.",
    "misconception": "Viele vergessen den Übertrag in die Hunderterstelle."
  },
  "tags": ["schriftliche-addition", "uebertrag"],
  "estimatedSeconds": 60,
  "meta": { "author": "claude", "createdAt": "2026-10-11", "calibration": "original-2024" }
}
```

```json
{
  "id": "m-gm-2-004",
  "schemaVersion": "1.0",
  "fach": "mathe",
  "bereich": "groessen-messen",
  "niveau": 2,
  "format": "single-choice",
  "status": "draft",
  "stimulus": { "text": "Leyla kauft 3 Hefte für je 1,20 € und einen Füller für 8,50 €. Sie bezahlt mit einem 20-Euro-Schein." },
  "prompt": "Wie viel Geld bekommt sie zurück?",
  "payload": {
    "options": [
      { "id": "a", "text": "7,90 €" },
      { "id": "b", "text": "10,30 €" },
      { "id": "c", "text": "8,10 €" },
      { "id": "d", "text": "12,10 €" }
    ]
  },
  "solution": { "optionId": "a" },
  "feedback": {
    "correct": "Genau: 3 · 1,20 € = 3,60 €, plus 8,50 € sind 12,10 €. 20 € − 12,10 € = 7,90 €.",
    "incorrect": "Rechne erst alles zusammen, was Leyla kauft. Dann ziehe das von 20 € ab.",
    "misconception": "Wer 12,10 € wählt, hat den Preis ausgerechnet, aber das Rückgeld vergessen."
  },
  "tags": ["geld", "sachaufgabe", "zweischrittig"],
  "estimatedSeconds": 90,
  "meta": { "author": "claude", "createdAt": "2026-10-11", "calibration": "iqb" }
}
```

```json
{
  "id": "d-rss-1-002",
  "schemaVersion": "1.0",
  "fach": "deutsch",
  "bereich": "rs-strategien",
  "niveau": 1,
  "format": "find-error",
  "status": "draft",
  "prompt": "In diesem Satz ist ein Wort falsch geschrieben. Tippe es an.",
  "payload": {
    "words": [
      { "id": "w1", "text": "Am" }, { "id": "w2", "text": "samstag" }, { "id": "w3", "text": "fahren" },
      { "id": "w4", "text": "wir" }, { "id": "w5", "text": "zum" }, { "id": "w6", "text": "See." }
    ],
    "errorCount": 1
  },
  "solution": { "errorIds": ["w2"], "corrections": { "w2": "Samstag" } },
  "feedback": {
    "correct": "Richtig: Wochentage sind Nomen und werden großgeschrieben.",
    "incorrect": "Suche ein Wort, vor das du 'der', 'die' oder 'das' setzen kannst. Das ist ein Nomen.",
    "misconception": "Wochentage werden oft kleingeschrieben, weil sie nach 'am' stehen."
  },
  "tags": ["grossschreibung", "nomen", "wochentage"],
  "estimatedSeconds": 40,
  "meta": { "author": "claude", "createdAt": "2026-10-11", "calibration": "vera3" }
}
```
