// @vitest-environment jsdom
import '../dom';
import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { StartScreen } from '../../../src/ui/screens/StartScreen';

function renderWith(bereiche: string[]) {
  const router = createMemoryRouter([
    { path: '/', Component: StartScreen, loader: () => bereiche },
  ]);
  render(<RouterProvider router={router} />);
}

describe('StartScreen', () => {
  it('lists the practiceable Bereiche by Fach with child-friendly names', async () => {
    renderWith(['zahlen-operationen', 'rs-strategien']);
    const link = await screen.findByRole('link', { name: 'Zahlen und Rechnen' });
    expect(link.getAttribute('href')).toBe('/ueben/mathe/zahlen-operationen');
    expect(screen.getByRole('link', { name: 'Rechtschreib-Tricks' }).getAttribute('href')).toBe(
      '/ueben/deutsch/rs-strategien',
    );
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Mathe',
      'Deutsch',
    ]);
  });

  it('hides a Fach without Bereiche', async () => {
    renderWith(['zahlen-operationen']);
    await screen.findByRole('link', { name: 'Zahlen und Rechnen' });
    expect(screen.queryByRole('heading', { name: 'Deutsch' })).toBeNull();
  });
});
