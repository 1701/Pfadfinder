// Developer preview of the Probetest list (dev build only, task 16), used by
// tests/e2e/probetest-liste.spec.ts: /dev/probetest-liste?fach=mathe&stand=keiner|einer|alle
// &anzahl=0|2|3 (default 2). Fixed entries <fach>-01…03, not the manifest. A done entry shows
// only "gemacht" (2026-10-22); the dates stand in for the stored runs.

import { useSearchParams } from 'react-router';
import type { Fach } from '../../domain/content/taxonomy';
import { ProbetestListe } from '../screens/ProbetestListe';

const DONE = ['2026-09-30T10:00:00', '2026-09-28T10:00:00', '2026-09-23T10:00:00'];

export function ProbetestListePage() {
  const [search] = useSearchParams();
  const fach: Fach = search.get('fach') === 'deutsch' ? 'deutsch' : 'mathe';
  const stand = search.get('stand') ?? 'keiner';
  const anzahl = Number(search.get('anzahl') ?? 2);
  const entries = Array.from({ length: anzahl }, (_, i) => ({
    id: `${fach}-0${i + 1}`,
    number: i + 1,
    doneAt: stand === 'alle' || (stand === 'einer' && i === 0) ? (DONE[i] ?? null) : null,
  }));
  return <ProbetestListe fach={fach} entries={entries} known />;
}
