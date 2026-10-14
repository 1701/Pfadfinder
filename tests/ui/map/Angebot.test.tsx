// @vitest-environment jsdom
import '../dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import manifest from '../../../content/manifest.json';
import type { ContentManifest } from '../../../src/domain/content/manifest';
import { loadMapProgress, postponeOffer } from '../../../src/data/map-progress';
import { createMemoryRepositories } from '../../../src/data/memory/repos';
import type { Repositories } from '../../../src/data/repos';
import { KartenScreen, type MapProgressSource } from '../../../src/ui/map/KartenScreen';
import { SUPPORTED_FORMATS } from '../../../src/ui/formats/supported';
import { masteryFor } from '../../fixtures/pool';

const NEW: MapProgressSource = {
  mastery: [],
  unlocked: [],
  today: { count: 0, goal: 10, reached: false },
  postponed: [],
};

function renderScreen(progress: MapProgressSource = NEW) {
  return render(
    <MemoryRouter>
      <KartenScreen
        manifest={manifest as ContentManifest}
        formats={SUPPORTED_FORMATS}
        loadProgress={() => Promise.resolve(progress)}
        postponeOffer={() => Promise.resolve()}
      />
    </MemoryRouter>,
  );
}

/** The map on stored data, as the app runs it, with a clock the test sets. */
function renderStored(repos: Repositories, now: () => string) {
  return render(
    <MemoryRouter>
      <KartenScreen
        manifest={manifest as ContentManifest}
        formats={SUPPORTED_FORMATS}
        loadProgress={() => loadMapProgress(repos, now())}
        postponeOffer={(fach) => postponeOffer(repos, fach, now())}
      />
    </MemoryRouter>,
  );
}

describe('Einstieg offer on the map', () => {
  it('makes the question the title, with Los and Später, and sets the Tagesziel aside', async () => {
    renderScreen();
    expect(await screen.findByRole('heading', { name: 'Wo geht deine Reise los?' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Los' }).getAttribute('href')).toBe('/einstieg/mathe');
    expect(screen.getByRole('button', { name: 'Später' })).toBeTruthy();
    expect(screen.queryByText(/Fundstücken/)).toBeNull();
    expect(screen.queryByRole('heading', { name: "Wohin geht's heute?" })).toBeNull();
  });

  it('rests after "Später" until the end of the day, also when the map opens again', async () => {
    const repos = createMemoryRepositories();
    // 18:00 in Berlin (UTC+2).
    let now = '2026-10-14T16:00:00.000Z';
    const first = renderStored(repos, () => now);
    await userEvent.click(await screen.findByRole('button', { name: 'Später' }));
    expect(screen.getByRole('heading', { name: "Wohin geht's heute?" })).toBeTruthy();
    expect(screen.getByText('Heute: 0 von 10 Fundstücken')).toBeTruthy();
    first.unmount();

    // The map opens again late the same day (also what a reload reads): still resting.
    now = '2026-10-14T21:59:00.000Z';
    const second = renderStored(repos, () => now);
    expect(await screen.findByText('Heute: 0 von 10 Fundstücken')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Wo geht deine Reise los?' })).toBeNull();
    second.unmount();

    // The next morning it is back.
    now = '2026-10-15T06:00:00.000Z';
    renderStored(repos, () => now);
    expect(await screen.findByRole('heading', { name: 'Wo geht deine Reise los?' })).toBeTruthy();
  });

  it('hides the offer at once even when "Später" cannot be stored', async () => {
    render(
      <MemoryRouter>
        <KartenScreen
          manifest={manifest as ContentManifest}
          formats={SUPPORTED_FORMATS}
          loadProgress={() => Promise.resolve(NEW)}
          postponeOffer={() => Promise.reject(new Error('blocked'))}
        />
      </MemoryRouter>,
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Später' }));
    expect(screen.getByRole('heading', { name: "Wohin geht's heute?" })).toBeTruthy();
  });

  it('is never offered once Mathe has a mastery state (after the check or after practice)', async () => {
    renderScreen({ ...NEW, mastery: [masteryFor('daten-zufall', 1)] });
    expect(await screen.findByText('Heute: 0 von 10 Fundstücken')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Wo geht deine Reise los?' })).toBeNull();
  });
});
