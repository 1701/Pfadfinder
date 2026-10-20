// The reading screen in the Probetest (task 13): as in practice ("Lies den Text.", title, the
// whole text, yellow "Weiter"), with the Probetest's Kopf: "Übersicht", the item that follows
// ("1 von 24") and the time, which runs on. No Vorlesen: in Deutsch reading is what is tested
// (CONTENT_SCHEMA §5). Not a Wegstrich: the overview counts items only.

import type { ReadingText } from '../../domain/content';
import { QUIET_ACTION_CLASS } from '../components/quiet';
import { OVERVIEW } from '../text/probetest';
import { LeseScreen } from './LeseScreen';
import { ProbetestKopf, Zeit, type ProbetestZeit } from './ProbetestKopf';

export interface ProbetestLesenProps {
  text: ReadingText;
  /** 1-based: the item after the reading screen. */
  current: number;
  total: number;
  time: ProbetestZeit;
  onNext(): void;
  onOverview(): void;
  /** Dev preview only: where the box starts. */
  scrollTop?: number;
}

export function ProbetestLesen(props: ProbetestLesenProps) {
  return (
    <LeseScreen
      text={props.text}
      readAloud={false}
      textReadAloud={false}
      onNext={props.onNext}
      scrollTop={props.scrollTop}
      header={
        <ProbetestKopf
          left={
            <button type="button" className={QUIET_ACTION_CLASS} onClick={props.onOverview}>
              {OVERVIEW}
            </button>
          }
          current={props.current}
          total={props.total}
          right={<Zeit {...props.time} />}
        />
      }
    />
  );
}
