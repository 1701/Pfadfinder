// Test fixtures, one valid item per format. NOT app content – never copy into content/.
// The three examples from CONTENT_SCHEMA.md §8 are reproduced verbatim; the others use
// laufnr 9xx so they can never be confused with real items.

import type { Item, ItemOf, ReadingText } from '../../src/domain/content';

const meta = { author: 'claude', createdAt: '2026-10-11', calibration: 'none' } as const;

export const singleChoice: ItemOf<'single-choice'> = {
  id: 'm-gm-2-004',
  schemaVersion: '1.0',
  fach: 'mathe',
  bereich: 'groessen-messen',
  niveau: 2,
  format: 'single-choice',
  status: 'draft',
  stimulus: {
    text: 'Leyla kauft 3 Hefte für je 1,20 € und einen Füller für 8,50 €. Sie bezahlt mit einem 20-Euro-Schein.',
  },
  prompt: 'Wie viel Geld bekommt sie zurück?',
  payload: {
    options: [
      { id: 'a', text: '7,90 €' },
      { id: 'b', text: '10,30 €' },
      { id: 'c', text: '8,10 €' },
      { id: 'd', text: '12,10 €' },
    ],
  },
  solution: { optionId: 'a' },
  feedback: {
    correct: 'Genau: 3 · 1,20 € = 3,60 €, plus 8,50 € sind 12,10 €. 20 € − 12,10 € = 7,90 €.',
    incorrect: 'Rechne erst alles zusammen, was Leyla kauft. Dann ziehe das von 20 € ab.',
    misconception: 'Wer 12,10 € wählt, hat den Preis ausgerechnet, aber das Rückgeld vergessen.',
  },
  tags: ['geld', 'sachaufgabe', 'zweischrittig'],
  estimatedSeconds: 90,
  meta: { author: 'claude', createdAt: '2026-10-11', calibration: 'iqb' },
};

export const multiChoice: ItemOf<'multi-choice'> = {
  id: 'm-zo-1-901',
  schemaVersion: '1.0',
  fach: 'mathe',
  bereich: 'zahlen-operationen',
  niveau: 1,
  format: 'multi-choice',
  status: 'draft',
  prompt: 'Welche Zahlen kann man ohne Rest durch 5 teilen? Tippe alle richtigen an.',
  payload: {
    options: [
      { id: 'a', text: '35' },
      { id: 'b', text: '52' },
      { id: 'c', text: '120' },
      { id: 'd', text: '505' },
      { id: 'e', text: '74' },
    ],
    minSelect: 3,
  },
  solution: { optionIds: ['a', 'c', 'd'] },
  feedback: {
    correct: 'Richtig! Zahlen mit 0 oder 5 am Ende kann man durch 5 teilen.',
    incorrect: 'Schau auf die letzte Ziffer. Steht dort eine 0 oder eine 5, geht die Zahl durch 5.',
    misconception: 'Bei 52 steht die 5 vorne. Es zählt aber nur die letzte Ziffer.',
  },
  tags: ['teilbarkeit', 'endziffernregel'],
  estimatedSeconds: 45,
  meta,
};

export const numberInput: ItemOf<'number-input'> = {
  id: 'm-zo-1-001',
  schemaVersion: '1.0',
  fach: 'mathe',
  bereich: 'zahlen-operationen',
  niveau: 1,
  format: 'number-input',
  status: 'draft',
  prompt: 'Rechne aus: 4 735 + 2 868',
  readAloud: 'Rechne aus: 4735 plus 2868',
  payload: { maxDigits: 5 },
  solution: { value: 7603 },
  feedback: {
    correct: 'Richtig! Du hast an jeder Stelle den Übertrag mitgenommen.',
    incorrect:
      'Rechne stellenweise von rechts: 5 + 8 = 13, die 1 wandert zur nächsten Stelle. Prüfe jede Stelle so.',
    misconception: 'Viele vergessen den Übertrag in die Hunderterstelle.',
  },
  tags: ['schriftliche-addition', 'uebertrag'],
  estimatedSeconds: 60,
  meta: { author: 'claude', createdAt: '2026-10-11', calibration: 'original-2024' },
};

