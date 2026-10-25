// Format → renderer (ARCHITECTURE.md §6). A new format = component + entry here + evaluator in
// src/domain/evaluation; screens never switch on the format. match and order bring dnd-kit and
// load as their own chunks; preloadFormats() fetches them as soon as practice or Einstieg opens,
// so the first such item does not wait (and offline they come from the precache).

import { createElement, Suspense, use, type ComponentType } from 'react';
import type { Format, Item, ItemOf } from '../../domain/content';
import type { Correctness } from '../../domain/evaluation';
import { corrections, PRESENTATION_TEXTS as T } from '../../domain/presentation';
import { ClozeSelect } from './ClozeSelect';
import { FindError } from './FindError';
import { MarkInText } from './MarkInText';
import { MultiChoice } from './MultiChoice';
import { NumberInput } from './NumberInput';
import { SegmentText } from './SegmentText';
import { ShortAnswer } from './ShortAnswer';
import { SingleChoice } from './SingleChoice';
import type { FormatProps } from './types';

export type { DraftOf, FormatProps } from './types';

export interface FormatEntry<F extends Format> {
  component: ComponentType<FormatProps<F>>;
  /** No auto-check (short-answer): the button shows the model answer, the child rates itself. */
  selfRated?: boolean;
  /** Label of the button in the band instead of "Prüfen". */
  submitLabel?: string;
  /** An extra line in the feedback band, in both outcomes. */
  bandNote?(item: ItemOf<F>): { label: string; text: string };
}

type Tracked<T> = Promise<T> & {
  status?: 'pending' | 'fulfilled' | 'rejected';
  value?: T;
  reason?: unknown;
};

/**
 * A renderer in its own chunk. The promise carries React's status fields, so use() reads an
 * already loaded renderer synchronously (no flash of the fallback) and suspends only while the
 * chunk is still on its way.
 */
function lazyFormat<F extends Format>(load: () => Promise<ComponentType<FormatProps<F>>>) {
  let pending: Tracked<ComponentType<FormatProps<F>>> | undefined;
  const preload = (): Promise<ComponentType<FormatProps<F>>> => {
    if (!pending) {
      const promise: Tracked<ComponentType<FormatProps<F>>> = load();
      promise.status = 'pending';
      promise.then(
        (component) => Object.assign(promise, { status: 'fulfilled', value: component }),
        (reason: unknown) => Object.assign(promise, { status: 'rejected', reason }),
      );
      pending = promise;
    }
    return pending;
  };
  function LazyFormat(props: FormatProps<F>) {
    return createElement(use<ComponentType<FormatProps<F>>>(preload()), props);
  }
  return { component: LazyFormat, preload };
}

const match = lazyFormat<'match'>(() => import('./Match').then((m) => m.Match));
const order = lazyFormat<'order'>(() => import('./Order').then((m) => m.Order));

/** Starts loading the renderers that live in their own chunks; resolves when both are there. */
export function preloadFormats(): Promise<unknown> {
  return Promise.all([match.preload(), order.preload()]);
}

export const formatRegistry: { [F in Format]: FormatEntry<F> } = {
  'single-choice': { component: SingleChoice },
  'multi-choice': { component: MultiChoice },
  'number-input': { component: NumberInput },
  match: { component: match.component },
  order: { component: order.component },
  'cloze-select': { component: ClozeSelect },
  'mark-in-text': { component: MarkInText },
  'find-error': {
    component: FindError,
    bandNote: (item) => ({ label: T.correction, text: corrections(item) }),
  },
  'short-answer': { component: ShortAnswer, selfRated: true, submitLabel: 'Vergleichen' },
  'segment-text': { component: SegmentText },
};

/** The entry of an item's format, without a format switch at the call site. */
export function formatEntry(item: Item): FormatEntry<Format> {
  return formatRegistry[item.format] as unknown as FormatEntry<Format>;
}

/** Formats with a renderer; only these items are served in practice. */
export { SUPPORTED_FORMATS } from './supported';

export interface FormatRendererProps {
  item: Item;
  attemptIndex: number;
  answer: unknown;
  onChange(answer: unknown): void;
  disabled: boolean;
  revealed?: { correct: Correctness };
  showSolution?: boolean;
}

/** Renders the item with its format's component; the solution comes from the item. */
export function FormatRenderer({ item, revealed, ...props }: FormatRendererProps) {
  const { component } = formatEntry(item);
  return createElement(
    Suspense,
    { fallback: createElement('div', { 'aria-busy': true, className: 'min-h-touch w-full' }) },
    createElement(component, {
      ...props,
      item,
      answer: props.answer as FormatProps<Format>['answer'],
      revealed: revealed && { correct: revealed.correct, solution: item.solution },
    } as FormatProps<Format>),
  );
}
