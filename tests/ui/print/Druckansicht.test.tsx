// @vitest-environment jsdom
import '../dom';
import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Item, Probetest } from '../../../src/domain/content';
import { Druckansicht } from '../../../src/ui/print/Druckansicht';
import { contentItem } from '../../fixtures/content-items';
import { validItemsByFormat } from '../../fixtures/items';
import { DEUTSCH_90, PROBETEST_ITEMS, PROBETEST_TEXTS, biberText } from '../../fixtures/lesen';

const probetest = JSON.parse(readFileSync('content/probetests/mathe-01.json', 'utf8')) as Probetest;

describe('Druckansicht', () => {
  it('a task sheet with every format in paper form, then the solutions', () => {
    const items = Object.values(validItemsByFormat) as Item[];
    const { container } = render(<Druckansicht probetest={probetest} items={items} />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Probetest Mathe 1');
    expect(container.querySelectorAll('[data-item]')).toHaveLength(9);
    expect(container.querySelectorAll('[data-loesung]')).toHaveLength(9);
    // No Vorlesen and no input on paper; the only button prints and hides in print.
    expect(screen.queryByRole('button', { name: 'Vorlesen' })).toBeNull();
    expect(container.querySelectorAll('input, textarea')).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Drucken' }).closest('.nur-bildschirm')).toBeTruthy();
    expect(container.querySelector('.druck-loesungen')).toBeTruthy();
  });

  it('a number item: room to calculate, then the result box with its unit; the solution as text', () => {
    const item = contentItem('m-rf-1-009', 'number-input');
    const { container } = render(<Druckansicht probetest={probetest} items={[item]} />);
    const task = container.querySelector(`[data-item="${item.id}"]`)!;
    const room = task.querySelector('.druck-rechenplatz');
    const box = task.querySelector('.druck-kaestchen');
    expect(room).toBeTruthy();
    expect(box).toBeTruthy();
    expect(room!.compareDocumentPosition(box!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(box!.parentElement!.textContent).toContain('cm');
    expect(
      container.querySelector(`[data-loesung="${item.id}"]`)!.textContent!.replace(/\u00a0/g, ' '),
    ).toBe('124 cm');
  });

  it('options to tick, and the solution named as text, never as a letter', () => {
    const item = contentItem('m-zo-2-003', 'single-choice');
    const { container } = render(<Druckansicht probetest={probetest} items={[item]} />);
    expect(container.querySelectorAll('.druck-kreuz')).toHaveLength(4);
    expect(container.querySelector('[data-loesung]')!.textContent!.replace(/ /g, ' ')).toBe(
      '113 Tische voll, 4 Kinder übrig',
    );
  });

  it('a short answer gets lines, the solution sheet the model answer and key points', () => {
    const item = contentItem('m-gm-3-002', 'short-answer');
    const { container } = render(<Druckansicht probetest={probetest} items={[item]} />);
    expect(container.querySelectorAll('.druck-linie').length).toBeGreaterThanOrEqual(3);
    const solution = container.querySelector('[data-loesung]')!.textContent;
    expect(solution).toContain('12:15 Uhr');
    expect(solution).toContain('Darauf kommt es an:');
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
