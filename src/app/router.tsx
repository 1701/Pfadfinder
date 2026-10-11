import { createBrowserRouter, type RouteObject } from 'react-router';
import type { ContentRuntime } from '../content-runtime/loader';
import { practiceableBereiche } from '../domain/scheduler';
import { SUPPORTED_FORMATS } from '../ui/formats/registry';
import { StartScreen } from '../ui/screens/StartScreen';
import { UebenScreen } from '../ui/screens/UebenScreen';

// Shown while a route's loader or lazy chunk is pending: the screen stays calm and empty.
function Pending() {
  return null;
}

export function appRoutes(content: ContentRuntime): RouteObject[] {
  const routes: RouteObject[] = [
    {
      path: '/',
      Component: StartScreen,
      HydrateFallback: Pending,
      loader: async () => practiceableBereiche(await content.loadAllItems(), SUPPORTED_FORMATS),
    },
    { path: '/ueben/:fach/:bereich', Component: UebenScreen },
  ];

  // Developer pages exist only in the dev build; the condition is replaced at build time,
  // so the imports and their chunks are dropped from the production bundle.
  if (import.meta.env.DEV) {
    routes.push(
      {
        path: '/dev/tokens',
        HydrateFallback: Pending,
        lazy: async () => ({ Component: (await import('../ui/dev/TokensPage')).TokensPage }),
      },
      {
        path: '/dev/item/:id',
        HydrateFallback: Pending,
        lazy: async () => ({ Component: (await import('../ui/dev/ItemPage')).ItemPage }),
      },
    );
  }
  return routes;
}

export function createAppRouter(content: ContentRuntime) {
  return createBrowserRouter(appRoutes(content));
}
