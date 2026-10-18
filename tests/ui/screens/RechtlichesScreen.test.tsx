// @vitest-environment jsdom
import '../dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { RechtlichesScreen } from '../../../src/ui/screens/RechtlichesScreen';
import { DATENSCHUTZ, IMPRESSUM } from '../../../src/ui/text/rechtliches';

const allText = (page: typeof IMPRESSUM) =>
  page.sections.flatMap((s) => [s.heading, ...s.paragraphs]).join('\n');

function renderAt(entries: string[]) {
  render(
    <MemoryRouter initialEntries={entries} initialIndex={entries.length - 1}>
      <Routes>
        <Route path="/" element={<h1>Karte</h1>} />
        <Route path="/eltern" element={<h1>Eltern</h1>} />
        <Route path="/impressum" element={<RechtlichesScreen page="impressum" />} />
        <Route path="/datenschutz" element={<RechtlichesScreen page="datenschutz" />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Impressum and Datenschutz', () => {
  it('show the page with its sections, without Vorlesen', () => {
    renderAt(['/impressum']);
    expect(screen.getByRole('heading', { level: 1, name: 'Impressum' })).toBeTruthy();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Angaben nach §\u00a05\u00a0DDG' }),
    ).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Vorlesen' })).toBeNull();
  });

  it('carry the markers for name, address and e-mail until they are filled in', () => {
    for (const page of [IMPRESSUM, DATENSCHUTZ]) {
      for (const marker of ['[NAME]', '[ADRESSE]', '[E-MAIL]']) {
        expect(allText(page)).toContain(marker);
      }
    }
  });

  it('say what really happens: nothing leaves the device, Cloudflare hosts and logs access', () => {
    const text = allText(DATENSCHUTZ);
    expect(text).toContain('bleibt auf diesem Gerät');
    expect(text).toMatch(/kein Tracking/);
    expect(text).toMatch(/keine Cookies/);
    expect(text).toContain('Cloudflare');
    expect(text).toContain('Zugriffsprotokollen');
  });

  it('"Zurück" goes back to the Eltern page it came from', async () => {
    renderAt(['/eltern', '/datenschutz']);
    await userEvent.click(screen.getByRole('button', { name: 'Zurück' }));
    expect(screen.getByRole('heading', { name: 'Eltern' })).toBeTruthy();
  });

  it('"Zurück" leads to the map when the page was opened directly', async () => {
    renderAt(['/impressum']);
    await userEvent.click(screen.getByRole('button', { name: 'Zurück' }));
    expect(screen.getByRole('heading', { name: 'Karte' })).toBeTruthy();
  });
});
