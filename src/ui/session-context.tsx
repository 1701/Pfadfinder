// Gives screens access to the session store created in src/app.

import { createContext, useContext } from 'react';
import { useStore } from 'zustand';
import type { SessionState, SessionStore } from '../data/session-store';

export const SessionStoreContext = createContext<SessionStore | null>(null);

export function useSession<T>(selector: (state: SessionState) => T): T {
  const store = useContext(SessionStoreContext);
  if (!store) throw new Error('SessionStoreContext is missing');
  return useStore(store, selector);
}
