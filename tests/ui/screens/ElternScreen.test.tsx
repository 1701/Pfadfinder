// @vitest-environment jsdom
import '../dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { BEREICHE_BY_FACH, FAECHER } from '../../../src/domain/content';
import { ElternScreen } from '../../../src/ui/screens/ElternScreen';
import { BEREICH_NAME, FACH_NAME } from '../../../src/ui/text/bereiche';
import { EMAIL } from '../../../src/ui/text/kontakt';
import { FIXTURE_MANIFEST } from '../../fixtures/content';
import { FIXTURE_TYPEN } from '../../fixtures/typen';

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/eltern']}>
      <Routes>
        <Route path="/" element={<h1>Karte</h1>} />
        <Route
          path="/eltern"
          element={<ElternScreen manifest={FIXTURE_MANIFEST} typen={FIXTURE_TYPEN} />}
        />
        <Route path="/eltern/geraet" element={<h1>Gerät</h1>} />
        <Route path="/so-gehts" element={<h1>So geht’s</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

/** A mailto href taken apart: address, subject and body as the mail program shows them. */
function mail(name: string) {
  const href = screen.getByRole('link', { name }).getAttribute('href')!;
  const [, to, query] = /^mailto:([^?]+)\?(.*)$/.exec(href)!;
  // Encoded once: line breaks as %0A, umlauts and spaces percent-encoded, no "+".
  expect(query).not.toMatch(/[\n äöüß+]/);
  const params = Object.fromEntries(
    query!.split('&').map((pair) => {
      const [key, value] = pair.split('=');
      return [key, decodeURIComponent(value!)];
    }),
  );
  return { to, ...params };
}

describe('Für Eltern und Lehrkräfte (/eltern)', () => {
  it('has the title as h1 and the sections as h2, in order', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Für Eltern und Lehrkräfte');
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Was geübt wird',
      'So nutzen Sie es',
      'Woher die Aufgaben kommen',
      'Aufgabe vorschlagen oder Fehler melden',
      'Das Projekt ist offen',
    ]);
  });

  it('lists every Gebiet with its number of items and its types, then the Probetests', () => {
    renderPage();
    // The Fächer of the overview, then "Vorlesen auf dem iPad" in "So nutzen Sie es".
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      ...FAECHER.map((fach) => FACH_NAME[fach]),
      'Vorlesen auf dem iPad',
    ]);
    for (const fach of FAECHER) {
      for (const bereich of BEREICHE_BY_FACH[fach]) {
        const n = FIXTURE_MANIFEST.bereiche[bereich].items;
        const line = screen.getByText(
          `${BEREICH_NAME[bereich]} · ${n} Aufgabe${n === 1 ? '' : 'n'}`,
        );
        const types = FIXTURE_TYPEN[bereich].join(', ');
        expect(line.closest('p')!.textContent).toContain(types);
      }
    }
    const counts = FAECHER.map((fach) => {
      const n = FIXTURE_MANIFEST.probetests[fach].length;
      return `${n} Probetest${n === 1 ? '' : 's'} ${FACH_NAME[fach]}`;
    });
    expect(screen.getByText(`${counts.join(', ')}.`)).toBeTruthy();
  });

  it('says after the literary Gebiet that the tests have no such text', () => {
    renderPage();
    const line = screen.getByText(new RegExp(`^${BEREICH_NAME['lesen-literarisch']} · `));
    expect(line.closest('p')!.textContent).toMatch(
      /\(nur zum Üben – in den Tests 2024 und 2025 kam kein literarischer Text vor\)$/,
    );
    const other = screen.getByText(new RegExp(`^${BEREICH_NAME['lesen-sachtext']} · `));
    expect(other.closest('p')!.textContent).not.toContain('nur zum Üben');
  });

  it('opens a mail with a template to suggest a task', () => {
    renderPage();
    expect(mail('Aufgabe vorschlagen')).toEqual({
      to: EMAIL,
      subject: 'Aufgabe für Pfadfinder',
      body: `Fach (Mathe oder Deutsch):
Gebiet:
Was das Kind können soll:
Aufgabentext:
Richtige Antwort:
Zwei bis drei falsche Antworten (und warum ein Kind sie wählen könnte):
Ein Satz Rückmeldung, wenn es nicht klappt:
Optional: Klasse, Schule, Name für die Nennung:

Mit dem Senden bin ich einverstanden, dass die Aufgabe geprüft, angepasst und unter CC BY-SA 4.0 veröffentlicht wird.`,
    });
  });

  it('opens a mail with a template to report a mistake', () => {
    renderPage();
    expect(mail('Fehler melden')).toEqual({
      to: EMAIL,
      subject: 'Fehler in Pfadfinder',
      body: 'Fach:\nGebiet:\nWortlaut der Aufgabe:\nWas nicht stimmt:',
    });
  });

  it('names the contact address as a mailto link and the Gebiet of the example as on the map', () => {
    renderPage();
    expect(screen.getByRole('link', { name: EMAIL }).getAttribute('href')).toBe(`mailto:${EMAIL}`);
    const example = document.querySelector('dl')!;
    expect(
      within(example as HTMLElement).getByText(BEREICH_NAME['muster-strukturen']),
    ).toBeTruthy();
  });

  it('opens GitHub in a new tab, every other link stays in the app', () => {
    renderPage();
    const github = screen.getByRole('link', { name: 'github.com/1701/Pfadfinder' });
    expect(github.getAttribute('href')).toBe('https://github.com/1701/Pfadfinder');
    expect(github.getAttribute('target')).toBe('_blank');
    expect(github.getAttribute('rel')).toBe('noopener');
    const others = screen
      .getAllByRole('link')
      .filter((a) => a !== github && !a.getAttribute('href')!.startsWith('mailto:'));
    for (const a of others) {
      expect(a.getAttribute('href')).toMatch(/^\//);
      expect(a.getAttribute('target')).toBeNull();
    }
  });

  it('has the top line of the pages for adults, no footer and no band (task N)', () => {
    renderPage();
    const kopf = within(document.querySelector('[data-region="kopf"]') as HTMLElement);
    expect(kopf.getAllByRole('link').map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
      ['Zurück', '/'],
      ['So geht’s', '/so-gehts'],
      ['Impressum', '/impressum'],
      ['Datenschutz', '/datenschutz'],
      ['Sicherung und Gerät', '/eltern/geraet'],
    ]);
    expect(document.querySelector('footer')).toBeNull();
    expect(document.querySelector('[data-region="band"]')).toBeNull();
  });

  it('says how Vorlesen sounds better on the iPad, in "So nutzen Sie es" (from /eltern/geraet)', () => {
    renderPage();
    const heading = screen.getByRole('heading', { level: 3, name: 'Vorlesen auf dem iPad' });
    expect(heading.closest('section')!.parentElement!.querySelector('h2')!.textContent).toBe(
      'So nutzen Sie es',
    );
    expect(heading.nextElementSibling!.textContent).toBe(
      'Auf dem iPad klingt das Vorlesen besser, wenn Sie in Einstellungen → Bedienungshilfen → Gesprochene Inhalte eine Premium-Stimme für Deutsch laden. Die App wählt keine Stimme selbst, nur die Sprache.',
    );
  });

  it('recommends the iPad, not a phone, and announces no review by a teacher (task N)', () => {
    renderPage();
    const text = document.body.textContent!;
    expect(text).toContain(
      'Die App ist unter kompassheld.de erreichbar und läuft nach dem ersten Laden auch ohne Internet. Pfadfinder ist für das iPad gemacht und wird nur dort geprüft; am Laptop im Browser geht es auch. Auf dem Handy ist der Bildschirm zu klein, das empfehlen wir nicht.',
    );
    expect(text).toContain('Geprüft hat sie weder das Land noch eine Lehrkraft.');
    expect(text).toContain('nicht amtlich geprüft');
    for (const gone of ['Tablet, Laptop und Handy', 'Durchsicht', 'Lehrerin', 'bisher'])
      expect(text).not.toContain(gone);
  });

  it('leads to the device area and to /so-gehts from the text', async () => {
    renderPage();
    const [geraet] = screen.getAllByRole('link', { name: 'Sicherung und Gerät' });
    await userEvent.click(geraet!);
    expect(screen.getByRole('heading', { name: 'Gerät' })).toBeTruthy();
  });

  it('has no Vorlesen and "Zurück" in the top line leads to the map', async () => {
    renderPage();
    expect(screen.queryByRole('button', { name: 'Vorlesen' })).toBeNull();
    await userEvent.click(screen.getByRole('link', { name: 'Zurück' }));
    expect(screen.getByRole('heading', { name: 'Karte' })).toBeTruthy();
  });
});
