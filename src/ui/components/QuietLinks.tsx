// A quiet group of links with "·" between them: "Impressum · Datenschutz" and, below the map,
// "Probetest Mathe · Probetest Deutsch" (task 14). One look for both groups of the line.

import clsx from 'clsx';
import { Fragment } from 'react';
import { Link } from 'react-router';
import { QUIET_ACTION_CLASS } from './quiet';

export function QuietLinks({
  label,
  links,
  className,
}: {
  label: string;
  links: readonly { to: string; text: string }[];
  className?: string;
}) {
  return (
    <nav aria-label={label} className={clsx('flex items-center text-ink-muted', className)}>
      {links.map(({ to, text }, i) => (
        <Fragment key={to}>
          {i > 0 && <span aria-hidden="true">·</span>}
          <Link to={to} className={QUIET_ACTION_CLASS}>
            {text}
          </Link>
        </Fragment>
      ))}
    </nav>
  );
}
