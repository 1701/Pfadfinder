// @vitest-environment jsdom
import '../dom';
import { cleanup, render, screen, within } from '@testing-library/react';
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
        <Route path="/eltern/geraet" element={<h1>Gerät</h1>} />
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

  it('have the top line of the pages for adults (task N): the other four pages, no footer', async () => {
    for (const page of ['/impressum', '/datenschutz']) {
      for (const [name, heading] of [
        ['Eltern', 'Eltern'],
        ['Sicherung und Gerät', 'Gerät'],
      ] as const) {
        renderAt([page]);
        const kopf = within(document.querySelector('[data-region="kopf"]') as HTMLElement);
        const links = kopf.getAllByRole('link');
        expect(links.map((l) => [l.textContent, l.getAttribute('href')])).toEqual(
          [
            ['Zurück', '/'],
            ['Eltern', '/eltern'],
            ['So geht’s', '/so-gehts'],
            ['Impressum', '/impressum'],
            ['Datenschutz', '/datenschutz'],
            ['Sicherung und Gerät', '/eltern/geraet'],
          ].filter(([, to]) => to !== page),
        );
        for (const link of links) expect(link.className).not.toContain('bg-signal');
        expect(document.querySelector('footer')).toBeNull();
        await userEvent.click(kopf.getByRole('link', { name }));
        expect(screen.getByRole('heading', { name: heading })).toBeTruthy();
        cleanup();
      }
    }
  });

  it('"Zurück" is a link to the map, also when the page was opened from /eltern', async () => {
    renderAt(['/eltern', '/datenschutz']);
    await userEvent.click(screen.getByRole('link', { name: 'Zurück' }));
    expect(screen.getByRole('heading', { name: 'Karte' })).toBeTruthy();
  });

  it('"Zurück" leads to the map when the page was opened directly', async () => {
    renderAt(['/impressum']);
    await userEvent.click(screen.getByRole('link', { name: 'Zurück' }));
    expect(screen.getByRole('heading', { name: 'Karte' })).toBeTruthy();
  });
});
