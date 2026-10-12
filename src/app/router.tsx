// Declarative React Router (library mode, ARCHITECTURE.md §2). The data router
// (createBrowserRouter + loaders) added 55 kB to the start page; nothing here needs it.

import { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import manifest from '../../content/manifest.json';
import type { ContentManifest } from '../domain/content/manifest';
import { practiceableBereicheFromManifest } from '../domain/scheduler/practiceable';
import { SUPPORTED_FORMATS } from '../ui/formats/supported';
import { StartScreen } from '../ui/screens/StartScreen';

// The start page reads only the manifest; items load when a Bereich is opened.
const START_BEREICHE = practiceableBereicheFromManifest(
  manifest as ContentManifest,
  SUPPORTED_FORMATS,
);

// Store, IndexedDB, Zod and the renderers live in this chunk.
const PracticeRoute = lazy(() =>
  import('./practice-route').then((m) => ({ default: m.PracticeRoute })),
);

// Developer pages exist only in the dev build; the condition is replaced at build time,
// so the imports and their chunks are dropped from the production bundle.
const TokensPage = import.meta.env.DEV
  ? lazy(() => import('../ui/dev/TokensPage').then((m) => ({ default: m.TokensPage })))
  : null;
const ItemPage = import.meta.env.DEV
  ? lazy(() => import('../ui/dev/ItemPage').then((m) => ({ default: m.ItemPage })))
  : null;

export function AppRouter() {
  return (
    <BrowserRouter>
      {/* Pending chunks show nothing: the screen stays calm instead of flashing a spinner. */}
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<StartScreen bereiche={START_BEREICHE} />} />
          <Route path="/ueben/:fach/:bereich" element={<PracticeRoute />} />
          {TokensPage && <Route path="/dev/tokens" element={<TokensPage />} />}
          {ItemPage && <Route path="/dev/item/:id" element={<ItemPage />} />}
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
