import { useState, useEffect, useCallback } from 'react';
import {
  getProposal,
  getProposalCount,
  getVote,
  getVoterHistory,
  Proposal,
  VoterHistory,
} from '../services/governanceService';
import { useApp } from '../contexts/AppContext';

/**
 * Hook that loads all proposals and the connected user's voting history.
 * Provides helpers to refresh data after a vote or submission.
 */
export function useGovernance() {
  const { userAddress } = useApp();

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [voterHistory, setVoterHistory] = useState<VoterHistory>({ totalVotes: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadProposals = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const count = await getProposalCount();
      const loaded: Proposal[] = [];
      for (let i = 0; i < count; i++) {
        const p = await getProposal(i);
        if (p) loaded.push(p);
      }
      setProposals(loaded);
    } catch (err: any) {
      setError(err.message || 'Failed to load proposals');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadVoterHistory = useCallback(async () => {
    if (!userAddress) return;
    try {
      const history = await getVoterHistory(userAddress);
      setVoterHistory(history);
    } catch {
      // Voter may not have history yet, which is fine
    }
  }, [userAddress]);

  const checkUserVote = useCallback(
    async (proposalId: number): Promise<boolean | null> => {
      if (!userAddress) return null;
      const vote = await getVote(proposalId, userAddress);
      return vote ? vote.inFavor : null;
    },
    [userAddress],
  );

  const refresh = useCallback(async () => {
    await Promise.all([loadProposals(), loadVoterHistory()]);
  }, [loadProposals, loadVoterHistory]);

  useEffect(() => {
    loadProposals();
  }, [loadProposals]);

  useEffect(() => {
    loadVoterHistory();
  }, [loadVoterHistory]);

  return {
    proposals,
    voterHistory,
    loading,
    error,
    refresh,
    checkUserVote,
  };
}
