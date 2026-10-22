// @vitest-environment jsdom
import '../dom';
import { cleanup, render, screen } from '@testing-library/react';
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

  it('name the person responsible with address and e-mail, no markers left', () => {
    for (const page of [IMPRESSUM, DATENSCHUTZ]) {
      const text = allText(page);
      expect(text).toContain('Markus Steireif\nMaisenbachstraße 2, 76359 Marxzell');
      expect(text).toContain('E-Mail: pfadfinder@steireif.de');
      for (const marker of ['[NAME]', '[ADRESSE]', '[E-MAIL]']) expect(text).not.toContain(marker);
    }
    expect(allText(IMPRESSUM)).toContain('Markus Steireif, Anschrift wie oben');
  });

  it('show the e-mail as a mailto link with the address as its text, on both pages', () => {
    for (const page of ['/impressum', '/datenschutz']) {
      renderAt([page]);
      const mail = screen.getByRole('link', { name: 'pfadfinder@steireif.de' });
      expect(mail.getAttribute('href')).toBe('mailto:pfadfinder@steireif.de');
      cleanup();
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

  it('end with quiet links "Für Eltern" (the way there in the installed app) and "So geht’s"', async () => {
    for (const page of ['/impressum', '/datenschutz']) {
      renderAt([page]);
      const links = screen
        .getAllByRole('link')
        .filter((l) => !l.getAttribute('href')!.startsWith('mailto:'));
      expect(links.map((l) => [l.textContent, l.getAttribute('href')])).toEqual([
        ['Für Eltern', '/eltern'],
        ['So geht’s', '/so-gehts'],
      ]);
      expect(links[0]!.className).not.toContain('bg-signal');
      await userEvent.click(links[0]!);
      expect(screen.getByRole('heading', { name: 'Eltern' })).toBeTruthy();
      cleanup();
    }
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
