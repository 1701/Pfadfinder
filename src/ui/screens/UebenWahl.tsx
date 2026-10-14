// Before practice goes on: today's open round of this Gebiet can be continued where it stopped
// ("Fortsetzen", bottom right as always) or ended for a new round of 10 ("Neu anfangen"). No
// question back: nothing is lost, the answers and today's Fundstücke stay.

import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { SESSION_GOAL } from '../../domain/practice';
import { Button } from '../components/Button';
import { Fortschritt } from '../components/Fortschritt';
import { focusQuietly } from '../focus';
import { TO_MAP } from '../text/einstieg';
import { CHOICE_TEXT, CHOICE_TITLE, RESTART, RESUME } from '../text/ueben';
import { Blatt } from './Blatt';
import { QUIET_ACTION_CLASS } from './ItemScreen';

export interface UebenWahlProps {
  /** Answers in the open round. */
  answered: number;
  readAloud: boolean;
  onResume(): void;
  onRestart(): void;
}

export function UebenWahl({ answered, readAloud, onResume, onRestart }: UebenWahlProps) {
  const fortsetzen = useRef<HTMLButtonElement>(null);
  useEffect(() => focusQuietly(fortsetzen.current), []);
  return (
    <Blatt
      left={
        <Link to="/" className={QUIET_ACTION_CLASS}>
          {TO_MAP}
        </Link>
      }
      // Where "Fortsetzen" goes on.
      right={<Fortschritt current={answered + 1} done={answered} total={SESSION_GOAL} />}
      title={CHOICE_TITLE}
      text={CHOICE_TEXT}
      readAloud={readAloud}
      actions={
        <>
          <Button size="large" onClick={onRestart}>
            {RESTART}
          </Button>
          <Button ref={fortsetzen} variant="primary" onClick={onResume}>
            {RESUME}
          </Button>
        </>
      }
    />
  );
}
