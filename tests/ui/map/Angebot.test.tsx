// @vitest-environment jsdom
import '../dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import manifest from '../../../content/manifest.json';
import type { ContentManifest } from '../../../src/domain/content/manifest';
import { resetPostponedOffers } from '../../../src/ui/map/check-offer';
import { KartenScreen, type MapProgressSource } from '../../../src/ui/map/KartenScreen';
import { SUPPORTED_FORMATS } from '../../../src/ui/formats/supported';
import { masteryFor } from '../../fixtures/pool';

const NEW: MapProgressSource = {
  mastery: [],
  unlocked: [],
  today: { count: 0, goal: 10, reached: false },
};

function renderScreen(progress: MapProgressSource = NEW) {
  return render(
    <MemoryRouter>
      <KartenScreen
        manifest={manifest as ContentManifest}
        formats={SUPPORTED_FORMATS}
        loadProgress={() => Promise.resolve(progress)}
      />
    </MemoryRouter>,
  );
}

describe('Einstieg offer on the map', () => {
  beforeEach(resetPostponedOffers);

  it('makes the question the title, with Los and Später, and sets the Tagesziel aside', async () => {
    renderScreen();
    expect(await screen.findByRole('heading', { name: 'Wo geht deine Reise los?' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Los' }).getAttribute('href')).toBe('/einstieg/mathe');
    expect(screen.getByRole('button', { name: 'Später' })).toBeTruthy();
    expect(screen.queryByText(/Fundstücken/)).toBeNull();
    expect(screen.queryByRole('heading', { name: "Wohin geht's heute?" })).toBeNull();
  });

  it('rests after "Später" for this run of the app, also when the map opens again', async () => {
    const first = renderScreen();
    await userEvent.click(await screen.findByRole('button', { name: 'Später' }));
    expect(screen.getByRole('heading', { name: "Wohin geht's heute?" })).toBeTruthy();
    expect(screen.getByText('Heute: 0 von 10 Fundstücken')).toBeTruthy();
    first.unmount();

    renderScreen();
    expect(await screen.findByText('Heute: 0 von 10 Fundstücken')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Wo geht deine Reise los?' })).toBeNull();
  });

  it('is never offered once Mathe has a mastery state (after the check or after practice)', async () => {
    renderScreen({ ...NEW, mastery: [masteryFor('daten-zufall', 1)] });
    expect(await screen.findByText('Heute: 0 von 10 Fundstücken')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Wo geht deine Reise los?' })).toBeNull();
  });
});
