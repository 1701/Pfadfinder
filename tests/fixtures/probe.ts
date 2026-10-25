// Seven invented items, one per format whose renderer tests used to read a real item from
// content/ (task F). NOT app content – never copy into content/. probe.test.ts keeps them valid
// content (0 errors, 0 warnings); the renderer, screen and print tests run on them.

import type { ItemOf } from '../../src/domain/content';

const meta = { author: 'claude', createdAt: '2026-10-25', calibration: 'none' } as const;

/** 4 short options (two columns), 2 right: a and b. */
export const probeMultiChoice: ItemOf<'multi-choice'> = {
  id: 'm-dz-2-901',
  schemaVersion: '1.0',
  fach: 'mathe',
  bereich: 'daten-zufall',
  niveau: 2,
  format: 'multi-choice',
  status: 'draft',
  stimulus: { text: 'Lena hat 12 Murmeln, Tom hat 8 und Ida hat 15.' },
  prompt: 'Welche Sätze stimmen? Wähle 2 aus.',
  payload: {
    options: [
      { id: 'a', text: 'Ida hat die meisten.' },
      { id: 'b', text: 'Tom hat die wenigsten.' },
      { id: 'c', text: 'Lena hat mehr als Ida.' },
      { id: 'd', text: 'Zusammen sind es 30.' },
    ],
    minSelect: 2,
  },
  solution: { optionIds: ['a', 'b'] },
  feedback: {
    correct: 'Genau! Ida hat 15, Tom nur 8.',
    incorrect: 'Vergleiche die drei Zahlen. Rechne für den letzten Satz alle zusammen.',
    misconception: '12 + 8 + 15 sind 35, nicht 30.',
  },
  tags: ['vergleichen', 'daten'],
  estimatedSeconds: 60,
  meta,
};

/** 4 pairs and one distractor (r3); the rows in solution order. */
export const probeMatch: ItemOf<'match'> = {
  id: 'm-rf-1-901',
  schemaVersion: '1.0',
  fach: 'mathe',
  bereich: 'raum-form',
  niveau: 1,
  format: 'match',
  status: 'draft',
  prompt: 'Ordne jeder Figur zu, was für sie gilt.',
  payload: {
    left: [
      { id: 'l1', text: 'Quadrat' },
      { id: 'l2', text: 'Kreis' },
      { id: 'l3', text: 'Dreieck' },
      { id: 'l4', text: 'Rechteck' },
    ],
    right: [
      { id: 'r1', text: '3 Ecken und 3 Seiten' },
      { id: 'r2', text: '4 gleich lange Seiten' },
      { id: 'r3', text: '5 Ecken und 5 Seiten' },
      { id: 'r4', text: 'rund, ohne Ecke' },
      { id: 'r5', text: '2 lange und 2 kurze Seiten' },
    ],
  },
  solution: {
    pairs: [
      ['l1', 'r2'],
      ['l2', 'r4'],
      ['l3', 'r1'],
      ['l4', 'r5'],
    ],
  },
  feedback: {
    correct: 'Super! Du kennst die Figuren.',
    incorrect: 'Zähle bei jeder Figur die Ecken. Prüfe dann, ob die Seiten gleich lang sind.',
    misconception: 'Ein Quadrat ist ein Rechteck mit 4 gleich langen Seiten.',
  },
  tags: ['figuren', 'eigenschaften'],
  estimatedSeconds: 75,
  meta,
};

/** 4 lengths, delivered unsorted. */
export const probeOrder: ItemOf<'order'> = {
  id: 'm-gm-1-902',
  schemaVersion: '1.0',
  fach: 'mathe',
  bereich: 'groessen-messen',
  niveau: 1,
  format: 'order',
  status: 'draft',
  prompt: 'Ordne die Längen. Die kürzeste zuerst.',
  payload: {
    items: [
      { id: 'a', text: '1 m' },
      { id: 'b', text: '80 cm' },
      { id: 'c', text: '1 km' },
      { id: 'd', text: '5 mm' },
    ],
  },
  solution: { orderedIds: ['d', 'b', 'a', 'c'] },
  feedback: {
    correct: 'Richtig: 5 mm, 80 cm, 1 m, 1 km.',
    incorrect: 'Rechne alles in dieselbe Einheit um. 1 m sind 100 cm.',
    misconception: '80 ist mehr als 1, aber 80 cm sind weniger als 1 m.',
  },
  tags: ['laengen', 'ordnen'],
  estimatedSeconds: 60,
  meta,
};

