// Developer preview for the Probetest layout budget (task 8, part B; dev build only):
// /dev/probetest?zustand=aufgabe|durchsehen|vergleichen|uebersicht&item=<id>&kopf=d|striche
//   &zeit=45|5&band=r1|r2
//   aufgabe      item while the test runs: header, answer filled in, band "Zurück" | "Weiter"
//   durchsehen   looking through: "Noch nicht ganz." band with "Falle"; r1 "Zurück" in the band,
//                r2 "Zurück" quiet in the header
//   vergleichen  looking through a short answer: model answer and the rating band
//   uebersicht   the overview: 24 tappable dashes, "Abgeben", "Zur Karte"
// The header and overview here are prototypes for measuring, not the screens of part C.

import clsx from 'clsx';
import { useEffect, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { createContentLoader } from '../../content-runtime/loader';
import { loadProbetestContext, type ProbetestContext } from '../../data/probetest';
import type { Item } from '../../domain/content';
import { Button } from '../components/Button';
import { Fortschritt } from '../components/Fortschritt';
import { preloadFormats } from '../formats/registry';
import { ItemScreen, QUIET_ACTION_CLASS } from '../screens/ItemScreen';
import { previewAnswer } from './preview-answers';

const content = createContentLoader();
const CURRENT = 7;
/** Answered in the overview prototype: 1–6, 9 and 10; 7 is on screen. */
const ANSWERED = new Set([1, 2, 3, 4, 5, 6, 9, 10]);

function zeitText(zeit: string): string {
  return zeit === '5' ? 'Noch 5 Minuten' : `${zeit} Min.`;
}

function Kopf(props: { left: string; right?: ReactNode; striche?: boolean; total: number }) {
  return (
    <header data-kopf="" className="grid grid-cols-[1fr_auto_1fr] items-center gap-md">
      <button type="button" className={clsx(QUIET_ACTION_CLASS, 'justify-self-start')}>
        {props.left}
      </button>
      {props.striche ? (
        <Fortschritt current={CURRENT} done={CURRENT - 1} total={props.total} />
      ) : (
        <p className="text-ink-muted">
          <span className="sr-only">Aufgabe </span>
          {CURRENT} von {props.total}
        </p>
      )}
      <div className="justify-self-end text-ink-muted">{props.right}</div>
    </header>
  );
}

function Uebersicht({ total, zeit }: { total: number; zeit: string }) {
  return (
    <main className="screen-fit mx-auto grid max-w-page grid-rows-[auto_auto_1fr_auto] gap-sm px-lg py-sm">
      <header data-kopf="" className="grid grid-cols-[1fr_auto_1fr] items-center gap-md">
        <button type="button" className={clsx(QUIET_ACTION_CLASS, 'justify-self-start')}>
          Zur Karte
        </button>
        <span />
        <p className="justify-self-end text-ink-muted">{zeitText(zeit)}</p>
      </header>
      <section className="grid gap-xs rounded-sheet border border-line bg-surface px-lg py-sm">
        <h1 className="text-prompt font-bold">Übersicht</h1>
        <p className="text-option">Tippe auf eine Aufgabe, dann springst du hin.</p>
      </section>
      <div data-region="answer" className="flex min-h-0 items-start justify-center pt-xs">
        <div className="grid gap-md">
          <ol className="grid grid-cols-12 gap-xs">
            {Array.from({ length: total }, (_, i) => {
              const n = i + 1;
              const done = ANSWERED.has(n);
              return (
                <li key={n}>
                  <button
                    type="button"
                    aria-label={`Aufgabe ${n}, ${done ? 'beantwortet' : 'offen'}`}
                    className={clsx(
                      'grid min-h-primary min-w-touch place-items-center gap-2xs rounded-control px-2xs py-xs',
                      n === CURRENT && 'outline-2 outline-offset-2 outline-ink',
                    )}
                  >
                    <span className="text-body">{n}</span>
                    <span
                      className={clsx(
                        'block h-xs w-lg rounded-round border-2',
                        done ? 'border-ink bg-ink' : 'border-line-strong bg-surface',
                      )}
                    />
                  </button>
                </li>
              );
            })}
          </ol>
          <p className="flex items-center gap-lg text-ink-muted">
            <span className="flex items-center gap-xs">
              <span className="block h-xs w-lg rounded-round border-2 border-ink bg-ink" />
              beantwortet
            </span>
            <span className="flex items-center gap-xs">
              <span className="block h-xs w-lg rounded-round border-2 border-line-strong bg-surface" />
              offen
            </span>
          </p>
        </div>
      </div>
      <div data-region="band" className="flex items-end justify-between">
        <span />
        <Button variant="primary">Abgeben</Button>
      </div>
    </main>
  );
}

function filled(item: Item): unknown {
  if (item.format !== 'short-answer') return previewAnswer(item, true);
  return { text: item.solution.model };
}

export function ProbetestPage() {
  const [search] = useSearchParams();
  const zustand = search.get('zustand') ?? 'aufgabe';
  const kopf = search.get('kopf') ?? 'd';
  const zeit = search.get('zeit') ?? '45';
  const band = search.get('band') ?? 'r1';
  const [ctx, setCtx] = useState<ProbetestContext | null | undefined>(undefined);

  useEffect(() => {
    void preloadFormats();
    void loadProbetestContext({ content }, 'mathe-01').then(setCtx);
  }, []);

  if (ctx === undefined) return null;
  if (ctx === null) return <p className="p-lg">mathe-01 nicht gefunden.</p>;
  const total = ctx.items.length;
  if (zustand === 'uebersicht') return <Uebersicht total={total} zeit={zeit} />;

  const item = ctx.items.find((i) => i.id === search.get('item')) ?? ctx.items[0];
  if (!item) return null;
  const noop = () => undefined;

  if (zustand === 'aufgabe') {
    return (
      <ItemScreen
        key={item.id}
        item={item}
        attemptIndex={0}
        answer={filled(item)}
        onAnswer={noop}
        phase="answering"
        correct={null}
        readAloud
        onSubmit={noop}
        onNext={noop}
        header={
          <Kopf
            left="Übersicht"
            right={zeitText(zeit)}
            striche={kopf === 'striche'}
            total={total}
          />
        }
        actions={
          <>
            <Button size="large">Zurück</Button>
            <Button variant="primary">Weiter</Button>
          </>
        }
      />
    );
  }

  const back = { label: 'Zurück', onClick: noop };
  const header = (
    <Kopf
      left="Zur Auswertung"
      total={total}
      right={
        band === 'r2' ? (
          <button type="button" className={QUIET_ACTION_CLASS}>
            Zurück
          </button>
        ) : undefined
      }
    />
  );
  const comparing = zustand === 'vergleichen';
  return (
    <ItemScreen
      key={`${item.id}-${zustand}`}
      item={item}
      attemptIndex={0}
      answer={
        comparing ? { text: (filled(item) as { text: string }).text } : previewAnswer(item, false)
      }
      onAnswer={noop}
      phase={comparing ? 'answering' : 'feedback'}
      correct={comparing ? null : false}
      readAloud
      onSubmit={noop}
      onNext={noop}
      header={header}
      feedbackBack={band === 'r1' ? back : undefined}
      previewComparing={comparing}
    />
  );
}
