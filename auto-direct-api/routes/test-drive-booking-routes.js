// '/booking-test-drives' api route
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const verifyToken = require('../middleware/authentication.js');
const authorizeUser = require('../middleware/authorization.js');
const { createTestDrive, getTestDrivesByUser, getTestDrivesByUserDealer, updateDealerTestDrive, updateUserTestDrive, updateTestDriveStatus } = require('../service/test-drive-booking-services.js')
const { getUserRolesByID } = require('../service/role-services.js');
// Get all test drive bookings for admin dashboard
router.get('/admin-requests', async (req, res) => {
	try {
		const { getSupabase } = require('../service/db-singleton.js');
		const supabase = getSupabase();
		if (!supabase) {
			return res.status(500).json({ error: 'Database not available' });
		}
		
		// First get all test drive bookings
		const { data: bookings, error: bookingsError } = await supabase
			.from('test_drive_bookings')
			.select('bookingID, userID, vehicleID, dealerID, time, status, customerNotes')
			.order('time', { ascending: false });
		
		if (bookingsError) {
			console.error('Database error in admin-requests:', bookingsError);
			return res.status(500).json({ error: 'Failed to fetch test drive bookings' });
		}
		
		// Enhance each booking with customer and vehicle info
		const enhancedBookings = await Promise.all(
			(bookings || []).map(async (booking) => {
				let customerName = 'N/A', customerEmail = 'N/A', customerPhone = 'N/A';
				let vehicleInfo = 'N/A', price = null;
				
				// Get customer info
				if (booking.userID) {
					try {
						const { data: userResult } = await supabase
							.from('users')
							.select('firstName, lastName, emailAddress, phone')
							.eq('userID', booking.userID)
							.single();
							
							if (userResult && userResult.length > 0) {
								const user = userResult[0];
								customerName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A';
								customerEmail = user.emailAddress || 'N/A';
								customerPhone = user.phone || 'N/A';
							}
						} catch (userErr) {
							console.warn('Error fetching user info:', userErr);
						}
					}
					
					// Get vehicle info
					if (booking.vehicleID) {
						try {
							const vehicleResult = await new Promise((resolve, reject) => {
								pool.query(
									'SELECT v.modelName, v.bodyType, v.colour, v.price, m.makeName FROM vehicles v LEFT JOIN makes m ON v.makeID = m.makeID WHERE v.vehicleID = ?',
									[booking.vehicleID],
									(err, result) => {
										if (err) reject(err);
										else resolve(result);
									}
								);
							});
							
							if (vehicleResult && vehicleResult.length > 0) {
								const vehicle = vehicleResult[0];
								const make = vehicle.makeName || '';
								const model = vehicle.modelName || '';
								const bodyType = vehicle.bodyType || '';
								vehicleInfo = `${make} ${model} ${bodyType}`.trim() || 'N/A';
								price = vehicle.price;
							}
						} catch (vehicleErr) {
							console.warn('Error fetching vehicle info:', vehicleErr);
						}
					}
					
					return {
						...booking,
						customerName,
						customerEmail,
						customerPhone,
						vehicleInfo,
						price
					};
				})
			);
			
			res.status(200).json({ result: enhancedBookings });
		});
	} catch (err) {
		console.error('Server error in admin-requests:', err);
		res.status(500).json({ error: 'Server error' });
	}
});

// ADMIN ENDPOINTS - Simple endpoints without complex authorization
// Admin update booking status
router.put('/admin/update-status', async (req, res) => {
	try {
		const { bookingID, status } = req.body;
		
		if (!bookingID || !status) {
			return res.status(400).json({ error: 'Missing bookingID or status' });
		}

		// Use req.pool from middleware
		const pool = req.pool;
		
		const query = `UPDATE test_drive_bookings SET status = ? WHERE bookingID = ?`;
		
		pool.query(query, [status, bookingID], (err, result) => {
			if (err) {
				console.error('Error updating booking status:', err);
				return res.status(500).json({ error: 'Failed to update booking status' });
			}
			
			if (result.affectedRows === 0) {
				return res.status(404).json({ error: 'Booking not found' });
			}
			
			res.status(200).json({ message: 'Booking status updated successfully', result });
		});
	} catch (err) {
		console.error('Admin update status error:', err);
		res.status(500).json({ error: 'Server error: ' + err });
	}
});