export const match: ItemOf<'match'> = {
  id: 'm-gm-1-901',
  schemaVersion: '1.0',
  fach: 'mathe',
  bereich: 'groessen-messen',
  niveau: 1,
  format: 'match',
  status: 'draft',
  prompt: 'Was ist gleich lang? Ordne zu.',
  payload: {
    left: [
      { id: 'l1', text: '1 km' },
      { id: 'l2', text: '1 m' },
      { id: 'l3', text: '1 cm' },
    ],
    right: [
      { id: 'r1', text: '100 cm' },
      { id: 'r2', text: '10 mm' },
      { id: 'r3', text: '1000 m' },
      { id: 'r4', text: '100 m' },
    ],
  },
  solution: {
    pairs: [
      ['l1', 'r3'],
      ['l2', 'r1'],
      ['l3', 'r2'],
    ],
  },
  feedback: {
    correct: 'Super! 1 km = 1000 m, 1 m = 100 cm und 1 cm = 10 mm.',
    incorrect:
      'Ein Kilometer hat 1000 Meter. Ein Meter hat 100 Zentimeter, ein Zentimeter 10 Millimeter.',
    misconception: 'Viele denken, 1 km sind 100 m.',
  },
  tags: ['laengen', 'umrechnen'],
  estimatedSeconds: 60,
  meta,
};

export const order: ItemOf<'order'> = {
  id: 'm-zo-1-902',
  schemaVersion: '1.0',
  fach: 'mathe',
  bereich: 'zahlen-operationen',
  niveau: 1,
  format: 'order',
  status: 'draft',
  prompt: 'Ordne die Zahlen. Beginne mit der kleinsten Zahl.',
  payload: {
    items: [
      { id: 'a', text: '40 404' },
      { id: 'b', text: '4 044' },
      { id: 'c', text: '44 004' },
      { id: 'd', text: '4 404' },
    ],
  },
  solution: { orderedIds: ['b', 'd', 'a', 'c'] },
  feedback: {
    correct: 'Richtig! Du hast zuerst die Stellen gezählt und dann von vorne verglichen.',
    incorrect:
      'Zähle zuerst die Stellen. Bei gleich vielen Stellen vergleichst du Ziffer für Ziffer von links.',
    misconception: 'Viele schauen nur auf die erste Ziffer und vergessen, die Stellen zu zählen.',
  },
  tags: ['stellenwert', 'zahlen-vergleichen'],
  estimatedSeconds: 60,
  meta,
};

export const clozeSelect: ItemOf<'cloze-select'> = {
  id: 'd-rsl-1-901',
  schemaVersion: '1.0',
  fach: 'deutsch',
  bereich: 'rs-laut-buchstabe',
  niveau: 1,
  format: 'cloze-select',
  status: 'draft',
  prompt: 'Wähle für jede Lücke das richtig geschriebene Wort.',
  payload: {
    template: 'Im Winter ist es oft {1}. Der {2} spielt im Schnee.',
    gaps: [
      { key: '1', options: ['kalt', 'kald', 'kallt'] },
      { key: '2', options: ['Hunt', 'Hund', 'Hundt'] },
    ],
  },
  solution: { gaps: { '1': 'kalt', '2': 'Hund' } },
  feedback: {
    correct: 'Richtig! Du hast die Wörter verlängert: kälter, die Hunde.',
    incorrect:
      'Verlängere das Wort: kalt – kälter, Hund – die Hunde. Dann hörst du den richtigen Buchstaben.',
    misconception: 'Am Wortende klingen d und t gleich.',
  },
  tags: ['auslautverhaertung', 'verlaengern'],
  estimatedSeconds: 45,
  meta,
};

export const markInText: ItemOf<'mark-in-text'> = {
  id: 'd-rss-1-901',
  schemaVersion: '1.0',
  fach: 'deutsch',
  bereich: 'rs-strategien',
  niveau: 1,
  format: 'mark-in-text',
  status: 'draft',
  prompt: 'Tippe alle Nomen an.',
  payload: { text: 'Am Morgen packt der Junge seinen Rucksack.', unit: 'word', maxSelect: 3 },
  solution: { indices: [1, 4, 6] },
  feedback: {
    correct: 'Richtig! Morgen, Junge und Rucksack sind Nomen.',
    incorrect: "Setze 'der', 'die' oder 'das' davor. Passt es, ist das Wort ein Nomen.",
    misconception: 'Das erste Wort im Satz ist groß, aber kein Nomen.',
  },
  tags: ['grossschreibung', 'nomen'],
  estimatedSeconds: 40,
  meta,
};

