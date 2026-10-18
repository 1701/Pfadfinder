import { describe, expect, it } from 'vitest';
import { checkOfferFach, isCheckOffered, postponedFaecher } from '../../../src/domain/progress';

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

describe('"Später" on the offer', () => {
  // Berlin is UTC+2 in October: 21:59Z is 23:59 local, 22:01Z is 00:01 the next day.
  const offer = { fach: 'mathe', at: '2026-10-14T06:00:00.000Z' } as const;

  it('holds for the rest of the local day', () => {
    expect(postponedFaecher([offer], '2026-10-14T06:00:00.000Z')).toEqual(['mathe']);
    expect(postponedFaecher([offer], '2026-10-14T21:59:00.000Z')).toEqual(['mathe']);
  });

  it('is over from midnight on, local time', () => {
    expect(postponedFaecher([offer], '2026-10-14T22:01:00.000Z')).toEqual([]);
    expect(postponedFaecher([offer], '2026-10-16T06:00:00.000Z')).toEqual([]);
  });

  it('holds past midnight while a round of that day still runs (day = practiceDay)', () => {
    // 00:30 on the 15th, the round began at 23:40 on the 14th.
    const roundStart = '2026-10-14T21:40:00.000Z';
    expect(postponedFaecher([offer], '2026-10-14T22:30:00.000Z', roundStart)).toEqual(['mathe']);
    // "Später" tapped after midnight holds too, whatever the round.
    const late = { fach: 'mathe', at: '2026-10-14T22:10:00.000Z' } as const;
    expect(postponedFaecher([late], '2026-10-14T22:30:00.000Z', roundStart)).toEqual(['mathe']);
  });

  it('keeps each Fach on its own', () => {
    const deutsch = { fach: 'deutsch', at: '2026-10-13T06:00:00.000Z' } as const;
    expect(postponedFaecher([offer, deutsch], '2026-10-14T08:00:00.000Z')).toEqual(['mathe']);
  });
});
