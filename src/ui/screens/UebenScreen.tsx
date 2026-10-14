// Route /ueben/:fach/:bereich – connects the item screen to the session store.

import { useEffect } from 'react';
import { Link, useParams } from 'react-router';
import { bereichSchema, fachOfBereich, type Bereich, type Fach } from '../../domain/content';
import { SESSION_GOAL } from '../../domain/practice';
import { useSession } from '../session-context';
import { AbschlussScreen } from './AbschlussScreen';
import { ItemScreen } from './ItemScreen';
import { UebenWahl } from './UebenWahl';

function parseParams(fach?: string, bereich?: string): { fach: Fach; bereich: Bereich } | null {
  const parsed = bereichSchema.safeParse(bereich);
  if (!parsed.success || fachOfBereich(parsed.data) !== fach) return null;
  return { fach: fachOfBereich(parsed.data), bereich: parsed.data };
}

function Hinweis({ text }: { text: string }) {
  return (
    <main className="screen-fit grid place-content-center justify-items-center gap-lg px-lg text-center">
      <p className="text-option">{text}</p>
      <Link
        to="/"
        className="flex min-h-touch items-center rounded-control border-2 border-line-strong bg-surface px-lg font-bold"
      >
        Zur Übersicht
      </Link>
    </main>
  );
}

export function UebenScreen() {
  const params = useParams();
  const target = parseParams(params.fach, params.bereich);
  if (!target) return <Hinweis text="Dieses Gebiet gibt es nicht." />;
  return <Practice key={target.bereich} {...target} />;
}

function Practice({ fach, bereich }: { fach: Fach; bereich: Bereich }) {
  const startPractice = useSession((s) => s.startPractice);
  const leave = useSession((s) => s.leave);
  const status = useSession((s) => s.status);
  const current = useSession((s) => s.current);
  const answer = useSession((s) => s.answer);
  const feedback = useSession((s) => s.feedback);
  const answered = useSession((s) => s.practice?.session.attemptIds.length ?? 0);
  const readAloud = useSession((s) => s.learner?.settings.readAloud ?? true);
  const today = useSession((s) => s.today);
  const setAnswer = useSession((s) => s.setAnswer);
  const submit = useSession((s) => s.submit);
  const next = useSession((s) => s.next);
  const resume = useSession((s) => s.resume);
  const restart = useSession((s) => s.restart);

  useEffect(() => {
    void startPractice(fach, bereich);
    return leave;
  }, [fach, bereich, startPractice, leave]);

  if (status === 'empty') return <Hinweis text="Hier gibt es noch nicht genug Aufgaben." />;
  if (status === 'choosing') {
    return (
      <UebenWahl
        answered={answered}
        readAloud={readAloud}
        onResume={() => void resume()}
        onRestart={() => void restart()}
      />
    );
  }
  if (status === 'finished')
    return (
      <AbschlussScreen count={today?.count ?? answered} bereich={bereich} readAloud={readAloud} />
    );
  if (!current || (status !== 'answering' && status !== 'checking' && status !== 'feedback')) {
    return <main className="screen-fit" aria-busy="true" />;
  }

  const inFeedback = status === 'feedback';
  return (
    <ItemScreen
      item={current.item}
      attemptIndex={current.attemptIndex}
      answer={answer}
      onAnswer={setAnswer}
      phase={status}
      correct={feedback?.correct ?? null}
      progress={{
        current: inFeedback ? answered : answered + 1,
        done: answered,
        total: SESSION_GOAL,
      }}
      readAloud={readAloud}
      onSubmit={(given) => void submit(given)}
      onNext={() => void next()}
      pause={{ to: '/' }}
    />
  );
}
