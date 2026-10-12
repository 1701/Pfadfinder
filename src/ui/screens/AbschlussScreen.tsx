// End of a session: always something positive (PRODUCT.md §6), no score, no confetti.

import { Link } from 'react-router';
import type { Bereich } from '../../domain/content';
import { VorlesenButton } from '../components/VorlesenButton';
import { BEREICH_NAME } from '../text/bereiche';

export interface AbschlussScreenProps {
  count: number;
  bereich: Bereich;
  readAloud?: boolean;
}

export function AbschlussScreen({ count, bereich, readAloud = true }: AbschlussScreenProps) {
  const title = `Heute geschafft: ${count} Fundstücke`;
  return (
    <main className="screen-fit grid place-content-center justify-items-center gap-lg px-lg text-center">
      <div className="flex items-center gap-lg">
        {readAloud && <VorlesenButton text={title} />}
        <h1 className="text-heading font-bold">{title}</h1>
      </div>
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
