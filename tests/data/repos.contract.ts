// Contract suite for every Repositories implementation (in-memory and Dexie).

import { beforeEach, describe, expect, it } from 'vitest';
import type { Attempt, ReviewEntry, Session } from '../../src/domain/learner';
import type { Repositories } from '../../src/data/repos';
import { sampleLearnerData } from '../fixtures/learner';

export function repositoryContract(
  name: string,
  create: () => Repositories | Promise<Repositories>,
) {
  describe(`Repositories contract: ${name}`, () => {
    let repos: Repositories;
    const data = sampleLearnerData();
    const learnerId = data.learner.id;
    const attempt = (id: string, at: string, overrides: Partial<Attempt> = {}): Attempt => ({
      ...data.attempts[0]!,
      id,
      at,
      ...overrides,
    });

    beforeEach(async () => {
      repos = await create();
    });

    it('stores learners and lists them oldest first', async () => {
      const younger = { ...data.learner, id: 'learner-2', createdAt: '2026-10-12T08:00:00.000Z' };
      await repos.learners.put(younger);
      await repos.learners.put(data.learner);
      expect(await repos.learners.get(learnerId)).toEqual(data.learner);
      expect((await repos.learners.list()).map((l) => l.id)).toEqual([learnerId, 'learner-2']);
      expect(await repos.learners.get('missing')).toBeUndefined();
    });

    it('returns copies: mutating a result does not change stored data', async () => {
      await repos.learners.put(data.learner);
      const loaded = (await repos.learners.get(learnerId))!;
      loaded.settings.readAloud = false;
      expect((await repos.learners.get(learnerId))!.settings.readAloud).toBe(true);
    });

    it('lists attempts per learner and per Bereich, oldest first', async () => {
      await repos.attempts.put(attempt('a3', '2026-10-11T08:03:00.000Z'));
      await repos.attempts.put(attempt('a1', '2026-10-11T08:01:00.000Z'));
      await repos.attempts.put(
        attempt('a2', '2026-10-11T08:02:00.000Z', {
          itemId: 'm-gm-2-904',
          bereich: 'groessen-messen',
          format: 'single-choice',
          answer: { optionId: 'a' },
        }),
      );
      await repos.attempts.put(attempt('other', '2026-10-11T08:00:00.000Z', { learnerId: 'x' }));

      expect((await repos.attempts.listByLearner(learnerId)).map((a) => a.id)).toEqual([
        'a1',
        'a2',
        'a3',
      ]);
      expect(
        (await repos.attempts.listByBereich(learnerId, 'zahlen-operationen')).map((a) => a.id),
      ).toEqual(['a1', 'a3']);
      expect(await repos.attempts.get('a2')).toMatchObject({ bereich: 'groessen-messen' });
    });

    it('keeps one mastery state per learner and Bereich', async () => {
      const state = data.mastery[0]!;
      await repos.mastery.put(state);
      await repos.mastery.put({ ...state, niveau: 2, window: [] });
      await repos.mastery.put({ ...state, bereich: 'raum-form' });
      await repos.mastery.put({ ...state, learnerId: 'x' });
      expect(await repos.mastery.get(learnerId, 'zahlen-operationen')).toMatchObject({ niveau: 2 });
      expect(await repos.mastery.get(learnerId, 'daten-zufall')).toBeUndefined();
      expect((await repos.mastery.listByLearner(learnerId)).map((m) => m.bereich).sort()).toEqual([
        'raum-form',
        'zahlen-operationen',
      ]);
    });

    it('keeps one Fehlerkiste entry per item and finds entries due before a cutoff', async () => {
      const entry = (itemId: string, dueAt: string, owner = learnerId): ReviewEntry => ({
        learnerId: owner,
        itemId,
        dueAt,
        stage: 1,
      });
      await repos.reviews.put(entry('m-zo-1-904', '2026-10-13T08:00:00.000Z'));
      await repos.reviews.put(entry('m-zo-1-903', '2026-10-12T09:00:00.000Z'));
      await repos.reviews.put(entry('m-zo-1-903', '2026-10-12T08:00:00.000Z'));
      await repos.reviews.put(entry('m-zo-1-905', '2026-10-14T08:00:00.000Z'));
      await repos.reviews.put(entry('m-zo-1-906', '2026-10-12T07:00:00.000Z', 'x'));

      expect(await repos.reviews.get(learnerId, 'm-zo-1-903')).toMatchObject({
        dueAt: '2026-10-12T08:00:00.000Z',
      });
      expect(await repos.reviews.listByLearner(learnerId)).toHaveLength(3);
      const due = await repos.reviews.listDueBefore(learnerId, '2026-10-14T08:00:00.000Z');
      expect(due.map((r) => r.itemId)).toEqual(['m-zo-1-903', 'm-zo-1-904']);
    });

    it('lists sessions and probetest runs oldest first', async () => {
      const session = (id: string, startedAt: string): Session => ({
        ...data.sessions[0]!,
        id,
        startedAt,
      });
      await repos.sessions.put(session('s2', '2026-10-12T08:00:00.000Z'));
      await repos.sessions.put(session('s1', '2026-10-11T08:00:00.000Z'));
      await repos.sessions.put({ ...session('s0', '2026-10-10T08:00:00.000Z'), learnerId: 'x' });
      expect((await repos.sessions.listByLearner(learnerId)).map((s) => s.id)).toEqual([
        's1',
        's2',
      ]);
      expect(await repos.sessions.get('s2')).toMatchObject({ id: 's2' });

      const run = data.probetestRuns[0]!;
      await repos.probetestRuns.put({ ...run, id: 'r2', startedAt: '2026-10-12T08:00:00.000Z' });
      await repos.probetestRuns.put(run);
      expect((await repos.probetestRuns.listByLearner(learnerId)).map((p) => p.id)).toEqual([
        'run-1',
        'r2',
      ]);
      expect(await repos.probetestRuns.get('run-1')).toEqual(run);
    });

    it("overwrites a probetest run on put and lists only the learner's runs", async () => {
      const run = data.probetestRuns[0]!;
      const { endedAt: _e, endReason: _r, result: _res, ...rest } = run;
      await repos.probetestRuns.put({ ...rest, status: 'running', answers: {} });
      await repos.probetestRuns.put({ ...run, id: 'other', learnerId: 'learner-2' });
      await repos.probetestRuns.put(run);
      expect(await repos.probetestRuns.get('run-1')).toEqual(run);
      expect((await repos.probetestRuns.listByLearner(learnerId)).map((p) => p.id)).toEqual([
        'run-1',
      ]);
    });

    it('stores collectibles per learner', async () => {
      await repos.collectibles.put({ learnerId, unlocked: ['zo-1'] });
      await repos.collectibles.put({ learnerId, unlocked: ['zo-1', 'zo-2'] });
      expect(await repos.collectibles.get(learnerId)).toEqual({
        learnerId,
        unlocked: ['zo-1', 'zo-2'],
      });
      expect(await repos.collectibles.get('x')).toBeUndefined();
    });

    it('commits a transaction and returns its value', async () => {
      const value = await repos.transaction(async () => {
        await repos.learners.put(data.learner);
        return 42;
      });
      expect(value).toBe(42);
      expect(await repos.learners.get(learnerId)).toBeDefined();
    });

    it('keeps no write of a failed transaction', async () => {
      await repos.learners.put(data.learner);
      await expect(
        repos.transaction(async () => {
          await repos.attempts.put(attempt('a1', '2026-10-11T08:01:00.000Z'));
          await repos.clear();
          throw new Error('boom');
        }),
      ).rejects.toThrow('boom');
      expect(await repos.learners.get(learnerId)).toBeDefined();
      expect(await repos.attempts.get('a1')).toBeUndefined();
    });

    it('keeps one postponed offer per Fach', async () => {
      await repos.postponedOffers.put({ fach: 'mathe', at: '2026-10-13T08:00:00.000Z' });
      await repos.postponedOffers.put({ fach: 'deutsch', at: '2026-10-13T09:00:00.000Z' });
      await repos.postponedOffers.put({ fach: 'mathe', at: '2026-10-14T08:00:00.000Z' });
      const offers = await repos.postponedOffers.list();
      expect(offers.sort((a, b) => a.fach.localeCompare(b.fach))).toEqual([
        { fach: 'deutsch', at: '2026-10-13T09:00:00.000Z' },
        { fach: 'mathe', at: '2026-10-14T08:00:00.000Z' },
      ]);
    });

    it('clears everything', async () => {
      await repos.learners.put(data.learner);
      await repos.attempts.put(attempt('a1', '2026-10-11T08:01:00.000Z'));
      await repos.collectibles.put(data.collectibles);
      await repos.postponedOffers.put({ fach: 'mathe', at: '2026-10-14T08:00:00.000Z' });
      await repos.clear();
      expect(await repos.learners.list()).toEqual([]);
      expect(await repos.attempts.listByLearner(learnerId)).toEqual([]);
      expect(await repos.collectibles.get(learnerId)).toBeUndefined();
      expect(await repos.postponedOffers.list()).toEqual([]);
    });
  });
}
