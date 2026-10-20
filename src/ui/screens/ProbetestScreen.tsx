// Route /probetest/:id – the Probetest (PRODUCT.md §5.4): intro, items with "Zurück"/"Weiter"
// and the time, the overview, the questions before ending, the result and looking through
// (all items, or only the waiting short answers, with its own overview). Before the first item
// of a reading text the reading screen; beside its items the text box, scrolled as the child left it.
// Everything is stored as it happens; a reload continues at the same item with the time the
// wall clock has left.

import { useEffect } from 'react';
import { Navigate, useParams } from 'react-router';
import type { Bereich, Item } from '../../domain/content';
import {
  isAnswered,
  isFinalMinutes,
  itemOutcome,
  probetestReadAloud,
  probetestTextReadAloud,
  remainingMinutes,
} from '../../domain/probetest';
import { runDeadline } from '../../data/probetest';
import { useProbetestClock } from '../probetest-clock';
import { TextKasten } from '../components/TextKasten';
import { useTextScroll } from '../text-scroll';
import { useProbetest } from '../probetest-context';
import { ProbetestAufgabe } from './ProbetestAufgabe';
import { ProbetestAuswertung } from './ProbetestAuswertung';
import { AbgebenFrage, ProbetestFehlt, ProbetestIntro, VerlassenFrage } from './ProbetestBlaetter';
import { ProbetestDurchsehen } from './ProbetestDurchsehen';
import { ProbetestDurchsehenUebersicht } from './ProbetestDurchsehenUebersicht';
import { ProbetestLesen } from './ProbetestLesen';
import { ProbetestUebersicht } from './ProbetestUebersicht';

export function ProbetestScreen() {
  const id = useParams().id ?? '';
  return <Probetest key={id} id={id} />;
}

function Probetest({ id }: { id: string }) {
  const s = useProbetest((state) => state);
  const { status, context, run, index, intro, reviewOnly } = s;
  const learnerReadAloud = s.learner?.settings.readAloud ?? true;
  const open = s.open;
  // Per text, over the items of this screen (ItemScreen mounts anew for every item).
  const scroll = useTextScroll();

  useEffect(() => {
    void open(id);
  }, [id, open]);

  const running = run?.status === 'running' ? run : null;
  const deadline = context && running ? runDeadline(context, running) : null;
  const now = useProbetestClock(
    deadline,
    (visible) => void s.timeUp(visible),
    () => void s.checkTime(),
  );

  if (status === 'left') return <Navigate to="/" replace />;
  if (status === 'unavailable') return <ProbetestFehlt readAloud={learnerReadAloud} />;
  if (!context) return null;

  const { items, probetest, texts } = context;
  // Beside an item with textRef the text box, as in practice; its own Vorlesen only where the
  // Probetest allows it (Deutsch: never, ReadingText.readAloud is for practice only, §5).
  const textBox = (item: Item) => {
    const text = texts.find((t) => t.id === item.stimulus?.textRef);
    return (
      text && (
        <TextKasten
          text={text}
          readAloud={learnerReadAloud && probetestTextReadAloud(probetest.fach, item, text)}
          scrollTop={scroll.of(text.id)}
          onScroll={(top) => scroll.keep(text.id, top)}
        />
      )
    );
  };
  const total = items.length;
  const iso = new Date(now).toISOString();
  const time =
    deadline === null
      ? { minutes: 0, final: false }
      : { minutes: remainingMinutes(iso, deadline), final: isFinalMinutes(iso, deadline) };

  if (status === 'intro' && intro) {
    return (
      <ProbetestIntro
        doneBefore={intro.doneBefore}
        readAloud={learnerReadAloud}
        onStart={() => void s.begin()}
        onShowResult={s.showResult}
      />
    );
  }

  if (running) {
    const answered = items.map((item) => isAnswered(item, running.answers[item.id]));
    if (status === 'reading') {
      const text = texts.find((t) => t.id === items[index]?.stimulus?.textRef);
      if (!text) return null;
      return (
        <ProbetestLesen
          key={text.id}
          text={text}
          current={index + 1}
          total={total}
          time={time}
          onNext={() => {
            scroll.reset(text.id);
            s.doneReading();
          }}
          onOverview={s.showOverview}
        />
      );
    }
    if (status === 'answering') {
      const item = items[index];
      if (!item) return null;
      return (
        <ProbetestAufgabe
          key={item.id}
          item={item}
          attemptIndex={running.attemptIndex[item.id] ?? 0}
          answer={running.answers[item.id] ?? null}
          onAnswer={s.setAnswer}
          current={index + 1}
          total={total}
          time={time}
          readAloud={learnerReadAloud && probetestReadAloud(probetest.fach, item)}
          text={textBox(item)}
          onBack={s.back}
          onNext={s.next}
          onOverview={s.showOverview}
        />
      );
    }
    if (status === 'overview') {
      return (
        <ProbetestUebersicht
          answered={answered}
          current={index}
          time={time}
          readAloud={learnerReadAloud}
          onJump={s.goTo}
          onContinue={() => s.goTo(index)}
          onSubmit={() => void s.askSubmit()}
          onLeave={s.askLeave}
        />
      );
    }
    if (status === 'confirmSubmit') {
      return (
        <AbgebenFrage
          open={answered.filter((a) => !a).length}
          time={time}
          readAloud={learnerReadAloud}
          onSubmit={() => void s.submit()}
          onContinue={s.cancel}
        />
      );
    }
    if (status === 'confirmLeave') {
      return (
        <VerlassenFrage
          time={time}
          readAloud={learnerReadAloud}
          onLeave={() => void s.leave()}
          onContinue={s.cancel}
        />
      );
    }
    return null;
  }

  if (run?.status === 'submitted' && run.result) {
    if (status === 'result') {
      const bereiche = [...new Set(items.map((i) => i.bereich))] as Bereich[];
      return (
        <ProbetestAuswertung
          result={run.result}
          bereiche={bereiche}
          timeUp={run.endReason === 'time'}
          readAloud={learnerReadAloud}
          onReview={() => s.review(0)}
          onCompare={() => s.review(0, 'pending')}
        />
      );
    }
    if (status === 'reviewOverview') {
      return (
        <ProbetestDurchsehenUebersicht
          outcomes={items.map((item) => itemOutcome(item, run))}
          current={index}
          readAloud={learnerReadAloud}
          onJump={(i) => s.review(i)}
          onContinue={s.continueReview}
          onResult={s.showResult}
        />
      );
    }
    if (status === 'review') {
      const item = items[index];
      if (!item) return null;
      // Only the waiting short answers: "1 von 1" counts in that list.
      const position = reviewOnly ? reviewOnly.indexOf(index) : index;
      return (
        <ProbetestDurchsehen
          key={item.id}
          item={item}
          attemptIndex={run.attemptIndex[item.id] ?? 0}
          answer={run.answers[item.id] ?? null}
          outcome={itemOutcome(item, run)}
          rating={run.ratings[item.id]}
          current={position + 1}
          total={reviewOnly ? reviewOnly.length : total}
          readAloud={learnerReadAloud && probetestReadAloud(probetest.fach, item)}
          text={textBox(item)}
          onBack={s.back}
          onNext={s.next}
          onResult={s.showResult}
          onOverview={s.showReviewOverview}
          onRate={(rating) => void s.rate(rating)}
        />
      );
    }
  }
  return null;
}