// Admin assign dealer
router.put('/admin/assign-dealer', async (req, res) => {
	try {
		const { bookingID, dealerID } = req.body;
		
		if (!bookingID || !dealerID) {
			return res.status(400).json({ error: 'Missing bookingID or dealerID' });
		}

		// Use req.pool from middleware
		const pool = req.pool;
		
		const query = `UPDATE test_drive_bookings SET dealerID = ? WHERE bookingID = ?`;
		
		pool.query(query, [dealerID, bookingID], (err, result) => {
			if (err) {
				console.error('Error assigning dealer:', err);
				return res.status(500).json({ error: 'Failed to assign dealer' });
			}
			
			if (result.affectedRows === 0) {
				return res.status(404).json({ error: 'Booking not found' });
			}
			
			res.status(200).json({ message: 'Dealer assigned successfully', result });
		});
	} catch (err) {
		console.error('Admin assign dealer error:', err);
		res.status(500).json({ error: 'Server error: ' + err });
	}
});

router.post('/test-drive', [ verifyToken, authorizeUser ], async (req, res) => {
	try {
		const testDriveNewID = uuidv4();
		const { userID, vehicleID, status, notes, preferredDate, preferredTime, dealerID, time } = req.body.testDrive;

		console.log('📋 Test drive request data:', req.body.testDrive);

		const result = await createTestDrive(testDriveNewID, userID, vehicleID, status, notes);

		// Send email confirmation if test drive was created successfully
		try {
			console.log('🚗 Test drive booking created successfully, sending confirmation email...');
			
			// Get user details
			const mysql = require('mysql2');
			const { connectionConfig } = require('../config/connectionsConfig.js');
			const pool = mysql.createPool(connectionConfig);
			
			// Get user information
			const userQuery = 'SELECT firstName, lastName, emailAddress, phone FROM users WHERE userID = ?';
			const userResult = await new Promise((resolve, reject) => {
				pool.query(userQuery, [userID], (err, result) => {
					if (err) reject(err);
					else resolve(result);
				});
			});
			
			// Get vehicle information
			const vehicleQuery = `
				SELECT v.modelName, v.price, v.bodyType, v.colour, v.description, m.makeName 
				FROM vehicles v 
				LEFT JOIN makes m ON v.makeID = m.makeID 
				WHERE v.vehicleID = ?
			`;
			const vehicleResult = await new Promise((resolve, reject) => {
				pool.query(vehicleQuery, [vehicleID], (err, result) => {
					if (err) reject(err);
					else resolve(result);
				});
			});
			
			if (userResult && userResult.length > 0 && vehicleResult && vehicleResult.length > 0) {
				const user = userResult[0];
				const vehicle = vehicleResult[0];
				
				// Parse additional data from notes field
				// Notes format: "slot | suburb | name | email | phone | date"
				let parsedNotes = {
					slot: 'To be confirmed',
					suburb: '',
					customerName: '',
					customerEmail: '',
					customerPhone: '',
					requestedDate: 'To be confirmed'
				};
				
				if (notes && typeof notes === 'string') {
					const noteParts = notes.split('|').map(part => part.trim());
					if (noteParts.length >= 6) {
						parsedNotes = {
							slot: noteParts[0] || 'To be confirmed',
							suburb: noteParts[1] || '',
							customerName: noteParts[2] || '',
							customerEmail: noteParts[3] || '',
							customerPhone: noteParts[4] || '',
							requestedDate: noteParts[5] || 'To be confirmed'
						};
					}
				}
				
				// Prepare customer data for email - use form data if available, otherwise fall back to user account data
				const customerData = {
					firstName: parsedNotes.customerName.split(' ')[0] || user.firstName || '',
					lastName: parsedNotes.customerName.split(' ').slice(1).join(' ') || user.lastName || '',
					email: parsedNotes.customerEmail || user.emailAddress || '',
					phone: parsedNotes.customerPhone || user.phone || '',
					preferredDate: parsedNotes.requestedDate || 'To be confirmed',
					preferredTime: parsedNotes.slot || 'To be confirmed',
					suburb: parsedNotes.suburb || '',
					notes: notes || ''
				};
				
				// Prepare vehicle data for email
				const vehicleData = {
					makeName: vehicle.makeName || '',
					modelName: vehicle.modelName || '',
					year: 'N/A', // Year not available in database
					price: vehicle.price || '',
					bodyType: vehicle.bodyType || '',
					colour: vehicle.colour || '',
					description: vehicle.description || ''
				};
				
				console.log('📧 Sending test drive confirmation email to:', customerData.email);
				const emailResult = await sendTestDriveConfirmationEmail(customerData, vehicleData);
				
				if (emailResult.success) {
					console.log('✅ Test drive confirmation email sent successfully!');
				} else {
					console.warn('⚠️ Failed to send test drive confirmation email:', emailResult.error);
				}
			} else {
				console.warn('⚠️ Could not retrieve user or vehicle data for email confirmation');
			}
		} catch (emailError) {
			console.error('❌ Error sending test drive confirmation email:', emailError);
			// Don't fail the request if email fails
		}

		res.status(200).json({result: result});
	} catch (err) {
		res.status(500).json({error: 'new test drive error: ' + err})
	}
});

