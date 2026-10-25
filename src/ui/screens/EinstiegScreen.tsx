// Route /einstieg/:fach – the Einstiegscheck (PRODUCT.md §5.4): intro, questions without
// feedback, a pause that asks first, and the island with the starting Etappen. Leaving the route
// before the end keeps nothing; the next start begins again.

import clsx from 'clsx';
import { useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router';
import { fachSchema, type Fach } from '../../domain/content';
import type { ContentManifest } from '../../domain/content/manifest';
import { mapRegionState } from '../../domain/progress';
import type { CheckOutcome } from '../../data/check';
import { Button, buttonClass } from '../components/Button';
import { Fortschritt } from '../components/Fortschritt';
import { TextKasten } from '../components/TextKasten';
import { Wegstriche } from '../components/Wegstriche';
import { useCheck } from '../check-context';
import { focusQuietly } from '../focus';
import { useTextScroll } from '../text-scroll';
import { SUPPORTED_FORMATS } from '../formats/supported';
import {
  CONTINUE,
  EMPTY_TEXT,
  introText,
  introTitle,
  PAUSE_TEXT,
  START,
  STARTED_TEXT,
  TO_MAP,
} from '../text/einstieg';
import { Blatt } from './Blatt';
import { EinstiegErgebnis } from './EinstiegErgebnis';
import { ItemScreen, QUIET_ACTION_CLASS } from './ItemScreen';
import { LeseScreen } from './LeseScreen';

/** "Zur Karte" as a full-size button in the bottom band. */
function ZurKarte({ variant }: { variant: 'primary' | 'secondary' }) {
  return (
    <Link
      to="/"
      // Always large: next to "Weitermachen" it is an equal choice.
      className={clsx(buttonClass(variant, 'large'), 'flex items-center justify-center')}
    >
      {TO_MAP}
    </Link>
  );
}

export function Hinweis({ text, readAloud }: { text: string; readAloud: boolean }) {
  return (
    <Blatt
      title={text}
      readAloud={readAloud}
      actions={
        <>
          <span />
          <ZurKarte variant="primary" />
        </>
      }
    />
  );
}

export function EinstiegIntro(props: {
  fach: Fach;
  total: number;
  readAloud: boolean;
  onStart(): void;
}) {
  return (
    <Blatt
      left={
        <Link to="/" className={QUIET_ACTION_CLASS}>
          {TO_MAP}
        </Link>
      }
      // The empty way ahead, without a number: how long it is, before it begins.
      right={<Wegstriche total={props.total} done={0} />}
      title={introTitle(props.fach)}
      text={introText(props.fach)}
      readAloud={props.readAloud}
      actions={
        <>
          <span />
          <Button variant="primary" onClick={props.onStart}>
            {START}
          </Button>
        </>
      }
    />
  );
}

export function EinstiegPause(props: {
  index: number;
  total: number;
  readAloud: boolean;
  onContinue(): void;
}) {
  const weiter = useRef<HTMLButtonElement>(null);
  useEffect(() => focusQuietly(weiter.current), []);
  return (
    <Blatt
      right={<Fortschritt current={props.index + 1} done={props.index} total={props.total} />}
      title={PAUSE_TEXT}
      readAloud={props.readAloud}
      actions={
        <>
          <ZurKarte variant="secondary" />
          <Button ref={weiter} variant="primary" onClick={props.onContinue}>
            {CONTINUE}
          </Button>
        </>
      }
    />
  );
}

function regionStates(manifest: ContentManifest, result: CheckOutcome) {
  return mapRegionState(manifest, result.mastery, result.unlocked, SUPPORTED_FORMATS);
}

/** `manifest`: content/manifest.json, passed in like on the map (KartenScreen). */
export function EinstiegScreen({ manifest }: { manifest: ContentManifest }) {
  const parsed = fachSchema.safeParse(useParams().fach);
  if (!parsed.success) return <Hinweis text={EMPTY_TEXT} readAloud />;
  return <Einstieg key={parsed.data} fach={parsed.data} manifest={manifest} />;
}

function Einstieg({ fach, manifest }: { fach: Fach; manifest: ContentManifest }) {
  const start = useCheck((s) => s.start);
  const leave = useCheck((s) => s.leave);
  const status = useCheck((s) => s.status);
  const check = useCheck((s) => s.check);
  const current = useCheck((s) => s.current);
  const answer = useCheck((s) => s.answer);
  const result = useCheck((s) => s.result);
  const unavailable = useCheck((s) => s.unavailable);
  const readAloud = useCheck((s) => s.learner?.settings.readAloud ?? true);
  const begin = useCheck((s) => s.begin);
  const setAnswer = useCheck((s) => s.setAnswer);
  const next = useCheck((s) => s.next);
  const pause = useCheck((s) => s.pause);
  const resume = useCheck((s) => s.resume);
  const doneReading = useCheck((s) => s.doneReading);
  const scroll = useTextScroll();

  useEffect(() => {
    void start(fach);
    return leave;
  }, [fach, start, leave]);

  if (status === 'unavailable') {
    return (
      <Hinweis text={unavailable === 'empty' ? EMPTY_TEXT : STARTED_TEXT} readAloud={readAloud} />
    );
  }
  if (status === 'intro' && check) {
    return (
      <EinstiegIntro fach={fach} total={check.plan.total} readAloud={readAloud} onStart={begin} />
    );
  }
  if (status === 'paused' && current) {
    return (
      <EinstiegPause
        index={current.index}
        total={current.total}
        readAloud={readAloud}
        onContinue={resume}
      />
    );
  }
  const text = current?.text;
  if (status === 'reading' && current && text) {
    return (
      <LeseScreen
        text={text}
        readAloud={readAloud}
        textReadAloud={text.readAloud}
        progress={{ current: current.index + 1, done: current.index, total: current.total }}
        pause={{ onPause: pause }}
        onNext={() => {
          scroll.reset(text.id);
          doneReading();
        }}
      />
    );
  }
  if (status === 'answering' && current) {
    return (
      <ItemScreen
        item={current.item}
        attemptIndex={current.attemptIndex}
        answer={answer}
        onAnswer={setAnswer}
        phase="answering"
        correct={null}
        progress={{ current: current.index + 1, done: current.index, total: current.total }}
        readAloud={readAloud}
        submitLabel="Weiter"
        onSubmit={() => void next()}
        onNext={() => undefined}
        pause={{ onPause: pause }}
        text={
          text && (
            <TextKasten
              text={text}
              readAloud={readAloud && text.readAloud}
              scrollTop={scroll.of(text.id)}
              onScroll={(top) => scroll.keep(text.id, top)}
            />
          )
        }
      />
    );
  }
  if (status === 'finished' && result) {
    return (
      <EinstiegErgebnis fach={fach} states={regionStates(manifest, result)} readAloud={readAloud} />
    );
  }
  return <main className="screen-fit" aria-busy="true" />;
}
