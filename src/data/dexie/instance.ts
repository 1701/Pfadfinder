// The app's one set of Dexie repositories, shared by the practice route and the map's
// progress read (both lazy chunks; Dexie never reaches the start page's bundle).

import type { Repositories } from '../repos';
import { createDexieRepositories } from './repos';

let repos: Repositories | null = null;

export function appRepositories(): Repositories {
  repos ??= createDexieRepositories();
  return repos;
}
