// @vitest-environment jsdom
import '../dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { presentedOrder } from '../../../src/domain/presentation';
import { ORDER_HIGHLIGHT_MS, Order } from '../../../src/ui/formats/Order';
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

  // iPad finding (task 14): after an arrow tap the card slides and stays tinted for a moment.
  describe('after an arrow tap', () => {
    afterEach(() => {
      vi.useRealTimers();
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    /** Each row reports its place in the list as its top, 60 px apart, like a real layout. */
    function layoutRows() {
      vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
        this: HTMLElement,
      ) {
        const li = this.closest('li');
        const top = li ? [...li.parentElement!.children].indexOf(li) * 60 : 0;
        return { top, bottom: top + 48, left: 0, right: 0, width: 0, height: 48 } as DOMRect;
      });
    }

    function reduce(on: boolean) {
      vi.stubGlobal('matchMedia', (query: string) => ({
        matches: on && query.includes('reduce'),
        media: query,
        addEventListener() {},
        removeEventListener() {},
      }));
    }

    function moveFirstDown() {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      render(
        <Order item={item} attemptIndex={0} answer={null} onChange={() => {}} disabled={false} />,
      );
      const [first] = presentedOrder(item, 0);
      fireEvent.click(screen.getByRole('button', { name: `${first!.text} nach unten` }));
      const rows = screen.getAllByRole('listitem');
      return { moved: rows[1]!, others: rows.filter((_, i) => i !== 1), first: first! };
    }

    const tile = (li: HTMLElement) => li.querySelector('.flex-1') as HTMLElement;

    it('the moved card is tinted touch-soft (not yellow, not blue), then not any more', () => {
      reduce(false);
      const { moved, others, first } = moveFirstDown();
      expect(moved.textContent).toContain(first.text);
      expect(moved.dataset.moved).toBe('true');
      expect(tile(moved).className).toContain('bg-touch-soft');
      expect(tile(moved).className).not.toMatch(/bg-signal|bg-correct/);
      for (const li of others) {
        expect(li.dataset.moved).toBeUndefined();
        expect(tile(li).className).toContain('bg-surface');
      }
      act(() => vi.advanceTimersByTime(ORDER_HIGHLIGHT_MS));
      expect(moved.dataset.moved).toBeUndefined();
      expect(tile(moved).className).not.toContain('bg-touch-soft');
    });

    it('slides both cards from their old places over --duration-move', () => {
      reduce(false);
      layoutRows();
      const { moved, others } = moveFirstDown();
      expect(moved.style.transition).toBe('transform var(--duration-move) var(--ease-standard)');
      expect(others[0]!.style.transition).toBe(
        'transform var(--duration-move) var(--ease-standard)',
      );
      expect(others[1]!.style.transition).toBe('');
    });

    it('prefers-reduced-motion: the tint without any movement', () => {
      reduce(true);
      layoutRows();
      const { moved, others } = moveFirstDown();
      expect(moved.dataset.moved).toBe('true');
      expect(tile(moved).className).toContain('bg-touch-soft');
      for (const li of [moved, ...others]) {
        expect(li.style.transition).toBe('');
        expect(li.style.transform).toBe('');
      }
    });
  });
});
