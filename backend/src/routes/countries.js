/**
 * Countries routes.
 * Public (no auth required) — needed for onboarding/country picker.
 */
const express = require('express');
const router = express.Router();
const { cache, cacheKeys } = require('../config/cache');
const CountryModel = require('../models/country');

/**
 * GET /api/countries
 * List all active countries.
 */
router.get('/', async (req, res, next) => {
  try {
    const cacheKey = cacheKeys.countries();
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json({ success: true, countries: cached, cached: true });
    }

    const countries = await CountryModel.getAll();

    // Cache for 1 hour (rarely changes)
    cache.set(cacheKey, countries, 3600);

    res.json({ success: true, countries });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
