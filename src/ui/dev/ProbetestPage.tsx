// Developer preview of the Probetest screens (dev build only), for the layout and screenshot
// test tests/e2e/probetest-layout.spec.ts: /dev/probetest?probetest=<id>&zustand=…&item=<id>&zeit=45|5
//   probetest                       mathe-01 (default), deutsch-01 from content, deutsch-90 fixture
//   intro | intro-fertig            intro, first time / after a submitted run
//   lesen                           the reading screen before `item` (an item with textRef)
//   aufgabe                         item while the test runs, answer filled in
//   uebersicht | uebersicht-fertig  overview with open items / all answered
//   abgeben | verlassen             the questions before ending
//   auswertung | auswertung-offen   result, without / with a short answer waiting
//   durchsehen | fehlt | vergleichen  looking through: wrong answer, no answer, short answer
//   nur-wartende                    "1 Antwort vergleichen": the short answer, 1 von 1, no Zurück
//   durchsehen-uebersicht           the overview while looking through, ring on the short answer
// Same components as the route, fed with fixed data instead of the store. Items with textRef get
// the text box as in the route (without Vorlesen, Deutsch).

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { probetestContentModules } from '../../../tests/fixtures/lesen';
import { createContentLoader } from '../../content-runtime/loader';
import { loadProbetestContext, type ProbetestContext } from '../../data/probetest';
import type { Bereich, Item } from '../../domain/content';
import type { ProbetestResult } from '../../domain/learner';
import { probetestReadAloud } from '../../domain/probetest';
import { TextKasten } from '../components/TextKasten';
import { preloadFormats } from '../formats/registry';
import { ProbetestAufgabe } from '../screens/ProbetestAufgabe';
import { ProbetestAuswertung } from '../screens/ProbetestAuswertung';
import { AbgebenFrage, ProbetestIntro, VerlassenFrage } from '../screens/ProbetestBlaetter';
import { ProbetestDurchsehen } from '../screens/ProbetestDurchsehen';
import { ProbetestDurchsehenUebersicht } from '../screens/ProbetestDurchsehenUebersicht';
import { ProbetestLesen } from '../screens/ProbetestLesen';
import { ProbetestUebersicht } from '../screens/ProbetestUebersicht';
import { previewAnswer } from './preview-answers';

const content = createContentLoader();
/** The fixture Probetest with reading texts (tests/fixtures/lesen), never in content/. */
const FIXTURE = 'deutsch-90';
const fixtureContent = createContentLoader(probetestContentModules());
const noop = () => undefined;
/** Answered in the overview preview: 1–6, 9 and 10; the ring on 7. */
const ANSWERED = new Set([0, 1, 2, 3, 4, 5, 8, 9]);
/** Solved in the review overview preview (15 of 24, like sampleResult). */
const SOLVED = new Set([0, 1, 2, 4, 5, 6, 8, 9, 12, 13, 15, 17, 18, 20, 22]);

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
  const id = search.get('probetest') ?? 'mathe-01';
  const [ctx, setCtx] = useState<ProbetestContext | null | undefined>(undefined);

  useEffect(() => {
    void preloadFormats();
    void loadProbetestContext({ content: id === FIXTURE ? fixtureContent : content }, id).then(
      setCtx,
    );
  }, [id]);

  if (ctx === undefined) return null;
  if (ctx === null) return <p className="p-lg">{id} nicht gefunden.</p>;
  const { items, texts } = ctx;
  const total = items.length;
  const time = { minutes: zeit, final: zeit <= 5 };
  const index = Math.max(
    0,
    items.findIndex((i) => i.id === search.get('item')),
  );
  const item = items[index];
  if (!item) return null;
  const text = texts.find((t) => t.id === item.stimulus?.textRef);
  const textBox = text && <TextKasten text={text} readAloud={false} />;
  // As in the route: no Vorlesen at a Deutsch reading item (not-reading-texts).
  const itemReadAloud = probetestReadAloud(ctx.probetest.fach, item);

  switch (zustand) {
    case 'lesen':
      if (!text) return <p className="p-lg">{item.id} hat keinen Lesetext.</p>;
      return (
        <ProbetestLesen
          text={text}
          current={index + 1}
          total={total}
          time={time}
          onNext={noop}
          onOverview={noop}
        />
      );
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
          onCompare={noop}
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
          readAloud={itemReadAloud}
          text={textBox}
          onBack={noop}
          onNext={noop}
          onResult={noop}
          onOverview={noop}
          onRate={noop}
          previewComparing={comparing}
        />
      );
    }
    case 'nur-wartende': {
      const short = items.find((i) => i.format === 'short-answer') ?? item;
      return (
        <ProbetestDurchsehen
          key={`${short.id}-${zustand}`}
          item={short}
          attemptIndex={0}
          answer={filled(short)}
          outcome="pending"
          current={1}
          total={1}
          readAloud
          onBack={noop}
          onNext={noop}
          onResult={noop}
          onOverview={noop}
          onRate={noop}
        />
      );
    }
    case 'durchsehen-uebersicht': {
      const short = items.findIndex((i) => i.format === 'short-answer');
      return (
        <ProbetestDurchsehenUebersicht
          outcomes={items.map((_, i) =>
            i === short ? 'pending' : SOLVED.has(i) ? 'solved' : 'notSolved',
          )}
          current={Math.max(short, 0)}
          readAloud
          onJump={noop}
          onContinue={noop}
          onResult={noop}
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
          readAloud={itemReadAloud}
          text={textBox}
          onBack={noop}
          onNext={noop}
          onOverview={noop}
        />
      );
  }
}
