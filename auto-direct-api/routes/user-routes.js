// '/user' api route
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const { jwtKey } = require('../config/connectionsConfig.js');
const verifyToken = require('../middleware/authentication');
const authorizeUser = require('../middleware/authorization');
const { getRoleIDByLabel, getUserRolesByID, createUserRole } = require('../service/role-services.js');
const { updateUserAsUser, createUser, getUserByEmail, getUserByID, getUserInfoByID, updateUserPassword } = require('../service/user-services.js');

// reCAPTCHA verification function
const verifyRecaptcha = async (recaptchaToken) => {
	try {
		const response = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
			params: {
				secret: '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe',
				response: recaptchaToken
			}
		});
		return response.data.success;
	} catch (error) {
		console.error('reCAPTCHA verification error:', error);
		return false;
	}
};

/*
 * Initial Register User Function
*/
router.post('/register', async (req, res) => {
	try {
		const { emailAddress, password, recaptchaToken } = req.body;
		
		// Verify reCAPTCHA (temporarily disabled for development)
		// if (!recaptchaToken) {
		// 	return res.status(400).json({error: "reCAPTCHA verification is required"});
		// }
		
		// const isRecaptchaValid = await verifyRecaptcha(recaptchaToken);
		// if (!isRecaptchaValid) {
		// 	return res.status(400).json({error: "reCAPTCHA verification failed"});
		// }
		
		const emailExists = await getUserByEmail(emailAddress, req.pool);
		if (emailExists.length > 0) {
			throw "Your chosen email is already registered";
		}
		req.body.passwordHash = bcrypt.hashSync(password, bcrypt.genSaltSync(12));
		const userNewID = uuidv4();
		const userRolesNewID = uuidv4();
		const customerRoleID = await getRoleIDByLabel('Customer', req.pool);
		
		// Execute the query
		await createUser(userNewID, req.body, req.pool);
		await createUserRole( userRolesNewID, userNewID, customerRoleID, req.pool )
		res.status(201).send('User has been added');
	} catch (err) {
		res.status(400).json({error: "Server error: " + err});
	}
});

// Test password hash
router.post('/test-password', async (req, res) => {
	const { password } = req.body;
	const testHash = '$2b$10$UV9yOc09AnDWSdiu/2vxru8B1Z2t.J3n2fpTdaNPF9gWaeoP3hfdi';
	const match = bcrypt.compareSync(password, testHash);
	console.log('[TEST] Password:', password);
	console.log('[TEST] Match:', match);
	res.json({ match, passwordReceived: password });
});

