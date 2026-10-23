import pool from '../config/db.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isUuid = (id) => typeof id === 'string' && UUID_REGEX.test(id);

/**
 * Review History & Audit Log Model — PostgreSQL query layer
 * Tracks activity timeline and user actions on code reviews
 */
export const ReviewHistory = {
  /**
   * Create a new history entry
   */
  async create(data) {
    if (!isUuid(data.user) || !isUuid(data.review)) {
      return null;
    }

    const result = await pool.query(
      `INSERT INTO review_history (user_id, review_id, action, metadata)
       VALUES ($1, $2, $3, $4)
       RETURNING id, id AS "_id", user_id AS "user", review_id AS "review", action, metadata, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [data.user, data.review, data.action || 'created', JSON.stringify(data.metadata || {})]
    );
    return result.rows[0];
  },

  /**
   * Delete many history entries matching filter
   */
  async deleteMany(filter) {
    const conditions = [];
    const values = [];

    if (filter.user) {
      if (!isUuid(filter.user)) return;
      conditions.push(`user_id = $${values.length + 1}`);
      values.push(filter.user);
    }
    if (filter.review) {
      if (!isUuid(filter.review)) return;
      conditions.push(`review_id = $${values.length + 1}`);
      values.push(filter.review);
    }

    if (conditions.length === 0) return;

    await pool.query(
      `DELETE FROM review_history WHERE ${conditions.join(' AND ')}`,
      values
    );
  },

  /**
   * Find history entries for a user with optional pagination
   */
  async findByUser(userId, { skip = 0, limit = 20 } = {}) {
    if (!isUuid(userId)) {
      return [];
    }

    const result = await pool.query(
      `SELECT id, id AS "_id", user_id AS "user", review_id AS "review", action, metadata,
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM review_history WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, skip]
    );
    return result.rows;
  },
};
