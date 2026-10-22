// "Impressum · Datenschutz", quiet, on /eltern (top right) and in the line below the map (task 11).
// On /eltern "So geht’s" comes first (2026-10-22); the map has no room for it.

import { DATENSCHUTZ_LINK, IMPRESSUM_LINK, SO_GEHTS_LINK } from '../text/rechtliches-links';
import { QuietLinks } from './QuietLinks';

const LINKS = [
  { to: '/impressum', text: IMPRESSUM_LINK },
  { to: '/datenschutz', text: DATENSCHUTZ_LINK },
] as const;

const WITH_SO_GEHTS = [{ to: '/so-gehts', text: SO_GEHTS_LINK }, ...LINKS] as const;

export function RechtlichesLinks({
  className,
  soGehts = false,
}: {
  className?: string;
  soGehts?: boolean;
}) {
  return (
    <QuietLinks
      label={soGehts ? 'Erklärung und Rechtliches' : 'Rechtliches'}
      links={soGehts ? WITH_SO_GEHTS : LINKS}
      className={className}
    />
  );
}
