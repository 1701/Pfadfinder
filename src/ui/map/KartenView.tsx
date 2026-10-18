// The start page: title with Vorlesen, Tagesziel, the map filling the rest of the screen, and one
// legend line when there are blank spots. No scrolling on any iPad viewport.
// While the Einstieg is offered, its question is the title, with "Los" and "Später" beside it,
// and the Tagesziel steps aside (it could only say "0 von 10"): the map keeps its full size.
// A Fach with a Probetest gets a quiet line "Probetest Mathe" at the left of the legend line,
// right below the Mathe island in landscape; in portrait the water between the islands is too
// narrow for a 48 px target (measured 2026-10-15), so it stays in the same line.

import clsx from 'clsx';
import { Link } from 'react-router';
import type { Bereich, Fach } from '../../domain/content/taxonomy';
import { BEREICHE } from '../../domain/content/taxonomy';
import type { RegionState, TodayProgress } from '../../domain/progress';
import { Button, buttonClass } from '../components/Button';
import { QUIET_ACTION_CLASS } from '../components/quiet';
import { UpdateHinweis, type AppUpdate } from '../components/UpdateHinweis';
import { VorlesenButton } from '../components/VorlesenButton';
import { BEREICH_NAME, FACH_NAME } from '../text/bereiche';
import { OFFER_GO, OFFER_LATER, OFFER_TITLE } from '../text/einstieg';
import { Karte } from './Karte';
import { Tagesziel, tageszielText } from './Tagesziel';

export const KARTEN_TITLE = "Wohin geht's heute?";
const LEGEND = 'Gestrichelte Gebiete sind noch unerforscht.';

export interface KartenViewProps {
  /** Null while the progress is being read: the title shows, the map follows at once. */
  progress: { states: Record<Bereich, RegionState>; today: TodayProgress } | null;
  /** The Einstieg offer for one Fach; null when there is none or after "Später". */
  offer?: { fach: Fach; onLater(): void } | null;
  /** The Probetest each Fach offers (the first in the manifest); none for a Fach without one. */
  probetests?: readonly { fach: Fach; id: string }[];
  readAloud?: boolean;
  /** "Neue Version – Neu laden" in the legend line, for adults (task 11). */
  update?: AppUpdate;
}

function speech(progress: NonNullable<KartenViewProps['progress']>, offered: boolean): string {
  const open = BEREICHE.filter((b) => progress.states[b].kind !== 'unerforscht');
  const names = open.map((b) => BEREICH_NAME[b]).join(', ');
  if (offered) {
    return `${OFFER_TITLE} Tippe auf ${OFFER_GO}, oder wähle gleich ein Gebiet: ${names}.`;
  }
  return [
    KARTEN_TITLE,
    tageszielText(progress.today),
    open.length > 0 ? `Du kannst wählen: ${names}.` : '',
  ]
    .filter(Boolean)
    .join(' ');
}

export function KartenView({
  progress,
  offer = null,
  probetests = [],
  readAloud = true,
  update = null,
}: KartenViewProps) {
  const unexplored =
    progress !== null && BEREICHE.some((b) => progress.states[b].kind === 'unerforscht');
  return (
    <main
      className="screen-fit mx-auto grid max-w-page grid-rows-[auto_minmax(0,1fr)_auto] gap-sm px-lg py-sm"
      aria-busy={progress === null}
    >
      <header className="flex flex-wrap items-center justify-between gap-x-lg gap-y-xs">
        {offer ? (
          <div className="flex items-center gap-md">
            {readAloud && progress && <VorlesenButton text={speech(progress, true)} />}
            <h1 className="text-heading font-bold whitespace-nowrap">{OFFER_TITLE}</h1>
            <Link
              to={`/einstieg/${offer.fach}`}
              className={clsx(buttonClass('primary', 'small'), 'flex items-center')}
            >
              {OFFER_GO}
            </Link>
            <Button onClick={offer.onLater}>{OFFER_LATER}</Button>
          </div>
        ) : (
          <div className="flex items-center gap-lg">
            {readAloud && (
              <VorlesenButton text={progress ? speech(progress, false) : KARTEN_TITLE} />
            )}
            <h1 className="text-display font-bold">{KARTEN_TITLE}</h1>
          </div>
        )}
        {progress && !offer && <Tagesziel {...progress.today} />}
      </header>
      <div className="min-h-0">{progress && <Karte states={progress.states} />}</div>
      {/* Reserved line: the map does not jump when the legend appears. */}
      <div className="flex min-h-touch flex-wrap items-center justify-between gap-x-lg">
        {probetests.map(({ fach, id }) => (
          <Link key={id} to={`/probetest/${id}`} className={QUIET_ACTION_CLASS}>
            Probetest {FACH_NAME[fach]}
          </Link>
        ))}
        <div className="flex flex-wrap items-center gap-x-lg">
          <p className="text-ink-muted">{unexplored && LEGEND}</p>
          <UpdateHinweis update={update} />
        </div>
      </div>
    </main>
  );
}
