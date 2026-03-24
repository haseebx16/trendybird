/**
 * Category model — Supabase queries for categories table.
 */
const { supabaseAdmin } = require('../config/supabase');
const logger = require('../config/logger');

const CategoryModel = {
  /**
   * Get all active categories.
   */
  async getAll() {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) {
      logger.error('Failed to fetch categories', { error: error.message });
      throw error;
    }
    return data;
  },

  /**
   * Get a category by slug.
   */
  async getBySlug(slug) {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('slug', slug.toLowerCase())
      .single();

    if (error) return null;
    return data;
  },
};

module.exports = CategoryModel;
