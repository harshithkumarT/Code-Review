import pool from '../config/db.js';

/**
 * Code Review Model — PostgreSQL query layer replacing Mongoose CodeReview model
 */
export const CodeReview = {
  /**
   * Create a new code review
   */
  async create(data) {
    const result = await pool.query(
      `INSERT INTO code_reviews (user_id, language, title, original_code, reviewed_code, ai_feedback, score, bugs, optimizations, security_issues, complexity)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, user_id AS "user", language, title, original_code AS "originalCode", reviewed_code AS "reviewedCode",
                 ai_feedback AS "aiFeedback", score, bugs, optimizations, security_issues AS "securityIssues",
                 complexity, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [
        data.user,
        data.language,
        data.title,
        data.originalCode,
        data.reviewedCode || '',
        data.aiFeedback || '',
        data.score || 0,
        JSON.stringify(data.bugs || []),
        JSON.stringify(data.optimizations || []),
        JSON.stringify(data.securityIssues || []),
        JSON.stringify(data.complexity || { timeComplexity: 'N/A', spaceComplexity: 'N/A' }),
      ]
    );
    return result.rows[0];
  },

  /**
   * Find a single review by filter (id + user_id)
   */
  async findOne(filter) {
    const conditions = [];
    const values = [];

    if (filter._id || filter.id) {
      conditions.push(`id = $${values.length + 1}`);
      values.push(filter._id || filter.id);
    }
    if (filter.user) {
      conditions.push(`user_id = $${values.length + 1}`);
      values.push(filter.user);
    }

    const result = await pool.query(
      `SELECT id, id AS "_id", user_id AS "user", language, title, original_code AS "originalCode",
              reviewed_code AS "reviewedCode", ai_feedback AS "aiFeedback", score, bugs, optimizations,
              security_issues AS "securityIssues", complexity, created_at AS "createdAt", updated_at AS "updatedAt"
       FROM code_reviews WHERE ${conditions.join(' AND ')} LIMIT 1`,
      values
    );

    const row = result.rows[0] || null;
    if (row) {
      row.toObject = () => ({ ...row });
    }
    return row;
  },

  /**
   * Find review by ID
   */
  async findById(id) {
    return this.findOne({ _id: id });
  },

  /**
   * Count documents matching filter
   */
  async countDocuments(filter = {}) {
    let query = 'SELECT COUNT(*) AS count FROM code_reviews';
    const values = [];
    const conditions = [];

    if (filter.user) {
      conditions.push(`user_id = $${values.length + 1}`);
      values.push(filter.user);
    }
    if (filter.createdAt) {
      if (filter.createdAt.$gte) {
        conditions.push(`created_at >= $${values.length + 1}`);
        values.push(filter.createdAt.$gte);
      }
      if (filter.createdAt.$lte) {
        conditions.push(`created_at <= $${values.length + 1}`);
        values.push(filter.createdAt.$lte);
      }
    }
    if (filter.score !== undefined) {
      if (typeof filter.score === 'object') {
        if (filter.score.$gte !== undefined) {
          conditions.push(`score >= $${values.length + 1}`);
          values.push(filter.score.$gte);
        }
        if (filter.score.$lt !== undefined) {
          conditions.push(`score < $${values.length + 1}`);
          values.push(filter.score.$lt);
        }
        if (filter.score.$lte !== undefined) {
          conditions.push(`score <= $${values.length + 1}`);
          values.push(filter.score.$lte);
        }
      }
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const result = await pool.query(query, values);
    return parseInt(result.rows[0].count, 10);
  },

  /**
   * Delete a single review matching filter
   */
  async findOneAndDelete(filter) {
    const conditions = [];
    const values = [];

    if (filter._id || filter.id) {
      conditions.push(`id = $${values.length + 1}`);
      values.push(filter._id || filter.id);
    }
    if (filter.user) {
      conditions.push(`user_id = $${values.length + 1}`);
      values.push(filter.user);
    }

    const result = await pool.query(
      `DELETE FROM code_reviews WHERE ${conditions.join(' AND ')}
       RETURNING id, user_id AS "user", title, language`,
      values
    );
    return result.rows[0] || null;
  },

  /**
   * Delete many reviews matching filter
   */
  async deleteMany(filter) {
    const conditions = [];
    const values = [];

    if (filter.user) {
      conditions.push(`user_id = $${values.length + 1}`);
      values.push(filter.user);
    }

    if (conditions.length === 0) return;

    await pool.query(
      `DELETE FROM code_reviews WHERE ${conditions.join(' AND ')}`,
      values
    );
  },

  /**
   * Advanced search with filters, full-text search, sorting, and pagination
   */
  async findWithFilters({ userId, keywords, search, language, minScore, maxScore, startDate, endDate, sort, skip, limit }) {
    const conditions = ['user_id = $1'];
    const values = [userId];

    // Full-text search using PostgreSQL tsvector
    if (keywords && keywords.trim()) {
      conditions.push(`to_tsvector('english', coalesce(title, '') || ' ' || coalesce(ai_feedback, '') || ' ' || coalesce(original_code, '') || ' ' || coalesce(reviewed_code, '')) @@ plainto_tsquery('english', $${values.length + 1})`);
      values.push(keywords.trim());
    }

    // Title/language regex search
    if (search && search.trim() && !(keywords && keywords.trim())) {
      conditions.push(`(title ILIKE $${values.length + 1} OR language ILIKE $${values.length + 1})`);
      values.push(`%${search.trim()}%`);
    }

    if (language && language !== 'All') {
      conditions.push(`language = $${values.length + 1}`);
      values.push(language);
    }

    if (minScore !== undefined && minScore !== '') {
      conditions.push(`score >= $${values.length + 1}`);
      values.push(Number(minScore));
    }
    if (maxScore !== undefined && maxScore !== '') {
      conditions.push(`score <= $${values.length + 1}`);
      values.push(Number(maxScore));
    }

    if (startDate) {
      conditions.push(`created_at >= $${values.length + 1}`);
      values.push(new Date(startDate));
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      conditions.push(`created_at <= $${values.length + 1}`);
      values.push(end);
    }

    const whereClause = conditions.join(' AND ');

    // Sort mapping
    let orderBy = 'created_at DESC';
    if (sort === 'oldest') orderBy = 'created_at ASC';
    if (sort === 'score_desc') orderBy = 'score DESC, created_at DESC';
    if (sort === 'score_asc') orderBy = 'score ASC, created_at DESC';

    // Count
    const countResult = await pool.query(
      `SELECT COUNT(*) AS count FROM code_reviews WHERE ${whereClause}`,
      values
    );
    const totalCount = parseInt(countResult.rows[0].count, 10);

    // Data
    const dataValues = [...values, limit, skip];
    const dataResult = await pool.query(
      `SELECT id, id AS "_id", user_id AS "user", language, title, original_code AS "originalCode",
              reviewed_code AS "reviewedCode", ai_feedback AS "aiFeedback", score, bugs, optimizations,
              security_issues AS "securityIssues", complexity, created_at AS "createdAt", updated_at AS "updatedAt"
       FROM code_reviews WHERE ${whereClause}
       ORDER BY ${orderBy}
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      dataValues
    );

    const reviews = dataResult.rows.map((r) => {
      r.toObject = () => ({ ...r });
      return r;
    });

    return { reviews, totalCount };
  },

  /**
   * Aggregate: Get stats (avg, max, min score) for a user
   */
  async getStatsForUser(userId) {
    const result = await pool.query(
      `SELECT COALESCE(AVG(score), 0) AS "avgScore",
              COALESCE(MAX(score), 0) AS "maxScore",
              COALESCE(MIN(score), 0) AS "minScore"
       FROM code_reviews WHERE user_id = $1`,
      [userId]
    );
    return result.rows[0];
  },

  /**
   * Aggregate: Get language distribution for a user
   */
  async getLanguageDistribution(userId) {
    const result = await pool.query(
      `SELECT language, COUNT(*) AS count FROM code_reviews
       WHERE user_id = $1 GROUP BY language ORDER BY count DESC`,
      [userId]
    );
    return result.rows;
  },

  /**
   * Aggregate: Get timeline data (daily review counts and avg scores)
   */
  async getTimelineData(userId) {
    const result = await pool.query(
      `SELECT TO_CHAR(created_at, 'YYYY-MM-DD') AS date,
              COUNT(*) AS count,
              ROUND(AVG(score)) AS "avgScore"
       FROM code_reviews WHERE user_id = $1
       GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
       ORDER BY date ASC LIMIT 10`,
      [userId]
    );
    return result.rows.map((t) => ({
      date: t.date,
      count: parseInt(t.count, 10),
      avgScore: parseInt(t.avgScore, 10),
    }));
  },

  /**
   * Aggregate: Platform-wide average score (admin)
   */
  async getPlatformAvgScore() {
    const result = await pool.query(
      'SELECT COALESCE(AVG(score), 0) AS "avgScore" FROM code_reviews'
    );
    return Math.round(parseFloat(result.rows[0].avgScore));
  },

  /**
   * Find reviews with user info populated (for admin panel)
   */
  async findWithUser({ search, skip, limit }) {
    let whereClause = '';
    const values = [];

    if (search) {
      whereClause = `WHERE (cr.title ILIKE $1 OR cr.language ILIKE $1)`;
      values.push(`%${search}%`);
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) AS count FROM code_reviews cr ${whereClause}`,
      values
    );
    const totalCount = parseInt(countResult.rows[0].count, 10);

    const dataValues = [...values, limit, skip];
    const dataResult = await pool.query(
      `SELECT cr.id, cr.id AS "_id", cr.user_id, cr.language, cr.title, cr.original_code AS "originalCode",
              cr.reviewed_code AS "reviewedCode", cr.ai_feedback AS "aiFeedback", cr.score, cr.bugs,
              cr.optimizations, cr.security_issues AS "securityIssues", cr.complexity,
              cr.created_at AS "createdAt", cr.updated_at AS "updatedAt",
              json_build_object('id', u.id, '_id', u.id, 'name', u.name, 'email', u.email, 'profileImage', u.profile_image) AS "user"
       FROM code_reviews cr
       LEFT JOIN users u ON cr.user_id = u.id
       ${whereClause}
       ORDER BY cr.created_at DESC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      dataValues
    );

    return { reviews: dataResult.rows, totalCount };
  },
};