router.get('/user-test-drive', [ verifyToken, authorizeUser ], async (req, res) => {
	try {
		const result = await getTestDrivesByUser(req.userID);

		res.status(200).json({result: result});
	} catch (err) {
		res.status(500).json({error: 'get users test drives error: ' + err})
	}
});

router.get('/dealer-test-drive', [ verifyToken, authorizeUser ], async (req, res) => {
	try {
		let userRoles = getUserRolesByID(req.userID);
		userRoles.filter((userRole) => { userRole.DealerID});
		if(userRoles.length == 0) throw 'User is not an Dealer';
		// let result = [];
		// userRoles.forEach(async (dealerRole) => {
		// 	let dealerTestDrives = await getTestDrivesByDealer(dealerRole.dealerID);
		// 	result.concat(dealerTestDrives);
		// });

		let result = await getTestDrivesByUserDealer(userID);

		res.status(200).json({result: result});
	} catch (err) {
		res.status(500).json({error: 'get dealer test drives error: ' + err})
	}
});

router.put('/user-test-drive', [ verifyToken, authorizeUser ], async (req, res) => {
	try {
		const { bookingID, dealerID, time, customerNotes } = req.body;
		const result = await updateUserTestDrive(bookingID, dealerID, time, customerNotes);

		res.status(200).json({result: result});
	} catch (err) {
		res.status(500).json({error: 'get dealer test drives error: ' + err})
	}
});

router.put('/test-drive-status', async (req, res) => {
	try {
		const { bookingID, status } = req.body;
		if (!bookingID || !status) {
			return res.status(400).json({ error: 'BookingID and status are required' });
		}

		const mysql = require('mysql2');
		const { connectionConfig } = require('../config/connectionsConfig.js');
		const pool = mysql.createPool(connectionConfig);

		const query = `UPDATE test_drive_bookings SET status = ? WHERE bookingID = ?`;
		
		pool.query(query, [status, bookingID], (err, result) => {
			if (err) {
				console.error('Database error updating status:', err);
				return res.status(500).json({ error: 'Failed to update test drive status' });
			}
			
			if (result.affectedRows === 0) {
				return res.status(404).json({ error: 'Test drive booking not found' });
			}
			
			res.status(200).json({ 
				message: 'Test drive status updated successfully',
				bookingID: bookingID,
				newStatus: status
			});
		});
	} catch (err) {
		console.error('Server error updating status:', err);
		res.status(500).json({ error: 'Server error: ' + err });
	}
});

// New endpoint for assigning dealer
router.put('/assign-dealer', async (req, res) => {
	try {
		const { bookingID, dealerID } = req.body;
		if (!bookingID || !dealerID) {
			return res.status(400).json({ error: 'BookingID and dealerID are required' });
		}

		const mysql = require('mysql2');
		const { connectionConfig } = require('../config/connectionsConfig.js');
		const pool = mysql.createPool(connectionConfig);

		const query = `UPDATE test_drive_bookings SET dealerID = ? WHERE bookingID = ?`;
		
		pool.query(query, [dealerID, bookingID], (err, result) => {
			if (err) {
				console.error('Database error assigning dealer:', err);
				return res.status(500).json({ error: 'Failed to assign dealer' });
			}
			
			if (result.affectedRows === 0) {
				return res.status(404).json({ error: 'Test drive booking not found' });
			}
			
			res.status(200).json({ 
				message: 'Dealer assigned successfully',
				bookingID: bookingID,
				dealerID: dealerID
			});
		});
	} catch (err) {
		console.error('Server error assigning dealer:', err);
		res.status(500).json({ error: 'Server error: ' + err });
	}
});

module.exports = router;