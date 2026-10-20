// Declarative React Router (library mode, ARCHITECTURE.md §2). The data router
// (createBrowserRouter + loaders) added 55 kB to the start page; nothing here needs it.

import { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes, useSearchParams } from 'react-router';
import manifest from '../../content/manifest.json';
import type { ContentManifest } from '../domain/content/manifest';
import type { Fach } from '../domain/content/taxonomy';
import { practiceableBereicheFromManifest } from '../domain/scheduler/practiceable';
import { SUPPORTED_FORMATS } from '../ui/formats/supported';
import { KartenScreen } from '../ui/map/KartenScreen';
import { ListenScreen } from '../ui/screens/ListenScreen';
import { applyUpdate, useUpdateReady } from './pwa-update';

// The start page reads the manifest; items load when a Bereich is opened. Progress (IndexedDB)
// comes from a lazy chunk, so Dexie stays out of the start bundle.
const MANIFEST = manifest as ContentManifest;
const START_BEREICHE = practiceableBereicheFromManifest(MANIFEST, SUPPORTED_FORMATS);
const loadMapProgress = () => import('./map-progress').then((m) => m.loadAppMapProgress());
const postponeOffer = (fach: Fach) =>
  import('./map-progress').then((m) => m.postponeAppOffer(fach));

/** The map; /?liste shows the plain list instead (fallback for tests). */
function StartRoute() {
  const [search] = useSearchParams();
  const updateReady = useUpdateReady();
  if (search.has('liste')) return <ListenScreen bereiche={START_BEREICHE} />;
  return (
    <KartenScreen
      manifest={MANIFEST}
      formats={SUPPORTED_FORMATS}
      loadProgress={loadMapProgress}
      postponeOffer={postponeOffer}
      update={updateReady ? { onReload: applyUpdate } : null}
    />
  );
}

// Store, IndexedDB, Zod and the renderers live in this chunk.
const PracticeRoute = lazy(() =>
  import('./practice-route').then((m) => ({ default: m.PracticeRoute })),
);

// The Einstieg (PRODUCT.md §5.4) in its own chunk, like practice.
const CheckRoute = lazy(() => import('./check-route').then((m) => ({ default: m.CheckRoute })));

// The Probetest and its print sheet, each in its own chunk.
const ProbetestRoute = lazy(() =>
  import('./probetest-route').then((m) => ({ default: m.ProbetestRoute })),
);
const PrintRoute = lazy(() => import('./print-route').then((m) => ({ default: m.PrintRoute })));

// The Eltern page (by URL or from the legal pages, never from a child's screen) in its own chunk.
const ElternRoute = lazy(() => import('./eltern-route').then((m) => ({ default: m.ElternRoute })));

// Impressum and Datenschutz (linked from the map and /eltern) share one small chunk.
const RechtlichesScreen = lazy(() =>
  import('../ui/screens/RechtlichesScreen').then((m) => ({ default: m.RechtlichesScreen })),
);

// Developer pages exist only in the dev build; the condition is replaced at build time,
// so the imports and their chunks are dropped from the production bundle.
const TokensPage = import.meta.env.DEV
  ? lazy(() => import('../ui/dev/TokensPage').then((m) => ({ default: m.TokensPage })))
  : null;
const KartePage = import.meta.env.DEV
  ? lazy(() => import('../ui/dev/KartePage').then((m) => ({ default: m.KartePage })))
  : null;
const EinstiegPage = import.meta.env.DEV
  ? lazy(() => import('../ui/dev/EinstiegPage').then((m) => ({ default: m.EinstiegPage })))
  : null;
const ProbetestPage = import.meta.env.DEV
  ? lazy(() => import('../ui/dev/ProbetestPage').then((m) => ({ default: m.ProbetestPage })))
  : null;
const ProbetestLaufPage = import.meta.env.DEV
  ? lazy(() =>
      import('../ui/dev/ProbetestLaufPage').then((m) => ({ default: m.ProbetestLaufPage })),
    )
  : null;
const TextPage = import.meta.env.DEV
  ? lazy(() => import('../ui/dev/TextPage').then((m) => ({ default: m.TextPage })))
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
          <Route path="/" element={<StartRoute />} />
          <Route path="/ueben/:fach/:bereich" element={<PracticeRoute />} />
          <Route path="/einstieg/:fach" element={<CheckRoute />} />
          <Route path="/probetest/:id" element={<ProbetestRoute />} />
          <Route path="/probetest/:id/print" element={<PrintRoute />} />
          <Route path="/eltern" element={<ElternRoute />} />
          <Route path="/impressum" element={<RechtlichesScreen page="impressum" />} />
          <Route path="/datenschutz" element={<RechtlichesScreen page="datenschutz" />} />
          {TokensPage && <Route path="/dev/tokens" element={<TokensPage />} />}
          {ItemPage && <Route path="/dev/item/:id" element={<ItemPage />} />}
          {TextPage && <Route path="/dev/text/:id" element={<TextPage />} />}
          {KartePage && <Route path="/dev/karte" element={<KartePage />} />}
          {EinstiegPage && <Route path="/dev/einstieg" element={<EinstiegPage />} />}
          {ProbetestPage && <Route path="/dev/probetest" element={<ProbetestPage />} />}
          {ProbetestLaufPage && (
            <Route path="/dev/probetest-lauf/:id" element={<ProbetestLaufPage />} />
          )}
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
