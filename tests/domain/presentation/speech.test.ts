import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Item, ItemOf } from '../../../src/domain/content';
import {
  answersSpeech,
  comparisonSpeech,
  corrections,
  itemSpeech,
  presentedGapOptions,
  presentedMatch,
  presentedOptions,
  presentedOrder,
} from '../../../src/domain/presentation';
import {
  clozeSelect,
  findError,
  markInText,
  match,
  multiChoice,
  numberInput,
  order,
  shortAnswer,
  singleChoice,
} from '../../fixtures/items';

const musterStrukturen = JSON.parse(
  readFileSync('content/items/mathe/muster-strukturen.json', 'utf8'),
) as Item[];
const lautBuchstabe = JSON.parse(
  readFileSync('content/items/deutsch/rs-laut-buchstabe.json', 'utf8'),
) as Item[];

describe('itemSpeech', () => {
  it('reads the task, then the options in the order on screen', () => {
    const shown = presentedOptions(singleChoice, 2).map((o) => `${o.text}.`);
    expect(itemSpeech(singleChoice, 2)).toBe(
      `${singleChoice.stimulus?.text} ${singleChoice.prompt} Antworten: ${shown.join(' ')}`,
    );
  });

  it('adds nothing for number-input', () => {
    expect(itemSpeech(numberInput, 0)).toBe('Rechne aus: 4735 plus 2868');
    expect(answersSpeech(numberInput, 0)).toBe('');
  });

  it('appends the answers to a readAloud variant from the content', () => {
    const item = { ...multiChoice, readAloud: 'Lies vor.' };
    expect(itemSpeech(item, 0).startsWith('Lies vor. Antworten: ')).toBe(true);
  });

  it('makes options speakable and ends each with a pause', () => {
    const item: ItemOf<'single-choice'> = {
      ...singleChoice,
      payload: {
        options: [
          { id: 'a', text: '6 · 40' },
          { id: 'b', text: '10 000' },
          { id: 'c', text: 'Ja!' },
        ],
        keepOrder: true,
      },
      solution: { optionId: 'a' },
    };
    expect(answersSpeech(item, 0)).toBe('Antworten: 6 mal 40. 10000. Ja!');
  });
});

describe('itemSpeech – readAloud on options (schema 1.0.12)', () => {
  it('reads the readAloud of an option as written instead of its text', () => {
    const item: ItemOf<'single-choice'> = {
      ...singleChoice,
      payload: {
        options: [
          { id: 'a', text: 'Ki_en', readAloud: 'Kissen' },
          { id: 'b', text: '6 · 40', readAloud: '6 · 40' },
          { id: 'c', text: '6 · 40' },
        ],
        keepOrder: true,
      },
      solution: { optionId: 'a' },
    };
    expect(answersSpeech(item, 0)).toBe('Antworten: Kissen. 6 · 40. 6 mal 40.');
  });

  it('d-rsl-2-001 reads whole words: "Kissen", no gap', () => {
    const item = lautBuchstabe.find((i) => i.id === 'd-rsl-2-001')!;
    for (const attempt of [0, 1, 2, 3]) {
      const speech = itemSpeech(item, attempt);
      expect(speech).toContain('Kissen');
      expect(speech).not.toContain('_');
    }
  });
});

describe('answersSpeech per format', () => {
  it('match: the rows, then the cards as answers', () => {
    const { left, right } = presentedMatch(match, 1);
    expect(answersSpeech(match, 1)).toBe(
      `${left.map((o) => `${o.text}.`).join(' ')} Antworten: ${right.map((o) => `${o.text}.`).join(' ')}`,
    );
  });

  it('order: the presented order, and the child’s order once it moved something', () => {
    const shown = presentedOrder(order, 0).map((e) => `${e.text.replace(' ', '')}.`);
    expect(answersSpeech(order, 0)).toBe(`Antworten: ${shown.join(' ')}`);
    expect(answersSpeech(order, 0, { orderedIds: ['c', 'a', 'd', 'b'] })).toBe(
      'Antworten: 44004. 40404. 4404. 4044.',
    );
  });

  it('cloze-select: the sentence with numbered gaps, then the options of each gap', () => {
    const options = presentedGapOptions(clozeSelect, 0);
    expect(answersSpeech(clozeSelect, 0)).toBe(
      `Im Winter ist es oft Lücke 1. Der Lücke 2 spielt im Schnee. ` +
        `Antworten für Lücke 1: ${options['1']?.join(', ')}. Antworten für Lücke 2: ${options['2']?.join(', ')}.`,
    );
  });

  it('mark-in-text: words joined with commas, punctuation dropped', () => {
    expect(answersSpeech(markInText, 0)).toBe(
      'Antworten: Am, Morgen, packt, der, Junge, seinen, Rucksack.',
    );
  });

  it('mark-in-text: a number row stays separate numbers ("100 200" is not 100200)', () => {
    const row = musterStrukturen.find((i) => i.id === 'm-ms-3-001')!;
    expect(answersSpeech(row, 0)).toBe('Antworten: 100, 200, 300, 350, 400, 500, 650, 700.');
  });

  it('find-error: the words of the sentence', () => {
    expect(answersSpeech(findError, 0)).toBe('Antworten: Am, samstag, fahren, wir, zum, See.');
  });

  it('short-answer: the tip, no answers', () => {
    expect(answersSpeech(shortAnswer, 0)).toBe('Tipp: Denk an die Seiten des Würfels.');
    const noHint = { ...shortAnswer, payload: { maxChars: 200 } };
    expect(answersSpeech(noHint, 0)).toBe('');
  });
});

describe('comparisonSpeech', () => {
  it('reads the question, the model answer and the key points', () => {
    expect(comparisonSpeech(shortAnswer)).toBe(
      'Hast du es getroffen? So könnte es aussehen: Nein. Eine 6 ist möglich, weil der Würfel eine Seite mit 6 Augen hat. ' +
        'Darauf kommt es an: Ben hat nicht recht. Der Würfel hat eine Seite mit 6 Augen.',
    );
  });
});

describe('corrections', () => {
  it('lists the correct spelling of every error in sentence order', () => {
    expect(corrections(findError)).toBe('Samstag');
    const two: ItemOf<'find-error'> = {
      ...findError,
      payload: { ...findError.payload, errorCount: 2 },
      solution: { errorIds: ['w3', 'w2'], corrections: { w2: 'Samstag', w3: 'fahrn' } },
    };
    expect(corrections(two)).toBe('Samstag, fahrn');
  });
});
