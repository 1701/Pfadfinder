// The list of a Fach's Probetests (/probetest/mathe, task 16) as its own lazy chunk: the ids
// come from the manifest, numbered by their position there; the Stand from IndexedDB (Dexie).

import { useEffect, useState } from 'react';
import manifest from '../../content/manifest.json';
import { appRepositories } from '../data/dexie/instance';
import { loadProbetestList } from '../data/probetest-list';
import type { ContentManifest } from '../domain/content/manifest';
import type { Fach } from '../domain/content/taxonomy';
import { ProbetestListe, type ProbetestListEntry } from '../ui/screens/ProbetestListe';

const MANIFEST = manifest as ContentManifest;

export function ProbetestListeRoute({ fach }: { fach: Fach }) {
  const ids = MANIFEST.probetests[fach];
  const [loaded, setLoaded] = useState<ProbetestListEntry[] | null>(null);
  useEffect(() => {
    let current = true;
    loadProbetestList(appRepositories(), ids).then(
      (entries) => {
        if (current) setLoaded(entries);
      },
      // Storage not readable: the names stay, without a Stand.
      () => undefined,
    );
    return () => {
      current = false;
    };
  }, [ids]);
  const entries = loaded ?? ids.map((id, i) => ({ id, number: i + 1, doneAt: null }));
  return <ProbetestListe fach={fach} entries={entries} known={loaded !== null} />;
}
