// @vitest-environment jsdom
import '../dom';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import manifest from '../../../content/manifest.json';
import type { ContentManifest } from '../../../src/domain/content/manifest';
import { KartenScreen, type MapProgressSource } from '../../../src/ui/map/KartenScreen';
import { SUPPORTED_FORMATS } from '../../../src/ui/formats/supported';
import { OPEN_BEREICHE } from '../../fixtures/content-state';
import { BEREICH_NAME } from '../../../src/ui/text/bereiche';
import { masteryFor } from '../../fixtures/pool';

function renderScreen(
  loadProgress: () => Promise<MapProgressSource>,
  update: { onReload(): void } | null = null,
) {
  render(
    <MemoryRouter>
      <KartenScreen
        manifest={manifest as ContentManifest}
        formats={SUPPORTED_FORMATS}
        loadProgress={loadProgress}
        postponeOffer={() => Promise.resolve()}
        update={update}
      />
    </MemoryRouter>,
  );
}

describe('KartenScreen', () => {
  it('shows the title first and the map once the progress is read', async () => {
    let resolve!: (p: MapProgressSource) => void;
    renderScreen(() => new Promise((r) => (resolve = r)));
    expect(screen.getByRole('heading', { name: "Wohin geht's heute?" })).toBeTruthy();
    expect(screen.queryByRole('group', { name: 'Karte' })).toBeNull();
    resolve({
      mastery: [masteryFor('zahlen-operationen', 2)],
      unlocked: ['zahlen-operationen:1'],
      today: { count: 3, goal: 10, reached: false },
      postponed: [],
    });
    const map = (await screen.findAllByRole('group', { name: 'Karte' }))[0]!;
    // Real content: every open Gebiet is a link, the stored mastery shows on Zahlen und Rechnen.
    expect(
      within(map)
        .getAllByRole('link')
        .map((l) => l.getAttribute('aria-label')),
    ).toEqual(
      OPEN_BEREICHE.map((b) => `${BEREICH_NAME[b]}, Niveau ${b === 'zahlen-operationen' ? 2 : 1}`),
    );
    expect(OPEN_BEREICHE).toContain('zahlen-operationen');
    expect(screen.getByText('Heute: 3 von 10 Fundstücken')).toBeTruthy();
  });

  it('offers a waiting version in the legend line, only when there is one', async () => {
    const failing = () => Promise.reject(new Error('blocked'));
    renderScreen(failing);
    await screen.findAllByRole('group', { name: 'Karte' });
    expect(screen.queryByRole('button', { name: 'Neu laden' })).toBeNull();
  });

  it('links Impressum and Datenschutz in the legend line', async () => {
    renderScreen(() => Promise.reject(new Error('blocked')));
    await screen.findAllByRole('group', { name: 'Karte' });
    const nav = screen.getByRole('navigation', { name: 'Rechtliches' });
    expect(
      within(nav)
        .getAllByRole('link')
        .map((l) => [l.textContent, l.getAttribute('href')]),
    ).toEqual([
      ['Impressum', '/impressum'],
      ['Datenschutz', '/datenschutz'],
    ]);
  });

  it('reloads for a waiting version on a tap, "Neu laden" only (the line is short)', async () => {
    const onReload = vi.fn();
    renderScreen(() => Promise.reject(new Error('blocked')), { onReload });
    await screen.findAllByRole('group', { name: 'Karte' });
    screen.getByRole('button', { name: 'Neu laden' }).click();
    expect(onReload).toHaveBeenCalledOnce();
  });

  it('still shows the map when the storage cannot be read', async () => {
    const failing = vi.fn().mockRejectedValue(new Error('blocked'));
    renderScreen(failing);
    const map = (await screen.findAllByRole('group', { name: 'Karte' }))[0]!;
    expect(within(map).getAllByRole('link')).toHaveLength(OPEN_BEREICHE.length);
    expect(screen.getByText('Heute: 0 von 10 Fundstücken')).toBeTruthy();
  });

  it('offers the Probetest of a Fach as a line below the map, only if the manifest has one', async () => {
    renderScreen(() =>
      Promise.resolve({
        mastery: [],
        unlocked: [],
        today: { count: 0, goal: 10, reached: false },
        postponed: [],
      }),
    );
    await screen.findAllByRole('group', { name: 'Karte' });
    const link = screen.getByRole('link', { name: 'Probetest Mathe' });
    expect(link.getAttribute('href')).toBe('/probetest/mathe-01');
    expect(screen.queryByRole('link', { name: 'Probetest Deutsch' })).toBeNull();
  });

  it('shows no Probetest line without a Probetest in the manifest', async () => {
    const without = { ...(manifest as ContentManifest), probetests: { mathe: [], deutsch: [] } };
    render(
      <MemoryRouter>
        <KartenScreen
          manifest={without}
          formats={SUPPORTED_FORMATS}
          loadProgress={() =>
            Promise.resolve({
              mastery: [],
              unlocked: [],
              today: { count: 0, goal: 10, reached: false },
              postponed: [],
            })
          }
          postponeOffer={() => Promise.resolve()}
        />
      </MemoryRouter>,
    );
    await screen.findAllByRole('group', { name: 'Karte' });
    expect(screen.queryByRole('link', { name: /Probetest/ })).toBeNull();
  });
});
