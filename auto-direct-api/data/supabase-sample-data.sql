-- Sample Data for Auto Direct Application
-- Run this after the main migration script

-- Insert sample manufacturers
INSERT INTO manufacturers (manufacturerName, ABN, country, manufacturerStatus) VALUES 
('Toyota', '12345678901', 'Japan', 'Active'),
('Honda', '12345678902', 'Japan', 'Active'),
('Ford', '12345678903', 'USA', 'Active'),
('BMW', '12345678904', 'Germany', 'Active'),
('Mercedes-Benz', '12345678905', 'Germany', 'Active')
ON CONFLICT DO NOTHING;

-- Insert sample makes
INSERT INTO makes (manufacturerID, makeName) 
SELECT m.manufacturerID, 'Camry' FROM manufacturers m WHERE m.manufacturerName = 'Toyota'
UNION ALL
SELECT m.manufacturerID, 'Corolla' FROM manufacturers m WHERE m.manufacturerName = 'Toyota'
UNION ALL
SELECT m.manufacturerID, 'Civic' FROM manufacturers m WHERE m.manufacturerName = 'Honda'
UNION ALL
SELECT m.manufacturerID, 'Accord' FROM manufacturers m WHERE m.manufacturerName = 'Honda'
UNION ALL
SELECT m.manufacturerID, 'Mustang' FROM manufacturers m WHERE m.manufacturerName = 'Ford'
UNION ALL
SELECT m.manufacturerID, 'F-150' FROM manufacturers m WHERE m.manufacturerName = 'Ford'
UNION ALL
SELECT m.manufacturerID, '3 Series' FROM manufacturers m WHERE m.manufacturerName = 'BMW'
UNION ALL
SELECT m.manufacturerID, '5 Series' FROM manufacturers m WHERE m.manufacturerName = 'BMW'
UNION ALL
SELECT m.manufacturerID, 'C-Class' FROM manufacturers m WHERE m.manufacturerName = 'Mercedes-Benz'
UNION ALL
SELECT m.manufacturerID, 'E-Class' FROM manufacturers m WHERE m.manufacturerName = 'Mercedes-Benz'
ON CONFLICT DO NOTHING;

-- Insert sample vehicles
INSERT INTO vehicles (makeID, model, year, price, mileage, color, fuelType, transmission, bodyType, engineSize, doors, seats, description, imagePath, vehicleStatus) 
SELECT m.makeID, 'Camry Hybrid', 2023, 35000.00, 15000, 'Silver', 'Hybrid', 'Automatic', 'Sedan', '2.5L', 4, 5, 'Efficient hybrid sedan with excellent fuel economy', '/assets/camry.jpg', 'Available'
FROM makes m WHERE m.makeName = 'Camry'
UNION ALL
SELECT m.makeID, 'Corolla Sport', 2023, 28000.00, 12000, 'White', 'Petrol', 'Automatic', 'Sedan', '2.0L', 4, 5, 'Sporty and reliable compact sedan', '/assets/corolla.jpg', 'Available'
UNION ALL
SELECT m.makeID, 'Civic Type R', 2023, 45000.00, 8000, 'Red', 'Petrol', 'Manual', 'Hatchback', '2.0L Turbo', 4, 5, 'High-performance hatchback with racing heritage', '/assets/civic.jpg', 'Available'
UNION ALL
SELECT m.makeID, 'Accord Hybrid', 2023, 42000.00, 10000, 'Black', 'Hybrid', 'Automatic', 'Sedan', '2.0L', 4, 5, 'Luxurious hybrid sedan with premium features', '/assets/accord.jpg', 'Available'
UNION ALL
SELECT m.makeID, 'Mustang GT', 2023, 55000.00, 5000, 'Blue', 'Petrol', 'Manual', 'Coupe', '5.0L V8', 2, 4, 'Iconic American muscle car with V8 power', '/assets/mustang.jpg', 'Available'
UNION ALL
SELECT m.makeID, 'F-150 Raptor', 2023, 75000.00, 3000, 'Orange', 'Petrol', 'Automatic', 'Truck', '3.5L V6 Turbo', 4, 5, 'High-performance off-road pickup truck', '/assets/f150.jpg', 'Available'
UNION ALL
SELECT m.makeID, '330i', 2023, 48000.00, 7000, 'White', 'Petrol', 'Automatic', 'Sedan', '2.0L Turbo', 4, 5, 'Luxury sedan with sporty performance', '/assets/bmw330.jpg', 'Available'
UNION ALL
SELECT m.makeID, '530i', 2023, 65000.00, 4000, 'Black', 'Petrol', 'Automatic', 'Sedan', '2.0L Turbo', 4, 5, 'Executive sedan with premium comfort', '/assets/bmw530.jpg', 'Available'
UNION ALL
SELECT m.makeID, 'C300', 2023, 52000.00, 6000, 'Silver', 'Petrol', 'Automatic', 'Sedan', '2.0L Turbo', 4, 5, 'Luxury sedan with elegant design', '/assets/mercedes-c300.jpg', 'Available'
UNION ALL
SELECT m.makeID, 'E350', 2023, 68000.00, 2000, 'Black', 'Petrol', 'Automatic', 'Sedan', '3.0L V6', 4, 5, 'Premium executive sedan with advanced technology', '/assets/mercedes-e350.jpg', 'Available'
ON CONFLICT DO NOTHING;

