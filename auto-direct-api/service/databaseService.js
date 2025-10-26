const mysql = require('mysql2');
const { createClient } = require('@supabase/supabase-js');
const { connectionConfig, supabaseConfig } = require('../config/supabaseConfig');

class DatabaseService {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.mysqlPool = null;
    this.supabase = null;
    
    if (this.isProduction && supabaseConfig.url) {
      // Use Supabase in production
      this.supabase = createClient(supabaseConfig.url, supabaseConfig.serviceRoleKey);
      console.log('Using Supabase database');
    } else {
      // Use MySQL in development
      this.mysqlPool = mysql.createPool(connectionConfig);
      console.log('Using MySQL database');
    }
  }

  // Generic query method that works with both databases
  async query(sql, params = []) {
    if (this.isProduction && this.supabase) {
      return this.supabaseQuery(sql, params);
    } else {
      return this.mysqlQuery(sql, params);
    }
  }

  // MySQL query method
  async mysqlQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.mysqlPool.execute(sql, params, (err, results) => {
        if (err) {
          console.error('MySQL Error:', err);
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

  // Supabase query method (simplified - you'll need to adapt based on your specific queries)
  async supabaseQuery(sql, params = []) {
    try {
      // This is a simplified implementation
      // You'll need to adapt this based on your specific SQL queries
      const { data, error } = await this.supabase.rpc('execute_sql', {
        sql_query: sql,
        params: params
      });
      
      if (error) {
        console.error('Supabase Error:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Supabase Query Error:', error);
      throw error;
    }
  }

  // User-specific methods
  async getUserByEmail(email) {
    if (this.isProduction && this.supabase) {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('emailAddress', email)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } else {
      const sql = 'SELECT * FROM users WHERE emailAddress = ?';
      const results = await this.mysqlQuery(sql, [email]);
      return results[0];
    }
  }

  async createUser(userData) {
    if (this.isProduction && this.supabase) {
      const { data, error } = await this.supabase
        .from('users')
        .insert([userData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      const sql = 'INSERT INTO users SET ?';
      const result = await this.mysqlQuery(sql, [userData]);
      return { insertId: result.insertId, ...userData };
    }
  }

  // Vehicle-specific methods
  async getVehicles() {
    if (this.isProduction && this.supabase) {
      const { data, error } = await this.supabase
        .from('vehicles')
        .select(`
          *,
          makes (
            makeName,
            manufacturers (
              manufacturerName
            )
          )
        `)
        .eq('vehicleStatus', 'Available');
      
      if (error) throw error;
      return data;
    } else {
      const sql = `
        SELECT v.*, m.makeName, man.manufacturerName 
        FROM vehicles v 
        JOIN makes m ON v.makeID = m.makeID 
        JOIN manufacturers man ON m.manufacturerID = man.manufacturerID 
        WHERE v.vehicleStatus = 'Available'
      `;
      return await this.mysqlQuery(sql);
    }
  }

  // Close connections
  async close() {
    if (this.mysqlPool) {
      await this.mysqlPool.end();
    }
  }
}

module.exports = new DatabaseService();

