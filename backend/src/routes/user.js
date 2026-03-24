/**
 * User routes — all require authentication.
 * 
 * GET  /api/user/profile        — Get user profile + subscription status
 * PUT  /api/user/preferences    — Update user preferences
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const UserModel = require('../models/user');

// All user routes require auth
router.use(authenticate);

/**
 * GET /api/user/profile
 * Returns user profile, subscription status, and preferences.
 * NOTE: This endpoint does NOT require subscription — users need to see
 * their status even if expired (to know they need to resubscribe).
 */
router.get('/profile', async (req, res, next) => {
  try {
    const user = await UserModel.getById(req.user.id);

    if (!user) {
      return res.status(404).json({
        error: 'not_found',
        message: 'User profile not found.',
      });
    }

    // Touch last_seen_at (fire and forget)
    UserModel.touch(req.user.id).catch(() => {});

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        subscription: {
          status: user.subscription_status,
          plan: user.subscription_plan,
          expires_at: user.subscription_expires_at,
        },
        preferences: {
          preferred_country: user.preferred_country,
          preferred_categories: user.preferred_categories,
        },
        created_at: user.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/user/preferences
 * Update preferred country and categories.
 */
router.put('/preferences', validate(schemas.updatePreferences, 'body'), async (req, res, next) => {
  try {
    const { preferred_country, preferred_categories } = req.body;

    const updated = await UserModel.updatePreferences(req.user.id, {
      preferredCountry: preferred_country,
      preferredCategories: preferred_categories,
    });

    res.json({
      success: true,
      preferences: {
        preferred_country: updated.preferred_country,
        preferred_categories: updated.preferred_categories,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
