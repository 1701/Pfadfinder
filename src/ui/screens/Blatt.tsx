// The quiet frame around the questions: the Einstieg's intro, pause and hints, the choice between
// Fortsetzen and Neu anfangen, and the Eltern page. Same rows as the item screen (top line, sheet
// with Vorlesen, bottom band), so the hand finds the next step in the same place.

import type { ReactNode } from 'react';
import { VorlesenButton } from '../components/VorlesenButton';

export interface BlattProps {
  /** Top left, e.g. the quiet "Zur Karte". */
  left?: ReactNode;
  /** Top right, e.g. the Wegstriche. */
  right?: ReactNode;
  title: string;
  text?: string;
  readAloud: boolean;
  /** The bottom band; the last action sits at the bottom right. */
  actions: ReactNode;
  /** Below the sheet, e.g. the digit pad of the Eltern question. */
  children?: ReactNode;
}

export function Blatt({ left, right, title, text, readAloud, actions, children }: BlattProps) {
  return (
    <main className="screen-fit mx-auto grid max-w-page grid-rows-[auto_1fr_auto] gap-sm px-lg py-sm">
      <header className="flex min-h-touch items-center justify-between gap-md">
        {left ?? <span />}
        {right}
      </header>
      <div className="flex min-h-0 flex-col items-center justify-center gap-lg">
        <section className="flex w-full items-start gap-lg rounded-sheet border border-line bg-surface px-lg py-sm">
          {readAloud && <VorlesenButton key={title} text={text ? `${title} ${text}` : title} />}
          <div className="grid gap-xs pt-xs">
            <h1 className="text-prompt font-bold">{title}</h1>
            {text && <p className="text-option">{text}</p>}
          </div>
        </section>
        {children}
      </div>
      <div data-region="band" className="flex items-end justify-between gap-md">
        {actions}
      </div>
    </main>
  );
}
