const { getPool } = require('./db-singleton.js');

const pool = getPool();

const getMakeID = async (makeName) => {
	try {
		const query = `SELECT makeID FROM makes WHERE makes.makeName = ?`
		return new Promise((resolve, reject) => {
			pool.query(query, [makeName], 
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
		// If we have Supabase in production, use it
		if (supabaseClient && process.env.NODE_ENV === 'production') {
			const { data, error } = await supabaseClient
				.from('makes')
				.select('*');
			
			if (error) {
				console.error('Error in getAllMakes from Supabase:', error);
				return [];
			}
			return data || [];
		}

		// Otherwise use MySQL
		if (!pool && !dbClient) {
			console.error('getAllMakes: No database pool or client provided');
			return [];
		}

		const db = dbClient || pool;
		const query = `SELECT * FROM makes`
		return new Promise((resolve, reject) => {
			db.query(query,
			(err, result) => {
				if (err) {
					console.error('Error in getAllMakes:', err);
					resolve([]); // Return empty array instead of rejecting
				} else {
					resolve(result);
				}
			});
		});
	} catch (err) {
		console.error('Error in getAllMakes catch:', err);
		return []; // Return empty array instead of throwing
	}
};

const getMakeByName = async (makeName) => {
	try {
		const query = `SELECT makeID, manufacturerID, makeName FROM makes WHERE makes.makeName = ?`
		return new Promise((resolve, reject) => {
			pool.query(query, [makeName], 
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