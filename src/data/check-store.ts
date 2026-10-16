// Zustand store "check": the Einstiegscheck on screen. Actions only call the check service;
// every decision lives in src/domain. No feedback: after each answer only "Weiter".

import { createStore, type StoreApi } from 'zustand/vanilla';
import type { Fach } from '../domain/content';
import type { Learner } from '../domain/learner';
import { readingStep } from '../domain/practice';
import {
  answerCheck,
  currentCheckQuestion,
  finishCheck,
  startCheck,
  type CheckContext,
  type CheckDeps,
  type CheckOutcome,
  type CheckQuestion,
  type CheckUnavailable,
} from './check';
import { ensureLearner } from './practice';

export type CheckStatus =
  | 'idle'
  | 'loading'
  /** No check: see `unavailable` for the reason. */
  | 'unavailable'
  | 'intro'
  /** Before the first item of a reading text: the text comes first (also in the Einstieg). */
  | 'reading'
  | 'answering'
  /** "Pause" asks first: leaving now starts the check over next time. */
  | 'paused'
  | 'saving'
  | 'finished';

export interface CheckState {
  learner: Learner | null;
  status: CheckStatus;
  check: CheckContext | null;
  current: (CheckQuestion & { shownAt: string }) | null;
  /** The answer as the format renderer reports it; null while nothing valid is entered. */
  answer: unknown;
  /** Set when the check is stored. */
  result: CheckOutcome | null;
  /** Set with status "unavailable". */
  unavailable: CheckUnavailable | null;
  /** Reading texts shown in this check; in memory only. */
  shownTextIds: readonly string[];
  /** Where "Pause" was pressed: "Weitermachen" goes back there. */
  pausedFrom: 'reading' | 'answering' | null;

  start(fach: Fach): Promise<void>;
  /** From the intro to the first question. */
  begin(): void;
  /** "Weiter" on the reading screen: the item comes, with the text beside it. */
  doneReading(): void;
  setAnswer(answer: unknown): void;
  /** Records the answer and shows the next question; the last one stores the check. */
  next(): Promise<void>;
  pause(): void;
  resume(): void;
  /** Leaves the check; nothing of an unfinished check is kept. */
  leave(): void;
}

export type CheckStore = StoreApi<CheckState>;

const idle = {
  status: 'idle',
  check: null,
  current: null,
  answer: null,
  result: null,
  unavailable: null,
  shownTextIds: [],
  pausedFrom: null,
} as const;

/** The journey in this Fach has begun (a mastery state exists): no check, ever. */
const started = { ...idle, status: 'unavailable', unavailable: 'started' } as const;

export function createCheckStore(deps: CheckDeps): CheckStore {
  // Incremented by every start/leave: a slow start or save that was overtaken must not write state.
  let run = 0;

  return createStore<CheckState>()((set, get) => {
    function show(check: CheckContext) {
      const question = currentCheckQuestion(check);
      if (!question) return false;
      const { shownTextIds } = get();
      const step = readingStep(question.item, 'practice', new Set(shownTextIds));
      const textRef = question.item.stimulus?.textRef;
      set({
        status: step === 'read-first' ? 'reading' : 'answering',
        check,
        current: { ...question, shownAt: deps.now() },
        answer: null,
        ...(textRef !== undefined &&
          !shownTextIds.includes(textRef) && { shownTextIds: [...shownTextIds, textRef] }),
      });
      return true;
    }

    return {
      learner: null,
      ...idle,

      async start(fach) {
        const token = ++run;
        set({ ...idle, status: 'loading' });
        const learner = get().learner ?? (await ensureLearner(deps));
        const check = await startCheck(deps, learner.id, fach);
        if (token !== run) return;
        set({
          ...idle,
          learner,
          ...(typeof check === 'string'
            ? { status: 'unavailable', unavailable: check }
            : { status: 'intro', check }),
        });
      },

      begin() {
        const { status, check } = get();
        if (status === 'intro' && check && !show(check))
          set({ ...idle, status: 'unavailable', unavailable: 'empty' });
      },

      doneReading() {
        const { status, current } = get();
        // The item's time starts when it is on screen, not with the reading screen.
        if (status === 'reading' && current) {
          set({ status: 'answering', current: { ...current, shownAt: deps.now() } });
        }
      },

      setAnswer(answer) {
        if (get().status === 'answering') set({ answer });
      },

      async next() {
        const { status, check, current, answer } = get();
        if (status !== 'answering' || !check || !current || answer === null) return;
        const answered = answerCheck(deps, check, current, answer);
        if (show(answered)) return;

        const token = run;
        set({ status: 'saving', check: answered, current: null, answer: null });
        const result = await finishCheck(deps, answered);
        if (token !== run) return;
        set(result ? { status: 'finished', result } : started);
      },

      pause() {
        const { status } = get();
        if (status === 'answering' || status === 'reading') {
          set({ status: 'paused', pausedFrom: status });
        }
      },

      resume() {
        const { status, pausedFrom } = get();
        if (status === 'paused') set({ status: pausedFrom ?? 'answering', pausedFrom: null });
      },

      leave() {
        run++;
        set({ ...idle });
      },
    };
  });
}
