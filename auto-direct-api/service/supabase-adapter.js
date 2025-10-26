// Supabase adapter to make it work like MySQL pool.query
class SupabaseAdapter {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
  }

  // Adapt Supabase to work like MySQL pool.query()
  async query(sql, params = []) {
    const queryType = sql.toLowerCase().trim().split(' ')[0];
    
    try {
      switch(queryType) {
        case 'select':
          return await this.handleSelect(sql, params);
        case 'insert':
          return await this.handleInsert(sql, params);
        case 'update':
          return await this.handleUpdate(sql, params);
        case 'delete':
          return await this.handleDelete(sql, params);
        default:
          console.warn('Unsupported query type:', sql.substring(0, 100));
          return [];
      }
    } catch (error) {
      console.error('Supabase adapter error:', error.message);
      throw error;
    }
  }

  async handleSelect(sql, params) {
    // Parse table name
    const fromMatch = sql.match(/from\s+(\w+)/i);
    if (!fromMatch) {
      console.error('Could not extract table name from SQL');
      return [];
    }
    const table = fromMatch[1];
    
    // Handle JOIN queries specially
    if (sql.toLowerCase().includes('join')) {
      return await this.handleJoinQuery(sql, params);
    }
    
    // Start building query
    let query = this.supabase.from(table).select('*');
    
    // Parse WHERE clauses
    const whereMatch = sql.match(/where\s+(.+?)(?:order|group|limit|$)/i);
    if (whereMatch) {
      const whereClause = whereMatch[1].trim();
      query = this.applyWhereClause(query, whereClause, params);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async handleJoinQuery(sql, params) {
    // Try to get main table and build query step by step
    // This is a simplified JOIN handler - gets main table data only
    const fromMatch = sql.match(/from\s+(\w+)/i);
    if (!fromMatch) return [];
    
    const mainTable = fromMatch[1];
    let query = this.supabase.from(mainTable).select('*');
    
    // Apply WHERE clause from main table
    const whereMatch = sql.match(/where\s+(.+?)(?:order|group|limit|$)/i);
    if (whereMatch) {
      const whereClause = whereMatch[1].trim();
      query = this.applyWhereClause(query, whereClause, params);
    }
    
    const { data, error } = await query;
    if (error) {
      console.error('JOIN query simplified, using main table only:', error.message);
      throw error;
    }
    
    return data || [];
  }

  async handleInsert(sql, params) {
    const insertMatch = sql.match(/insert\s+into\s+(\w+)\s*\((.+?)\)\s*values/i);
    if (!insertMatch) {
      throw new Error('Could not parse INSERT statement');
    }
    const table = insertMatch[1];
    const columns = insertMatch[2].split(',').map(c => c.trim().replace(/[`"]/g, ''));
    
    // Map params to object
    const data = {};
    columns.forEach((col, idx) => {
      if (params[idx] !== undefined) {
        data[col] = params[idx];
      }
    });
    
    const { data: result, error } = await this.supabase
      .from(table)
      .insert(data)
      .select();
    
    if (error) throw error;
    return result || { insertId: result[0]?.id };
  }

  async handleUpdate(sql, params) {
    const updateMatch = sql.match(/update\s+(\w+)\s+set\s+(.+?)\s+where/i);
    if (!updateMatch) {
      throw new Error('Could not parse UPDATE statement');
    }
    const table = updateMatch[1];
    const setClause = updateMatch[2];
    
    // Parse SET clause
    const updates = {};
    setClause.split(',').forEach(item => {
      const [key, value] = item.split('=').map(s => s.trim());
      const cleanKey = key.replace(/[`"]/g, '');
      // Handle placeholders
      if (value === '?') {
        // Skip, will be handled by params
      } else {
        updates[cleanKey] = value.replace(/['"]/g, '');
      }
    });
    
    // Apply WHERE to get rows to update
    const whereMatch = sql.match(/where\s+(.+?)(?:order|group|limit|$)/i);
    if (whereMatch) {
      // Simple WHERE handler
      const whereClause = whereMatch[1].trim();
      let whereQuery = this.supabase.from(table);
      whereQuery = this.applyWhereClause(whereQuery, whereClause, params);
      
      const { data: result, error } = await whereQuery.update(updates).select();
      if (error) throw error;
      return result || { affectedRows: 1 };
    }
    
    throw new Error('UPDATE without WHERE is dangerous');
  }

  async handleDelete(sql, params) {
    const deleteMatch = sql.match(/delete\s+from\s+(\w+)/i);
    if (!deleteMatch) {
      throw new Error('Could not parse DELETE statement');
    }
    const table = deleteMatch[1];
    
    const whereMatch = sql.match(/where\s+(.+?)(?:order|group|limit|$)/i);
    if (!whereMatch) {
      throw new Error('DELETE without WHERE is dangerous');
    }
    
    const whereClause = whereMatch[1].trim();
    let query = this.supabase.from(table);
    query = this.applyWhereClause(query, whereClause, params);
    
    const { error } = await query.delete();
    if (error) throw error;
    return { affectedRows: 1 };
  }

  applyWhereClause(query, whereClause, params) {
    // Remove parentheses
    whereClause = whereClause.replace(/[()]/g, '');
    
    // Split conditions by AND/OR
    const parts = whereClause.split(/\s+(and|or)\s+/i);
    let paramIndex = 0;
    
    for (let i = 0; i < parts.length; i += 2) {
      const condition = parts[i].trim();
      
      // Handle "table.column = ?" pattern (e.g., "users.emailAddress = ?")
      const tableColMatch = condition.match(/(\w+)\.(\w+)\s*=\s*\?/);
      if (tableColMatch && paramIndex < params.length) {
        query = query.eq(tableColMatch[2], params[paramIndex]);
        paramIndex++;
        continue;
      }
      
      // Handle "column = ?" pattern
      const eqMatch = condition.match(/(\w+)\s*=\s*\?/);
      if (eqMatch && paramIndex < params.length) {
        query = query.eq(eqMatch[1], params[paramIndex]);
        paramIndex++;
        continue;
      }
      
      // Handle "column = value" pattern
      const eqValueMatch = condition.match(/(\w+)\s*=\s*['"]?([^'"]+)['"]?/);
      if (eqValueMatch) {
        query = query.eq(eqValueMatch[1], eqValueMatch[2]);
        continue;
      }
      
      // Handle "column != value" pattern
      const neMatch = condition.match(/(\w+)\s*!=\s*['"]?(\w+)['"]?/);
      if (neMatch) {
        query = query.neq(neMatch[1], neMatch[2]);
        continue;
      }
      
      // Handle "column IN (...)"
      const inMatch = condition.match(/(\w+)\s+IN\s*\(([^)]+)\)/);
      if (inMatch) {
        const values = inMatch[2].split(',').map(v => v.trim().replace(/['"]/g, ''));
        query = query.in(inMatch[1], values);
        continue;
      }
    }
    
    return query;
  }

  findParamIndex(sql, clause) {
    // Count how many ? placeholders appear before this clause
    const beforeClause = sql.substring(0, sql.indexOf(clause));
    return (beforeClause.match(/\?/g) || []).length;
  }
}

module.exports = { SupabaseAdapter };

