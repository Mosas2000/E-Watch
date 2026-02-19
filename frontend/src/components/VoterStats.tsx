import { VoterHistory } from '../services/governanceService';
import { useApp } from '../contexts/AppContext';

interface VoterStatsProps {
  voterHistory: VoterHistory;
  totalProposals: number;
}

export const VoterStats = ({ voterHistory, totalProposals }: VoterStatsProps) => {
  const { isAuthenticated, userAddress } = useApp();

  if (!isAuthenticated) {
    return null;
  }

  const participationRate =
    totalProposals > 0
      ? Math.round((voterHistory.totalVotes / totalProposals) * 100)
      : 0;

  return (
    <div className="voter-stats" aria-label="Your voting statistics">
      <h3>Your Participation</h3>
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-number">{voterHistory.totalVotes}</span>
          <span className="stat-label">Votes Cast</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{participationRate}%</span>
          <span className="stat-label">Participation Rate</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{totalProposals}</span>
          <span className="stat-label">Total Proposals</span>
        </div>
      </div>
      <p className="voter-address">
        Wallet: {userAddress.slice(0, 8)}...{userAddress.slice(-4)}
      </p>
    </div>
  );
};
