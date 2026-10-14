// Answers whatever item is on screen through the UI, like a child would tap (any answer will do),
// and presses the band button. Used by flow tests where the scheduler picks the formats; they
// await preloadFormats() first, because a renderer chunk that suspends inside the synchronous act()
// of render() is never resumed in jsdom (the browser resumes it).

import { screen, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';

const enabled = (el: HTMLElement) =>
  !(el as HTMLButtonElement).disabled && el.getAttribute('aria-disabled') !== 'true';

/** Gives some answer and submits it ("Prüfen", or for a short answer "Vergleichen" + rating). */
export async function answerOnScreen(user: UserEvent, submitLabel = 'Prüfen'): Promise<void> {
  const radios = screen.queryAllByRole('radio');
  const boxes = screen.queryAllByRole('checkbox');
  const field = screen.queryByRole('textbox', { name: 'Deine Antwort' });
  const words = screen.queryByRole('group', { name: /zum Antippen$/ });

  if (field) {
    await user.type(field, '4 und 2');
    await user.click(screen.getByRole('button', { name: 'Vergleichen' }));
    await user.click(screen.getByRole('button', { name: 'Teils' }));
    return;
  }
  if (radios.length > 0) {
    await user.click(radios[0]!);
  } else if (boxes.length > 0) {
    for (const box of boxes) if (enabled(box)) await user.click(box);
  } else if (screen.queryByRole('group', { name: 'Ziffernblock' })) {
    await user.click(screen.getByRole('button', { name: '1' }));
  } else if (words) {
    await user.click(within(words).getAllByRole('button')[0]!);
  } else if (screen.queryAllByRole('button', { name: /nach unten$/ }).length > 0) {
    await user.click(screen.getAllByRole('button', { name: /nach unten$/ })[0]!);
  } else if (screen.queryAllByRole('button', { name: /^Lücke \d+:/ }).length > 0) {
    let group;
    while ((group = screen.queryByRole('group', { name: /^Antworten für Lücke/ }))) {
      await user.click(within(group).getAllByRole('button')[0]!);
    }
  } else {
    // match: fill every empty slot with the first card of the pool.
    let slot;
    while ((slot = screen.queryAllByRole('button', { name: /^Feld für / })[0])) {
      await user.click(slot);
      await user.click(
        within(screen.getByRole('group', { name: 'Antworten' })).getAllByRole('button')[0]!,
      );
    }
  }
  await user.click(screen.getByRole('button', { name: submitLabel }));
}
