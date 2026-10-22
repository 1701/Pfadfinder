# CONTENT_SCHEMA.md – Item-Format und Autorenregeln

Status: v1.0.19 **eingefroren** für das MVP · Änderungen nur mit Versionssprung und Eintrag in `CHANGELOG.md`
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

Item-ID: `{fach}-{bereich}-{niveau}-{laufnr}` – z. B. `m-zo-2-014`, `d-rsl-1-003`. IDs sind stabil und werden nie wiederverwendet (gelöschte Items bekommen `status: "retired"`, bleiben in der Datei).

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

## 3. Item (gemeinsame Felder)

```ts
type Item = {
  id: string;                       // s. o.
  schemaVersion: "1.0";
  fach: "mathe" | "deutsch";
  bereich: Bereich;                 // Kürzel-Langform, z. B. "zahlen-operationen"
  niveau: 1 | 2 | 3;                // IQB: I Reproduzieren, II Zusammenhänge, III Reflektieren
  format: Format;                   // s. Abschnitt 4
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
    calibration?: "original-2024" | "iqb" | "vera3" | "none";  // woran orientiert
    pilotNote?: string;             // Beobachtung aus dem Papier-Pilot
  };
};
```

## 4. Formate: Payload und Solution

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

## 5. ReadingText

```ts
type ReadingText = {
  id: string;                        // t-sach-001 | t-lit-001
  kind: "sachtext" | "literarisch";
  title: string;
  wordCount: number;                 // 150–250 (MVP)
  paragraphs: string[];              // je Absatz ein String; Absätze werden nummeriert; Items verweisen auf Absätze, nie auf Zeilen
  readAloud: boolean;                // true: Vorlesen erlaubt im Üben-Modus; im Probetest immer aus
  itemIds: string[];                 // 4–6 Items, die diesen Text referenzieren, aufsteigend nach Niveau
};
```

## 6. Probetest

```ts
type Probetest = {
  id: string;                        // mathe-01
  fach: "mathe" | "deutsch";
  durationMinutes: 45;
  itemIds: string[];                 // feste Reihenfolge, 18–24 Items; Deutsch mit genau 2 Texten (aus den textRefs, kein eigenes Feld)
  niveauMix: { 1: number; 2: number; 3: number };   // Soll: 0.4 / 0.4 / 0.2, wird validiert (±1 Item)
  bereichMix: Record<Bereich, number>;              // jeder Bereich ≥ 2 Items
};
```

Regeln:
- Zeit (Mathe seit 1.0.9, Deutsch seit 1.0.16): **Mathe 24–32 Min.** Summe `estimatedSeconds` bei 18–24 Items. **Deutsch 24–32 Min.** bei 18–24 Items und genau 2 Texten: Summe `estimatedSeconds` der Items plus Lesezeit je referenziertem Text = `wordCount` × 0,75 s (80 Wörter/Min.). Grund: Die Item-Uhr startet nach dem Lese-Screen, die Lesezeit steckt in keinem Item. Der Timer bleibt 45 Min.: Die `estimatedSeconds` sind App-Zeiten, das Papier-Original rechnet zusätzlich mit Lesen und Schreiben auf Papier (etwa 110 s je Aufgabe). Wer früher fertig ist, gibt früher ab, wie im Original.
- kein `short-answer`-Anteil über 15 %
- Deutsch beginnt mit Lesen, endet mit Rechtschreibung (wie das Original)
- Deutsch (seit 1.0.16): Die Texte ergeben sich aus den `textRef`s der Items. Genau 2 Texte, ein Sachtext und ein literarischer (verschiedene `kind`). Die Items eines Textes stehen zusammen, weil der Lese-Screen einmal vor dem ersten Item eines Textes kommt. Kein Item ohne `textRef` steht vor einem Item mit `textRef`. Alles sind Fehler im Validator

## 7. Autorenregeln (gelten für jeden Batch)

**Sprache**
- Sätze ≤ 15 Wörter, kein Passiv, keine Nebensatzketten, keine Fremdwörter ohne Not
- Anweisung immer als Imperativ in Du-Form: "Rechne aus.", "Kreuze an."
- Mathe-Texte dürfen keine Lesehürde sein: wenn der Text schwerer ist als die Mathematik, ist das Item falsch gebaut
- Vornamen gemischt und alltagsnah (Mia, Elias, Amira, Jonas, Leyla, Ben), keine Marken, keine Religion/Politik/Gewalt, kein Essen als Belohnung

