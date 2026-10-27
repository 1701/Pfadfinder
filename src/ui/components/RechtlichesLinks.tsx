// "Impressum · Datenschutz", quiet, on /eltern/geraet (top right) and in the line below the map
// (task 11). On /eltern/geraet "So geht’s" comes first (2026-10-22); the map has no room for it.
// On the map "Eltern" (/eltern, task L) comes first.

import {
  DATENSCHUTZ_LINK,
  ELTERN_MAP_LINK,
  IMPRESSUM_LINK,
  SO_GEHTS_LINK,
} from '../text/rechtliches-links';
import { QuietLinks } from './QuietLinks';

const LINKS = [
  { to: '/impressum', text: IMPRESSUM_LINK },
  { to: '/datenschutz', text: DATENSCHUTZ_LINK },
] as const;

const WITH_SO_GEHTS = [{ to: '/so-gehts', text: SO_GEHTS_LINK }, ...LINKS] as const;
const WITH_ELTERN = [{ to: '/eltern', text: ELTERN_MAP_LINK }, ...LINKS] as const;

export function RechtlichesLinks({
  className,
  soGehts = false,
  eltern = false,
}: {
  className?: string;
  soGehts?: boolean;
  /** The map: "Eltern · Impressum · Datenschutz". */
  eltern?: boolean;
}) {
  return (
    <QuietLinks
      label={
        soGehts ? 'Erklärung und Rechtliches' : eltern ? 'Eltern und Rechtliches' : 'Rechtliches'
      }
      links={soGehts ? WITH_SO_GEHTS : eltern ? WITH_ELTERN : LINKS}
      className={className}
    />
  );
}
