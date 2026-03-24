/**
 * Winston logger with structured JSON output for production,
 * colorized console output for development.
 */
const winston = require('winston');
const env = require('./env');

const logger = winston.createLogger({
  level: env.logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'trendybird-api' },
  transports: [
    new winston.transports.Console({
      format: env.isProduction
        ? winston.format.json()
        : winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
              const metaStr = Object.keys(meta).length > 1
                ? ` ${JSON.stringify(meta)}`
                : '';
              return `${timestamp} [${level}]: ${message}${metaStr}`;
            })
          ),
    }),
  ],
});

module.exports = logger;
