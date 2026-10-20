// Reihenfolge: a list of cards, each with a handle (drag, dnd-kit sortable) and the buttons ↑ and ↓
// for keyboard and screen readers. The list never starts solved (presentedOrder), and Prüfen
// waits for the first move. After checking handles and arrows go away, but their places stay, so
// no card moves; cards in the right place get a check mark, and a line names the right order.
// After an arrow tap the card slides to its new place (FLIP, --duration-move) and stays tinted for
// a moment (touch-soft: touched, not chosen); with prefers-reduced-motion only the tint (task 14).
// Own chunk (registry), like Match.

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import clsx from 'clsx';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { presentedOrder, PRESENTATION_TEXTS as T } from '../../domain/presentation';
import { ArrowDownGlyph, ArrowUpGlyph, GripGlyph } from '../components/glyphs';
import { keepNumbersTogether as nb } from '../text/numbers';
import { SolutionMark, StateWords, tileClass, tileState } from './choice';
import type { FormatProps } from './types';

const ORDER_INSTRUCTIONS = 'Mit den Pfeilen nach oben und unten verschiebst du eine Karte.';

/** How long a card stays tinted after an arrow tap. */
export const ORDER_HIGHLIGHT_MS = 1000;

const reducedMotion = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const ARROW_CLASS =
  'grid size-touch shrink-0 place-items-center rounded-control border-2 border-line-strong bg-surface disabled:border-line disabled:text-line';

function Row({
  id,
  text,
  index,
  count,
  disabled,
  moved,
  onMove,
  buttonRef,
  rowRef,
}: {
  id: string;
  text: string;
  index: number;
  count: number;
  disabled: boolean;
  /** Just moved by an arrow: tinted for ORDER_HIGHLIGHT_MS. */
  moved: boolean;
  onMove(from: number, to: number, via: 'up' | 'down'): void;
  buttonRef(direction: 'up' | 'down', el: HTMLButtonElement | null): void;
  rowRef(el: HTMLLIElement | null): void;
}) {
  const { setNodeRef, setActivatorNodeRef, listeners, transform, transition, isDragging } =
    useSortable({ id, disabled });
  const style = transform
    ? { transform: `translate3d(0, ${transform.y}px, 0)`, transition: transition ?? undefined }
    : undefined;
  return (
    <li
      ref={(el) => {
        setNodeRef(el);
        rowRef(el);
      }}
      style={style}
      data-moved={moved || undefined}
      className={clsx('flex items-center gap-sm', (isDragging || moved) && 'relative z-10')}
    >
      <span
        ref={setActivatorNodeRef}
        {...listeners}
        aria-hidden="true"
        className="grid size-touch shrink-0 cursor-grab touch-none place-items-center text-ink-muted"
      >
        <GripGlyph className="size-lg" />
      </span>
      <span
        className={tileClass(
          isDragging ? 'selected' : moved ? 'moved' : 'plain',
          false,
          'flex-1 px-md transition-colors duration-(--duration-feedback)',
        )}
      >
        {nb(text)}
      </span>
      <button
        ref={(el) => buttonRef('up', el)}
        type="button"
        aria-label={`${text} nach oben`}
        disabled={disabled || index === 0}
        onClick={() => onMove(index, index - 1, 'up')}
        className={ARROW_CLASS}
      >
        <ArrowUpGlyph className="size-lg" />
      </button>
      <button
        ref={(el) => buttonRef('down', el)}
        type="button"
        aria-label={`${text} nach unten`}
        disabled={disabled || index === count - 1}
        onClick={() => onMove(index, index + 1, 'down')}
        className={ARROW_CLASS}
      >
        <ArrowDownGlyph className="size-lg" />
      </button>
    </li>
  );
}

