import { useEnvironment } from '../hooks/useEnvironment';

/**
 * Small badge shown in the header when running on testnet.
 * Hidden in production/mainnet mode so it never confuses
 * real users, but clearly visible during development.
 */
export function NetworkBadge() {
  const { isTestnet, network, appEnv } = useEnvironment();

  // Only show the badge when NOT on production mainnet
  if (!isTestnet && appEnv === 'production') {
    return null;
  }

  return (
    <span
      className={`network-badge ${isTestnet ? 'network-badge--testnet' : 'network-badge--mainnet'}`}
      aria-label={`Connected to ${network}`}
    >
      {network}
      {appEnv !== 'production' && (
        <span className="network-badge-env"> ({appEnv})</span>
      )}
    </span>
  );
}
