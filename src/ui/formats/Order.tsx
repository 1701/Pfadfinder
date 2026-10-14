// Reihenfolge: a list of cards, each with a handle (drag, dnd-kit sortable) and the buttons ↑ and ↓
// for keyboard and screen readers. The list never starts solved (presentedOrder), and Prüfen
// waits for the first move. After checking handles and arrows go away; cards in the right place
// get a check mark, and a line names the right order. Own chunk (registry), like Match.

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
import { useMemo, useRef, useState } from 'react';
import { presentedOrder, PRESENTATION_TEXTS as T } from '../../domain/presentation';
import { ArrowDownGlyph, ArrowUpGlyph, GripGlyph } from '../components/glyphs';
import { keepNumbersTogether as nb } from '../text/numbers';
import { SolutionMark, StateWords, tileClass, tileState } from './choice';
import type { FormatProps } from './types';

const ORDER_INSTRUCTIONS = 'Mit den Pfeilen nach oben und unten verschiebst du eine Karte.';

const ARROW_CLASS =
  'grid size-touch shrink-0 place-items-center rounded-control border-2 border-line-strong bg-surface disabled:border-line disabled:text-line';

function Row({
  id,
  text,
  index,
  count,
  disabled,
  onMove,
  buttonRef,
}: {
  id: string;
  text: string;
  index: number;
  count: number;
  disabled: boolean;
  onMove(from: number, to: number, via: 'up' | 'down'): void;
  buttonRef(direction: 'up' | 'down', el: HTMLButtonElement | null): void;
}) {
  const { setNodeRef, setActivatorNodeRef, listeners, transform, transition, isDragging } =
    useSortable({ id, disabled });
  const style = transform
    ? { transform: `translate3d(0, ${transform.y}px, 0)`, transition: transition ?? undefined }
    : undefined;
  return (
    <li
      ref={setNodeRef}
      style={style}
      className={clsx('flex items-center gap-sm', isDragging && 'relative z-10')}
    >
      <span
        ref={setActivatorNodeRef}
        {...listeners}
        aria-hidden="true"
        className="grid size-touch shrink-0 cursor-grab touch-none place-items-center text-ink-muted"
      >
        <GripGlyph className="size-lg" />
      </span>
      <span className={tileClass(isDragging ? 'selected' : 'plain', false, 'flex-1 px-md')}>
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
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const text = new Map(item.payload.items.map((e) => [e.id, e.text]));

  const move = (from: number, to: number, via?: 'up' | 'down') => {
    if (to < 0 || to >= ids.length || from === to) return;
    const next = arrayMove(ids, from, to);
    const id = next[to] ?? '';
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

  const onDragEnd = ({ active, over }: DragEndEvent) => {
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
              <li key={id} className={tileClass(state, false, 'px-md')}>
                <SolutionMark state={state} />
                <span>
                  {nb(text.get(id) ?? '')}
                  <StateWords state={state} />
                </span>
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
              onMove={move}
              buttonRef={(direction, el) => {
                if (el) buttons.current.set(`${id}:${direction}`, el);
                else buttons.current.delete(`${id}:${direction}`);
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
