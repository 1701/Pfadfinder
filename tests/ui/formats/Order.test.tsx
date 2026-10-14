// @vitest-environment jsdom
import '../dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { presentedOrder } from '../../../src/domain/presentation';
import { Order } from '../../../src/ui/formats/Order';
import { contentItem } from '../../fixtures/content-items';

const item = contentItem('m-rf-2-008', 'order');
const text = new Map(item.payload.items.map((e) => [e.id, e.text]));
const shown = () =>
  screen.getAllByRole('listitem').map((li) => li.textContent?.replace(/\s+/g, ' ').trim());

describe('Order (m-rf-2-008)', () => {
  it('starts in the presented order, never solved, and reports nothing before a move', () => {
    const onChange = vi.fn();
    render(
      <Order item={item} attemptIndex={0} answer={null} onChange={onChange} disabled={false} />,
    );
    const start = presentedOrder(item, 0).map((e) => e.text);
    expect(shown()).toEqual(start);
    expect(start).not.toEqual(item.solution.orderedIds.map((id) => text.get(id)));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('moves with the arrow buttons, reports the order and keeps the focus on the moved card', async () => {
    const onChange = vi.fn();
    render(
      <Order item={item} attemptIndex={0} answer={null} onChange={onChange} disabled={false} />,
    );
    const [first, second] = presentedOrder(item, 0);
    expect(
      (screen.getByRole('button', { name: `${first!.text} nach oben` }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);

    await userEvent.click(screen.getByRole('button', { name: `${first!.text} nach unten` }));
    expect(shown().slice(0, 2)).toEqual([second!.text, first!.text]);
    expect(onChange.mock.lastCall?.[0].orderedIds.slice(0, 2)).toEqual([second!.id, first!.id]);
    expect(screen.getByText(`${first!.text} ist jetzt an Stelle 2.`)).toBeTruthy();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(document.activeElement?.getAttribute('aria-label')).toBe(`${first!.text} nach unten`);
  });

  it('after checking: no handles or arrows, check marks, and the right order as a line', () => {
    const wrong = [...item.solution.orderedIds].reverse();
    render(
      <Order
        item={item}
        attemptIndex={0}
        answer={{ orderedIds: wrong }}
        onChange={() => {}}
        disabled
        revealed={{ correct: false, solution: item.solution }}
      />,
    );
    expect(screen.queryAllByRole('button')).toEqual([]);
    expect(screen.getByText(/^Richtig ist:/).textContent?.replace(/\s+/g, ' ')).toBe(
      `Richtig ist: ${item.solution.orderedIds.map((id) => text.get(id)).join(', ')}`,
    );
  });
});
