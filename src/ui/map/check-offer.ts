// "Später" on the Einstieg offer: hidden for this run of the app, back after the next start
// (PRODUCT.md §5.4). Kept in the module, not in storage, on purpose.

import type { Fach } from '../../domain/content/taxonomy';

const postponed = new Set<Fach>();

export function isOfferPostponed(fach: Fach): boolean {
  return postponed.has(fach);
}

export function postponeOffer(fach: Fach): void {
  postponed.add(fach);
}

/** Tests only: a fresh app run. */
export function resetPostponedOffers(): void {
  postponed.clear();
}
