const mysql = require('mysql2');
const { connectionConfig } = require('../config/connectionsConfig.js');

// Only create MySQL pool in development
let pool = null;
if (process.env.NODE_ENV !== 'production') {
	try {
		pool = mysql.createPool(connectionConfig);
	} catch (err) {
		console.log('MySQL pool creation skipped in production');
	}
}

const createUserRole = async ( userRolesNewID, userNewID, customerRoleID, dbClient = null ) => {
	// In production, dbClient must be provided (SupabaseAdapter)
	const db = dbClient || (process.env.NODE_ENV !== 'production' ? pool : null);
	
	if (!db) {
		console.error('createUserRole: Database client not provided');
		throw new Error('Database client not provided');
	}
	
	try {
		const query = `INSERT INTO user_roles (userRoleID, userID, roleID)	VALUES (?, ?, ?)`;
		return new Promise((resolve, reject) => {
			db.query(query, [ userRolesNewID, userNewID, customerRoleID ], 
				(err, result) => {
				if (err) reject(err);
					resolve(result);
				}
			);
		})
	} catch (err) {
		throw 'createUserRole error: ' + err
	}
}

const getUserAuth = async (userID) => {
	try {
		const query = `SELECT label FROM users 
			LEFT OUTER JOIN user_roles ON users.userID = user_roles.userID
			JOIN roles ON user_roles.roleID = roles.roleID
			WHERE (users.userID = ?)`;
		return new Promise((resolve, reject) => {
			pool.query(query, [userID],
			(err, result) => {
				if (err) reject(err);
				resolve(result);
			}
		);
	})
	} catch (err) {
		throw 'getUserAuth error: ' + err;
	}
}

const getRoleIDByLabel = async (roleLabel, dbClient = null) => {
	// In production, dbClient must be provided (SupabaseAdapter)
	const db = dbClient || (process.env.NODE_ENV !== 'production' ? pool : null);
	
	if (!db) {
		console.error('getRoleIDByLabel: Database client not provided');
		throw new Error('Database client not provided');
	}
	
	try {
		const query = `SELECT roleID FROM roles WHERE roles.label = ?`
		return new Promise((resolve, reject) => {
			db.query(query, [roleLabel], 
			(err, result) => {
				if (err) reject(err);
				resolve(result[0].roleID);
				}
			);
		})
	} catch (err) {
		throw 'getRoleIDByLabel error: ' + err;
	}
};

const getUserRolesByID = async (userID, dbClient = null) => {
	// In production, dbClient must be provided (SupabaseAdapter)
	const db = dbClient || (process.env.NODE_ENV !== 'production' ? pool : null);
	
	if (!db) {
		console.error('getUserRolesByID: Database client not provided');
		throw new Error('Database client not provided');
	}
	
	try {
		// Get user role assignments first
		const userRolesQuery = `SELECT roleID FROM user_roles WHERE userID = ?;`
		console.log('[getUserRolesByID] Query:', userRolesQuery);
		console.log('[getUserRolesByID] userID:', userID);
		
		return new Promise((resolve, reject) => {
			db.query(userRolesQuery, [userID],
				(err, userRolesResult) => {
					if (err) {
						console.error('[getUserRolesByID] Query error:', err);
						reject(err);
					} else {
						console.log('[getUserRolesByID] User roles result:', JSON.stringify(userRolesResult, null, 2));
						
						if (!userRolesResult || userRolesResult.length === 0) {
							resolve([]);
							return;
						}
						
						// Extract roleIDs
						const roleIDs = userRolesResult.map(row => row.roleID || row.roleid);
						console.log('[getUserRolesByID] roleIDs:', roleIDs);
						
						if (roleIDs.length === 0) {
							resolve([]);
							return;
						}
						
						// Query roles table to get labels
						const placeholders = roleIDs.map(() => '?').join(',');
						const rolesQuery = `SELECT roleID, label FROM roles WHERE roleID IN (${placeholders});`;
						console.log('[getUserRolesByID] Roles query:', rolesQuery);
						
						db.query(rolesQuery, roleIDs,
							(err2, rolesResult) => {
								if (err2) {
									console.error('[getUserRolesByID] Roles query error:', err2);
									reject(err2);
								} else {
									console.log('[getUserRolesByID] Final result:', JSON.stringify(rolesResult, null, 2));
									resolve(rolesResult || []);
								}
							}
						);
					}
				}
			);
		})
	} catch (err) {
		throw 'getUserRolesByID error: ' + err;
	}
};

const getRoles = async () => {
	try {
		const query = `SELECT * FROM roles;`
		return new Promise((resolve, reject) => {
			pool.query(query,
			(err, result) => {
				if (err) reject(err);
				resolve(result);
				}
			);
		})
	} catch (err) {
		throw 'getRoles error: ' + err;
	}
};

const getAllUserRoles = async () => {
	try {
		const query = `SELECT * FROM user_roles JOIN roles ON user_roles.roleID = roles.roleID;`
		return new Promise((resolve, reject) => {
			pool.query(query,
			(err, result) => {
				if (err) reject(err);
				resolve(result);
				}
			);
		})
	} catch (err) {
		throw 'getAllUserRoles error: ' + err;
	}

}

const deleteUserRoleByUserIDAndLabel = async (userID, roleID) => {
	try {
		const query = `DELETE FROM user_roles WHERE userID = ? AND roleID = ?;`
		return new Promise((resolve, reject) => {
			pool.query(query, [userID, roleID],
			(err, result) => {
				if (err) reject(err);
				resolve(result);
				}
			);
		})
	} catch (error) {
		throw 'deleteUserRole error: ' + err;
	}
}

module.exports = { createUserRole, getUserAuth, getRoles, getRoleIDByLabel, getUserRolesByID, getAllUserRoles, deleteUserRoleByUserIDAndLabel };