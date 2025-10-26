const express = require('express');
const router = express.Router();

// Use req.pool from middleware instead of creating a local pool
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const emailConfig = require('../email-config');

const verifyToken = require('../middleware/authentication');
const authorizeUser = require('../middleware/authorization');
const { createUserRole, getAllUserRoles, getRoles, getUserRolesByID, deleteUserRoleByUserIDAndLabel, getRoleIDByLabel } = require('../service/role-services.js');
const { getAllUsers, updateUser, disableUserByUserID, createUser, getUserByEmail } = require('../service/user-services.js');

// -------- Manage Vehicles --------

// Email configuration
const transporter = nodemailer.createTransport(emailConfig);

// Function to send invitation email
const sendInvitationEmail = async (email, invitationUrl, roles, expiresAt) => {
  const mailOptions = {
    from: emailConfig.auth.user,
    to: email,
    subject: 'Invitation to Join Autos Direct',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1f2937; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Autos Direct</h1>
        </div>
        
        <div style="padding: 30px 20px; background-color: #f9fafb;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">You're Invited!</h2>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            You have been invited to join Autos Direct as a <strong>${roles.join(', ')}</strong>.
          </p>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1f2937;">
            <p style="margin: 0; color: #374151;">
              <strong>Email:</strong> ${email}<br>
              <strong>Roles:</strong> ${roles.join(', ')}<br>
              <strong>Expires:</strong> ${new Date(expiresAt).toLocaleString()}
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationUrl}" 
               style="background-color: #1f2937; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Complete Registration
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
            This invitation link will expire on ${new Date(expiresAt).toLocaleString()}. 
            If you have any questions, please contact your administrator.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            This is an automated message from Autos Direct. Please do not reply to this email.
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

/*
* Retrieve all Employees Function
* This function returns all Employees of Auto's Direct. It will primarily be used
* for Advice Request Assignment.
*/
router.get('/advice-requests/employees', (req, res) => {
    const allEmployeesQuery = `SELECT u.userID, u.firstName, u.lastName
    FROM users AS u
    JOIN user_roles AS ur ON u.userID = ur.userID
    WHERE ur.roleID = 'f717e308-64de-4a7a-a050-892221e982bf'`;

    pool.query(allEmployeesQuery, (err, result) => {
        if (err) {
            console.error('Error retrieving employees:', err);
            return res.status(500).send('Server unable to retrieve employees');
        }
        console.log("Query result:", result);
        res.status(200).json(result);
    })
});

/*
* View All  Unassigned Advice Requests Function
*
*/

router.get('/advice-requests/unassigned', (req, res) => {
    const searchQuery = req.query.search || '';
    const queryParams = [];
    let conditions = [];

    let unassignedRequestsQuery = `SELECT ar.requestID, ar.requesterID, ar.employeeID, ar.vehicleID,
            ar.status, ar.description, ar.submittedAt, u.firstName, u.lastName, u.emailAddress, u.phone, v.modelName, m.makeName
        FROM advice_requests AS ar
        JOIN users AS u ON ar.requesterID = u.userID
        JOIN vehicles AS v ON ar.vehicleID = v.vehicleID
        JOIN makes AS m ON v.makeID = m.makeID`;

    conditions.push(`ar.employeeID IS NULL`);
    conditions.push(`ar.status ='Pending'`);

    // Handle the search entry

    if (searchQuery) {
        conditions.push(`u.emailAddress LIKE ?`);
        queryParams.push(`%${searchQuery}%`);
    }

    if (conditions.length > 0) {
        unassignedRequestsQuery += ` WHERE ` + conditions.join(' AND ');
    }

    unassignedRequestsQuery += ';'; // Janky but need to do this in case we've got the extra details

    pool.query(unassignedRequestsQuery, queryParams, (err, result) => {
        if (err) {
            console.error('Error retrieving unassigned advice requests: ', err);
            return res.status(500).send('Server unable to retrieve unassigned advice requests');
        }
        console.log("Query result (unassigned):", result);
        res.json(result);
    });
});

/*
 * View All In Progress Requests Function
 * This function returns all of the advice requests that have been submitted by
 * customers.
*/

router.get('/advice-requests/in-progress', (req, res) => {
    const searchQuery = req.query.search || '';
    const queryParams = [];
    let conditions = [];

    let inProgressRequestsQuery = `SELECT ar.requestID, ar.requesterID, ar.employeeID, ar.vehicleID,
            ar.status, ar.description, ar.submittedAt, u.firstName, u.lastName, u.emailAddress, u.phone, v.modelName, m.makeName
        FROM advice_requests AS ar
        JOIN users AS u ON ar.requesterID = u.userID
        JOIN vehicles AS v ON ar.vehicleID = v.vehicleID
        JOIN makes AS m ON v.makeID = m.makeID`;

    conditions.push(`ar.status ='In Progress'`);

    // Handle the search entry

    if (searchQuery) {
        conditions.push(`u.emailAddress LIKE ?`);
        queryParams.push(`%${searchQuery}%`);
    }

    if (conditions.length > 0) {
        inProgressRequestsQuery += ` WHERE ` + conditions.join(' AND ');
    }
    inProgressRequestsQuery += ';'; // Janky but need to do this in case we've got the extra details

    pool.query(inProgressRequestsQuery, queryParams, (err, result) => {
        if (err) {
            console.error('Error retrieving in-progress advice requests: ', err);
            return res.status(500).send('Server unable to retrieve in-progress advice requests');
        }
        console.log("Query result (in-progress):", result);
        res.json(result);
    });
});

/*
 * View AllCompleted Requests Function
 * This function returns all of the advice requests that have been submitted by
 * customers.
*/

router.get('/advice-requests/completed', (req, res) => {
    const searchQuery = req.query.search || '';
    const queryParams = [];
    let conditions = [];

    let completedRequestsQuery = `SELECT ar.requestID, ar.requesterID, ar.employeeID, ar.vehicleID,
            ar.status, ar.description, ar.submittedAt, u.firstName, u.lastName, u.emailAddress, u.phone, v.modelName, m.makeName
        FROM advice_requests AS ar
        JOIN users AS u ON ar.requesterID = u.userID
        JOIN vehicles AS v ON ar.vehicleID = v.vehicleID
        JOIN makes AS m ON v.makeID = m.makeID`;

    conditions.push(`ar.status ='Completed'`);

    // Handle the search entry

    if (searchQuery) {
        conditions.push(`u.emailAddress LIKE ?`);
        queryParams.push(`%${searchQuery}%`);
    }

    if (conditions.length > 0) {
        completedRequestsQuery += ` WHERE ` + conditions.join(' AND ');
    }
    completedRequestsQuery += ';'; // Janky but need to do this in case we've got the extra details

    pool.query(completedRequestsQuery, queryParams, (err, result) => {
        if (err) {
            console.error('Error retrieving completed advice requests: ', err);
            return res.status(500).send('Server unable to retrieve completed advice requests');
        }
        console.log("Query result (completed):", result);
        res.json(result);
    });
});
	
/*
 * Assign Advice Request Function
 * This function assigns an advice request to an employee
*/
router.post('/advice-requests/assign/', [ verifyToken, authorizeUser ], async (req, res) => {
    const {requestID} = req.body;
    const {employeeID} = req.body;

    const pickUpQuery = `UPDATE advice_requests SET employeeID = ?, status = 
    'In Progress' WHERE requestID = ?`;
    
    pool.query(pickUpQuery, [employeeID, requestID], (err, result) => {
        if (err) {
            console.error('Error picking up advice request: ', err);
            return res.status(500).send('Server unable to allocate advice request');
        }
        console.log("Query result:", result);
        res.status(200).json(result);
    });
});

/*
 * View Advice Request Function
 * This returns details of a singular advice request
*/
router.get('/advice-requests/:id', (req, res) => {
    const {id} = req.params;

    const getRequestQuery = `SELECT * FROM advice_requests WHERE requestID = ?`;

    pool.query(getRequestQuery, [id], (err, result) => {
        if (err) {
            console.error('Error retrieving advice request: ', err);
            return res.status(500).send('Server unable to retrieve advice request');
        }
        console.log("Query result:", result);
        res.status(200).json(result);
    });
});

/*
 * Function for Employees to retrieve their In Progress Requests
 */
router.get('/my-requests/in-progress', (req, res) => {
    const searchQuery = req.query.search || '';
    const employeeID = req.query.userID;
    const queryParams = [];
    let conditions = [];

    let inProgressRequestsQuery = `SELECT ar.requestID, ar.requesterID, ar.employeeID, ar.vehicleID,
                ar.status, ar.description, ar.submittedAt, u.firstName, u.lastName, u.emailAddress, u.phone, v.modelName, m.makeName
            FROM advice_requests AS ar
            JOIN users AS u ON ar.requesterID = u.userID
            JOIN vehicles AS v ON ar.vehicleID = v.vehicleID
            JOIN makes AS m ON v.makeID = m.makeID`;

    conditions.push(`ar.status ='In Progress'`);

    if (employeeID) {
        conditions.push(`ar.employeeID = ?`);
        queryParams.push(employeeID);
    }

    // Handle the searching

    if (searchQuery) {
        conditions.push(`u.emailAddress LIKE ?`);
        queryParams.push(`%${searchQuery}%`);
    }

    if (conditions.length > 0) {
        inProgressRequestsQuery += ` WHERE ` + conditions.join(' AND ');
    }
    inProgressRequestsQuery += ';'; // Janky but need to do this in case we've got the extra details

    pool.query(inProgressRequestsQuery, queryParams, (err, result) => {
        if (err) {
            console.error('Error retrieving in-progress advice requests: ', err);
            return res.status(500).send('Server unable to retrieve in-progress advice requests');
        }
        console.log("Query result (in-progress):", result);
        res.json(result);
    });
});

/*
 * Function for Employee to view all their completed requests
 */
router.get('/my-requests/completed', (req, res) => {
    const searchQuery = req.query.search || '';
    const employeeID = req.query.userID;
    const queryParams = [];
    let conditions = [];

    let completedRequestsQuery = `SELECT ar.requestID, ar.requesterID, ar.employeeID, ar.vehicleID,
                ar.status, ar.description, ar.submittedAt, u.firstName, u.lastName, u.emailAddress, u.phone, v.modelName, m.makeName
            FROM advice_requests AS ar
            JOIN users AS u ON ar.requesterID = u.userID
            JOIN vehicles AS v ON ar.vehicleID = v.vehicleID
            JOIN makes AS m ON v.makeID = m.makeID`;

    conditions.push(`ar.status ='Completed'`);

    if (employeeID) {
        conditions.push(`ar.employeeID = ?`);
        queryParams.push(employeeID);
    }

    // Handle the searching

    if (searchQuery) {
        conditions.push(`u.emailAddress LIKE ?`);
        queryParams.push(`%${searchQuery}%`);
    }

    if (conditions.length > 0) {
        completedRequestsQuery += ` WHERE ` + conditions.join(' AND ');
    }
    completedRequestsQuery += ';'; // Janky but need to do this in case we've got the extra details

    pool.query(completedRequestsQuery, queryParams, (err, result) => {
        if (err) {
            console.error('Error retrieving completed advice requests: ', err);
            return res.status(500).send('Server unable to retrieve completed advice requests');
        }
        console.log("Query result (completed):", result);
        res.json(result);
    });
});

/*
 * Close Advice Request Function
 * This function closes an advice request
*/
router.post('/my-requests/close/', async (req, res) => {
    const { requestID, closeNotes } = req.body;
    const dateTime = new Date();
    const formattedDateTime = dateTime.toISOString().slice(0, 19).replace('T', ' ');

    const closeQuery = `UPDATE advice_requests SET status = 'Completed', closureNotes = ?, closedAt = ? WHERE requestID = ?`;

    pool.query(closeQuery, [closeNotes, formattedDateTime, requestID], (err, result) => {
        if (err) {
            console.error('Error closing advice request: ', err);
            return res.status(500).send('Server unable to close advice request');
        }
        console.log("Query result:", result);
        res.status(200).json({ message: "Advice request closed successfully", requestID: requestID });
    });
});

/*
* Manage Vehicles - Return all vehicles function
*

router.get('/manage-vehicles', (req, res) => {

    const allVehiclesQuery = `SELECT v.*, vi.path AS mainImage, m.makeName FROM vehicles v
    LEFT JOIN (SELECT vehicle, path FROM vehicle_images WHERE imageOrder = 1
    ) vi ON v.vehicleID = vi.vehicle
     JOIN Makes m ON v.make = m.makeID`;

    pool.query(allVehiclesQuery, (err, result) => {
        if (err) {
            console.error('Error retrieving vehicles: ', err);
            return res.status(500).send('Server unable to retrieve vehicles');
        }
        console.log("Query result:", result);
        res.status(200).json(result);
    });
});

*/

// -------- Manage Users --------

//get users and roles
router.get("/users", [ verifyToken, authorizeUser ], async (req, res) => {
	try {
		if(!req.roles.includes('Administrator')) throw 'User does not have permission for Admin actions!'
		
		const users = await getAllUsers();
		const usersRoles = await getAllUserRoles();
		resUsers = users.map((user) => {
			let userRoles = usersRoles.filter((role) => role.userID == user.userID)
			user.roles = userRoles.map((roles) => roles.label);

			return user;
		});

		// Add cache-busting headers
		res.set({
			'Cache-Control': 'no-cache, no-store, must-revalidate',
			'Pragma': 'no-cache',
			'Expires': '0'
		});

		res.status(200).json({users: resUsers});
	} catch (err) {
		res.status(500).json({error: 'get users error: ' + err})
	}
});

//update user and roles
router.put("/updateUser", [ verifyToken, authorizeUser ], async (req, res) => {
	try {
		if(!req.roles.includes('Administrator')) throw 'User does not have permission for Admin actions!'

		const { userID, firstName, lastName, emailAddress, phone, roles: changedUserRoles, user_status } = req.body.user;
		const allRoles = await getRoles();

		let currentUserRoles = await getUserRolesByID(userID);
		currentUserRoles = currentUserRoles.map((role) => role.label);
		let deleteRoles = currentUserRoles.filter(x => !changedUserRoles.includes(x));
		let addedRoles = changedUserRoles.filter(x => !currentUserRoles.includes(x));

		if(deleteRoles.length > 0) {
			deleteRoles.forEach( async (roleLabel) => {
				let deleteRole = allRoles.find((role) => role.label == roleLabel)
				await deleteUserRoleByUserIDAndLabel(userID, deleteRole.roleID)
			});
		}

		if(addedRoles.length > 0) {
			addedRoles.forEach( async (roleLabel) => {
				const newUserRoleID = uuidv4();
				const addRole = allRoles.find((role) => role.label == roleLabel)
				await createUserRole( newUserRoleID, userID, addRole.roleID );
			});
		}

		const query = await updateUser(userID, firstName, lastName, emailAddress, phone, user_status);
		res.status(200).json({message: query})
	} catch (err) {
		res.status(500).json({error: 'update user and roles failure: ' + err})
	}
});

//create user
router.post("/createUser", [ verifyToken, authorizeUser ], async (req, res) => {
	try {
		if(!req.roles.includes('Administrator')) throw 'User does not have permission for Admin actions!'

		const { firstName, lastName, emailAddress, phone, password, roles, user_status } = req.body;
		
		// Check if email already exists
		const existingUsers = await getUserByEmail(emailAddress);
		if (existingUsers.length > 0) {
			return res.status(400).json({ error: 'Email address already exists' });
		}

		// Generate user ID and hash password
		const userNewID = uuidv4();
		const passwordHash = bcrypt.hashSync(password, bcrypt.genSaltSync(12));
		
		// Create user data object
		const userData = {
			firstName,
			lastName,
			emailAddress,
			phoneNumber: phone || "00000000",
			passwordHash,
			user_status: user_status || 'Active',
			streetNo: "0",
			streetName: "Default Street", 
			suburb: "Default Suburb",
			postcode: 2000
		};

		// Create the user
		await createUser(userNewID, userData);

		// Add roles
		if (roles && roles.length > 0) {
			for (const roleLabel of roles) {
				const roleID = await getRoleIDByLabel(roleLabel);
				const userRoleID = uuidv4();
				await createUserRole(userRoleID, userNewID, roleID);
			}
		}

		res.status(201).json({ message: 'User created successfully', userID: userNewID });
	} catch (err) {
		console.error('Error creating user:', err);
		res.status(500).json({ error: 'Failed to create user: ' + err.message });
	}
});

//delete user
router.put("/disableUser", [ verifyToken, authorizeUser ], async (req, res) => {
	try {
		if(!req.roles.includes('Administrator')) throw 'User does not have permission for Admin actions!'

		const { userID } = req.body;
		const result = await disableUserByUserID(userID);
		res.status(200).json({message: result});
	} catch (err) {
		res.status(500).json({error: 'disable user roles failure: ' + err})
	}
});

// Reactivate user (change status from Inactive to Active)
router.put("/reactivateUser", [ verifyToken, authorizeUser ], async (req, res) => {
	try {
		if(!req.roles.includes('Administrator')) throw 'User does not have permission for Admin actions!'

		const { userID } = req.body;
		
		// Update user status to Active and restore original email
		const query = `UPDATE users SET user_status = 'Active', emailAddress = SUBSTRING_INDEX(emailAddress, '.del', 1) WHERE userID = ?`;
		
		const [result] = await pool.promise().query(query, [userID]);
		
		if (result.affectedRows === 0) {
			return res.status(404).json({ error: 'User not found' });
		}
		
		res.status(200).json({ message: 'User reactivated successfully' });
	} catch (err) {
		console.error('Error reactivating user:', err);
		res.status(500).json({ error: 'Error reactivating user: ' + err.message });
	}
});

// Generate invitation token for internal registration
router.post("/generateInvitation", [ verifyToken, authorizeUser ], async (req, res) => {
	try {
		if(!req.roles.includes('Administrator')) throw 'User does not have permission for Admin actions!'

		const { email, roles, expiresInHours = 48 } = req.body;
		
		if (!email || !roles || roles.length === 0) {
			return res.status(400).json({ error: 'Email and roles are required' });
		}

		// Check if email already exists (only for active users)
		const existingUsers = await pool.promise().query('SELECT userID FROM users WHERE emailAddress = ? AND user_status = "Active"', [email]);
		if (existingUsers[0].length > 0) {
			return res.status(400).json({ error: 'Email address already exists' });
		}

		// Generate secure token
		const crypto = require('crypto');
		const token = crypto.randomBytes(32).toString('hex');
		const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

		// Store token in database (create table if needed)
		await pool.promise().query(`
			CREATE TABLE IF NOT EXISTS registration_tokens (
				token VARCHAR(64) PRIMARY KEY,
				email VARCHAR(45) NOT NULL,
				roles TEXT NOT NULL,
				expiresAt DATETIME NOT NULL,
				createdBy VARCHAR(36) NOT NULL,
				createdAt DATETIME DEFAULT NOW()
			)
		`);

		await pool.promise().query(
			`INSERT INTO registration_tokens (token, email, roles, expiresAt, createdBy) 
			 VALUES (?, ?, ?, ?, ?)`,
			[token, email, JSON.stringify(roles), expiresAt, req.userID]
		);

		// Return invitation URL
		const invitationUrl = `http://localhost:5173/internal-register?token=${token}`;
		
		// Send invitation email
		const emailResult = await sendInvitationEmail(email, invitationUrl, roles, expiresAt);
		
		if (emailResult.success) {
			res.status(201).json({ 
				message: 'Invitation sent successfully via email',
				invitationUrl,
				expiresAt: expiresAt.toISOString(),
				email: email,
				roles: roles,
				emailSent: true
			});
		} else {
			// Still return success but indicate email failed
			res.status(201).json({ 
				message: 'Invitation generated but email failed to send',
				invitationUrl,
				expiresAt: expiresAt.toISOString(),
				email: email,
				roles: roles,
				emailSent: false,
				emailError: emailResult.error
			});
		}
	} catch (err) {
		console.error('Error generating invitation:', err);
		res.status(500).json({ error: 'Error generating invitation: ' + err.message });
	}
});

// Validate invitation token
router.get("/validateInvitation/:token", async (req, res) => {
	try {
		const { token } = req.params;
		
		const result = await pool.promise().query(
			'SELECT email, roles, expiresAt FROM registration_tokens WHERE token = ? AND expiresAt > NOW()',
			[token]
		);

		if (result[0].length === 0) {
			return res.status(400).json({ error: 'Invalid or expired invitation token' });
		}

		const tokenData = result[0][0];
		res.status(200).json({
			valid: true,
			email: tokenData.email,
			roles: JSON.parse(tokenData.roles),
			expiresAt: tokenData.expiresAt
		});
	} catch (err) {
		console.error('Error validating invitation:', err);
		res.status(500).json({ error: 'Error validating invitation: ' + err.message });
	}
});

// Complete internal registration with invitation token
router.post("/completeInternalRegistration", async (req, res) => {
	try {
		const { token, firstName, lastName, password, phone, companyName, abn, businessAddress, contactDetails } = req.body;
		
		if (!token || !firstName || !lastName || !password) {
			return res.status(400).json({ error: 'All required fields must be provided' });
		}

		// Validate token and get data
		const tokenResult = await pool.promise().query(
			'SELECT email, roles, expiresAt FROM registration_tokens WHERE token = ? AND expiresAt > NOW()',
			[token]
		);

		if (tokenResult[0].length === 0) {
			return res.status(400).json({ error: 'Invalid or expired invitation token' });
		}

		const tokenData = tokenResult[0][0];
		const email = tokenData.email;
		const roles = JSON.parse(tokenData.roles);

		// Check if email already exists (only for active users)
		const existingUsers = await pool.promise().query('SELECT userID FROM users WHERE emailAddress = ? AND user_status = "Active"', [email]);
		if (existingUsers[0].length > 0) {
			return res.status(400).json({ error: 'Email address already exists' });
		}

		const userID = uuidv4();
		const passwordHash = bcrypt.hashSync(password, bcrypt.genSaltSync(12));

		// Set default values for required fields
		const streetNo = "0";
		const streetName = "Default Street";
		const suburb = "Default Suburb";
		const postcode = 2000;

		// Create the user
		await pool.promise().query(
			`INSERT INTO users (userID, firstName, lastName, emailAddress, phone, passwordHash, user_status, createdTime, streetNo, streetName, suburb, postcode) 
			 VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?)`,
			[userID, firstName, lastName, email, phone || "00000000", passwordHash, 'Active', streetNo, streetName, suburb, postcode]
		);

		// If user is a Manufacturer, create manufacturer profile
		if (roles.includes('Manufacturer') && companyName && abn) {
			const manufacturerID = uuidv4();
			await pool.promise().query(
				`INSERT INTO manufacturers (manufacturerID, manufacturerName, ABN, country, manufacturerStatus) 
				 VALUES (?, ?, ?, ?, ?)`,
				[manufacturerID, companyName, abn, businessAddress || 'Australia', 'Active']
			);
		}

		// Assign roles to the user
		for (const roleLabel of roles) {
			const roleID = await getRoleIDByLabel(roleLabel);
			const userRoleID = uuidv4();
			await createUserRole(userRoleID, userID, roleID);
		}

		// Delete the used token
		await pool.promise().query('DELETE FROM registration_tokens WHERE token = ?', [token]);

		res.status(201).json({ message: 'Registration completed successfully' });
	} catch (err) {
		console.error('Error completing registration:', err);
		res.status(500).json({ error: 'Error completing registration: ' + err.message });
	}
});

// Get pending registrations (unused invitation tokens)
router.get("/pendingRegistrations", [verifyToken, authorizeUser], async (req, res) => {
	try {
		if (!req.roles.includes('Administrator')) {
			return res.status(403).json({ error: 'User does not have permission for Admin actions!' });
		}

		const [tokens] = await pool.promise().query(
			`SELECT rt.token, rt.email, rt.roles, rt.createdAt, rt.expiresAt 
			 FROM registration_tokens rt
			 LEFT JOIN users u ON rt.email = u.emailAddress AND u.user_status = 'Active'
			 WHERE rt.expiresAt > NOW() AND u.userID IS NULL
			 ORDER BY rt.createdAt DESC`
		);

		const pendingRegistrations = tokens.map(token => ({
			token: token.token,
			email: token.email,
			roles: JSON.parse(token.roles),
			createdAt: token.createdAt,
			expiresAt: token.expiresAt,
			invitationUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/internal-register?token=${token.token}`
		}));

		res.status(200).json({ pendingRegistrations });
	} catch (err) {
		console.error('Error getting pending registrations:', err);
		res.status(500).json({ error: 'Error getting pending registrations: ' + err.message });
	}
});

// Resend invitation email
router.post("/resendInvitation", [verifyToken, authorizeUser], async (req, res) => {
	try {
		if (!req.roles.includes('Administrator')) {
			return res.status(403).json({ error: 'User does not have permission for Admin actions!' });
		}

		const { token } = req.body;

		// Get token data
		const [tokenResult] = await pool.promise().query(
			'SELECT email, roles, expiresAt FROM registration_tokens WHERE token = ?',
			[token]
		);

		if (tokenResult.length === 0) {
			return res.status(404).json({ error: 'Invitation token not found' });
		}

		const tokenData = tokenResult[0];
		const email = tokenData.email;
		const roles = JSON.parse(tokenData.roles);
		const expiresAt = tokenData.expiresAt;

		// Generate new invitation URL
		const invitationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/internal-register?token=${token}`;

		// Send email
		await sendInvitationEmail(email, invitationUrl, roles, expiresAt);

		res.status(200).json({ 
			message: 'Invitation email sent successfully',
			emailSent: true 
		});
	} catch (err) {
		console.error('Error resending invitation:', err);
		res.status(500).json({ error: 'Error resending invitation: ' + err.message });
	}
});

// Delete pending registration (revoke invitation)
router.delete("/pendingRegistrations/:token", [verifyToken, authorizeUser], async (req, res) => {
	try {
		if (!req.roles.includes('Administrator')) {
			return res.status(403).json({ error: 'User does not have permission for Admin actions!' });
		}

		const { token } = req.params;

		// Delete the token
		const result = await pool.promise().query('DELETE FROM registration_tokens WHERE token = ?', [token]);

		if (result[0].affectedRows === 0) {
			return res.status(404).json({ error: 'Invitation token not found' });
		}

		res.status(200).json({ message: 'Invitation revoked successfully' });
	} catch (err) {
		console.error('Error revoking invitation:', err);
		res.status(500).json({ error: 'Error revoking invitation: ' + err.message });
	}
});

module.exports = router;