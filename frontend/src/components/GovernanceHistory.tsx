import { Proposal, PROPOSAL_STATUS } from '../services/governanceService';

interface GovernanceHistoryProps {
  proposals: Proposal[];
}

/**
 * Displays a flat timeline of finalized proposals showing their
 * outcome and total vote counts.
 */
export const GovernanceHistory = ({ proposals }: GovernanceHistoryProps) => {
  const finalized = proposals.filter((p) => p.status !== 0);

  if (finalized.length === 0) {
    return (
      <div className="governance-history-empty">
        <p>No finalized proposals yet.</p>
      </div>
    );
  }

  return (
    <div className="governance-history" aria-label="Governance history">
      <h3>Governance History</h3>
      <table className="history-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Outcome</th>
            <th>For</th>
            <th>Against</th>
            <th>Block</th>
          </tr>
        </thead>
        <tbody>
          {finalized.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.title}</td>
              <td className={`status-${(PROPOSAL_STATUS[p.status] || 'unknown').toLowerCase()}`}>
                {PROPOSAL_STATUS[p.status] || 'Unknown'}
              </td>
              <td>{p.votesFor}</td>
              <td>{p.votesAgainst}</td>
              <td>{p.createdAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
