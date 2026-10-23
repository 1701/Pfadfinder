// The item screen, fixed layout (pfadfinder-ui): progress, task sheet with Vorlesen, answer area,
// and a bottom band where "Prüfen" turns into "Weiter" in the same place. Pure layout: the
// practice screen, the Einstieg (button "Weiter", no feedback) and the dev preview feed it.
// A self-rated format (short-answer) has one step more: "Vergleichen" shows the model answer, the
// band asks for the child's own rating, and only that rating submits the answer.
// The Probetest replaces the header ("Übersicht", "7 von 24", minutes) and, while answering, the
// band ("Zurück" | "Weiter", no checking; a short answer is only typed in).
// An item of a reading text gets the TextKasten (`text`): a column on the left in landscape, a
// block of fixed height on top in portrait (.item-with-text); only that box scrolls.

import clsx from 'clsx';
import { useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import type { Item, ItemOf } from '../../domain/content';
import type { Correctness, SelfRating } from '../../domain/evaluation';
import { comparisonSpeech, itemSpeech } from '../../domain/presentation';
import { Button } from '../components/Button';
import { ContentAsset, isWideAsset } from '../components/ContentAsset';
import { FeedbackPanel } from '../components/FeedbackPanel';
import { Fortschritt, type FortschrittProps } from '../components/Fortschritt';
import { QUIET_ACTION_CLASS } from '../components/quiet';
import { RatingBand } from '../components/RatingBand';
import { VorlesenButton } from '../components/VorlesenButton';
import { formatEntry, FormatRenderer } from '../formats/registry';
import { keepNumbersWithWords as nb } from '../text/numbers';

export interface ItemScreenProps {
  item: Item;
  attemptIndex: number;
  answer: unknown;
  onAnswer(answer: unknown): void;
  phase: 'answering' | 'checking' | 'feedback';
  /** Set in the feedback phase. */
  correct: Correctness | null;
  /** Shown in the default header; not needed with `header`. */
  progress?: FortschrittProps;
  readAloud: boolean;
  /** Submits the current answer; a self-rated format passes the completed answer along. */
  onSubmit(answer?: unknown): void;
  onNext(): void;
  /** Label of the submit button; the Einstieg says "Weiter" and shows no feedback. */
  submitLabel?: string;
  /** "Pause" either leads somewhere (practice: continued next time) or asks first (Einstieg). */
  pause?: { to: string } | { onPause(): void };
  /** Replaces the default header (Pause + Fortschritt): a complete <header> element. */
  header?: ReactNode;
  /** Replaces the submit button while answering: the band's buttons (Probetest navigation). */
  actions?: ReactNode;
  /** Passed to the feedback band: a second button left of "Weiter", and its label. */
  feedbackBack?: { label: string; onClick(): void };
  nextLabel?: string;
  /** Feedback band for an item without an answer (Probetest review): this heading, no "Falle". */
  feedbackMissing?: string;
  /** Left of the submit button, e.g. "Zurück" before "Vergleichen" in the Probetest review. */
  bandStart?: ReactNode;
  /** The answer can no longer change (Probetest review): the renderer is disabled. */
  locked?: boolean;
  /** Dev preview only: open a self-rated item directly in the comparing step. */
  previewComparing?: boolean;
  /** The reading text of the item (a TextKasten). */
  text?: ReactNode;
}

export interface ItemKopfProps {
  /** "Pause" either leads somewhere (practice: continued next time) or asks first (Einstieg). */
  pause?: { to: string } | { onPause(): void };
  progress?: FortschrittProps;
}

/** The default top line: Pause on the left, Fortschritt on the right (also the reading screen). */
export function ItemKopf({ pause, progress }: ItemKopfProps) {
  return (
    <header className="flex items-center justify-between gap-md">
      {pause &&
        ('to' in pause ? (
          <Link to={pause.to} className={QUIET_ACTION_CLASS}>
            Pause
          </Link>
        ) : (
          <button type="button" onClick={pause.onPause} className={QUIET_ACTION_CLASS}>
            Pause
          </button>
        ))}
      {progress && <Fortschritt {...progress} />}
    </header>
  );
}

/** Quiet text action at the top left; re-exported for the screens that import it from here. */
export { QUIET_ACTION_CLASS };

export function ItemScreen(props: ItemScreenProps) {
  const { item, phase, correct } = props;
  const entry = formatEntry(item);
  const presentation = `${item.id}#${props.attemptIndex}`;
  // The comparing step belongs to one presentation; a new item starts without it.
  const [comparingKey, setComparingKey] = useState<string | null>(
    props.previewComparing ? presentation : null,
  );
  const compared = comparingKey === presentation;
  const comparing = compared && phase === 'answering';
  const revealed = phase === 'feedback' && correct !== null ? { correct } : undefined;
  const { assetId, assetAlt = '' } = item.stimulus ?? {};
  const asset = assetId && <ContentAsset assetId={assetId} alt={assetAlt} />;
  const assetBeside = assetId !== undefined && !isWideAsset(assetId);

  const rate = (rating: SelfRating) => {
    const answer = { ...(props.answer as object), rating };
    props.onAnswer(answer);
    props.onSubmit(answer);
  };

  let band;
  if (revealed) {
    band = (
      <FeedbackPanel
        data-region="band"
        correct={revealed.correct}
        feedback={item.feedback}
        onNext={props.onNext}
        readAloud={props.readAloud}
        verdict={!entry.selfRated}
        note={entry.bandNote?.(item)}
        back={props.feedbackBack}
        nextLabel={props.nextLabel}
        missing={props.feedbackMissing}
      />
    );
  } else if (comparing) {
    band = (
      <RatingBand
        data-region="band"
        onRate={rate}
        speech={comparisonSpeech(item as ItemOf<'short-answer'>)}
        readAloud={props.readAloud}
      />
    );
  } else if (props.actions) {
    band = (
      <div data-region="band" className="flex items-end justify-between gap-md">
        {props.actions}
      </div>
    );
  } else {
    band = (
      <div
        data-region="band"
        className={clsx(
          'flex items-end gap-md',
          props.bandStart ? 'justify-between' : 'justify-end',
        )}
      >
        {props.bandStart}
        <Button
          variant="primary"
          disabled={props.answer === null || phase !== 'answering'}
          onClick={() => (entry.selfRated ? setComparingKey(presentation) : props.onSubmit())}
        >
          {props.submitLabel ?? entry.submitLabel ?? 'Prüfen'}
        </Button>
      </div>
    );
  }

  return (
    <main
      className={clsx(
        'screen-fit mx-auto grid max-w-page gap-sm px-lg py-sm',
        props.text ? 'item-with-text' : 'grid-rows-[auto_auto_1fr_auto]',
      )}
      data-format={props.text ? item.format : undefined}
    >
      {props.header ?? <ItemKopf pause={props.pause} progress={props.progress} />}

      {props.text}

      <section
        data-region="sheet"
        className="flex items-start gap-lg rounded-sheet border border-line bg-surface px-lg py-sm"
      >
        {props.readAloud && (
          <VorlesenButton key={item.id} text={itemSpeech(item, props.attemptIndex, props.answer)} />
        )}
        {/* The picture stands between stimulus and prompt; in landscape a narrow one moves beside
            the text (index.css, .sheet-body). */}
        <div
          className="sheet-body grid min-w-0 flex-1 gap-xs"
          data-picture={assetBeside ? 'beside' : undefined}
        >
          {item.stimulus?.text && <p className="text-option">{nb(item.stimulus.text)}</p>}
          {asset}
          <h1 className="text-prompt font-bold">{nb(item.prompt)}</h1>
        </div>
      </section>

      {/* Top-aligned: the options must not move when the feedback rises below them. */}
      <div data-region="answer" className="flex min-h-0 items-start justify-center pt-xs">
        <FormatRenderer
          key={presentation}
          item={item}
          attemptIndex={props.attemptIndex}
          answer={props.answer}
          onChange={props.onAnswer}
          disabled={phase !== 'answering' || comparing || props.locked === true}
          revealed={revealed}
          showSolution={entry.selfRated && (compared || revealed !== undefined)}
        />
      </div>

      {band}
    </main>
  );
}
