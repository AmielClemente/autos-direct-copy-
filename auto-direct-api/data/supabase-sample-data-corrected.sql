-- Sample Data for Supabase - Matching Your MySQL Structure
-- Run this after the corrected migration script

-- Insert manufacturers (matching your existing data)
INSERT INTO manufacturers (manufacturerID, manufacturerName, ABN, country, manufacturerStatus) VALUES 
('243e4c48-47c9-418d-9ec8-5ce7cadb3e64', 'Test', '12445', 'Test', 'Active'),
('5444c7e1-4e87-48d2-9adf-45430fa3ceb0', 'General Motors', '12345678987', 'USA', 'Active'),
('59a87656-618a-4683-9f9b-bbf61047fb87', 'Mitsubishi Motors Corporation', '29387487265', 'Japan', 'Active'),
('61332e03-d464-4db7-ae9d-1e7020bb7c47', 'Volkswagen Group', '12345678901', 'Germany', 'Active'),
('6737c344-3d52-11f0-ac84-10ffe033a959', 'Polestar', '98765432109', 'Sweden', 'Active')
ON CONFLICT (manufacturerID) DO NOTHING;

-- Insert makes (matching your existing data)
INSERT INTO makes (makeID, manufacturerID, makeName) VALUES 
('017dfea5-5081-9abd-39de-1628b6de2c00', '61332e03-d464-4db7-ae9d-1e7020bb7c47', 'Volkswagen'),
('31cef30a-6d27-41af-b254-c8e1f467608f', '59a87656-618a-4683-9f9b-bbf61047fb87', 'Mitsubishi'),
('692c6fe5-7360-4fea-bda1-53198d715629', '61332e03-d464-4db7-ae9d-1e7020bb7c47', 'Subaru'),
('fd5d0bf8-5081-48dc-ba5c-18628b6e2c00', '6737c344-3d52-11f0-ac84-10ffe033a959', 'Polestar')
ON CONFLICT (makeID) DO NOTHING;

-- Insert vehicles (matching your existing data structure)
INSERT INTO vehicles (vehicleID, makeID, modelName, bodyType, fuel, driveType, cylinders, doors, description, price, colour, transmission, approvalStatus, deletedStatus) VALUES 
('146d32e0-2c1a-428c-a5d2-10ef85f592ab', '692c6fe5-7360-4fea-bda1-53198d715629', 'BRZ', 'Coupe', 'Petrol', 'Rear Wheel Drive', 4, 2, 'Subaru''s fastest car yet!', 50000.00, 'White', 'Manual', 'Approved', 'Active'),
('49e2b246-6b73-4155-8261-b630be438d23', 'fd5d0bf8-5081-48dc-ba5c-18628b6e2c00', 'Polestar 4', 'Sedan', 'Electric', '4x4', 0, 4, 'Polestar 4', 55000.00, 'Grey', 'Automatic', 'Approved', 'Active'),
('5b69b84a-d79e-44e5-8ca2-095db299cd46', '692c6fe5-7360-4fea-bda1-53198d715629', 'BRZ (Delete Example)', 'Coupe', 'Petrol', 'Rear Wheel Drive', 4, 3, 'This example is for deleting demonstration.', 40000.00, 'Black', 'Manual', 'Pending Approval', 'Active'),
('5da27a98-259c-4d73-9d25-9e070c766e42', '31cef30a-6d27-41af-b254-c8e1f467608f', 'Triton', 'Ute', 'Diesel', '4x4', 4, 4, 'A rugged vehicle for all terrains. Suitable for work and play!', 65999.00, 'Blue', 'Manual', 'Approved', 'Active'),
('6d3533bf-0bfd-49cb-a504-e11aaba355ca', '017dfea5-5081-9abd-39de-1628b6de2c00', 'Transporter T7', 'Van', 'Diesel', 'Front Wheel Drive', 4, 4, 'A well rounded people-mover.', 96990.00, 'Orange', 'Automatic', 'Approved', 'Active'),
('8e6e3080-9f01-499f-9855-64610a3cd338', '692c6fe5-7360-4fea-bda1-53198d715629', 'Crosstrek', 'SUV', 'Petrol', '4x4', 4, 5, 'A great family car that can tackle any needs.', 38990.00, 'White', 'Automatic', 'Approved', 'Active'),
('929b5202-ee9b-478e-9d31-b60edfcfbd30', '31cef30a-6d27-41af-b254-c8e1f467608f', 'ASX', 'SUV', 'Hybrid', 'Front Wheel Drive', 4, 4, 'A fantastic, compact family car.', 45000.00, 'Red', 'Automatic', 'Approved', 'Active'),
('99841635-3ac0-4f04-8b82-27bed4a29d9a', '692c6fe5-7360-4fea-bda1-53198d715629', 'Outback', 'Wagon', 'Petrol', '4x4', 4, 4, 'The perfect family car with the ability to tackle rugged terrains.', 57000.00, 'Green', 'Manual', 'Approved', 'Active'),
('ba667c72-0fcd-4a78-80bc-c593f90d2504', '31cef30a-6d27-41af-b254-c8e1f467608f', 'Mirage', 'Hatchback', 'Petrol', 'Front Wheel Drive', 3, 4, 'A compact hatchback for those who need to zip about town.', 17990.00, 'Silver', 'Automatic', 'Approved', 'Active'),
('c9095c34-ed45-4f15-a7a0-4b5537187be2', 'fd5d0bf8-5081-48dc-ba5c-18628b6e2c00', '2', 'Coupe', 'Electric', 'Rear Wheel Drive', 0, 4, 'Achieve a long trip range while remaining environmentally conscious.', 83990.00, 'Silver', 'Automatic', 'Approved', 'Active'),
('c98cb7ed-b00f-4180-9ed8-a5be2cb2e8b5', '31cef30a-6d27-41af-b254-c8e1f467608f', 'Pajero Sport', 'SUV', 'Diesel', '4x4', 6, 4, 'Info', 59000.00, 'Red', 'Automatic', 'Approved', 'Active')
ON CONFLICT (vehicleID) DO NOTHING;

