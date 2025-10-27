const getMakeID = async (makeName, dbClient = null) => {
	try {
		// Use the fallback pool from db-singleton only in development
		const { getPool } = require('./db-singleton.js');
		const pool = getPool();
		const db = dbClient || pool;
		
		if (!db) {
			throw new Error('No database client available');
		}
		
		const query = `SELECT makeID FROM makes WHERE makes.makeName = ?`
		return new Promise((resolve, reject) => {
			db.query(query, [makeName], 
			(err, result) => {
				if (err) {reject(err)};
				resolve(result[0].makeID);
				}
			);
		})
	} catch (err) {
		throw 'error while querying makes: ' + err;
	}
};

const getAllMakes = async (dbClient = null, supabaseClient = null) => {
	try {
		console.log('[getAllMakes] Starting...');
		console.log('[getAllMakes] supabaseClient:', !!supabaseClient);
		
		// Always use Supabase if provided
		if (supabaseClient) {
			console.log('[getAllMakes] Using provided Supabase client');
			const { data, error } = await supabaseClient
				.from('makes')
				.select('*');
			
			if (error) {
				console.error('[getAllMakes] Supabase error:', error);
				return [];
			}
			
			console.log('[getAllMakes] Fetched', data?.length || 0, 'makes');
			return data || [];
		}

		// Fallback: try to get Supabase from singleton
		console.log('[getAllMakes] No client provided, trying singleton...');
		const { getSupabase } = require('./db-singleton.js');
		const supabase = getSupabase();
		
		if (supabase) {
			console.log('[getAllMakes] Using Supabase from singleton');
			const { data, error } = await supabase
				.from('makes')
				.select('*');
			
			if (error) {
				console.error('[getAllMakes] Singleton Supabase error:', error);
				return [];
			}
			console.log('[getAllMakes] Fetched', data?.length || 0, 'makes');
			return data || [];
		}
		
		console.error('[getAllMakes] No Supabase client available');
		return [];
	} catch (err) {
		console.error('[getAllMakes] Error in getAllMakes catch:', err);
		console.error('[getAllMakes] Error stack:', err.stack);
		return []; // Return empty array instead of throwing
	}
};

const getMakeByName = async (makeName, dbClient = null) => {
	try {
		// Use the fallback pool from db-singleton only in development
		const { getPool } = require('./db-singleton.js');
		const pool = getPool();
		const db = dbClient || pool;
		
		if (!db) {
			throw new Error('No database client available');
		}
		
		const query = `SELECT makeID, manufacturerID, makeName FROM makes WHERE makes.makeName = ?`
		return new Promise((resolve, reject) => {
			db.query(query, [makeName], 
			(err, result) => {
				if (err) {reject(err)};
				resolve(result[0]);
				}
			);
		})
	} catch (err) {
		throw 'error while querying makes: ' + err;
	}
};

module.exports = { getMakeID, getAllMakes, getMakeByName };