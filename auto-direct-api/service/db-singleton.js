const mysql = require('mysql2');
const { createClient } = require('@supabase/supabase-js');
const { connectionConfig } = require('../config/connectionsConfig.js');
const { supabaseConfig } = require('../config/supabaseConfig.js');

// Singleton database pool/client
let pool = null;
let supabase = null;

function getPool() {
  // In production, don't create MySQL pool at all
  if (process.env.NODE_ENV === 'production') {
    console.log('db-singleton: Production mode - MySQL pool not available');
    return null;
  }
  
  // In development, create MySQL pool
  if (!pool) {
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

function getSupabase() {
  // Initialize Supabase client for production
  if (!supabase && process.env.NODE_ENV === 'production') {
    try {
      if (supabaseConfig && supabaseConfig.url && supabaseConfig.serviceRoleKey) {
        supabase = createClient(supabaseConfig.url, supabaseConfig.serviceRoleKey);
        console.log('db-singleton: Supabase client initialized for production');
      } else {
        console.error('db-singleton: Supabase configuration missing');
      }
    } catch (error) {
      console.error('db-singleton: Failed to initialize Supabase:', error.message);
    }
  }
  return supabase;
}

module.exports = { getPool, getSupabase };

