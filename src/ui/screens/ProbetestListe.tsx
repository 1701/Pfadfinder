// Route /probetest/mathe and /probetest/deutsch (task 16): the Probetests of one Fach in manifest
// order, each a full-width entry with its name and whether it was done. No result here, no
// Vorlesen (two words per entry), nothing for adults. Same rows as the other sheets: title, the
// list, the band with "Zurück" to the map. Only the list may scroll; the band stays.

import { Link } from 'react-router';
import type { Fach } from '../../domain/content/taxonomy';
import type { ProbetestStand } from '../../domain/probetest/list';
import { QUIET_ACTION_CLASS } from '../components/quiet';
import { BACK, LIST_EMPTY, NOT_DONE, DONE, listEntryName, probetestName } from '../text/probetest';

/** id, number (position in the manifest) and doneAt (null: not done yet). */
export type ProbetestListEntry = ProbetestStand;

export function ProbetestListe({
  fach,
  entries,
  known,
}: {
  fach: Fach;
  entries: readonly ProbetestListEntry[];
  /** False while loading or when the storage cannot be read: names only, no Stand. */
  known: boolean;
}) {
  return (
    <main className="screen-fit mx-auto grid max-w-page grid-rows-[auto_1fr_auto] gap-sm px-lg py-sm">
      <h1 className="flex min-h-touch items-center text-display font-bold">
        {probetestName(fach)}
      </h1>
      {/* Room for the focus ring inside the scroll box, the entries stay at the page's edges. */}
      <div className="-mx-xs min-h-0 overflow-y-auto px-xs py-xs">
        {entries.length === 0 ? (
          <p className="text-option">{LIST_EMPTY}</p>
        ) : (
          <ul className="grid gap-sm">
            {entries.map((entry) => (
              <li key={entry.id}>
                <Link
                  to={`/probetest/${entry.id}`}
                  className="flex min-h-3xl flex-wrap items-center justify-between gap-x-lg rounded-control border-2 border-line-strong bg-surface px-lg py-xs"
                >
                  <span className="text-option font-bold">{listEntryName(fach, entry.number)}</span>
                  {known && (
                    <span className="ml-auto text-ink-muted">{entry.doneAt ? DONE : NOT_DONE}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div data-region="band" className="flex items-end justify-between gap-md">
        <Link to="/" className={QUIET_ACTION_CLASS}>
          {BACK}
        </Link>
      </div>
    </main>
  );
}
