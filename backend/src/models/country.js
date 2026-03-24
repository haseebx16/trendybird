/**
 * Country model — Supabase queries for countries table.
 */
const { supabaseAdmin } = require('../config/supabase');
const logger = require('../config/logger');

const CountryModel = {
  /**
   * Get all active countries.
   */
  async getAll() {
    const { data, error } = await supabaseAdmin
      .from('countries')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      logger.error('Failed to fetch countries', { error: error.message });
      throw error;
    }
    return data;
  },

  /**
   * Get a country by its ISO code.
   */
  async getByCode(code) {
    const { data, error } = await supabaseAdmin
      .from('countries')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error) {
      logger.error('Failed to fetch country', { code, error: error.message });
      return null;
    }
    return data;
  },

  /**
   * Get active country codes (used by cron to iterate).
   */
  async getActiveCodes() {
    const { data, error } = await supabaseAdmin
      .from('countries')
      .select('code')
      .eq('is_active', true);

    if (error) {
      logger.error('Failed to fetch country codes', { error: error.message });
      throw error;
    }
    return data.map((c) => c.code);
  },
};

module.exports = CountryModel;
