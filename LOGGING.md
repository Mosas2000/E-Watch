# Logging Guidelines for E-Watch

## Overview

E-Watch uses structured logging with Winston (backend/scripts) and a custom logger (frontend) to provide comprehensive, searchable logs with appropriate detail levels.

## Log Levels

### Backend (Winston)
- **error (0)**: Critical errors that may cause application termination
- **warn (1)**: Warning messages for potentially harmful situations
- **info (2)**: General informational messages about application state
- **http (3)**: HTTP request/response logging
- **debug (4)**: Detailed diagnostic information for development

### Frontend
- **ERROR**: Critical errors affecting user experience
- **WARN**: Warnings about potential issues
- **INFO**: General application flow information
- **DEBUG**: Detailed debugging information (development only)

## Configuration

### Backend

Log level is controlled by the `LOG_LEVEL` environment variable:

```bash
export LOG_LEVEL=debug  # For development
export LOG_LEVEL=info   # For production
```

### Log Rotation

Logs are automatically rotated daily with retention policies:
- Application logs: 14 days
- Error logs: 30 days
- Exception logs: 30 days

Files are created in the `logs/` directory:
- `logs/application-YYYY-MM-DD.log` - All logs
- `logs/error-YYYY-MM-DD.log` - Error level only
- `logs/exceptions-YYYY-MM-DD.log` - Uncaught exceptions
- `logs/rejections-YYYY-MM-DD.log` - Unhandled promise rejections

## Usage Examples

### Backend/Scripts

```typescript
import logger from '../utils/logger';
import { createLogContext } from '../utils/requestId';
import { maskAddress, sanitizeError } from '../utils/sanitizer';

// Create operation context with request ID
const context = createLogContext(undefined, {
  operation: 'deployContract',
  network: 'mainnet',
});

// Log different levels
logger.info('Starting deployment', context);
logger.debug('Transaction details', { ...context, txData: '...' });
logger.warn('High gas fees detected', { ...context, gasPrice: 100 });
logger.error('Deployment failed', {
  ...context,
  error: sanitizeError(error),
});

// Always sanitize sensitive data
logger.info('Wallet created', {
  ...context,
  address: maskAddress(walletAddress),
});
```

### Frontend

```typescript
import logger from './utils/logger';

// User actions
logger.userAction('button_clicked', {
  buttonId: 'connect-wallet',
  page: '/dashboard',
});

// Transaction logging
logger.transaction('register-event', {
  eventType: 'transfer',
  status: 'pending',
});

// Wallet operations
logger.wallet('connection_attempt', {
  provider: 'hiro',
});

// Error logging
logger.error('Failed to fetch event', {
  eventId: 123,
  error: error.message,
});
```

## Data Sanitization

### Sensitive Data

Always sanitize sensitive information before logging:

**Automatically Redacted Fields:**
- password
- secret
- token
- apikey / api_key
- privatekey / private_key
- mnemonic
- seedphrase / seed_phrase
- authorization
- cookie
- session

**Use Helper Functions:**

```typescript
import { maskAddress, maskTxId, sanitizeObject } from '../utils/sanitizer';

// Mask wallet addresses
logger.info('Transaction sent', {
  from: maskAddress('SP31PKQVQZVZCK3FM3NH67CGD6G1FMR17VQVS2W5T'),
  // Output: SP31PK...2W5T
});

// Mask transaction IDs
logger.info('Transaction confirmed', {
  txid: maskTxId('08b7510ae768dc595ce769d628ae44c4da8cfa56'),
  // Output: 08b7510a...cfa56
});

// Sanitize entire objects
const safeData = sanitizeObject(userData);
logger.info('User data loaded', { user: safeData });
```

## Request Tracking

Use request IDs to correlate logs across operations:

