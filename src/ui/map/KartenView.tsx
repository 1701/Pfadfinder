// The start page: title with Vorlesen, Tagesziel, the map filling the rest of the screen, and one
// line below it. No scrolling on any iPad viewport. There is no legend of the blank spots (task
// 11): a dashed Gebiet says "noch keine Aufgaben" in its name for screen readers (Karte);
// "Unerforscht" belongs to the offer.
// While the Einstieg is offered, "Unerforscht: Mathe" is the title, with "Erkunden" and "Später"
// beside it, and the Tagesziel steps aside (it could only say "0 von 10"): the map keeps its full
// size. Measured in portrait (768 px, 2026-10-19), end of the row Mathe/Deutsch: "… ist noch
// unerforscht." 824/849, with gap-sm 812/837, "Noch unerforscht: …" 768/793, "Unerforscht: …"
// 686/711 with gap-sm and 698/723 with gap-md. Hence the short title, with gap-md.
// The line below the map (task 14): left the Probetests as one quiet group "Probetest Mathe ·
// Probetest Deutsch", right "Impressum · Datenschutz" (DDG) in the same look, both at the edges.
// In portrait the water between the islands is too narrow for a 48 px target (measured
// 2026-10-15), so the Probetests stay in this line. "Neu laden" (a new version waits, for adults)
// stands left of "Impressum" in landscape; in portrait it gets its own row above the groups,
// right-aligned. That row costs the map 48 px: Gebietsnamen ≥ 18 px on the iPad (768×1024),
// ≥ 17 px only in Safari portrait (768×900) while "Neu laden" shows (decision Markus, task 14).
// For that the page padding in portrait is 8 px instead of 12 px, always, so the map does not
// jump when the button appears (Safari portrait with "Neu laden" 16.955 → 17.2 px).
// Measured in Safari (task 11): the long "Neue Version – Neu laden" took the names to 17.2 px
// landscape, so the map says only "Neu laden".

import clsx from 'clsx';
import { Link } from 'react-router';
import type { Bereich, Fach } from '../../domain/content/taxonomy';
import { BEREICHE } from '../../domain/content/taxonomy';
import type { RegionState, TodayProgress } from '../../domain/progress';
import { Button, buttonClass } from '../components/Button';
import { QuietLinks } from '../components/QuietLinks';
import { RechtlichesLinks } from '../components/RechtlichesLinks';
import { UpdateHinweis, type AppUpdate } from '../components/UpdateHinweis';
import { VorlesenButton } from '../components/VorlesenButton';
import { BEREICH_NAME } from '../text/bereiche';
import { probetestName } from '../text/probetest';
import { OFFER_GO, OFFER_LATER, offerSpeech, offerTitle } from '../text/einstieg';
import { Karte } from './Karte';
import { FUNDSTUECK_HINWEIS, Tagesziel, tageszielText } from './Tagesziel';

export const KARTEN_TITLE = 'Wohin geht’s heute?';

export interface KartenViewProps {
  /** Null while the progress is being read: the title shows, the map follows at once. */
  progress: {
    states: Record<Bereich, RegionState>;
    today: TodayProgress;
    /** No Fundstück on any day yet (task 17): the Tagesziel says what they are for. */
    firstHint?: boolean;
  } | null;
  /** The Einstieg offer for one Fach; null when there is none or after "Später". */
  offer?: { fach: Fach; onLater(): void } | null;
  /** The Fächer with a Probetest; each links to its list (task 16), none for a Fach without one. */
  probetests?: readonly Fach[];
  readAloud?: boolean;
  /** "Neu laden" in the line below the map, for adults (task 11). */
  update?: AppUpdate;
}

function speech(progress: NonNullable<KartenViewProps['progress']>, offered: Fach | null): string {
  const open = BEREICHE.filter((b) => progress.states[b].kind !== 'unerforscht');
  const names = open.map((b) => BEREICH_NAME[b]);
  if (offered) return offerSpeech(offered, names);
  const today = tageszielText(progress.today);
  return [
    KARTEN_TITLE,
    today.endsWith('.') ? today : `${today}.`,
    progress.firstHint ? FUNDSTUECK_HINWEIS : '',
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
      className="screen-fit mx-auto grid max-w-page grid-rows-[auto_minmax(0,1fr)_auto] gap-sm px-lg py-sm portrait:py-xs"
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
        {progress && !offer && <Tagesziel {...progress.today} firstHint={progress.firstHint} />}
      </header>
      <div className="min-h-0">{progress && <Karte states={progress.states} />}</div>
      {/* Reserved line: in landscape the map does not jump when "Neu laden" appears. */}
      <div className="flex min-h-touch flex-wrap items-center gap-x-lg">
        {probetests.length > 0 && (
          <QuietLinks
            label="Probetests"
            links={probetests.map((fach) => ({
              to: `/probetest/${fach}`,
              text: probetestName(fach),
            }))}
          />
        )}
        {update && (
          <div className="flex justify-end portrait:order-first portrait:basis-full landscape:ml-auto">
            <UpdateHinweis update={update} onMap />
          </div>
        )}
        <RechtlichesLinks className={update ? 'portrait:ml-auto' : 'ml-auto'} />
      </div>
    </main>
  );
}
