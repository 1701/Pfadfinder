import { describe, expect, it } from 'vitest';
import type { Item, Probetest } from '../../../src/domain/content';
import { probetestRunSchema, type ProbetestRun } from '../../../src/domain/learner';
import {
  FOREGROUND_GRACE_MS,
  deadlineOf,
  finishRun,
  introState,
  isAnswered,
  isFinalMinutes,
  itemOutcome,
  onDeadline,
  onOpen,
  probetestReadAloud,
  rateShortAnswer,
  remainingMinutes,
  scoreRun,
  startRun,
  withDraft,
  withIndex,
  withTime,
} from '../../../src/domain/probetest';
import { previewAnswer } from '../../../src/ui/dev/preview-answers';
import { numberInput, order, shortAnswer, singleChoice } from '../../fixtures/items';

// zo, gm, zo, dz: two Bereiche with two items, one with a short answer.
const ITEMS: Item[] = [numberInput, singleChoice, order, shortAnswer];
const PROBETEST = {
  id: 'mathe-01',
  fach: 'mathe',
  durationMinutes: 45,
  itemIds: ITEMS.map((i) => i.id),
} as Probetest;
const T0 = '2026-10-15T08:00:00.000Z';
const at = (minutes: number) => new Date(Date.parse(T0) + minutes * 60_000).toISOString();

function ids() {
  let n = 0;
  return () => `a-${++n}`;
}

function started(priorAttempts: { itemId: string }[] = []): ProbetestRun {
  return startRun({
    probetest: PROBETEST,
    learnerId: 'l1',
    runId: 'run-1',
    now: T0,
    priorAttempts,
  });
}

describe('time', () => {
  const deadline = deadlineOf({ startedAt: T0 }, 45);

  it('runs by the wall clock from startedAt, in whole minutes rounded up', () => {
    expect(remainingMinutes(T0, deadline)).toBe(45);
    expect(remainingMinutes(at(0.5), deadline)).toBe(45);
    expect(remainingMinutes(at(10), deadline)).toBe(35);
    expect(remainingMinutes(at(44.9), deadline)).toBe(1);
    expect(remainingMinutes(at(45), deadline)).toBe(0);
    expect(remainingMinutes(at(60), deadline)).toBe(0);
  });

  it('the last five minutes start at 5 left and end at 0', () => {
    expect(isFinalMinutes(at(39.9), deadline)).toBe(false); // 6 left (5:06)
    expect(isFinalMinutes(at(40), deadline)).toBe(true); // 5 left
    expect(isFinalMinutes(at(44.5), deadline)).toBe(true); // 1 left
    expect(isFinalMinutes(at(45), deadline)).toBe(false);
  });

  it('opening a running run resumes before the deadline and expires from it on', () => {
    expect(onOpen(at(44.99), deadline)).toBe('resume');
    expect(onOpen(at(45), deadline)).toBe('expire');
  });

  it('the deadline gives a result only when seen in the foreground', () => {
    expect(onDeadline({ deadline, firedAt: at(45), visible: true })).toBe('submit');
    const late = new Date(deadline + FOREGROUND_GRACE_MS).toISOString();
    expect(onDeadline({ deadline, firedAt: late, visible: true })).toBe('submit');
    const tooLate = new Date(deadline + FOREGROUND_GRACE_MS + 1).toISOString();
    expect(onDeadline({ deadline, firedAt: tooLate, visible: true })).toBe('expire');
    expect(onDeadline({ deadline, firedAt: at(45), visible: false })).toBe('expire');
    expect(onDeadline({ deadline, firedAt: at(44.99), visible: true })).toBe('wait');
  });
});

