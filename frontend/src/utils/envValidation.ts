import type { NetworkId, AppEnvironment } from '../types/env';

/**
 * Validates that a string is a supported network identifier.
 */
export function isValidNetwork(value: string): value is NetworkId {
  return value === 'mainnet' || value === 'testnet';
}

/**
 * Validates that a string is a supported application environment.
 */
export function isValidAppEnv(value: string): value is AppEnvironment {
  return (
    value === 'development' ||
    value === 'staging' ||
    value === 'production'
  );
}

/**
 * Validates that a string looks like a valid Stacks principal address.
 * Does not perform full on-chain validation, only checks format.
 */
export function isValidContractAddress(value: string): boolean {
  return /^S[PM][A-Z0-9]{38,}$/i.test(value);
}

/**
 * Validates that a URL string is well-formed.
 */
export function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

interface ValidationError {
  field: string;
  message: string;
  value: string | undefined;
}

/**
 * Run all validations against the raw VITE_ environment
 * variables and return any errors found.
 */
export function validateEnvVars(): ValidationError[] {
  const errors: ValidationError[] = [];

  const network = import.meta.env.VITE_NETWORK;
  if (!network) {
    errors.push({
      field: 'VITE_NETWORK',
      message: 'Missing required variable. Expected "mainnet" or "testnet".',
      value: network,
    });
  } else if (!isValidNetwork(network)) {
    errors.push({
      field: 'VITE_NETWORK',
      message: `Invalid value "${network}". Expected "mainnet" or "testnet".`,
      value: network,
    });
  }

  const address = import.meta.env.VITE_CONTRACT_ADDRESS;
  if (!address) {
    errors.push({
      field: 'VITE_CONTRACT_ADDRESS',
      message: 'Missing required variable. Provide a Stacks principal address.',
      value: address,
    });
  } else if (!isValidContractAddress(address)) {
    errors.push({
      field: 'VITE_CONTRACT_ADDRESS',
      message: `"${address}" does not look like a valid Stacks address.`,
      value: address,
    });
  }

  const contractName = import.meta.env.VITE_CONTRACT_NAME;
  if (!contractName) {
    errors.push({
      field: 'VITE_CONTRACT_NAME',
      message: 'Missing required variable.',
      value: contractName,
    });
  }

  const apiEndpoint = import.meta.env.VITE_API_ENDPOINT;
  if (apiEndpoint && !isValidUrl(apiEndpoint)) {
    errors.push({
      field: 'VITE_API_ENDPOINT',
      message: `"${apiEndpoint}" is not a valid URL.`,
      value: apiEndpoint,
    });
  }

  const explorerUrl = import.meta.env.VITE_EXPLORER_URL;
  if (explorerUrl && !isValidUrl(explorerUrl)) {
    errors.push({
      field: 'VITE_EXPLORER_URL',
      message: `"${explorerUrl}" is not a valid URL.`,
      value: explorerUrl,
    });
  }

  const appEnv = import.meta.env.VITE_APP_ENV;
  if (appEnv && !isValidAppEnv(appEnv)) {
    errors.push({
      field: 'VITE_APP_ENV',
      message: `Invalid value "${appEnv}". Expected "development", "staging", or "production".`,
      value: appEnv,
    });
  }

  return errors;
}
