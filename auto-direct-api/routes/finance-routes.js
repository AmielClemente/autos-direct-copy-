const express = require('express');
const router = express.Router();

// Get finance dashboard data
router.get('/dashboard-data', async (req, res) => {
  try {
    // Simple query to get ALL users who have test drives, regardless of role
    const query = `
      SELECT DISTINCT
        u.userID as customerID,
        u.name as customerName,
        u.email as customerEmail,
        u.phone as customerPhone,
        
        -- Count completed test drives
        COALESCE((SELECT COUNT(*) FROM test_drive_bookings tdb WHERE tdb.userID = u.userID AND tdb.status = 'Completed'), 0) as testDrivesCompleted,
        
        -- Count total test drives
        COALESCE((SELECT COUNT(*) FROM test_drive_bookings tdb WHERE tdb.userID = u.userID), 0) as totalTestDrives,
        
        -- Check purchases
        COALESCE((SELECT COUNT(*) FROM purchases p WHERE p.userID = u.userID), 0) as purchaseCount,
        COALESCE((SELECT SUM(p.totalAmount) FROM purchases p WHERE p.userID = u.userID), 0) as purchaseAmount,
        
        -- Get vehicle info
        COALESCE((SELECT CONCAT(COALESCE(m.makeName, 'Unknown'), ' ', COALESCE(mo.modelName, 'Model')) 
         FROM purchases p 
         LEFT JOIN vehicles v ON p.vehicleID = v.vehicleID 
         LEFT JOIN models mo ON v.modelID = mo.modelID 
         LEFT JOIN makes m ON mo.makeID = m.makeID 
         WHERE p.userID = u.userID 
         ORDER BY p.purchaseDate DESC LIMIT 1), 'No purchases') as vehicleInfo,
        
        -- Calculate commission
        COALESCE((SELECT SUM(p.totalAmount * 0.05) FROM purchases p WHERE p.userID = u.userID), 0) as dealerCommission
        
      FROM users u
      WHERE u.userID IN (SELECT DISTINCT userID FROM test_drive_bookings)
         OR u.userID IN (SELECT DISTINCT userID FROM purchases)
      ORDER BY u.name ASC
    `;

    req.pool.query(query, (error, results) => {
      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to fetch finance data',
          error: error.message 
        });
      }

      console.log(`Raw query returned ${results.length} rows`);
      
      // Process results
      const financeData = results.map(row => {
        const processed = {
          customerID: row.customerID,
          customerName: row.customerName || 'N/A',
          customerEmail: row.customerEmail || 'N/A',
          customerPhone: row.customerPhone || 'N/A',
          testDrivesCompleted: parseInt(row.testDrivesCompleted) || 0,
          totalTestDrives: parseInt(row.totalTestDrives) || 0,
          hasPurchased: parseInt(row.purchaseCount) > 0 ? 'Yes' : 'No',
          purchaseAmount: parseFloat(row.purchaseAmount) || 0,
          vehicleInfo: row.vehicleInfo || 'No purchases',
          dealerCommission: parseFloat(row.dealerCommission) || 0
        };
        
        console.log(`Customer: ${processed.customerName}, Test Drives: ${processed.testDrivesCompleted}, Purchases: ${processed.hasPurchased}`);
        return processed;
      });
      
      console.log(`Finance Dashboard: Processed ${financeData.length} customers`);
      res.json(financeData);
    });

  } catch (error) {
    console.error('Finance dashboard error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Get summary statistics
router.get('/summary', async (req, res) => {
  try {
    const summaryQueries = [
      'SELECT COUNT(DISTINCT userID) as totalCustomers FROM test_drive_bookings',
      'SELECT COUNT(*) as totalTestDrives FROM test_drive_bookings WHERE status = "Completed"',
      'SELECT COUNT(DISTINCT userID) as totalPurchases FROM purchases',
      'SELECT COALESCE(SUM(totalAmount), 0) as totalRevenue FROM purchases',
      'SELECT COALESCE(SUM(totalAmount * 0.05), 0) as totalCommission FROM purchases'
    ];

    const summaryData = {
      totalCustomers: 0,
      totalTestDrives: 0,
      totalPurchases: 0,
      totalRevenue: 0,
      totalCommission: 0
    };

    // Execute each query separately to avoid complex joins
    let completedQueries = 0;
    
    connection.query(summaryQueries[0], (error, results) => {
      if (!error && results[0]) summaryData.totalCustomers = results[0].totalCustomers || 0;
      completedQueries++;
      if (completedQueries === 5) res.json(summaryData);
    });

    connection.query(summaryQueries[1], (error, results) => {
      if (!error && results[0]) summaryData.totalTestDrives = results[0].totalTestDrives || 0;
      completedQueries++;
      if (completedQueries === 5) res.json(summaryData);
    });

    connection.query(summaryQueries[2], (error, results) => {
      if (!error && results[0]) summaryData.totalPurchases = results[0].totalPurchases || 0;
      completedQueries++;
      if (completedQueries === 5) res.json(summaryData);
    });

    connection.query(summaryQueries[3], (error, results) => {
      if (!error && results[0]) summaryData.totalRevenue = parseFloat(results[0].totalRevenue) || 0;
      completedQueries++;
      if (completedQueries === 5) res.json(summaryData);
    });

    connection.query(summaryQueries[4], (error, results) => {
      if (!error && results[0]) summaryData.totalCommission = parseFloat(results[0].totalCommission) || 0;
      completedQueries++;
      if (completedQueries === 5) res.json(summaryData);
    });

    // Timeout fallback
    setTimeout(() => {
      if (completedQueries < 5) {
        console.log('Summary queries timeout, returning partial data');
        res.json(summaryData);
      }
    }, 5000);

  } catch (error) {
    console.error('Summary endpoint error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Debug endpoint to check what data exists
router.get('/debug', async (req, res) => {
  try {
    const debugQueries = [
      // Check all users
      'SELECT userID, name, email FROM users LIMIT 5',
      // Check user roles
      'SELECT ur.userID, u.name, r.roleName FROM user_roles ur JOIN users u ON ur.userID = u.userID JOIN roles r ON ur.roleID = r.roleID LIMIT 5',
      // Check test drive bookings
      'SELECT userID, status, COUNT(*) as count FROM test_drive_bookings GROUP BY userID, status LIMIT 10',
      // Check purchases
      'SELECT userID, COUNT(*) as purchaseCount, SUM(totalAmount) as totalAmount FROM purchases GROUP BY userID LIMIT 5'
    ];

    const results = {};
    
    for (let i = 0; i < debugQueries.length; i++) {
      await new Promise((resolve, reject) => {
        connection.query(debugQueries[i], (error, queryResults) => {
          if (error) {
            results[`query_${i}`] = { error: error.message };
          } else {
            results[`query_${i}`] = queryResults;
          }
          resolve();
        });
      });
    }

    res.json({
      message: 'Debug information',
      data: results
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Debug query failed',
      error: error.message 
    });
  }
});

// Get vehicle comparison and customer service queue data
router.get('/comparison-data', async (req, res) => {
  try {
    const query = `
      SELECT 
        ar.requestID as id,
        u.name as customer_name,
        u.email as customer_email,
        u.phone as customer_phone,
        
        -- Get vehicle information
        CONCAT(COALESCE(ma.makeName, 'Unknown'), ' ', COALESCE(v.modelName, 'Model')) as vehicle_info,
        
        -- Set request type as Comparison for advice requests
        'Comparison' as request_type,
        
        -- Get request details
        ar.submittedAt as created_at,
        ar.status,
        ar.description,
        v.vehicleID,
        v.price,
        v.colour
        
      FROM advice_requests ar
      LEFT JOIN users u ON ar.requesterID = u.userID
      LEFT JOIN vehicles v ON ar.vehicleID = v.vehicleID
      LEFT JOIN makes ma ON v.makeID = ma.makeID
      
      WHERE ar.status IN ('Pending', 'In Progress')
      
      UNION ALL
      
      SELECT 
        tdb.bookingID as id,
        u.name as customer_name,
        u.email as customer_email,
        u.phone as customer_phone,
        
        -- Get vehicle information from test drives
        CONCAT(COALESCE(ma.makeName, 'Unknown'), ' ', COALESCE(v.modelName, 'Model')) as vehicle_info,
        
        'Test Drive' as request_type,
        
        tdb.time as created_at,
        tdb.status,
        tdb.customerNotes as description,
        v.vehicleID,
        v.price,
        v.colour
        
      FROM test_drive_bookings tdb
      LEFT JOIN users u ON tdb.userID = u.userID
      LEFT JOIN vehicles v ON tdb.vehicleID = v.vehicleID
      LEFT JOIN makes ma ON v.makeID = ma.makeID
      
      WHERE tdb.status IN ('Pending', 'Booked')
      
      ORDER BY created_at DESC
    `;

    req.pool.query(query, (error, results) => {
      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to fetch comparison data',
          error: error.message 
        });
      }

      console.log('Comparison data query results:', results.length, 'records found');
      res.json(results);
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Comparison data query failed',
      error: error.message 
    });
  }
});

// Admin action to assign dealer to advice request
router.put('/admin/assign-dealer', async (req, res) => {
  try {
    const { requestID, dealerID, requestType } = req.body;
    
    if (requestType === 'Comparison') {
      // For advice requests, we'll assign to employeeID field
      const query = `UPDATE advice_requests SET employeeID = ? WHERE requestID = ?`;
      connection.query(query, [dealerID, requestID], (error, results) => {
        if (error) {
          console.error('Database error:', error);
          return res.status(500).json({ 
            success: false, 
            message: 'Failed to assign dealer',
            error: error.message 
          });
        }
        res.json({ success: true, message: 'Dealer assigned successfully' });
      });
    } else if (requestType === 'Test Drive') {
      // For test drive bookings, update dealerID
      const query = `UPDATE test_drive_bookings SET dealerID = ? WHERE bookingID = ?`;
      connection.query(query, [dealerID, requestID], (error, results) => {
        if (error) {
          console.error('Database error:', error);
          return res.status(500).json({ 
            success: false, 
            message: 'Failed to assign dealer',
            error: error.message 
          });
        }
        res.json({ success: true, message: 'Dealer assigned successfully' });
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to assign dealer',
      error: error.message 
    });
  }
});

// Admin action to mark request as completed
router.put('/admin/mark-completed', async (req, res) => {
  try {
    const { requestID, requestType } = req.body;
    
    if (requestType === 'Comparison') {
      const query = `UPDATE advice_requests SET status = 'Completed' WHERE requestID = ?`;
      connection.query(query, [requestID], (error, results) => {
        if (error) {
          console.error('Database error:', error);
          return res.status(500).json({ 
            success: false, 
            message: 'Failed to mark as completed',
            error: error.message 
          });
        }
        res.json({ success: true, message: 'Request marked as completed' });
      });
    } else if (requestType === 'Test Drive') {
      const query = `UPDATE test_drive_bookings SET status = 'Completed' WHERE bookingID = ?`;
      connection.query(query, [requestID], (error, results) => {
        if (error) {
          console.error('Database error:', error);
          return res.status(500).json({ 
            success: false, 
            message: 'Failed to mark as completed',
            error: error.message 
          });
        }
        res.json({ success: true, message: 'Request marked as completed' });
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark as completed',
      error: error.message 
    });
  }
});

// Admin action to cancel request
router.put('/admin/cancel-request', async (req, res) => {
  try {
    const { requestID, requestType } = req.body;
    
    if (requestType === 'Comparison') {
      const query = `UPDATE advice_requests SET status = 'Cancelled' WHERE requestID = ?`;
      connection.query(query, [requestID], (error, results) => {
        if (error) {
          console.error('Database error:', error);
          return res.status(500).json({ 
            success: false, 
            message: 'Failed to cancel request',
            error: error.message 
          });
        }
        res.json({ success: true, message: 'Request cancelled successfully' });
      });
    } else if (requestType === 'Test Drive') {
      const query = `UPDATE test_drive_bookings SET status = 'Cancelled' WHERE bookingID = ?`;
      connection.query(query, [requestID], (error, results) => {
        if (error) {
          console.error('Database error:', error);
          return res.status(500).json({ 
            success: false, 
            message: 'Failed to cancel request',
            error: error.message 
          });
        }
        res.json({ success: true, message: 'Request cancelled successfully' });
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to cancel request',
      error: error.message 
    });
  }
});

module.exports = router;