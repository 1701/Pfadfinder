// Invented variants of the format fixtures for cases the base items do not show: sentences and a
// number row to mark, order lists of 3 and 5, money with a comma, spelling items for Vorlesen,
// and segment-text sentences of 4 and 14 words (plus unit "letter", outside VARIANT_ITEMS: the
// validator reports it until its renderer exists). NOT app content – never copy into content/. variants.test.ts keeps them valid.

import type { Item, ItemOf } from '../../src/domain/content';
import { cloneItem } from './builders';
import { clozeSelect, markInText, numberInput, order, segmentText, singleChoice } from './items';

const meta = { author: 'claude', createdAt: '2026-10-25', calibration: 'none' } as const;

/** Sentences as units; the third one is wanted. */
export const markSentences: ItemOf<'mark-in-text'> = {
  ...markInText,
  id: 'd-su-2-901',
  bereich: 'sprache-untersuchen',
  niveau: 2,
  prompt: 'Tippe den Satz an, der sagt, wann der Igel aufwacht.',
  payload: {
    text: 'Der Igel schläft im Winter. Vorher frisst er viel. Im Frühling wacht er auf.',
    unit: 'sentence',
    maxSelect: 1,
  },
  solution: { indices: [2] },
  meta,
};

/** A number row: "15 18" stays two numbers when spoken, never "1518". */
export const markNumbers: ItemOf<'mark-in-text'> = {
  ...markInText,
  id: 'm-ms-2-901',
  fach: 'mathe',
  bereich: 'muster-strukturen',
  niveau: 2,
  prompt: 'Die Zahlen wachsen immer um 5. Tippe die zwei Zahlen an, die nicht passen.',
  payload: { text: '5 10 15 18 20 25 28 30', unit: 'word', maxSelect: 2 },
  solution: { indices: [3, 6] },
  feedback: {
    correct: 'Richtig! 18 und 28 passen nicht in die Reihe.',
    incorrect: 'Rechne immer plus 5: 5, 10, 15, 20 und so weiter.',
    misconception: '18 liegt zwischen 15 und 20, ist aber kein Schritt von 5.',
  },
  tags: ['zahlenfolge'],
  meta,
};

export const MARK_IN_TEXT_ITEMS: ItemOf<'mark-in-text'>[] = [
  markInText,
  markSentences,
  markNumbers,
];

export const orderThree: ItemOf<'order'> = {
  ...order,
  id: 'm-zo-2-902',
  niveau: 2,
  payload: { items: order.payload.items.slice(0, 3) },
  solution: { orderedIds: order.solution.orderedIds.filter((id) => id !== 'd') },
  meta,
};

export const orderFive: ItemOf<'order'> = {
  ...order,
  id: 'm-zo-3-903',
  niveau: 3,
  payload: { items: [...order.payload.items, { id: 'e', text: '4 400' }] },
  solution: { orderedIds: ['b', 'e', 'd', 'a', 'c'] },
  meta,
};

/** 4 404 < 40 404 < 44 004 … : the base fixture with 4, plus lists of 3 and 5. */
export const ORDER_ITEMS: ItemOf<'order'>[] = [orderThree, order, orderFive];

/** Money with a comma (allowDecimal): 2,20 € and 4,55 €; 10 € in a task with cents. */
export const MONEY_ITEMS: ItemOf<'number-input'>[] = [
  {
    ...numberInput,
    id: 'm-gm-1-904',
    bereich: 'groessen-messen',
    stimulus: { text: 'Ben kauft einen Apfel für 0,80 € und ein Brötchen für 1,40 €.' },
    prompt: 'Wie viel bezahlt er?',
    readAloud:
      'Ben kauft einen Apfel für 80 Cent und ein Brötchen für 1 Euro 40. Wie viel bezahlt er?',
    payload: { unit: '€', allowDecimal: true, maxDigits: 4 },
    solution: { value: 2.2 },
    meta,
  },
  {
    ...numberInput,
    id: 'm-gm-1-905',
    bereich: 'groessen-messen',
    stimulus: { text: 'Amira hat 5 €. Sie kauft ein Heft für 0,45 €.' },
    prompt: 'Wie viel Geld hat sie noch?',
    readAloud: 'Amira hat 5 Euro. Sie kauft ein Heft für 45 Cent. Wie viel Geld hat sie noch?',
    payload: { unit: '€', allowDecimal: true, maxDigits: 4 },
    solution: { value: 4.55 },
    meta,
  },
  {
    ...numberInput,
    id: 'm-gm-2-905',
    bereich: 'groessen-messen',
    niveau: 2,
    stimulus: { text: 'Leyla kauft 4 Stifte für je 2,50 €.' },
    prompt: 'Wie viel bezahlt sie?',
    readAloud: 'Leyla kauft 4 Stifte für je 2 Euro 50. Wie viel bezahlt sie?',
    payload: { unit: '€', allowDecimal: true, maxDigits: 4 },
    solution: { value: 10 },
    meta,
  },
];

