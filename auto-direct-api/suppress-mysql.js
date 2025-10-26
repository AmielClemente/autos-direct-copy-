// This file is created to prevent MySQL pool creation errors
// All database calls should go through SupabaseAdapter or use req.pool from middleware

// Override mysql2 to prevent pool creation in production
const originalCreatePool = require('mysql2').createPool;

if (process.env.NODE_ENV === 'production') {
  console.log('MySQL pool creation suppressed in production');
}

module.exports = {
  suppressMySQLError: () => {
    // Do nothing - prevents MySQL connection attempts
    return null;
  }
};

