import { describe, expect, it } from 'vitest';
import { readAloudText, type ItemOf } from '../../../src/domain/content';
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
import { cloneItem } from '../../fixtures/builders';
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
import { probeClozeSelect, probeFindError } from '../../fixtures/probe';
import {
  clozeOneGap,
  clozeReading,
  findErrorTwo,
  markNumbers,
  spellingChoice,
} from '../../fixtures/variants';

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

  it('a spelling item with gap words reads whole words: "Tasse", no gap', () => {
    for (const attempt of [0, 1, 2, 3]) {
      const speech = itemSpeech(spellingChoice, attempt);
      expect(speech).toContain('Tasse');
      expect(speech).not.toContain('_');
    }
  });
});

describe('itemSpeech – misspelled words are never read aloud (2026-10-22)', () => {
  it('find-error with one error: the sentence with the correction, no answers', () => {
    expect(itemSpeech(probeFindError, 0)).toBe(
      'In diesem Satz ist ein Wort falsch geschrieben. Tippe es an. Am Montag gehen wir schwimmen.',
    );
  });

  it('find-error with two errors: both corrections in place', () => {
    expect(itemSpeech(findErrorTwo, 0)).toBe(
      'In diesem Satz sind zwei Wörter falsch geschrieben. Tippe beide an. ' +
        'Mein Fahrrad steht im Keller.',
    );
  });

  it('cloze-select with one gap: the solved sentence, no gap and no options', () => {
    for (const attempt of [0, 1, 2, 3]) {
      expect(itemSpeech(clozeOneGap, attempt)).toBe(
        'Wähle das richtig geschriebene Wort. Die Tasse ist voll.',
      );
    }
  });

  it('cloze-select with two gaps: both solutions in place', () => {
    expect(itemSpeech(clozeSelect, 1)).toBe(
      'Wähle für jede Lücke das richtig geschriebene Wort. Im Winter ist es oft kalt. Der Hund spielt im Schnee.',
    );
  });

  it('cloze-select in maths and reading still reads the gaps and their options', () => {
    for (const item of [probeClozeSelect, clozeReading]) {
      const speech = itemSpeech(item, 0);
      expect(speech).toBe(`${readAloudText(item)} ${answersSpeech(item, 0)}`);
      expect(speech).toContain('Lücke 1');
      expect(speech).toContain('Antworten für Lücke 1:');
    }
  });

  it('spelling items of other formats still append their answers', () => {
    const item = spellingChoice;
    expect(itemSpeech(item, 0)).toBe(`${readAloudText(item)} ${answersSpeech(item, 0)}`);
    expect(itemSpeech(item, 0)).toContain('Antworten:');
  });

  it('reads the options of find-error and cloze-select in sprache-untersuchen (not spelling)', () => {
    for (const base of [findError, clozeSelect]) {
      const item = cloneItem(base, 'sprache-untersuchen', base.niveau, 900);
      expect(itemSpeech(item, 0)).toBe(`${readAloudText(item)} ${answersSpeech(item, 0)}`);
      // The same item in a spelling area reads the corrected sentence instead.
      expect(itemSpeech(base, 0)).not.toBe(itemSpeech(item, 0));
    }
  });

  it('drops the sentence when a correction or a gap solution is missing', () => {
    const noCorrection = {
      ...probeFindError,
      solution: { ...probeFindError.solution, corrections: {} },
    };
    expect(itemSpeech(noCorrection, 0)).toBe(readAloudText(probeFindError));

    const noGap = { ...clozeSelect, solution: { gaps: { '1': 'kalt' } } };
    expect(itemSpeech(noGap, 0)).toBe(readAloudText(clozeSelect));
  });

  // That every spelling item of the pool has its corrections and no misspelled word in its own
  // text is a pool rule (integrity.ts); here: the speech of each spelling form.
  it('none of the spelling forms speaks a misspelled word', () => {
    const spelling = [findError, probeFindError, findErrorTwo, clozeSelect, clozeOneGap];
    for (const item of spelling) {
      const wrong =
        item.format === 'find-error'
          ? item.payload.words
              .filter((w) => item.solution.errorIds.includes(w.id))
              .map((w) => w.text)
          : item.payload.gaps.flatMap((g) =>
              g.options.filter((o) => o !== item.solution.gaps[g.key]),
            );
      for (const attempt of [0, 1, 2, 3]) {
        const speech = itemSpeech(item, attempt);
        expect(speech).not.toContain('Antworten');
        expect(speech).not.toContain('Lücke 1');
        for (const word of wrong) {
          expect(speech, `${item.id}: ${word}`).not.toMatch(
            new RegExp(`(^|[^\\p{L}])${word}([^\\p{L}]|$)`, 'u'),
          );
        }
      }
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

  it('mark-in-text: a number row stays separate numbers ("15 18" is not 1518)', () => {
    expect(answersSpeech(markNumbers, 0)).toBe('Antworten: 5, 10, 15, 18, 20, 25, 28, 30.');
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
