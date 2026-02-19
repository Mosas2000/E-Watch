import { useState } from 'react';
import { useGovernance } from '../hooks/useGovernance';
import { ProposalForm } from './ProposalForm';
import { ProposalList } from './ProposalList';
import { VoterStats } from './VoterStats';

export const GovernanceDashboard = () => {
  const { proposals, voterHistory, loading, error, refresh } = useGovernance();
  const [showForm, setShowForm] = useState(false);

  const handleSubmitted = () => {
    setShowForm(false);
    refresh();
  };

  const openCount = proposals.filter((p) => p.status === 0).length;
  const approvedCount = proposals.filter((p) => p.status === 1).length;

  return (
    <section className="governance-dashboard" aria-labelledby="governance-heading">
      <h2 id="governance-heading">Community Governance</h2>
      <p className="section-description">
        Shape the future of E-Watch by proposing new features and voting on open
        proposals. Each connected wallet gets one vote per proposal. Proposals
        need a quorum of five votes to pass.
      </p>

      <div className="governance-stats" role="region" aria-label="Governance overview">
        <div className="stat-item">
          <span className="stat-number">{proposals.length}</span>
          <span className="stat-label">Proposals</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{openCount}</span>
          <span className="stat-label">Open</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{approvedCount}</span>
          <span className="stat-label">Approved</span>
        </div>
      </div>

      <VoterStats
        voterHistory={voterHistory}
        totalProposals={proposals.length}
      />

      <div className="governance-actions">
        <button
          className="btn-new-proposal"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'New Proposal'}
        </button>
      </div>

      {showForm && <ProposalForm onSubmitted={handleSubmitted} />}

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <ProposalList
        proposals={proposals}
        loading={loading}
        onVoted={refresh}
      />
    </section>
  );
};