**Mathematik**
- Zahlenraum bis 1.000.000, schriftliche Verfahren mit Übertrag, Geld in € und ct, Zeit in h/min, Längen mm–km, Gewicht g–kg–t
- Distraktoren sind *echte* Fehlwege (Zahlendreher, vergessener Übertrag, falsche Einheit, "Anzahl statt Position"), nie Zufallszahlen
- Sachaufgaben enthalten nie überflüssige Zahlen auf Niveau I; ab Niveau II gezielt eine Ablenkzahl
- Mehrere Gleichungen nie durch Komma trennen (Verwechslung mit Dezimalkomma); mit „und“ oder als eigene Sätze

**Deutsch**
- Lesetexte altersgerecht, abgeschlossen, mit klarem Kern; Items dazu steigen im Niveau: Entnehmen (I) → Verknüpfen (II) → Deuten/Begründen (III)
- Items zu einem Lesetext verweisen auf Absätze („Lies Absatz 3.“), nie auf Zeilen (§5); `mark-in-text` dazu mit höchstens 4 Sätzen und 200 Zeichen (§4.7), `order` mit höchstens 4 Elementen zu je 30 Zeichen (§4.5), `short-answer` mit `model` bis 90 Zeichen, höchstens 2 `keyPoints` und Rückmeldung (incorrect + misconception) bis 150 Zeichen (§4.9), `single-choice` mit zitiertem `stimulus.text` mit höchstens 3 Optionen (§4.1), `multi-choice` mit 5 Optionen nur bei `prompt` bis 60 Zeichen (§4.2), `match` mit höchstens 3 Paaren, Kartentexten zusammen bis 140 Zeichen und `prompt` bis 60 Zeichen (§4.4). Grundlage ist die Luft über dem Band in allen vier Viewports (mindestens 18 px); darüber ist nichts gemessen. Der Validator warnt nur
- Rechtschreibung nur mit Grundschul-Regelwissen lösbar (Verlängern, Ableiten, Silben, Wortbausteine, Groß-/Kleinschreibung); keine Ausnahmewörter als Fehlerquelle
- Falsch geschriebene Wörter werden nie vorgelesen. Bei find-error und cloze-select in den RS-Bereichen liest die App den Satz in richtiger Schreibung aus solution und keine Optionen (Code). Choice-Optionen mit Fehlschreibung tragen ein readAloud mit der korrekten Schreibung. Ein Stimulus mit Fehlschreibung bekommt ein Item-readAloud mit richtiger Schreibung. Der Validator prüft das nicht (seit 1.0.19)
- `find-error` enthält pro Satz nur Fehlertypen eines Bereichs

**Niveau**
- I: ein Schritt, bekanntes Verfahren
- II: zwei Schritte, oder zwei Informationen aus Tabelle/Text/Bild verknüpfen
- III: begründen, Fehler in fremder Lösung finden, Regel übertragen
- Zielverteilung je Bereich im Pool: 12 / 12 / 6 (bei 30 Items)

**Kalibrierung Mathe (Pilot Oktober 2026)**
- Kompass 4 kommt nach etwa 10 Schulwochen Klasse 4
- I: sicher bis Ende Klasse 3 unterrichtet: Zahlenraum 1 000, schriftlich dreistellig, Einmaleins, Daten ablesen, sicher/möglich/unmöglich
- II: vierstellig, Überschlag, zwei Werte verknüpfen
- III: Zehntausender und größer, Begründen, Fehler in fremder Darstellung finden

**Feedback**
- `incorrect` erklärt den Weg, verrät nicht nur das Ergebnis
- `misconception` benennt den wahrscheinlichsten Fehler des gewählten Distraktors (bei MC) oder des Formats
- Ton: freundlich, sachlich, nie ironisch, nie "leider"

**Bilder (`content/assets/svg`)**
- Die App bettet jedes SVG direkt in die Seite ein. Deshalb gilt, geprüft von `npm run content:validate`: `<svg>` mit `viewBox`; kein `<script>`, `<foreignObject>`, `<style>`, `<image>`, `<iframe>`; keine Event-Attribute (`onload` …); keine Verweise (`href`, `url()`); kein `style`-Attribut
- Farben nur `currentColor` oder `none` (Abstufung über `fill-opacity`/`stroke-opacity`), Schrift nur `font-family="inherit"`. So übernimmt das Bild Tinte und Andika und druckt schwarz auf weiß
- Höhe im Aufgabenblatt: 200 px quer (auf kurzen Bildschirmen bis etwa 144 px), 240 px hoch. Bilder bis zum Seitenverhältnis 2 : 1 stehen neben dem Text, breitere darunter
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
