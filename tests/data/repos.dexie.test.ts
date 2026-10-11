import 'fake-indexeddb/auto';
import { createDexieRepositories } from '../../src/data/dexie/repos';
import { openDb } from '../../src/data/dexie/db';
import { repositoryContract } from './repos.contract';

let n = 0;
repositoryContract('Dexie (fake-indexeddb)', () => createDexieRepositories(openDb(`test-${n++}`)));
