// @vitest-environment jsdom
import '../dom';
import { render, screen } from '@testing-library/react';
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
    ]);
  });

  it('is running text: paragraphs, no lists, no Vorlesen', () => {
    renderPage();
    expect(document.querySelectorAll('ul, ol')).toHaveLength(0);
    expect(document.querySelectorAll('main p')).toHaveLength(9);
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

  it('"Zurück" in the band leads to the map, wherever the page was opened from', async () => {
    renderPage();
    const band = document.querySelector('[data-region="band"]')!;
    expect(band.textContent).toBe('Zurück');
    await userEvent.click(screen.getByRole('link', { name: 'Zurück' }));
    expect(screen.getByRole('heading', { name: 'Karte' })).toBeTruthy();
  });
});
