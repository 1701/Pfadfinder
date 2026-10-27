// @vitest-environment jsdom
import '../dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { SoGehtsScreen } from '../../../src/ui/screens/SoGehtsScreen';

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/eltern', '/so-gehts']} initialIndex={1}>
      <Routes>
        <Route path="/" element={<h1>Karte</h1>} />
        <Route path="/eltern" element={<h1>Eltern</h1>} />
        <Route path="/so-gehts" element={<SoGehtsScreen />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('So funktioniert Pfadfinder (/so-gehts)', () => {
  it('has the title as h1 and the headings as h2, in order', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'So funktioniert Pfadfinder',
    );
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Zwei Wege',
      'Bevor es losgeht',
      'Die Sicherung',
      'Warum die Probetest-Liste kein Ergebnis zeigt',
      'Was Pfadfinder nicht ist',
      'Datenschutz',
      'Für Eltern und Lehrkräfte',
    ]);
  });

  it('is running text: paragraphs, no lists, no Vorlesen', () => {
    renderPage();
    expect(document.querySelectorAll('ul, ol')).toHaveLength(0);
    expect(document.querySelectorAll('main p')).toHaveLength(11);
    expect(screen.queryByRole('button', { name: 'Vorlesen' })).toBeNull();
  });

  it('ends with the e-mail as a mailto link', () => {
    renderPage();
    const mail = screen.getByRole('link', { name: 'pfadfinder@steireif.de' });
    expect(mail.getAttribute('href')).toBe('mailto:pfadfinder@steireif.de');
    expect(mail.closest('p')!.textContent).toBe(
      'Fragen oder Fehler gefunden? pfadfinder@steireif.de',
    );
  });

  it('leads to the page for parents and teachers with "Für Eltern" (task L)', async () => {
    renderPage();
    const link = screen.getByRole('link', { name: 'Für Eltern' });
    expect(link.getAttribute('href')).toBe('/eltern');
    expect(document.body.textContent).toContain(
      'Du findest sie unter „Sicherung und Gerät“ oben in Impressum und Datenschutz',
    );
    expect(document.body.textContent).toContain(
      'Auf dem neuen Gerät unter „Sicherung und Gerät“ auf „Sicherung einlesen“ tippen.',
    );
    await userEvent.click(link);
    expect(screen.getByRole('heading', { name: 'Eltern' })).toBeTruthy();
  });

  it('has the top line of the pages for adults; "Zurück" leads to the map, not back to /eltern', async () => {
    renderPage();
    const kopf = within(document.querySelector('[data-region="kopf"]') as HTMLElement);
    expect(kopf.getAllByRole('link').map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
      ['Zurück', '/'],
      ['Eltern', '/eltern'],
      ['Impressum', '/impressum'],
      ['Datenschutz', '/datenschutz'],
      ['Sicherung und Gerät', '/eltern/geraet'],
    ]);
    expect(document.querySelector('[data-region="band"]')).toBeNull();
    await userEvent.click(screen.getByRole('link', { name: 'Zurück' }));
    expect(screen.getByRole('heading', { name: 'Karte' })).toBeTruthy();
  });
});
