// Gives the Einstieg screens access to the check store created in src/app.

import { createContext, useContext } from 'react';
import { useStore } from 'zustand';
import type { CheckState, CheckStore } from '../data/check-store';

export const CheckStoreContext = createContext<CheckStore | null>(null);

export function useCheck<T>(selector: (state: CheckState) => T): T {
  const store = useContext(CheckStoreContext);
  if (!store) throw new Error('CheckStoreContext is missing');
  return useStore(store, selector);
}
