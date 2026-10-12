// State of each Gebiet on the map (PRODUCT.md §6): three Etappen per Gebiet (= Niveaus).
// An Etappe once reached stays reached ("keine Abzüge"): besides the current niveau, the
// Entdeckungen in Collectibles remember it after the niveau sinks again.
// Zod-free on purpose: the start page computes this.

import type { ContentManifest } from '../content/manifest';
import { countItems } from '../content/manifest';
import { BEREICHE, type Bereich } from '../content/taxonomy';
import type { Format, Niveau } from '../content/types';
import type { MasteryState, MasteryTransition } from '../mastery/mastery';
import { MIN_ITEMS_FOR_PRACTICE } from '../scheduler/practiceable';

/** Id of the Entdeckung for one Etappe, stored in Collectibles.unlocked. */
export function etappeId(bereich: Bereich, etappe: Niveau): string {
  return `${bereich}:${etappe}`;
}

/**
 * The Etappe completed by a mastery transition: a level-up from n completes Etappe n,
 * "mastered" completes Etappe 3. Undefined for every other transition.
 */
export function completedEtappe(
  transition: MasteryTransition,
  niveauBefore: Niveau,
): Niveau | undefined {
  if (transition === 'level-up') return niveauBefore;
  if (transition === 'mastered') return 3;
  return undefined;
}

export type Etappen = readonly [boolean, boolean, boolean];

export type RegionState =
  /** Fewer than MIN_ITEMS_FOR_PRACTICE practiceable items: shown, not selectable. */
  | { kind: 'unerforscht' }
  | {
      /** neu: never practised; unterwegs: has a mastery state; gemeistert: Etappe 3 done. */
      kind: 'neu' | 'unterwegs' | 'gemeistert';
      niveau: Niveau;
      /** Etappe I–III reached (index 0–2). */
      erschlossen: Etappen;
    };

export function mapRegionState(
  manifest: ContentManifest,
  mastery: readonly Pick<MasteryState, 'bereich' | 'niveau' | 'mastered'>[],
  unlocked: readonly string[],
  supportedFormats: readonly Format[],
): Record<Bereich, RegionState> {
  const found = new Set(unlocked);
  const states = {} as Record<Bereich, RegionState>;
  for (const bereich of BEREICHE) {
    if (countItems(manifest.bereiche[bereich], supportedFormats) < MIN_ITEMS_FOR_PRACTICE) {
      states[bereich] = { kind: 'unerforscht' };
      continue;
    }
    const state = mastery.find((m) => m.bereich === bereich);
    if (!state) {
      // Without a mastery state a Gebiet starts on niveau 1 (initialMastery).
      states[bereich] = { kind: 'neu', niveau: 1, erschlossen: [false, false, false] };
      continue;
    }
    const reached = (etappe: Niveau) =>
      state.mastered || state.niveau > etappe || found.has(etappeId(bereich, etappe));
    states[bereich] = {
      kind: state.mastered ? 'gemeistert' : 'unterwegs',
      niveau: state.niveau,
      erschlossen: [reached(1), reached(2), reached(3)],
    };
  }
  return states;
}
