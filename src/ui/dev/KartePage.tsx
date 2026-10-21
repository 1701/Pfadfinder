// Developer preview of the map with every state at once (dev build only): /dev/karte.
// Used by tests/e2e/karte.spec.ts for the layout check and the screenshots; ?neu fills the
// line below the map (both Probetests, new version, Impressum · Datenschutz); ?angebot=deutsch shows
// the Einstieg offer of Deutsch (the longer title) with no Fundstück yet.

import { BEREICHE, type Bereich, type Fach } from '../../domain/content/taxonomy';
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

/** ?neu: the fullest line below the map: both Probetests and a waiting new version. */
export function KartePage() {
  const search = new URLSearchParams(window.location.search);
  const reached = search.has('geschafft');
  const full = search.has('neu');
  const angebot = search.get('angebot');
  const offerFach: Fach | null = angebot === 'deutsch' || angebot === 'mathe' ? angebot : null;
  return (
    <KartenView
      progress={{
        states: Object.fromEntries(BEREICHE.map((b) => [b, DEMO[b]])) as typeof DEMO,
        today: reached
          ? { count: 10, goal: 10, reached: true }
          : { count: offerFach ? 0 : 4, goal: 10, reached: false },
      }}
      offer={offerFach && { fach: offerFach, onLater: () => undefined }}
      probetests={
        full
          ? [
              { fach: 'mathe', id: 'mathe-01' },
              { fach: 'deutsch', id: 'deutsch-01' },
            ]
          : []
      }
      update={full ? { onReload: () => undefined } : null}
    />
  );
}
