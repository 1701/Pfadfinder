// The item screen, fixed layout (pfadfinder-ui): progress, task sheet with Vorlesen, answer area,
// and a bottom band where "Prüfen" turns into "Weiter" in the same place. Pure layout: the
// practice screen and the dev preview feed it.

import { Link } from 'react-router';
import { readAloudText, type Item } from '../../domain/content';
import type { Correctness } from '../../domain/evaluation';
import { Button } from '../components/Button';
import { FeedbackPanel } from '../components/FeedbackPanel';
import { Fortschritt, type FortschrittProps } from '../components/Fortschritt';
import { VorlesenButton } from '../components/VorlesenButton';
import { FormatRenderer } from '../formats/registry';
import { keepNumbersWithWords as nb } from '../text/numbers';

export interface ItemScreenProps {
  item: Item;
  attemptIndex: number;
  answer: unknown;
  onAnswer(answer: unknown): void;
  phase: 'answering' | 'checking' | 'feedback';
  /** Set in the feedback phase. */
  correct: Correctness | null;
  progress: FortschrittProps;
  readAloud: boolean;
  onSubmit(): void;
  onNext(): void;
  /** Where "Pause" leads; the session is continued next time. */
  pauseTo: string;
}

export function ItemScreen(props: ItemScreenProps) {
  const { item, phase, correct } = props;
  const revealed = phase === 'feedback' && correct !== null ? { correct } : undefined;

  return (
    <main className="screen-fit mx-auto grid max-w-page grid-rows-[auto_auto_1fr_auto] gap-sm px-lg py-sm">
      <header className="flex items-center justify-between gap-md">
        <Link
          to={props.pauseTo}
          className="flex min-h-touch items-center rounded-control px-sm text-ink-muted underline-offset-4 hover:underline"
        >
          Pause
        </Link>
        <Fortschritt {...props.progress} />
      </header>

      <section className="flex items-start gap-lg rounded-sheet border border-line bg-surface px-lg py-sm">
        {props.readAloud && <VorlesenButton key={item.id} text={readAloudText(item)} />}
        <div className="grid gap-xs">
          {item.stimulus?.text && <p className="text-option">{nb(item.stimulus.text)}</p>}
          <h1 className="text-prompt font-bold">{nb(item.prompt)}</h1>
        </div>
      </section>

      {/* Top-aligned: the options must not move when the feedback rises below them. */}
      <div data-region="answer" className="flex min-h-0 items-start justify-center pt-xs">
        <FormatRenderer
          key={`${item.id}#${props.attemptIndex}`}
          item={item}
          attemptIndex={props.attemptIndex}
          answer={props.answer}
          onChange={props.onAnswer}
          disabled={phase !== 'answering'}
          revealed={revealed}
        />
      </div>

      {revealed ? (
        <FeedbackPanel
          data-region="band"
          correct={revealed.correct}
          feedback={item.feedback}
          onNext={props.onNext}
          readAloud={props.readAloud}
        />
      ) : (
        <div data-region="band" className="flex items-end justify-end">
          <Button
            variant="primary"
            disabled={props.answer === null || phase !== 'answering'}
            onClick={props.onSubmit}
          >
            Prüfen
          </Button>
        </div>
      )}
    </main>
  );
}
