// Today's goal in the map's header: the same Wegstriche as the item screen. Reached is a calm
// state: all dashes walked and "Geschafft." – no animation, no new color, no number above 10.

import type { TodayProgress } from '../../domain/progress';
import { Wegstriche } from '../components/Wegstriche';

export function tageszielText({ count, goal, reached }: TodayProgress): string {
  return `Heute: ${count} von ${goal} Fundstücken${reached ? '. Geschafft.' : ''}`;
}

export function Tagesziel(today: TodayProgress) {
  return (
    // Landscape: dashes above the text, so the header stays one row at 1024 px.
    // Portrait: side by side, so the header needs only a second row.
    <div className="flex flex-col items-end gap-xs text-ink-muted portrait:flex-row portrait:items-center portrait:gap-md">
      <Wegstriche
        total={today.goal}
        done={today.count}
        current={today.reached ? undefined : today.count + 1}
      />
      <p>{tageszielText(today)}</p>
    </div>
  );
}
