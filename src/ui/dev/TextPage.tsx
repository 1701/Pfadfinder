// Developer preview of a reading text (dev build only), with the fixture texts from
// tests/fixtures/lesen (never in the bundle: check-bundle looks for their title) and the texts
// of content/ (an id that is no fixture is looked up there; tests/e2e/text-layout.spec.ts).
//   /dev/text/:id?zustand=lesen                       the reading screen
//   /dev/text/:id?item=<id>&zustand=antworten|richtig|noch-nicht|vergleichen
//                                                     an item with the text box
//   &einstieg     the Einstieg variant ("Weiter", no feedback, Pause asks)
//   &scroll=ende  the box starts at the end of the text (no fade below)
//   &hoehe=280    portrait box height in px, &breite=42 landscape column in % (measuring only)
//   /dev/text/:id?runde  a real practice round in lesen-sachtext with the fixture texts: the
//                 session store on in-memory repositories (nothing stored; tests/e2e/lesen.spec.ts)
// The sweep items of tests/fixtures/sweep-match (match beside t-sach-901) are items here too
// (tests/e2e/sweep-match.spec.ts).

import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import {
  BEREICHE_BY_FACH,
  isLesenBereich,
  type Item,
  type ReadingText,
} from '../../domain/content';
import { LESEN_ITEMS, LESEN_TEXTS, lesenContentModules } from '../../../tests/fixtures/lesen';
import { SWEEP_MATCH_ITEMS } from '../../../tests/fixtures/sweep-match';
import { createContentLoader } from '../../content-runtime/loader';
import { createMemoryRepositories } from '../../data/memory/repos';
import { createSessionStore } from '../../data/session-store';
import { TextKasten } from '../components/TextKasten';
import { preloadFormats } from '../formats/registry';
import { SUPPORTED_FORMATS } from '../formats/supported';
import { ItemScreen } from '../screens/ItemScreen';
import { LeseScreen } from '../screens/LeseScreen';
import { Practice } from '../screens/UebenScreen';
import { SessionStoreContext } from '../session-context';
import { previewAnswer } from './preview-answers';

/** Beyond the end of any text: the browser stops at the end. */
const END = 1_000_000;

const appContent = createContentLoader();

/** Items and reading texts of content/ (null while loading). */
function useAppContent() {
  const [loaded, setLoaded] = useState<{ items: Item[]; texts: ReadingText[] } | null>(null);
  useEffect(() => {
    const lesen = BEREICHE_BY_FACH.deutsch.filter(isLesenBereich);
    void Promise.all([
      appContent.loadAllItems(),
      Promise.all(lesen.map((b) => appContent.loadTexts('deutsch', b))),
    ]).then(([items, texts]) => setLoaded({ items, texts: texts.flat() }));
  }, []);
  return loaded;
}

/** A practice round like /ueben/deutsch/lesen-sachtext, on the fixture and in memory. */
function Runde() {
  const [store] = useState(() =>
    createSessionStore({
      repos: createMemoryRepositories(),
      content: createContentLoader(lesenContentModules()),
      now: () => new Date().toISOString(),
      newId: () => crypto.randomUUID(),
      formats: SUPPORTED_FORMATS,
    }),
  );
  return (
    <SessionStoreContext value={store}>
      <Practice fach="deutsch" bereich="lesen-sachtext" />
    </SessionStoreContext>
  );
}

export function TextPage() {
  const { id } = useParams();
  const [search] = useSearchParams();
  const zustand = search.get('zustand') ?? 'antworten';
  const einstieg = search.has('einstieg');
  const scrollTop = search.get('scroll') === 'ende' ? END : undefined;
  const hoehe = search.get('hoehe');
  const breite = search.get('breite');
  const style = {
    ...(hoehe && { '--reading-box': `${hoehe}px` }),
    ...(breite && { '--reading-column': `${breite}%` }),
  } as CSSProperties;

  useEffect(() => void preloadFormats(), []);
  const app = useAppContent();
  if (search.has('runde')) return <Runde />;

  const itemId = search.get('item');
  const items = [...LESEN_ITEMS, ...SWEEP_MATCH_ITEMS, ...(app?.items ?? [])];
  const texts = [...LESEN_TEXTS, ...(app?.texts ?? [])];
  const item = items.find((i) => i.id === itemId);
  const text = texts.find((t) => t.id === (item?.stimulus?.textRef ?? id));
  if ((!text || (itemId && !item)) && !app) return null;
  if (!text) return <p className="p-lg">Text {id} nicht gefunden.</p>;

  if (zustand === 'lesen' || !item) {
    return (
      <div style={style}>
        <LeseScreen
          text={text}
          readAloud
          textReadAloud={text.readAloud}
          progress={{ current: 1, done: 0, total: 10 }}
          pause={{ to: '/' }}
          onNext={() => undefined}
          scrollTop={scrollTop}
        />
      </div>
    );
  }

  const feedback = !einstieg && (zustand === 'richtig' || zustand === 'noch-nicht');
  const answer =
    zustand === 'antworten'
      ? null
      : zustand === 'vergleichen'
        ? { text: (previewAnswer(item, true) as { text?: string }).text ?? '' }
        : previewAnswer(item, zustand === 'richtig');
  return (
    <div style={style}>
      <ItemScreen
        item={item}
        attemptIndex={0}
        answer={answer}
        onAnswer={() => undefined}
        phase={feedback ? 'feedback' : 'answering'}
        correct={feedback ? zustand === 'richtig' : null}
        progress={
          einstieg
            ? { current: 4, done: 3, total: 12 }
            : { current: 3, done: feedback ? 3 : 2, total: 10 }
        }
        readAloud
        onSubmit={() => undefined}
        onNext={() => undefined}
        submitLabel={einstieg ? 'Weiter' : undefined}
        pause={einstieg ? { onPause: () => undefined } : { to: '/' }}
        previewComparing={zustand === 'vergleichen'}
        text={<TextKasten text={text} readAloud={text.readAloud} scrollTop={scrollTop} />}
      />
    </div>
  );
}
