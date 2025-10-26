const mysql = require('mysql2');
const { createClient } = require('@supabase/supabase-js');
const { connectionConfig } = require('../config/connectionsConfig.js');
const { supabaseConfig } = require('../config/supabaseConfig.js');

// Singleton database pool/client
let pool = null;
let supabase = null;

function getPool() {
  // Always use Supabase now - return null to prevent MySQL connections
  console.log('db-singleton: Using Supabase for all queries');
  return null;
}

function getSupabase() {
  // Initialize Supabase client for all environments
  if (!supabase) {
    try {
      if (supabaseConfig && supabaseConfig.url && supabaseConfig.serviceRoleKey) {
        supabase = createClient(supabaseConfig.url, supabaseConfig.serviceRoleKey);
        console.log('db-singleton: Supabase client initialized for all environments');
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

