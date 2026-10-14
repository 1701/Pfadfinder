// End of the Einstieg: the Fach's island with the starting Etappen. No numbers, no percent,
// no comparison (PRODUCT.md §5.4); the niveau is only in the Gebiete's names for screen readers.

import clsx from 'clsx';
import { Link } from 'react-router';
import type { Bereich, Fach } from '../../domain/content/taxonomy';
import type { RegionState } from '../../domain/progress';
import { buttonClass } from '../components/Button';
import { VorlesenButton } from '../components/VorlesenButton';
import { Karte } from '../map/Karte';
import { RESULT_SPEECH, RESULT_TITLE, TO_MAP } from '../text/einstieg';

export interface EinstiegErgebnisProps {
  fach: Fach;
  states: Record<Bereich, RegionState>;
  readAloud: boolean;
}

export function EinstiegErgebnis({ fach, states, readAloud }: EinstiegErgebnisProps) {
  return (
    <main className="screen-fit mx-auto grid max-w-page grid-rows-[auto_minmax(0,1fr)_auto] gap-sm px-lg py-sm">
      <header className="flex items-center gap-lg">
        {readAloud && <VorlesenButton text={RESULT_SPEECH} />}
        <h1 className="text-display font-bold">{RESULT_TITLE}</h1>
      </header>
      <div className="min-h-0">
        <Karte states={states} fach={fach} interactive={false} />
      </div>
      <div data-region="band" className="flex items-end justify-end">
        <Link to="/" className={clsx(buttonClass('primary'), 'flex items-center justify-center')}>
          {TO_MAP}
        </Link>
      </div>
    </main>
  );
}
