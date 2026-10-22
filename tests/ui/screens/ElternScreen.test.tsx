// @vitest-environment jsdom
import '../dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
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
        newQuestion={() => questions.shift()!}
        buildId="a1b2c3d · 18.10.2026"
        update={update}
      />
    </MemoryRouter>,
  );
  return { deleteAll, onDeleted, downloadBackup };
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
});