-- Insert sample users (with hashed passwords - password123)
INSERT INTO users (userID, firstName, lastName, emailAddress, passwordHash, phone, streetNo, streetName, suburb, postcode, user_status) VALUES 
('user_admin_001', 'Admin', 'User', 'admin@autosdirect.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0412345678', '123', 'Admin Street', 'Sydney', 2000, 'Active'),
('user_manufacturer_001', 'Manufacturer', 'User', 'manufacturer@autosdirect.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0423456789', '456', 'Factory Road', 'Melbourne', 3000, 'Active'),
('user_customer_001', 'John', 'Doe', 'john.doe@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0434567890', '789', 'Customer Lane', 'Brisbane', 4000, 'Active'),
('user_customer_002', 'Jane', 'Smith', 'jane.smith@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0445678901', '321', 'Smith Street', 'Perth', 6000, 'Active'),
('user_customer_003', 'Bob', 'Johnson', 'bob.johnson@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0456789012', '654', 'Johnson Avenue', 'Adelaide', 5000, 'Active')
ON CONFLICT (userID) DO NOTHING;

-- Insert user roles
INSERT INTO user_roles (userID, roleID) VALUES 
('user_admin_001', 'role_admin'),
('user_manufacturer_001', 'role_manufacturer'),
('user_customer_001', 'role_customer'),
('user_customer_002', 'role_customer'),
('user_customer_003', 'role_customer')
ON CONFLICT (userID, roleID) DO NOTHING;

-- Insert sample purchases
INSERT INTO purchases (purchaseID, userID, vehicleID, purchasePrice, paymentMethod, purchaseStatus) VALUES 
('purchase_001', 'user_customer_001', '146d32e0-2c1a-428c-a5d2-10ef85f592ab', 50000.00, 'Credit Card', 'Completed'),
('purchase_002', 'user_customer_002', '49e2b246-6b73-4155-8261-b630be438d23', 55000.00, 'Bank Transfer', 'Pending'),
('purchase_003', 'user_customer_003', '5da27a98-259c-4d73-9d25-9e070c766e42', 65999.00, 'Finance', 'Approved')
ON CONFLICT (purchaseID) DO NOTHING;

-- Insert sample test drive bookings
INSERT INTO test_drive_bookings (bookingID, userID, vehicleID, bookingDate, bookingTime, status, notes) VALUES 
('booking_001', 'user_customer_001', '8e6e3080-9f01-499f-9855-64610a3cd338', CURRENT_DATE + INTERVAL '7 days', '10:00:00', 'Pending', 'Interested in test driving this SUV'),
('booking_002', 'user_customer_002', '929b5202-ee9b-478e-9d31-b60edfcfbd30', CURRENT_DATE + INTERVAL '14 days', '14:30:00', 'Approved', 'Customer confirmed for test drive'),
('booking_003', 'user_customer_003', '99841635-3ac0-4f04-8b82-27bed4a29d9a', CURRENT_DATE + INTERVAL '21 days', '16:00:00', 'Pending', 'Family looking for wagon')
ON CONFLICT (bookingID) DO NOTHING;

