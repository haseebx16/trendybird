/**
 * Categories routes.
 * Public (no auth required) — needed for onboarding/filter UI.
 */
const express = require('express');
const router = express.Router();
const { cache, cacheKeys } = require('../config/cache');
const CategoryModel = require('../models/category');

/**
 * GET /api/categories
 * List all active categories.
 */
router.get('/', async (req, res, next) => {
  try {
    const cacheKey = cacheKeys.categories();
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json({ success: true, categories: cached, cached: true });
    }

    const categories = await CategoryModel.getAll();

    // Cache for 1 hour
    cache.set(cacheKey, categories, 3600);

    res.json({ success: true, categories });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
