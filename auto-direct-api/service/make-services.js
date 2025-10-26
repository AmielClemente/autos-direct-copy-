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
		// Always use Supabase
		if (supabaseClient) {
			const { data, error } = await supabaseClient
				.from('makes')
				.select('*');
			
			if (error) {
				console.error('Error in getAllMakes from Supabase:', error);
				return [];
			}
			return data || [];
		}

		// Fallback: try to get Supabase from singleton
		const { getSupabase } = require('./db-singleton.js');
		const supabase = getSupabase();
		
		if (supabase) {
			const { data, error } = await supabase
				.from('makes')
				.select('*');
			
			if (error) {
				console.error('Error in getAllMakes from Supabase:', error);
				return [];
			}
			return data || [];
		}
		
		console.error('getAllMakes: No Supabase client available');
		return [];
	} catch (err) {
		console.error('Error in getAllMakes catch:', err);
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