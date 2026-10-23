import pool from '../config/db.js';

/**
 * Review History & Audit Log Model — PostgreSQL query layer
 * Tracks activity timeline and user actions on code reviews
 */
export const ReviewHistory = {
  /**
   * Create a new history entry
   */
  async create(data) {
    const result = await pool.query(
      `INSERT INTO review_history (user_id, review_id, action, metadata)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id AS "user", review_id AS "review", action, metadata, created_at AS "createdAt", updated_at AS "updatedAt"`,
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
      conditions.push(`user_id = $${values.length + 1}`);
      values.push(filter.user);
    }
    if (filter.review) {
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
    const result = await pool.query(
      `SELECT id, user_id AS "user", review_id AS "review", action, metadata,
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM review_history WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, skip]
    );
    return result.rows;
  },
};