export function Order({
  item,
  attemptIndex,
  answer,
  onChange,
  disabled,
  revealed,
}: FormatProps<'order'>) {
  const start = useMemo(
    () => presentedOrder(item, attemptIndex).map((e) => e.id),
    [item, attemptIndex],
  );
  const [ids, setIds] = useState<string[]>(() => answer?.orderedIds ?? start);
  const [said, setSaid] = useState('');
  const [moved, setMoved] = useState<string | null>(null);
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const rows = useRef(new Map<string, HTMLLIElement>());
  // Where each card stood before an arrow move (FLIP: first, last, invert, play).
  const before = useRef<Map<string, number> | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const text = new Map(item.payload.items.map((e) => [e.id, e.text]));

  const move = (from: number, to: number, via?: 'up' | 'down') => {
    if (to < 0 || to >= ids.length || from === to) return;
    const next = arrayMove(ids, from, to);
    const id = next[to] ?? '';
    if (via) {
      before.current = new Map(
        [...rows.current].map(([k, el]) => [k, el.getBoundingClientRect().top]),
      );
      setMoved(id);
    }
    setIds(next);
    setSaid(`${text.get(id) ?? ''} ist jetzt an Stelle ${to + 1}.`);
    onChange({ orderedIds: next });
    if (via) {
      // Keep the focus on the moved card; at the edge its other arrow takes over.
      const atEdge = via === 'up' ? to === 0 : to === next.length - 1;
      const direction = atEdge ? (via === 'up' ? 'down' : 'up') : via;
      requestAnimationFrame(() => buttons.current.get(`${id}:${direction}`)?.focus());
    }
  };

  // Play the arrow move: each card starts where it stood and slides to its new place.
  useLayoutEffect(() => {
    const first = before.current;
    before.current = null;
    if (!first || reducedMotion()) return;
    for (const [id, el] of rows.current) {
      const delta = (first.get(id) ?? 0) - el.getBoundingClientRect().top;
      if (delta === 0) continue;
      el.style.transition = 'none';
      el.style.transform = `translateY(${delta}px)`;
      void el.getBoundingClientRect();
      el.style.transition = 'transform var(--duration-move) var(--ease-standard)';
      el.style.transform = '';
      el.addEventListener('transitionend', () => (el.style.transition = ''), { once: true });
    }
  }, [ids]);

  useEffect(() => {
    if (moved === null) return;
    const timer = setTimeout(() => setMoved(null), ORDER_HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [moved, ids]);

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setMoved(null);
    if (over) move(ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
  };

  // Dragging is for fingers; the arrows announce their own moves (said).
  const name = (id: unknown) => text.get(String(id)) ?? '';
  const announcements: Announcements = {
    onDragStart: ({ active }) => `${name(active.id)} aufgenommen.`,
    onDragOver: () => undefined,
    onDragEnd: ({ active }) => `${name(active.id)} abgelegt.`,
    onDragCancel: ({ active }) => `${name(active.id)} losgelassen.`,
  };

  if (revealed) {
    const solution = revealed.solution.orderedIds;
    const allRight = ids.every((id, i) => id === solution[i]);
    return (
      <div className="grid w-full gap-xs">
        <ol className="grid gap-xs">
          {ids.map((id, i) => {
            const state = tileState(true, id === solution[i], true);
            return (
              <li key={id} className="flex items-center gap-sm">
                {/* Handle and arrows go, their places stay: the cards must not move. */}
                <span aria-hidden="true" className="invisible size-touch shrink-0" />
                <span className={tileClass(state, false, 'flex-1 px-md')}>
                  <SolutionMark state={state} />
                  <span>
                    {nb(text.get(id) ?? '')}
                    <StateWords state={state} />
                  </span>
                </span>
                <span aria-hidden="true" className="invisible size-touch shrink-0" />
                <span aria-hidden="true" className="invisible size-touch shrink-0" />
              </li>
            );
          })}
        </ol>
        {!allRight && (
          <p className="text-option text-correct">
            {T.rightIs} {solution.map((id) => nb(text.get(id) ?? '')).join(', ')}
          </p>
        )}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      accessibility={{ announcements, screenReaderInstructions: { draggable: ORDER_INSTRUCTIONS } }}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ol className="grid w-full gap-xs">
          {ids.map((id, index) => (
            <Row
              key={id}
              id={id}
              text={text.get(id) ?? ''}
              index={index}
              count={ids.length}
              disabled={disabled}
              moved={moved === id}
              onMove={move}
              buttonRef={(direction, el) => {
                if (el) buttons.current.set(`${id}:${direction}`, el);
                else buttons.current.delete(`${id}:${direction}`);
              }}
              rowRef={(el) => {
                if (el) rows.current.set(id, el);
                else rows.current.delete(id);
              }}
            />
          ))}
        </ol>
      </SortableContext>
      <p aria-live="polite" className="sr-only">
        {said}
      </p>
    </DndContext>
  );
}
