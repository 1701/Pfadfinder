// Developer preview of the map with every state at once (dev build only): /dev/karte.
// Used by tests/e2e/karte.spec.ts for the layout check and the screenshots.

import { BEREICHE, type Bereich } from '../../domain/content/taxonomy';
import type { RegionState } from '../../domain/progress';
import { KartenView } from '../map/KartenView';

const DEMO: Record<Bereich, RegionState> = {
  'zahlen-operationen': { kind: 'unterwegs', niveau: 2, erschlossen: [true, false, false] },
  'raum-form': { kind: 'gemeistert', niveau: 3, erschlossen: [true, true, true] },
  'groessen-messen': { kind: 'neu', niveau: 1, erschlossen: [false, false, false] },
  // Sank back to niveau 1: Etappe I stays reached.
  'daten-zufall': { kind: 'unterwegs', niveau: 1, erschlossen: [true, false, false] },
  'muster-strukturen': { kind: 'unerforscht' },
  'lesen-sachtext': { kind: 'unterwegs', niveau: 3, erschlossen: [true, true, false] },
  'lesen-literarisch': { kind: 'unerforscht' },
  'rs-laut-buchstabe': { kind: 'unerforscht' },
  'rs-strategien': { kind: 'unterwegs', niveau: 1, erschlossen: [false, false, false] },
};

export function KartePage() {
  const reached = new URLSearchParams(window.location.search).has('geschafft');
  return (
    <KartenView
      progress={{
        states: Object.fromEntries(BEREICHE.map((b) => [b, DEMO[b]])) as typeof DEMO,
        today: reached
          ? { count: 10, goal: 10, reached: true }
          : { count: 4, goal: 10, reached: false },
      }}
    />
  );
}
