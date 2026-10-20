// Zustand store "probetest": the Probetest on screen (PRODUCT.md §5.4). Actions call the
// probetest service; every decision lives in src/domain/probetest. No feedback while the test
// runs. Drafts, position and time per item are saved after every change, in order.
// Timers live in the UI: it calls timeUp() when the deadline timer fires and checkTime()
// when the page becomes visible again.
// Reading texts (task 13): before an item whose text has not been shown in this run on screen,
// the reading screen ("reading"); the item's time starts after "Weiter" there, the deadline runs
// on. Which texts were shown is kept in memory only: after a reload the text comes again.

import { createStore, type StoreApi } from 'zustand/vanilla';
import type { SelfRating } from '../domain/evaluation';
import type { Learner, ProbetestRun } from '../domain/learner';
import {
  isAnswered,
  itemOutcome,
  onDeadline,
  onOpen,
  withDraft,
  withIndex,
  withTime,
  type ProbetestIntro,
} from '../domain/probetest';
import { ensureLearner } from './practice';
import {
  beginRun,
  endRun,
  loadProbetestContext,
  openProbetest,
  rateRun,
  runDeadline,
  saveRun,
  type ProbetestContext,
  type ProbetestDeps,
} from './probetest';

export type ProbetestStatus =
  | 'idle'
  | 'loading'
  /** No such Probetest. */
  | 'unavailable'
  | 'intro'
  /** The reading screen before the item at `index` (its text was not shown yet). */
  | 'reading'
  | 'answering'
  | 'overview'
  /** "Abgeben" with open items asks first. */
  | 'confirmSubmit'
  /** "Zur Karte" asks first: "Dann ist der Probetest vorbei." */
  | 'confirmLeave'
  | 'saving'
  /** Left via "Zur Karte": the UI goes to the map. */
  | 'left'
  | 'result'
  | 'review'
  /** The overview while looking through: every item's Wegstrich, a tap jumps there. */
  | 'reviewOverview';

export interface ProbetestState {
  learner: Learner | null;
  status: ProbetestStatus;
  context: ProbetestContext | null;
  intro: ProbetestIntro | null;
  /** The running run, or the submitted run on the result and review screens. */
  run: ProbetestRun | null;
  /** Item on screen while answering or reviewing. */
  index: number;
  /**
   * Looking through only these items (indices in test order): the short answers that waited for
   * a rating when "N Antworten vergleichen" was tapped. Null: every item.
   */
  reviewOnly: readonly number[] | null;
  /** Texts whose reading screen came in this run on screen (memory only, like practice). */
  shownTextIds: readonly string[];

  open(probetestId: string): Promise<void>;
  /** "Starten": a new run, or the running one. */
  begin(): Promise<void>;
  /** "Weiter" on the reading screen: the item, its time starts now. */
  doneReading(): void;
  setAnswer(draft: unknown): void;
  goTo(index: number): void;
  /** "Weiter": the next item; after the last one the overview (review: the result). */
  next(): void;
  /** "Zurück". */
  back(): void;
  showOverview(): void;
  /** "Abgeben" in the overview: asks first if items are open. */
  askSubmit(): Promise<void>;
  submit(): Promise<void>;
  askLeave(): void;
  /** Back from a question to the overview. */
  cancel(): void;
  leave(): Promise<void>;
  /** The deadline timer fired; `visible` is document.visibilityState === 'visible'. */
  timeUp(visible: boolean): Promise<void>;
  /** The page is visible again: a run whose time ran out meanwhile is aborted. */
  checkTime(): Promise<void>;
  /** "Auswertung ansehen" on the intro, or back from looking through. */
  showResult(): void;
  /**
   * "Durchsehen" (every item), "N Antworten vergleichen" (`only` = 'pending': the waiting short
   * answers), or a Wegstrich in the review overview (every item again, from that one).
   */
  review(index?: number, only?: 'pending'): void;
  /** "Übersicht" while looking through. */
  showReviewOverview(): void;
  /** "Weiter durchsehen": back to the item, the filter stays. */
  continueReview(): void;
  rate(rating: SelfRating): Promise<void>;
  /** Resolves when every pending save is written. */
  flush(): Promise<void>;
}

export type ProbetestStore = StoreApi<ProbetestState>;

