// The start page: title with Vorlesen, Tagesziel, the map filling the rest of the screen, and one
// line below it. No scrolling on any iPad viewport. There is no legend of the blank spots (task
// 11): a dashed Gebiet says "noch keine Aufgaben" in its name for screen readers (Karte);
// "Unerforscht" belongs to the offer.
// While the Einstieg is offered, "Unerforscht: Mathe" is the title, with "Erkunden" and "Später"
// beside it, and the Tagesziel steps aside (it could only say "0 von 10"): the map keeps its full
// size. Measured in portrait (768 px, 2026-10-19), end of the row Mathe/Deutsch: "… ist noch
// unerforscht." 824/849, with gap-sm 812/837, "Noch unerforscht: …" 768/793, "Unerforscht: …"
// 686/711 with gap-sm and 698/723 with gap-md. Hence the short title, with gap-md.
// A Fach with a Probetest gets a quiet line "Probetest Mathe" at the left of the legend line,
// right below the Mathe island in landscape; in portrait the water between the islands is too
// narrow for a 48 px target (measured 2026-10-15), so it stays in the same line.
// At the right of the line, quietly: "Neu laden" while a new version waits, and
// "Impressum · Datenschutz" in every viewport (DDG). Measured in Safari (task 11): the long
// "Neue Version – Neu laden" took the Gebietsnamen to 17.2 px landscape and 15.7 px portrait;
// a second row costs them about 1.2 px in Safari portrait, so the line stays one row.

import clsx from 'clsx';
import { Link } from 'react-router';
import type { Bereich, Fach } from '../../domain/content/taxonomy';
import { BEREICHE } from '../../domain/content/taxonomy';
import type { RegionState, TodayProgress } from '../../domain/progress';
import { Button, buttonClass } from '../components/Button';
import { QUIET_ACTION_CLASS } from '../components/quiet';
import { RechtlichesLinks } from '../components/RechtlichesLinks';
import { UpdateHinweis, type AppUpdate } from '../components/UpdateHinweis';
import { VorlesenButton } from '../components/VorlesenButton';
import { BEREICH_NAME } from '../text/bereiche';
import { probetestName } from '../text/probetest';
import { OFFER_GO, OFFER_LATER, offerSpeech, offerTitle } from '../text/einstieg';
import { Karte } from './Karte';
import { Tagesziel, tageszielText } from './Tagesziel';

export const KARTEN_TITLE = 'Wohin geht’s heute?';

export interface KartenViewProps {
  /** Null while the progress is being read: the title shows, the map follows at once. */
  progress: { states: Record<Bereich, RegionState>; today: TodayProgress } | null;
  /** The Einstieg offer for one Fach; null when there is none or after "Später". */
  offer?: { fach: Fach; onLater(): void } | null;
  /** The Probetest each Fach offers (the first in the manifest); none for a Fach without one. */
  probetests?: readonly { fach: Fach; id: string }[];
  readAloud?: boolean;
  /** "Neu laden" in the line below the map, for adults (task 11). */
  update?: AppUpdate;
}

function speech(progress: NonNullable<KartenViewProps['progress']>, offered: Fach | null): string {
  const open = BEREICHE.filter((b) => progress.states[b].kind !== 'unerforscht');
  const names = open.map((b) => BEREICH_NAME[b]);
  if (offered) return offerSpeech(offered, names);
  return [
    KARTEN_TITLE,
    tageszielText(progress.today),
    open.length > 0 ? `Du kannst wählen: ${names.join(', ')}.` : '',
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
  return (
    <main
      className="screen-fit mx-auto grid max-w-page grid-rows-[auto_minmax(0,1fr)_auto] gap-sm px-lg py-sm"
      aria-busy={progress === null}
    >
      <header className="flex flex-wrap items-center justify-between gap-x-lg gap-y-xs">
        {offer ? (
          <div className="flex items-center gap-md">
            {readAloud && progress && <VorlesenButton text={speech(progress, offer.fach)} />}
            <h1 className="text-heading font-bold whitespace-nowrap">{offerTitle(offer.fach)}</h1>
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
              <VorlesenButton text={progress ? speech(progress, null) : KARTEN_TITLE} />
            )}
            <h1 className="text-display font-bold">{KARTEN_TITLE}</h1>
          </div>
        )}
        {progress && !offer && <Tagesziel {...progress.today} />}
      </header>
      <div className="min-h-0">{progress && <Karte states={progress.states} />}</div>
      {/* Reserved line: the map does not jump when "Neu laden" appears. */}
      <div className="flex min-h-touch flex-wrap items-center justify-end gap-x-lg">
        {probetests.map(({ fach, id }) => (
          <Link key={id} to={`/probetest/${id}`} className={clsx(QUIET_ACTION_CLASS, 'mr-auto')}>
            {probetestName(fach)}
          </Link>
        ))}
        <UpdateHinweis update={update} onMap />
        <RechtlichesLinks />
      </div>
    </main>
  );
}
