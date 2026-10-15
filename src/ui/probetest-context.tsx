// Gives the Probetest screens access to the probetest store created in src/app.

import { createContext, useContext } from 'react';
import { useStore } from 'zustand';
import type { ProbetestState, ProbetestStore } from '../data/probetest-store';

export const ProbetestStoreContext = createContext<ProbetestStore | null>(null);

export function useProbetest<T>(selector: (state: ProbetestState) => T): T {
  const store = useContext(ProbetestStoreContext);
  if (!store) throw new Error('ProbetestStoreContext is missing');
  return useStore(store, selector);
}