// User login
router.post('/login', async (req, res) => {
	const { emailAddress, password, recaptchaToken } = req.body;
	
	// Verify reCAPTCHA (temporarily disabled for development)
	// Allow development bypass token
	if (recaptchaToken === "development-bypass") {
		// Skip verification for development
	} else if (!recaptchaToken) {
		return res.status(400).json({message: "reCAPTCHA verification is required"});
	} else {
		const isRecaptchaValid = await verifyRecaptcha(recaptchaToken);
		if (!isRecaptchaValid) {
			return res.status(400).json({message: "reCAPTCHA verification failed"});
		}
	}
	
	try {
		// Trim password to remove any whitespace
		const trimmedPassword = password.trim();
		
		// Pass req.pool to the service function
		const rows = await getUserByEmail(emailAddress, req.pool);
		if (rows.length == 0) {
			return res.status(401).json({ message: 'There is no user by this email.' });
		}

		let user = rows[0];
		console.log('[LOGIN] User found:', user.emailAddress);
		console.log('[LOGIN] Has passwordHash?', !!user.passwordHash);
		console.log('[LOGIN] PasswordHash length:', user.passwordHash?.length);
		console.log('[LOGIN] Full passwordHash:', user.passwordHash);
		console.log('[LOGIN] Password received:', trimmedPassword);
		console.log('[LOGIN] Password length:', trimmedPassword?.length);
		console.log('[LOGIN] Password bytes:', Buffer.from(trimmedPassword).toString('hex'));
		
		if (!user.passwordHash) {
			console.error('[LOGIN] No passwordHash found in user object');
			return res.status(401).json({ message: 'User data incomplete.' });
		}
		
		// Verify password
		console.log('[LOGIN] Attempting password comparison...');
		console.log('[LOGIN] PasswordHash format - starts with $2:', user.passwordHash?.startsWith('$2'));
		console.log('[LOGIN] PasswordHash format - length:', user.passwordHash?.length);
		console.log('[LOGIN] PasswordHash (first 30 chars):', user.passwordHash?.substring(0, 30));
		console.log('[LOGIN] Password being compared:', trimmedPassword);
		
		// Check if passwordHash is actually a bcrypt hash
		if (!user.passwordHash || !user.passwordHash.startsWith('$2')) {
			console.error('[LOGIN] Invalid passwordHash format:', user.passwordHash?.substring(0, 20));
			return res.status(401).json({ message: 'Invalid password format in database.' });
		}
		
		const passwordMatch = bcrypt.compareSync(trimmedPassword, user.passwordHash);
		console.log('[LOGIN] Password match result:', passwordMatch);
		
		if (!passwordMatch) {
			return res.status(401).json({ message: 'Email and password do not match.' });
		}

		const token = jwt.sign({ userId: user.userID }, jwtKey, {	expiresIn: '1d' });
		const rolesData = await getUserRolesByID(user.userID, req.pool);
		console.log('[LOGIN] rolesData:', JSON.stringify(rolesData, null, 2));
		console.log('[LOGIN] rolesData length:', rolesData?.length);
		
		// Try to extract label from the first row to see what keys are available
		if (rolesData && rolesData.length > 0) {
			console.log('[LOGIN] First row keys:', Object.keys(rolesData[0]));
			console.log('[LOGIN] First row:', JSON.stringify(rolesData[0], null, 2));
		}
		
		// Extract label - handle both camelCase and lowercase field names
		const roles = rolesData.map((row) => row.label || row.Label || row.role || row.Role);
		console.log('[LOGIN] roles:', roles);
		console.log('[LOGIN] roles includes Administrator:', roles.includes('Administrator'));

		res.status(200).send({ token: token, userID: user.userID, roles, firstName: user.firstName, });
	} catch (error) {
		res.status(500).json({ error: 'Login failed: ' + error });
	}
});

// returns user profile
router.get('/profile', [ verifyToken, authorizeUser ], async (req, res) => {
	try {
		const user = await getUserInfoByID(req.userID);
		res.status(200).json({ user: user });
	} catch (error) {
		res.status(500).json({ error: 'view profile failed: ' + error });
	}
});

router.put('/roles', [ verifyToken, authorizeUser ], async(req, res) => {
	try {
		const userRoles = getUserRoles(req.userID);
		if(!userRoles.includes('Adminstrator')) throw 'User is not an Administrator';

		const { userID, roles } = req.body;

		roles.forEach(async (role) => {
			const userRolesNewID = uuidv4();
			const customerRoleID = await getRoleIDByLabel(role);

			await createUserRole(userRolesNewID, userID, customerRoleID)
		});

		res.status(200).json({ roles: req.roles });
	} catch (error) {
		res.status(500).json({ error: 'roles update failed: ' + error });
	}
})

router.put('/user', [ verifyToken, authorizeUser ], async(req, res) => {
	try {
		const { firstName, lastName, emailAddress, phoneNumber, streetNo, streetName, suburb, postcode } = req.body;

		const result = await updateUserAsUser(req.userID, firstName, lastName, emailAddress, phoneNumber, streetNo, streetName, suburb, postcode);

		res.status(200).json({ result: result });
	} catch (error) {
		res.status(500).json({ error: 'update user failed: ' + error });
	}
})

router.put('/userPassword', [ verifyToken, authorizeUser ], async(req, res) => {
	try {
		const rows = await getUserByID(req.userID);
		if (rows.length == 0) {
			return res.status(401).json({ message: 'There is no user by this email.' });
		}

		let user = rows[0];
		const passwordMatch = bcrypt.compareSync(password, user.passwordHash);
		if (!passwordMatch) {
			return res.status(401).json({ message: 'Email and password do not match.' });
		}

		const result = await updateUserPassword(req.userID, req.body.newPassword);

		res.status(200).json({ result: result });
	} catch (error) {
		res.status(500).json({ error: 'update password failed: ' + error });
	}
})

/*
 * Remove Role Function
 * This function removes a role from a user
 * Can probably make it dynamic so the function can handle the removal of all
 * role types. (We could maybe implement this for role assignment too)
*/

module.exports = router;