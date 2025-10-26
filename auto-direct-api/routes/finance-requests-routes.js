const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const verifyToken = require('../middleware/authentication.js');

// Submit new finance request
router.post('/submit-request', verifyToken, async (req, res) => {
    try {
        // Use req.pool from middleware
        const pool = req.pool;

        const {
            vehicleID,
            requestType,
            annualIncome,
            employmentStatus,
            loanAmount,
            loanTerm,
            tradeInVehicle,
            tradeInCondition,
            customerNotes
        } = req.body;

        const financeRequestID = uuidv4();
        const userID = req.user.userID;

        const insertQuery = `
            INSERT INTO finance_dashboard 
            (requestID, userID, vehicleID, requestType, annualIncome, employmentStatus, 
             loanAmount, loanTerm, tradeInVehicle, tradeInCondition, customerNotes, submittedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        pool.query(insertQuery, [
            financeRequestID,
            userID,
            vehicleID,
            requestType,
            annualIncome,
            employmentStatus,
            loanAmount,
            loanTerm,
            tradeInVehicle,
            tradeInCondition,
            customerNotes
        ], (err, result) => {
            if (err) {
                console.error('Database error in submit-request:', err);
                return res.status(500).json({ error: 'Failed to submit finance request' });
            }
            
            res.status(201).json({
                success: true,
                message: 'Finance request submitted successfully',
                requestID: financeRequestID
            });
        });

    } catch (error) {
        console.error('Error in submit-request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all finance requests for admin dashboard
router.get('/admin-requests', async (req, res) => {
    try {
        // Use req.pool from middleware
        const pool = req.pool;

        const financeQuery = `
            SELECT 
                fr.requestID,
                fr.userID,
                fr.vehicleID,
                fr.dealerID,
                fr.requestType,
                fr.status,
                fr.annualIncome,
                fr.employmentStatus,
                fr.loanAmount,
                fr.loanTerm,
                fr.tradeInVehicle,
                fr.tradeInCondition,
                fr.customerNotes,
                fr.adminNotes,
                fr.submittedAt,
                fr.updatedAt,
                fr.completedAt
            FROM finance_dashboard fr
            ORDER BY fr.submittedAt DESC
        `;

        pool.query(financeQuery, async (err, requests) => {
            if (err) {
                console.error('Database error in admin-requests:', err);
                return res.status(500).json({ error: 'Failed to fetch finance requests' });
            }

            // Enhance each request with customer and vehicle info
            const enhancedRequests = await Promise.all(
                requests.map(async (request) => {
                    let customerName = 'N/A', customerEmail = 'N/A', customerPhone = 'N/A';
                    let vehicleInfo = 'N/A', price = null, make = 'N/A', model = 'N/A';
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

                    // Get vehicle info
                    if (request.vehicleID) {
                        try {
                            const vehicleResult = await new Promise((resolve, reject) => {
                                pool.query(
                                    `SELECT v.modelName, v.price, v.colour, v.fuel, m.makeName 
                                     FROM vehicles v 
                                     LEFT JOIN makes ma ON v.makeID = ma.makeID 
                                     WHERE v.vehicleID = ?`,
                                    [request.vehicleID],
                                    (err, result) => {
                                        if (err) reject(err);
                                        else resolve(result);
                                    }
                                );
                            });

                            if (vehicleResult && vehicleResult.length > 0) {
                                const vehicle = vehicleResult[0];
                                make = vehicle.makeName || 'Unknown';
                                model = vehicle.modelName || 'Unknown';
                                vehicleInfo = `${make} ${model} (${vehicle.colour || 'N/A'})`;
                                price = vehicle.price;
                            }
                        } catch (error) {
                            console.error('Error fetching vehicle info:', error);
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
                        make: make,
                        model: model,
                        price: price,
                        requestType: request.requestType,
                        status: request.status,
                        requestDate: request.submittedAt ? new Date(request.submittedAt).toLocaleDateString() : 'N/A',
                        requestTime: request.submittedAt ? new Date(request.submittedAt).toLocaleTimeString() : 'N/A',
                        created_at: request.submittedAt,
                        dealerName: dealerName,
                        dealerID: request.dealerID,
                        annualIncome: request.annualIncome,
                        employmentStatus: request.employmentStatus,
                        loanAmount: request.loanAmount,
                        loanTerm: request.loanTerm,
                        tradeInVehicle: request.tradeInVehicle,
                        tradeInCondition: request.tradeInCondition,
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
        console.error('Error in admin-requests:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin: Assign dealer to finance request
router.put('/admin/assign-dealer', async (req, res) => {
    try {
        // Use req.pool from middleware
        const pool = req.pool;

        const { requestID, dealerID } = req.body;

        const updateQuery = `
            UPDATE finance_dashboard 
            SET dealerID = ?, status = 'In Progress', updatedAt = NOW() 
            WHERE requestID = ?
        `;

        pool.query(updateQuery, [dealerID, requestID], (err, result) => {
            if (err) {
                console.error('Database error in assign-dealer:', err);
                return res.status(500).json({ error: 'Failed to assign dealer' });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Finance request not found' });
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

// Admin: Mark finance request as completed
router.put('/admin/mark-completed', async (req, res) => {
    try {
        // Use req.pool from middleware
        const pool = req.pool;

        const { requestID, adminNotes } = req.body;

        const updateQuery = `
            UPDATE finance_dashboard 
            SET status = 'Completed', adminNotes = ?, completedAt = NOW(), updatedAt = NOW() 
            WHERE requestID = ?
        `;

        pool.query(updateQuery, [adminNotes || null, requestID], (err, result) => {
            if (err) {
                console.error('Database error in mark-completed:', err);
                return res.status(500).json({ error: 'Failed to mark request as completed' });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Finance request not found' });
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

// Admin: Cancel finance request
router.put('/admin/cancel-request', async (req, res) => {
    try {
        // Use req.pool from middleware
        const pool = req.pool;

        const { requestID, adminNotes } = req.body;

        const updateQuery = `
            UPDATE finance_dashboard 
            SET status = 'Cancelled', adminNotes = ?, updatedAt = NOW() 
            WHERE requestID = ?
        `;

        pool.query(updateQuery, [adminNotes || null, requestID], (err, result) => {
            if (err) {
                console.error('Database error in cancel-request:', err);
                return res.status(500).json({ error: 'Failed to cancel request' });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Finance request not found' });
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