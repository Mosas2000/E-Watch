import { useState, useEffect } from 'react';
import { blocksToTimeString } from '../config/governanceConfig';

/**
 * Returns a human-readable countdown string for how much voting
 * time remains, given the ending block and the current chain tip.
 *
 * Re-checks every 30 seconds so the display stays roughly current
 * without hammering the API.
 */
export function useProposalTimer(endBlock: number, currentBlock: number) {
  const [remaining, setRemaining] = useState('');
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const update = () => {
      if (currentBlock >= endBlock) {
        setRemaining('Voting ended');
        setExpired(true);
        return;
      }
      const diff = endBlock - currentBlock;
      setRemaining(blocksToTimeString(diff) + ' left');
      setExpired(false);
    };

    update();
    const timer = setInterval(update, 30_000);
    return () => clearInterval(timer);
  }, [endBlock, currentBlock]);

  return { remaining, expired };
}
