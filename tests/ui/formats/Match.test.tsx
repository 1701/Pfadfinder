// @vitest-environment jsdom
import '../dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { presentedMatch } from '../../../src/domain/presentation';
import { Match } from '../../../src/ui/formats/Match';
import { contentItem } from '../../fixtures/content-items';

const item = contentItem('m-rf-1-004', 'match');
const pool = () => screen.getByRole('group', { name: 'Antworten' });
const row = (name: string) => screen.getByRole('button', { name });
const card = (name: string) => within(pool()).getByRole('button', { name });

function setup() {
  const onChange = vi.fn();
  render(<Match item={item} attemptIndex={0} answer={null} onChange={onChange} disabled={false} />);
  return onChange;
}

describe('Match (m-rf-1-004)', () => {
  it('shows rows and cards in the presented order', () => {
    setup();
    const { right } = presentedMatch(item, 0);
    expect(
      within(pool())
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(right.map((r) => r.text));
  });

  it('sizes the slot column by every card, invisibly, inside the first slot only', async () => {
    setup();
    const rows = document.querySelector('[data-match-rows]')!;
    const sizers = rows.querySelectorAll('[data-sizer]');
    expect(sizers).toHaveLength(1);
    const sizer = sizers[0]!;
    expect(sizer.getAttribute('aria-hidden')).toBe('true');
    expect(sizer.className).toContain('invisible');
    // Every card (distractor included), not only those still in the pool.
    expect([...sizer.children].map((c) => c.textContent)).toEqual(
      presentedMatch(item, 0).right.map((r) => r.text),
    );
    // Not a grid cell of its own: it sits in the first row's slot.
    expect(sizer.parentElement?.parentElement?.parentElement).toBe(rows);
    await userEvent.click(row('Würfel'));
    expect(rows.querySelectorAll('[data-sizer]')).toHaveLength(1);
  });

  it('pairs by tapping a row and then a card, or a card and then a row', async () => {
    const onChange = setup();
    await userEvent.click(row('Würfel'));
    expect(row('Würfel').getAttribute('aria-pressed')).toBe('true');
    await userEvent.click(card('6 gleich große Quadrate'));
    expect(within(pool()).queryByRole('button', { name: '6 gleich große Quadrate' })).toBeNull();
    expect(
      screen.getByRole('button', { name: /6 gleich große Quadrate, bei Würfel/ }),
    ).toBeTruthy();
    expect(onChange).toHaveBeenLastCalledWith(null);

    await userEvent.click(card('rund, rollt in alle Richtungen'));
    await userEvent.click(row('Kugel'));
    await userEvent.click(row('Zylinder'));
    await userEvent.click(card('2 Kreisflächen, rollt zur Seite'));
    await userEvent.click(row('Kegel'));
    await userEvent.click(card('1 Kreisfläche und eine Spitze'));

    const pairs = new Map(onChange.mock.lastCall?.[0].pairs);
    expect(pairs).toEqual(new Map(item.solution.pairs));
    // The distractor stays in the pool.
    expect(
      within(pool())
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['4 Dreiecke und 1 Quadrat']);
  });

  it('puts a card back when its filled slot is tapped', async () => {
    const onChange = setup();
    await userEvent.click(row('Würfel'));
    await userEvent.click(card('6 gleich große Quadrate'));
    await userEvent.click(
      screen.getByRole('button', { name: /6 gleich große Quadrate, bei Würfel/ }),
    );
    expect(card('6 gleich große Quadrate')).toBeTruthy();
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('works with the keyboard: Enter on a row, then Enter on a card', async () => {
    const onChange = setup();
    row('Kugel').focus();
    await userEvent.keyboard('{Enter}');
    card('rund, rollt in alle Richtungen').focus();
    await userEvent.keyboard('{Enter}');
    expect(
      screen.getByRole('button', { name: /rund, rollt in alle Richtungen, bei Kugel/ }),
    ).toBeTruthy();
    expect(onChange).toHaveBeenCalled();
  });

  it('after checking: no pool, check marks, and the right cards listed where the pool was', () => {
    const swapped = item.solution.pairs.map(
      ([l], i, all) => [l, all[i === 0 ? 1 : i === 1 ? 0 : i]![1]] as [string, string],
    );
    render(
      <Match
        item={item}
        attemptIndex={0}
        answer={{ pairs: swapped }}
        onChange={() => {}}
        disabled
        revealed={{ correct: false, solution: item.solution }}
      />,
    );
    expect(screen.queryByRole('group', { name: 'Antworten' })).toBeNull();
    expect(screen.queryAllByRole('button')).toEqual([]);
    expect(screen.getAllByText(/^Richtig ist:/)).toHaveLength(1);
    expect(screen.getByText('Würfel: 6 gleich große Quadrate')).toBeTruthy();
    expect(screen.getByText('Kugel: rund, rollt in alle Richtungen')).toBeTruthy();
    expect(screen.getAllByText(/\(richtige Antwort\)/)).toHaveLength(2);
    expect(screen.getAllByText(/\(deine Wahl\)/)).toHaveLength(2);
  });
});
