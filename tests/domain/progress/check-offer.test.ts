import { describe, expect, it } from 'vitest';
import { checkOfferFach, isCheckOffered } from '../../../src/domain/progress';

describe('Einstiegscheck offer', () => {
  it('is offered for a Fach without mastery and with at least 2 practiceable Bereiche', () => {
    expect(isCheckOffered('mathe', ['zahlen-operationen', 'raum-form'], [])).toBe(true);
    expect(checkOfferFach(['zahlen-operationen', 'raum-form'], [])).toBe('mathe');
  });

  it('is not offered with a single practiceable Bereich (Deutsch for now)', () => {
    expect(isCheckOffered('deutsch', ['zahlen-operationen', 'rs-strategien'], [])).toBe(false);
    expect(checkOfferFach(['zahlen-operationen', 'rs-strategien'], [])).toBeNull();
  });

  it('is never offered again once the Fach has any mastery state', () => {
    const bereiche = [
      'zahlen-operationen',
      'raum-form',
      'lesen-sachtext',
      'rs-strategien',
    ] as const;
    expect(checkOfferFach(bereiche, [{ fach: 'mathe' }])).toBe('deutsch');
    expect(checkOfferFach(bereiche, [{ fach: 'mathe' }, { fach: 'deutsch' }])).toBeNull();
  });

  it('offers Mathe first when both Fächer qualify', () => {
    expect(
      checkOfferFach(['lesen-sachtext', 'rs-strategien', 'zahlen-operationen', 'raum-form'], []),
    ).toBe('mathe');
  });
});
