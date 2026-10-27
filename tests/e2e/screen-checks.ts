// Generic checks for any screen, independent of format (iPad findings 2026-10-19: the rating
// question ran into Getroffen/Teils/Noch nicht beside a reading text, "Löschen" ran out of its
// key). Both return what is wrong, so a spec can collect every finding of a viewport.

import type { Page } from '@playwright/test';

/**
 * No visible text runs out of its element: every visible element with its own text that is not
 * `display: inline` keeps scrollWidth ≤ clientWidth (1 px tolerance for subpixel rounding).
 * Screen-reader-only text (.sr-only) is skipped, and so is SVG: a diagram's <text> has no CSS box
 * (scrollWidth and the bounding box of its glyphs say nothing about what is drawn).
 */
export async function overflowProblems(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const ownText = (e: Element) =>
      [...e.childNodes]
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent ?? '')
        .join('')
        .trim();
    const problems: string[] = [];
    for (const e of document.body.querySelectorAll('*')) {
      const text = ownText(e);
      if (!text || e.closest('.sr-only, svg')) continue;
      if (!e.checkVisibility({ visibilityProperty: true, opacityProperty: true })) continue;
      if (getComputedStyle(e).display === 'inline') continue;
      const over = e.scrollWidth - e.clientWidth;
      if (over > 1)
        problems.push(
          `"${text.slice(0, 40)}" runs ${over} px out of its ${e.tagName.toLowerCase()}`,
        );
    }
    return problems;
  });
}

/**
 * No two visible tap targets or text blocks overlap. Tap targets are buttons, links, inputs and
 * role=button; text blocks are elements with their own text. A block element counts with its
 * box; an inline element with one rectangle per line (getClientRects), so wrapped running text
 * is not one big box. Every rectangle is cut to the ancestors that clip (overflow ≠ visible): text
 * scrolled out of the reading box does not count. An element and its own descendants never count
 * as overlapping; a cut of 0.5 px or less in either direction is a touching edge, not an overlap.
 * SVG content is skipped (see overflowProblems): a diagram is one picture. A task picture
 * (ContentAsset) counts with its box, so text that runs into it overlaps (task 19: a narrow text
 * column beside the picture in portrait let its words run into the drawing).
 * With `scope`, only pairs with at least one element inside it count (the pages for adults: the
 * Kopf, task N; the example on /eltern has inline dt/dd whose line boxes touch by 3 px).
 */
export async function overlapProblems(page: Page, scope?: string): Promise<string[]> {
  return page.evaluate((scope) => {
    type Rect = { left: number; top: number; right: number; bottom: number };
    const TARGETS = 'button, a[href], input, textarea, select, [role="button"]';
    const PICTURE = '.content-asset > svg';
    const ownText = (e: Element) =>
      [...e.childNodes]
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent ?? '')
        .join('')
        .trim();
    const cut = (a: Rect, b: Rect): Rect => ({
      left: Math.max(a.left, b.left),
      top: Math.max(a.top, b.top),
      right: Math.min(a.right, b.right),
      bottom: Math.min(a.bottom, b.bottom),
    });
    const clipped = (e: Element, r: Rect): Rect => {
      let out = r;
      for (let a = e.parentElement; a && a !== document.documentElement; a = a.parentElement) {
        const s = getComputedStyle(a);
        if (s.overflowX !== 'visible' || s.overflowY !== 'visible')
          out = cut(out, a.getBoundingClientRect());
      }
      return out;
    };
    const name = (e: Element) => {
      const text = (ownText(e) || e.getAttribute('aria-label') || e.textContent || '').trim();
      return `${e.tagName.toLowerCase()} "${text.slice(0, 30)}"`;
    };

    const boxes: { el: Element; rects: Rect[] }[] = [];
    for (const e of document.body.querySelectorAll('*')) {
      const target = e.matches(TARGETS) || e.matches(PICTURE);
      if (!target && !ownText(e)) continue;
      if (e.closest('.sr-only') || (e.closest('svg') && !e.matches(PICTURE))) continue;
      if (!e.checkVisibility({ visibilityProperty: true, opacityProperty: true })) continue;
      const inline = !target && getComputedStyle(e).display === 'inline';
      const rects = (inline ? [...e.getClientRects()] : [e.getBoundingClientRect()])
        .map((r) => clipped(e, r))
        .filter((r) => r.right - r.left > 1 && r.bottom - r.top > 1);
      if (rects.length > 0) boxes.push({ el: e, rects });
    }

    const problems: string[] = [];
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i]!;
        const b = boxes[j]!;
        if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
        if (scope && !a.el.closest(scope) && !b.el.closest(scope)) continue;
        let worst = 0;
        for (const ra of a.rects)
          for (const rb of b.rects) {
            const c = cut(ra, rb);
            worst = Math.max(worst, Math.min(c.right - c.left, c.bottom - c.top));
          }
        if (worst > 0.5)
          problems.push(`${name(a.el)} overlaps ${name(b.el)} by ${Math.round(worst)} px`);
      }
    }
    return problems;
  }, scope);
}

/** The top line of the pages for adults (ErwachsenenKopf). */
export const KOPF = '[data-region="kopf"]';

/** What `kopfMetrics` measures; rounded px. */
export interface KopfMetrics {
  height: number;
  top: number;
  bottom: number;
  /** Top of what follows the Kopf (the scroll box with the text, or the sheet). */
  next: number;
  middles: number;
  minGap: number;
  smallest: number;
}

/**
 * The top line of the pages for adults (ErwachsenenKopf, data-region="kopf", task N), measured
 * like the Kopf of the Probetest (headerMetrics in probetest-layout): "Zurück" and every link in
 * one row means their middles at most 12 px apart and a gap above 0 from each to the next.
 */
export async function kopfMetrics(page: Page): Promise<KopfMetrics> {
  return page.evaluate(() => {
    const kopf = document.querySelector('[data-region="kopf"]')!;
    const box = kopf.getBoundingClientRect();
    const links = [...kopf.querySelectorAll('a')].map((a) => a.getBoundingClientRect());
    const mids = links.map((b) => b.top + b.height / 2);
    return {
      height: Math.round(box.height),
      top: Math.round(box.top),
      bottom: Math.round(box.bottom),
      next: Math.round(kopf.nextElementSibling!.getBoundingClientRect().top),
      middles: Math.round(Math.max(...mids) - Math.min(...mids)),
      minGap: Math.round(Math.min(...links.slice(1).map((b, i) => b.left - links[i]!.right))),
      smallest: Math.round(Math.min(...links.map((b) => Math.min(b.width, b.height)))),
    };
  });
}

/** The criterion of task N for the Kopf; `before` is the Kopf before scrolling, if any. */
export function kopfProblems(m: KopfMetrics, before?: KopfMetrics): string[] {
  return [
    m.middles > 12 && `Kopf in more than one row (middles ${m.middles} px apart)`,
    m.minGap <= 0 && `links in the Kopf touch or wrap (gap ${m.minGap} px)`,
    m.smallest < 48 && `a link in the Kopf is only ${m.smallest} px`,
    m.next < m.bottom && `the text begins ${m.bottom - m.next} px under the Kopf`,
    before && m.top !== before.top && `the Kopf moved from ${before.top} to ${m.top} px`,
  ].filter((p): p is string => typeof p === 'string');
}

/** The numbers of the Kopf for a budget file. */
export const kopfBudget = ({ height, middles, minGap, smallest }: KopfMetrics) => ({
  height,
  middles,
  minGap,
  smallest,
});
