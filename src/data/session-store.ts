// Zustand store "session": the current learner and the practice session on screen.
// Actions only call the practice service; every decision lives in src/domain.

import { createStore, type StoreApi } from 'zustand/vanilla';
import type { Bereich, Fach } from '../domain/content';
import type { Correctness, EvaluationDetail } from '../domain/evaluation';
import type { Learner } from '../domain/learner';
import type { MasteryTransition } from '../domain/mastery';
import { readingStep } from '../domain/practice';
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
  /** The first item of a reading text in this round: the text comes first, then the item. */
  | 'reading'
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
  /** Reading texts shown in this round; in memory only, so a reload reads the text again. */
  shownTextIds: readonly string[];

  init(): Promise<Learner>;
  startPractice(fach: Fach, bereich: Bereich): Promise<void>;
  /** "Fortsetzen": the open session goes on where it stopped. */
  resume(): Promise<void>;
  /** "Neu anfangen": the open session ends without an Abschluss, a new round of 10 begins. */
  restart(): Promise<void>;
  /** "Weiter" on the reading screen: the item comes, with the text beside it. */
  doneReading(): void;
  setAnswer(answer: unknown): void;
  /** Checks the answer; a self-rated short answer passes its completed answer (with rating). */
  submit(answer?: unknown): Promise<void>;
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
  shownTextIds: [],
} as const;

export function createSessionStore(deps: PracticeDeps): SessionStore {
  // Incremented by every start/leave: a slow start that was overtaken must not write state.
  let run = 0;

  return createStore<SessionState>()((set, get) => {
    async function showNext(practice: PracticeContext, token: number) {
      const picked = await pickPracticeItem(deps, practice);
      if (token !== run) return;
      if (!picked) return set({ ...idle, status: 'empty', practice });
      const { shownTextIds } = get();
      const step = readingStep(picked.item, picked.source, new Set(shownTextIds));
      const textRef = picked.item.stimulus?.textRef;
      set({
        status: step === 'read-first' ? 'reading' : 'answering',
        practice,
        current: { ...picked, shownAt: deps.now() },
        answer: null,
        feedback: null,
        ...(textRef !== undefined &&
          !shownTextIds.includes(textRef) && { shownTextIds: [...shownTextIds, textRef] }),
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
        set({ status: 'loading', shownTextIds: [] });
        const fresh = await restartPractice(deps, practice);
        if (token !== run) return;
        await showNext(fresh, token);
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

      async submit(given) {
        const { status, practice, current } = get();
        const answer = given ?? get().answer;
        if (status !== 'answering' || !practice || !current || answer === null) return;
        const token = run;
        set({ status: 'checking', answer });
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
