// Supabase adapter to make it work like MySQL pool.query
class SupabaseAdapter {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
  }

  // Adapt Supabase to work like MySQL pool.query()
  query(sql, params = []) {
    return new Promise((resolve, reject) => {
      // For SELECT queries
      if (sql.toLowerCase().trim().startsWith('select')) {
        // Extract table name from SQL
        const match = sql.match(/from\s+(\w+)/i);
        if (!match) {
          return reject(new Error('Could not extract table name from SQL'));
        }
        const table = match[1];
        
        // Get all rows from Supabase
        this.supabase
          .from(table)
          .select('*')
          .then(({ data, error }) => {
            if (error) {
              reject(error);
            } else {
              resolve(data || []);
            }
          });
      } else {
        // For other queries, log and return empty result
        console.log('Supabase adapter: Unsupported query type:', sql.substring(0, 50));
        resolve([]);
      }
    });
  }
}

module.exports = { SupabaseAdapter };

