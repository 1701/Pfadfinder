// Zustand store "session": the current learner and the practice session on screen.
// Actions only call the practice service; every decision lives in src/domain.

import { createStore, type StoreApi } from 'zustand/vanilla';
import type { Bereich, Fach } from '../domain/content';
import type { Correctness, EvaluationDetail } from '../domain/evaluation';
import type { Learner } from '../domain/learner';
import type { MasteryTransition } from '../domain/mastery';
import type { TodayProgress } from '../domain/progress';
import {
  ensureLearner,
  loadTodayProgress,
  pickPracticeItem,
  restartPractice,
  startPractice,
  submitPracticeAnswer,
  type PracticeContext,
  type PracticeDeps,
  type PracticeItem,
} from './practice';

export type PracticeStatus =
  | 'idle'
  | 'loading'
  /** Today's session of this Bereich is open: the child chooses Fortsetzen or Neu anfangen. */
  | 'choosing'
  /** The Bereich has too few practiceable items. */
  | 'empty'
  | 'answering'
  | 'checking'
  | 'feedback'
  | 'finished';

export interface Feedback {
  correct: Correctness;
  detail: EvaluationDetail;
  transition: MasteryTransition;
}

export interface SessionState {
  learner: Learner | null;
  status: PracticeStatus;
  practice: PracticeContext | null;
  current: (PracticeItem & { shownAt: string }) | null;
  /** The answer as the format renderer reports it; null while nothing valid is entered. */
  answer: unknown;
  feedback: Feedback | null;
  /** Set when the session is finished: today's Fundstücke, as the map counts them. */
  today: TodayProgress | null;

  init(): Promise<Learner>;
  startPractice(fach: Fach, bereich: Bereich): Promise<void>;
  /** "Fortsetzen": the open session goes on where it stopped. */
  resume(): Promise<void>;
  /** "Neu anfangen": the open session ends without an Abschluss, a new round of 10 begins. */
  restart(): Promise<void>;
  setAnswer(answer: unknown): void;
  submit(): Promise<void>;
  next(): Promise<void>;
  /** Leaves the practice screen; the stored session stays open and is continued next time. */
  leave(): void;
}

export type SessionStore = StoreApi<SessionState>;

const idle = {
  status: 'idle',
  practice: null,
  current: null,
  answer: null,
  feedback: null,
  today: null,
} as const;

export function createSessionStore(deps: PracticeDeps): SessionStore {
  // Incremented by every start/leave: a slow start that was overtaken must not write state.
  let run = 0;

  return createStore<SessionState>()((set, get) => {
    async function showNext(practice: PracticeContext, token: number) {
      const picked = await pickPracticeItem(deps, practice);
      if (token !== run) return;
      if (!picked) return set({ ...idle, status: 'empty', practice });
      set({
        status: 'answering',
        practice,
        current: { ...picked, shownAt: deps.now() },
        answer: null,
        feedback: null,
      });
    }

    return {
      learner: null,
      ...idle,

      async init() {
        const existing = get().learner;
        if (existing) return existing;
        const learner = await ensureLearner(deps);
        set({ learner });
        return learner;
      },

      async startPractice(fach, bereich) {
        const token = ++run;
        set({ ...idle, status: 'loading' });
        const learner = await get().init();
        const practice = await startPractice(deps, learner.id, fach, bereich);
        if (token !== run) return;
        if (!practice) return set({ ...idle, status: 'empty' });
        // A new session has no answers yet; one with answers is today's open one.
        if (practice.session.attemptIds.length > 0) return set({ status: 'choosing', practice });
        await showNext(practice, token);
      },

      async resume() {
        const { status, practice } = get();
        if (status !== 'choosing' || !practice) return;
        set({ status: 'loading' });
        await showNext(practice, run);
      },

      async restart() {
        const { status, practice } = get();
        if (status !== 'choosing' || !practice) return;
        const token = run;
        set({ status: 'loading' });
        const fresh = await restartPractice(deps, practice);
        if (token !== run) return;
        await showNext(fresh, token);
      },

      setAnswer(answer) {
        if (get().status === 'answering') set({ answer });
      },

      async submit() {
        const { status, practice, current, answer } = get();
        if (status !== 'answering' || !practice || !current || answer === null) return;
        const token = run;
        set({ status: 'checking' });
        const { ctx, result } = await submitPracticeAnswer(deps, practice, current, answer);
        if (token !== run) return;
        set({
          status: 'feedback',
          practice: ctx,
          feedback: {
            correct: result.evaluation.correct,
            detail: result.evaluation.detail,
            transition: result.transition,
          },
        });
      },

      async next() {
        const { status, practice } = get();
        if (status !== 'feedback' || !practice) return;
        const token = run;
        if (practice.session.goalReached) {
          const today = await loadTodayProgress(deps, practice.learnerId);
          if (token === run) set({ status: 'finished', current: null, today });
          return;
        }
        await showNext(practice, token);
      },

      leave() {
        run++;
        set({ ...idle });
      },
    };
  });
}
