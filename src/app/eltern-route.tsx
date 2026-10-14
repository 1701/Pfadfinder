// The Eltern page as its own lazy chunk (it needs IndexedDB). Reached only by typing /eltern.

import { appRepositories } from '../data/dexie/instance';
import { ElternScreen } from '../ui/screens/ElternScreen';

export function ElternRoute() {
  return (
    <ElternScreen
      deleteAll={() => appRepositories().clear()}
      // A full load of the start page: the stores of this run still hold the deleted learner.
      onDeleted={() => window.location.replace('/')}
    />
  );
}
