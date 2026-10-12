// Lazy chunk for the start page: reads progress from IndexedDB (Dexie) after the map's
// geometry is already on screen, so the start page's own bundle stays free of Dexie.

import { appRepositories } from '../data/dexie/instance';
import { loadMapProgress, type MapProgress } from '../data/map-progress';

export function loadAppMapProgress(): Promise<MapProgress> {
  return loadMapProgress(appRepositories(), new Date().toISOString());
}
