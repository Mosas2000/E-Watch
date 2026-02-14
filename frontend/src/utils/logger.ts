/**
 * Frontend logger for browser environment
 * Provides structured logging with levels and context
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogContext {
  [key: string]: any;
}

class FrontendLogger {
  private level: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.MODE === 'development';
    this.level = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
  }

  private sanitizeContext(context?: LogContext): LogContext | undefined {
    if (!context) return undefined;

    const sanitized: LogContext = {};
    for (const [key, value] of Object.entries(context)) {
      // Redact sensitive keys
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes('password') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('private') ||
        lowerKey.includes('key')
      ) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const sanitized = this.sanitizeContext(context);
    if (this.isDevelopment) {
      console.debug(this.formatMessage('DEBUG', message, sanitized));
    }
  }

  info(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const sanitized = this.sanitizeContext(context);
    console.log(this.formatMessage('INFO', message, sanitized));
  }

  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const sanitized = this.sanitizeContext(context);
    console.warn(this.formatMessage('WARN', message, sanitized));
  }

  error(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const sanitized = this.sanitizeContext(context);
    console.error(this.formatMessage('ERROR', message, sanitized));
  }

  // Log user actions for analytics
  userAction(action: string, details?: LogContext): void {
    this.info(`User action: ${action}`, {
      action,
      ...details,
      category: 'user_interaction',
    });
  }

  // Log blockchain transactions
  transaction(txType: string, details?: LogContext): void {
    this.info(`Transaction: ${txType}`, {
      txType,
      ...details,
      category: 'blockchain_transaction',
    });
  }

  // Log wallet operations
  wallet(operation: string, details?: LogContext): void {
    this.info(`Wallet operation: ${operation}`, {
      operation,
      ...details,
      category: 'wallet',
    });
  }
}

// Export singleton instance
export const logger = new FrontendLogger();
export default logger;
