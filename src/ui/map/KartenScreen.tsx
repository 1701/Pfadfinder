// Start page with the map. The manifest is part of the start bundle; progress comes from a lazy
// loader (IndexedDB), read again every time the page opens, e.g. after a practice session.
// "Später" is stored the same way, so it holds across reloads until the end of the day.

import { useEffect, useState } from 'react';
import type { ContentManifest } from '../../domain/content/manifest';
import type { Fach } from '../../domain/content/taxonomy';
import type { Format } from '../../domain/content/types';
import type { MasteryState } from '../../domain/mastery/mastery';
import {
  DAILY_GOAL,
  checkOfferFach,
  mapRegionState,
  type TodayProgress,
} from '../../domain/progress';
import { practiceableBereicheFromManifest } from '../../domain/scheduler/practiceable';
import { KartenView, type KartenViewProps } from './KartenView';

export interface MapProgressSource {
  mastery: MasteryState[];
  unlocked: string[];
  today: TodayProgress;
  /** Fächer whose Einstieg offer rests today ("Später"). */
  postponed: Fach[];
}

export interface KartenScreenProps {
  manifest: ContentManifest;
  formats: readonly Format[];
  loadProgress(): Promise<MapProgressSource>;
  /** Stores "Später" for the Fach; the offer hides at once, whether or not storing works. */
  postponeOffer(fach: Fach): Promise<void>;
}

const EMPTY: MapProgressSource = {
  mastery: [],
  unlocked: [],
  today: { count: 0, goal: DAILY_GOAL, reached: false },
  postponed: [],
};

export function KartenScreen({
  manifest,
  formats,
  loadProgress,
  postponeOffer,
}: KartenScreenProps) {
  const [progress, setProgress] = useState<KartenViewProps['progress']>(null);
  // The Fach whose Einstiegscheck the map offers, before "Später".
  const [offerFach, setOfferFach] = useState<Fach | null>(null);
  const [postponed, setPostponed] = useState<readonly Fach[]>([]);

  useEffect(() => {
    let active = true;
    // Without readable storage the Einstieg could not be kept, so it is not offered.
    const show = ({ mastery, unlocked, today, postponed }: MapProgressSource, stored = true) => {
      if (!active) return;
      setProgress({ states: mapRegionState(manifest, mastery, unlocked, formats), today });
      setPostponed(postponed);
      setOfferFach(
        stored
          ? checkOfferFach(practiceableBereicheFromManifest(manifest, formats), mastery)
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
    offerFach && !postponed.includes(offerFach)
      ? {
          fach: offerFach,
          onLater: () => {
            setPostponed((list) => [...list, offerFach]);
            // Not stored (blocked storage): it still rests until the map opens again.
            postponeOffer(offerFach).catch(() => undefined);
          },
        }
      : null;
  return <KartenView progress={progress} offer={offer} />;
}
