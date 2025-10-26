const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const verifyToken = require('../middleware/authentication.js');
const { sendComparisonConfirmationEmail } = require('../service/email-service.js');

// Submit new vehicle comparison request
router.post('/submit-comparison', verifyToken, async (req, res) => {
    try {
        // Use req.pool from middleware
        const pool = req.pool;

        const {
            primaryVehicleID,
            secondaryVehicleID,
            tertiaryVehicleID,
            requestType,
            comparisonCriteria,
            budget,
            preferredFeatures,
            customerNotes
        } = req.body;

        const comparisonRequestID = uuidv4();
        const userID = req.user.userID;

        const insertQuery = `
            INSERT INTO vehicle_comparison 
            (requestID, userID, primaryVehicleID, secondaryVehicleID, tertiaryVehicleID, 
             requestType, budget, customerNotes, submittedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        pool.query(insertQuery, [
            comparisonRequestID,
            userID,
            primaryVehicleID,
            secondaryVehicleID || null,
            tertiaryVehicleID || null,
            requestType || 'Vehicle Comparison',
            budget,
            customerNotes
        ], (err, result) => {
            if (err) {
                console.error('Database error in submit-comparison:', err);
                return res.status(500).json({ error: 'Failed to submit comparison request' });
            }
            
            // Send confirmation email after successful submission
            (async () => {
                try {
                    console.log('🚗 Vehicle comparison request created successfully, sending confirmation email...');
                    
                    // Get user information
                    const userQuery = 'SELECT firstName, lastName, emailAddress, phone FROM users WHERE userID = ?';
                    const userResult = await new Promise((resolve, reject) => {
                        pool.query(userQuery, [userID], (err, result) => {
                            if (err) reject(err);
                            else resolve(result);
                        });
                    });
                    
                    // Get vehicle information for all selected vehicles
                    const vehicleIds = [primaryVehicleID, secondaryVehicleID, tertiaryVehicleID].filter(id => id);
                    const vehicleQuery = `
                        SELECT v.vehicleID, v.modelName, v.price, v.bodyType, v.colour, v.description, m.makeName 
                        FROM vehicles v 
                        LEFT JOIN makes m ON v.makeID = m.makeID 
                        WHERE v.vehicleID IN (${vehicleIds.map(() => '?').join(',')})
                    `;
                    
                    const vehicleResult = await new Promise((resolve, reject) => {
                        pool.query(vehicleQuery, vehicleIds, (err, result) => {
                            if (err) reject(err);
                            else resolve(result);
                        });
                    });
                    
                    if (userResult && userResult.length > 0) {
                        const user = userResult[0];
                        
                        // Prepare customer data for email
                        const customerData = {
                            firstName: user.firstName || '',
                            lastName: user.lastName || '',
                            email: user.emailAddress || '',
                            phone: user.phone || '',
                            message: customerNotes || ''
                        };
                        
                        // Prepare vehicle data for email
                        const vehicleData = vehicleResult.map(vehicle => ({
                            makeName: vehicle.makeName || '',
                            modelName: vehicle.modelName || '',
                            year: 'N/A', // Year not available in database
                            price: vehicle.price || '',
                            bodyType: vehicle.bodyType || '',
                            colour: vehicle.colour || '',
                            description: vehicle.description || ''
                        }));
                        
                        console.log('📧 Sending vehicle comparison confirmation email to:', customerData.email);
                        const emailResult = await sendComparisonConfirmationEmail(customerData, vehicleData);
                        
                        if (emailResult.success) {
                            console.log('✅ Vehicle comparison confirmation email sent successfully!');
                        } else {
                            console.warn('⚠️ Failed to send vehicle comparison confirmation email:', emailResult.error);
                        }
                    } else {
                        console.warn('⚠️ Could not retrieve user data for email confirmation');
                    }
                } catch (emailError) {
                    console.error('❌ Error sending vehicle comparison confirmation email:', emailError);
                    // Don't fail the request if email fails
                }
            })();
            
            res.status(201).json({
                success: true,
                message: 'Vehicle comparison request submitted successfully',
                requestID: comparisonRequestID
            });
        });

    } catch (error) {
        console.error('Error in submit-comparison:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all vehicle comparison requests for admin dashboard
router.get('/admin-comparisons', async (req, res) => {
    try {
        // Use req.pool from middleware
        const pool = req.pool;

        const comparisonQuery = `
            SELECT 
                vcr.requestID,
                vcr.userID,
                vcr.primaryVehicleID,
                vcr.secondaryVehicleID,
                vcr.tertiaryVehicleID,
                vcr.dealerID,
                vcr.requestType,
                vcr.status,
                vcr.budget,
                vcr.customerNotes,
                vcr.adminNotes,
                vcr.submittedAt,
                vcr.updatedAt,
                vcr.completedAt
            FROM vehicle_comparison vcr
            ORDER BY vcr.submittedAt DESC
        `;

        pool.query(comparisonQuery, async (err, requests) => {
            if (err) {
                console.error('Database error in admin-comparisons:', err);
                return res.status(500).json({ error: 'Failed to fetch comparison requests' });
            }

            // Enhance each request with customer and vehicle info
            const enhancedRequests = await Promise.all(
                requests.map(async (request) => {
                    let customerName = 'N/A', customerEmail = 'N/A', customerPhone = 'N/A';
                    let vehicleInfo = 'N/A', primaryVehicle = 'N/A', secondaryVehicle = 'N/A';
                    let dealerName = 'N/A';

                    // Get customer info
                    if (request.userID) {
                        try {
                            const userResult = await new Promise((resolve, reject) => {
                                pool.query(
                                    'SELECT firstName, lastName, emailAddress, phone FROM users WHERE userID = ?',
                                    [request.userID],
                                    (err, result) => {
                                        if (err) reject(err);
                                        else resolve(result);
                                    }
                                );
                            });

                            if (userResult && userResult.length > 0) {
                                const user = userResult[0];
                                customerName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A';
                                customerEmail = user.emailAddress || 'N/A';
                                customerPhone = user.phone || 'N/A';
                            }
                        } catch (error) {
                            console.error('Error fetching user info:', error);
                        }
                    }

                    // Get primary vehicle info
                    if (request.primaryVehicleID) {
                        try {
                            const vehicleResult = await new Promise((resolve, reject) => {
                                pool.query(
                                    `SELECT v.modelName, v.price, v.colour, ma.makeName 
                                     FROM vehicles v 
                                     LEFT JOIN makes ma ON v.makeID = ma.makeID 
                                     WHERE v.vehicleID = ?`,
                                    [request.primaryVehicleID],
                                    (err, result) => {
                                        if (err) reject(err);
                                        else resolve(result);
                                    }
                                );
                            });

                            if (vehicleResult && vehicleResult.length > 0) {
                                const vehicle = vehicleResult[0];
                                primaryVehicle = `${vehicle.makeName || 'Unknown'} ${vehicle.modelName || 'Unknown'}`;
                                vehicleInfo = primaryVehicle;
                            }
                        } catch (error) {
                            console.error('Error fetching primary vehicle info:', error);
                        }
                    }

                    // Get secondary vehicle info if exists
                    if (request.secondaryVehicleID) {
                        try {
                            const vehicleResult = await new Promise((resolve, reject) => {
                                pool.query(
                                    `SELECT v.modelName, ma.makeName 
                                     FROM vehicles v 
                                     LEFT JOIN makes ma ON v.makeID = ma.makeID 
                                     WHERE v.vehicleID = ?`,
                                    [request.secondaryVehicleID],
                                    (err, result) => {
                                        if (err) reject(err);
                                        else resolve(result);
                                    }
                                );
                            });

                            if (vehicleResult && vehicleResult.length > 0) {
                                const vehicle = vehicleResult[0];
                                secondaryVehicle = `${vehicle.makeName || 'Unknown'} ${vehicle.modelName || 'Unknown'}`;
                                vehicleInfo = `${primaryVehicle} vs ${secondaryVehicle}`;
                            }
                        } catch (error) {
                            console.error('Error fetching secondary vehicle info:', error);
                        }
                    }

                    // Get dealer info
                    if (request.dealerID) {
                        try {
                            const dealerResult = await new Promise((resolve, reject) => {
                                pool.query(
                                    'SELECT dealerName FROM dealers WHERE dealerID = ?',
                                    [request.dealerID],
                                    (err, result) => {
                                        if (err) reject(err);
                                        else resolve(result);
                                    }
                                );
                            });

                            if (dealerResult && dealerResult.length > 0) {
                                dealerName = dealerResult[0].dealerName;
                            }
                        } catch (error) {
                            console.error('Error fetching dealer info:', error);
                        }
                    }

                    return {
                        id: request.requestID,
                        name: customerName,
                        email: customerEmail,
                        phone: customerPhone,
                        vehicle: vehicleInfo,
                        primaryVehicle: primaryVehicle,
                        secondaryVehicle: secondaryVehicle,
                        requestType: request.requestType,
                        status: request.status,
                        requestDate: request.submittedAt ? new Date(request.submittedAt).toLocaleDateString() : 'N/A',
                        requestTime: request.submittedAt ? new Date(request.submittedAt).toLocaleTimeString() : 'N/A',
                        created_at: request.submittedAt,
                        dealerName: dealerName,
                        dealerID: request.dealerID,
                        budget: request.budget,
                        customerNotes: request.customerNotes,
                        adminNotes: request.adminNotes
                    };
                })
            );

            res.json({
                success: true,
                requests: enhancedRequests
            });
        });

    } catch (error) {
        console.error('Error in admin-comparisons:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin: Assign dealer to comparison request
router.put('/admin/assign-dealer', async (req, res) => {
    try {
        // Use req.pool from middleware
        const pool = req.pool;

        const { requestID, dealerID } = req.body;

        const updateQuery = `
            UPDATE vehicle_comparison 
            SET dealerID = ?, status = 'In Progress', updatedAt = NOW() 
            WHERE requestID = ?
        `;

        pool.query(updateQuery, [dealerID, requestID], (err, result) => {
            if (err) {
                console.error('Database error in assign-dealer:', err);
                return res.status(500).json({ error: 'Failed to assign dealer' });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Comparison request not found' });
            }

            res.json({
                success: true,
                message: 'Dealer assigned successfully'
            });
        });

    } catch (error) {
        console.error('Error in assign-dealer:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin: Mark comparison request as completed
router.put('/admin/mark-completed', async (req, res) => {
    try {
        // Use req.pool from middleware
        const pool = req.pool;

        const { requestID, adminNotes } = req.body;

        const updateQuery = `
            UPDATE vehicle_comparison 
            SET status = 'Completed', adminNotes = ?, completedAt = NOW(), updatedAt = NOW() 
            WHERE requestID = ?
        `;

        pool.query(updateQuery, [adminNotes || null, requestID], (err, result) => {
            if (err) {
                console.error('Database error in mark-completed:', err);
                return res.status(500).json({ error: 'Failed to mark request as completed' });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Comparison request not found' });
            }

            res.json({
                success: true,
                message: 'Request marked as completed'
            });
        });

    } catch (error) {
        console.error('Error in mark-completed:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin: Cancel comparison request
router.put('/admin/cancel-request', async (req, res) => {
    try {
        // Use req.pool from middleware
        const pool = req.pool;

        const { requestID, adminNotes } = req.body;

        const updateQuery = `
            UPDATE vehicle_comparison 
            SET status = 'Cancelled', adminNotes = ?, updatedAt = NOW() 
            WHERE requestID = ?
        `;

        pool.query(updateQuery, [adminNotes || null, requestID], (err, result) => {
            if (err) {
                console.error('Database error in cancel-request:', err);
                return res.status(500).json({ error: 'Failed to cancel request' });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Comparison request not found' });
            }

            res.json({
                success: true,
                message: 'Request cancelled successfully'
            });
        });

    } catch (error) {
        console.error('Error in cancel-request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;