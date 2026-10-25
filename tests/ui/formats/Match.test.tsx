// @vitest-environment jsdom
import '../dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { presentedMatch } from '../../../src/domain/presentation';
import { emptyTileClass } from '../../../src/ui/formats/choice';
import { ClozeSelect } from '../../../src/ui/formats/ClozeSelect';
import { Match } from '../../../src/ui/formats/Match';
import { clozeSelect } from '../../fixtures/items';
import { probeMatch } from '../../fixtures/probe';

const item = probeMatch;
const pool = () => screen.getByRole('group', { name: 'Antworten' });
const row = (name: string) => screen.getByRole('button', { name });
const card = (name: string) => within(pool()).getByRole('button', { name });

function setup() {
  const onChange = vi.fn();
  render(<Match item={item} attemptIndex={0} answer={null} onChange={onChange} disabled={false} />);
  return onChange;
}

describe('Match (probe: 4 pairs, 1 distractor)', () => {
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
    await userEvent.click(row('Quadrat'));
    expect(rows.querySelectorAll('[data-sizer]')).toHaveLength(1);
  });

  it('pairs by tapping a row and then a card, or a card and then a row', async () => {
    const onChange = setup();
    await userEvent.click(row('Quadrat'));
    expect(row('Quadrat').getAttribute('aria-pressed')).toBe('true');
    await userEvent.click(card('4 gleich lange Seiten'));
    expect(within(pool()).queryByRole('button', { name: '4 gleich lange Seiten' })).toBeNull();
    expect(screen.getByRole('button', { name: /4 gleich lange Seiten, bei Quadrat/ })).toBeTruthy();
    expect(onChange).toHaveBeenLastCalledWith(null);

    await userEvent.click(card('rund, ohne Ecke'));
    await userEvent.click(row('Kreis'));
    await userEvent.click(row('Dreieck'));
    await userEvent.click(card('3 Ecken und 3 Seiten'));
    await userEvent.click(row('Rechteck'));
    await userEvent.click(card('2 lange und 2 kurze Seiten'));

    const pairs = new Map(onChange.mock.lastCall?.[0].pairs);
    expect(pairs).toEqual(new Map(item.solution.pairs));
    // The distractor stays in the pool.
    expect(
      within(pool())
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['5 Ecken und 5 Seiten']);
  });

  it('puts a card back when its filled slot is tapped', async () => {
    const onChange = setup();
    await userEvent.click(row('Quadrat'));
    await userEvent.click(card('4 gleich lange Seiten'));
    await userEvent.click(
      screen.getByRole('button', { name: /4 gleich lange Seiten, bei Quadrat/ }),
    );
    expect(card('4 gleich lange Seiten')).toBeTruthy();
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  // iPad finding (task 14): the empty field looks like the empty gap of cloze-select.
  it('an empty field looks like an empty cloze gap: "…" in a plain tile, solid line', () => {
    setup();
    const field = row('Feld für Quadrat');
    render(
      <ClozeSelect
        item={clozeSelect}
        attemptIndex={0}
        answer={null}
        onChange={() => {}}
        disabled={false}
      />,
    );
    // The first gap opens by itself; the second one waits closed.
    const gap = screen.getByRole('button', { name: /^Lücke 2/ });
    for (const el of [field, gap]) {
      expect(el.textContent).toBe('…');
      for (const c of emptyTileClass(true, false).split(' ')) expect(el.classList).toContain(c);
      expect(el.className).not.toMatch(/border-dashed|bg-paper|border-signal-edge/);
    }
  });

  it('the field itself takes the first tap too; a selected card lights every empty field', async () => {
    const onChange = setup();
    await userEvent.click(row('Feld für Kreis'));
    expect(row('Kreis').getAttribute('aria-pressed')).toBe('true');
    expect(row('Feld für Kreis').className).toContain('border-signal-edge');
    await userEvent.click(card('rund, ohne Ecke'));
    expect(screen.getByRole('button', { name: /rund, ohne Ecke, bei Kreis/ })).toBeTruthy();

    await userEvent.click(card('4 gleich lange Seiten'));
    expect(row('Feld für Quadrat').className).toContain('border-signal-edge');
    await userEvent.click(row('Feld für Quadrat'));
    expect(screen.getByRole('button', { name: /4 gleich lange Seiten, bei Quadrat/ })).toBeTruthy();
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('a second tap on the same card or row deselects; another one takes the selection', async () => {
    setup();
    await userEvent.click(card('4 gleich lange Seiten'));
    expect(card('4 gleich lange Seiten').getAttribute('aria-pressed')).toBe('true');
    await userEvent.click(card('4 gleich lange Seiten'));
    expect(card('4 gleich lange Seiten').getAttribute('aria-pressed')).toBe('false');

    await userEvent.click(row('Quadrat'));
    await userEvent.click(row('Kreis'));
    expect(row('Quadrat').getAttribute('aria-pressed')).toBe('false');
    expect(row('Kreis').getAttribute('aria-pressed')).toBe('true');
    await userEvent.click(row('Kreis'));
    expect(row('Kreis').getAttribute('aria-pressed')).toBe('false');
  });

  it('a selected card on a filled field takes its place; the other goes back to the pool', async () => {
    setup();
    await userEvent.click(row('Quadrat'));
    await userEvent.click(card('5 Ecken und 5 Seiten'));
    await userEvent.click(card('4 gleich lange Seiten'));
    await userEvent.click(
      screen.getByRole('button', { name: /5 Ecken und 5 Seiten, bei Quadrat/ }),
    );
    expect(screen.getByRole('button', { name: /4 gleich lange Seiten, bei Quadrat/ })).toBeTruthy();
    expect(card('5 Ecken und 5 Seiten')).toBeTruthy();
  });

  it('nothing moves while disabled, not even a placed card', async () => {
    const onChange = vi.fn();
    render(
      <Match
        item={item}
        attemptIndex={0}
        answer={{ pairs: [['l1', item.solution.pairs[0]![1]]] }}
        onChange={onChange}
        disabled
      />,
    );
    const placed = screen
      .getAllByRole('button')
      .find((b) => /, bei /.test(b.getAttribute('aria-label') ?? ''))!;
    expect((placed as HTMLButtonElement).disabled).toBe(true);
    await userEvent.click(placed);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('works with the keyboard: Enter on a row, then Enter on a card', async () => {
    const onChange = setup();
    row('Kreis').focus();
    await userEvent.keyboard('{Enter}');
    card('rund, ohne Ecke').focus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: /rund, ohne Ecke, bei Kreis/ })).toBeTruthy();
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
    expect(screen.getByText('Quadrat – 4 gleich lange Seiten')).toBeTruthy();
    expect(screen.getByText('Kreis – rund, ohne Ecke')).toBeTruthy();
    expect(screen.getAllByText(/\(richtige Antwort\)/)).toHaveLength(2);
    expect(screen.getAllByText(/\(deine Wahl\)/)).toHaveLength(2);
  });
});
