// The printed Probetest (PRODUCT.md §5.4, /probetest/:id/print): a task sheet like a paper test
// (number, stimulus, picture black on white, answer box or options to tick, paper forms of
// match/order/cloze), then the solution sheet on a page of its own. Only by URL, no link on a
// child's screen; no app frame, no Vorlesen. On screen a "Drucken" button stands above the sheet.
// A reading text stands before its items, with its title and numbered paragraphs (items refer to
// paragraphs); every further text starts on a new page (task 13).

import type { Item, Probetest, ReadingText } from '../../domain/content';
import { Button } from '../components/Button';
import { ContentAsset } from '../components/ContentAsset';
import { FACH_NAME } from '../text/bereiche';
import { keepNumbersWithWords as nb } from '../text/numbers';
import { PRINT, PRINT_NAME, PRINT_SOLUTIONS, printTitle } from '../text/probetest';
import { papierAufgabe, papierLoesung } from './papier';

function Aufgabe({ item, number }: { item: Item; number: number }) {
  const { text, assetId, assetAlt = '' } = item.stimulus ?? {};
  return (
    <li className="druck-aufgabe" data-item={item.id}>
      <b>{number}</b>
      <div>
        {text && <p>{nb(text)}</p>}
        {assetId && <ContentAsset assetId={assetId} alt={assetAlt} />}
        <p className="font-bold">{nb(item.prompt)}</p>
        {papierAufgabe(item)}
      </div>
    </li>
  );
}

function Lesetext({ text }: { text: ReadingText }) {
  return (
    <section className="druck-text" data-text={text.id}>
      <h2 className="font-bold">{text.title}</h2>
      <ol>
        {text.paragraphs.map((paragraph, i) => (
          <li key={i} className="druck-absatz">
            <b>{i + 1}</b>
            <p>{paragraph}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

interface Block {
  text?: ReadingText;
  /** Index in the test of the block's first item. */
  start: number;
  items: Item[];
}

/** Consecutive items with the same text form a block, the text before them. */
function blocksOf(items: readonly Item[], texts: readonly ReadingText[]): Block[] {
  const blocks: Block[] = [];
  items.forEach((item, i) => {
    const textRef = item.stimulus?.textRef;
    const last = blocks.at(-1);
    if (last && last.text?.id === textRef) last.items.push(item);
    else blocks.push({ text: texts.find((t) => t.id === textRef), start: i, items: [item] });
  });
  return blocks;
}

export function Druckansicht({
  probetest,
  items,
  texts = [],
}: {
  probetest: Probetest;
  items: Item[];
  texts?: ReadingText[];
}) {
  const title = printTitle(FACH_NAME[probetest.fach], probetest.id);
  return (
    <div className="py-lg">
      <div className="nur-bildschirm mx-auto mb-md flex max-w-page justify-end px-lg">
        <Button variant="primary" onClick={() => window.print()}>
          {PRINT}
        </Button>
      </div>
      <article className="druck">
        <header className="druck-kopf">
          <h1 className="font-bold">{title}</h1>
          <span>
            {PRINT_NAME} <span className="druck-feld" />
          </span>
          <span>{probetest.durationMinutes} Minuten</span>
        </header>
        {blocksOf(items, texts).map((block) => (
          <div key={block.start} className="contents">
            {block.text && <Lesetext text={block.text} />}
            <ol start={block.start + 1}>
              {block.items.map((item, i) => (
                <Aufgabe key={item.id} item={item} number={block.start + i + 1} />
              ))}
            </ol>
          </div>
        ))}
        <section className="druck-loesungen">
          <header className="druck-kopf">
            <h2 className="font-bold">
              {PRINT_SOLUTIONS} · {title}
            </h2>
          </header>
          <ol className="grid gap-xs">
            {items.map((item, i) => (
              <li key={item.id} className="grid grid-cols-[2rem_1fr] gap-xs" data-loesung={item.id}>
                <b>{i + 1}</b>
                <span>{papierLoesung(item)}</span>
              </li>
            ))}
          </ol>
        </section>
      </article>
    </div>
  );
}
