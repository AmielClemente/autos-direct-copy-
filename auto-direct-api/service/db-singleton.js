const mysql = require('mysql2');
const { connectionConfig } = require('../config/connectionsConfig.js');

// Singleton database pool
let pool = null;

function getPool() {
  if (!pool && process.env.NODE_ENV !== 'production') {
    try {
      console.log('Creating MySQL pool in db-singleton');
      pool = mysql.createPool(connectionConfig);
      pool.getConnection((err, connection) => {
        if (err) {
          console.error('db-singleton: Database connection failed:', err.message);
        } else {
          console.log('db-singleton: Database connected successfully');
          connection.release();
        }
      });
    } catch (error) {
      console.error('db-singleton: Failed to initialize database pool:', error.message);
    }
  }
  return pool;
}

module.exports = { getPool };

