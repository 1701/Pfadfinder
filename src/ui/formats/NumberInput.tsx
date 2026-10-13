// Zahleneingabe: digit pad only. The typed text stays local; the answer is reported once it is
// a complete German number (parseGermanNumber), otherwise null so Prüfen stays disabled.
// Landscape: field left, pad right (saves height); portrait: stacked. After checking the pad
// goes away (not dimmed): the typed number stays, and the feedback gets the room.

import clsx from 'clsx';
import { useState } from 'react';
import { parseGermanNumber } from '../../domain/evaluation';
import { ZiffernBlock } from '../components/ZiffernBlock';
import { formatGermanNumber, groupDraft, toDraft } from './number-format';
import type { FormatProps } from './types';

export function NumberInput({
  item,
  answer,
  onChange,
  disabled,
  revealed,
}: FormatProps<'number-input'>) {
  const { unit, allowDecimal = false, maxDigits } = item.payload;
  const [draft, setDraft] = useState(() => (answer ? toDraft(answer.value, unit) : ''));

  const update = (next: string) => {
    setDraft(next);
    const value = parseGermanNumber(next);
    onChange(value === null ? null : { value });
  };

  return (
    <div className="flex flex-col items-center gap-lg landscape:flex-row landscape:gap-3xl">
      <div className="grid justify-items-center gap-xs">
        <div className="flex items-center gap-sm">
          <output
            aria-label="Deine Zahl"
            className={clsx(
              'flex min-h-2xl min-w-3xs items-center justify-end rounded-control border-2 px-lg text-prompt font-bold',
              !revealed && 'border-line-strong bg-surface',
              revealed?.correct === true && 'border-correct bg-correct-surface',
              revealed && revealed.correct !== true && 'border-notyet bg-notyet-surface',
            )}
          >
            {groupDraft(draft)}
          </output>
          {unit && <span className="text-option">{unit}</span>}
        </div>
        {revealed && revealed.correct !== true && (
          <p className="text-option text-correct">
            Richtig ist: {formatGermanNumber(revealed.solution.value, unit)}
            {unit && ` ${unit}`}
          </p>
        )}
      </div>
      {!revealed && (
        <ZiffernBlock
          value={draft}
          onChange={update}
          allowDecimal={allowDecimal}
          maxDigits={maxDigits}
          disabled={disabled}
        />
      )}
    </div>
  );
}
