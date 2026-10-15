// Developer preview of the Probetest screens (dev build only), for the layout and screenshot
// test tests/e2e/probetest-layout.spec.ts: /dev/probetest?zustand=…&item=<id>&zeit=45|5
//   intro | intro-fertig            intro, first time / after a submitted run
//   aufgabe                         item while the test runs, answer filled in
//   uebersicht | uebersicht-fertig  overview with open items / all answered
//   abgeben | verlassen             the questions before ending
//   auswertung | auswertung-offen   result, without / with a short answer waiting
//   durchsehen | fehlt | vergleichen  looking through: wrong answer, no answer, short answer
// Same components as the route, fed with fixed data instead of the store.

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { createContentLoader } from '../../content-runtime/loader';
import { loadProbetestContext, type ProbetestContext } from '../../data/probetest';
import type { Bereich, Item } from '../../domain/content';
import type { ProbetestResult } from '../../domain/learner';
import { preloadFormats } from '../formats/registry';
import { ProbetestAufgabe } from '../screens/ProbetestAufgabe';
import { ProbetestAuswertung } from '../screens/ProbetestAuswertung';
import { AbgebenFrage, ProbetestIntro, VerlassenFrage } from '../screens/ProbetestBlaetter';
import { ProbetestDurchsehen } from '../screens/ProbetestDurchsehen';
import { ProbetestUebersicht } from '../screens/ProbetestUebersicht';
import { previewAnswer } from './preview-answers';

const content = createContentLoader();
const noop = () => undefined;
/** Answered in the overview preview: 1–6, 9 and 10; the ring on 7. */
const ANSWERED = new Set([0, 1, 2, 3, 4, 5, 8, 9]);

/** A sample result in the shape of mathe-01; one short answer may be waiting. */
function sampleResult(bereiche: Bereich[], items: Item[], pending: boolean): ProbetestResult {
  const solvedBy: Partial<Record<Bereich, number>> = {
    'zahlen-operationen': 4,
    'groessen-messen': 4,
    'raum-form': 3,
    'daten-zufall': 3,
    'muster-strukturen': 1,
  };
  const byBereich: ProbetestResult['byBereich'] = {};
  const total = { solved: 0, total: 0, pending: 0 };
  for (const bereich of bereiche) {
    const count = items.filter((i) => i.bereich === bereich).length;
    const waiting = pending && bereich === 'groessen-messen' ? 1 : 0;
    const score = { solved: solvedBy[bereich] ?? 0, total: count, pending: waiting };
    byBereich[bereich] = score;
    total.solved += score.solved;
    total.total += score.total;
    total.pending += score.pending;
  }
  return { byBereich, total };
}

function filled(item: Item): unknown {
  return item.format === 'short-answer' ? { text: item.solution.model } : previewAnswer(item, true);
}

export function ProbetestPage() {
  const [search] = useSearchParams();
  const zustand = search.get('zustand') ?? 'aufgabe';
  const zeit = Number(search.get('zeit') ?? '45');
  const [ctx, setCtx] = useState<ProbetestContext | null | undefined>(undefined);

  useEffect(() => {
    void preloadFormats();
    void loadProbetestContext({ content }, 'mathe-01').then(setCtx);
  }, []);

  if (ctx === undefined) return null;
  if (ctx === null) return <p className="p-lg">mathe-01 nicht gefunden.</p>;
  const { items } = ctx;
  const total = items.length;
  const time = { minutes: zeit, final: zeit <= 5 };
  const index = Math.max(
    0,
    items.findIndex((i) => i.id === search.get('item')),
  );
  const item = items[index];
  if (!item) return null;

  switch (zustand) {
    case 'intro':
    case 'intro-fertig':
      return (
        <ProbetestIntro
          doneBefore={zustand === 'intro-fertig'}
          readAloud
          onStart={noop}
          onShowResult={noop}
        />
      );
    case 'uebersicht':
    case 'uebersicht-fertig':
      return (
        <ProbetestUebersicht
          answered={items.map((_, i) => zustand === 'uebersicht-fertig' || ANSWERED.has(i))}
          current={6}
          time={time}
          readAloud
          onJump={noop}
          onContinue={noop}
          onSubmit={noop}
          onLeave={noop}
        />
      );
    case 'abgeben':
      return (
        <AbgebenFrage
          open={total - ANSWERED.size}
          time={time}
          readAloud
          onSubmit={noop}
          onContinue={noop}
        />
      );
    case 'verlassen':
      return <VerlassenFrage time={time} readAloud onLeave={noop} onContinue={noop} />;
    case 'auswertung':
    case 'auswertung-offen': {
      const bereiche = [...new Set(items.map((i) => i.bereich))];
      return (
        <ProbetestAuswertung
          result={sampleResult(bereiche, items, zustand === 'auswertung-offen')}
          bereiche={bereiche}
          timeUp={search.has('zeit-um')}
          readAloud
          onReview={noop}
        />
      );
    }
    case 'durchsehen':
    case 'fehlt':
    case 'vergleichen': {
      const comparing = zustand === 'vergleichen';
      return (
        <ProbetestDurchsehen
          key={`${item.id}-${zustand}`}
          item={item}
          attemptIndex={0}
          answer={
            zustand === 'fehlt' ? null : comparing ? filled(item) : previewAnswer(item, false)
          }
          outcome={zustand === 'fehlt' ? 'open' : comparing ? 'pending' : 'notSolved'}
          rating={zustand === 'durchsehen' && item.format === 'short-answer' ? 0 : undefined}
          current={index + 1}
          total={total}
          readAloud
          onBack={noop}
          onNext={noop}
          onResult={noop}
          onRate={noop}
          previewComparing={comparing}
        />
      );
    }
    default:
      return (
        <ProbetestAufgabe
          key={item.id}
          item={item}
          attemptIndex={0}
          answer={filled(item)}
          onAnswer={noop}
          current={index + 1}
          total={total}
          time={time}
          readAloud
          onBack={noop}
          onNext={noop}
          onOverview={noop}
        />
      );
  }
}
