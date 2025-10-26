const mysql = require('mysql2');
const { connectionConfig } = require('../config/connectionsConfig.js');

// Shared database pool
let pool;

function getPool() {
  if (!pool) {
    try {
      pool = mysql.createPool(connectionConfig);
      pool.getConnection((err, connection) => {
        if (err) {
          console.error('shared-db-service: Database connection failed:', err.message);
        } else {
          console.log('shared-db-service: Database connected successfully');
          connection.release();
        }
      });
    } catch (error) {
      console.error('shared-db-service: Failed to initialize database pool:', error.message);
    }
  }
  return pool;
}

module.exports = { getPool };

