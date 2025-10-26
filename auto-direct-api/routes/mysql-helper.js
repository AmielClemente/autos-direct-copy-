// Helper to get database client in routes
// In production, this will return null to force use of req.pool or Supabase
// In development, it can fall back to MySQL if needed

const { getSupabase } = require('../service/db-singleton.js');

function getDatabaseClient(req) {
  // First try to use pool from middleware (already configured for Supabase or MySQL)
  if (req && req.pool) {
    return req.pool;
  }
  
  // In production, get Supabase directly
  if (process.env.NODE_ENV === 'production') {
    const supabase = getSupabase();
    if (supabase) {
      return {
        query: (sql, params) => {
          // This won't work directly with Supabase
          // Callers should use req.supabase from middleware instead
          console.error('Direct pool.query() call detected. Use req.supabase instead.');
          throw new Error('Use req.pool or req.supabase from middleware');
        }
      };
    }
  }
  
  // Fall back to db-singleton's pool for development
  const { getPool } = require('../service/db-singleton.js');
  const pool = getPool();
  
  if (!pool) {
    throw new Error('No database connection available');
  }
  
  return pool;
}

module.exports = { getDatabaseClient };

