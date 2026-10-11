import { createBrowserRouter, type RouteObject } from 'react-router';

// Placeholder until the map screen exists.
function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-lg">
      <h1 className="text-display font-bold">Pfadfinder</h1>
    </main>
  );
}

const routes: RouteObject[] = [{ path: '/', Component: Home }];

// Developer pages exist only in the dev build; the condition is replaced at build time,
// so the import and its chunk are dropped from the production bundle.
if (import.meta.env.DEV) {
  routes.push({
    path: '/dev/tokens',
    lazy: async () => ({ Component: (await import('../ui/dev/TokensPage')).TokensPage }),
  });
}

export const router = createBrowserRouter(routes);
