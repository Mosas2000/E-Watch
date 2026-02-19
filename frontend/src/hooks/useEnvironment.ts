import { useMemo } from 'react';
import { env } from '../config/env';
import { isTestnet, isMainnet, getExplorerTxUrl, getExplorerContractUrl } from '../config/networkConfig';

/**
 * Hook that exposes environment configuration to React components.
 * Provides convenience methods for building explorer links and
 * determining the current network.
 */
export function useEnvironment() {
  return useMemo(
    () => ({
      network: env.network,
      appEnv: env.appEnv,
      contractAddress: env.contractAddress,
      contractName: env.contractName,
      isTestnet: isTestnet(),
      isMainnet: isMainnet(),
      explorerTxUrl: getExplorerTxUrl,
      explorerContractUrl: getExplorerContractUrl,
    }),
    [],
  );
}
