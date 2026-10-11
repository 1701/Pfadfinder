// End of a session: always something positive (PRODUCT.md §6), no score, no confetti.

import { Link } from 'react-router';
import type { Bereich } from '../../domain/content';
import { BEREICH_NAME } from '../text/bereiche';

export function AbschlussScreen({ count, bereich }: { count: number; bereich: Bereich }) {
  return (
    <main className="screen-fit grid place-content-center justify-items-center gap-lg px-lg text-center">
      <h1 className="text-heading font-bold">Heute geschafft: {count} Fundstücke</h1>
      <p className="text-option">Du warst heute im Gebiet {BEREICH_NAME[bereich]} unterwegs.</p>
      <Link
        to="/"
        className="flex min-h-touch items-center rounded-control border-2 border-line-strong bg-surface px-lg font-bold"
      >
        Zur Übersicht
      </Link>
    </main>
  );
}
