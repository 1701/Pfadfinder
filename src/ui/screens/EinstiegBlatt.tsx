// The quiet frame of the Einstieg around the questions: intro, pause and the hint that the
// journey has begun. Same rows as the item screen (top line, sheet with Vorlesen, bottom band),
// so the hand finds "Starten", "Weiter" and "Weitermachen" in the same place.

import type { ReactNode } from 'react';
import { VorlesenButton } from '../components/VorlesenButton';

export interface EinstiegBlattProps {
  /** Top left, e.g. the quiet "Zur Karte". */
  left?: ReactNode;
  /** Top right, e.g. the Wegstriche. */
  right?: ReactNode;
  title: string;
  text?: string;
  readAloud: boolean;
  /** The bottom band; the last action sits at the bottom right. */
  actions: ReactNode;
}

export function EinstiegBlatt({
  left,
  right,
  title,
  text,
  readAloud,
  actions,
}: EinstiegBlattProps) {
  return (
    <main className="screen-fit mx-auto grid max-w-page grid-rows-[auto_1fr_auto] gap-sm px-lg py-sm">
      <header className="flex min-h-touch items-center justify-between gap-md">
        {left ?? <span />}
        {right}
      </header>
      <div className="flex items-center">
        <section className="flex w-full items-start gap-lg rounded-sheet border border-line bg-surface px-lg py-sm">
          {readAloud && <VorlesenButton key={title} text={text ? `${title} ${text}` : title} />}
          <div className="grid gap-xs pt-xs">
            <h1 className="text-prompt font-bold">{title}</h1>
            {text && <p className="text-option">{text}</p>}
          </div>
        </section>
      </div>
      <div data-region="band" className="flex items-end justify-between gap-md">
        {actions}
      </div>
    </main>
  );
}
