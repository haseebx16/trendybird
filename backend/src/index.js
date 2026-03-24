/**
 * TrendyBird API — Main entry point.
 * 
 * Express server with:
 * - Security hardening (helmet, cors, hpp, rate limiting)
 * - Supabase JWT authentication
 * - RevenueCat subscription paywall
 * - Cron jobs for trend data ingestion
 * - Structured logging with Winston
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const hpp = require('hpp');

const env = require('./config/env');
const logger = require('./config/logger');
const routes = require('./routes');
const { globalLimiter, speedLimiter } = require('./middleware/rateLimiter');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { startScheduler, stopScheduler } = require('./jobs/scheduler');

const app = express();

// ===========================================
// 1. Security middleware
// ===========================================
app.use(helmet());                                    // Security headers
app.use(cors({
  origin: env.isProduction
    ? ['https://trendybird.app']                      // Lock down in production
    : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,                                       // Cache preflight for 24h
}));
app.use(hpp());                                        // HTTP parameter pollution protection
app.use(compression());                                // Gzip responses

// ===========================================
// 2. Body parsing
// ===========================================
app.use(express.json({ limit: '1mb' }));               // JSON bodies (webhooks, etc.)
app.use(express.urlencoded({ extended: false }));

// ===========================================
// 3. Rate limiting (applied globally)
// ===========================================
app.use(globalLimiter);
app.use(speedLimiter);

// ===========================================
// 4. Request logging
// ===========================================
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    // Only log non-health requests in production to reduce noise
    if (req.path !== '/api/health' || !env.isProduction) {
      logger.http(`${req.method} ${req.path}`, {
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userId: req.user?.id,
      });
    }
  });
  next();
});

// ===========================================
// 5. Routes
// ===========================================
app.use('/api', routes);

// ===========================================
// 6. Error handling (must be last)
// ===========================================
app.use(notFound);
app.use(errorHandler);

// ===========================================
// 7. Start server
// ===========================================
const PORT = env.port;

const server = app.listen(PORT, () => {
  logger.info(`🚀 TrendyBird API running on port ${PORT}`, {
    env: env.nodeEnv,
    cron: env.cronEnabled ? 'enabled' : 'disabled',
  });

  // Start cron scheduler after server is ready
  startScheduler();
});

// ===========================================
// 8. Graceful shutdown
// ===========================================
const shutdown = (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  stopScheduler();
  server.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });

  // Force close after 10s
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Catch unhandled errors (don't crash the process)
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', { reason: reason?.message || reason });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
  // For critical errors, shut down
  shutdown('UNCAUGHT_EXCEPTION');
});

module.exports = app;
