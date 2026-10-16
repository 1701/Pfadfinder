// Developer preview of one item (dev build only): /dev/item/:id?state=
//   answering | richtig | noch-nicht  a fixed state, for tests/e2e/layout.spec.ts
//   vergleichen                       short-answer with the model answer shown and the rating band
//   spielen                           playable: answer, Prüfen, feedback (tests/e2e/formate.spec.ts)
// An item of a reading text shows its text box, like in practice (task 9).

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import type { Item, ReadingText } from '../../domain/content';
import { evaluate, parseAnswer, type Correctness } from '../../domain/evaluation';
import { createContentLoader } from '../../content-runtime/loader';
import { TextKasten } from '../components/TextKasten';
import { preloadFormats } from '../formats/registry';
import { ItemScreen } from '../screens/ItemScreen';
import { previewAnswer } from './preview-answers';

const content = createContentLoader();

export function ItemPage() {
  const { id } = useParams();
  const [search] = useSearchParams();
  const state = search.get('state') ?? 'answering';
  const [item, setItem] = useState<Item | null | undefined>(undefined);
  const [text, setText] = useState<ReadingText | null>(null);
  const [answer, setAnswer] = useState<unknown>(null);
  const [played, setPlayed] = useState<Correctness | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    void preloadFormats();
    void content.loadAllItems().then((items) => {
      const found = items.find((i) => i.id === id) ?? null;
      const textRef = found?.stimulus?.textRef;
      if (textRef) void content.loadReadingText(textRef).then(setText);
      setItem(found);
      if (!found) return;
      if (state === 'richtig' || state === 'noch-nicht') {
        setAnswer(previewAnswer(found, state === 'richtig'));
      } else if (state === 'vergleichen') {
        setAnswer({ text: (previewAnswer(found, true) as { text?: string }).text ?? '' });
      }
    });
  }, [id, state]);

  if (item === undefined) return null;
  if (item?.stimulus?.textRef && !text) return null;
  if (item === null) return <p className="p-lg">Item {id} nicht gefunden.</p>;

  if (state === 'spielen') {
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
          const parsed = parseAnswer(item.format, given ?? answer);
          if (parsed.success) setPlayed(evaluate(item, parsed.data).correct);
        }}
        onNext={() => {
          setPlayed(null);
          setAnswer(null);
          setAttempt((a) => a + 1);
        }}
        pause={{ to: '/' }}
        text={text && <TextKasten text={text} readAloud={text.readAloud} />}
      />
    );
  }

  const feedback = state === 'richtig' || state === 'noch-nicht';
  return (
    <ItemScreen
      item={item}
      attemptIndex={0}
      answer={answer}
      onAnswer={setAnswer}
      phase={feedback ? 'feedback' : 'answering'}
      correct={feedback ? state === 'richtig' : null}
      progress={{ current: 3, done: feedback ? 3 : 2, total: 10 }}
      readAloud
      onSubmit={() => undefined}
      onNext={() => undefined}
      pause={{ to: '/' }}
      previewComparing={state === 'vergleichen'}
      text={text && <TextKasten text={text} readAloud={text.readAloud} />}
    />
  );
}
