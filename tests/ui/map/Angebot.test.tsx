// @vitest-environment jsdom
import '../dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadMapProgress, postponeOffer } from '../../../src/data/map-progress';
import { createMemoryRepositories } from '../../../src/data/memory/repos';
import type { Repositories } from '../../../src/data/repos';
import { BEREICHE, type Bereich } from '../../../src/domain/content/taxonomy';
import type { RegionState } from '../../../src/domain/progress';
import { KartenScreen, type MapProgressSource } from '../../../src/ui/map/KartenScreen';
import { KartenView } from '../../../src/ui/map/KartenView';
import { FUNDSTUECK_HINWEIS } from '../../../src/ui/map/Tagesziel';
import { SUPPORTED_FORMATS } from '../../../src/ui/formats/supported';
import { BEREICH_NAME } from '../../../src/ui/text/bereiche';
import { FIXTURE_MANIFEST } from '../../fixtures/content';
import { masteryFor } from '../../fixtures/pool';

/** The names of all Gebiete in taxonomy order: the fixture content opens every one. */
const GEBIETE = BEREICHE.map((b) => BEREICH_NAME[b]).join(', ');

const NEW: MapProgressSource = {
  mastery: [],
  unlocked: [],
  today: { count: 0, goal: 10, reached: false },
  foundAny: false,
  offerSpent: false,
};

function renderScreen(progress: MapProgressSource = NEW) {
  return render(
    <MemoryRouter>
      <KartenScreen
        manifest={FIXTURE_MANIFEST}
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
        manifest={FIXTURE_MANIFEST}
        formats={SUPPORTED_FORMATS}
        loadProgress={() => loadMapProgress(repos, now())}
        postponeOffer={(fach) => postponeOffer(repos, fach, now())}
      />
    </MemoryRouter>,
  );
}

