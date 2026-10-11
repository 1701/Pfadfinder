// Developer preview of one item in a fixed state (dev build only): /dev/item/:id?state=
// answering | richtig | noch-nicht. Used by tests/e2e/layout.spec.ts to check every item for
// scrolling on real iPad viewports.

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import type { Item } from '../../domain/content';
import { createContentLoader } from '../../content-runtime/loader';
import { ItemScreen } from '../screens/ItemScreen';

const content = createContentLoader();

/** A correct or a wrong answer for the preview; dev-only, so a format switch is fine here. */
function previewAnswer(item: Item, correct: boolean): unknown {
  switch (item.format) {
    case 'single-choice': {
      const wrong = item.payload.options.find((o) => o.id !== item.solution.optionId);
      return { optionId: correct ? item.solution.optionId : wrong?.id };
    }
    case 'number-input':
      return { value: correct ? item.solution.value : item.solution.value + 1 };
    default:
      return null;
  }
}

export function ItemPage() {
  const { id } = useParams();
  const [search] = useSearchParams();
  const state = search.get('state') ?? 'answering';
  const [item, setItem] = useState<Item | null | undefined>(undefined);
  const [answer, setAnswer] = useState<unknown>(null);

  useEffect(() => {
    void content.loadAllItems().then((items) => {
      const found = items.find((i) => i.id === id) ?? null;
      setItem(found);
      if (found && state !== 'answering') setAnswer(previewAnswer(found, state === 'richtig'));
    });
  }, [id, state]);

  if (item === undefined) return null;
  if (item === null) return <p className="p-lg">Item {id} nicht gefunden.</p>;

  const feedback = state !== 'answering';
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
      pauseTo="/"
    />
  );
}
