/**
 * Log levels
 */
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  HTTP: 3,
  DEBUG: 4
};

/**
 * Simple console logger for operational monitoring
 */
class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
  }

  getLogLevel() {
    return LOG_LEVELS[this.logLevel.toUpperCase()] || LOG_LEVELS.INFO;
  }

  shouldLog(level) {
    return LOG_LEVELS[level] <= this.getLogLevel();
  }

  log(level, message, meta = {}) {
    if (!this.shouldLog(level)) return;

    const timestamp = new Date().toISOString();
    const levelColor = this.getLevelColor(level);
    const resetColor = '\x1b[0m';
    
    let consoleMsg = `${timestamp} [${levelColor}${level.toUpperCase()}${resetColor}] ${message}`;
    
    if (Object.keys(meta).length > 0) {
      consoleMsg += `\n  ${JSON.stringify(meta, null, 2)}`;
    }
    
    console.log(consoleMsg);
  }

  getLevelColor(level) {
    const colors = {
      ERROR: '\x1b[31m', // Red
      WARN: '\x1b[33m',  // Yellow
      INFO: '\x1b[36m',  // Cyan
      HTTP: '\x1b[35m',  // Magenta
      DEBUG: '\x1b[37m'  // White
    };
    return colors[level.toUpperCase()] || '\x1b[0m';
  }

  error(message, meta = {}) {
    this.log('ERROR', message, meta);
  }

  warn(message, meta = {}) {
    this.log('WARN', message, meta);
  }

  info(message, meta = {}) {
    this.log('INFO', message, meta);
  }

  http(message, meta = {}) {
    this.log('HTTP', message, meta);
  }

  debug(message, meta = {}) {
    this.log('DEBUG', message, meta);
  }

  // Specialized logging methods for operations
  request(req, res, responseTime) {
    const meta = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      contentLength: res.get('Content-Length') || 0
    };

    const level = res.statusCode >= 400 ? 'ERROR' : 'HTTP';
    this.log(level, `${req.method} ${req.originalUrl} ${res.statusCode}`, meta);
  }

  database(operation, collection, query = {}, duration = null, error = null) {
    const meta = {
      operation,
      collection,
      query: JSON.stringify(query),
      duration: duration ? `${duration}ms` : null,
      error: error ? error.message : null
    };

    if (error) {
      this.error(`Database ${operation} failed on ${collection}`, meta);
    } else {
      this.debug(`Database ${operation} on ${collection}`, meta);
    }
  }

  business(operation, entity, entityId = null, details = {}) {
    const meta = {
      operation,
      entity,
      entityId,
      ...details
    };

    this.info(`Business operation: ${operation} on ${entity}`, meta);
  }

  performance(operation, duration, threshold = 1000) {
    const meta = {
      operation,
      duration: `${duration}ms`,
      threshold: `${threshold}ms`,
      slow: duration > threshold
    };

    if (duration > threshold) {
      this.warn(`Slow operation detected: ${operation}`, meta);
    } else {
      this.debug(`Operation completed: ${operation}`, meta);
    }
  }

  security(event, details = {}) {
    const meta = {
      event,
      ...details
    };

    this.warn(`Security event: ${event}`, meta);
  }

  // Operation-specific logging
  voucherOperation(operation, voucherId, details = {}) {
    this.info(`Voucher ${operation}`, {
      voucherId,
      ...details
    });
  }

  apiCall(method, endpoint, statusCode, duration, details = {}) {
    const level = statusCode >= 400 ? 'ERROR' : 'HTTP';
    this.log(level, `API ${method} ${endpoint} ${statusCode}`, {
      duration: `${duration}ms`,
      ...details
    });
  }

  serverEvent(event, details = {}) {
    this.info(`Server ${event}`, details);
  }
}

// Create singleton instance
const logger = new Logger();

export default logger;
