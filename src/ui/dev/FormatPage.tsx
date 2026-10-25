// Developer page for measuring a format without content (dev build only, rule 30: measured states
// are dev pages): /dev/format/segment-text?zustand=…&text=…&loesung=…
//   leer        playable: tap gaps, Prüfen, band (tests/e2e/segment-text.spec.ts)
//   noch-nicht  feedback after a wrong answer, "Richtig ist" below the sentence (the tightest state)
//   durchsehen  Probetest looking through, own answer and solution
// The item is built from the query: `text` (default DEFAULT_TEXT) and `loesung` (0-based gaps,
// comma-separated; default DEFAULT_SOLUTION). An invalid item shows the schema's messages.

import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { itemSchema, type Item } from '../../domain/content';
import { evaluate, parseAnswer, type Correctness } from '../../domain/evaluation';
import { ItemScreen } from '../screens/ItemScreen';
import { ProbetestDurchsehen } from '../screens/ProbetestDurchsehen';
import { previewAnswer } from './preview-answers';

const DEFAULT_TEXT = 'Am Nachmittag spielt der kleine Hund mit seinem roten Ball.';
/** Am Nachmittag | spielt | der kleine Hund | mit seinem roten Ball. */
const DEFAULT_SOLUTION = [1, 2, 5];
const noop = () => undefined;

function segmentItem(text: string, boundaries: number[]): unknown {
  return {
    id: 'd-su-2-999',
    schemaVersion: '1.0',
    fach: 'deutsch',
    bereich: 'sprache-untersuchen',
    niveau: 2,
    format: 'segment-text',
    status: 'draft',
    prompt: 'Trenne die Satzglieder mit Strichen.',
    payload: { text, unit: 'word' },
    solution: { boundaries },
    feedback: {
      correct: 'Genau. Jedes Satzglied bleibt beim Umstellen zusammen.',
      incorrect: 'Stelle den Satz um. Wörter, die dabei zusammen bleiben, sind ein Satzglied.',
      misconception: 'Oft wird eine Wortgruppe geteilt, die beim Umstellen zusammenbleibt.',
    },
    tags: ['satzglieder', 'umstellprobe'],
    estimatedSeconds: 65,
    meta: { author: 'claude', createdAt: '2026-10-25', calibration: 'none' },
  };
}

export function FormatPage() {
  const { format } = useParams();
  const [search] = useSearchParams();
  const zustand = search.get('zustand') ?? 'leer';
  const text = search.get('text') ?? DEFAULT_TEXT;
  const loesung = search.get('loesung');
  const boundaries = loesung ? loesung.split(',').map(Number) : DEFAULT_SOLUTION;

  if (format !== 'segment-text')
    return <p className="p-lg">Format {format} hat keine Messseite.</p>;
  const parsed = itemSchema.safeParse(segmentItem(text, boundaries));
  if (!parsed.success) {
    return (
      <ul className="p-lg">
        {parsed.error.issues.map((issue, i) => (
          <li key={i}>{issue.message}</li>
        ))}
      </ul>
    );
  }
  const item = parsed.data;
  if (zustand === 'leer') return <Playable item={item} />;
  if (zustand === 'durchsehen') {
    return (
      <ProbetestDurchsehen
        item={item}
        attemptIndex={0}
        answer={previewAnswer(item, false)}
        outcome="notSolved"
        current={24}
        total={24}
        readAloud
        onBack={noop}
        onNext={noop}
        onResult={noop}
        onOverview={noop}
        onRate={noop}
      />
    );
  }
  return (
    <ItemScreen
      item={item}
      attemptIndex={0}
      answer={previewAnswer(item, false)}
      onAnswer={noop}
      phase="feedback"
      correct={false}
      progress={{ current: 3, done: 3, total: 10 }}
      readAloud
      onSubmit={noop}
      onNext={noop}
      pause={{ to: '/' }}
    />
  );
}

/** Answer, Prüfen, band, Weiter: like /dev/item?state=spielen. */
function Playable({ item }: { item: Item }) {
  const [answer, setAnswer] = useState<unknown>(null);
  const [played, setPlayed] = useState<Correctness | null>(null);
  const [attempt, setAttempt] = useState(0);
  return (
    <ItemScreen
      key={attempt}
      item={item}
      attemptIndex={attempt}
      answer={answer}
      onAnswer={setAnswer}
      phase={played === null ? 'answering' : 'feedback'}
      correct={played}
      progress={{ current: 1, done: played === null ? 0 : 1, total: 10 }}
      readAloud
      onSubmit={(given) => {
        const result = parseAnswer(item.format, given ?? answer);
        if (result.success) setPlayed(evaluate(item, result.data).correct);
      }}
      onNext={() => {
        setPlayed(null);
        setAnswer(null);
        setAttempt((a) => a + 1);
      }}
      pause={{ to: '/' }}
    />
  );
}
