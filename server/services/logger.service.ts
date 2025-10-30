export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
}

class Logger {
  private logLevel: LogLevel;

  constructor() {
    const envLogLevel = process.env.LOG_LEVEL?.toUpperCase() || 'INFO';
    this.logLevel = LogLevel[envLogLevel as keyof typeof LogLevel] || LogLevel.INFO;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= currentLevelIndex;
  }

  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaString = meta ? ` | ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaString}`;
  }

  error(message: string, error?: Error | any, meta?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorMeta = error instanceof Error 
        ? { ...meta, error: { message: error.message, stack: error.stack } }
        : { ...meta, error };
      console.error(this.formatMessage(LogLevel.ERROR, message, errorMeta));
    }
  }

  warn(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(LogLevel.WARN, message, meta));
    }
  }

  info(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatMessage(LogLevel.INFO, message, meta));
    }
  }

  debug(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage(LogLevel.DEBUG, message, meta));
    }
  }

  http(method: string, path: string, statusCode: number, duration: number): void {
    const level = statusCode >= 500 ? LogLevel.ERROR : statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    if (this.shouldLog(level)) {
      const message = `${method} ${path} ${statusCode} ${duration}ms`;
      console.log(this.formatMessage(level, message));
    }
  }
}

export const logger = new Logger();
