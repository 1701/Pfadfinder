// Im Text markieren: the units come from splitUnits() (CLAUDE.md), the same function the
// validator uses, so solution.indices mean the same thing here. Prüfen from the first choice.

import { useMemo, useState } from 'react';
import { splitUnits } from '../../domain/content/units';
import { keepNumbersTogether } from '../text/numbers';
import { toggleKey, UnitPicker } from './UnitPicker';
import type { FormatProps } from './types';

export function MarkInText({
  item,
  answer,
  onChange,
  disabled,
  revealed,
}: FormatProps<'mark-in-text'>) {
  const { text, unit, maxSelect } = item.payload;
  const units = useMemo(
    () => splitUnits(text, unit).map((t, index) => ({ key: index, text: keepNumbersTogether(t) })),
    [text, unit],
  );
  const [chosen, setChosen] = useState<number[]>(() => answer?.indices ?? []);
  const order = units.map((u) => u.key);

  return (
    <UnitPicker
      units={units}
      chosen={chosen}
      max={maxSelect}
      disabled={disabled}
      solution={revealed?.solution.indices}
      layout={unit === 'word' ? 'words' : 'sentences'}
      label={unit === 'word' ? 'Wörter zum Antippen' : 'Sätze zum Antippen'}
      onToggle={(key) => {
        const next = toggleKey(chosen, key, order);
        setChosen(next);
        onChange(next.length > 0 ? { indices: next } : null);
      }}
    />
  );
}
