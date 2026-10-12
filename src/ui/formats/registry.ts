// Format → renderer (ARCHITECTURE.md §6). A new format = component + entry here + evaluator in
// src/domain/evaluation; screens never switch on the format.

import { createElement, type ComponentType } from 'react';
import type { Format, Item } from '../../domain/content';
import type { Correctness } from '../../domain/evaluation';
import { NumberInput } from './NumberInput';
import { SingleChoice } from './SingleChoice';
import type { FormatProps } from './types';

export type { FormatProps } from './types';

type Registry = { [F in Format]?: ComponentType<FormatProps<F>> };

export const formatRegistry: Registry = {
  'single-choice': SingleChoice,
  'number-input': NumberInput,
};

/** Formats with a renderer; only these items are served in practice. */
export { SUPPORTED_FORMATS } from './supported';

export interface FormatRendererProps {
  item: Item;
  attemptIndex: number;
  answer: unknown;
  onChange(answer: unknown): void;
  disabled: boolean;
  revealed?: { correct: Correctness };
}

/** Renders the item with its format's component; the solution comes from the item. */
export function FormatRenderer({ item, revealed, ...props }: FormatRendererProps) {
  const component = formatRegistry[item.format] as ComponentType<FormatProps<Format>> | undefined;
  if (!component) throw new Error(`No renderer for format ${item.format}`);
  return createElement(component, {
    ...props,
    item,
    answer: props.answer as FormatProps<Format>['answer'],
    revealed: revealed && { correct: revealed.correct, solution: item.solution },
  } as FormatProps<Format>);
}