-- Insert sample users (with hashed passwords)
-- Password for all test users is "password123"
INSERT INTO users (firstName, lastName, emailAddress, passwordHash, phone, streetNo, streetName, suburb, postcode, user_status) VALUES 
('John', 'Doe', 'john.doe@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0412345678', '123', 'Main Street', 'Sydney', 2000, 'Active'),
('Jane', 'Smith', 'jane.smith@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0423456789', '456', 'Oak Avenue', 'Melbourne', 3000, 'Active'),
('Admin', 'User', 'admin@autosdirect.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0434567890', '789', 'Admin Road', 'Brisbane', 4000, 'Active'),
('Manufacturer', 'User', 'manufacturer@autosdirect.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0445678901', '321', 'Factory Lane', 'Perth', 6000, 'Active')
ON CONFLICT (emailAddress) DO NOTHING;

-- Insert user roles
INSERT INTO user_roles (userID, roleID) 
SELECT u.userID, r.roleID 
FROM users u, roles r 
WHERE u.emailAddress = 'admin@autosdirect.com' AND r.roleName = 'Administrator'
UNION ALL
SELECT u.userID, r.roleID 
FROM users u, roles r 
WHERE u.emailAddress = 'manufacturer@autosdirect.com' AND r.roleName = 'Manufacturer'
UNION ALL
SELECT u.userID, r.roleID 
FROM users u, roles r 
WHERE u.emailAddress = 'john.doe@example.com' AND r.roleName = 'Customer'
UNION ALL
SELECT u.userID, r.roleID 
FROM users u, roles r 
WHERE u.emailAddress = 'jane.smith@example.com' AND r.roleName = 'Customer'
ON CONFLICT DO NOTHING;

-- Insert sample purchases
INSERT INTO purchases (userID, vehicleID, purchasePrice, paymentMethod, purchaseStatus)
SELECT u.userID, v.vehicleID, v.price, 'Credit Card', 'Completed'
FROM users u, vehicles v 
WHERE u.emailAddress = 'john.doe@example.com' AND v.model = 'Camry Hybrid'
UNION ALL
SELECT u.userID, v.vehicleID, v.price, 'Bank Transfer', 'Pending'
FROM users u, vehicles v 
WHERE u.emailAddress = 'jane.smith@example.com' AND v.model = 'Civic Type R'
ON CONFLICT DO NOTHING;

-- Insert sample test drive bookings
INSERT INTO test_drive_bookings (userID, vehicleID, bookingDate, bookingTime, status, notes)
SELECT u.userID, v.vehicleID, CURRENT_DATE + INTERVAL '7 days', '10:00:00', 'Pending', 'Interested in test driving this vehicle'
FROM users u, vehicles v 
WHERE u.emailAddress = 'john.doe@example.com' AND v.model = 'Mustang GT'
UNION ALL
SELECT u.userID, v.vehicleID, CURRENT_DATE + INTERVAL '14 days', '14:30:00', 'Approved', 'Customer confirmed for test drive'
FROM users u, vehicles v 
WHERE u.emailAddress = 'jane.smith@example.com' AND v.model = '330i'
ON CONFLICT DO NOTHING;

-- Insert sample complaints
INSERT INTO complaints (userID, subject, description, status)
SELECT u.userID, 'Vehicle Delivery Delay', 'My vehicle delivery has been delayed by 2 weeks. Please provide an update.', 'Open'
FROM users u WHERE u.emailAddress = 'john.doe@example.com'
UNION ALL
SELECT u.userID, 'Service Quality Issue', 'The service I received was not up to standard. Requesting a refund.', 'In Progress'
FROM users u WHERE u.emailAddress = 'jane.smith@example.com'
ON CONFLICT DO NOTHING;

-- Insert sample chatbot inquiries
INSERT INTO chatbot_inquiries (sessionID, customerKey, message, sender, customerEmail, customerName, customerPhone)
VALUES 
('session_001', 'customer_001', 'Hello, I am interested in purchasing a vehicle. Can you help me?', 'user', 'john.doe@example.com', 'John Doe', '0412345678'),
('session_001', 'customer_001', 'Of course! I would be happy to help you find the perfect vehicle. What type of vehicle are you looking for?', 'ai', 'john.doe@example.com', 'John Doe', '0412345678'),
('session_002', 'customer_002', 'I need information about financing options for a BMW.', 'user', 'jane.smith@example.com', 'Jane Smith', '0423456789'),
('session_002', 'customer_002', 'We offer several financing options including loans and leases. What is your budget range?', 'ai', 'jane.smith@example.com', 'Jane Smith', '0423456789')
ON CONFLICT DO NOTHING;

-- Insert sample finance requests
INSERT INTO finance_requests (userID, vehicleID, loanAmount, downPayment, loanTerm, annualIncome, employmentStatus, creditScore, status)
SELECT u.userID, v.vehicleID, 30000.00, 5000.00, 60, 80000.00, 'Full-time', 750, 'Pending'
FROM users u, vehicles v 
WHERE u.emailAddress = 'john.doe@example.com' AND v.model = 'Camry Hybrid'
UNION ALL
SELECT u.userID, v.vehicleID, 40000.00, 8000.00, 48, 95000.00, 'Full-time', 780, 'Approved'
FROM users u, vehicles v 
WHERE u.emailAddress = 'jane.smith@example.com' AND v.model = 'Civic Type R'
ON CONFLICT DO NOTHING;

-- Insert sample vehicle comparisons
INSERT INTO vehicle_comparisons (userID, vehicle1ID, vehicle2ID)
SELECT u.userID, v1.vehicleID, v2.vehicleID
FROM users u, vehicles v1, vehicles v2
WHERE u.emailAddress = 'john.doe@example.com' 
AND v1.model = 'Camry Hybrid' 
AND v2.model = 'Accord Hybrid'
ON CONFLICT DO NOTHING;

