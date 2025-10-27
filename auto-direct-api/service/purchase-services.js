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

const createPurchase = async ( purchaseNewID, userID, vehicleID, notes ) => {
	try {
		let createdTime = new Date(Date.now()).toISOString().replace('T', ' ').slice(0, 19);
		const query = `INSERT INTO purchases (purchaseID, purchaserID, vehicleID, orderDate, notes)	VALUES (?, ?, ?, ?, ?)`;
		return new Promise((resolve, reject) => {
			pool.query(query, [ purchaseNewID, userID, vehicleID, createdTime, notes ], 
				(err, result) => {
				if (err) reject(err);
					resolve(result);
				}
			);
		})
	} catch (err) {
		throw 'createPurchase error: ' + err
	}
}

const getPurchasesByManufacturer = async (manufacturerID) => {
	try {
		const query = `SELECT purchaseID, purchaserID, purchases.vehicleID, orderStatus, paymentStatus, paymentDate, deliveryStatus, deliveryDate, notes FROM purchases 
JOIN vehicles ON purchases.vehicleID = vehicles.vehicleID
JOIN makes ON makes.makeID = vehicles.makeID
JOIN manufacturers ON makes.manufacturerID = manufacturers.manufacturerID
WHERE manufacturers.manufacturerID = ?;`;
		return new Promise((resolve, reject) => {
			pool.query(query, [manufacturerID],
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

const getPurchasesByPurchaser = async (userID) => {
	try {
		const query = `SELECT purchaseID, purchaserID, purchases.vehicleID, orderStatus, orderDate, paymentStatus, paymentDate, deliveryStatus, deliveryDate, notes,
vehicles.modelName, vehicles.price, makes.makeName
FROM purchases 
JOIN vehicles ON purchases.vehicleID = vehicles.vehicleID
JOIN makes ON makes.makeID = vehicles.makeID
WHERE purchaserID = ?;`;
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

const updatePurchase = async (purchase) => {
	try {
		const { purchaseID, orderStatus, paymentStatus, paymentDate, deliveryStatus, deliveryDate, notes } = purchase;
		const query = `UPDATE purchases
SET orderStatus = ?, paymentStatus = ?, paymentDate = ?, deliveryStatus = ?, deliveryDate = ?, notes = ? WHERE purchaseID = ?`
		return new Promise((resolve, reject) => {
			pool.query(query, [orderStatus, paymentStatus, paymentDate, deliveryStatus, deliveryDate, notes, purchaseID], 
			(err, result) => {
				if (err) reject(err);
				resolve(result);
				}
			);
		})
	} catch (err) {
		throw 'getRoleIDByLabel error: ' + err;
	}
};

const updatePurchaseNote = async (purchaseID, notes) => {
	try {
		const query = `UPDATE purchases SET notes = ? WHERE purchaseID = ?`
		return new Promise((resolve, reject) => {
			pool.query(query, [notes, purchaseID], 
			(err, result) => {
				if (err) reject(err);
				resolve(result);
				}
			);
		})
	} catch (err) {
		throw 'getRoleIDByLabel error: ' + err;
	}
};

const cancelPurchase = async (purchaseID) => {
	try {
		const query = `UPDATE purchases
SET orderStatus = ? WHERE purchaseID = ?`
		return new Promise((resolve, reject) => {
			pool.query(query, [ 'Cancelled', purchaseID ], 
			(err, result) => {
				if (err) reject(err);
				resolve(result);
				}
			);
		})
	} catch (err) {
		throw 'getRoleIDByLabel error: ' + err;
	}
};

module.exports = { createPurchase, getPurchasesByManufacturer, getPurchasesByPurchaser, updatePurchase, updatePurchaseNote, cancelPurchase };