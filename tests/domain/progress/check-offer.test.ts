import { describe, expect, it } from 'vitest';
import {
  checkOfferFach,
  isCheckOffered,
  mapOffer,
  offerSpentToday,
} from '../../../src/domain/progress';

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

describe('one offer a day (offerSpentToday)', () => {
  // Berlin is UTC+2 in October: 21:59Z is 23:59 local, 22:01Z is 00:01 the next day.
  const offer = { fach: 'mathe', at: '2026-10-14T06:00:00.000Z' } as const;
  const spent = (now: string, day?: string) => offerSpentToday({ offers: [offer], now, day });

  it('"Später" holds for the rest of the local day', () => {
    expect(spent('2026-10-14T06:00:00.000Z')).toBe(true);
    expect(spent('2026-10-14T21:59:00.000Z')).toBe(true);
  });

  it('"Später" is over from midnight on, local time', () => {
    expect(spent('2026-10-14T22:01:00.000Z')).toBe(false);
    expect(spent('2026-10-16T06:00:00.000Z')).toBe(false);
  });

  it('"Später" holds past midnight while a round of that day still runs (day = practiceDay)', () => {
    // 00:30 on the 15th, the round began at 23:40 on the 14th.
    const roundStart = '2026-10-14T21:40:00.000Z';
    expect(spent('2026-10-14T22:30:00.000Z', roundStart)).toBe(true);
    // "Später" tapped after midnight holds too, whatever the round.
    const late = { fach: 'mathe', at: '2026-10-14T22:10:00.000Z' } as const;
    expect(
      offerSpentToday({ offers: [late], now: '2026-10-14T22:30:00.000Z', day: roundStart }),
    ).toBe(true);
  });

  it('"Später" for Mathe spends the day for Deutsch too', () => {
    const bereiche = [
      'zahlen-operationen',
      'raum-form',
      'rs-laut-buchstabe',
      'rs-strategien',
    ] as const;
    // Mathe has a mastery state now (practised after "Später"): Deutsch would be next.
    const mastery = [{ fach: 'mathe' }] as const;
    const now = '2026-10-14T08:00:00.000Z';
    expect(
      mapOffer({
        practiceable: bereiche,
        mastery,
        todayCount: 0,
        spent: offerSpentToday({ offers: [offer], now }),
      }),
    ).toBeNull();
    // The next morning Deutsch is offered.
    const next = '2026-10-15T06:00:00.000Z';
    expect(
      mapOffer({
        practiceable: bereiche,
        mastery,
        todayCount: 0,
        spent: offerSpentToday({ offers: [offer], now: next }),
      }),
    ).toBe('deutsch');
  });

  it('a finished Einstieg spends the day, one of yesterday does not', () => {
    const check = { mode: 'check', endedAt: '2026-10-14T07:00:00.000Z' } as const;
    expect(
      offerSpentToday({ offers: [], sessions: [check], now: '2026-10-14T09:00:00.000Z' }),
    ).toBe(true);
    expect(
      offerSpentToday({ offers: [], sessions: [check], now: '2026-10-15T06:00:00.000Z' }),
    ).toBe(false);
  });

  it('an Einstieg without an end and a practice round spend nothing', () => {
    const now = '2026-10-14T09:00:00.000Z';
    const sessions = [
      { mode: 'check' },
      { mode: 'practice', endedAt: '2026-10-14T08:00:00.000Z' },
    ] as const;
    expect(offerSpentToday({ offers: [], sessions, now })).toBe(false);
  });
});

describe('the offer and the Tagesziel (mapOffer)', () => {
  const practiceable = ['zahlen-operationen', 'raum-form'] as const;

  it('offers the first Fach while today has no Fundstück and nothing is spent', () => {
    expect(mapOffer({ practiceable, mastery: [], todayCount: 0, spent: false })).toBe('mathe');
  });

  it('never takes the Tagesziel line: no offer from the first Fundstück on, nor at the goal', () => {
    expect(mapOffer({ practiceable, mastery: [], todayCount: 1, spent: false })).toBeNull();
    expect(mapOffer({ practiceable, mastery: [], todayCount: 10, spent: false })).toBeNull();
  });

  it('offers nothing once the day is spent', () => {
    expect(mapOffer({ practiceable, mastery: [], todayCount: 0, spent: true })).toBeNull();
  });
});
