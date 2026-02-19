import { useState } from 'react';
import { Proposal } from '../services/governanceService';
import { ProposalCard } from './ProposalCard';

interface ProposalListProps {
  proposals: Proposal[];
  loading: boolean;
  onVoted: () => void;
}

type StatusFilter = 'all' | 'open' | 'approved' | 'rejected' | 'executed';

const STATUS_MAP: Record<StatusFilter, number | null> = {
  all: null,
  open: 0,
  approved: 1,
  rejected: 2,
  executed: 3,
};

export const ProposalList = ({ proposals, loading, onVoted }: ProposalListProps) => {
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [sortNewest, setSortNewest] = useState(true);

  const filtered = proposals.filter((p) => {
    const statusCode = STATUS_MAP[filter];
    if (statusCode === null) return true;
    return p.status === statusCode;
  });

  const sorted = [...filtered].sort((a, b) =>
    sortNewest ? b.createdAt - a.createdAt : a.createdAt - b.createdAt,
  );

  return (
    <div className="proposal-list">
      <div className="proposal-list-controls">
        <div className="filter-group">
          <label htmlFor="proposal-filter">Filter:</label>
          <select
            id="proposal-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value as StatusFilter)}
          >
            <option value="all">All Proposals</option>
            <option value="open">Open</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="executed">Executed</option>
          </select>
        </div>

        <button
          className="btn-sort"
          onClick={() => setSortNewest(!sortNewest)}
          aria-label={`Sort by ${sortNewest ? 'oldest' : 'newest'} first`}
        >
          {sortNewest ? 'Oldest first' : 'Newest first'}
        </button>
      </div>

      {loading && <p className="loading-indicator">Loading proposals...</p>}

      {!loading && sorted.length === 0 && (
        <p className="no-results">No proposals match the current filter.</p>
      )}

      <div className="proposal-grid" role="list">
        {sorted.map((p) => (
          <div key={p.id} role="listitem">
            <ProposalCard proposal={p} onVoted={onVoted} />
          </div>
        ))}
      </div>
    </div>
  );
};
