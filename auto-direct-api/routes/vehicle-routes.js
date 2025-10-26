// '/vehicle' api route
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authentication');
const authorizeUser = require('../middleware/authorization');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { getMakeID, getAllMakes } = require('../service/make-services.js')

// Multer implementation for naming convention and saving to location

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '..', 'vehicle-images'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
         const extension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + extension)
    }
})

const upload = multer({ storage: storage})

/*
 * Add a Vehicle Function
 * This function adds a Vehicle to Auto's Direct
 * It will then require approval from an Auto's Direct Employee
 * 
 * 3 step process, insertVehicle into the DB, then the images, and lastly the route itself.
 * 
 * NOTE: For now, it won't require a user to be authenticated - this will need
 * to be implemented. Just getting the functionality in for now.
*/

const insertVehicle =  async (req, res, next) => {
    const {makeName, modelName, bodyType, fuelType, driveType, cylinders, doors, transmission, colour, price, description} = req.body;
    const approvalStatus = 'Pending Approval';
    
	const vehicleNewID = uuidv4();
	const makeID = await getMakeID(makeName);
    const vehicleQuery = `INSERT INTO vehicles (vehicleID, makeID, modelName, bodyType, fuel, driveType, cylinders, doors, transmission, colour, price, description, approvalStatus)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;



    req.pool.query(vehicleQuery, [vehicleNewID, makeID, modelName, bodyType, fuelType, driveType, cylinders, doors, transmission, colour, price, description, approvalStatus], (err, result) => {
        if (err) {
          console.error('Unable to insert vehicle: ', err);
          return res.status(500).send('Server error');
        }
        req.vehicleId = vehicleNewID;
        next();
    });
};

const insertVehicleImages = (req, res) => {
    const vehicleId = req.vehicleId;
    const files = req.files;


    if (!files || files.length === 0) {
        return res.status(400).send('No images were uploaded.');
    }

    {/* Multer created a unique file name - need to map front-end to new */}

    let imageOrderMap = {};
    try {
        const imageOrderArray = JSON.parse(req.body.imageOrder);
        imageOrderArray.forEach(({ name, order }) => {
            imageOrderMap[name] = order + 1;
        });
    } catch (error) {
        console.error("Invalid imageOrder JSON:", error);
        return res.status(400).send('Invalid imageOrder data.');
    }    

    const insertImageQuery = `
        INSERT INTO vehicle_images (imageID, vehicleID, path, imageOrder)
        VALUES (?, ?, ?, ?)
    `;

    // Insert each image one by one incrementing imageOrder (we'll need to make this editable)
    const insertPromises = files.map((file, index) => {
        const imageNewID = uuidv4();
        const fileName = file.filename;
        const originalName = file.originalname;
        const imageOrder = imageOrderMap[originalName];

        return new Promise((resolve, reject) => {
            req.pool.query(insertImageQuery, [imageNewID, vehicleId, fileName, imageOrder], (err, result) => {
                if (err) {
                    console.log('Unable to insert image: ', err);
                    reject(err);
                } else {
                    console.log('Image inserted successfully:', result);
                    resolve(result);
                }
            });
        });
    });

    Promise.all(insertPromises)
        .then(() => {
            res.status(200).json({ message: 'Vehicle and images added successfully!' });
        })
        .catch(error => {
            console.error('Error inserting images:', error);
            res.status(500).send('Server unable to upload images');
        }
    );
};

router.post('/add-vehicle', upload.array('images', 10), insertVehicle, insertVehicleImages);

/*
* Edit Vehicle Function
* This function has a lot to it, but there is a decent bit of processing from the front end
* that gets pulled via req
* Updates attributes, removes images, adds images, and then implements order if any of these
* were changed.
*/

router.put('/edit-vehicle/:vehicleID', upload.array('newImages', 10), async (req, res) => {
    const { vehicleID } = req.params;
    const { vehicleUpdates, imagesToDelete, imageOrderUpdates } = req.body; 
    
    // Above JSON strings will be sed to process relevant changes

    try {

        // Start with attribute changes of the vehicle
        if (vehicleUpdates) {
            const updates = JSON.parse(vehicleUpdates);
            if (Object.keys(updates).length > 0) {

                const columns = Object.keys(updates).map(key => `${key} = ?`).join(', ');
                const values = Object.values(updates);
                const updateVehicleQuery = `UPDATE vehicles SET ${columns} WHERE vehicleID = ?`;

                req.pool.query(updateVehicleQuery, [...values, vehicleID]);
                console.log(`Vehicle ${vehicleID} attributes updated.`);
            }
        }

        /*
        * Proceed with removing images. Note: this doesn't remove the image from the file
        * directory. It just removes the database record, and stops the image from being
        * presented to users.
        * Ideally, an S3 bucket or some other external storage service would be used, but
        * we couldn't implement this due to no budget. Handling would be a bit more graceful.
        */

        if (imagesToDelete) {
            const deletedImages = JSON.parse(imagesToDelete);
            const deleteImageQuery = `DELETE FROM vehicle_images WHERE imageID = ? AND vehicleID = ?`;
            if (deletedImages.length > 0) {
                for (const image of deletedImages) {
                    req.pool.query(deleteImageQuery, [image.imageID, vehicleID]);
                    console.log(`Deleted image record for imageID: ${image.imageID}`);
                }
            }
        }

        /*
        * Continue with getting the newly uploaded images into the database (if there are any)
        * Multer has already added them to the file directory
        */

        const newUploadedFiles = req.files; // Files handled by Multer
        const insertedNewImageIds = []; // To store imageIDs of newly uploaded files for order updates

        if (newUploadedFiles && newUploadedFiles.length > 0) {
            const insertImageQuery = `INSERT INTO vehicle_images (imageID, vehicleID, path, imageOrder) VALUES (?, ?, ?, ?)`;

            for (const file of newUploadedFiles) {
                const newImageID = uuidv4();

                req.pool.query(insertImageQuery, [newImageID, vehicleID, file.filename, 9999]); // High image order will be changed
                console.log(`Inserted new image record for filename: ${file.filename}`);
                insertedNewImageIds.push({
                    originalname: file.originalname, // Used for matching later
                    imageID: newImageID,
                    filename: file.filename // Unique filename from Multer
                });
            }
        }

        // Amend the image order according to the Dropzone state in the edit form
        if (imageOrderUpdates) {
            const orderedImages = JSON.parse(imageOrderUpdates);
            const updateOrderQuery = `UPDATE vehicle_images SET imageOrder = ? WHERE imageID = ? AND vehicleID = ?`;

            for (const image of orderedImages) {
                let actualImageID = image.imageID;

                // For newly added images, find their real imageID from insertedNewImageIds
                if (!image.isExisting) {
                    const matchedNewImage = insertedNewImageIds.find(
                        (newImage) => newImage.originalname === image.name // Match frontend's 'name' with backend's 'originalname'
                    );
                    if (matchedNewImage) {
                        actualImageID = matchedNewImage.imageID;
                    } else {
                        continue;
                    }
                }

                if (actualImageID) {
                    req.pool.query(updateOrderQuery, [image.order + 1, actualImageID, vehicleID]); // imageOrder is array position, so add 1
                }
            }
            console.log(`Image orders updated for vehicle: ${vehicleID}`);
        }

        res.status(200).json({ message: 'Vehicle updated successfully!' });

    } catch (error) {
        console.error('Error in the edit vehicle route:', error);
        res.status(500).json({ message: 'Server error updating vehicle', error: error.message });
    }
});

/*
* Browse Vehicles Function
* This function returns all vehicles for the Browse page. At the beginning it
* will return all vehicles. Applying filters calls this function again, but filter
* parameters are handled and passed to the query.
*/

router.get('/browse-vehicles', (req, res) => {

  const { make, price, transmission, bodyType, fuel, driveType } = req.query;

  let browseQuery = `
    SELECT v.*, vi.path AS mainImage, m.makeName
    FROM vehicles v
    LEFT JOIN (
      SELECT vehicleID, path FROM vehicle_images WHERE imageOrder = 1
    ) vi ON v.vehicleID = vi.vehicleID
    JOIN makes m ON v.makeID = m.makeID
    WHERE 1=1 AND v.approvalStatus = 'Approved' AND v.deletedStatus != 'Deleted'
  `;

  const values = [];

  const addFilter = (paramValue, columnName, isNumber = false) => {
    if (paramValue) {
      const paramArray = paramValue.split(',');
      if (paramArray.length > 0) {
        const placeholders = paramArray.map(() => '?').join(', ');

        if (columnName === 'v.price' && isNumber) {
          // Handle "Above $100,000" case separately
          const hasAbove100k = paramArray.includes('above100000');
          const numericPrices = paramArray.map(Number).filter(price => !isNaN(price));
          
          if (hasAbove100k && numericPrices.length > 0) {
            // If we have "above100000" AND other prices, show cars above 100k OR under the other prices
            const maxOtherPrice = Math.max(...numericPrices);
            browseQuery += ` AND (${columnName} > ? OR ${columnName} <= ?)`;
            values.push(100000, maxOtherPrice);
          } else if (hasAbove100k) {
            // Only "Above $100,000" selected
            browseQuery += ` AND ${columnName} > ?`;
            values.push(100000);
          } else if (numericPrices.length > 0) {
            // Regular price filtering (under a certain amount)
            const maxPrice = Math.max(...numericPrices);
            browseQuery += ` AND ${columnName} <= ?`;
            values.push(maxPrice);
          }

        } else {
          
          browseQuery += ` AND ${columnName} IN (${placeholders})`;
          values.push(...paramArray);
        }
      }
    }
  };

  addFilter(make, 'm.makeName');
  addFilter(price, 'v.price', true);
  addFilter(transmission, 'v.transmission');
  addFilter(bodyType, 'v.bodyType');
  addFilter(fuel, 'v.fuel');
  addFilter(driveType, 'v.driveType');

  req.pool.query(browseQuery, values, (err, result) => {
    if (err) {
      console.error('Error retrieving vehicles: ', err);
      // Return empty array instead of crashing
      return res.status(200).json([]);
    }

    res.status(200).json(result);
  });  

});

/*
 * Individual Vehicle Page Function
 * 
 *
 * 
 */

router.get('/vehicle-information/:id', async (req, res) => {
    const { id } = req.params;

    const carQuery = `SELECT v.*, m.makeName, m.manufacturerID FROM vehicles v JOIN makes m ON v.makeID = m.makeID 
    WHERE vehicleID = ?`;

    // Images sorted by back-end, but imageOrder included for inspecting the API
    const imagesQuery = `SELECT imageID, path, imageOrder FROM vehicle_images WHERE vehicleID = ?
    ORDER BY imageOrder ASC;`;

    req.pool.query(carQuery, [id], (err, carResult) => {
        if (err) {
            console.error('Error retrieving vehicle: ', err);
            return res.status(500).send('Server unable to retrieve vehicle');
        }

        if (carResult.length === 0) {
            return res.status(404).send('Vehicle not found');
        }

        req.pool.query(imagesQuery, [id], (imgErr, imageResults) => {
            if (imgErr) {
                console.error('Error retrieving images: ', imgErr);
                return res.status(500).send('Server unable to retrieve vehicle images');
            }

            res.status(200).json({
                vehicle: carResult[0],
                images: imageResults
            });
        });
    });
});

/*
* Manage Vehicles - Return all vehicles function
* This function is used by the admin panel
*/

router.get('/manage-vehicles', (req, res) => {
    const searchTerm = req.query.q;

    let allVehiclesQuery = `SELECT v.*, m.makeName FROM vehicles v
    JOIN makes m ON v.makeID = m.makeID
    WHERE v.deletedStatus != 'Deleted'`;

    const queryParams = []; // Array to hold parameters for the SQL query

    if (searchTerm) {
        // Prep the search term 
        const formattedSearchTerm = `%${searchTerm.toLowerCase()}%`;

        allVehiclesQuery += `
        AND (
            LOWER(m.makeName) LIKE ?
            OR LOWER(v.modelName) LIKE ?
            OR LOWER(v.bodyType) LIKE ?
            OR LOWER(v.fuel) LIKE ?
            OR LOWER(v.driveType) LIKE ?
            OR LOWER(v.transmission) LIKE ?
            OR LOWER(v.colour) LIKE ?
        )`;

        queryParams.push(
            formattedSearchTerm, // for makeName
            formattedSearchTerm, // for modelName
            formattedSearchTerm, // for bodyType
            formattedSearchTerm, // for fuel
            formattedSearchTerm, // for driveType
            formattedSearchTerm, // for transmission
            formattedSearchTerm, // for colour
        );
    }

    allVehiclesQuery += ` ORDER BY m.makeName ASC`;

    req.pool.query(allVehiclesQuery, queryParams, (err, result) => {
        if (err) {
            console.error('Error searching for vehicles: ', err);
            return res.status(500).send('Server unable to search for vehicles');
        }
        res.json(result);
    });
});

/*
* Approve Vehicle
* This function is used to approve a vehicle listing within the Manage Vehicles
* admin panel
*/

router.post('/manage-vehicles/approve/:id', async (req, res) => {
    const { id } = req.params;

    const approveQuery = `UPDATE vehicles SET approvalStatus = 'Approved'
    WHERE vehicleID = ?`;

    req.pool.query(approveQuery, [id], (err, result) => {
        if (err) {
            console.error('Error approving vehicle:', err);
            return res.status(500).send('Server unable to approve vehicle');
        }
        console.log("Approve result:", result);
        res.status(200).json(result);
    });

});

/*
* Reject/Deny Vehicle
* This function is used to reject/deny a vehicle listing within the Manage Vehicles
* admin panel
*/

router.post('/manage-vehicles/reject/:id', async (req, res) => {
    const { id } = req.params;

    const denyQuery = `UPDATE vehicles SET approvalStatus = 'Denied'
    WHERE vehicleID = ?`;

    req.pool.query(denyQuery, [id], (err, result) => {
        if (err) {
            console.error('Error rejecting vehicle:', err);
            return result.status(500).send('Server unable to reject vehicle');
        }
        console.log("Reject result:", result);
        res.status(200).json(result);
    });

});

/*
* Delete Vehicle
* This function is used to delete a vehicle listing within the Manage Vehicles
* admin panel
* This is a soft delete. It does not remove the record from the database for historical
* /archiving purposes.
*/

router.post('/manage-vehicles/delete/:id', async (req, res) => {
    const { id } = req.params;

    const deleteQuery = `UPDATE vehicles SET deletedStatus = 'Deleted'
    WHERE vehicleID = ?`;

    req.pool.query(deleteQuery, [id], (err, result) => {
        if (err) {
            console.error('Error deleting vehicle:', err);
            return result.status(500).send('Server unable to delete vehicle');
        }
        console.log("Delete result:", result);
        res.status(200).json(result);
    });

});

router.get('/makes', async (req, res) => {
	try {
		const makes = await getAllMakes();
		res.status(200).json({ makes: makes });
	} catch (error) {
		console.error('Error retrieving Makes:', error);
		// Return empty array instead of crashing
		res.status(200).json({ makes: [] });
	}
})

/* Function for submitting an advice request - needs to be complete */

router.post('/request-advice/', async (req, res) => {

    const adviceRequestQuery = `INSERT INTO advice_requests (requestID, requesterID, vehicleID, status, description)
    VALUES (?, ?, ?, ?, ?)`;

    let status = 'Pending'
    const requestID = uuidv4();
    const { requester, vehicleID, description } = req.body;

    
    req.pool.query(adviceRequestQuery, [requestID, requester, vehicleID, status, description], (err, result) => {
        if (err) {
          console.error('Unable to submit advice request: ', err);
          return res.status(500).send('Server error');
        }
        console.log("Submitted request:", result);
        res.status(200).json(result);
    });

});

/* Save Vehicle Function
 * Checks if it has already been saved to avoid duplicate entries
 */

router.post('/save-vehicle/add', [verifyToken, authorizeUser], (req, res) => {
    const savedID = uuidv4();
    const { userID, vehicleID } = req.body;
    const dateTime = new Date();
    const formattedDateTime = dateTime.toISOString().slice(0, 19).replace('T', ' ')

    const existingSaveQuery = `SELECT * FROM saved_vehicle WHERE userID = ? AND vehicleID = ?`;

    req.pool.query(existingSaveQuery, [userID, vehicleID], (err, rows) => {
        if (err) {
            console.error('Database error checking existing save:', err);
            return res.status(500).json({ error: err.message });
        }

        if (rows.length > 0) {
            console.log(`Vehicle ${vehicleID} has already been saved by user ${userID}.`);
        }

        // If no existing save, proceed to insert
        const saveVehicleQuery = `INSERT INTO saved_vehicle (savedID, userID, vehicleID, savedAt) VALUES (?, ?, ?, ?)`;

        req.pool.query(saveVehicleQuery, [savedID, userID, vehicleID, formattedDateTime], (error, result) => {
            if (error) {
                console.error('Database error inserting saved vehicle:', error);
                return res.status(500).json({ error: error.message });
            }

            console.log("Saved vehicle successfully:", result);
            return res.status(200).json({ message: 'Vehicle saved successfully', savedID: savedID, result: result });
        });
    });
});

/* Remove Saved Vehicle Function */

router.post('/save-vehicle/remove', [verifyToken, authorizeUser ], async (req, res) => {
    const {userID, vehicleID} = req.body;

    if (!userID || !vehicleID) {
        return res.status(400).json({ message: 'User ID and Vehicle ID are required for removal.' });
    }

    const unsaveVehicleQuery = `DELETE FROM saved_vehicle WHERE userID = ? AND vehicleID = ?`;

    req.pool.query(unsaveVehicleQuery, [userID, vehicleID], (err, result) => {
        if (err) {
            console.error('Unable to unsave vehicle:', err);
            return res.status(500).send('Server error unsaving vehicle:');
        }
        console.log("Unsaved vehicle:", result);
        res.status(200).json(result);
    })

})

/* Retrieve Saved Vehicles Function */

router.get('/saved-vehicles/', [ verifyToken, authorizeUser ], async (req, res) => {
    const userID = req.userID;
    try {
        // Retrieve saved vehicles
        const savedVehiclesQuery = `SELECT sv.vehicleID, sv.savedAt FROM saved_vehicle sv
            WHERE sv.userID = ? ORDER BY sv.savedAt DESC;`;

        const [savedVehicles] = await pool.promise().query(savedVehiclesQuery, [userID]);

        if (savedVehicles.length === 0) {
            return res.status(200).json([]);
        }

        // Prep vehicle ID's to get the vehicle details
        const vehicleIDs = savedVehicles.map(row => row.vehicleID);
        const placeholders = vehicleIDs.map(() => '?').join(', ');

        // Get vehicle details from the prepped ID's
        const vehicleDetailsQuery = `
            SELECT v.*, vi.path AS mainImage, m.makeName
            FROM vehicles v
            LEFT JOIN (
                SELECT vehicleID, path FROM vehicle_images WHERE imageOrder = 1
            ) vi ON v.vehicleID = vi.vehicleID
            JOIN makes m ON v.makeID = m.makeID
            WHERE v.vehicleID IN (${placeholders}) AND v.approvalStatus = 'Approved' AND v.deletedStatus != 'Deleted'
            ORDER BY CASE ${vehicleIDs.map((id, index) => `WHEN v.vehicleID = ? THEN ${index}`).join(' ')} END
        `;

        const [savedVehicleDetails] = await pool.promise().query(vehicleDetailsQuery, [...vehicleIDs, ...vehicleIDs]);

        res.status(200).json(savedVehicleDetails);

    } catch (error) {
        console.error('Error fetching saved vehicles:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
    
})

module.exports = router;