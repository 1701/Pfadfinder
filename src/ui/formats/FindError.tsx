// Fehler finden: the sentence as tappable words, at most errorCount chosen. The correct
// spelling is not shown here but in the feedback band, in both outcomes (registry bandNote).

import { useState } from 'react';
import { toggleKey, UnitPicker } from './UnitPicker';
import type { FormatProps } from './types';

export function FindError({
  item,
  answer,
  onChange,
  disabled,
  revealed,
}: FormatProps<'find-error'>) {
  const { words, errorCount } = item.payload;
  const [chosen, setChosen] = useState<string[]>(() => answer?.errorIds ?? []);
  const order = words.map((w) => w.id);

  return (
    <UnitPicker
      units={words.map((w) => ({ key: w.id, text: w.text }))}
      chosen={chosen}
      max={errorCount}
      disabled={disabled}
      solution={revealed?.solution.errorIds}
      layout="words"
      label="Wörter zum Antippen"
      onToggle={(key) => {
        const next = toggleKey(chosen, key, order);
        setChosen(next);
        onChange(next.length > 0 ? { errorIds: next } : null);
      }}
    />
  );
}