describe('Einstieg offer on the map', () => {
  it('makes the Fach the title, with Erkunden and Später, and sets the Tagesziel aside', async () => {
    renderScreen();
    expect(await screen.findByRole('heading', { name: 'Unerforscht: Mathe' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Erkunden' }).getAttribute('href')).toBe(
      '/einstieg/mathe',
    );
    expect(screen.getByRole('button', { name: 'Später' })).toBeTruthy();
    expect(screen.queryByText(/Fundstücken/)).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Wohin geht’s heute?' })).toBeNull();
  });

  it('rests after "Später" until the end of the day, also when the map opens again', async () => {
    const repos = createMemoryRepositories();
    // 18:00 in Berlin (UTC+2).
    let now = '2026-10-14T16:00:00.000Z';
    const first = renderStored(repos, () => now);
    await userEvent.click(await screen.findByRole('button', { name: 'Später' }));
    expect(screen.getByRole('heading', { name: 'Wohin geht’s heute?' })).toBeTruthy();
    expect(screen.getByText('Heute: 0 von 10 Fundstücken')).toBeTruthy();
    first.unmount();

    // The map opens again late the same day (also what a reload reads): still resting.
    now = '2026-10-14T21:59:00.000Z';
    const second = renderStored(repos, () => now);
    expect(await screen.findByText('Heute: 0 von 10 Fundstücken')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: /^Unerforscht: / })).toBeNull();
    second.unmount();

    // The next morning it is back.
    now = '2026-10-15T06:00:00.000Z';
    renderStored(repos, () => now);
    expect(await screen.findByRole('heading', { name: 'Unerforscht: Mathe' })).toBeTruthy();
  });

  it('"Später" rests the day for every Fach: Deutsch only comes the next morning', async () => {
    const repos = createMemoryRepositories();
    // 08:00 in Berlin (UTC+2): "Später" for Mathe.
    let now = '2026-10-14T06:00:00.000Z';
    const first = renderStored(repos, () => now);
    await userEvent.click(await screen.findByRole('button', { name: 'Später' }));
    first.unmount();

    // Later that day Mathe has a mastery state (practice): Deutsch would be next, but not today.
    await repos.learners.put({
      id: 'learner-1',
      createdAt: now,
      settings: { readAloud: true, bundesland: 'BW' },
    });
    await repos.mastery.put(masteryFor('daten-zufall', 1));
    now = '2026-10-14T16:00:00.000Z';
    const second = renderStored(repos, () => now);
    expect(await screen.findByText('Heute: 0 von 10 Fundstücken')).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Erkunden' })).toBeNull();
    second.unmount();

    now = '2026-10-15T06:00:00.000Z';
    renderStored(repos, () => now);
    expect(await screen.findByRole('heading', { name: 'Unerforscht: Deutsch' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Erkunden' }).getAttribute('href')).toBe(
      '/einstieg/deutsch',
    );
  });

  it('never replaces the Tagesziel line: no offer once today has a Fundstück', async () => {
    const first = renderScreen({
      ...NEW,
      today: { count: 3, goal: 10, reached: false },
      foundAny: true,
    });
    expect(await screen.findByText('Heute: 3 von 10 Fundstücken')).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Erkunden' })).toBeNull();
    first.unmount();

    renderScreen({ ...NEW, today: { count: 10, goal: 10, reached: true }, foundAny: true });
    expect(await screen.findByText(/10 von 10/)).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Erkunden' })).toBeNull();
  });

  it('offers nothing on a day whose offer is spent (a finished Einstieg)', async () => {
    renderScreen({ ...NEW, mastery: [masteryFor('daten-zufall', 1)], offerSpent: true });
    expect(await screen.findByText('Heute: 0 von 10 Fundstücken')).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Erkunden' })).toBeNull();
  });

  it('hides the offer at once even when "Später" cannot be stored', async () => {
    render(
      <MemoryRouter>
        <KartenScreen
          manifest={FIXTURE_MANIFEST}
          formats={SUPPORTED_FORMATS}
          loadProgress={() => Promise.resolve(NEW)}
          postponeOffer={() => Promise.reject(new Error('blocked'))}
        />
      </MemoryRouter>,
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Später' }));
    expect(screen.getByRole('heading', { name: 'Wohin geht’s heute?' })).toBeTruthy();
  });

  it('moves on to Deutsch once Mathe has a mastery state (after the check or after practice)', async () => {
    renderScreen({ ...NEW, mastery: [masteryFor('daten-zufall', 1)] });
    expect(await screen.findByRole('heading', { name: 'Unerforscht: Deutsch' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Erkunden' }).getAttribute('href')).toBe(
      '/einstieg/deutsch',
    );
  });

  it('is never offered once both Fächer have a mastery state', async () => {
    renderScreen({
      ...NEW,
      mastery: [masteryFor('daten-zufall', 1), masteryFor('rs-strategien', 1, 'deutsch')],
    });
    expect(await screen.findByText('Heute: 0 von 10 Fundstücken')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: /^Unerforscht: / })).toBeNull();
  });

  describe('before the very first Fundstück (task 17)', () => {
    const answer = (repos: Repositories, id: string, mode: 'check' | 'practice', at: string) =>
      repos.attempts.put({
        id,
        learnerId: 'learner-1',
        itemId: 'm-zo-1-903',
        fach: 'mathe',
        bereich: 'zahlen-operationen',
        niveau: 1,
        format: 'number-input',
        correct: false,
        answer: { value: 1 },
        durationMs: 1000,
        mode,
        at,
      });
    const dashes = () => document.querySelector('header ol');

    it('says what Fundstücke are for once the Tagesziel shows, until the first one', async () => {
      const repos = createMemoryRepositories();
      // 10:00 in Berlin (UTC+2). The offer comes first: no Tagesziel, so no sentence.
      let now = '2026-10-14T08:00:00.000Z';
      const first = renderStored(repos, () => now);
      await userEvent.click(await screen.findByRole('button', { name: 'Später' }));
      expect(screen.getByText(FUNDSTUECK_HINWEIS)).toBeTruthy();
      expect(dashes()).toBeNull();
      first.unmount();

      // An Einstieg the next day: its answers are no Fundstücke, the sentence stays.
      await repos.learners.put({
        id: 'learner-1',
        createdAt: now,
        settings: { readAloud: true, bundesland: 'BW' },
      });
      await repos.mastery.put(masteryFor('daten-zufall', 1));
      await repos.mastery.put(masteryFor('rs-strategien', 1, 'deutsch'));
      now = '2026-10-15T08:00:00.000Z';
      await answer(repos, 'c1', 'check', now);
      const second = renderStored(repos, () => now);
      expect(await screen.findByText(FUNDSTUECK_HINWEIS)).toBeTruthy();
      second.unmount();

      // One practice answer, right or not: gone, also when the map is read again the next day.
      await answer(repos, 'p1', 'practice', '2026-10-15T08:05:00.000Z');
      const third = renderStored(repos, () => now);
      expect(await screen.findByText('Heute: 1 von 10 Fundstücken')).toBeTruthy();
      expect(screen.queryByText(FUNDSTUECK_HINWEIS)).toBeNull();
      expect(dashes()).not.toBeNull();
      third.unmount();
      now = '2026-10-16T08:00:00.000Z';
      renderStored(repos, () => now);
      expect(await screen.findByText('Heute: 0 von 10 Fundstücken')).toBeTruthy();
      expect(screen.queryByText(FUNDSTUECK_HINWEIS)).toBeNull();
    });

    it('stays away while the offer is the title', async () => {
      renderScreen();
      await screen.findByRole('heading', { name: 'Unerforscht: Mathe' });
      expect(screen.queryByText(FUNDSTUECK_HINWEIS)).toBeNull();
    });
  });

  describe('Vorlesen', () => {
    afterEach(() => vi.unstubAllGlobals());

    function installSpeech() {
      const synth = { speak: vi.fn(), cancel: vi.fn(), getVoices: () => [] };
      vi.stubGlobal('speechSynthesis', synth);
      vi.stubGlobal(
        'SpeechSynthesisUtterance',
        class {
          lang = '';
          rate = 1;
          constructor(public text: string) {}
        },
      );
      return synth;
    }

    async function spoken(synth: ReturnType<typeof installSpeech>) {
      await userEvent.click(await screen.findByRole('button', { name: 'Vorlesen' }));
      return (synth.speak.mock.calls[0]![0] as { text: string }).text;
    }

    it('reads the title and Erkunden, then the Gebiete a new learner can choose', async () => {
      const synth = installSpeech();
      renderScreen();
      await screen.findByRole('heading', { name: 'Unerforscht: Mathe' });
      // Every Gebiet of the fixture content is open, in taxonomy order.
      expect(await spoken(synth)).toBe(
        `Unerforscht: Mathe. Tippe auf Erkunden, oder wähle gleich ein Gebiet: ${GEBIETE}.`,
      );
    });

    it('reads the sentence after the Tagesziel before the very first Fundstück', async () => {
      const synth = installSpeech();
      renderScreen({ ...NEW, offerSpent: true });
      await screen.findByText(FUNDSTUECK_HINWEIS);
      expect(await spoken(synth)).toBe(
        `Wohin geht’s heute? Heute: 0 von 10 Fundstücken. ${FUNDSTUECK_HINWEIS} Du kannst wählen: ${GEBIETE}.`,
      );
    });

    it('reads the Tagesziel as a sentence of its own once there was a Fundstück', async () => {
      const synth = installSpeech();
      renderScreen({ ...NEW, offerSpent: true, foundAny: true });
      await screen.findByText('Heute: 0 von 10 Fundstücken');
      expect(await spoken(synth)).toMatch(
        /^Wohin geht’s heute\? Heute: 0 von 10 Fundstücken\. Du kannst wählen: /,
      );
    });

    it('leaves out the Gebiete when none is open', async () => {
      const synth = installSpeech();
      const states = Object.fromEntries(
        BEREICHE.map((b) => [b, { kind: 'unerforscht' }]),
      ) as Record<Bereich, RegionState>;
      render(
        <MemoryRouter>
          <KartenView
            progress={{ states, today: NEW.today }}
            offer={{ fach: 'deutsch', onLater: () => {} }}
          />
        </MemoryRouter>,
      );
      expect(await spoken(synth)).toBe('Unerforscht: Deutsch. Tippe auf Erkunden.');
    });
  });
});
