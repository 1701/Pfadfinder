// Where the child left each reading text's box (task 9): within a round the box keeps its scroll
// position across the items of the text. Kept per screen (route) in memory only; the first item
// after the reading screen starts at the top again (`reset`).

import { useMemo, useRef } from 'react';

export interface TextScroll {
  of(textId: string): number | undefined;
  keep(textId: string, scrollTop: number): void;
  reset(textId: string): void;
}

export function useTextScroll(): TextScroll {
  const positions = useRef(new Map<string, number>());
  return useMemo(
    () => ({
      of: (id) => positions.current.get(id),
      keep: (id, top) => void positions.current.set(id, top),
      reset: (id) => void positions.current.delete(id),
    }),
    [],
  );
}
