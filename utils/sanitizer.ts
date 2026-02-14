/**
 * Data sanitization utilities for logging
 * Removes or masks sensitive information from logs
 */

// Sensitive field patterns to redact
const SENSITIVE_KEYS = [
  'password',
  'secret',
  'token',
  'apikey',
  'api_key',
  'privatekey',
  'private_key',
  'mnemonic',
  'seedphrase',
  'seed_phrase',
  'authorization',
  'cookie',
  'session',
];

// Wallet address pattern (Stacks addresses)
const ADDRESS_PATTERN = /\b(SP|ST)[0-9A-Z]{38,41}\b/g;

// Private key pattern (hex strings that look like keys)
const PRIVATE_KEY_PATTERN = /\b[0-9a-f]{64}\b/gi;

/**
 * Sanitize an object by removing or masking sensitive data
 */
export function sanitizeObject(obj: any, depth: number = 0): any {
  // Prevent infinite recursion
  if (depth > 10) {
    return '[Max Depth Reached]';
  }

  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, depth + 1));
  }

  // Handle objects
  if (typeof obj === 'object') {
    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      
      // Check if key contains sensitive data
      const isSensitive = SENSITIVE_KEYS.some(pattern => 
        lowerKey.includes(pattern)
      );
      
      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value, depth + 1);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  // Handle strings
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  return obj;
}

/**
 * Sanitize string data by masking sensitive patterns
 */
export function sanitizeString(str: string): string {
  let sanitized = str;
  
  // Mask private keys
  sanitized = sanitized.replace(PRIVATE_KEY_PATTERN, '[PRIVATE_KEY]');
  
  // Optionally mask wallet addresses (keep first 4 and last 4 chars)
  sanitized = sanitized.replace(ADDRESS_PATTERN, (match) => {
    if (match.length > 12) {
      return `${match.substring(0, 6)}...${match.substring(match.length - 4)}`;
    }
    return match;
  });
  
  return sanitized;
}

/**
 * Mask sensitive data in error messages
 */
export function sanitizeError(error: Error | any): any {
  if (!error) return error;
  
  const sanitized: any = {
    name: error.name,
    message: sanitizeString(error.message || ''),
  };
  
  if (error.stack) {
    sanitized.stack = sanitizeString(error.stack);
  }
  
  // Copy other error properties
  for (const [key, value] of Object.entries(error)) {
    if (!['name', 'message', 'stack'].includes(key)) {
      sanitized[key] = sanitizeObject(value);
    }
  }
  
  return sanitized;
}

/**
 * Create a safe log context by sanitizing all fields
 */
export function createSafeContext(context: any): any {
  return sanitizeObject(context);
}

/**
 * Mask wallet address for logs (show first and last few chars)
 */
export function maskAddress(address: string): string {
  if (!address || address.length < 12) {
    return '[INVALID_ADDRESS]';
  }
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/**
 * Mask transaction ID for logs
 */
export function maskTxId(txId: string): string {
  if (!txId || txId.length < 12) {
    return '[INVALID_TX_ID]';
  }
  return `${txId.substring(0, 8)}...${txId.substring(txId.length - 4)}`;
}

/**
 * Create a sanitized log message
 */
export function sanitizeLogMessage(message: string, context?: any): { message: string; context?: any } {
  return {
    message: sanitizeString(message),
    context: context ? sanitizeObject(context) : undefined,
  };
}
