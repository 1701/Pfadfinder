// The top line of the Probetest: a quiet action on the left, "7 von 24" in the middle and the
// time on the right (pfadfinder-ui: the calm time display is the Probetest's one memorable
// element). Minutes only, no seconds, no red, no motion; in the last five minutes the words
// "Noch 5 Minuten" … "Noch 1 Minute" take the place of the minutes.

import type { ReactNode } from 'react';
import { timeText } from '../text/probetest';

export interface ProbetestZeit {
  minutes: number;
  /** The last five minutes. */
  final: boolean;
}

export function Zeit({ minutes, final }: ProbetestZeit) {
  return (
    <>
      <p className="text-ink-muted">{timeText(minutes, final)}</p>
      {/* Said once, when five minutes are left; later changes of this region are empty. */}
      <p aria-live="polite" className="sr-only">
        {final && minutes === 5 ? timeText(minutes, final) : ''}
      </p>
    </>
  );
}

export function ProbetestKopf(props: {
  left: ReactNode;
  /** 1-based item on screen. */
  current?: number;
  total?: number;
  right?: ReactNode;
}) {
  return (
    <header data-kopf="" className="grid min-h-touch grid-cols-[1fr_auto_1fr] items-center gap-md">
      <div className="justify-self-start">{props.left}</div>
      {props.current ? (
        <p className="text-ink-muted">
          <span className="sr-only">Aufgabe </span>
          {props.current} von {props.total}
        </p>
      ) : (
        <span />
      )}
      <div className="justify-self-end">{props.right}</div>
    </header>
  );
}
