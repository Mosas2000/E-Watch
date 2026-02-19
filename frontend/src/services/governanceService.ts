import {
  uintCV,
  stringAsciiCV,
  boolCV,
  principalCV,
  fetchCallReadOnlyFunction,
  cvToJSON,
} from '@stacks/transactions';
import { openContractCall } from '@stacks/connect';
import { AnchorMode, PostConditionMode } from '@stacks/transactions';
import { getStacksNetwork } from '../config/networkConfig';
import { env } from '../config/env';
import { requireAuth } from '../auth';
import logger from '../utils/logger';

const network = getStacksNetwork();

// Governance contract details - driven by environment config
const GOVERNANCE_CONTRACT_ADDRESS = env.contractAddress;
const GOVERNANCE_CONTRACT_NAME = env.governanceContractName;

export interface Proposal {
  id: number;
  proposer: string;
  title: string;
  description: string;
  category: string;
  createdAt: number;
  endBlock: number;
  votesFor: number;
  votesAgainst: number;
  status: number;
  executed: boolean;
}

export interface VoterHistory {
  totalVotes: number;
}

// Proposal status labels
export const PROPOSAL_STATUS: Record<number, string> = {
  0: 'Open',
  1: 'Approved',
  2: 'Rejected',
  3: 'Executed',
};

/**
 * Submit a new feature proposal for community voting.
 */
export const submitProposal = async (
  title: string,
  description: string,
  category: string,
): Promise<unknown> => {
  requireAuth('submit a proposal');
  logger.info('Submitting governance proposal', { title, category });

  return new Promise((resolve, reject) => {
    openContractCall({
      contractAddress: GOVERNANCE_CONTRACT_ADDRESS,
      contractName: GOVERNANCE_CONTRACT_NAME,
      functionName: 'submit-proposal',
      functionArgs: [
        stringAsciiCV(title),
        stringAsciiCV(description),
        stringAsciiCV(category),
      ],
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Deny,
      onFinish: (data) => {
        logger.transaction('Proposal submitted', { txid: data.txId });
        resolve(data);
      },
      onCancel: () => {
        logger.warn('Proposal submission cancelled');
        reject(new Error('Transaction cancelled by user'));
      },
    });
  });
};

/**
 * Cast a vote on a proposal that is currently open.
 */
export const castVote = async (
  proposalId: number,
  inFavor: boolean,
): Promise<unknown> => {
  requireAuth('cast a vote');
  logger.info('Casting vote', { proposalId, inFavor });

  return new Promise((resolve, reject) => {
    openContractCall({
      contractAddress: GOVERNANCE_CONTRACT_ADDRESS,
      contractName: GOVERNANCE_CONTRACT_NAME,
      functionName: 'vote',
      functionArgs: [uintCV(proposalId), boolCV(inFavor)],
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Deny,
      onFinish: (data) => {
        logger.transaction('Vote cast', {
          proposalId,
          inFavor,
          txid: data.txId,
        });
        resolve(data);
      },
      onCancel: () => {
        logger.warn('Vote cancelled', { proposalId });
        reject(new Error('Transaction cancelled by user'));
      },
    });
  });
};

/**
 * Finalize a proposal whose voting period has ended.
 */
export const finalizeProposal = async (
  proposalId: number,
): Promise<unknown> => {
  requireAuth('finalize a proposal');
  logger.info('Finalizing proposal', { proposalId });

  return new Promise((resolve, reject) => {
    openContractCall({
      contractAddress: GOVERNANCE_CONTRACT_ADDRESS,
      contractName: GOVERNANCE_CONTRACT_NAME,
      functionName: 'finalize-proposal',
      functionArgs: [uintCV(proposalId)],
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Deny,
      onFinish: (data) => {
        logger.transaction('Proposal finalized', {
          proposalId,
          txid: data.txId,
        });
        resolve(data);
      },
      onCancel: () => {
        logger.warn('Finalization cancelled', { proposalId });
        reject(new Error('Transaction cancelled by user'));
      },
    });
  });
};

