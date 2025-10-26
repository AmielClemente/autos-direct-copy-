const express = require('express');
const router = express.Router();
// Use req.pool from middleware instead of creating a local pool
const multer = require('multer');

/*
 * View My Advice Requests Function
 * This function returns all of the advice requests that have been submitted by
 * a customer.
*/
router.get('/view-advice-requests', (req, res) => {

    // Once session management where the user ID is stored is figured out
    // we will plug it into this API

    const allRequestsQuery = `SELECT * FROM advice_requests WHERE requesterID
    = ?`;

    pool.query(allRequestsQuery, (err, result) => {
        if (err) {
            console.error('Error retrieving advice requests: ', err);
            return res.status(500).send('Server unable to retrieve advice requests');
        }
        console.log("Query result:", result);
        res.status(200).json(result);
    });
});

/*
 * Cancel Advice Request Function
 * This function cancels an advice request that the customer has submitted.
*/
router.post('/cancel-advice-request/:id', async (req, res) => {
    const {id} = req.params;

    // Potentially need to implement some sort of check that the userID matches
    // as well

    const cancelQuery = `UPDATE advice_requests SET status = 'Cancelled' WHERE
     requestID = ?`;
    
    pool.query(cancelQuery), [id], (err, result) => {
        if (err) {
            console.error('Error cancelling advice request: ', err);
            return res.status(500).send('Server unable to cancel advice request');
        }
        console.log("Query result:", result);
        res.status(200).json(result);
    }
});