describe('run', () => {
  it('starts running with an option order fixed by earlier attempts', () => {
    const run = started([{ itemId: order.id }, { itemId: order.id }, { itemId: 'm-xx-1-001' }]);
    expect(probetestRunSchema.parse(run)).toEqual(run);
    expect(run).toMatchObject({ status: 'running', currentIndex: 0, answers: {}, attemptIds: [] });
    expect(run.attemptIndex).toEqual({
      [numberInput.id]: 0,
      [singleChoice.id]: 0,
      [order.id]: 2,
      [shortAnswer.id]: 0,
    });
  });

  it('keeps drafts, position and time per item; null removes a draft', () => {
    let run = withDraft(started(), numberInput.id, { value: 7 });
    run = withDraft(run, numberInput.id, null);
    run = withDraft(run, singleChoice.id, { optionId: 'a' });
    run = withTime(withTime(run, singleChoice.id, 1200.4), singleChoice.id, 800);
    run = withIndex(run, 3);
    expect(run.answers).toEqual({ [singleChoice.id]: { optionId: 'a' } });
    expect(run.itemMs).toEqual({ [singleChoice.id]: 2000 });
    expect(run.currentIndex).toBe(3);
  });

  it('a short answer counts as answered only with text', () => {
    expect(isAnswered(shortAnswer, { text: '  ' })).toBe(false);
    expect(isAnswered(shortAnswer, { text: 'weil' })).toBe(true);
    expect(isAnswered(numberInput, null)).toBe(false);
    expect(isAnswered(numberInput, { value: 3 })).toBe(true);
  });

  it('submitting with open items counts them as not solved', () => {
    let run = withDraft(started(), numberInput.id, previewAnswer(numberInput, true));
    run = withDraft(run, singleChoice.id, previewAnswer(singleChoice, false));
    const { run: done, attempts } = finishRun({
      run,
      items: ITEMS,
      reason: 'submit',
      now: at(20),
      newId: ids(),
    });
    expect(probetestRunSchema.parse(done)).toEqual(done);
    expect(done).toMatchObject({ status: 'submitted', endReason: 'submit', endedAt: at(20) });
    expect(done.result).toEqual({
      byBereich: {
        'zahlen-operationen': { solved: 1, total: 2, pending: 0 },
        'groessen-messen': { solved: 0, total: 1, pending: 0 },
        'daten-zufall': { solved: 0, total: 1, pending: 0 },
      },
      total: { solved: 1, total: 4, pending: 0 },
    });
    expect(attempts.map((a) => [a.itemId, a.correct, a.mode])).toEqual([
      [numberInput.id, true, 'probetest'],
      [singleChoice.id, false, 'probetest'],
    ]);
    expect(done.attemptIds).toEqual(attempts.map((a) => a.id));
  });

  it('time running out in the foreground submits with a result', () => {
    const run = withDraft(started(), numberInput.id, previewAnswer(numberInput, true));
    const { run: done } = finishRun({
      run,
      items: ITEMS,
      reason: 'time',
      now: at(45),
      newId: ids(),
    });
    expect(done.status).toBe('submitted');
    expect(done.result?.total).toEqual({ solved: 1, total: 4, pending: 0 });
  });

  it('leaving or an expired run aborts without a result, the attempts stay', () => {
    const run = withDraft(started(), numberInput.id, previewAnswer(numberInput, true));
    for (const reason of ['leave', 'expired'] as const) {
      const { run: done, attempts } = finishRun({
        run,
        items: ITEMS,
        reason,
        now: at(50),
        newId: ids(),
      });
      expect(probetestRunSchema.parse(done)).toEqual(done);
      expect(done).toMatchObject({ status: 'aborted', endReason: reason });
      expect(done.result).toBeUndefined();
      expect(attempts.map((a) => a.mode)).toEqual(['probetest']);
    }
  });

  it('an ended run cannot change or end again', () => {
    const { run: done } = finishRun({
      run: started(),
      items: ITEMS,
      reason: 'leave',
      now: at(1),
      newId: ids(),
    });
    expect(() => withDraft(done, numberInput.id, { value: 1 })).toThrow();
    expect(() =>
      finishRun({ run: done, items: ITEMS, reason: 'submit', now: at(2), newId: ids() }),
    ).toThrow();
  });
});

