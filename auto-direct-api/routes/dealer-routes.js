const express = require('express');
const router = express.Router();
// Use req.pool from middleware instead of creating a local pool
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

const GOOGLE_MAPS_API_KEY = 'AIzaSyCpFWZKeoE-M8Y-iqL1MSsgB0KBjvisPzY';

// Function to geocode address using Google Maps API
async function geocodeAddress(address) {
    try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
            params: {
                address: address,
                key: GOOGLE_MAPS_API_KEY
            }
        });

        if (response.data.status === 'OK' && response.data.results.length > 0) {
            const result = response.data.results[0];
            return {
                success: true,
                latitude: result.geometry.location.lat,
                longitude: result.geometry.location.lng,
                formattedAddress: result.formatted_address,
                addressComponents: result.address_components
            };
        } else {
            return {
                success: false,
                error: 'Address not found or invalid'
            };
        }
    } catch (error) {
        console.error('Geocoding error:', error);
        return {
            success: false,
            error: 'Failed to geocode address'
        };
    }
}

// GET manufacturers - simple endpoint without authentication
router.get('/manufacturers-simple', (req, res) => {
    const query = `SELECT manufacturerID, manufacturerName, manufacturerStatus, ABN, country FROM manufacturers WHERE manufacturerStatus = 'Active'`;
    
    pool.query(query, (err, result) => {
        if (err) {
            console.error('Error fetching manufacturers:', err);
            return res.status(500).json({ error: 'Failed to retrieve manufacturers', details: err.message });
        }
        
        res.status(200).json({ 
            manufacturers: result,
            count: result.length,
            message: 'Successfully retrieved manufacturers'
        });
    });
});

// Alternative manufacturers endpoint
router.get('/get-manufacturers', (req, res) => {
    const query = `SELECT manufacturerID, manufacturerName, manufacturerStatus, ABN, country FROM manufacturers`;
    
    pool.query(query, (err, result) => {
        if (err) {
            console.error('Error in alternative manufacturers endpoint:', err);
            return res.status(500).json({ error: 'Failed to retrieve manufacturers' });
        }
        
        res.status(200).json({ 
            manufacturers: result,
            count: result.length
        });
    });
});

// GET specific manufacturer by ID
router.get('/manufacturers/:manufacturerID', (req, res) => {
    const { manufacturerID } = req.params;
    const query = `SELECT manufacturerID, manufacturerName, manufacturerStatus, ABN, country FROM manufacturers WHERE manufacturerID = ?`;
    
    pool.query(query, [manufacturerID], (err, result) => {
        if (err) {
            console.error('Error fetching manufacturer by ID:', err);
            return res.status(500).json({ error: 'Failed to retrieve manufacturer details' });
        }
        
        if (result.length === 0) {
            return res.status(404).json({ error: 'Manufacturer not found' });
        }
        
        res.status(200).json({ 
            manufacturer: result[0],
            message: 'Successfully retrieved manufacturer details'
        });
    });
});

// GET manufacturer details by make ID
router.get('/manufacturer-by-make/:makeID', (req, res) => {
    const { makeID } = req.params;
    const query = `
        SELECT m.manufacturerID, m.manufacturerName, m.manufacturerStatus, m.ABN, m.country 
        FROM manufacturers m
        JOIN makes mk ON m.manufacturerID = mk.manufacturerID
        WHERE mk.makeID = ?
    `;
    
    pool.query(query, [makeID], (err, result) => {
        if (err) {
            console.error('Error fetching manufacturer by make ID:', err);
            return res.status(500).json({ error: 'Failed to retrieve manufacturer details' });
        }
        
        if (result.length === 0) {
            return res.status(404).json({ error: 'Manufacturer not found for this make' });
        }
        
        res.status(200).json({ 
            manufacturer: result[0],
            message: 'Successfully retrieved manufacturer details'
        });
    });
});

// GET all dealerships
router.get('/manage', (req, res) => {
    const query = `SELECT * FROM dealers`;

    pool.query(query, (err, result) => {
        if (err) {
            console.error('Error fetching dealerships:', err.sqlMessage || err.message);
            return res.status(500).send('Failed to retrieve dealerships');
        }

        res.status(200).json({ dealerships: result });
    });
});

