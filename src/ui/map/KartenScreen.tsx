// Start page with the map. The manifest is part of the start bundle; progress comes from a lazy
// loader (IndexedDB), read again every time the page opens, e.g. after a practice session.

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
import { isOfferPostponed, postponeOffer } from './check-offer';
import { KartenView, type KartenViewProps } from './KartenView';

export interface MapProgressSource {
  mastery: MasteryState[];
  unlocked: string[];
  today: TodayProgress;
}

export interface KartenScreenProps {
  manifest: ContentManifest;
  formats: readonly Format[];
  loadProgress(): Promise<MapProgressSource>;
}

const EMPTY: MapProgressSource = {
  mastery: [],
  unlocked: [],
  today: { count: 0, goal: DAILY_GOAL, reached: false },
};

export function KartenScreen({ manifest, formats, loadProgress }: KartenScreenProps) {
  const [progress, setProgress] = useState<KartenViewProps['progress']>(null);
  // The Fach whose Einstiegscheck the map offers, before "Später".
  const [offerFach, setOfferFach] = useState<Fach | null>(null);
  const [, setPostponed] = useState(0);

  useEffect(() => {
    let active = true;
    // Without readable storage the Einstieg could not be kept, so it is not offered.
    const show = ({ mastery, unlocked, today }: MapProgressSource, stored = true) => {
      if (!active) return;
      setProgress({ states: mapRegionState(manifest, mastery, unlocked, formats), today });
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
    offerFach && !isOfferPostponed(offerFach)
      ? {
          fach: offerFach,
          onLater: () => {
            postponeOffer(offerFach);
            setPostponed((n) => n + 1);
          },
        }
      : null;
  return <KartenView progress={progress} offer={offer} />;
}
