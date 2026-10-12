// The start page: title with Vorlesen, Tagesziel, the map filling the rest of the screen, and one
// legend line when there are blank spots. No scrolling on any iPad viewport.

import type { Bereich } from '../../domain/content/taxonomy';
import { BEREICHE } from '../../domain/content/taxonomy';
import type { RegionState, TodayProgress } from '../../domain/progress';
import { VorlesenButton } from '../components/VorlesenButton';
import { BEREICH_NAME } from '../text/bereiche';
import { Karte } from './Karte';
import { Tagesziel, tageszielText } from './Tagesziel';

export const KARTEN_TITLE = "Wohin geht's heute?";
const LEGEND = 'Gestrichelte Gebiete sind noch unerforscht.';

export interface KartenViewProps {
  /** Null while the progress is being read: the title shows, the map follows at once. */
  progress: { states: Record<Bereich, RegionState>; today: TodayProgress } | null;
  readAloud?: boolean;
}

function speech(progress: NonNullable<KartenViewProps['progress']>): string {
  const open = BEREICHE.filter((b) => progress.states[b].kind !== 'unerforscht');
  return [
    KARTEN_TITLE,
    tageszielText(progress.today),
    open.length > 0 ? `Du kannst wählen: ${open.map((b) => BEREICH_NAME[b]).join(', ')}.` : '',
  ]
    .filter(Boolean)
    .join(' ');
}

export function KartenView({ progress, readAloud = true }: KartenViewProps) {
  const unexplored =
    progress !== null && BEREICHE.some((b) => progress.states[b].kind === 'unerforscht');
  return (
    <main
      className="screen-fit mx-auto grid max-w-page grid-rows-[auto_minmax(0,1fr)_auto] gap-sm px-lg py-sm"
      aria-busy={progress === null}
    >
      <header className="flex flex-wrap items-center justify-between gap-x-lg gap-y-xs">
        <div className="flex items-center gap-lg">
          {readAloud && <VorlesenButton text={progress ? speech(progress) : KARTEN_TITLE} />}
          <h1 className="text-display font-bold">{KARTEN_TITLE}</h1>
        </div>
        {progress && <Tagesziel {...progress.today} />}
      </header>
      <div className="min-h-0">{progress && <Karte states={progress.states} />}</div>
      {/* Reserved line: the map does not jump when the legend appears. */}
      <p className="min-h-touch text-ink-muted">{unexplored && LEGEND}</p>
    </main>
  );
}
