import pg from 'pg';

const { Pool } = pg;

let pool;

/**
 * Get or create the PostgreSQL connection pool (lazy initialization)
 */
export const getPool = () => {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    pool = new Pool({
      connectionString,
      ssl: connectionString?.includes('sslmode=require')
        ? { rejectUnauthorized: false }
        : false,
    });
  }
  return pool;
};

/**
 * Initialize database connection and create tables if they don't exist
 */
export const connectDB = async () => {
  try {
    const p = getPool();
    const client = await p.connect();
    console.log(`🐘 PostgreSQL Connected: ${client.host}:${client.port}`);
    client.release();

    // Create tables on startup
    await createTables();
  } catch (error) {
    console.error(`❌ PostgreSQL Connection Error: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Create all application tables with proper relationships and indexes
 */
const createTables = async () => {
  const p = getPool();
  const query = `
    -- Enable UUID generation
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      profile_image TEXT DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Code Reviews table
    CREATE TABLE IF NOT EXISTS code_reviews (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      language VARCHAR(100) NOT NULL,
      title VARCHAR(500) NOT NULL,
      original_code TEXT NOT NULL,
      reviewed_code TEXT DEFAULT '',
      ai_feedback TEXT DEFAULT '',
      score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
      bugs JSONB DEFAULT '[]',
      optimizations JSONB DEFAULT '[]',
      security_issues JSONB DEFAULT '[]',
      complexity JSONB DEFAULT '{"timeComplexity": "N/A", "spaceComplexity": "N/A"}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Review History / Audit Log table
    CREATE TABLE IF NOT EXISTS review_history (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      review_id UUID NOT NULL REFERENCES code_reviews(id) ON DELETE CASCADE,
      action VARCHAR(50) NOT NULL DEFAULT 'created' CHECK (action IN ('created', 'updated', 'favorited', 'shared', 'deleted')),
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Favorites table
    CREATE TABLE IF NOT EXISTS favorites (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      review_id UUID NOT NULL REFERENCES code_reviews(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, review_id)
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_code_reviews_user_id ON code_reviews(user_id);
    CREATE INDEX IF NOT EXISTS idx_code_reviews_language ON code_reviews(language);
    CREATE INDEX IF NOT EXISTS idx_code_reviews_score ON code_reviews(score);
    CREATE INDEX IF NOT EXISTS idx_code_reviews_user_created ON code_reviews(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_code_reviews_user_lang_score ON code_reviews(user_id, language, score DESC);
    CREATE INDEX IF NOT EXISTS idx_review_history_user_id ON review_history(user_id);
    CREATE INDEX IF NOT EXISTS idx_review_history_review_id ON review_history(review_id);
    CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
    CREATE INDEX IF NOT EXISTS idx_favorites_review_id ON favorites(review_id);

    -- Full-text search index on code reviews
    CREATE INDEX IF NOT EXISTS idx_code_reviews_fts ON code_reviews
      USING GIN (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(ai_feedback, '') || ' ' || coalesce(original_code, '') || ' ' || coalesce(reviewed_code, '')));
  `;

  await p.query(query);
  console.log('📋 Database tables initialized successfully');
};

export default {
  query: (...args) => getPool().query(...args),
};