```typescript
import { createLogContext, withRequestId } from '../utils/requestId';

// Create context with unique request ID
const context = createLogContext();

// Use same context across operations
logger.info('Starting operation', context);
await processStep1(context);
await processStep2(context);
logger.info('Operation complete', context);

// Wrap async operations
await withRequestId(async (requestId) => {
  const context = { requestId, operation: 'deploy' };
  logger.info('Deploying contract', context);
  await deploy();
}, existingRequestId);
```

## Best Practices

### DO ✅

1. **Use appropriate log levels**
   ```typescript
   logger.debug('Cache hit', { key }); // Development only
   logger.info('User logged in', { userId }); // Important events
   logger.error('Database connection failed', { error }); // Critical issues
   ```

2. **Provide context**
   ```typescript
   logger.info('Event registered', {
     eventId: 123,
     eventType: 'transfer',
     timestamp: new Date().toISOString(),
   });
   ```

3. **Sanitize sensitive data**
   ```typescript
   logger.info('Wallet created', {
     address: maskAddress(address), // ✅ Masked
   });
   ```

4. **Log errors with full context**
   ```typescript
   logger.error('Operation failed', {
     operation: 'registerEvent',
     error: sanitizeError(error),
     context: { eventType, data },
   });
   ```

### DON'T ❌

1. **Don't log sensitive data directly**
   ```typescript
   logger.info('User created', {
     password: user.password, // ❌ Never log passwords
     privateKey: wallet.key, // ❌ Never log private keys
   });
   ```

2. **Don't use console.log in production code**
   ```typescript
   console.log('User logged in'); // ❌ Use logger instead
   logger.info('User logged in'); // ✅ Structured logging
   ```

3. **Don't log excessively**
   ```typescript
   for (let i = 0; i < 1000000; i++) {
     logger.debug(`Processing item ${i}`); // ❌ Too verbose
   }
   ```

4. **Don't log business-critical data**
   ```typescript
   logger.info('Payment processed', {
     creditCard: cardNumber, // ❌ Never log payment info
     amount: transaction.amount, // ✅ OK to log amounts
   });
   ```

## Production Considerations

### Performance
- Debug logs are disabled in production
- Use async logging for high-throughput operations
- Avoid logging in tight loops

### Security
- All logs are sanitized automatically
- Private keys and secrets are redacted
- Wallet addresses are masked by default

### Monitoring
- Log files are rotated automatically
- Old logs are deleted per retention policy
- Errors are logged to separate files for alerting

## Troubleshooting

### Viewing Logs

```bash
# View latest application logs
tail -f logs/application-$(date +%Y-%m-%d).log

# View error logs
tail -f logs/error-$(date +%Y-%m-%d).log

# Search logs for specific request ID
grep "requestId: abc123" logs/application-*.log

# Filter by log level
grep "\[ERROR\]" logs/application-*.log
```

### Log Analysis

```bash
# Count errors in last 24 hours
grep "\[ERROR\]" logs/error-$(date +%Y-%m-%d).log | wc -l

# Find most common errors
grep "\[ERROR\]" logs/error-*.log | sort | uniq -c | sort -rn | head -10

# Extract transaction IDs
grep "txid" logs/application-*.log | grep -oE '[a-f0-9]{64}'
```

## Integration with Monitoring Tools

Logs are formatted as JSON in production for easy integration with:
- **Elasticsearch/Kibana**: Parse JSON logs for visualization
- **Splunk**: Index logs for advanced searching
- **Datadog**: Forward logs for monitoring and alerting
- **CloudWatch**: Stream logs to AWS CloudWatch

Example Elasticsearch query:
```json
{
  "query": {
    "bool": {
      "must": [
        { "match": { "level": "error" } },
        { "range": { "timestamp": { "gte": "now-1h" } } }
      ]
    }
  }
}
```

## Support

For logging issues:
1. Check log file permissions
2. Verify `LOG_LEVEL` environment variable
3. Ensure `logs/` directory is writable
4. Review sanitization rules in `utils/sanitizer.ts`
5. Check Winston configuration in `utils/logger.ts`
