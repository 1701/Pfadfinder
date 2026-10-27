// The fixed top line of the five pages for adults (task N): "Zurück" on the left, the other four
// pages on the right, quietly; only the text below scrolls. The targets are static, never the
// history: /eltern/geraet leads back to /eltern, every other page to the map. The device area
// stays two steps from every child's screen: the map links /eltern and Impressum, never it.

import { Link } from 'react-router';
import {
  DATENSCHUTZ_LINK,
  ELTERN_MAP_LINK,
  GERAET_LINK,
  IMPRESSUM_LINK,
  KOPF_BACK,
  KOPF_LABEL,
  SO_GEHTS_LINK,
} from '../text/rechtliches-links';
import { QuietLinks } from './QuietLinks';
import { QUIET_ACTION_CLASS } from './quiet';

const PAGES = [
  { to: '/eltern', text: ELTERN_MAP_LINK },
  { to: '/so-gehts', text: SO_GEHTS_LINK },
  { to: '/impressum', text: IMPRESSUM_LINK },
  { to: '/datenschutz', text: DATENSCHUTZ_LINK },
  { to: '/eltern/geraet', text: GERAET_LINK },
] as const;

export type ErwachsenenSeite = (typeof PAGES)[number]['to'];

export function ErwachsenenKopf({ page }: { page: ErwachsenenSeite }) {
  return (
    <header data-region="kopf" className="flex min-h-touch items-center justify-between gap-md">
      <Link to={page === '/eltern/geraet' ? '/eltern' : '/'} className={QUIET_ACTION_CLASS}>
        {KOPF_BACK}
      </Link>
      {/* Wraps instead of running out, so a line too long shows as a second row in the specs. */}
      <QuietLinks
        label={KOPF_LABEL}
        links={PAGES.filter(({ to }) => to !== page)}
        className="flex-wrap justify-end"
      />
    </header>
  );
}
