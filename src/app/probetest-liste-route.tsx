// The list of a Fach's Probetests (/probetest/mathe, task 16) as its own lazy chunk. The ids
// come from the manifest, numbered by their position there.

import manifest from '../../content/manifest.json';
import type { ContentManifest } from '../domain/content/manifest';
import type { Fach } from '../domain/content/taxonomy';
import { ProbetestListe } from '../ui/screens/ProbetestListe';

const MANIFEST = manifest as ContentManifest;

export function ProbetestListeRoute({ fach }: { fach: Fach }) {
  const entries = MANIFEST.probetests[fach].map((id, i) => ({ id, number: i + 1, doneAt: null }));
  return <ProbetestListe fach={fach} entries={entries} known={false} />;
}
