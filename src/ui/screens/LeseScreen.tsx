// The reading screen (PRODUCT.md §5.4, task 9): before the first item of a text in a round. The
// instruction "Lies den Text." stands where an item has its prompt, with Vorlesen (instruction and
// title). Below it the whole text in its box, with the title and its own Vorlesen, and the yellow
// "Weiter" where "Prüfen" will be. The item that follows counts in the Fortschritt.
// The Probetest passes its own top line (`header`) and switches both Vorlesen off (task 13).

import type { ReactNode } from 'react';
import type { ReadingText } from '../../domain/content';
import { Button } from '../components/Button';
import { TextKasten } from '../components/TextKasten';
import { VorlesenButton } from '../components/VorlesenButton';
import { LESEN_ANWEISUNG } from '../text/lesen';
import { ItemKopf, type ItemKopfProps } from './ItemScreen';

export interface LeseScreenProps extends ItemKopfProps {
  text: ReadingText;
  /** Vorlesen on this screen (the learner's setting). */
  readAloud: boolean;
  /** Vorlesen for the text itself: ReadingText.readAloud, off where the Probetest says so. */
  textReadAloud: boolean;
  onNext(): void;
  /** Its own top line instead of Pause and Fortschritt (the Probetest's Kopf). */
  header?: ReactNode;
  /** Dev preview only: where the box starts. */
  scrollTop?: number;
}

/** What the instruction's Vorlesen says: the instruction and which text it is. */
export function leseSpeech(text: Pick<ReadingText, 'title'>): string {
  return `${LESEN_ANWEISUNG} ${text.title}`;
}

export function LeseScreen({
  text,
  readAloud,
  textReadAloud,
  onNext,
  pause,
  progress,
  header,
  scrollTop,
}: LeseScreenProps) {
  return (
    <main className="screen-fit mx-auto grid max-w-page grid-rows-[auto_auto_minmax(0,1fr)_auto] gap-sm px-lg py-sm">
      {header ?? <ItemKopf pause={pause} progress={progress} />}
      <section
        data-region="sheet"
        className="mx-auto flex w-full max-w-reading items-center gap-lg rounded-sheet border border-line bg-surface px-lg py-sm"
      >
        {readAloud && <VorlesenButton key={text.id} text={leseSpeech(text)} />}
        <h1 className="text-prompt font-bold">{LESEN_ANWEISUNG}</h1>
      </section>
      <TextKasten
        text={text}
        readAloud={readAloud && textReadAloud}
        scrollTop={scrollTop}
        showTitle
        className="mx-auto w-full max-w-reading"
      />
      <div data-region="band" className="flex items-end justify-end gap-md">
        <Button variant="primary" onClick={onNext}>
          Weiter
        </Button>
      </div>
    </main>
  );
}
