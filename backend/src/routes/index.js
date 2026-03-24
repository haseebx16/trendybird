/**
 * Route aggregator — mounts all route modules.
 */
const express = require('express');
const router = express.Router();

const trendsRouter = require('./trends');
const countriesRouter = require('./countries');
const categoriesRouter = require('./categories');
const userRouter = require('./user');
const webhooksRouter = require('./webhooks');

// Health check (public)
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'trendybird-api',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Public routes (no auth required)
router.use('/countries', countriesRouter);
router.use('/categories', categoriesRouter);

// Protected routes (auth + subscription)
router.use('/trends', trendsRouter);

// Auth-only routes (no subscription required)
router.use('/user', userRouter);

// Webhooks (server-to-server, own auth)
router.use('/webhooks', webhooksRouter);

module.exports = router;
