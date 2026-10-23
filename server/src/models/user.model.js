import pool from '../config/db.js';
import bcrypt from 'bcryptjs';

/**
 * User Model — PostgreSQL query layer replacing Mongoose User model
 */
export const User = {
  /**
   * Create a new user with hashed password
   */
  async create({ name, email, password, role = 'user', profileImage }) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, profile_image)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, profile_image AS "profileImage", created_at AS "createdAt", updated_at AS "updatedAt"`,
      [name, email.toLowerCase(), hashedPassword, role, profileImage || undefined]
    );
    return result.rows[0];
  },

  /**
   * Find user by email (optionally include password for auth)
   */
  async findOne({ email }, { selectPassword = false } = {}) {
    const columns = selectPassword
      ? 'id, name, email, password, role, profile_image AS "profileImage", created_at AS "createdAt", updated_at AS "updatedAt"'
      : 'id, name, email, role, profile_image AS "profileImage", created_at AS "createdAt", updated_at AS "updatedAt"';

    const result = await pool.query(
      `SELECT ${columns} FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [email]
    );
    const user = result.rows[0] || null;
    if (user && selectPassword) {
      user.comparePassword = async (enteredPassword) => {
        return await bcrypt.compare(enteredPassword, user.password);
      };
    }
    return user;
  },

  /**
   * Find user by ID (excludes password by default)
   */
  async findById(id, { selectPassword = false } = {}) {
    const columns = selectPassword
      ? 'id, name, email, password, role, profile_image AS "profileImage", created_at AS "createdAt", updated_at AS "updatedAt"'
      : 'id, name, email, role, profile_image AS "profileImage", created_at AS "createdAt", updated_at AS "updatedAt"';

    const result = await pool.query(
      `SELECT ${columns} FROM users WHERE id = $1 LIMIT 1`,
      [id]
    );
    const user = result.rows[0] || null;
    if (user && selectPassword) {
      user.comparePassword = async (enteredPassword) => {
        return await bcrypt.compare(enteredPassword, user.password);
      };
    }
    return user;
  },

  /**
   * Update user fields by ID, returns updated user (without password)
   */
  async findByIdAndUpdate(id, updates) {
    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    const fieldMap = {
      name: 'name',
      email: 'email',
      password: 'password',
      profileImage: 'profile_image',
      role: 'role',
    };

    for (const [key, value] of Object.entries(updates)) {
      const column = fieldMap[key] || key;
      setClauses.push(`${column} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query(
      `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${paramIndex}
       RETURNING id, name, email, role, profile_image AS "profileImage", created_at AS "createdAt", updated_at AS "updatedAt"`,
      values
    );
    return result.rows[0] || null;
  },

  /**
   * Delete user by ID
   */
  async findByIdAndDelete(id) {
    const result = await pool.query(
      `DELETE FROM users WHERE id = $1 RETURNING id`,
      [id]
    );
    return result.rows[0] || null;
  },

  /**
   * Count users matching optional filter
   */
  async countDocuments(filter = {}) {
    let query = 'SELECT COUNT(*) AS count FROM users';
    const values = [];
    const conditions = [];

    if (filter.role) {
      conditions.push(`role = $${values.length + 1}`);
      values.push(filter.role);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const result = await pool.query(query, values);
    return parseInt(result.rows[0].count, 10);
  },

  /**
   * Find users with search, pagination, and sorting
   */
  async findWithPagination({ search, skip, limit, sort = { createdAt: -1 } }) {
    let query = `SELECT id, name, email, role, profile_image AS "profileImage", created_at AS "createdAt", updated_at AS "updatedAt" FROM users`;
    let countQuery = 'SELECT COUNT(*) AS count FROM users';
    const values = [];
    const conditions = [];

    if (search) {
      conditions.push(`(name ILIKE $${values.length + 1} OR email ILIKE $${values.length + 1})`);
      values.push(`%${search}%`);
    }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    // Sort
    const sortCol = Object.keys(sort)[0] === 'createdAt' ? 'created_at' : Object.keys(sort)[0];
    const sortDir = Object.values(sort)[0] === -1 ? 'DESC' : 'ASC';
    query += ` ORDER BY ${sortCol} ${sortDir}`;

    // Pagination
    query += ` LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    const paginationValues = [...values, limit, skip];

    const [usersResult, countResult] = await Promise.all([
      pool.query(query, paginationValues),
      pool.query(countQuery, values),
    ]);

    return {
      users: usersResult.rows,
      totalCount: parseInt(countResult.rows[0].count, 10),
    };
  },

  /**
   * Save updated password (with bcrypt hashing)
   */
  async savePassword(id, newPassword) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await pool.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, id]
    );
  },
};
