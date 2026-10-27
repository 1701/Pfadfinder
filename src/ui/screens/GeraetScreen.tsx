// Route /eltern/geraet (the device area, at /eltern until task L), by URL or "Sicherung und Gerät"
// on /eltern and in the top line of the other pages for adults, never from a child's screen: a sum
// to get in, then three buttons: "Sicherung herunterladen" (a file with all data, since
// 2026-10-16), "Sicherung einlesen" (2026-10-22: pick a file, check it, ask back, replace
// everything, back to the map) and "Alles löschen" after asking back. An overview comes later
// (PRODUCT.md §8). No Vorlesen here: reading the question aloud would only help a child in. The
// hint on a better voice for Vorlesen moved to /eltern (task N).
// The top line of the pages for adults (ErwachsenenKopf, task N) already before the sum: "Zurück"
// to /eltern, then Eltern · So geht’s · Impressum · Datenschutz. Not while asking back: there
// "Abbrechen" is the only way back.
// Bottom left, quietly: the build ("Version a1b2c3d · 18.10.2026") and, once a new version
// waits, "Neue Version – Neu laden" (task 11), also before the sum.

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { parseImport } from '../../domain/learner';
import { gateQuestion, isGateAnswer, type GateQuestion } from '../../domain/parents';
import { Button } from '../components/Button';
import { ErwachsenenKopf } from '../components/ErwachsenenKopf';
import { UpdateHinweis, type AppUpdate } from '../components/UpdateHinweis';
import { ZiffernBlock } from '../components/ZiffernBlock';
import { focusQuietly } from '../focus';
import {
  BACKUP,
  BACKUP_FAILED,
  CANCEL,
  CONFIRM_DELETE,
  CONFIRM_TITLE,
  DELETE_ALL,
  DELETE_FAILED,
  DELETE_TEXT,
  DELETE_TITLE,
  GATE_RETRY,
  GATE_SUBMIT,
  IMPORT,
  IMPORT_CONFIRM,
  IMPORT_FAILED,
  IMPORT_GO,
  IMPORT_INVALID,
  IMPORT_NEWER,
  gateTitle,
} from '../text/geraet';
import { versionLine } from '../text/update';
import { Blatt } from './Blatt';

export interface GeraetScreenProps {
  /** Writes all data of this device into a file and hands it to the browser. */
  downloadBackup(): Promise<void>;
  /** Deletes every table on this device. */
  deleteAll(): Promise<void>;
  /** After deleting: back to the map, which offers the Einstieg again. */
  onDeleted(): void;
  /** Replaces everything on this device with a checked backup file's text (parseImport ok). */
  importBackup(text: string): Promise<void>;
  /** After reading a backup in: back to the map, which shows the backup's state. */
  onImported(): void;
  /** Tests pass a fixed question. */
  newQuestion?: () => GateQuestion;
  /** Short commit hash and build day. */
  buildId: string;
  update?: AppUpdate;
}

type Step = 'frage' | 'offen' | 'rueckfrage' | 'loeschen' | 'import-rueckfrage' | 'einlesen';
type Failure = 'backup' | 'delete' | 'invalid' | 'newer' | 'import';

const FAILURE_TEXT: Record<Failure, string> = {
  backup: BACKUP_FAILED,
  delete: DELETE_FAILED,
  invalid: IMPORT_INVALID,
  newer: IMPORT_NEWER,
  import: IMPORT_FAILED,
};

const kopf = <ErwachsenenKopf page="/eltern/geraet" />;

function Version({ buildId, update }: { buildId: string; update: AppUpdate }) {
  return (
    <div className="flex flex-wrap items-center gap-x-sm text-ink-muted">
      <p className="px-sm">{versionLine(buildId)}</p>
      <UpdateHinweis update={update} />
    </div>
  );
}

