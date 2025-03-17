import { Pool } from 'pg';
import { logger } from './utils/logger';

// Database connection based on environment
export const connectDB = async () => {
  try {
    // Use PostgreSQL for all data storage
    if (process.env.DATABASE_URL) {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });
      
      // Test the connection
      const client = await pool.connect();
      client.release();
      logger.info('PostgreSQL connected');
      
      // Initialize tables if they don't exist
      await initializeTables(pool);
      
      return pool;
    }
    
    logger.info('Running without database connection');
    return null;
  } catch (error) {
    logger.error('Database connection error:', error);
    process.exit(1);
  }
};

// Initialize database tables
async function initializeTables(pool: Pool) {
  const client = await pool.connect();
  
  try {
    // Create builds table
    await client.query(`
      CREATE TABLE IF NOT EXISTS builds (
        id SERIAL PRIMARY KEY,
        provider VARCHAR(100) NOT NULL,
        build_time FLOAT NOT NULL,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        success BOOLEAN NOT NULL,
        logs TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create providers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS providers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        api_key VARCHAR(255),
        api_endpoint VARCHAR(255),
        config JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    logger.info('Database tables initialized');
  } catch (error) {
    logger.error('Error initializing database tables:', error);
    throw error;
  } finally {
    client.release();
  }
} 