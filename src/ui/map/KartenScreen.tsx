// Start page with the map. The manifest is part of the start bundle; progress comes from a lazy
// loader (IndexedDB), read again every time the page opens, e.g. after a practice session.

import { useEffect, useState } from 'react';
import type { ContentManifest } from '../../domain/content/manifest';
import type { Format } from '../../domain/content/types';
import type { MasteryState } from '../../domain/mastery/mastery';
import { DAILY_GOAL, mapRegionState, type TodayProgress } from '../../domain/progress';
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

  useEffect(() => {
    let active = true;
    const show = ({ mastery, unlocked, today }: MapProgressSource) => {
      if (active) {
        setProgress({ states: mapRegionState(manifest, mastery, unlocked, formats), today });
      }
    };
    // Storage unavailable (e.g. blocked site data): the map still works, without progress.
    loadProgress().then(show, () => show(EMPTY));
    return () => {
      active = false;
    };
  }, [manifest, formats, loadProgress]);

  return <KartenView progress={progress} />;
}
