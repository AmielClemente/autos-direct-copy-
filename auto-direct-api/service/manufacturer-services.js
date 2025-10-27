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

const createManufacturer = async ( manufacturerID, name, ABN, country ) => {
	try {
		const query = `INSERT INTO manufacturers (manufacturerID, manufacturerName, ABN, country, manufacturerStatus)	VALUES (?, ?, ?, ?, ?)`;
		return new Promise((resolve, reject) => {
			pool.query(query, [ manufacturerID, name, ABN, country, 'Active' ], 
				(err, result) => {
				if (err) reject(err);
					resolve(result);
				}
			);
		})
	} catch (err) {
		throw 'createManufacturer error: ' + err
	}
}

const getManufacturers = async () => {
	try {
		const query = `SELECT * FROM manufacturers`;
		return new Promise((resolve, reject) => {
			pool.query(query, 
				(err, result) => {
				if (err) reject(err);
					resolve(result);
				}
			);
		})
	} catch (err) {
		throw 'getManufacturers error: ' + err
	}
}

const getManufacturerByID = async (manufacturerID) => {
	try {
		const query = `SELECT * FROM manufacturers WHERE manufacturerID = ? AND manufacturerStatus = 'Active'`;
		return new Promise((resolve, reject) => {
			pool.query(query, [ manufacturerID ], 
				(err, result) => {
				if (err) reject(err);
					resolve(result[0]);
				}
			);
		})
	} catch (err) {
		throw 'getManufacturerByID error: ' + err
	}
}

const getManufacturerByUserID = async (userID) => {
	try {
		const query = `SELECT manufacturerID, manufacturerName, ABN, country, manufacturerStatus FROM manufacturers 
JOIN user_roles ON user_roles.manufacturerID = manufacturers.manufacturerID
WHERE user_roles.userID = ? AND manufacturerStatus = 'Active'`;
		return new Promise((resolve, reject) => {
			pool.query(query, [ userID ], 
				(err, result) => {
				if (err) reject(err);
					resolve(result[0]);
				}
			);
		})
	} catch (err) {
		throw 'getManufacturerByID error: ' + err
	}
}

const updateManufacturer = async (manufacturerID, manufacturerName, ABN, country, manufacturerStatus) => {
	try {
		const query = `UPDATE manufacturers SET manufacturerName = ?, ABN = ?, country = ?, manufacturerStatus = ? WHERE manufacturerID = ?`;
		return new Promise((resolve, reject) => {
			pool.query(query, [manufacturerName, ABN, country, manufacturerStatus, manufacturerID ],
			(err, result) => {
				if (err) reject(err);
				resolve(result);
				}
			);
		})
	} catch (err) {
		throw 'getUserRoles error: ' + err;
	}
};

const toggleManufacturerStatus = async (manufacturerID, status) => {
	try {
		const query = `UPDATE manufacturers SET manufacturerStatus = ? WHERE manufacturerID = ?`;
		return new Promise((resolve, reject) => {
			pool.query(query, [status, manufacturerID ],
			(err, result) => {
				if (err) reject(err);
				resolve(result);
				}
			);
		})
	} catch (err) {
		throw 'getUserRoles error: ' + err;
	}
}

module.exports = { createManufacturer, getManufacturers, getManufacturerByID, getManufacturerByUserID, updateManufacturer, toggleManufacturerStatus };