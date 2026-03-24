/**
 * Request validation middleware using Joi.
 * Validates query params, body, and route params.
 */
const Joi = require('joi');

/**
 * Creates validation middleware for a given schema + source (query, body, params).
 */
const validate = (schema, source = 'query') => {
  return (req, res, next) => {
    const data = req[source];
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,      // remove unknown fields
      convert: true,           // type coerce (e.g. string "20" → number 20)
    });

    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message.replace(/"/g, ''),
      }));

      return res.status(400).json({
        error: 'validation_error',
        message: 'Invalid request parameters.',
        details,
      });
    }

    // Replace with validated + cleaned values
    req[source] = value;
    next();
  };
};

// ============================================
// Reusable validation schemas
// ============================================

const schemas = {
  // GET /api/trends
  getTrends: Joi.object({
    country: Joi.string().uppercase().min(2).max(6).default('US'),
    category: Joi.string().lowercase().max(50).default('all'),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(20),
    min_score: Joi.number().min(0).max(100).default(0),
    sort: Joi.string().valid('momentum_score', 'velocity_score', 'freshness_score', 'created_at').default('momentum_score'),
    order: Joi.string().valid('asc', 'desc').default('desc'),
  }),

  // GET /api/trends/:id
  getTrendById: Joi.object({
    id: Joi.string().uuid().required(),
  }),

  // GET /api/trends/search
  searchTrends: Joi.object({
    q: Joi.string().min(2).max(200).required(),
    country: Joi.string().uppercase().min(2).max(6).default('US'),
    limit: Joi.number().integer().min(1).max(50).default(20),
  }),

  // PUT /api/user/preferences
  updatePreferences: Joi.object({
    preferred_country: Joi.string().uppercase().min(2).max(6),
    preferred_categories: Joi.array().items(Joi.string().max(50)).max(14),
  }),
};

module.exports = { validate, schemas };
