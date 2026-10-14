// Zustand store "check": the Einstiegscheck on screen. Actions only call the check service;
// every decision lives in src/domain. No feedback: after each answer only "Weiter".

import { createStore, type StoreApi } from 'zustand/vanilla';
import type { Fach } from '../domain/content';
import type { Learner } from '../domain/learner';
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

  start(fach: Fach): Promise<void>;
  /** From the intro to the first question. */
  begin(): void;
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
      set({
        status: 'answering',
        check,
        current: { ...question, shownAt: deps.now() },
        answer: null,
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
        if (get().status === 'answering') set({ status: 'paused' });
      },

      resume() {
        if (get().status === 'paused') set({ status: 'answering' });
      },

      leave() {
        run++;
        set({ ...idle });
      },
    };
  });
}
