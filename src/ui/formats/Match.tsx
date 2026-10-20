// Zuordnen: fixed rows on the left, each with a slot; the cards wait in a pool (beside the rows in
// landscape, below them in portrait). Tap a row and then a card (or the other way round) to place
// it, or drag the card with dnd-kit. Tapping a filled slot puts its card back. The distractor
// simply stays in the pool. After checking the pool goes away; a wrong row shows the right card.
// Loaded as its own chunk (registry), so dnd-kit never reaches the route chunks.

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from '@dnd-kit/core';
import clsx from 'clsx';
import { useMemo, useState, type ReactNode } from 'react';
import { presentedMatch, PRESENTATION_TEXTS as T } from '../../domain/presentation';
import { keepNumbersTogether as nb } from '../text/numbers';
import { SolutionMark, StateWords, tileClass, tileState, type TileState } from './choice';
import type { FormatProps } from './types';

type Selection = { side: 'left' | 'right'; id: string } | null;

const MATCH_INSTRUCTIONS = 'Wähle erst eine Zeile, dann eine Antwort.';

const POOL = 'pool';

/**
 * The same layout before and after checking, so nothing moves: the rows (label | slot) and beside
 * them in landscape, below them in portrait, the pool – after checking, in the same place, the
 * "Richtig ist" list. The rows never grow, whatever that side holds.
 * The slot is as wide as the longest card with its check mark and padding (measured once,
 * invisibly: CardSizer), so it is as wide before checking as after: nothing moves.
 * Beside a reading text (.item-with-text) the cards go below the rows, the slot takes at most 60 %
 * and the label the rest, wrapping in balanced lines: d-lli-2-003 broke into three lines of one
 * word each (iPad finding 2026-10-19). Without a text the grid is packed and the card comes first:
 * slot max-content (one line), label column auto with the rest, where it wraps if it must
 * (m-dz-2-008); no empty space between them (m-zo-1-009), cards on one line (m-rf-1-004).
 */
const LAYOUT_CLASS =
  'grid w-full items-start gap-x-md gap-y-sm landscape:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] [.item-with-text_&]:grid-cols-1';
const ROWS_CLASS =
  'grid grid-cols-[auto_max-content] items-center justify-start gap-x-sm gap-y-xs [.item-with-text_&]:grid-cols-[minmax(0,1fr)_fit-content(60%)]';
const LABEL_CLASS =
  'flex min-h-touch items-center rounded-control border-2 px-sm text-left text-option text-balance';
const rowId = (leftId: string) => `row:${leftId}`;

function Card({
  id,
  state,
  onTap,
  disabled,
  label,
  markRoom = false,
  children,
}: {
  id: string;
  state: TileState;
  onTap(): void;
  disabled: boolean;
  /** Accessible name when it says more than the text (it starts with the visible text). */
  label?: string;
  /** In a slot: keep the check mark's room, so the text wraps as it will after checking. */
  markRoom?: boolean;
  children: ReactNode;
}) {
  const { setNodeRef, listeners, isDragging } = useDraggable({ id, disabled });
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...listeners}
      aria-label={label}
      aria-pressed={state === 'selected'}
      onClick={onTap}
      className={tileClass(
        state,
        true,
        clsx('w-full touch-none px-md text-left', isDragging && 'opacity-50'),
      )}
    >
      {markRoom && <MarkRoom />}
      {children}
    </button>
  );
}

/** Empty room of the check mark's size: text in a slot starts at the same place in every state. */
function MarkRoom() {
  return <span aria-hidden="true" className="size-lg shrink-0" />;
}

function Slot({
  leftId,
  active,
  children,
}: {
  leftId: string;
  active: boolean;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: rowId(leftId) });
  return (
    <div
      ref={setNodeRef}
      className={clsx('rounded-control', (isOver || active) && 'bg-signal-soft')}
    >
      {children}
    </div>
  );
}

/**
 * Gives the slot column its width: every card as a tile with room for the check mark, invisible and
 * without height, inside the first row's slot (not a grid cell of its own, which would push the
 * rows out of place). Hidden from screen readers.
 */
function CardSizer({ texts }: { texts: string[] }) {
  return (
    <div aria-hidden="true" data-sizer className="invisible h-0 overflow-hidden">
      {texts.map((text) => (
        <div key={text} className={tileClass('plain', false, 'px-md')}>
          <MarkRoom />
          <span>{nb(text)}</span>
        </div>
      ))}
    </div>
  );
}

function Pool({ children }: { children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: POOL });
  return (
    <div
      ref={setNodeRef}
      role="group"
      aria-label={T.answers.replace(':', '')}
      className={clsx(
        'flex min-h-touch flex-wrap content-start gap-xs rounded-control landscape:flex-col [.item-with-text_&]:flex-row',
        isOver && 'bg-signal-soft',
      )}
    >
      {children}
    </div>
  );
}