// -- Spelling (rs-*): misspelled words are never read aloud (2026-10-22) ---------------------

/** Two errors in one sentence: Fahrat → Fahrrad, stet → steht. */
export const findErrorTwo: ItemOf<'find-error'> = {
  id: 'd-rsl-2-901',
  schemaVersion: '1.0',
  fach: 'deutsch',
  bereich: 'rs-laut-buchstabe',
  niveau: 2,
  format: 'find-error',
  status: 'draft',
  prompt: 'In diesem Satz sind zwei Wörter falsch geschrieben. Tippe beide an.',
  payload: {
    words: [
      { id: 'w1', text: 'Mein' },
      { id: 'w2', text: 'Fahrat' },
      { id: 'w3', text: 'stet' },
      { id: 'w4', text: 'im' },
      { id: 'w5', text: 'Keller.' },
    ],
    errorCount: 2,
  },
  solution: { errorIds: ['w2', 'w3'], corrections: { w2: 'Fahrrad', w3: 'steht' } },
  feedback: {
    correct: 'Richtig! Fahrrad hat zwei r, steht ein h.',
    incorrect: 'Sprich jedes Wort langsam. Verlängere: stehen.',
    misconception: 'Das h in steht hört man erst beim Verlängern.',
  },
  tags: ['dehnungs-h', 'doppelkonsonant'],
  estimatedSeconds: 50,
  meta,
};

/** One gap; the options differ only in spelling. */
export const clozeOneGap: ItemOf<'cloze-select'> = {
  ...clozeSelect,
  id: 'd-rsl-2-902',
  niveau: 2,
  prompt: 'Wähle das richtig geschriebene Wort.',
  payload: {
    template: 'Die {1} ist voll.',
    gaps: [{ key: '1', options: ['Tase', 'Tasse', 'Taße'] }],
  },
  solution: { gaps: { '1': 'Tasse' } },
  meta,
};

/** Gap words as options: each reads its readAloud, the whole word. */
export const spellingChoice: ItemOf<'single-choice'> = {
  ...singleChoice,
  id: 'd-rsl-2-903',
  fach: 'deutsch',
  bereich: 'rs-laut-buchstabe',
  stimulus: undefined,
  prompt: 'Wo fehlt ss? Wähle das Wort.',
  payload: {
    options: [
      { id: 'a', text: 'Ta_e', readAloud: 'Tasse' },
      { id: 'b', text: 'Ho_e', readAloud: 'Hose' },
      { id: 'c', text: 'Ro_e', readAloud: 'Rose' },
    ],
  },
  solution: { optionId: 'a' },
  feedback: {
    correct: 'Richtig! Tasse hat ss.',
    incorrect: 'Sprich die Wörter langsam. Nach einem kurzen a hörst du ss.',
    misconception: 'Bei Hose und Rose ist der Vokal lang.',
  },
  tags: ['doppelkonsonant'],
  meta,
};

/** cloze-select outside spelling: in reading it reads its gaps and options as always. */
export const clozeReading: Item = cloneItem(clozeSelect, 'lesen-sachtext', 1, 903);

/** The shortest useful sentence: Mia | liest | ein Buch. (n = 4, so 2 dividers at most.) */
export const segmentShort: ItemOf<'segment-text'> = {
  ...segmentText,
  id: 'd-su-1-911',
  niveau: 1,
  payload: { text: 'Mia liest ein Buch.', unit: 'word' },
  solution: { boundaries: [0, 1] },
  meta,
};

/** 14 words, 85 characters, the guide value of §4.10: Am späten Nachmittag | spielt | … */
export const segmentLong: ItemOf<'segment-text'> = {
  ...segmentText,
  id: 'd-su-2-912',
  payload: {
    text: 'Am späten Nachmittag spielt der kleine braune Hund mit seinem neuen Ball im Garten.',
    unit: 'word',
  },
  solution: { boundaries: [2, 3, 7, 11] },
  meta,
};

/** unit "letter": valid for the schema, an error in integrity.ts until a renderer exists. */
export const segmentLetter: ItemOf<'segment-text'> = {
  ...segmentText,
  id: 'd-su-1-913',
  niveau: 1,
  prompt: 'Trenne das Wort in Silben.',
  payload: { text: 'Sonnenblume', unit: 'letter' },
  solution: { boundaries: [2, 5, 7] },
  meta,
};

export const SEGMENT_TEXT_ITEMS: ItemOf<'segment-text'>[] = [
  segmentText,
  segmentShort,
  segmentLong,
];

export const VARIANT_ITEMS: Item[] = [
  ...MARK_IN_TEXT_ITEMS.slice(1),
  orderThree,
  orderFive,
  ...MONEY_ITEMS,
  findErrorTwo,
  clozeOneGap,
  spellingChoice,
  clozeReading,
  segmentShort,
  segmentLong,
];
