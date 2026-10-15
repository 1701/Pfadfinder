import { describe, expect, it } from 'vitest';
import { BEREICHE, type Bereich } from '../../../src/domain/content';
import type { ContentManifest } from '../../../src/domain/content/manifest';
import {
  completedEtappe,
  etappeId,
  mapRegionState,
  type RegionState,
} from '../../../src/domain/progress';

const FORMATS = ['single-choice', 'number-input'] as const;

/** Manifest with `n` single-choice items in the given Bereiche, none elsewhere. */
function manifest(
  counts: Partial<Record<Bereich, number>>,
  format = 'single-choice',
): ContentManifest {
  const bereiche = {} as ContentManifest['bereiche'];
  for (const b of BEREICHE) {
    const n = counts[b] ?? 0;
    bereiche[b] = {
      fach: b.startsWith('lesen') || b.startsWith('rs') ? 'deutsch' : 'mathe',
      items: n,
      byFormat: n ? { [format]: { 1: n, 2: 0, 3: 0 } } : {},
      textIds: [],
    };
  }
  return { bereiche, probetests: { mathe: [], deutsch: [] } };
}

const ZO = 'zahlen-operationen' as const;
const open = manifest({ [ZO]: 10, 'raum-form': 15 });

describe('mapRegionState', () => {
  it('marks Gebiete with fewer than 10 practiceable items as unerforscht', () => {
    const states = mapRegionState(manifest({ [ZO]: 9, 'raum-form': 10 }), [], [], FORMATS);
    expect(states[ZO]).toEqual({ kind: 'unerforscht' });
    expect(states['raum-form'].kind).toBe('neu');
    expect(Object.keys(states)).toEqual([...BEREICHE]);
  });

  it('counts only formats with a renderer', () => {
    const states = mapRegionState(manifest({ [ZO]: 20 }, 'order'), [], [], FORMATS);
    expect(states[ZO]).toEqual({ kind: 'unerforscht' });
  });

  it('starts a Gebiet without mastery on niveau 1 with no Etappe reached', () => {
    expect(mapRegionState(open, [], [], FORMATS)[ZO]).toEqual({
      kind: 'neu',
      niveau: 1,
      erschlossen: [false, false, false],
    });
  });

  it('shows a Gebiet in progress with the Etappen below its niveau reached', () => {
    const states = mapRegionState(open, [{ bereich: ZO, niveau: 2, mastered: false }], [], FORMATS);
    expect(states[ZO]).toEqual<RegionState>({
      kind: 'unterwegs',
      niveau: 2,
      erschlossen: [true, false, false],
    });
  });

  it('keeps an Etappe reached after the niveau sinks again (Entdeckung)', () => {
    const states = mapRegionState(
      open,
      [{ bereich: ZO, niveau: 1, mastered: false }],
      [etappeId(ZO, 1), etappeId(ZO, 2), etappeId('raum-form', 1)],
      FORMATS,
    );
    expect(states[ZO]).toEqual({ kind: 'unterwegs', niveau: 1, erschlossen: [true, true, false] });
    // An Entdeckung of another Gebiet does not count here; without mastery it stays neu.
    expect(states['raum-form'].kind).toBe('neu');
  });

  it('shows a mastered Gebiet with all three Etappen, even after the niveau sank', () => {
    const states = mapRegionState(open, [{ bereich: ZO, niveau: 2, mastered: true }], [], FORMATS);
    expect(states[ZO]).toEqual({ kind: 'gemeistert', niveau: 2, erschlossen: [true, true, true] });
  });

  it('shows an unerforscht Gebiet as unerforscht even with old progress', () => {
    const states = mapRegionState(
      manifest({}),
      [{ bereich: ZO, niveau: 3, mastered: true }],
      [],
      FORMATS,
    );
    expect(states[ZO]).toEqual({ kind: 'unerforscht' });
  });
});

describe('completedEtappe', () => {
  it('names the Etappe a transition completes', () => {
    expect(completedEtappe('level-up', 1)).toBe(1);
    expect(completedEtappe('level-up', 2)).toBe(2);
    expect(completedEtappe('mastered', 3)).toBe(3);
    expect(completedEtappe('level-down', 2)).toBeUndefined();
    expect(completedEtappe('none', 1)).toBeUndefined();
  });
});
