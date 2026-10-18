// "Neue Version – Neu laden": quiet, for adults, only on /eltern and in the map's legend line,
// never during a round or a Probetest (task 11). Not yellow: it is no step on the child's way.

import { UPDATE_RELOAD } from '../text/update';
import { QUIET_ACTION_CLASS } from './quiet';

/** Null while no new version waits. */
export type AppUpdate = { onReload(): void } | null;

export function UpdateHinweis({ update }: { update: AppUpdate }) {
  if (!update) return null;
  return (
    <button type="button" className={QUIET_ACTION_CLASS} onClick={update.onReload}>
      {UPDATE_RELOAD}
    </button>
  );
}
