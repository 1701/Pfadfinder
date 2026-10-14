// Lückentext: each gap is a button in the running text. The open gap shows its three options in a
// row below the text – no native select. At the start the first gap is open, after each choice the
// next empty one; tapping a gap opens it again. Prüfen when every gap is filled.

import clsx from 'clsx';
import { useMemo, useState } from 'react';
import {
  clozeParts,
  presentedGapOptions,
  PRESENTATION_TEXTS as T,
} from '../../domain/presentation';
import { keepNumbersTogether as nb } from '../text/numbers';
import { SolutionMark, StateWords, tileClass, tileState } from './choice';
import type { FormatProps } from './types';

export function ClozeSelect({
  item,
  attemptIndex,
  answer,
  onChange,
  disabled,
  revealed,
}: FormatProps<'cloze-select'>) {
  const parts = useMemo(() => clozeParts(item.payload.template), [item]);
  const gaps = parts.flatMap((p) => (p.kind === 'gap' ? [p] : []));
  const options = useMemo(() => presentedGapOptions(item, attemptIndex), [item, attemptIndex]);
  const [filled, setFilled] = useState<Record<string, string>>(() => answer?.gaps ?? {});
  const [open, setOpen] = useState<string | null>(
    () => gaps.find((g) => filled[g.key] === undefined)?.key ?? null,
  );
  // After Prüfen the option row goes away; the chosen words stay in the text.
  const openGap = disabled ? undefined : gaps.find((g) => g.key === open);
  // Wide enough for the longest option, so the text does not jump when a gap gets filled.
  const width = `${Math.max(...item.payload.gaps.flatMap((g) => g.options.map((o) => o.length))) + 2}ch`;

  const choose = (key: string, value: string) => {
    const next = { ...filled, [key]: value };
    setFilled(next);
    const after = [...gaps.slice(gaps.findIndex((g) => g.key === key) + 1), ...gaps];
    setOpen(after.find((g) => next[g.key] === undefined)?.key ?? null);
    onChange(gaps.every((g) => next[g.key] !== undefined) ? { gaps: next } : null);
  };

  return (
    <div className="grid w-full gap-md">
      <p className="text-option">
        {parts.map((part, i) => {
          if (part.kind === 'text') return <span key={i}>{nb(part.text)}</span>;
          const value = filled[part.key];
          const right = revealed?.solution.gaps[part.key];
          const state = tileState(revealed !== undefined, value === right, value !== undefined);
          const isOpen = !disabled && open === part.key;
          return (
            <span key={i}>
              <button
                type="button"
                disabled={disabled}
                aria-expanded={disabled ? undefined : isOpen}
                aria-label={`${T.gap} ${part.number}: ${value ?? 'leer'}`}
                onClick={() => setOpen(isOpen ? null : part.key)}
                style={{ minWidth: width }}
                className={tileClass(
                  value === undefined && !revealed ? 'plain' : state,
                  !disabled,
                  clsx(
                    'mx-2xs my-2xs inline-flex justify-center px-md align-middle',
                    isOpen && 'border-signal-edge outline-2 outline-signal-edge',
                  ),
                )}
              >
                <SolutionMark state={state} />
                <span aria-hidden="true">{value === undefined ? '…' : nb(value)}</span>
              </button>
              {revealed && state === 'chosen' && right !== undefined && (
                <span className="text-correct">
                  {' '}
                  {T.rightIs.toLowerCase()} {nb(right)}
                </span>
              )}
            </span>
          );
        })}
      </p>
      {openGap && (
        <div
          role="group"
          aria-label={`${T.answersForGap} ${openGap.number}`}
          className="flex flex-wrap items-center gap-xs"
        >
          <span aria-hidden="true" className="mr-2xs text-ink-muted">
            {T.gap} {openGap.number}:
          </span>
          {(options[openGap.key] ?? []).map((option) => {
            const state = tileState(false, false, filled[openGap.key] === option);
            return (
              <button
                key={option}
                type="button"
                aria-pressed={filled[openGap.key] === option}
                onClick={() => choose(openGap.key, option)}
                style={{ minWidth: width }}
                className={tileClass(state, true, 'justify-center px-md')}
              >
                {nb(option)}
                <StateWords state={state} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
