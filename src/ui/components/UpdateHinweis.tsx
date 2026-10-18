// "Neue Version – Neu laden" on /eltern, "Neu laden" in the map's legend line: quiet, for adults,
// never during a round or a Probetest (task 11). Not yellow: it is no step on the child's way.

import clsx from 'clsx';
import { UPDATE_RELOAD, UPDATE_RELOAD_SHORT } from '../text/update';
import { QUIET_ACTION_CLASS } from './quiet';

/** Null while no new version waits. */
export type AppUpdate = { onReload(): void } | null;

/**
 * `onMap`: only "Neu laden", and in portrait only from 1024 px screen height (64rem; media queries
 * count rem in the browser's 16 px). That is the installed app on the iPad (names 20.3 px). In
 * Safari with its bars (768×900) the legend line would need a second row and the Gebietsnamen
 * would drop to 17.0 px; there the reload stays on /eltern (decision Markus, task 11).
 */
export function UpdateHinweis({ update, onMap = false }: { update: AppUpdate; onMap?: boolean }) {
  if (!update) return null;
  return (
    <button
      type="button"
      className={clsx(
        QUIET_ACTION_CLASS,
        onMap && '[@media(orientation:portrait)_and_(max-height:63.99rem)]:hidden',
      )}
      onClick={update.onReload}
    >
      {onMap ? UPDATE_RELOAD_SHORT : UPDATE_RELOAD}
    </button>
  );
}