-- Insert sample complaints
INSERT INTO complaints (complaintID, userID, subject, description, status) VALUES 
('complaint_001', 'user_customer_001', 'Vehicle Delivery Delay', 'My vehicle delivery has been delayed by 2 weeks. Please provide an update.', 'Open'),
('complaint_002', 'user_customer_002', 'Service Quality Issue', 'The service I received was not up to standard. Requesting a refund.', 'In Progress'),
('complaint_003', 'user_customer_003', 'Website Issue', 'The website is not loading properly on mobile devices.', 'Resolved')
ON CONFLICT (complaintID) DO NOTHING;

-- Insert sample chatbot inquiries
INSERT INTO chatbot_inquiries (inquiryID, sessionID, customerKey, message, sender, customerEmail, customerName, customerPhone) VALUES 
('inquiry_001', 'session_001', 'customer_001', 'Hello, I am interested in purchasing a vehicle. Can you help me?', 'user', 'john.doe@example.com', 'John Doe', '0434567890'),
('inquiry_002', 'session_001', 'customer_001', 'Of course! I would be happy to help you find the perfect vehicle. What type of vehicle are you looking for?', 'ai', 'john.doe@example.com', 'John Doe', '0434567890'),
('inquiry_003', 'session_002', 'customer_002', 'I need information about financing options for a Mitsubishi.', 'user', 'jane.smith@example.com', 'Jane Smith', '0445678901'),
('inquiry_004', 'session_002', 'customer_002', 'We offer several financing options including loans and leases. What is your budget range?', 'ai', 'jane.smith@example.com', 'Jane Smith', '0445678901')
ON CONFLICT (inquiryID) DO NOTHING;

-- Insert sample finance requests
INSERT INTO finance_requests (requestID, userID, vehicleID, loanAmount, downPayment, loanTerm, annualIncome, employmentStatus, creditScore, status) VALUES 
('finance_001', 'user_customer_001', '146d32e0-2c1a-428c-a5d2-10ef85f592ab', 30000.00, 20000.00, 60, 80000.00, 'Full-time', 750, 'Pending'),
('finance_002', 'user_customer_002', '49e2b246-6b73-4155-8261-b630be438d23', 40000.00, 15000.00, 48, 95000.00, 'Full-time', 780, 'Approved'),
('finance_003', 'user_customer_003', '5da27a98-259c-4d73-9d25-9e070c766e42', 45000.00, 20999.00, 72, 70000.00, 'Part-time', 720, 'Under Review')
ON CONFLICT (requestID) DO NOTHING;

-- Insert sample vehicle comparisons
INSERT INTO vehicle_comparisons (comparisonID, userID, vehicle1ID, vehicle2ID) VALUES 
('comparison_001', 'user_customer_001', '146d32e0-2c1a-428c-a5d2-10ef85f592ab', '8e6e3080-9f01-499f-9855-64610a3cd338'),
('comparison_002', 'user_customer_002', '49e2b246-6b73-4155-8261-b630be438d23', 'c9095c34-ed45-4f15-a7a0-4b5537187be2'),
('comparison_003', 'user_customer_003', '5da27a98-259c-4d73-9d25-9e070c766e42', 'c98cb7ed-b00f-4180-9ed8-a5be2cb2e8b5')
ON CONFLICT (comparisonID) DO NOTHING;

-- Insert sample saved vehicles
INSERT INTO saved_vehicle (savedID, userID, vehicleID) VALUES 
('saved_001', 'user_customer_001', '146d32e0-2c1a-428c-a5d2-10ef85f592ab'),
('saved_002', 'user_customer_001', '8e6e3080-9f01-499f-9855-64610a3cd338'),
('saved_003', 'user_customer_002', '49e2b246-6b73-4155-8261-b630be438d23'),
('saved_004', 'user_customer_003', '5da27a98-259c-4d73-9d25-9e070c766e42')
ON CONFLICT (savedID) DO NOTHING;

-- Insert sample notifications
INSERT INTO notifications (notificationID, userID, title, message, isRead) VALUES 
('notif_001', 'user_customer_001', 'Purchase Approved', 'Your purchase of the Subaru BRZ has been approved!', FALSE),
('notif_002', 'user_customer_002', 'Test Drive Scheduled', 'Your test drive for the Mitsubishi ASX is scheduled for next week.', FALSE),
('notif_003', 'user_customer_003', 'Finance Application Update', 'Your finance application is under review.', TRUE)
ON CONFLICT (notificationID) DO NOTHING;