// POST add a new dealership
router.post('/add', async (req, res) => {
    const {
        manufacturerID,
        dealerName,
        address
    } = req.body;

    // Basic validation
    if (!manufacturerID || !dealerName || !address) {
        console.warn("Validation failed. Required fields missing.");
        return res.status(400).json({ error: 'Missing required fields: manufacturerID, dealerName, and address are required' });
    }

    // Check what manufacturers actually exist
    const checkAllManufacturersQuery = `SELECT manufacturerID, manufacturerName FROM manufacturers`;
    
    pool.query(checkAllManufacturersQuery, async (err, allManufacturers) => {
        if (err) {
            console.error("Error checking manufacturers:", err);
            return res.status(500).json({ error: 'Database error checking manufacturers' });
        }
        
        const foundManufacturer = allManufacturers.find(m => m.manufacturerID === manufacturerID);
        
        if (!foundManufacturer) {
            console.log("Manufacturer NOT FOUND!");
            console.log("Available manufacturer IDs:");
            allManufacturers.forEach(m => {
                console.log(`  - "${m.manufacturerID}" (${m.manufacturerName})`);
                console.log(`    Length: ${m.manufacturerID.length}, Type: ${typeof m.manufacturerID}`);
            });
            
            return res.status(400).json({ 
                error: 'Invalid manufacturerID - not found in database',
                receivedID: manufacturerID,
                availableManufacturers: allManufacturers
            });
        }

        try {
            // Geocode the address
            const geocodeResult = await geocodeAddress(address);

            if (!geocodeResult.success) {
                return res.status(400).json({ error: geocodeResult.error });
            }

            const dealerID = uuidv4();

            const insertQuery = `
                INSERT INTO dealers 
                (dealerID, manufacturerID, dealerName, address, latitude, longitude)
                VALUES (?, ?, ?, ?, ?, ?)
            `;

            const insertValues = [
                dealerID,
                manufacturerID,
                dealerName,
                geocodeResult.formattedAddress,
                geocodeResult.latitude,
                geocodeResult.longitude
            ];

            pool.query(insertQuery, insertValues, (err, result) => {
                if (err) {
                    console.error('SQL Insert Error:', err.sqlMessage || err.message);
                    console.error('Full error object:', err);
                    return res.status(500).json({ error: err.sqlMessage || err.message });
                }

                res.status(201).json({
                    message: 'Dealership added successfully',
                    dealership: {
                        dealerID,
                        manufacturerID,
                        dealerName,
                        address: geocodeResult.formattedAddress,
                        latitude: geocodeResult.latitude,
                        longitude: geocodeResult.longitude
                    }
                });
            });

        } catch (error) {
            console.error('Error in dealership creation process:', error);
            res.status(500).json({ error: 'Internal server error while adding dealership' });
        }
    });
});

// PUT update a dealership
router.put('/update/:id', async (req, res) => {
    const dealerID = req.params.id;
    const { name, address } = req.body;

    if (!name || !address) {
        return res.status(400).json({ error: 'Name and address are required' });
    }

    try {
        const geocodeResult = await geocodeAddress(address);

        if (!geocodeResult.success) {
            return res.status(400).json({ error: geocodeResult.error });
        }

        const addressComponents = geocodeResult.addressComponents;
        let streetNo = '';
        let streetName = '';
        let suburb = '';
        let postcode = '';

        addressComponents.forEach(component => {
            const types = component.types;
            if (types.includes('street_number')) {
                streetNo = component.long_name;
            } else if (types.includes('route')) {
                streetName = component.long_name;
            } else if (types.includes('locality') || types.includes('sublocality')) {
                suburb = component.long_name;
            } else if (types.includes('postal_code')) {
                postcode = component.long_name;
            }
        });

        const updateQuery = `
            UPDATE dealers 
            SET dealerName = ?, streetNo = ?, streetName = ?, suburb = ?, postcode = ?, 
                longitude = ?, latitude = ?, fullAddress = ?
            WHERE dealerID = ?
        `;

        pool.query(updateQuery, [
            name,
            streetNo || null,
            streetName || null,
            suburb || null,
            postcode || null,
            geocodeResult.longitude,
            geocodeResult.latitude,
            geocodeResult.formattedAddress,
            dealerID
        ], (err, result) => {
            if (err) {
                console.error('SQL Update Error:', err.sqlMessage || err.message);
                return res.status(500).json({ error: err.sqlMessage || err.message });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Dealership not found' });
            }

            res.status(200).json({
                message: 'Dealership updated successfully',
                dealership: {
                    dealerID,
                    dealerName: name,
                    streetNo,
                    streetName,
                    suburb,
                    postcode,
                    longitude: geocodeResult.longitude,
                    latitude: geocodeResult.latitude,
                    fullAddress: geocodeResult.formattedAddress
                }
            });
        });

    } catch (error) {
        console.error('Error updating dealership:', error);
        res.status(500).json({ error: 'Internal server error while updating dealership' });
    }
});

// DELETE a dealership
router.delete('/delete/:id', (req, res) => {
    const dealerID = req.params.id;

    const deleteQuery = `DELETE FROM dealers WHERE dealerID = ?`;

    pool.query(deleteQuery, [dealerID], (err, result) => {
        if (err) {
            console.error('Error deleting dealership:', err.sqlMessage || err.message);
            return res.status(500).send('Server unable to delete dealership');
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Dealership not found' });
        }

        res.status(200).json({ message: 'Dealership deleted successfully' });
    });
});

module.exports = router;