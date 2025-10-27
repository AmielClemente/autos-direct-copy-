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

const createTestDrive = async ( testDriveNewID, userID, vehicleID, status, notes ) => {
	try {
		let createdTime = new Date(Date.now()).toISOString().replace('T', ' ').slice(0, 19);
		let dealerID = null;
		
		// Try to fetch dealerID for the vehicle, but don't let it block the insert
		try {
			const dealerQuery = `SELECT dealerID FROM vehicles WHERE vehicleID = ? LIMIT 1`;
			const dealerResult = await new Promise((resolve, reject) => {
				pool.query(dealerQuery, [vehicleID], (err, result) => {
					if (err) return reject(err);
					resolve(result);
				});
			});
			
			if (dealerResult && dealerResult.length > 0 && dealerResult[0].dealerID) {
				dealerID = dealerResult[0].dealerID;
			} else {
				console.warn(`No dealerID found for vehicleID ${vehicleID}, using NULL.`);
				dealerID = null;
			}
		} catch (dealerErr) {
			console.warn(`Error fetching dealerID for vehicleID ${vehicleID}, using NULL:`, dealerErr);
			dealerID = null;
		}
		
		const query = `INSERT INTO test_drive_bookings (bookingID, userID, vehicleID, dealerID, time, status, customerNotes) VALUES (?, ?, ?, ?, ?, ?, ?);`;
		return new Promise((resolve, reject) => {
			pool.query(query, [ testDriveNewID, userID, vehicleID, dealerID, createdTime, status, notes ], 
				(err, result) => {
				if (err) reject(err);
					resolve(result);
				}
			);
		})
	} catch (err) {
		throw 'createTestDrive error: ' + err
	}
}

const getTestDrivesByUser = async (userID) => {
	try {
		const query = `SELECT bookingID, userID, vehicleID, dealerID, time, status, customerNotes, vehicles.modelName, dealers.streetNo, dealers.StreetName, dealers.suburb, dealers.postcode FROM test_drive_bookings
JOIN vehicles ON test_drive_bookings.vehicleID = vehicles.vehicleID 
JOIN dealers ON test_drive_bookings.dealerID = dealers.dealerID
WHERE userID = ?;`

		return new Promise((resolve, reject) => {
			pool.query(query, [userID],
				(err, result) => {
					if (err) reject(err);
					resolve(result);
				}
			);
		})
	} catch (err) {
		throw 'getTestDrivesByUser error: ' + err;
	}
}

const getTestDrivesByUserDealer = async (userID) => {
	try {
		const query = `SELECT bookingID, test_drive_bookings.userID, test_drive_bookings.vehicleID, test_drive_bookings.dealerID, time, status, customerNotes, vehicles.modelName, dealers.streetNo, dealers.StreetName, dealers.suburb, dealers.postcode 
FROM test_drive_bookings
JOIN vehicles ON test_drive_bookings.vehicleID = vehicles.vehicleID 
JOIN dealers ON test_drive_bookings.dealerID = dealers.dealerID
JOIN user_roles ON user_roles.dealerID = dealers.dealerID
WHERE user_roles.userID = ?;`

		return new Promise((resolve, reject) => {
			pool.query(query, [userID],
				(err, result) => {
					if (err) reject(err);
					resolve(result);
				}
			);
		})
	} catch (err) {
		throw 'getTestDrivesByUserDealer error: ' + err;
	}
}

const getTestDrivesByVehicle = async (vehicleID) => {
	try {
		const query = `SELECT bookingID, userID, vehicleID, dealerID, time, status, customerNotes, vehicles.modelName, dealers.streetNo, dealers.StreetName, dealers.suburb, dealers.postcode FROM test_drive_bookings
JOIN vehicles ON test_drive_bookings.vehicleID = vehicles.vehicleID 
JOIN dealers ON test_drive_bookings.dealerID = dealers.dealerID
WHERE vehicleID = ?;`

		return new Promise((resolve, reject) => {
			pool.query(query, [vehicleID],
				(err, result) => {
					if (err) reject(err);
					resolve(result);
				}
			);
		})
	} catch (err) {
		throw 'getTestDrivesByVehicle error: ' + err;
	}
}

// const updateDealerTestDrive = async (bookingID, status) => {
// 	try {
// 		const query = `UPDATE test_drive_bookings SET status = ? WHERE bookingID = ?;`

// 		return new Promise((resolve, reject) => {
// 			pool.query(query, [status, bookingID],
// 				(err, result) => {
// 					if (err) reject(err);
// 					resolve(result);
// 				}
// 			);
// 		})
// 	} catch (err) {
// 		throw 'updateTestDrive error: ' + err;
// 	}
// }

const updateUserTestDrive = async (bookingID, dealerID, time, customerNotes) => {
	try {
		const query = `UPDATE test_drive_bookings SET dealerID = ?, time = ?, customerNotes = ? WHERE bookingID = ?;`

		return new Promise((resolve, reject) => {
			pool.query(query, [dealerID, time, status, customerNotes, bookingID],
				(err, result) => {
					if (err) reject(err);
					resolve(result);
				}
			);
		})
	} catch (err) {
		throw 'updateTestDrive error: ' + err;
	}
}

const updateTestDriveStatus = async (bookingID, status) => {
	try{
		const query = `UPDATE test_drive_bookings SET status = ? WHERE bookingID = ?;`

		return new Promise((resolve, reject) => {
			pool.query(query, [status, bookingID],
				(err, result) => {
					if (err) reject(err);
					resolve(result);
				}
			);
		})
	} catch (err) {
		throw 'updateTestDriveStatus error: ' + err;
	}
}

module.exports = { createTestDrive, getTestDrivesByUser, getTestDrivesByUserDealer, getTestDrivesByVehicle, updateUserTestDrive, updateTestDriveStatus };