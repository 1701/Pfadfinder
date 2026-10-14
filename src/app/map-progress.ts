// Lazy chunk for the start page: reads progress from IndexedDB (Dexie) after the map's
// geometry is already on screen, so the start page's own bundle stays free of Dexie.

import type { Fach } from '../domain/content/taxonomy';
import { appRepositories } from '../data/dexie/instance';
import { loadMapProgress, postponeOffer, type MapProgress } from '../data/map-progress';

export function loadAppMapProgress(): Promise<MapProgress> {
  return loadMapProgress(appRepositories(), new Date().toISOString());
}

export function postponeAppOffer(fach: Fach): Promise<void> {
  return postponeOffer(appRepositories(), fach, new Date().toISOString());
}
