// Test fixture: a small but complete learner history. NOT app data.

import type { LearnerData } from '../../src/domain/learner';

export function sampleLearnerData(): LearnerData {
  const learnerId = 'learner-1';
  return {
    learner: {
      id: learnerId,
      name: 'Tochter',
      createdAt: '2026-10-11T08:00:00.000Z',
      settings: { readAloud: true, bundesland: 'BW' },
    },
    attempts: [
      {
        id: 'att-1',
        learnerId,
        itemId: 'm-zo-1-001',
        fach: 'mathe',
        bereich: 'zahlen-operationen',
        niveau: 1,
        format: 'number-input',
        correct: true,
        answer: { value: 7603 },
        durationMs: 41000,
        mode: 'practice',
        at: '2026-10-11T08:01:00.000Z',
      },
      {
        id: 'att-2',
        learnerId,
        itemId: 'm-gm-2-004',
        fach: 'mathe',
        bereich: 'groessen-messen',
        niveau: 2,
        format: 'single-choice',
        correct: false,
        answer: { optionId: 'd' },
        durationMs: 63000,
        mode: 'practice',
        at: '2026-10-11T08:02:30.000Z',
      },
      {
        id: 'att-3',
        learnerId,
        itemId: 'm-zo-3-002',
        fach: 'mathe',
        bereich: 'zahlen-operationen',
        niveau: 3,
        format: 'short-answer',
        correct: 0.5,
        answer: { text: 'Nein, weil …', rating: 0.5 },
        durationMs: 95000,
        mode: 'probetest',
        at: '2026-10-11T09:00:00.000Z',
      },
    ],
    mastery: [
      {
        learnerId,
        fach: 'mathe',
        bereich: 'zahlen-operationen',
        niveau: 1,
        window: [1],
        mastered: false,
        updatedAt: '2026-10-11T08:01:00.000Z',
      },
    ],
    reviews: [{ learnerId, itemId: 'm-gm-2-004', dueAt: '2026-10-12T08:02:30.000Z', stage: 1 }],
    sessions: [
      {
        id: 'ses-1',
        learnerId,
        mode: 'practice',
        startedAt: '2026-10-11T08:00:30.000Z',
        endedAt: '2026-10-11T08:05:00.000Z',
        attemptIds: ['att-1', 'att-2'],
        goalReached: false,
      },
    ],
    probetestRuns: [
      {
        id: 'run-1',
        learnerId,
        probetestId: 'mathe-01',
        startedAt: '2026-10-11T08:59:00.000Z',
        status: 'submitted',
        endedAt: '2026-10-11T09:40:00.000Z',
        endReason: 'submit',
        currentIndex: 0,
        answers: { 'm-zo-3-002': { text: 'Nein, weil …' } },
        itemMs: { 'm-zo-3-002': 95000 },
        attemptIndex: { 'm-zo-3-002': 0 },
        ratings: { 'm-zo-3-002': 0.5 },
        attemptIds: ['att-3'],
        result: {
          byBereich: { 'zahlen-operationen': { solved: 0, total: 1, pending: 0 } },
          total: { solved: 0, total: 1, pending: 0 },
        },
      },
    ],
    collectibles: { learnerId, unlocked: [] },
  };
}
