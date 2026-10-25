// @vitest-environment jsdom
import '../dom';
import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Item, ItemOf } from '../../../src/domain/content';
import { Druckansicht } from '../../../src/ui/print/Druckansicht';
import { MATHE_91 } from '../../fixtures/content';
import {
  numberInput,
  segmentText,
  shortAnswer,
  singleChoice,
  validItemsByFormat,
} from '../../fixtures/items';
import { DEUTSCH_90, PROBETEST_ITEMS, PROBETEST_TEXTS, biberText } from '../../fixtures/lesen';

const probetest = MATHE_91;

describe('Druckansicht', () => {
  it('a task sheet with every format in paper form, then the solutions', () => {
    const items = Object.values(validItemsByFormat) as Item[];
    const { container } = render(<Druckansicht probetest={probetest} items={items} />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Probetest Mathe 91');
    expect(container.querySelectorAll('[data-item]')).toHaveLength(items.length);
    expect(container.querySelectorAll('[data-loesung]')).toHaveLength(items.length);
    // No Vorlesen and no input on paper; the only button prints and hides in print.
    expect(screen.queryByRole('button', { name: 'Vorlesen' })).toBeNull();
    expect(container.querySelectorAll('input, textarea')).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Drucken' }).closest('.nur-bildschirm')).toBeTruthy();
    expect(container.querySelector('.druck-loesungen')).toBeTruthy();
  });

  it('a number item: room to calculate, then the result box with its unit; the solution as text', () => {
    const item: ItemOf<'number-input'> = {
      ...numberInput,
      payload: { unit: 'cm', maxDigits: 3 },
      solution: { value: 124 },
    };
    const { container } = render(<Druckansicht probetest={probetest} items={[item]} />);
    const task = container.querySelector(`[data-item="${item.id}"]`)!;
    const room = task.querySelector('.druck-rechenplatz');
    const box = task.querySelector('.druck-kaestchen');
    expect(room).toBeTruthy();
    expect(box).toBeTruthy();
    expect(room!.compareDocumentPosition(box!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(box!.parentElement!.textContent).toContain('cm');
    expect(
      container
        .querySelector(`[data-loesung="${item.id}"] span`)!
        .textContent!.replace(/\u00a0/g, ' '),
    ).toBe('124 cm');
  });

  it('options to tick, and the solution named as text, never as a letter', () => {
    const item = singleChoice;
    const { container } = render(<Druckansicht probetest={probetest} items={[item]} />);
    expect(container.querySelectorAll('.druck-kreuz')).toHaveLength(4);
    expect(
      container.querySelector('[data-loesung] span')!.textContent!.replace(/\u00a0/g, ' '),
    ).toBe('7,90 €');
  });

  it('segment-text: the sentence with wide word spaces to circle, the solution with dividers', () => {
    const { container } = render(<Druckansicht probetest={probetest} items={[segmentText]} />);
    expect(container.querySelector('.druck-segmentieren')!.textContent).toBe(
      'Am Morgen packt der Junge seinen Rucksack.',
    );
    expect(container.querySelector('[data-loesung]')!.textContent).toContain(
      'Am Morgen | packt | der Junge | seinen Rucksack.',
    );
  });

  it('a short answer gets lines, the solution sheet the model answer and key points', () => {
    const item = shortAnswer;
    const { container } = render(<Druckansicht probetest={probetest} items={[item]} />);
    expect(container.querySelectorAll('.druck-linie').length).toBeGreaterThanOrEqual(3);
    const solution = container.querySelector('[data-loesung]')!.textContent;
    expect(solution).toContain(item.solution.model);
    expect(solution).toContain('Darauf kommt es an:');
  });

  it('the title and the solution sheet name the Fach of the Probetest: Deutsch 90 (task 14)', () => {
    const items = DEUTSCH_90.itemIds.map((id) => PROBETEST_ITEMS.find((i) => i.id === id)!);
    const { container } = render(
      <Druckansicht probetest={DEUTSCH_90} items={items} texts={PROBETEST_TEXTS} />,
    );
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Probetest Deutsch 90');
    expect(screen.getByRole('heading', { level: 2, name: /Lösungen/ }).textContent).toBe(
      'Lösungen · Probetest Deutsch 90',
    );
    expect(container.textContent).not.toMatch(/Mathe/);
  });

  it('a reading text stands before its items, with its title and numbered paragraphs', () => {
    const items = DEUTSCH_90.itemIds.map((id) => PROBETEST_ITEMS.find((i) => i.id === id)!);
    const { container } = render(
      <Druckansicht probetest={DEUTSCH_90} items={items} texts={PROBETEST_TEXTS} />,
    );
    const texts = [...container.querySelectorAll<HTMLElement>('[data-text]')];
    expect(texts.map((t) => t.dataset.text)).toEqual(['t-sach-900', 't-lit-900']);
    expect(texts[0]!.querySelector('h2')!.textContent).toBe(biberText.title);
    const paragraphs = [...texts[0]!.querySelectorAll('.druck-absatz')];
    expect(paragraphs.map((p) => p.querySelector('b')!.textContent)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
    ]);
    expect(paragraphs[0]!.textContent).toContain(biberText.paragraphs[0]!);

    // Document order: text 1, its 6 items, text 2, its 4 items, then spelling; numbers run on.
    const order = [...container.querySelectorAll<HTMLElement>('[data-text], [data-item]')]
      .filter((el) => !el.closest('.druck-loesungen'))
      .map((el) => el.dataset.text ?? el.dataset.item);
    expect(order).toEqual([
      't-sach-900',
      ...DEUTSCH_90.itemIds.slice(0, 6),
      't-lit-900',
      ...DEUTSCH_90.itemIds.slice(6),
    ]);
    const numbers = [...container.querySelectorAll('.druck-aufgabe > b')].map((b) => b.textContent);
    expect(numbers).toEqual(DEUTSCH_90.itemIds.map((_, i) => String(i + 1)));
  });

  it('every further text starts on a new page, the first right under the heading', () => {
    const css = readFileSync('src/ui/theme/print.css', 'utf8');
    expect(css).toMatch(/\.druck-text \{[^}]*break-before: page/);
    expect(css).toMatch(/\.druck-kopf \+ \.contents > \.druck-text \{[^}]*break-before: auto/);
  });
});
