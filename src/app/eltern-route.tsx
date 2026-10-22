// The Eltern page as its own lazy chunk (it needs IndexedDB). Reached by URL or from the legal pages.

import { backupFile, importLearnerData } from '../data/backup';
import { appRepositories } from '../data/dexie/instance';
import { ensureLearner } from '../data/practice';
import { downloadTextFile } from '../ui/download';
import { ElternScreen } from '../ui/screens/ElternScreen';
import { applyUpdate, useUpdateReady } from './pwa-update';

async function downloadBackup() {
  const repos = appRepositories();
  const now = new Date();
  // A device without any answers still gets a valid (empty) file.
  const learner = await ensureLearner({
    repos,
    now: () => now.toISOString(),
    newId: () => crypto.randomUUID(),
  });
  const { name, text } = await backupFile(repos, learner.id, now);
  downloadTextFile(name, text);
}

// The screen checked the file already; a failed check here still changes nothing.
async function importBackup(text: string) {
  const result = await importLearnerData(appRepositories(), text);
  if (!result.ok) throw new Error('not a backup');
}

export function ElternRoute() {
  const updateReady = useUpdateReady();
  return (
    <ElternScreen
      buildId={__BUILD_ID__}
      update={updateReady ? { onReload: applyUpdate } : null}
      downloadBackup={downloadBackup}
      deleteAll={() => appRepositories().clear()}
      // A full load of the start page: the stores of this run still hold the deleted learner.
      onDeleted={() => window.location.replace('/')}
      importBackup={importBackup}
      // Same full load: the map then shows the state of the backup.
      onImported={() => window.location.replace('/')}
    />
  );
}
