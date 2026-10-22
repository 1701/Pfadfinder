// Printing a task with a reading text from the browser (iPad finding A5, 2026-10-22): on paper
// the whole text stands before the task, nothing cut by the text box, no top line, band or
// Vorlesen. Checked in print media on /dev/item (dev build only) for a short and a long text.

import { expect, test } from '@playwright/test';

const ITEMS = [
  { id: 'd-lsa-1-001', text: 't-sach-001' },
  { id: 'd-lsa-3-004', text: 't-sach-004' },
];

for (const { id, text } of ITEMS) {
  test(`Druck: ${id} zeigt ${text} ganz vor der Aufgabe`, async ({ page }) => {
    await page.goto(`/dev/item/${id}`);
    await page.locator('[data-region="text"] li').first().waitFor();
    await page.emulateMedia({ media: 'print' });
    const m = await page.evaluate(() => {
      const box = document.querySelector('[data-region="text"]')!;
      const scroller = box.querySelector('[role="region"]')!;
      const visible = (e: Element | null) => e !== null && e.getBoundingClientRect().height > 0;
      return {
        paragraphs: box.querySelectorAll('li').length,
        shown: [...box.querySelectorAll('li')].filter(visible).length,
        cut: scroller.scrollHeight - scroller.clientHeight,
        textBottom: box.getBoundingClientRect().bottom,
        sheetTop: document.querySelector('[data-region="sheet"]')!.getBoundingClientRect().top,
        header: visible(document.querySelector('main > header')),
        band: visible(document.querySelector('[data-region="band"]')),
        vorlesen: [...document.querySelectorAll('button')].some(
          (b) => visible(b) && /Vorlesen/.test(b.textContent ?? ''),
        ),
      };
    });
    expect(m.paragraphs, 'paragraphs').toBeGreaterThan(2);
    expect(m.shown, 'every paragraph on paper').toBe(m.paragraphs);
    expect(m.cut, 'text box cuts the text').toBeLessThanOrEqual(1);
    expect(m.textBottom, 'text before the task').toBeLessThanOrEqual(m.sheetTop);
    expect(m.header, 'top line on paper').toBe(false);
    expect(m.band, 'band on paper').toBe(false);
    expect(m.vorlesen, 'Vorlesen on paper').toBe(false);
  });
}
