// Developer preview of the Einstieg screens (dev build only): /dev/einstieg?zustand=
// intro | intro-deutsch | aufgabe | pause | ergebnis | ergebnis-deutsch | hinweis (intro-deutsch:
// the longer Fach name in the intro title; ergebnis-deutsch: the Deutsch island, every Gebiet with
// its sign). Used by tests/e2e/einstieg-layout.spec.ts for the
// layout check and the screenshots in four viewports.

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { createContentLoader } from '../../content-runtime/loader';
import type { Item } from '../../domain/content';
import type { Bereich } from '../../domain/content/taxonomy';
import type { RegionState } from '../../domain/progress';
import { CHECK_ITEM_COUNT } from '../../domain/scheduler';
import { EinstiegErgebnis } from '../screens/EinstiegErgebnis';
import { EinstiegIntro, EinstiegPause, Hinweis } from '../screens/EinstiegScreen';
import { ItemScreen } from '../screens/ItemScreen';
import { STARTED_TEXT } from '../text/einstieg';

const content = createContentLoader();
/** The previews are Mathe, except the Deutsch intro: as many places as the check has. */
const TOTAL = CHECK_ITEM_COUNT.mathe;

// A start as the check could set it: Etappen below the start are reached.
const START: Record<Bereich, RegionState> = {
  'zahlen-operationen': { kind: 'unterwegs', niveau: 3, erschlossen: [true, true, false] },
  'raum-form': { kind: 'unterwegs', niveau: 2, erschlossen: [true, false, false] },
  'groessen-messen': { kind: 'unterwegs', niveau: 1, erschlossen: [false, false, false] },
  'daten-zufall': { kind: 'unterwegs', niveau: 2, erschlossen: [true, false, false] },
  'muster-strukturen': { kind: 'unerforscht' },
  'lesen-sachtext': { kind: 'unterwegs', niveau: 2, erschlossen: [true, false, false] },
  'lesen-literarisch': { kind: 'unterwegs', niveau: 1, erschlossen: [false, false, false] },
  'rs-laut-buchstabe': { kind: 'unterwegs', niveau: 3, erschlossen: [true, true, false] },
  'rs-strategien': { kind: 'unterwegs', niveau: 1, erschlossen: [false, false, false] },
  'sprache-untersuchen': { kind: 'unterwegs', niveau: 2, erschlossen: [true, false, false] },
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

  if (zustand === 'intro' || zustand === 'intro-deutsch') {
    const fach = zustand === 'intro' ? 'mathe' : 'deutsch';
    return (
      <EinstiegIntro fach={fach} total={CHECK_ITEM_COUNT[fach]} readAloud onStart={() => {}} />
    );
  }
  if (zustand === 'pause') {
    return <EinstiegPause index={3} total={TOTAL} readAloud onContinue={() => {}} />;
  }
  if (zustand === 'hinweis') return <Hinweis text={STARTED_TEXT} readAloud />;
  if (zustand === 'ergebnis' || zustand === 'ergebnis-deutsch') {
    const fach = zustand === 'ergebnis' ? 'mathe' : 'deutsch';
    return <EinstiegErgebnis fach={fach} states={START} readAloud />;
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
