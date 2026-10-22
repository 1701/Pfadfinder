// @vitest-environment jsdom
import '../dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { exportLearnerData, importLearnerData } from '../../../src/data/backup';
import { loadMapProgress } from '../../../src/data/map-progress';
import { createMemoryRepositories } from '../../../src/data/memory/repos';
import { createSessionStore } from '../../../src/data/session-store';
import { ElternScreen } from '../../../src/ui/screens/ElternScreen';
import { answerFor, testDeps } from '../../data/helpers';

function renderScreen(
  deleteAll: () => Promise<void> = vi.fn().mockResolvedValue(undefined),
  onDeleted = vi.fn(),
  downloadBackup: () => Promise<void> = vi.fn().mockResolvedValue(undefined),
  update: { onReload(): void } | null = null,
  importBackup: (text: string) => Promise<void> = vi.fn().mockResolvedValue(undefined),
  onImported = vi.fn(),
) {
  const questions = [
    { a: 47, b: 38 },
    { a: 12, b: 64 },
  ];
  render(
    <MemoryRouter>
      <ElternScreen
        downloadBackup={downloadBackup}
        deleteAll={deleteAll}
        onDeleted={onDeleted}
        importBackup={importBackup}
        onImported={onImported}
        newQuestion={() => questions.shift()!}
        buildId="a1b2c3d · 18.10.2026"
        update={update}
      />
    </MemoryRouter>,
  );
  return { deleteAll, onDeleted, downloadBackup, importBackup, onImported };
}

async function type(digits: string) {
  for (const d of digits) await userEvent.click(screen.getByRole('button', { name: d }));
}

async function passGate() {
  await type('85');
  await userEvent.click(screen.getByRole('button', { name: 'Weiter' }));
}

