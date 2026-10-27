// @vitest-environment jsdom
import '../dom';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { BEREICHE } from '../../../src/domain/content/taxonomy';
import { KartenScreen, type MapProgressSource } from '../../../src/ui/map/KartenScreen';
import { SUPPORTED_FORMATS } from '../../../src/ui/formats/supported';
import { FIXTURE_MANIFEST } from '../../fixtures/content';
import { BEREICH_NAME } from '../../../src/ui/text/bereiche';
import { masteryFor } from '../../fixtures/pool';

function renderScreen(
  loadProgress: () => Promise<MapProgressSource>,
  update: { onReload(): void } | null = null,
) {
  render(
    <MemoryRouter>
      <KartenScreen
        manifest={FIXTURE_MANIFEST}
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
    expect(screen.getByRole('heading', { name: 'Wohin geht’s heute?' })).toBeTruthy();
    expect(screen.queryByRole('group', { name: 'Karte' })).toBeNull();
    // Both Fächer have begun: no Einstieg offer, the Tagesziel shows.
    resolve({
      mastery: [masteryFor('zahlen-operationen', 2), masteryFor('rs-strategien', 1, 'deutsch')],
      unlocked: ['zahlen-operationen:1'],
      today: { count: 3, goal: 10, reached: false },
      foundAny: true,
      offerSpent: false,
    });
    const map = (await screen.findAllByRole('group', { name: 'Karte' }))[0]!;
    // Real content: every open Gebiet is a link, the stored mastery shows on Zahlen und Rechnen.
    expect(
      within(map)
        .getAllByRole('link')
        .map((l) => l.getAttribute('aria-label')),
    ).toEqual(
      BEREICHE.map((b) => `${BEREICH_NAME[b]}, Niveau ${b === 'zahlen-operationen' ? 2 : 1}`),
    );
    expect(screen.getByText('Heute: 3 von 10 Fundstücken')).toBeTruthy();
  });

  it('offers a waiting version in the legend line, only when there is one', async () => {
    const failing = () => Promise.reject(new Error('blocked'));
    renderScreen(failing);
    await screen.findAllByRole('group', { name: 'Karte' });
    expect(screen.queryByRole('button', { name: 'Neu laden' })).toBeNull();
  });

  it('links Eltern (task L), Impressum and Datenschutz in the legend line, never the device area', async () => {
    renderScreen(() => Promise.reject(new Error('blocked')));
    await screen.findAllByRole('group', { name: 'Karte' });
    const nav = screen.getByRole('navigation', { name: 'Eltern und Rechtliches' });
    expect(
      within(nav)
        .getAllByRole('link')
        .map((l) => [l.textContent, l.getAttribute('href')]),
    ).toEqual([
      ['Eltern', '/eltern'],
      ['Impressum', '/impressum'],
      ['Datenschutz', '/datenschutz'],
    ]);
    expect(document.querySelectorAll('a[href*="geraet"]')).toHaveLength(0);
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
    expect(within(map).getAllByRole('link')).toHaveLength(BEREICHE.length);
    expect(screen.getByText('Heute: 0 von 10 Fundstücken')).toBeTruthy();
    // Nothing could be stored, so the sentence before the first Fundstück would never go.
    expect(screen.queryByText(/bringt dir ein Fundstück/)).toBeNull();
  });

  it('offers the Probetest of each Fach in the manifest as a line below the map', async () => {
    renderScreen(() =>
      Promise.resolve({
        mastery: [],
        unlocked: [],
        today: { count: 0, goal: 10, reached: false },
        foundAny: false,
        offerSpent: false,
      }),
    );
    await screen.findAllByRole('group', { name: 'Karte' });
    const link = screen.getByRole('link', { name: 'Probetest Mathe' });
    expect(link.getAttribute('href')).toBe('/probetest/mathe');
    const deutsch = screen.getByRole('link', { name: 'Probetest Deutsch' });
    expect(deutsch.getAttribute('href')).toBe('/probetest/deutsch');
  });

  it('shows no Probetest line without a Probetest in the manifest', async () => {
    const without = { ...FIXTURE_MANIFEST, probetests: { mathe: [], deutsch: [] } };
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
              foundAny: false,
              offerSpent: false,
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
