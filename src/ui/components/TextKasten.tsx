// The reading text (PRODUCT.md §5.4, task 9): on the reading screen and beside or above every
// item of the text. Only this box scrolls, never the page. Paragraphs carry their number on the
// left margin, because items refer to paragraphs, never to lines (CONTENT_SCHEMA 1.0.10).
// A still fade at the bottom says "there is more below" and is gone at the end of the text; the
// same fade at the top appears once the text is scrolled (data-more-above).
// The title stands only on the reading screen (`showTitle`); beside an item it would cost a line
// of text. Its own Vorlesen reads title and text, only where the text allows it
// (ReadingText.readAloud).

import clsx from 'clsx';
import { useId, useLayoutEffect, useRef, useState } from 'react';
import type { ReadingText } from '../../domain/content';
import { textSpeech } from '../../domain/presentation';
import { VorlesenButton } from './VorlesenButton';

export interface TextKastenProps {
  text: ReadingText;
  /** Vorlesen for the text: ReadingText.readAloud, and off in the Probetest where it says so. */
  readAloud: boolean;
  /** Scroll position to start from (kept across the items of a round). */
  scrollTop?: number;
  onScroll?(scrollTop: number): void;
  /** The reading screen shows the title; beside an item the box has none. */
  showTitle?: boolean;
  className?: string;
}

/** Less than this many pixels left below counts as the end of the text (sub-pixel rounding). */
const END_TOLERANCE = 1;

export function TextKasten({
  text,
  readAloud,
  scrollTop,
  onScroll,
  showTitle = false,
  className,
}: TextKastenProps) {
  const titleId = useId();
  const scroller = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState({ above: false, below: false });

  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    if (scrollTop !== undefined) el.scrollTop = scrollTop;
    const update = () => {
      const below = el.scrollHeight - el.scrollTop - el.clientHeight > END_TOLERANCE;
      const above = el.scrollTop > END_TOLERANCE;
      setMore((m) => (m.above === above && m.below === below ? m : { above, below }));
    };
    update();
    // Fonts, rotation and the feedback band change the height: look again.
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    observer?.observe(el);
    if (el.firstElementChild) observer?.observe(el.firstElementChild);
    el.addEventListener('scroll', update, { passive: true });
    return () => {
      observer?.disconnect();
      el.removeEventListener('scroll', update);
    };
    // The start position applies when the box appears, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text.id]);

  return (
    <div
      data-region="text"
      data-more-below={more.below}
      data-more-above={more.above}
      className={clsx(
        'text-box grid min-h-0 gap-x-md gap-y-xs rounded-sheet border border-line bg-surface px-lg pt-sm',
        !showTitle && 'text-box-untitled',
        className,
      )}
    >
      {readAloud && (
        <div className="[grid-area:read]">
          <VorlesenButton key={text.id} text={textSpeech(text)} />
        </div>
      )}
      {showTitle && (
        <h2 id={titleId} className="self-center text-prompt font-bold [grid-area:title]">
          {text.title}
        </h2>
      )}
      <div className="relative min-h-0 [grid-area:body]">
        <div
          ref={scroller}
          role="region"
          {...(showTitle ? { 'aria-labelledby': titleId } : { 'aria-label': text.title })}
          // `relative`: the sr-only paragraph labels stay inside the box instead of lengthening
          // the page. A scrolling region must be reachable by keyboard (WCAG 2.1.1, axe scrollable-region-focusable).
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
          onScroll={onScroll && ((e) => onScroll(e.currentTarget.scrollTop))}
          className="relative h-full overflow-y-auto overscroll-contain pb-md"
        >
          <ol className="grid gap-sm text-reading">
            {text.paragraphs.map((paragraph, i) => (
              <li key={i} className="grid grid-cols-[auto_minmax(0,1fr)] gap-sm">
                <span className="min-w-lg text-right text-ink-muted tabular-nums" aria-hidden>
                  {i + 1}
                </span>
                <p>
                  <span className="sr-only">Absatz {i + 1}: </span>
                  {paragraph}
                </p>
              </li>
            ))}
          </ol>
        </div>
        {more.above && (
          <div
            data-fade="above"
            aria-hidden
            className="text-box-fade-above pointer-events-none absolute inset-x-0 top-0"
          />
        )}
        {more.below && (
          <div
            data-fade="below"
            aria-hidden
            className="text-box-fade-below pointer-events-none absolute inset-x-0 bottom-0"
          />
        )}
      </div>
    </div>
  );
}