export const findError: ItemOf<'find-error'> = {
  id: 'd-rss-1-002',
  schemaVersion: '1.0',
  fach: 'deutsch',
  bereich: 'rs-strategien',
  niveau: 1,
  format: 'find-error',
  status: 'draft',
  prompt: 'In diesem Satz ist ein Wort falsch geschrieben. Tippe es an.',
  payload: {
    words: [
      { id: 'w1', text: 'Am' },
      { id: 'w2', text: 'samstag' },
      { id: 'w3', text: 'fahren' },
      { id: 'w4', text: 'wir' },
      { id: 'w5', text: 'zum' },
      { id: 'w6', text: 'See.' },
    ],
    errorCount: 1,
  },
  solution: { errorIds: ['w2'], corrections: { w2: 'Samstag' } },
  feedback: {
    correct: 'Richtig: Wochentage sind Nomen und werden großgeschrieben.',
    incorrect:
      "Suche ein Wort, vor das du 'der', 'die' oder 'das' setzen kannst. Das ist ein Nomen.",
    misconception: "Wochentage werden oft kleingeschrieben, weil sie nach 'am' stehen.",
  },
  tags: ['grossschreibung', 'nomen', 'wochentage'],
  estimatedSeconds: 40,
  meta: { author: 'claude', createdAt: '2026-10-11', calibration: 'vera3' },
};

export const shortAnswer: ItemOf<'short-answer'> = {
  id: 'm-dz-3-901',
  schemaVersion: '1.0',
  fach: 'mathe',
  bereich: 'daten-zufall',
  niveau: 3,
  format: 'short-answer',
  status: 'draft',
  stimulus: { text: "Ben sagt: 'Beim Würfeln ist eine 6 unmöglich.'" },
  prompt: 'Hat Ben recht? Begründe.',
  payload: { maxChars: 200, hint: 'Denk an die Seiten des Würfels.' },
  solution: {
    model: 'Nein. Eine 6 ist möglich, weil der Würfel eine Seite mit 6 Augen hat.',
    keyPoints: ['Ben hat nicht recht.', 'Der Würfel hat eine Seite mit 6 Augen.'],
  },
  feedback: {
    correct: 'Gut begründet! Eine 6 ist möglich, aber nicht sicher.',
    incorrect: 'Schau dir einen Würfel an. Eine Seite hat 6 Augen, also kann die 6 fallen.',
    misconception: "Viele verwechseln 'selten' mit 'unmöglich'.",
  },
  tags: ['wahrscheinlichkeit', 'moeglich-unmoeglich', 'begruenden'],
  estimatedSeconds: 120,
  meta,
};

export const validItemsByFormat: { [F in Item['format']]: ItemOf<F> } = {
  'single-choice': singleChoice,
  'multi-choice': multiChoice,
  'number-input': numberInput,
  match,
  order,
  'cloze-select': clozeSelect,
  'mark-in-text': markInText,
  'find-error': findError,
  'short-answer': shortAnswer,
};

export const sachtext: ReadingText = {
  id: 't-sach-901',
  kind: 'sachtext',
  title: 'Der Igel im Winter',
  wordCount: 152,
  paragraphs: [
    'Igel sind kleine Säugetiere mit vielen Stacheln. Ein erwachsener Igel hat etwa 7000 Stacheln auf dem Rücken. Wenn er Angst hat, rollt er sich zu einer Kugel zusammen. So schützt er seinen weichen Bauch. Igel sind vor allem nachts unterwegs.',
    'Im Herbst frisst der Igel besonders viel. Er sucht Käfer, Würmer und Schnecken. Dabei wird er immer dicker. Das Fett braucht er für den Winter. Ein Igel muss vor dem Winter mindestens 500 Gramm wiegen.',
    'Wenn es kalt wird, baut der Igel ein Nest aus Laub. Oft liegt es unter einer Hecke oder in einem Haufen aus Ästen. Dort hält er Winterschlaf. Sein Herz schlägt dann sehr langsam. Auch sein Körper wird kühl.',
    'Im Frühling wacht der Igel wieder auf. Er ist dann dünn und hungrig. Jetzt sucht er sofort nach Futter. Wer einen Garten hat, kann Igeln helfen. Ein Laubhaufen in einer ruhigen Ecke ist ein guter Platz für ein Winternest.',
  ],
  readAloud: true,
  itemIds: ['d-lsa-1-901', 'd-lsa-1-902', 'd-lsa-2-901', 'd-lsa-2-902', 'd-lsa-3-901'],
};
