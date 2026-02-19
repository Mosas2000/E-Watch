/**
 * Core types for the governance module.
 * Kept separate from the service so components can import
 * without pulling in the Stacks SDK.
 */

export interface ProposalFormData {
  title: string;
  description: string;
  category: string;
}

export type ProposalCategory =
  | 'feature'
  | 'improvement'
  | 'bugfix'
  | 'security'
  | 'documentation'
  | 'other';

export const PROPOSAL_CATEGORIES: { value: ProposalCategory; label: string }[] = [
  { value: 'feature', label: 'New Feature' },
  { value: 'improvement', label: 'Improvement' },
  { value: 'bugfix', label: 'Bug Fix' },
  { value: 'security', label: 'Security' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'other', label: 'Other' },
];

export interface VoteSummary {
  votesFor: number;
  votesAgainst: number;
  totalVotes: number;
  percentFor: number;
  percentAgainst: number;
  quorumReached: boolean;
}

/**
 * Compute derived vote statistics from raw tallies.
 */
export function computeVoteSummary(
  votesFor: number,
  votesAgainst: number,
  quorum: number,
): VoteSummary {
  const totalVotes = votesFor + votesAgainst;
  return {
    votesFor,
    votesAgainst,
    totalVotes,
    percentFor: totalVotes > 0 ? Math.round((votesFor / totalVotes) * 100) : 0,
    percentAgainst: totalVotes > 0 ? Math.round((votesAgainst / totalVotes) * 100) : 0,
    quorumReached: totalVotes >= quorum,
  };
}
