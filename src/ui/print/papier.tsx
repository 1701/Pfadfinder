// Paper forms per format for the printed Probetest: what a child fills in with a pencil, and the
// line on the solution sheet. One entry per format, like the screen registry (no format switch in
// the sheet). Option order is the screen order of a first attempt (attemptIndex 0), so the
// solution sheet names the solution as text, never as a letter. mark-in-text uses splitUnits.

import type { ReactNode } from 'react';
import { splitUnits } from '../../domain/content/units';
import type { Format, Item, ItemOf } from '../../domain/content';
import {
  PRESENTATION_TEXTS as T,
  clozeParts,
  presentedGapOptions,
  presentedMatch,
  presentedOptions,
  presentedOrder,
} from '../../domain/presentation';
import { formatGermanNumber } from '../formats/number-format';
import { keepNumbersWithWords as nb } from '../text/numbers';

interface Papierform<F extends Format> {
  /** The answer area on the task sheet. */
  aufgabe(item: ItemOf<F>): ReactNode;
  /** The solution as text for the solution sheet. */
  loesung(item: ItemOf<F>): ReactNode;
}

const FIRST = 0;

function Ankreuzen({ options }: { options: { id: string; text: string }[] }) {
  return (
    <ul className="grid gap-xs">
      {options.map((o) => (
        <li key={o.id} className="flex items-center gap-sm">
          <span className="druck-kreuz" />
          {nb(o.text)}
        </li>
      ))}
    </ul>
  );
}

function textOf(list: { id: string; text: string }[], id: string): string {
  return list.find((e) => e.id === id)?.text ?? id;
}

const PAPIER: { [F in Format]: Papierform<F> } = {
  'single-choice': {
    aufgabe: (item) => <Ankreuzen options={presentedOptions(item, FIRST)} />,
    loesung: (item) => nb(textOf(item.payload.options, item.solution.optionId)),
  },
  'multi-choice': {
    aufgabe: (item) => <Ankreuzen options={presentedOptions(item, FIRST)} />,
    loesung: (item) =>
      item.solution.optionIds.map((id) => nb(textOf(item.payload.options, id))).join(' · '),
  },
  'number-input': {
    aufgabe: (item) => (
      <>
        <div className="druck-rechenplatz" aria-hidden="true" />
        <p className="flex items-center gap-sm">
          <span className="druck-kaestchen" />
          {item.payload.unit}
        </p>
      </>
    ),
    loesung: (item) =>
      formatGermanNumber(item.solution.value, item.payload.unit) +
      (item.payload.unit ? ` ${item.payload.unit}` : ''),
  },
  match: {
    aufgabe: (item) => {
      const { left, right } = presentedMatch(item, FIRST);
      const rows = Math.max(left.length, right.length);
      return (
        <div className="grid grid-cols-[1fr_auto_auto_1fr] items-center gap-x-lg gap-y-sm">
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="contents">
              <span>{left[i] ? nb(left[i].text) : ''}</span>
              <span>{left[i] && <span className="druck-punkt" />}</span>
              <span>{right[i] && <span className="druck-punkt" />}</span>
              <span>{right[i] ? nb(right[i].text) : ''}</span>
            </div>
          ))}
        </div>
      );
    },
    loesung: (item) =>
      item.solution.pairs
        .map(([l, r]) => `${textOf(item.payload.left, l)} – ${textOf(item.payload.right, r)}`)
        .join(' · '),
  },
  order: {
    aufgabe: (item) => (
      <ul className="grid gap-xs">
        {presentedOrder(item, FIRST).map((e) => (
          <li key={e.id} className="flex items-center gap-sm">
            <span className="druck-nummer" />
            {nb(e.text)}
          </li>
        ))}
      </ul>
    ),
    loesung: (item) =>
      item.solution.orderedIds
        .map((id, i) => `${i + 1}. ${textOf(item.payload.items, id)}`)
        .join('  '),
  },
  'cloze-select': {
    aufgabe: (item) => {
      const options = presentedGapOptions(item, FIRST);
      return (
        <p>
          {clozeParts(item.payload.template).map((part, i) =>
            part.kind === 'text' ? (
              <span key={i}>{part.text}</span>
            ) : (
              <span key={i} className="whitespace-nowrap">
                ( {(options[part.key] ?? []).join(' / ')} )
              </span>
            ),
          )}
        </p>
      );
    },
    loesung: (item) =>
      clozeParts(item.payload.template).map((part, i) =>
        part.kind === 'text' ? (
          <span key={i}>{part.text}</span>
        ) : (
          <b key={i}>{item.solution.gaps[part.key]}</b>
        ),
      ),
  },
  'mark-in-text': {
    aufgabe: (item) => (
      <p className="druck-markieren">
        {splitUnits(item.payload.text, item.payload.unit).join(' ')}
      </p>
    ),
    loesung: (item) => {
      const units = splitUnits(item.payload.text, item.payload.unit);
      return item.solution.indices.map((i) => units[i] ?? '').join(' · ');
    },
  },
  'find-error': {
    aufgabe: (item) => (
      <>
        <p className="druck-markieren">{item.payload.words.map((w) => w.text).join(' ')}</p>
        <div className="druck-linie" />
      </>
    ),
    loesung: (item) =>
      item.solution.errorIds
        .map((id) => `${textOf(item.payload.words, id)} → ${item.solution.corrections[id] ?? ''}`)
        .join(' · '),
  },
  'short-answer': {
    aufgabe: (item) => (
      <div className="grid">
        {Array.from({ length: Math.ceil(item.payload.maxChars / 45) + 1 }, (_, i) => (
          <div key={i} className="druck-linie" />
        ))}
      </div>
    ),
    loesung: (item) => (
      <>
        {item.solution.model}
        <br />
        <i>{T.keyPointsHeading}</i> {item.solution.keyPoints.join(' · ')}
      </>
    ),
  },
};

export function papierAufgabe(item: Item): ReactNode {
  const form = PAPIER[item.format] as Papierform<Format>;
  return form.aufgabe(item as ItemOf<Format>);
}

export function papierLoesung(item: Item): ReactNode {
  const form = PAPIER[item.format] as Papierform<Format>;
  return form.loesung(item as ItemOf<Format>);
}
