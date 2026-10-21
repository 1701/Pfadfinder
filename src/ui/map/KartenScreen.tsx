// Start page with the map. The manifest is part of the start bundle; progress comes from a lazy
// loader (IndexedDB), read again every time the page opens, e.g. after a practice session.
// "Später" is stored the same way, so it holds across reloads until the end of the day. The offer
// shows only before the day's first Fundstück and at most once a day (mapOffer).

import { useEffect, useState } from 'react';
import type { ContentManifest } from '../../domain/content/manifest';
import type { Fach } from '../../domain/content/taxonomy';
import type { Format } from '../../domain/content/types';
import type { MasteryState } from '../../domain/mastery/mastery';
import { DAILY_GOAL, mapOffer, mapRegionState, type TodayProgress } from '../../domain/progress';
import { practiceableBereicheFromManifest } from '../../domain/scheduler/practiceable';
import type { AppUpdate } from '../components/UpdateHinweis';
import { KartenView, type KartenViewProps } from './KartenView';

export interface MapProgressSource {
  mastery: MasteryState[];
  unlocked: string[];
  today: TodayProgress;
  /** Today's Einstieg offer is spent ("Später" or a finished Einstieg). */
  offerSpent: boolean;
}

export interface KartenScreenProps {
  manifest: ContentManifest;
  formats: readonly Format[];
  loadProgress(): Promise<MapProgressSource>;
  /** Stores "Später" for the Fach; the offer hides at once, whether or not storing works. */
  postponeOffer(fach: Fach): Promise<void>;
  /** A waiting new version (task 11); null otherwise. */
  update?: AppUpdate;
}

/** Each Fach with at least one Probetest; the line links to its list (task 16). */
function probetestLines(manifest: ContentManifest): Fach[] {
  return (Object.entries(manifest.probetests) as [Fach, string[]][]).flatMap(([fach, ids]) =>
    ids.length > 0 ? [fach] : [],
  );
}

const EMPTY: MapProgressSource = {
  mastery: [],
  unlocked: [],
  today: { count: 0, goal: DAILY_GOAL, reached: false },
  offerSpent: false,
};

export function KartenScreen({
  manifest,
  formats,
  loadProgress,
  postponeOffer,
  update = null,
}: KartenScreenProps) {
  const [progress, setProgress] = useState<KartenViewProps['progress']>(null);
  // The Fach whose Einstiegscheck the map offers, before "Später".
  const [offerFach, setOfferFach] = useState<Fach | null>(null);
  const [resting, setResting] = useState(false);

  useEffect(() => {
    let active = true;
    // Without readable storage the Einstieg could not be kept, so it is not offered.
    const show = ({ mastery, unlocked, today, offerSpent }: MapProgressSource, stored = true) => {
      if (!active) return;
      setProgress({ states: mapRegionState(manifest, mastery, unlocked, formats), today });
      setResting(offerSpent);
      setOfferFach(
        stored
          ? mapOffer({
              practiceable: practiceableBereicheFromManifest(manifest, formats),
              mastery,
              todayCount: today.count,
              spent: offerSpent,
            })
          : null,
      );
    };
    // Storage unavailable (e.g. blocked site data): the map still works, without progress.
    loadProgress().then(
      (p) => show(p),
      () => show(EMPTY, false),
    );
    return () => {
      active = false;
    };
  }, [manifest, formats, loadProgress]);

  const offer =
    offerFach && !resting
      ? {
          fach: offerFach,
          onLater: () => {
            setResting(true);
            // Not stored (blocked storage): it still rests until the map opens again.
            postponeOffer(offerFach).catch(() => undefined);
          },
        }
      : null;
  return (
    <KartenView
      progress={progress}
      offer={offer}
      probetests={probetestLines(manifest)}
      update={update}
    />
  );
}
