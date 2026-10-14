// Developer preview of the Einstieg screens (dev build only): /dev/einstieg?zustand=
// intro | aufgabe | pause | ergebnis | hinweis. Used by tests/e2e/einstieg-layout.spec.ts for the
// layout check and the screenshots in four viewports.

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { createContentLoader } from '../../content-runtime/loader';
import type { Item } from '../../domain/content';
import { BEREICHE, type Bereich } from '../../domain/content/taxonomy';
import type { RegionState } from '../../domain/progress';
import { EinstiegErgebnis } from '../screens/EinstiegErgebnis';
import { EinstiegIntro, EinstiegPause, Hinweis } from '../screens/EinstiegScreen';
import { ItemScreen } from '../screens/ItemScreen';
import { STARTED_TEXT } from '../text/einstieg';

const content = createContentLoader();
const TOTAL = 12;

// A start as the check could set it: Etappen below the start are reached.
const START: Partial<Record<Bereich, RegionState>> = {
  'zahlen-operationen': { kind: 'unterwegs', niveau: 3, erschlossen: [true, true, false] },
  'raum-form': { kind: 'unterwegs', niveau: 2, erschlossen: [true, false, false] },
  'groessen-messen': { kind: 'unterwegs', niveau: 1, erschlossen: [false, false, false] },
  'daten-zufall': { kind: 'unterwegs', niveau: 2, erschlossen: [true, false, false] },
};

export function EinstiegPage() {
  const [search] = useSearchParams();
  const zustand = search.get('zustand') ?? 'intro';
  const [item, setItem] = useState<Item | null>(null);
  const [answer, setAnswer] = useState<unknown>(null);

  useEffect(() => {
    void content.loadItems('mathe', 'zahlen-operationen').then((items) => {
      const wanted = search.get('item');
      setItem(items.find((i) => (wanted ? i.id === wanted : i.format === 'single-choice')) ?? null);
    });
  }, [search]);

  if (zustand === 'intro') return <EinstiegIntro total={TOTAL} readAloud onStart={() => {}} />;
  if (zustand === 'pause') {
    return <EinstiegPause index={3} total={TOTAL} readAloud onContinue={() => {}} />;
  }
  if (zustand === 'hinweis') return <Hinweis text={STARTED_TEXT} readAloud />;
  if (zustand === 'ergebnis') {
    const states = Object.fromEntries(
      BEREICHE.map((b) => [b, START[b] ?? { kind: 'unerforscht' }]),
    ) as Record<Bereich, RegionState>;
    return <EinstiegErgebnis fach="mathe" states={states} readAloud />;
  }
  if (!item) return null;
  return (
    <ItemScreen
      item={item}
      attemptIndex={0}
      answer={answer}
      onAnswer={setAnswer}
      phase="answering"
      correct={null}
      progress={{ current: 3, done: 2, total: TOTAL }}
      readAloud
      submitLabel="Weiter"
      onSubmit={() => {}}
      onNext={() => {}}
      pause={{ onPause: () => {} }}
    />
  );
}
