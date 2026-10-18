// "Neue Version – Neu laden" on /eltern, "Neu laden" in the map's legend line: quiet, for adults,
// never during a round or a Probetest (task 11). Not yellow: it is no step on the child's way.

import { UPDATE_RELOAD, UPDATE_RELOAD_SHORT } from '../text/update';
import { QUIET_ACTION_CLASS } from './quiet';

/** Null while no new version waits. */
export type AppUpdate = { onReload(): void } | null;

/**
 * `onMap`: only "Neu laden", the line below the map is short. In every viewport since the legend
 * moved into the sea of the map: the line stays one row, Safari portrait names 18.2 px (task 11).
 */
export function UpdateHinweis({ update, onMap = false }: { update: AppUpdate; onMap?: boolean }) {
  if (!update) return null;
  return (
    <button type="button" className={QUIET_ACTION_CLASS} onClick={update.onReload}>
      {onMap ? UPDATE_RELOAD_SHORT : UPDATE_RELOAD}
    </button>
  );
}
