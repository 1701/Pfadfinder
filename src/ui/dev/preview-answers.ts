// A correct or a wrong answer for the dev preview (/dev/item, layout tests). Dev-only, so a format
// switch is fine here; the wrong answer is always "one thing off", like a typical slip.

import type { Item } from '../../domain/content';

function swapFirstTwo<T>(list: readonly T[]): T[] {
  const [a, b, ...rest] = list;
  return a === undefined || b === undefined ? [...list] : [b, a, ...rest];
}

export function previewAnswer(item: Item, correct: boolean): unknown {
  switch (item.format) {
    case 'single-choice': {
      const wrong = item.payload.options.find((o) => o.id !== item.solution.optionId);
      return { optionId: correct ? item.solution.optionId : wrong?.id };
    }
    case 'multi-choice': {
      const ids = item.solution.optionIds;
      const other = item.payload.options.find((o) => !ids.includes(o.id))?.id ?? '';
      return { optionIds: correct ? ids : [...ids.slice(0, -1), other] };
    }
    case 'number-input':
      return { value: correct ? item.solution.value : item.solution.value + 1 };
    case 'match': {
      const pairs = item.solution.pairs;
      if (correct) return { pairs };
      const rights = swapFirstTwo(pairs.map(([, r]) => r));
      return { pairs: pairs.map(([l], i) => [l, rights[i]]) };
    }
    case 'order':
      return {
        orderedIds: correct ? item.solution.orderedIds : swapFirstTwo(item.solution.orderedIds),
      };
    case 'cloze-select': {
      const [first] = item.payload.gaps;
      if (correct || !first) return { gaps: item.solution.gaps };
      const wrong = first.options.find((o) => o !== item.solution.gaps[first.key]) ?? '';
      return { gaps: { ...item.solution.gaps, [first.key]: wrong } };
    }
    case 'mark-in-text': {
      const indices = item.solution.indices;
      if (correct) return { indices };
      const other =
        Array.from({ length: indices.length + 2 }, (_, i) => i).find((i) => !indices.includes(i)) ??
        0;
      return { indices: [...indices.slice(0, -1), other].sort((a, b) => a - b) };
    }
    case 'find-error': {
      const ids = item.solution.errorIds;
      const other = item.payload.words.find((w) => !ids.includes(w.id))?.id ?? '';
      return { errorIds: correct ? ids : [...ids.slice(0, -1), other] };
    }
    case 'short-answer':
      return { text: item.solution.model, rating: correct ? 1 : 0.5 };
  }
}
