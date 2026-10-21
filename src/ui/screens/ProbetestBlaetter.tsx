// The quiet sheets of the Probetest: intro, the two questions before ending (Abgeben with open
// items, Zur Karte) and the hint for an unknown test. Same frame as the Einstieg (Blatt): the
// risky step on the left without color, the calm way on, in yellow, on the right.

import clsx from 'clsx';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import type { Fach } from '../../domain/content/taxonomy';
import { Button, buttonClass } from '../components/Button';
import { QUIET_ACTION_CLASS } from '../components/quiet';
import { focusQuietly } from '../focus';
import {
  CONTINUE,
  DONE_BEFORE,
  INTRO_TEXT,
  LEAVE_TEXT,
  LEAVE_TITLE,
  SHOW_RESULT,
  START,
  SUBMIT,
  SUBMIT_QUESTION,
  TO_MAP,
  UNAVAILABLE,
  listEntryName,
  openTitle,
  probetestName,
} from '../text/probetest';
import { Blatt } from './Blatt';
import { Zeit, type ProbetestZeit } from './ProbetestKopf';

export function ProbetestIntro(props: {
  fach: Fach;
  /** Position in the manifest ("Probetest Mathe 2", task 16); null: the name of the Fach only. */
  number: number | null;
  doneBefore: boolean;
  readAloud: boolean;
  onStart(): void;
  onShowResult(): void;
}) {
  return (
    <Blatt
      left={
        <Link to="/" className={QUIET_ACTION_CLASS}>
          {TO_MAP}
        </Link>
      }
      title={
        props.number === null ? probetestName(props.fach) : listEntryName(props.fach, props.number)
      }
      text={INTRO_TEXT}
      note={props.doneBefore ? DONE_BEFORE : undefined}
      readAloud={props.readAloud}
      actions={
        <>
          {props.doneBefore ? (
            <button type="button" className={QUIET_ACTION_CLASS} onClick={props.onShowResult}>
              {SHOW_RESULT}
            </button>
          ) : (
            <span />
          )}
          <Button variant="primary" onClick={props.onStart}>
            {START}
          </Button>
        </>
      }
    />
  );
}

function Rueckfrage(props: {
  title: string;
  text: string;
  time: ProbetestZeit;
  readAloud: boolean;
  left: string;
  onLeft(): void;
  onContinue(): void;
}) {
  const weiter = useRef<HTMLButtonElement>(null);
  useEffect(() => focusQuietly(weiter.current), []);
  return (
    <Blatt
      right={<Zeit {...props.time} />}
      title={props.title}
      text={props.text}
      readAloud={props.readAloud}
      actions={
        <>
          <Button size="large" onClick={props.onLeft}>
            {props.left}
          </Button>
          <Button ref={weiter} variant="primary" onClick={props.onContinue}>
            {CONTINUE}
          </Button>
        </>
      }
    />
  );
}

/** "Abgeben" with open items; "Weitermachen" goes back to the overview. */
export function AbgebenFrage(props: {
  open: number;
  time: ProbetestZeit;
  readAloud: boolean;
  onSubmit(): void;
  onContinue(): void;
}) {
  return (
    <Rueckfrage
      title={openTitle(props.open)}
      text={SUBMIT_QUESTION}
      time={props.time}
      readAloud={props.readAloud}
      left={SUBMIT}
      onLeft={props.onSubmit}
      onContinue={props.onContinue}
    />
  );
}

/** "Zur Karte" from the overview ends the test without a result. */
export function VerlassenFrage(props: {
  time: ProbetestZeit;
  readAloud: boolean;
  onLeave(): void;
  onContinue(): void;
}) {
  return (
    <Rueckfrage
      title={LEAVE_TITLE}
      text={LEAVE_TEXT}
      time={props.time}
      readAloud={props.readAloud}
      left={TO_MAP}
      onLeft={props.onLeave}
      onContinue={props.onContinue}
    />
  );
}

export function ProbetestFehlt({ readAloud }: { readAloud: boolean }) {
  return (
    <Blatt
      title={UNAVAILABLE}
      readAloud={readAloud}
      actions={
        <>
          <span />
          <Link
            to="/"
            className={clsx(buttonClass('primary', 'large'), 'flex items-center justify-center')}
          >
            {TO_MAP}
          </Link>
        </>
      }
    />
  );
}
