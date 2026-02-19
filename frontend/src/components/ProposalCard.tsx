import { useState, useEffect } from 'react';
import { Proposal, PROPOSAL_STATUS } from '../services/governanceService';
import { castVote, finalizeProposal, getVote } from '../services/governanceService';
import { computeVoteSummary } from '../types/governance';
import { useApp } from '../contexts/AppContext';

interface ProposalCardProps {
  proposal: Proposal;
  onVoted: () => void;
}

const QUORUM = 5;

export const ProposalCard = ({ proposal, onVoted }: ProposalCardProps) => {
  const { isAuthenticated, userAddress } = useApp();
  const [userVote, setUserVote] = useState<boolean | null>(null);
  const [voting, setVoting] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState('');

  const summary = computeVoteSummary(
    proposal.votesFor,
    proposal.votesAgainst,
    QUORUM,
  );

  useEffect(() => {
    if (!userAddress) return;
    getVote(proposal.id, userAddress)
      .then((v) => setUserVote(v ? v.inFavor : null))
      .catch(() => setUserVote(null));
  }, [proposal.id, userAddress]);

  const handleVote = async (inFavor: boolean) => {
    setError('');
    setVoting(true);
    try {
      await castVote(proposal.id, inFavor);
      setUserVote(inFavor);
      onVoted();
    } catch (err: any) {
      setError(err.message || 'Vote failed');
    } finally {
      setVoting(false);
    }
  };

  const handleFinalize = async () => {
    setError('');
    setFinalizing(true);
    try {
      await finalizeProposal(proposal.id);
      onVoted();
    } catch (err: any) {
      setError(err.message || 'Finalization failed');
    } finally {
      setFinalizing(false);
    }
  };

  const isOpen = proposal.status === 0;
  const statusLabel = PROPOSAL_STATUS[proposal.status] || 'Unknown';

  return (
    <article className="proposal-card" aria-label={`Proposal: ${proposal.title}`}>
      <div className="proposal-header">
        <h4 className="proposal-title">{proposal.title}</h4>
        <span className={`proposal-status status-${statusLabel.toLowerCase()}`}>
          {statusLabel}
        </span>
      </div>

      <span className="proposal-category">{proposal.category}</span>

      <p className="proposal-description">{proposal.description}</p>

      <div className="proposal-meta">
        <span>Proposed by: {proposal.proposer.slice(0, 8)}...{proposal.proposer.slice(-4)}</span>
        <span>Block {proposal.createdAt}</span>
      </div>

      <div className="vote-bar" role="img" aria-label={`${summary.percentFor}% in favor, ${summary.percentAgainst}% against`}>
        <div
          className="vote-bar-for"
          style={{ width: `${summary.percentFor}%` }}
        />
        <div
          className="vote-bar-against"
          style={{ width: `${summary.percentAgainst}%` }}
        />
      </div>

      <div className="vote-counts">
        <span className="count-for">For: {summary.votesFor}</span>
        <span className="count-against">Against: {summary.votesAgainst}</span>
        <span className="count-total">Total: {summary.totalVotes}</span>
        {!summary.quorumReached && (
          <span className="quorum-warning">Quorum not reached</span>
        )}
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {isAuthenticated && isOpen && userVote === null && (
        <div className="vote-actions">
          <button
            className="btn-vote-for"
            onClick={() => handleVote(true)}
            disabled={voting}
            aria-busy={voting}
          >
            {voting ? 'Voting...' : 'Vote For'}
          </button>
          <button
            className="btn-vote-against"
            onClick={() => handleVote(false)}
            disabled={voting}
            aria-busy={voting}
          >
            {voting ? 'Voting...' : 'Vote Against'}
          </button>
        </div>
      )}

      {userVote !== null && (
        <p className="user-vote-status">
          You voted {userVote ? 'in favor' : 'against'}
        </p>
      )}

      {isOpen && !isAuthenticated && (
        <p className="connect-prompt">Connect wallet to vote</p>
      )}

      {isAuthenticated && proposal.status === 0 && (
        <button
          className="btn-finalize"
          onClick={handleFinalize}
          disabled={finalizing}
          aria-busy={finalizing}
        >
          {finalizing ? 'Finalizing...' : 'Finalize Proposal'}
        </button>
      )}
    </article>
  );
};