describe('short answers and the self-rating', () => {
  function submittedWithText() {
    const run = withDraft(started(), shortAnswer.id, { text: 'Weil 3 öfter vorkommt.' });
    return finishRun({ run, items: ITEMS, reason: 'submit', now: at(30), newId: ids() });
  }

  it('an entered short answer is pending, without an attempt, until it is rated', () => {
    const { run, attempts } = submittedWithText();
    expect(attempts).toEqual([]);
    expect(itemOutcome(shortAnswer, run)).toBe('pending');
    expect(run.result?.byBereich['daten-zufall']).toEqual({ solved: 0, total: 1, pending: 1 });
    expect(run.result?.total.pending).toBe(1);
  });

  it('Getroffen counts as solved; Teils and Noch nicht do not', () => {
    const { run } = submittedWithText();
    const results = ([1, 0.5, 0] as const).map((rating) =>
      rateShortAnswer({
        run,
        items: ITEMS,
        itemId: shortAnswer.id,
        rating,
        now: at(60),
        newId: ids(),
      }),
    );
    expect(results.map((r) => r?.run.result?.total)).toEqual([
      { solved: 1, total: 4, pending: 0 },
      { solved: 0, total: 4, pending: 0 },
      { solved: 0, total: 4, pending: 0 },
    ]);
    const teils = results[1]!;
    expect(teils.attempts).toEqual([
      expect.objectContaining({
        itemId: shortAnswer.id,
        correct: 0.5,
        mode: 'probetest',
        answer: { text: 'Weil 3 öfter vorkommt.', rating: 0.5 },
      }),
    ]);
    expect(teils.run.ratings).toEqual({ [shortAnswer.id]: 0.5 });
    expect(teils.run.attemptIds).toEqual([teils.attempts[0]!.id]);
    expect(probetestRunSchema.parse(teils.run)).toEqual(teils.run);
  });

  it('rates once, only entered short answers, only in a submitted run', () => {
    const { run } = submittedWithText();
    const rate = (r: ProbetestRun, itemId = shortAnswer.id) =>
      rateShortAnswer({ run: r, items: ITEMS, itemId, rating: 1, now: at(60), newId: ids() });
    expect(rate(rate(run)!.run)).toBeNull();
    expect(rate(run, numberInput.id)).toBeNull();
    const empty = finishRun({
      run: started(),
      items: ITEMS,
      reason: 'submit',
      now: at(5),
      newId: ids(),
    }).run;
    expect(itemOutcome(shortAnswer, empty)).toBe('open');
    expect(rate(empty)).toBeNull();
    const aborted = finishRun({
      run: withDraft(started(), shortAnswer.id, { text: 'x' }),
      items: ITEMS,
      reason: 'leave',
      now: at(5),
      newId: ids(),
    }).run;
    expect(rate(aborted)).toBeNull();
  });

  it('scoreRun lists Bereiche in test order', () => {
    expect(Object.keys(scoreRun(ITEMS, started()).byBereich)).toEqual([
      'zahlen-operationen',
      'groessen-messen',
      'daten-zufall',
    ]);
  });
});

describe('introState', () => {
  const base = started();
  const submitted = {
    ...finishRun({ run: base, items: ITEMS, reason: 'submit', now: at(30), newId: ids() }).run,
  };
  const aborted = {
    ...finishRun({
      run: { ...base, id: 'run-2' },
      items: ITEMS,
      reason: 'leave',
      now: at(90),
      newId: ids(),
    }).run,
  };
  const running = { ...base, id: 'run-3' };

  it('"schon gemacht" only after a submitted run, not after an aborted one', () => {
    expect(introState([aborted], 'mathe-01')).toEqual({
      running: null,
      lastSubmitted: null,
      doneBefore: false,
    });
    expect(introState([submitted, aborted], 'mathe-01')).toEqual({
      running: null,
      lastSubmitted: submitted,
      doneBefore: true,
    });
  });

  it('finds the running run and ignores other Probetests', () => {
    expect(introState([submitted, running], 'mathe-01').running).toEqual(running);
    expect(introState([submitted, running], 'mathe-02')).toEqual({
      running: null,
      lastSubmitted: null,
      doneBefore: false,
    });
  });
});

describe('probetestReadAloud', () => {
  it('is on for every Mathe item and off for Deutsch reading texts', () => {
    expect(probetestReadAloud('mathe', numberInput)).toBe(true);
    expect(probetestReadAloud('deutsch', { stimulus: { textRef: 't-sach-001' } })).toBe(false);
    expect(probetestReadAloud('deutsch', {})).toBe(true);
  });
});