describe('ElternScreen', () => {
  it('asks a sum on the digit pad, without a comma, and nothing else is reachable', async () => {
    renderScreen();
    expect(
      screen.getByRole('heading', { name: 'Für Erwachsene: Wie viel ist 47 + 38?' }),
    ).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Komma' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Weiter' }).hasAttribute('disabled')).toBe(true);
    expect(screen.queryByRole('button', { name: 'Alles löschen' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Vorlesen' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Zur Karte' }).getAttribute('href')).toBe('/');
  });

  it('links So geht’s, Impressum and Datenschutz before the sum and after it', async () => {
    renderScreen();
    const links = () =>
      screen
        .getAllByRole('link')
        .filter((l) => l.closest('nav'))
        .map((l) => [l.textContent, l.getAttribute('href')]);
    const expected = [
      ['So geht’s', '/so-gehts'],
      ['Impressum', '/impressum'],
      ['Datenschutz', '/datenschutz'],
    ];
    expect(links()).toEqual(expected);
    await passGate();
    expect(links()).toEqual(expected);
  });

  it('shows the build quietly, before the sum and after it, and no update without one', async () => {
    renderScreen();
    expect(screen.getByText('Version a1b2c3d · 18.10.2026')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Neue Version – Neu laden' })).toBeNull();
    await passGate();
    expect(screen.getByText('Version a1b2c3d · 18.10.2026')).toBeTruthy();
  });

  it('offers a waiting version as a quiet reload, not yellow', async () => {
    const onReload = vi.fn();
    renderScreen(undefined, undefined, undefined, { onReload });
    const reload = screen.getByRole('button', { name: 'Neue Version – Neu laden' });
    expect(reload.className).not.toContain('bg-signal');
    await userEvent.click(reload);
    expect(onReload).toHaveBeenCalledOnce();
  });

  it('gives a new sum after a wrong answer', async () => {
    renderScreen();
    await type('84');
    expect(screen.getByLabelText('Deine Zahl').textContent).toBe('84');
    await userEvent.click(screen.getByRole('button', { name: 'Weiter' }));
    expect(
      screen.getByRole('heading', { name: 'Für Erwachsene: Wie viel ist 12 + 64?' }),
    ).toBeTruthy();
    expect(screen.getByText('Das passt nicht. Hier ist eine neue Rechnung.')).toBeTruthy();
    expect(screen.getByLabelText('Deine Zahl').textContent).toBe('');
  });

  it('asks back before deleting; Abbrechen keeps everything', async () => {
    const { deleteAll } = renderScreen();
    await passGate();
    await userEvent.click(screen.getByRole('button', { name: 'Alles löschen' }));
    expect(
      screen.getByRole('heading', {
        name: 'Wirklich alles löschen? Das kann nicht rückgängig gemacht werden.',
      }),
    ).toBeTruthy();
    const band = document.querySelector('[data-region="band"]')!;
    expect([...band.children].map((c) => c.textContent)).toEqual([
      'Abbrechen',
      'Ja, alles löschen',
    ]);
    expect(document.activeElement?.textContent).toBe('Abbrechen');
    await userEvent.click(screen.getByRole('button', { name: 'Abbrechen' }));
    expect(screen.getByRole('button', { name: 'Alles löschen' })).toBeTruthy();
    expect(deleteAll).not.toHaveBeenCalled();
  });

  it('deletes and then goes on to the map', async () => {
    const { deleteAll, onDeleted } = renderScreen();
    await passGate();
    await userEvent.click(screen.getByRole('button', { name: 'Alles löschen' }));
    await userEvent.click(screen.getByRole('button', { name: 'Ja, alles löschen' }));
    expect(deleteAll).toHaveBeenCalledOnce();
    expect(onDeleted).toHaveBeenCalledOnce();
  });

  it('says so when deleting fails, and stays', async () => {
    const onDeleted = vi.fn();
    renderScreen(vi.fn().mockRejectedValue(new Error('blocked')), onDeleted);
    await passGate();
    await userEvent.click(screen.getByRole('button', { name: 'Alles löschen' }));
    await userEvent.click(screen.getByRole('button', { name: 'Ja, alles löschen' }));
    expect(
      await screen.findByText('Das Löschen hat nicht geklappt. Versuch es bitte noch einmal.'),
    ).toBeTruthy();
    expect(onDeleted).not.toHaveBeenCalled();
  });

  it('leaves a device on which the map offers the Einstieg again', async () => {
    const repos = createMemoryRepositories();
    const store = createSessionStore(testDeps(repos));
    await store.getState().startPractice('mathe', 'zahlen-operationen');
    store.getState().setAnswer(answerFor(store.getState().current!.item, true));
    await store.getState().submit();
    await repos.postponedOffers.put({ fach: 'mathe', at: '2026-10-14T08:00:00.000Z' });
    const now = '2026-10-14T09:00:00.000Z';
    expect((await loadMapProgress(repos, now)).mastery).toHaveLength(1);

    renderScreen(() => repos.clear());
    await passGate();
    await userEvent.click(screen.getByRole('button', { name: 'Alles löschen' }));
    await userEvent.click(screen.getByRole('button', { name: 'Ja, alles löschen' }));
    expect(await loadMapProgress(repos, now)).toEqual({
      mastery: [],
      unlocked: [],
      today: { count: 0, goal: 10, reached: false },
      offerSpent: false,
    });
  });

  it('offers "Sicherung herunterladen" above "Alles löschen", not yellow', async () => {
    const { downloadBackup, deleteAll } = renderScreen();
    await passGate();
    const backup = screen.getByRole('button', { name: 'Sicherung herunterladen' });
    const remove = screen.getByRole('button', { name: 'Alles löschen' });
    expect(backup.compareDocumentPosition(remove) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(backup.className).not.toContain('bg-signal');
    await userEvent.click(backup);
    expect(downloadBackup).toHaveBeenCalledOnce();
    expect(deleteAll).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Alles löschen' })).toBeTruthy();
  });

  it('says so when the backup fails, and nothing is deleted', async () => {
    const { deleteAll } = renderScreen(
      undefined,
      undefined,
      vi.fn().mockRejectedValue(new Error('x')),
    );
    await passGate();
    await userEvent.click(screen.getByRole('button', { name: 'Sicherung herunterladen' }));
    expect(
      await screen.findByText('Die Sicherung hat nicht geklappt. Versuch es bitte noch einmal.'),
    ).toBeTruthy();
    expect(deleteAll).not.toHaveBeenCalled();
  });

  it('shows the hint on a Premium voice after the sum, above the buttons, without a switch', async () => {
    renderScreen();
    const hint =
      'Auf dem iPad klingt das Vorlesen besser, wenn du in Einstellungen → Bedienungshilfen → Gesprochene Inhalte eine Premium-Stimme für Deutsch lädst.';
    expect(screen.queryByText(hint)).toBeNull();
    await passGate();
    const text = screen.getByText(hint);
    const backup = screen.getByRole('button', { name: 'Sicherung herunterladen' });
    expect(text.compareDocumentPosition(backup) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByRole('checkbox')).toBeNull();
    expect(screen.queryByRole('switch')).toBeNull();
  });

  it('offers "Sicherung einlesen" between the other two, only after the sum', async () => {
    renderScreen();
    expect(screen.queryByRole('button', { name: 'Sicherung einlesen' })).toBeNull();
    await passGate();
    const band = document.querySelector('[data-region="band"]')!;
    expect([...band.querySelectorAll('button')].map((b) => b.textContent)).toEqual([
      'Sicherung herunterladen',
      'Sicherung einlesen',
      'Alles löschen',
    ]);
    expect(screen.getByRole('button', { name: 'Sicherung einlesen' }).className).not.toContain(
      'bg-signal',
    );
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    expect(input.accept).toBe('.json,application/json');
  });

  describe('reading a backup in (memory repositories)', () => {
    const now = '2026-10-14T09:00:00.000Z';

    /** A device with one answer in Mathe; its backup file. */
    async function backupOfPlayedDevice() {
      const repos = createMemoryRepositories();
      const store = createSessionStore(testDeps(repos));
      await store.getState().startPractice('mathe', 'zahlen-operationen');
      store.getState().setAnswer(answerFor(store.getState().current!.item, true));
      await store.getState().submit();
      const file = await exportLearnerData(repos, store.getState().learner!.id, now);
      return { repos, text: JSON.stringify(file) };
    }

    const upload = (text: string, name = 'pfadfinder-sicherung-2026-10-14.json') =>
      userEvent.upload(
        document.querySelector<HTMLInputElement>('input[type="file"]')!,
        new File([text], name, { type: 'application/json' }),
      );

    function renderOn(target: ReturnType<typeof createMemoryRepositories>) {
      const onImported = vi.fn();
      renderScreen(
        undefined,
        undefined,
        undefined,
        null,
        async (text) => {
          const result = await importLearnerData(target, text);
          if (!result.ok) throw new Error('not a backup');
        },
        onImported,
      );
      return onImported;
    }

    it('asks back, then replaces everything on this device and goes to the map', async () => {
      const { repos: source, text } = await backupOfPlayedDevice();
      const target = createMemoryRepositories();
      await target.postponedOffers.put({ fach: 'mathe', at: now });
      const onImported = renderOn(target);
      await passGate();
      await upload(text);
      expect(
        await screen.findByRole('heading', { name: 'Ersetzt alles auf diesem Gerät. Weiter?' }),
      ).toBeTruthy();
      const band = document.querySelector('[data-region="band"]')!;
      expect([...band.children].map((c) => c.textContent)).toEqual(['Abbrechen', 'Einlesen']);
      expect(document.activeElement?.textContent).toBe('Abbrechen');
      await userEvent.click(screen.getByRole('button', { name: 'Einlesen' }));
      expect(onImported).toHaveBeenCalledOnce();
      expect((await loadMapProgress(target, now)).mastery).toEqual(
        (await loadMapProgress(source, now)).mastery,
      );
      expect((await loadMapProgress(target, now)).mastery).toHaveLength(1);
    });

    it('"Abbrechen" changes nothing', async () => {
      const { text } = await backupOfPlayedDevice();
      const target = createMemoryRepositories();
      const onImported = renderOn(target);
      await passGate();
      await upload(text);
      await userEvent.click(await screen.findByRole('button', { name: 'Abbrechen' }));
      expect(screen.getByRole('button', { name: 'Sicherung einlesen' })).toBeTruthy();
      expect(onImported).not.toHaveBeenCalled();
      expect((await loadMapProgress(target, now)).mastery).toEqual([]);
    });

    it('a file that is no backup changes nothing and says so in one sentence', async () => {
      const target = createMemoryRepositories();
      await target.postponedOffers.put({ fach: 'mathe', at: now });
      const onImported = renderOn(target);
      await passGate();
      for (const text of ['kein JSON', JSON.stringify({ version: '2', learner: {} })]) {
        await upload(text);
        expect(await screen.findByText('Das ist keine Pfadfinder-Sicherung.')).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Einlesen' })).toBeNull();
      }
      expect(onImported).not.toHaveBeenCalled();
      expect((await loadMapProgress(target, now)).offerSpent).toBe(true);
    });
  });

  it('says so when writing the backup fails, and stays', async () => {
    const importBackup = vi.fn().mockRejectedValue(new Error('blocked'));
    const onImported = vi.fn();
    renderScreen(undefined, undefined, undefined, null, importBackup, onImported);
    await passGate();
    const repos = createMemoryRepositories();
    const store = createSessionStore(testDeps(repos));
    await store.getState().startPractice('mathe', 'zahlen-operationen');
    const file = await exportLearnerData(
      repos,
      store.getState().learner!.id,
      '2026-10-14T09:00:00.000Z',
    );
    await userEvent.upload(
      document.querySelector<HTMLInputElement>('input[type="file"]')!,
      new File([JSON.stringify(file)], 'sicherung.json', { type: 'application/json' }),
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Einlesen' }));
    expect(
      await screen.findByText('Das Einlesen hat nicht geklappt. Versuch es bitte noch einmal.'),
    ).toBeTruthy();
    expect(onImported).not.toHaveBeenCalled();
  });
});
