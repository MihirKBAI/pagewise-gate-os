import { describe, it, expect } from 'vitest';
import { QUESTION_BANK, diagnoseAnswer } from '../core/questions/questionBank';

describe('Question Bank & Diagnostic Solver Integrity (Section 11.4)', () => {
  it('contains at least 20 comprehensive questions covering all 6 topics', () => {
    expect(QUESTION_BANK.length).toBeGreaterThanOrEqual(20);

    const topicsCovered = new Set(QUESTION_BANK.map((q) => q.topicId));
    expect(topicsCovered.has('page-replacement')).toBe(true);
    expect(topicsCovered.has('banker')).toBe(true);
    expect(topicsCovered.has('rag')).toBe(true);
    expect(topicsCovered.has('paging')).toBe(true);
    expect(topicsCovered.has('sync')).toBe(true);
    expect(topicsCovered.has('vm')).toBe(true);
  });

  it('correctly validates the stored answer for every question', () => {
    for (const q of QUESTION_BANK) {
      let correctInput = '';
      if (q.type === 'NAT') {
        correctInput = String(q.answer);
      } else if (q.type === 'MCQ') {
        correctInput = String(q.answer);
      } else if (q.type === 'SEQUENCE') {
        correctInput = (q.answer as string[]).join(', ');
      }

      const res = diagnoseAnswer(q, correctInput);
      expect(res.isCorrect).toBe(true);
    }
  });

  it('correctly fires distractor diagnoses for known misconceptions', () => {
    for (const q of QUESTION_BANK) {
      if (q.type === 'NAT' && q.distractors.length > 0) {
        for (const distractor of q.distractors) {
          const res = diagnoseAnswer(q, String(distractor.value));
          expect(res.isCorrect).toBe(false);
          expect(res.diagnosisText).toContain(distractor.diagnosis);
        }
      }
    }
  });
});