export function GeraetScreen({
  downloadBackup,
  deleteAll,
  onDeleted,
  importBackup,
  onImported,
  newQuestion = gateQuestion,
  buildId,
  update = null,
}: GeraetScreenProps) {
  const version = <Version buildId={buildId} update={update} />;
  const [step, setStep] = useState<Step>('frage');
  const [failed, setFailed] = useState<Failure | null>(null);
  const [saving, setSaving] = useState(false);
  // The checked text of the picked file, while asking back.
  const [backupText, setBackupText] = useState('');
  const filePicker = useRef<HTMLInputElement>(null);

  if (step === 'frage') {
    return <Frage newQuestion={newQuestion} version={version} onPass={() => setStep('offen')} />;
  }
  if (step === 'offen') {
    // A file that is no backup changes nothing and says so; a valid one is asked back first.
    const pick = async (input: HTMLInputElement) => {
      const file = input.files?.[0];
      input.value = ''; // The same file can be picked again.
      if (!file) return;
      // parseImport takes the file's text as it is (no JSON, unknown version: no backup; a newer
      // version: an update first).
      const text = await file.text();
      const parsed = parseImport(text);
      if (!parsed.ok) return setFailed(parsed.newerVersion ? 'newer' : 'invalid');
      setFailed(null);
      setBackupText(text);
      setStep('import-rueckfrage');
    };
    const backup = async () => {
      setSaving(true);
      try {
        await downloadBackup();
        setFailed(null);
      } catch {
        setFailed('backup');
      }
      setSaving(false);
    };
    return (
      <Blatt
        kopf={kopf}
        title={DELETE_TITLE}
        text={failed ? FAILURE_TEXT[failed] : DELETE_TEXT}
        readAloud={false}
        actions={
          <>
            {version}
            {/* Not yellow: none is a next step on the way (task 6b). */}
            <div className="flex flex-col items-stretch gap-sm">
              <Button size="large" disabled={saving} onClick={() => void backup()}>
                {BACKUP}
              </Button>
              <Button size="large" onClick={() => filePicker.current?.click()}>
                {IMPORT}
              </Button>
              <Button size="large" onClick={() => setStep('rueckfrage')}>
                {DELETE_ALL}
              </Button>
            </div>
          </>
        }
      >
        {/* Opened by "Sicherung einlesen"; outside the band, whose last child is a button. */}
        <input
          ref={filePicker}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(event) => void pick(event.currentTarget)}
        />
      </Blatt>
    );
  }
  if (step === 'import-rueckfrage' || step === 'einlesen') {
    const read = async () => {
      setStep('einlesen');
      try {
        await importBackup(backupText);
      } catch {
        setFailed('import');
        setStep('offen');
        return;
      }
      onImported();
    };
    return (
      <Rueckfrage
        title={IMPORT_CONFIRM}
        confirm={IMPORT_GO}
        busy={step === 'einlesen'}
        onCancel={() => setStep('offen')}
        onConfirm={() => void read()}
      />
    );
  }
  const remove = async () => {
    setStep('loeschen');
    try {
      await deleteAll();
    } catch {
      setFailed('delete');
      setStep('offen');
      return;
    }
    onDeleted();
  };
  return (
    <Rueckfrage
      title={CONFIRM_TITLE}
      confirm={CONFIRM_DELETE}
      busy={step === 'loeschen'}
      onCancel={() => setStep('offen')}
      onConfirm={() => void remove()}
    />
  );
}

function Frage({
  newQuestion,
  version,
  onPass,
}: {
  newQuestion: () => GateQuestion;
  version: ReactNode;
  onPass(): void;
}) {
  const [question, setQuestion] = useState(newQuestion);
  const [draft, setDraft] = useState('');
  const [retry, setRetry] = useState(false);
  const submit = () => {
    if (isGateAnswer(question, draft === '' ? null : Number(draft))) return onPass();
    setQuestion(newQuestion());
    setDraft('');
    setRetry(true);
  };
  return (
    <Blatt
      kopf={kopf}
      title={gateTitle(question)}
      text={retry ? GATE_RETRY : undefined}
      readAloud={false}
      actions={
        <>
          {version}
          <Button variant="primary" disabled={draft === ''} onClick={submit}>
            {GATE_SUBMIT}
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center gap-lg landscape:flex-row landscape:gap-3xl">
        <output
          aria-label="Deine Zahl"
          className="flex min-h-2xl min-w-3xs items-center justify-end rounded-control border-2 border-line-strong bg-surface px-lg text-prompt font-bold"
        >
          {draft}
        </output>
        <ZiffernBlock value={draft} onChange={setDraft} allowDecimal={false} maxDigits={3} />
      </div>
    </Blatt>
  );
}

function Rueckfrage(props: {
  title: string;
  confirm: string;
  busy: boolean;
  onCancel(): void;
  onConfirm(): void;
}) {
  // The safe answer has the focus; no top line here, "Abbrechen" already leads back.
  const cancel = useRef<HTMLButtonElement>(null);
  useEffect(() => focusQuietly(cancel.current), []);
  return (
    <Blatt
      title={props.title}
      readAloud={false}
      actions={
        <>
          <Button ref={cancel} size="large" disabled={props.busy} onClick={props.onCancel}>
            {CANCEL}
          </Button>
          <Button size="large" disabled={props.busy} onClick={props.onConfirm}>
            {props.confirm}
          </Button>
        </>
      }
    />
  );
}
