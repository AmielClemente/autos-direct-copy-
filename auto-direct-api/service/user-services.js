const mysql = require('mysql2');
const { connectionConfig } = require('../config/connectionsConfig.js');

let pool;
try {
  pool = mysql.createPool(connectionConfig);
  // Test connection
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('user-services: Database connection failed:', err.message);
    } else {
      console.log('user-services: Database connected successfully');
      connection.release();
    }
  });
} catch (error) {
  console.error('user-services: Failed to initialize database pool:', error.message);
}

const createUser = async (userNewID, user ) => {
	try {
		const {firstName, lastName, emailAddress, passwordHash, phoneNumber, streetNo, streetName, suburb, postcode } = user;

		// Prep SQL query with added timestamp fro createdAt
		let createdTime = new Date(Date.now()).toISOString().replace('T', ' ').slice(0, 19);
		const query = `INSERT INTO users (userID, firstName, lastName, emailAddress, passwordHash, phone, createdTime, streetNo, streetName, suburb, postcode, user_status)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

		return new Promise((resolve, reject) => {
			pool.query(query, [
				userNewID, firstName, lastName, emailAddress, passwordHash, phoneNumber || "00000000", createdTime, streetNo, streetName, suburb, postcode, "Active"],
				(err, result) => {
				if (err) reject(err);
					resolve(result);
				}
			);
		})
	} catch (err) {
		throw 'error while creating user: ' + err;
	}
}

const getAllUsers = () => {
	try {
		const query = `SELECT userID, firstName, lastName, emailAddress, phone, createdTime, user_status 
			FROM users 
			WHERE user_status = 'Active' 
			OR (user_status = 'Inactive' AND SUBSTRING_INDEX(emailAddress, '.del', 1) NOT IN (
				SELECT DISTINCT emailAddress FROM users WHERE user_status = 'Active'
			) AND createdTime = (
				SELECT MAX(createdTime) FROM users u2 
				WHERE u2.user_status = 'Inactive' 
				AND SUBSTRING_INDEX(u2.emailAddress, '.del', 1) = SUBSTRING_INDEX(users.emailAddress, '.del', 1)
			))
			ORDER BY user_status DESC, createdTime DESC`;

		return new Promise((resolve, reject) => {
			pool.query(query, (err, result) => {
				if (err) reject(err);
				resolve(result);
			})
		})
	} catch (err) {
		throw 'error while querying user: ' + err;
	}
}

const getUserByEmail = (emailAddress) => {
	try {
		const query = `SELECT * FROM users WHERE (users.emailAddress = ?)`;
		return new Promise((resolve, reject) => {
			pool.query(query, [emailAddress],
				(err, result) => {
				if (err) reject(err);
					resolve(result);
				}
			);
		})
	} catch (err) {
		throw 'getUserByEmail error: ' + err;
	}
};

const getUserInfoByID = async (userID) => {
	try {
		const query = `SELECT firstName, lastName, emailAddress, phone, createdTime, streetNo, streetName, suburb, postcode, user_status FROM users WHERE users.userID = ?`;
		return new Promise((resolve, reject) => {
			pool.query(query, [userID],
				(err, result) => {
					if (err) reject(err);
					resolve(result[0]);
				}
			);
		})
	} catch (err) {
		throw 'getUserInfoByID error: ' + err;
	}
}

const getUserByID = async (userID) => {
	try {
		const query = `SELECT * FROM users WHERE users.userID = ?`;
		return new Promise((resolve, reject) => {
			pool.query(query, [userID],
				(err, result) => {
					if (err) reject(err);
					resolve(result[0]);
				}
			);
		})
	} catch (err) {
		throw 'getUserByID error: ' + err;
	}
}

const updateUser = async (userID, firstName, lastName, emailAddress, phoneNumber, user_status) => {
	try {
		const query = `UPDATE users SET firstName = ?, lastName = ?, emailAddress = ?, phone = ?, user_status = ? WHERE userID = ?`;
		return new Promise((resolve, reject) => {
			pool.query(query, [firstName, lastName, emailAddress, phoneNumber, user_status, userID],
				(err, result) => {
					if (err) reject(err);
					resolve(result);
				}
			);
		})
	} catch (err) {
		throw 'updateUser error: ' + err;
	}
}

const updateUserAsUser = async (userID, firstName, lastName, emailAddress, phoneNumber, streetNo, streetName, suburb, postcode) => {
	try {
		const query = `UPDATE users SET firstName = ?, lastName = ?, emailAddress = ?, phone = ?, streetNo = ?, streetName = ?, suburb = ?, postcode = ? WHERE userID = ?`;
		return new Promise((resolve, reject) => {
			pool.query(query, [firstName, lastName, emailAddress, phoneNumber, streetNo, streetName, suburb, postcode, userID],
				(err, result) => {
					if (err) reject(err);
					resolve(result);
				}
			);
		})
	} catch (err) {
		throw 'updateUserAsUser error: ' + err;
	}
}

const updateUserPassword = async(userID, passwordHash) => {
	try {
		const query = `UPDATE users SET passwordHash = ? WHERE userID = ?`;
		return new Promise((resolve, reject) => {
			pool.query(query, [passwordHash, userID],
				(err, result) => {
					if (err) reject(err);
					resolve(result);
				}
			);
		})
	} catch (err) {
		throw 'updateUserPassword error: ' + err;
	}
}

const disableUserByUserID = async (userID) => {
	try {
		// First get the current email to modify it
		const getUserQuery = `SELECT emailAddress FROM users WHERE userID = ?`;
		const userResult = await new Promise((resolve, reject) => {
			pool.query(getUserQuery, [userID], (err, result) => {
				if (err) reject(err);
				resolve(result);
			});
		});

		if (userResult.length === 0) {
			throw 'User not found';
		}

		const originalEmail = userResult[0].emailAddress;
		const timestamp = Date.now().toString().slice(-6); // Use only last 6 digits
		const modifiedEmail = `${originalEmail}.del${timestamp}`;

		// Update user status and modify email to free it up
		const query = `UPDATE users SET user_status = ?, emailAddress = ? WHERE userID = ?`;
		return new Promise((resolve, reject) => {
			pool.query(query, ["Inactive", modifiedEmail, userID],
				(err, result) => {
					if (err) reject(err);
					resolve(result);
				}
			);
		})
	} catch (err) {
		throw 'error while deleting users: ' + err;
	}
}

module.exports = { getAllUsers, createUser, getUserByEmail, getUserByID, getUserInfoByID, updateUser, updateUserAsUser, updateUserPassword, disableUserByUserID };