import { expect, type Page } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';

export interface ContentItem {
  id: string;
  format: string;
  status: string;
  prompt: string;
  stimulus?: { text?: string; assetId?: string };
  payload: { options?: { id: string; text: string }[] };
  solution: { optionId?: string; value?: number };
  feedback: { correct: string; incorrect: string; misconception?: string };
}

/** Every practiceable item: formats with a renderer, from all content files. */
export const ITEMS: ContentItem[] = readdirSync('content/items', { recursive: true })
  .map(String)
  .filter((file) => file.endsWith('.json'))
  .flatMap((file) => JSON.parse(readFileSync(`content/items/${file}`, 'utf8')) as ContentItem[])
  .filter((i) => i.format === 'single-choice' || i.format === 'number-input')
  .filter((i) => i.status !== 'retired');

export const SCREENSHOTS = 'tests/e2e/screenshots';

/** One screen, no page scroll; answers never run under the band; the button fully visible. */
export async function expectFitsScreen(page: Page, label: string) {
  const m = await page.evaluate(() => {
    const answer = document.querySelector('[data-region="answer"]')?.firstElementChild;
    const band = document.querySelector('[data-region="band"]');
    const button = band?.querySelector(':scope > button');
    if (!answer || !band || !button) return null;
    return {
      overflow: document.documentElement.scrollHeight - window.innerHeight,
      slack: band.getBoundingClientRect().top - answer.getBoundingClientRect().bottom,
      buttonBottom: window.innerHeight - button.getBoundingClientRect().bottom,
      buttonHeight: button.getBoundingClientRect().height,
    };
  });
  expect(m, label).not.toBeNull();
  expect(m!.overflow, `${label}: page scrolls`).toBeLessThanOrEqual(0);
  expect(m!.slack, `${label}: answers run under the feedback band`).toBeGreaterThanOrEqual(0);
  expect(m!.buttonBottom, `${label}: button leaves the screen`).toBeGreaterThanOrEqual(0);
  expect(m!.buttonHeight, `${label}: button lower than 56 px`).toBeGreaterThanOrEqual(56);
}