const RUNNING: readonly ProbetestStatus[] = [
  'reading',
  'answering',
  'overview',
  'confirmSubmit',
  'confirmLeave',
];

export function createProbetestStore(deps: ProbetestDeps): ProbetestStore {
  // Incremented by every open: a slow load that was overtaken must not write state.
  let token = 0;
  // Saves run one after another, so an older state never overwrites a newer one.
  let writes: Promise<void> = Promise.resolve();
  // When the item on screen was shown or last changed (epoch ms), for the time per item.
  let shownAt = 0;

  return createStore<ProbetestState>()((set, get) => {
    const now = () => deps.now();

    function persist(run: ProbetestRun) {
      writes = writes
        .then(() => saveRun(deps, run))
        .catch((error: unknown) => console.error(error));
    }

    /** Adds the time since the item was shown to the item on screen; reading counts for none. */
    function account(run: ProbetestRun, at: string): ProbetestRun {
      const item = get().context?.items[get().index];
      const ms = Date.parse(at) - shownAt;
      shownAt = Date.parse(at);
      return item && get().status !== 'reading' ? withTime(run, item.id, ms) : run;
    }

    /** The item at `index`, or first the reading screen when its text has not been shown. */
    function arrive(
      context: ProbetestContext,
      index: number,
    ): Pick<ProbetestState, 'status' | 'shownTextIds'> {
      const textRef = context.items[index]?.stimulus?.textRef;
      const { shownTextIds } = get();
      if (textRef === undefined || shownTextIds.includes(textRef)) {
        return { status: 'answering', shownTextIds };
      }
      return { status: 'reading', shownTextIds: [...shownTextIds, textRef] };
    }

    function running(): { run: ProbetestRun; context: ProbetestContext } | null {
      const { run, context, status } = get();
      if (!run || !context || run.status !== 'running' || !RUNNING.includes(status)) return null;
      return { run, context };
    }

    function show(index: number) {
      const r = running();
      if (!r) return;
      const at = now();
      const run = withIndex(account(r.run, at), index);
      persist(run);
      set({ run, index, ...arrive(r.context, index) });
    }

    async function end(reason: 'submit' | 'time' | 'leave' | 'expired') {
      const r = running();
      if (!r) return;
      const mine = token;
      const run = account(r.run, now());
      set({ status: 'saving', run });
      await writes;
      const ended = await endRun(deps, r.context, run, reason);
      if (mine !== token) return;
      if (ended.status === 'submitted') {
        set({ status: 'result', run: ended, index: 0 });
      } else if (reason === 'leave') {
        set({ status: 'left', run: null });
      } else {
        // Time ran out while away: no result, the intro shows as usual.
        const { intro } = await openProbetest(deps, ended.learnerId, r.context);
        if (mine !== token) return;
        set({ status: 'intro', intro, run: null, index: 0 });
      }
    }

    return {
      learner: null,
      status: 'idle',
      context: null,
      intro: null,
      run: null,
      index: 0,
      reviewOnly: null,
      shownTextIds: [],

      async open(probetestId) {
        const mine = ++token;
        set({
          status: 'loading',
          context: null,
          intro: null,
          run: null,
          index: 0,
          reviewOnly: null,
          shownTextIds: [],
        });
        const learner = get().learner ?? (await ensureLearner(deps));
        const context = await loadProbetestContext(deps, probetestId);
        if (mine !== token) return;
        if (!context) {
          set({ learner, status: 'unavailable' });
          return;
        }
        await writes;
        const { intro, resumed } = await openProbetest(deps, learner.id, context);
        if (mine !== token) return;
        if (resumed) {
          shownAt = Date.parse(now());
          set({
            learner,
            context,
            intro,
            run: resumed,
            index: resumed.currentIndex,
            ...arrive(context, resumed.currentIndex),
          });
        } else {
          set({ learner, context, intro, status: 'intro' });
        }
      },

      async begin() {
        const { status, context, learner } = get();
        if (status !== 'intro' || !context || !learner) return;
        const mine = token;
        const run = await beginRun(deps, learner.id, context);
        if (mine !== token) return;
        shownAt = Date.parse(now());
        // A new run on screen: every text comes again.
        set({ shownTextIds: [] });
        set({ run, index: run.currentIndex, ...arrive(context, run.currentIndex) });
      },

      doneReading() {
        if (get().status !== 'reading') return;
        shownAt = Date.parse(now());
        set({ status: 'answering' });
      },

      setAnswer(draft) {
        const r = running();
        if (!r || get().status !== 'answering') return;
        const item = r.context.items[get().index];
        if (!item) return;
        const run = withDraft(account(r.run, now()), item.id, draft);
        persist(run);
        set({ run });
      },

      goTo(index) {
        const r = running();
        if (r && index >= 0 && index < r.context.items.length) show(index);
      },

      next() {
        const { status, index, context, reviewOnly } = get();
        if (!context) return;
        if (status === 'review') {
          const order = reviewOnly ?? context.items.map((_, i) => i);
          const following = order[order.indexOf(index) + 1];
          if (following !== undefined) set({ index: following });
          else set({ status: 'result', reviewOnly: null });
        } else if (status === 'answering') {
          if (index + 1 < context.items.length) show(index + 1);
          else get().showOverview();
        }
      },

      back() {
        const { status, index, reviewOnly } = get();
        if (status === 'review' && reviewOnly) {
          const previous = reviewOnly[reviewOnly.indexOf(index) - 1];
          if (previous !== undefined) set({ index: previous });
          return;
        }
        if (index === 0) return;
        if (status === 'review') set({ index: index - 1 });
        else if (status === 'answering') show(index - 1);
      },

      showOverview() {
        const r = running();
        if (!r) return;
        if (get().status === 'answering' || get().status === 'reading') {
          const run = account(r.run, now());
          persist(run);
          set({ run, status: 'overview' });
        } else {
          set({ status: 'overview' });
        }
      },

      async askSubmit() {
        const r = running();
        if (!r || get().status !== 'overview') return;
        const open = r.context.items.some((item) => !isAnswered(item, r.run.answers[item.id]));
        if (open) set({ status: 'confirmSubmit' });
        else await end('submit');
      },

      async submit() {
        const status = get().status;
        if (status === 'overview' || status === 'confirmSubmit') await end('submit');
      },

      askLeave() {
        if (get().status === 'overview') set({ status: 'confirmLeave' });
      },

      cancel() {
        const status = get().status;
        if (status === 'confirmSubmit' || status === 'confirmLeave') set({ status: 'overview' });
      },

      async leave() {
        if (get().status === 'confirmLeave') await end('leave');
      },

      async timeUp(visible) {
        const r = running();
        if (!r) return;
        const decision = onDeadline({
          deadline: runDeadline(r.context, r.run),
          firedAt: now(),
          visible,
        });
        if (decision !== 'wait') await end(decision === 'submit' ? 'time' : 'expired');
      },

      async checkTime() {
        const r = running();
        if (r && onOpen(now(), runDeadline(r.context, r.run)) === 'expire') await end('expired');
      },

      showResult() {
        const { status, intro, run } = get();
        if (status === 'intro' && intro?.lastSubmitted) {
          set({ status: 'result', run: intro.lastSubmitted, index: 0 });
        } else if ((status === 'review' || status === 'reviewOverview') && run) {
          set({ status: 'result', reviewOnly: null });
        }
      },

      review(index = 0, only) {
        const { status, run, context } = get();
        if (!run || !context) return;
        if (status !== 'result' && status !== 'review' && status !== 'reviewOverview') return;
        if (only === 'pending') {
          const waiting = context.items.flatMap((item, i) =>
            itemOutcome(item, run) === 'pending' ? [i] : [],
          );
          if (waiting.length > 0) set({ status: 'review', index: waiting[0], reviewOnly: waiting });
          return;
        }
        set({
          status: 'review',
          index: Math.min(Math.max(index, 0), context.items.length - 1),
          reviewOnly: null,
        });
      },

      showReviewOverview() {
        if (get().status === 'review') set({ status: 'reviewOverview' });
      },

      continueReview() {
        if (get().status === 'reviewOverview') set({ status: 'review' });
      },

      async rate(rating) {
        const { status, run, context, index } = get();
        const item = context?.items[index];
        if (status !== 'review' || !run || !context || !item) return;
        const mine = token;
        const rated = await rateRun(deps, context, run.id, item.id, rating);
        if (mine !== token || !rated) return;
        set({ run: rated });
      },

      flush() {
        return writes;
      },
    };
  });
}