/** Two gaps with numbers; a group separator in gap 1 ("3 000"). */
export const probeClozeSelect: ItemOf<'cloze-select'> = {
  id: 'm-gm-2-901',
  schemaVersion: '1.0',
  fach: 'mathe',
  bereich: 'groessen-messen',
  niveau: 2,
  format: 'cloze-select',
  status: 'draft',
  prompt: 'Wähle in jeder Lücke die passende Zahl.',
  payload: {
    template: '3 kg sind {1} g. Ein Stuhl hat {2} Beine.',
    gaps: [
      { key: '1', options: ['300', '3 000', '30'] },
      { key: '2', options: ['3', '4', '6'] },
    ],
  },
  solution: { gaps: { '1': '3 000', '2': '4' } },
  feedback: {
    correct: 'Genau: 1 kg sind 1 000 g.',
    incorrect: 'Ein Kilogramm hat 1 000 Gramm. Also haben 3 kg dreimal so viel.',
    misconception: 'Viele rechnen mit 100 statt mit 1 000.',
  },
  tags: ['gewicht', 'umrechnen'],
  estimatedSeconds: 60,
  meta,
};

/** Words in lower case; the nouns are garten (1), tim (3) and hund (6). */
export const probeMarkInText: ItemOf<'mark-in-text'> = {
  id: 'd-su-1-901',
  schemaVersion: '1.0',
  fach: 'deutsch',
  bereich: 'sprache-untersuchen',
  niveau: 1,
  format: 'mark-in-text',
  status: 'draft',
  prompt: 'Tippe alle Nomen an.',
  payload: { text: 'im garten spielt tim mit seinem hund', unit: 'word', maxSelect: 3 },
  solution: { indices: [1, 3, 6] },
  feedback: {
    correct: 'Richtig! Garten, Tim und Hund sind Nomen.',
    incorrect: "Setze 'der', 'die' oder 'das' davor. Passt es, ist das Wort ein Nomen.",
    misconception: 'Auch Namen wie Tim sind Nomen.',
  },
  tags: ['nomen', 'wortarten'],
  estimatedSeconds: 45,
  meta,
};

/** One error: montag (w2) → Montag. */
export const probeFindError: ItemOf<'find-error'> = {
  id: 'd-rss-1-903',
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
      { id: 'w2', text: 'montag' },
      { id: 'w3', text: 'gehen' },
      { id: 'w4', text: 'wir' },
      { id: 'w5', text: 'schwimmen.' },
    ],
    errorCount: 1,
  },
  solution: { errorIds: ['w2'], corrections: { w2: 'Montag' } },
  feedback: {
    correct: 'Richtig: Wochentage sind Nomen.',
    incorrect: "Suche ein Wort, vor das du 'der' setzen kannst. Das schreibst du groß.",
    misconception: "Nach 'am' wird der Wochentag trotzdem großgeschrieben.",
  },
  tags: ['grossschreibung', 'wochentage'],
  estimatedSeconds: 40,
  meta,
};

/** maxChars 80, a tip, three key points. */
export const probeShortAnswer: ItemOf<'short-answer'> = {
  id: 'm-dz-3-902',
  schemaVersion: '1.0',
  fach: 'mathe',
  bereich: 'daten-zufall',
  niveau: 3,
  format: 'short-answer',
  status: 'draft',
  stimulus: { text: 'In einer Tüte sind 3 rote und 5 blaue Murmeln. Jonas zieht ohne hinzusehen.' },
  prompt: 'Welche Farbe zieht Jonas eher? Begründe.',
  payload: { maxChars: 80, hint: 'Vergleiche, wie viele Murmeln es von jeder Farbe gibt.' },
  solution: {
    model: 'Eher Blau, weil es mehr blaue als rote Murmeln gibt.',
    keyPoints: ['Blau ist wahrscheinlicher', 'Es gibt mehr blaue Murmeln', 'Rot bleibt möglich'],
  },
  feedback: {
    correct: 'Gut begründet! Mehr blaue Murmeln heißt: Blau ist wahrscheinlicher.',
    incorrect: 'Zähle die Murmeln jeder Farbe. Von der Farbe mit mehr Murmeln ziehst du eher.',
    misconception: 'Rot ist nicht unmöglich, nur weniger wahrscheinlich.',
  },
  tags: ['wahrscheinlichkeit', 'begruenden'],
  estimatedSeconds: 90,
  meta,
};

export const PROBE_ITEMS = [
  probeMultiChoice,
  probeMatch,
  probeOrder,
  probeClozeSelect,
  probeMarkInText,
  probeFindError,
  probeShortAnswer,
] as const;
