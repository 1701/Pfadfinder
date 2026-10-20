// The printed Probetest as its own lazy chunk: content parsing (Zod) and the paper forms, no
// store, no IndexedDB, no renderers.

import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { createContentLoader } from '../content-runtime/loader';
import { loadProbetestContext, type ProbetestContext } from '../data/probetest';
import { Druckansicht } from '../ui/print/Druckansicht';
import { UNAVAILABLE } from '../ui/text/probetest';

const content = createContentLoader();

export function PrintRoute() {
  const id = useParams().id ?? '';
  const [ctx, setCtx] = useState<ProbetestContext | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    void loadProbetestContext({ content }, id).then((loaded) => {
      if (active) setCtx(loaded);
    });
    return () => {
      active = false;
    };
  }, [id]);

  if (ctx === undefined) return null;
  if (ctx === null) return <p className="p-lg">{UNAVAILABLE}</p>;
  return <Druckansicht probetest={ctx.probetest} items={ctx.items} texts={ctx.texts} />;
}
