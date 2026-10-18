// "Impressum · Datenschutz", quiet, on /eltern (top right) and in the map's legend line (task 11).

import { Link } from 'react-router';
import { DATENSCHUTZ_LINK, IMPRESSUM_LINK } from '../text/rechtliches-links';
import { QUIET_ACTION_CLASS } from './quiet';

export function RechtlichesLinks() {
  return (
    <nav aria-label="Rechtliches" className="flex items-center text-ink-muted">
      <Link to="/impressum" className={QUIET_ACTION_CLASS}>
        {IMPRESSUM_LINK}
      </Link>
      <span aria-hidden="true">·</span>
      <Link to="/datenschutz" className={QUIET_ACTION_CLASS}>
        {DATENSCHUTZ_LINK}
      </Link>
    </nav>
  );
}
