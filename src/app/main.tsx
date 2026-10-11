import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { createContentLoader } from '../content-runtime/loader';
import { createDexieRepositories } from '../data/dexie/repos';
import { createSessionStore } from '../data/session-store';
import { SUPPORTED_FORMATS } from '../ui/formats/registry';
import { SessionStoreContext } from '../ui/session-context';
import { createAppRouter } from './router';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found');

const content = createContentLoader();
const store = createSessionStore({
  repos: createDexieRepositories(),
  content,
  now: () => new Date().toISOString(),
  newId: () => crypto.randomUUID(),
  formats: SUPPORTED_FORMATS,
});
const router = createAppRouter(content);

createRoot(root).render(
  <StrictMode>
    <SessionStoreContext value={store}>
      <RouterProvider router={router} />
    </SessionStoreContext>
  </StrictMode>,
);
