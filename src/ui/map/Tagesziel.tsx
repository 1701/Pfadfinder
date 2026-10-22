// Today's goal in the map's header: the same Wegstriche as the item screen. Reached is a calm
// state: all dashes walked and "Geschafft." – no animation, no new color, no number above 10.
// Until the very first Fundstück (task 17) one sentence in ink says what they are for: in
// landscape in place of the (empty) dashes, in portrait in place of dashes and "Heute …", so
// the header keeps its height and the map its size (measured in task 17: a second row made the
// Gebietsnamen in Safari portrait 17.8 px, with "Neu laden" 16.5 px).

import clsx from 'clsx';
import type { TodayProgress } from '../../domain/progress';
import { Wegstriche } from '../components/Wegstriche';

export const FUNDSTUECK_HINWEIS = 'Jede Aufgabe, die du übst, bringt dir ein Fundstück.';

export function tageszielText({ count, goal, reached }: TodayProgress): string {
  return `Heute: ${count} von ${goal} Fundstücken${reached ? '. Geschafft.' : ''}`;
}

export function Tagesziel({
  firstHint = false,
  ...today
}: TodayProgress & { firstHint?: boolean }) {
  return (
    // Landscape: dashes above the text, so the header stays one row at 1024 px.
    // Portrait: side by side, so the header needs only a second row.
    <div className="flex flex-col items-end gap-xs text-ink-muted portrait:flex-row portrait:items-center portrait:gap-md">
      {firstHint ? (
        <p className="text-ink landscape:text-right">{FUNDSTUECK_HINWEIS}</p>
      ) : (
        <Wegstriche
          total={today.goal}
          done={today.count}
          current={today.reached ? undefined : today.count + 1}
        />
      )}
      <p className={clsx(firstHint && 'portrait:hidden')}>{tageszielText(today)}</p>
    </div>
  );
}
