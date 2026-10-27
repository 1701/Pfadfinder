// "Impressum · Datenschutz", quiet, in the line below the map (task 11); there "Eltern" (/eltern,
// task L) comes first. The pages for adults have their own top line (ErwachsenenKopf, task N).

import { DATENSCHUTZ_LINK, ELTERN_MAP_LINK, IMPRESSUM_LINK } from '../text/rechtliches-links';
import { QuietLinks } from './QuietLinks';

const LINKS = [
  { to: '/impressum', text: IMPRESSUM_LINK },
  { to: '/datenschutz', text: DATENSCHUTZ_LINK },
] as const;

const WITH_ELTERN = [{ to: '/eltern', text: ELTERN_MAP_LINK }, ...LINKS] as const;

export function RechtlichesLinks({
  className,
  eltern = false,
}: {
  className?: string;
  /** The map: "Eltern · Impressum · Datenschutz". */
  eltern?: boolean;
}) {
  return (
    <QuietLinks
      label={eltern ? 'Eltern und Rechtliches' : 'Rechtliches'}
      links={eltern ? WITH_ELTERN : LINKS}
      className={className}
    />
  );
}
