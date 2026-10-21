// "Impressum · Datenschutz", quiet, on /eltern (top right) and in the line below the map (task 11).

import { DATENSCHUTZ_LINK, IMPRESSUM_LINK } from '../text/rechtliches-links';
import { QuietLinks } from './QuietLinks';

const LINKS = [
  { to: '/impressum', text: IMPRESSUM_LINK },
  { to: '/datenschutz', text: DATENSCHUTZ_LINK },
] as const;

export function RechtlichesLinks({ className }: { className?: string }) {
  return <QuietLinks label="Rechtliches" links={LINKS} className={className} />;
}