export function Match({
  item,
  attemptIndex,
  answer,
  onChange,
  disabled,
  revealed,
}: FormatProps<'match'>) {
  const { left, right } = useMemo(() => presentedMatch(item, attemptIndex), [item, attemptIndex]);
  const [pairs, setPairs] = useState<Record<string, string>>(() =>
    Object.fromEntries(answer?.pairs ?? []),
  );
  const [selected, setSelected] = useState<Selection>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const cardText = new Map(right.map((r) => [r.id, r.text]));
  const sizer = <CardSizer texts={right.map((r) => r.text)} />;
  const leftText = new Map(left.map((l) => [l.id, l.text]));
  const placed = new Set(Object.values(pairs));

  const commit = (next: Record<string, string>) => {
    setPairs(next);
    setSelected(null);
    const complete = left.every((l) => next[l.id] !== undefined);
    onChange(
      complete ? { pairs: left.map((l) => [l.id, next[l.id] ?? ''] as [string, string]) } : null,
    );
  };
  const place = (leftId: string, cardId: string) => {
    const next = Object.fromEntries(Object.entries(pairs).filter(([, c]) => c !== cardId));
    commit({ ...next, [leftId]: cardId });
  };
  const putBack = (cardId: string) =>
    commit(Object.fromEntries(Object.entries(pairs).filter(([, c]) => c !== cardId)));

  const tapRow = (leftId: string) => {
    if (selected?.side === 'right') return place(leftId, selected.id);
    const card = pairs[leftId];
    if (card !== undefined) return putBack(card);
    setSelected(selected?.id === leftId ? null : { side: 'left', id: leftId });
  };
  const tapCard = (cardId: string) => {
    if (selected?.side === 'left') return place(selected.id, cardId);
    setSelected(selected?.id === cardId ? null : { side: 'right', id: cardId });
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDragging(null);
    const cardId = String(active.id);
    if (over?.id === POOL) putBack(cardId);
    else if (over) place(String(over.id).slice(rowId('').length), cardId);
  };

  const name = (id: unknown) => cardText.get(String(id)) ?? '';
  const target = (id: unknown) =>
    id === POOL
      ? 'zurück zu den Antworten'
      : `zu ${leftText.get(String(id).slice(rowId('').length)) ?? ''}`;
  const announcements: Announcements = {
    onDragStart: ({ active }) => `${name(active.id)} aufgenommen.`,
    onDragOver: ({ active, over }) => (over ? `${name(active.id)} ${target(over.id)}.` : undefined),
    onDragEnd: ({ active, over }) =>
      over ? `${name(active.id)} abgelegt ${target(over.id)}.` : `${name(active.id)} losgelassen.`,
    onDragCancel: ({ active }) => `${name(active.id)} losgelassen.`,
  };

  if (revealed) {
    const solution = new Map(revealed.solution.pairs);
    const wrong = left.filter((l) => pairs[l.id] !== solution.get(l.id));
    return (
      <div className={LAYOUT_CLASS}>
        <div className={ROWS_CLASS} data-match-rows>
          {left.map((l, i) => {
            const card = pairs[l.id];
            const state = tileState(true, card === solution.get(l.id), card !== undefined);
            return (
              <div key={l.id} className="contents">
                <span className={clsx(LABEL_CLASS, 'border-transparent')}>{nb(l.text)}</span>
                <div>
                  <div className={tileClass(state, false, 'px-md')}>
                    {state === 'solution' ? <SolutionMark state={state} /> : <MarkRoom />}
                    <span>
                      {nb(cardText.get(card ?? '') ?? '')}
                      <StateWords state={state} />
                    </span>
                  </div>
                  {i === 0 && sizer}
                </div>
              </div>
            );
          })}
        </div>
        {wrong.length > 0 && (
          <div className="grid content-start gap-2xs text-option text-correct">
            <p>{T.rightIs}</p>
            {wrong.map((l) => (
              <p key={l.id}>
                {nb(l.text)} – {nb(cardText.get(solution.get(l.id) ?? '') ?? '')}
              </p>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      accessibility={{ announcements, screenReaderInstructions: { draggable: MATCH_INSTRUCTIONS } }}
      onDragStart={({ active }) => setDragging(String(active.id))}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDragging(null)}
    >
      <div className={LAYOUT_CLASS}>
        <div className={ROWS_CLASS} data-match-rows>
          {left.map((l, i) => {
            const card = pairs[l.id];
            const active = selected?.side === 'left' && selected.id === l.id;
            return (
              <div key={l.id} className="contents">
                <button
                  type="button"
                  aria-pressed={active}
                  disabled={disabled}
                  onClick={() => tapRow(l.id)}
                  className={clsx(
                    LABEL_CLASS,
                    active ? 'border-signal-edge bg-signal-soft' : 'border-transparent',
                  )}
                >
                  {nb(l.text)}
                </button>
                <Slot leftId={l.id} active={active}>
                  {card === undefined ? (
                    <button
                      type="button"
                      aria-label={`Feld für ${l.text}`}
                      disabled={disabled}
                      onClick={() => tapRow(l.id)}
                      className={clsx(
                        'block min-h-touch w-full rounded-control border-2 bg-paper',
                        active || selected?.side === 'right'
                          ? 'border-signal-edge'
                          : 'border-dashed border-line-strong',
                      )}
                    />
                  ) : (
                    <Card
                      id={card}
                      state="plain"
                      disabled={disabled}
                      label={`${cardText.get(card) ?? ''}, bei ${l.text}`}
                      markRoom
                      onTap={() => tapRow(l.id)}
                    >
                      {nb(cardText.get(card) ?? '')}
                    </Card>
                  )}
                  {i === 0 && sizer}
                </Slot>
              </div>
            );
          })}
        </div>
        <Pool>
          {right
            .filter((r) => !placed.has(r.id))
            .map((r) => (
              <div key={r.id} className="landscape:w-full [.item-with-text_&]:w-auto">
                <Card
                  id={r.id}
                  disabled={disabled}
                  state={selected?.side === 'right' && selected.id === r.id ? 'selected' : 'plain'}
                  onTap={() => tapCard(r.id)}
                >
                  {nb(r.text)}
                </Card>
              </div>
            ))}
        </Pool>
      </div>
      <DragOverlay dropAnimation={null}>
        {dragging && (
          <div className={tileClass('selected', false, 'px-md')}>
            {nb(cardText.get(dragging) ?? '')}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