/**
 * Fetch a single proposal by its numeric ID.
 */
export const getProposal = async (proposalId: number): Promise<Proposal | null> => {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: GOVERNANCE_CONTRACT_ADDRESS,
      contractName: GOVERNANCE_CONTRACT_NAME,
      functionName: 'get-proposal',
      functionArgs: [uintCV(proposalId)],
      network,
      senderAddress: GOVERNANCE_CONTRACT_ADDRESS,
    });

    const json = cvToJSON(result);
    if (!json.value) return null;

    const v = json.value;
    return {
      id: proposalId,
      proposer: v.proposer?.value || '',
      title: v.title?.value || '',
      description: v.description?.value || '',
      category: v.category?.value || '',
      createdAt: Number(v['created-at']?.value || 0),
      endBlock: Number(v['end-block']?.value || 0),
      votesFor: Number(v['votes-for']?.value || 0),
      votesAgainst: Number(v['votes-against']?.value || 0),
      status: Number(v.status?.value || 0),
      executed: v.executed?.value || false,
    };
  } catch (error: any) {
    logger.error('Failed to fetch proposal', { proposalId, error: error.message });
    throw error;
  }
};

/**
 * Get the total number of proposals submitted.
 */
export const getProposalCount = async (): Promise<number> => {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: GOVERNANCE_CONTRACT_ADDRESS,
      contractName: GOVERNANCE_CONTRACT_NAME,
      functionName: 'get-proposal-count',
      functionArgs: [],
      network,
      senderAddress: GOVERNANCE_CONTRACT_ADDRESS,
    });

    const json = cvToJSON(result);
    return Number(json.value?.value || 0);
  } catch (error: any) {
    logger.error('Failed to fetch proposal count', { error: error.message });
    throw error;
  }
};

/**
 * Check whether a given address has already voted on a proposal.
 */
export const getVote = async (
  proposalId: number,
  voter: string,
): Promise<{ inFavor: boolean } | null> => {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: GOVERNANCE_CONTRACT_ADDRESS,
      contractName: GOVERNANCE_CONTRACT_NAME,
      functionName: 'get-vote',
      functionArgs: [uintCV(proposalId), principalCV(voter)],
      network,
      senderAddress: GOVERNANCE_CONTRACT_ADDRESS,
    });

    const json = cvToJSON(result);
    if (!json.value) return null;
    return { inFavor: json.value['in-favor']?.value || false };
  } catch (error: any) {
    logger.error('Failed to fetch vote', { proposalId, voter, error: error.message });
    throw error;
  }
};

/**
 * Fetch the participation history for a wallet address.
 */
export const getVoterHistory = async (voter: string): Promise<VoterHistory> => {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: GOVERNANCE_CONTRACT_ADDRESS,
      contractName: GOVERNANCE_CONTRACT_NAME,
      functionName: 'get-voter-history',
      functionArgs: [principalCV(voter)],
      network,
      senderAddress: GOVERNANCE_CONTRACT_ADDRESS,
    });

    const json = cvToJSON(result);
    return {
      totalVotes: Number(json.value?.['total-votes']?.value || 0),
    };
  } catch (error: any) {
    logger.error('Failed to fetch voter history', { voter, error: error.message });
    throw error;
  }
};

/**
 * Check if voting is still open for a given proposal.
 */
export const isVotingOpen = async (proposalId: number): Promise<boolean> => {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: GOVERNANCE_CONTRACT_ADDRESS,
      contractName: GOVERNANCE_CONTRACT_NAME,
      functionName: 'is-voting-open',
      functionArgs: [uintCV(proposalId)],
      network,
      senderAddress: GOVERNANCE_CONTRACT_ADDRESS,
    });

    const json = cvToJSON(result);
    return json.value === true;
  } catch (error: any) {
    logger.error('Failed to check voting status', { proposalId, error: error.message });
    return false;
  }
};
