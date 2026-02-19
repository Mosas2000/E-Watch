import { describe, it, expect } from 'vitest';
import {
  computeVoteSummary,
  PROPOSAL_CATEGORIES,
} from '../src/types/governance';

describe('governance types', () => {
  describe('computeVoteSummary', () => {
    it('returns zero percentages when no votes have been cast', () => {
      const summary = computeVoteSummary(0, 0, 5);
      expect(summary.totalVotes).toBe(0);
      expect(summary.percentFor).toBe(0);
      expect(summary.percentAgainst).toBe(0);
      expect(summary.quorumReached).toBe(false);
    });

    it('calculates percentages for a split vote', () => {
      const summary = computeVoteSummary(3, 1, 5);
      expect(summary.totalVotes).toBe(4);
      expect(summary.percentFor).toBe(75);
      expect(summary.percentAgainst).toBe(25);
      expect(summary.quorumReached).toBe(false);
    });

    it('marks quorum as reached when total meets threshold', () => {
      const summary = computeVoteSummary(4, 2, 5);
      expect(summary.quorumReached).toBe(true);
    });

    it('handles unanimous approval', () => {
      const summary = computeVoteSummary(10, 0, 5);
      expect(summary.percentFor).toBe(100);
      expect(summary.percentAgainst).toBe(0);
    });

    it('handles unanimous rejection', () => {
      const summary = computeVoteSummary(0, 8, 5);
      expect(summary.percentFor).toBe(0);
      expect(summary.percentAgainst).toBe(100);
    });
  });

  describe('PROPOSAL_CATEGORIES', () => {
    it('contains at least four categories', () => {
      expect(PROPOSAL_CATEGORIES.length).toBeGreaterThanOrEqual(4);
    });

    it('each entry has a value and label', () => {
      PROPOSAL_CATEGORIES.forEach((cat) => {
        expect(cat.value).toBeTruthy();
        expect(cat.label).toBeTruthy();
      });
    });

    it('includes the feature category', () => {
      const feature = PROPOSAL_CATEGORIES.find((c) => c.value === 'feature');
      expect(feature).toBeDefined();
    });
  });
});
