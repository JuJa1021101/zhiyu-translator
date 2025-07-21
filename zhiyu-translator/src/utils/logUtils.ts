/**
 * Logging utilities for the application
 */

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

// Logger configuration
export interface LoggerConfig {
  level: LogLevel;
  prefix?: string;
  enableTimestamps?: boolean;
  logToConsole?: boolean;
  customHandler?: (level: LogLevel, message: string, data?: any) => void;
}

// Default configuration
const DEFAULT_CONFIG: LoggerConfig = {
  level: process.env.NODE_ENV === 'production' ? LogLevel.ERROR : LogLevel.INFO,
  enableTimestamps: true,
  logToConsole: true
};

/**
 * Logger class for consistent logging throughout the application
 */
export class Logger {
  private config: LoggerConfig;
  private prefix: string;

  /**
   * Create a new logger instance
   * @param prefix Prefix for log messages
   * @param config Logger configuration
   */
  constructor(prefix: string = '', config: Partial<LoggerConfig> = {}) {
    this.prefix = prefix;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Format a log message with timestamp and prefix
   * @param message Message to format
   * @returns Formatted message
   */
  private formatMessage(message: string): string {
    let formattedMessage = '';

    if (this.config.enableTimestamps) {
      formattedMessage += `[${new Date().toISOString()}] `;
    }

    if (this.prefix) {
      formattedMessage += `[${this.prefix}] `;
    }

    formattedMessage += message;

    return formattedMessage;
  }

  /**
   * Log a message at the specified level
   * @param level Log level
   * @param message Message to log
   * @param data Optional data to include
   */
  private log(level: LogLevel, message: string, data?: any): void {
    if (level < this.config.level) {
      return;
    }

    const formattedMessage = this.formatMessage(message);

    // Call custom handler if provided
    if (this.config.customHandler) {
      this.config.customHandler(level, formattedMessage, data);
      return;
    }

    // Log to console if enabled
    if (this.config.logToConsole) {
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(formattedMessage, data !== undefined ? data : '');
          break;
        case LogLevel.INFO:
          console.info(formattedMessage, data !== undefined ? data : '');
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage, data !== undefined ? data : '');
          break;
        case LogLevel.ERROR:
          console.error(formattedMessage, data !== undefined ? data : '');
          break;
      }
    }
  }

  /**
   * Log a debug message
   * @param message Message to log
   * @param data Optional data to include
   */
  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Log an info message
   * @param message Message to log
   * @param data Optional data to include
   */
  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Log a warning message
   * @param message Message to log
   * @param data Optional data to include
   */
  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * Log an error message
   * @param message Message to log
   * @param data Optional data to include
   */
  error(message: string, data?: any): void {
    this.log(LogLevel.ERROR, message, data);
  }

  /**
   * Create a child logger with a sub-prefix
   * @param subPrefix Additional prefix to add
   * @returns New logger instance
   */
  createChild(subPrefix: string): Logger {
    const newPrefix = this.prefix ? `${this.prefix}:${subPrefix}` : subPrefix;
    return new Logger(newPrefix, this.config);
  }

  /**
   * Update the logger configuration
   * @param config New configuration options
   */
  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Create a new logger instance
 * @param prefix Prefix for log messages
 * @param config Logger configuration
 * @returns Logger instance
 */
export function createLogger(prefix: string = '', config: Partial<LoggerConfig> = {}): Logger {
  return new Logger(prefix, config);
}

// Default application logger
export const appLogger = createLogger('App');

// Export a logger factory for different modules
export const loggers = {
  translation: createLogger('Translation'),
  worker: createLogger('Worker'),
  service: createLogger('Service'),
  ui: createLogger('UI'),
  model: createLogger('Model')
};