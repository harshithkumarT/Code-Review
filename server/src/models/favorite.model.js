import pool from '../config/db.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isUuid = (id) => typeof id === 'string' && UUID_REGEX.test(id);

/**
 * Favorites Model — PostgreSQL query layer
 * Junction / Bookmarks model referencing User and CodeReview
 */
export const Favorite = {
  /**
   * Create a new favorite entry
   */
  async create({ user, review }) {
    if (!isUuid(user) || !isUuid(review)) {
      return null;
    }

    const result = await pool.query(
      `INSERT INTO favorites (user_id, review_id)
       VALUES ($1, $2)
       RETURNING id, id AS "_id", user_id AS "user", review_id AS "review", created_at AS "createdAt", updated_at AS "updatedAt"`,
      [user, review]
    );
    return result.rows[0];
  },

  /**
   * Find a single favorite by user and review
   */
  async findOne({ user, review }) {
    if (!isUuid(user) || !isUuid(review)) {
      return null;
    }

    const result = await pool.query(
      `SELECT id, id AS "_id", user_id AS "user", review_id AS "review", created_at AS "createdAt"
       FROM favorites WHERE user_id = $1 AND review_id = $2 LIMIT 1`,
      [user, review]
    );
    return result.rows[0] || null;
  },

  /**
   * Delete favorite by its ID
   */
  async findByIdAndDelete(id) {
    if (!isUuid(id)) {
      return null;
    }

    const result = await pool.query(
      `DELETE FROM favorites WHERE id = $1 RETURNING id, id AS "_id"`,
      [id]
    );
    return result.rows[0] || null;
  },

  /**
   * Delete a favorite matching user + review
   */
  async findOneAndDelete({ user, review }) {
    if (!isUuid(user) || !isUuid(review)) {
      return null;
    }

    const result = await pool.query(
      `DELETE FROM favorites WHERE user_id = $1 AND review_id = $2 RETURNING id, id AS "_id"`,
      [user, review]
    );
    return result.rows[0] || null;
  },

  /**
   * Delete many favorites matching filter
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
      `DELETE FROM favorites WHERE ${conditions.join(' AND ')}`,
      values
    );
  },

  /**
   * Find all favorites for a user (with populated review data)
   */
  async findByUserPopulated(userId) {
    if (!isUuid(userId)) {
      return [];
    }

    const result = await pool.query(
      `SELECT f.id, f.user_id AS "user", f.review_id,
              cr.id AS "review_id", cr.user_id AS "review_user", cr.language, cr.title,
              cr.original_code AS "originalCode", cr.reviewed_code AS "reviewedCode",
              cr.ai_feedback AS "aiFeedback", cr.score, cr.bugs, cr.optimizations,
              cr.security_issues AS "securityIssues", cr.complexity,
              cr.created_at AS "reviewCreatedAt", cr.updated_at AS "reviewUpdatedAt"
       FROM favorites f
       LEFT JOIN code_reviews cr ON f.review_id = cr.id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [userId]
    );

    return result.rows
      .filter((row) => row.review_id !== null)
      .map((row) => ({
        id: row.review_id,
        _id: row.review_id,
        user: row.review_user,
        language: row.language,
        title: row.title,
        originalCode: row.originalCode,
        reviewedCode: row.reviewedCode,
        aiFeedback: row.aiFeedback,
        score: row.score,
        bugs: row.bugs,
        optimizations: row.optimizations,
        securityIssues: row.securityIssues,
        complexity: row.complexity,
        createdAt: row.reviewCreatedAt,
        updatedAt: row.reviewUpdatedAt,
      }));
  },

  /**
   * Find all favorites for a user (just review IDs for checking favorite status)
   */
  async findByUser(userId) {
    if (!isUuid(userId)) {
      return [];
    }

    const result = await pool.query(
      `SELECT review_id AS "review" FROM favorites WHERE user_id = $1`,
      [userId]
    );
    return result.rows;
  },
};
