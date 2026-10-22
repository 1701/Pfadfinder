// Route /eltern, by URL or "Für Eltern" at the end of Impressum and Datenschutz (task 11), never
// from a child's screen: a sum to get in, then
// "Sicherung herunterladen" (a file with all data, since 2026-10-16) above the button that
// deletes everything on this device after asking back. Import and an overview come later
// (PRODUCT.md §8). No Vorlesen here: reading the question aloud would only help a child in.
// So geht’s, Impressum and Datenschutz top right, already before the sum (task 10, /so-gehts since
// 2026-10-22); also on the map (task 11).
// Bottom left, quietly: the build ("Version a1b2c3d · 18.10.2026") and, once a new version
// waits, "Neue Version – Neu laden" (task 11), also before the sum.

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { gateQuestion, isGateAnswer, type GateQuestion } from '../../domain/parents';
import { Button } from '../components/Button';
import { RechtlichesLinks } from '../components/RechtlichesLinks';
import { UpdateHinweis, type AppUpdate } from '../components/UpdateHinweis';
import { ZiffernBlock } from '../components/ZiffernBlock';
import { focusQuietly } from '../focus';
import { TO_MAP } from '../text/einstieg';
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
  gateTitle,
} from '../text/eltern';
import { versionLine } from '../text/update';
import { Blatt } from './Blatt';
import { QUIET_ACTION_CLASS } from './ItemScreen';

export interface ElternScreenProps {
  /** Writes all data of this device into a file and hands it to the browser. */
  downloadBackup(): Promise<void>;
  /** Deletes every table on this device. */
  deleteAll(): Promise<void>;
  /** After deleting: back to the map, which offers the Einstieg again. */
  onDeleted(): void;
  /** Tests pass a fixed question. */
  newQuestion?: () => GateQuestion;
  /** Short commit hash and build day. */
  buildId: string;
  update?: AppUpdate;
}

type Step = 'frage' | 'offen' | 'rueckfrage' | 'loeschen';

const zurKarte = (
  <Link to="/" className={QUIET_ACTION_CLASS}>
    {TO_MAP}
  </Link>
);

function Version({ buildId, update }: { buildId: string; update: AppUpdate }) {
  return (
    <div className="flex flex-wrap items-center gap-x-sm text-ink-muted">
      <p className="px-sm">{versionLine(buildId)}</p>
      <UpdateHinweis update={update} />
    </div>
  );
}

const rechtliches = <RechtlichesLinks soGehts />;

export function ElternScreen({
  downloadBackup,
  deleteAll,
  onDeleted,
  newQuestion = gateQuestion,
  buildId,
  update = null,
}: ElternScreenProps) {
  const version = <Version buildId={buildId} update={update} />;
  const [step, setStep] = useState<Step>('frage');
  const [failed, setFailed] = useState<'backup' | 'delete' | null>(null);
  const [saving, setSaving] = useState(false);

  if (step === 'frage') {
    return <Frage newQuestion={newQuestion} version={version} onPass={() => setStep('offen')} />;
  }
  if (step === 'offen') {
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
        left={zurKarte}
        right={rechtliches}
        title={DELETE_TITLE}
        text={
          failed === 'backup' ? BACKUP_FAILED : failed === 'delete' ? DELETE_FAILED : DELETE_TEXT
        }
        readAloud={false}
        actions={
          <>
            {version}
            {/* Not yellow: neither is a next step on the way (task 6b). */}
            <div className="flex flex-col items-stretch gap-sm">
              <Button size="large" disabled={saving} onClick={() => void backup()}>
                {BACKUP}
              </Button>
              <Button size="large" onClick={() => setStep('rueckfrage')}>
                {DELETE_ALL}
              </Button>
            </div>
          </>
        }
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
    <Rueckfrage busy={step === 'loeschen'} onCancel={() => setStep('offen')} onDelete={remove} />
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
      left={zurKarte}
      right={rechtliches}
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

function Rueckfrage(props: { busy: boolean; onCancel(): void; onDelete(): void }) {
  // The safe answer has the focus; no "Zur Karte" here, "Abbrechen" already leads back.
  const cancel = useRef<HTMLButtonElement>(null);
  useEffect(() => focusQuietly(cancel.current), []);
  return (
    <Blatt
      title={CONFIRM_TITLE}
      readAloud={false}
      actions={
        <>
          <Button ref={cancel} size="large" disabled={props.busy} onClick={props.onCancel}>
            {CANCEL}
          </Button>
          <Button size="large" disabled={props.busy} onClick={props.onDelete}>
            {CONFIRM_DELETE}
          </Button>
        </>
      }
    />
  );
}
