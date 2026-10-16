// The reading screen (PRODUCT.md §5.4, task 9): before the first item of a text in a round, the
// whole text in its box, with its own Vorlesen, and the yellow "Weiter" where "Prüfen" will be.
// Same top line as the item screen; the item that follows counts in the Fortschritt.

import type { ReadingText } from '../../domain/content';
import { Button } from '../components/Button';
import { TextKasten } from '../components/TextKasten';
import { ItemKopf, type ItemKopfProps } from './ItemScreen';

export interface LeseScreenProps extends ItemKopfProps {
  text: ReadingText;
  /** Vorlesen for the text (ReadingText.readAloud and the learner's setting). */
  readAloud: boolean;
  onNext(): void;
  /** Dev preview only: where the box starts. */
  scrollTop?: number;
}

export function LeseScreen({
  text,
  readAloud,
  onNext,
  pause,
  progress,
  scrollTop,
}: LeseScreenProps) {
  return (
    <main className="screen-fit mx-auto grid max-w-page grid-rows-[auto_minmax(0,1fr)_auto] gap-sm px-lg py-sm">
      <ItemKopf pause={pause} progress={progress} />
      <TextKasten
        text={text}
        readAloud={readAloud}
        scrollTop={scrollTop}
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
