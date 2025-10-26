-- Sample Data for Supabase - Using Your Actual MySQL Users
-- Run this after the corrected migration script

-- Insert manufacturers (matching your existing data)
INSERT INTO manufacturers (manufacturerID, manufacturerName, ABN, country, manufacturerStatus) VALUES 
('243e4c48-47c9-418d-9ec8-5ce7cadb3e64', 'Test', '12445', 'Test', 'Active'),
('5444c7e1-4e87-48d2-9adf-45430fa3ceb0', 'General Motors', '12345678987', 'USA', 'Active'),
('59a87656-618a-4683-9f9b-bbf61047fb87', 'Mitsubishi Motors Corporation', '29387487265', 'Japan', 'Active'),
('61332e03-d464-4db7-ae9d-1e7020bb7c47', 'Volkswagen Group', '98765432112', 'Germany', 'Active'),
('6737c344-3d52-11f0-ac84-10ffe033a959', 'Polestar Performance AB', '12345678901', 'Sweden', 'Active'),
('f9683e6c-0574-46f6-8981-e78594a324cd', 'Western Sydney University', 'Western Sydney University', '123 Test', 'Active')
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

-- Insert roles (matching your existing data)
INSERT INTO roles (roleID, roleName, description) VALUES 
('51b08f1e-7858-4f6a-8bae-22da44ad6925', 'Customer', 'Standard customer access'),
('a18e5017-31fe-4f2b-b8c9-428c53e4159f', 'Administrator', 'Full system access'),
('f717e308-64de-4a7a-a050-892221e982bf', 'Employee', 'Employee access'),
('ffa43c74-e167-428f-8095-913669af4004', 'Manufacturer', 'Vehicle management access')
ON CONFLICT (roleID) DO NOTHING;

-- Insert YOUR ACTUAL USERS from MySQL database
INSERT INTO users (userID, firstName, lastName, emailAddress, passwordHash, phone, streetNo, streetName, suburb, postcode, user_status) VALUES 
('009809e9-8958-4b19-81da-4059df3793e2', 'Amiel', 'Test', 'clementeamiel6@gmail.com.del227985', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '1234-321-211', '0', 'Default Street', 'Default Suburb', 2000, 'Inactive'),
('06128c1b-31e8-49a6-ac86-314484aae7db', 'Amiel', 'Test', 'clementeamiel6@gmail.com.del619262', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '123456', '0', 'Default Street', 'Default Suburb', 2000, 'Inactive'),
('136c3fe5-6c6e-4cb3-b5cd-e9279ccb9a20', 'Marc', 'Clemente', '22070210@student.westernsydney.edu.au', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '123445667', '0', 'Default Street', 'Default Suburb', 2000, 'Active'),
('1b5d88f8-c058-41ab-a185-e11360c5ec72', 'employee', '1', 'employee1@autosdirect.com.au', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '123456789', '123', 'employee st', 'Sydney', 2174, 'Active'),
('385196e3-49af-4dea-8d68-de6ab5ddb336', 'Ekagra', 'Prasad', 'ekagra@autosdirect.com.au', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0423698523', '1', 'Test Street', 'Sydney', 2000, 'Active'),
('3dfce01b-58fa-416f-bd93-7f086c1e1282', 'Paul', 'Miller', 'paul@autosdirect.com.au', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '123456789', '999', 'Millers Street', 'Sydney', 2000, 'Active'),
('42275d22-49f4-4232-90bb-bce2b4922c55', 'test1', 'test2', 'test@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '123', '123', 'password is 123', 'suburb', 1234, 'Active'),
('53608f0c-70ab-4220-b81b-fe3b55205065', 'cust', 'gmail', 'cus@tomer.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '123', '123', 'password is 123', 'suburb', 1235, 'Active'),
('77e1a2ef-5a0a-4ab0-a530-88a52d2a9861', 'Mitchell', 'Newbold', 'mitchell@autosdirect.com.au', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0425323281', '222', 'Test Street', 'Sydney', 2000, 'Active'),
('7e864313-37e2-41e1-9727-de5b73582b39', 'NewTest', 'User', 'newtest@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '00000000', '0', 'Default Street', 'Default Suburb', 2000, 'Active'),
('95bd5ced-4df9-4a91-b324-35270d38185a', 'Autos', 'Direct', 'autosdirect.au@gmail.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '123456789', '123', 'Default Street', 'Default Suburb', 2000, 'Active'),
('a03d021b-b496-4138-bdf4-a908b5296185', 'Amiel', 'Clemente', 'clementeamiel6@gmail.com.del477874.del775173', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '123456789', '123', 'Default Street', 'Default Suburb', 2000, 'Active'),
('b6323499-9250-4d98-b243-286b8e788a72', 'Hello', 'Test', 'hello@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '123456789', '123', 'Default Street', 'Default Suburb', 2000, 'Active'),
('b8713b3f-b86b-461f-824d-aebf9a61e87f', 'Marvis', 'Leung', 'marvis@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '123456789', '123', 'Default Street', 'Default Suburb', 2000, 'Active'),
('b9bc300b-2b94-4358-a37b-4439e211d6fc', 'Elwin', 'Ansulam', 'elwin@autosdirect.com.au', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '123456789', '123', 'Default Street', 'Default Suburb', 2000, 'Active'),
('bb7ae001-9f91-4dd6-83b5-898df44bd69e', 'Amiel', 'Test', 'clementeamiel6@gmail.com.del380192', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '123456789', '123', 'Default Street', 'Default Suburb', 2000, 'Active'),
('bcbabd5e-bc59-45dd-9b24-39e29b49c81e', 'Mitchell', 'Newbold', 'mitchell.newbold@hotmail.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '123456789', '123', 'Default Street', 'Default Suburb', 2000, 'Active'),
('c02f8a8f-af44-47e7-8dba-d140fc1c857d', 'simon', 'tang', 'simon.tang@gmail.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '123456789', '123', 'Default Street', 'Default Suburb', 2000, 'Active'),
('c5af97c3-94ca-4026-9582-a249c55a3342', 'Admin', 'Strator', 'admin@autosdirect.com.au', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '123456789', '123', 'Default Street', 'Default Suburb', 2000, 'Active'),
('c6b98e06-9385-43e3-aa10-8f2007c25948', 'Marc', 'Clemente', 'clementeamiel6@gmail.com.del873300', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '123456789', '123', 'Default Street', 'Default Suburb', 2000, 'Active'),
('82167134-5f27-49a4-bbab-96c0bd197a9e', 'Marc', 'Clemente', 'clementeamiel6@gmail.com.del573385', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '123456789', '123', 'Default Street', 'Default Suburb', 2000, 'Active'),
('857d4e08-18ed-4e6f-921c-271774ba9fa3', 'employee', '2', 'employee2@autosdirect.com.au', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '123456789', '123', 'Default Street', 'Default Suburb', 2000, 'Active')
ON CONFLICT (userID) DO NOTHING;

-- Insert YOUR ACTUAL USER ROLES from MySQL database
INSERT INTO user_roles (userID, roleID) VALUES 
('95bd5ced-4df9-4a91-b324-35270d38185a', 'ffa43c74-e167-428f-8095-913669af4004'), -- Autos Direct - Manufacturer
('136c3fe5-6c6e-4cb3-b5cd-e9279ccb9a20', 'a18e5017-31fe-4f2b-b8c9-428c53e4159f'), -- Marc Clemente - Administrator
('7e864313-37e2-41e1-9727-de5b73582b39', '51b08f1e-7858-4f6a-8bae-22da44ad6925'), -- NewTest User - Customer
('53608f0c-70ab-4220-b81b-fe3b55205065', '51b08f1e-7858-4f6a-8bae-22da44ad6925'), -- cust gmail - Customer
('009809e9-8958-4b19-81da-4059df3793e2', 'a18e5017-31fe-4f2b-b8c9-428c53e4159f'), -- Amiel Test - Administrator
('3dfce01b-58fa-416f-bd93-7f086c1e1282', 'a18e5017-31fe-4f2b-b8c9-428c53e4159f'), -- Paul Miller - Administrator
('42275d22-49f4-4232-90bb-bce2b4922c55', 'ffa43c74-e167-428f-8095-913669af4004'), -- test1 test2 - Manufacturer
('b6323499-9250-4d98-b243-286b8e788a72', 'ffa43c74-e167-428f-8095-913669af4004'), -- Hello Test - Manufacturer
('06128c1b-31e8-49a6-ac86-314484aae7db', 'a18e5017-31fe-4f2b-b8c9-428c53e4159f'), -- Amiel Test - Administrator
('c5af97c3-94ca-4026-9582-a249c55a3342', 'a18e5017-31fe-4f2b-b8c9-428c53e4159f'), -- Admin Strator - Administrator
('77e1a2ef-5a0a-4ab0-a530-88a52d2a9861', 'f717e308-64de-4a7a-a050-892221e982bf'), -- Mitchell Newbold - Employee
('c6b98e06-9385-43e3-aa10-8f2007c25948', 'a18e5017-31fe-4f2b-b8c9-428c53e4159f'), -- Marc Clemente - Administrator
('82167134-5f27-49a4-bbab-96c0bd197a9e', 'ffa43c74-e167-428f-8095-913669af4004'), -- Marc Clemente - Manufacturer
('a03d021b-b496-4138-bdf4-a908b5296185', 'ffa43c74-e167-428f-8095-913669af4004'), -- Amiel Clemente - Manufacturer
('1b5d88f8-c058-41ab-a185-e11360c5ec72', 'f717e308-64de-4a7a-a050-892221e982bf'), -- employee 1 - Employee
('385196e3-49af-4dea-8d68-de6ab5ddb336', 'f717e308-64de-4a7a-a050-892221e982bf'), -- Ekagra Prasad - Employee
('bcbabd5e-bc59-45dd-9b24-39e29b49c81e', '51b08f1e-7858-4f6a-8bae-22da44ad6925'), -- Mitchell Newbold - Customer
('b9bc300b-2b94-4358-a37b-4439e211d6fc', 'f717e308-64de-4a7a-a050-892221e982bf'), -- Elwin Ansulam - Employee
('857d4e08-18ed-4e6f-921c-271774ba9fa3', 'f717e308-64de-4a7a-a050-892221e982bf'), -- employee 2 - Employee
('c02f8a8f-af44-47e7-8dba-d140fc1c857d', 'a18e5017-31fe-4f2b-b8c9-428c53e4159f'), -- simon tang - Administrator
('b8713b3f-b86b-461f-824d-aebf9a61e87f', '51b08f1e-7858-4f6a-8bae-22da44ad6925'), -- Marvis Leung - Customer
('bb7ae001-9f91-4dd6-83b5-898df44bd69e', 'a18e5017-31fe-4f2b-b8c9-428c53e4159f')  -- Amiel Test - Administrator
ON CONFLICT (userID, roleID) DO NOTHING;

-- Insert sample purchases using your actual users
INSERT INTO purchases (purchaseID, userID, vehicleID, purchasePrice, paymentMethod, purchaseStatus) VALUES 
('purchase_001', '7e864313-37e2-41e1-9727-de5b73582b39', '146d32e0-2c1a-428c-a5d2-10ef85f592ab', 50000.00, 'Credit Card', 'Completed'), -- NewTest User bought BRZ
('purchase_002', '53608f0c-70ab-4220-b81b-fe3b55205065', '49e2b246-6b73-4155-8261-b630be438d23', 55000.00, 'Bank Transfer', 'Pending'), -- cust gmail bought Polestar 4
('purchase_003', 'b8713b3f-b86b-461f-824d-aebf9a61e87f', '5da27a98-259c-4d73-9d25-9e070c766e42', 65999.00, 'Finance', 'Approved') -- Marvis Leung bought Triton
ON CONFLICT (purchaseID) DO NOTHING;

-- Insert sample test drive bookings using your actual users
INSERT INTO test_drive_bookings (bookingID, userID, vehicleID, bookingDate, bookingTime, status, notes) VALUES 
('booking_001', 'bcbabd5e-bc59-45dd-9b24-39e29b49c81e', '8e6e3080-9f01-499f-9855-64610a3cd338', CURRENT_DATE + INTERVAL '7 days', '10:00:00', 'Pending', 'Mitchell interested in Crosstrek'),
('booking_002', 'b8713b3f-b86b-461f-824d-aebf9a61e87f', '929b5202-ee9b-478e-9d31-b60edfcfbd30', CURRENT_DATE + INTERVAL '14 days', '14:30:00', 'Approved', 'Marvis confirmed for ASX test drive'),
('booking_003', '7e864313-37e2-41e1-9727-de5b73582b39', '99841635-3ac0-4f04-8b82-27bed4a29d9a', CURRENT_DATE + INTERVAL '21 days', '16:00:00', 'Pending', 'NewTest User looking at Outback')
ON CONFLICT (bookingID) DO NOTHING;

-- Insert sample complaints using your actual users
INSERT INTO complaints (complaintID, userID, subject, description, status) VALUES 
('complaint_001', '7e864313-37e2-41e1-9727-de5b73582b39', 'Vehicle Delivery Delay', 'My vehicle delivery has been delayed by 2 weeks. Please provide an update.', 'Open'),
('complaint_002', '53608f0c-70ab-4220-b81b-fe3b55205065', 'Service Quality Issue', 'The service I received was not up to standard. Requesting a refund.', 'In Progress'),
('complaint_003', 'b8713b3f-b86b-461f-824d-aebf9a61e87f', 'Website Issue', 'The website is not loading properly on mobile devices.', 'Resolved')
ON CONFLICT (complaintID) DO NOTHING;

-- Insert sample chatbot inquiries using your actual users
INSERT INTO chatbot_inquiries (inquiryID, sessionID, customerKey, message, sender, customerEmail, customerName, customerPhone) VALUES 
('inquiry_001', 'session_001', 'customer_001', 'Hello, I am interested in purchasing a vehicle. Can you help me?', 'user', 'newtest@test.com', 'NewTest User', '00000000'),
('inquiry_002', 'session_001', 'customer_001', 'Of course! I would be happy to help you find the perfect vehicle. What type of vehicle are you looking for?', 'ai', 'newtest@test.com', 'NewTest User', '00000000'),
('inquiry_003', 'session_002', 'customer_002', 'I need information about financing options for a Mitsubishi.', 'user', 'cus@tomer.com', 'cust gmail', '123'),
('inquiry_004', 'session_002', 'customer_002', 'We offer several financing options including loans and leases. What is your budget range?', 'ai', 'cus@tomer.com', 'cust gmail', '123')
ON CONFLICT (inquiryID) DO NOTHING;

-- Insert sample finance requests using your actual users
INSERT INTO finance_requests (requestID, userID, vehicleID, loanAmount, downPayment, loanTerm, annualIncome, employmentStatus, creditScore, status) VALUES 
('finance_001', '7e864313-37e2-41e1-9727-de5b73582b39', '146d32e0-2c1a-428c-a5d2-10ef85f592ab', 30000.00, 20000.00, 60, 80000.00, 'Full-time', 750, 'Pending'),
('finance_002', '53608f0c-70ab-4220-b81b-fe3b55205065', '49e2b246-6b73-4155-8261-b630be438d23', 40000.00, 15000.00, 48, 95000.00, 'Full-time', 780, 'Approved'),
('finance_003', 'b8713b3f-b86b-461f-824d-aebf9a61e87f', '5da27a98-259c-4d73-9d25-9e070c766e42', 45000.00, 20999.00, 72, 70000.00, 'Part-time', 720, 'Under Review')
ON CONFLICT (requestID) DO NOTHING;

-- Insert sample vehicle comparisons using your actual users
INSERT INTO vehicle_comparisons (comparisonID, userID, vehicle1ID, vehicle2ID) VALUES 
('comparison_001', '7e864313-37e2-41e1-9727-de5b73582b39', '146d32e0-2c1a-428c-a5d2-10ef85f592ab', '8e6e3080-9f01-499f-9855-64610a3cd338'), -- NewTest User comparing BRZ vs Crosstrek
('comparison_002', '53608f0c-70ab-4220-b81b-fe3b55205065', '49e2b246-6b73-4155-8261-b630be438d23', 'c9095c34-ed45-4f15-a7a0-4b5537187be2'), -- cust gmail comparing Polestar 4 vs Polestar 2
('comparison_003', 'b8713b3f-b86b-461f-824d-aebf9a61e87f', '5da27a98-259c-4d73-9d25-9e070c766e42', 'c98cb7ed-b00f-4180-9ed8-a5be2cb2e8b5')  -- Marvis comparing Triton vs Pajero Sport
ON CONFLICT (comparisonID) DO NOTHING;

-- Insert sample saved vehicles using your actual users
INSERT INTO saved_vehicle (savedID, userID, vehicleID) VALUES 
('saved_001', '7e864313-37e2-41e1-9727-de5b73582b39', '146d32e0-2c1a-428c-a5d2-10ef85f592ab'), -- NewTest User saved BRZ
('saved_002', '7e864313-37e2-41e1-9727-de5b73582b39', '8e6e3080-9f01-499f-9855-64610a3cd338'), -- NewTest User saved Crosstrek
('saved_003', '53608f0c-70ab-4220-b81b-fe3b55205065', '49e2b246-6b73-4155-8261-b630be438d23'), -- cust gmail saved Polestar 4
('saved_004', 'b8713b3f-b86b-461f-824d-aebf9a61e87f', '5da27a98-259c-4d73-9d25-9e070c766e42')  -- Marvis saved Triton
ON CONFLICT (savedID) DO NOTHING;

-- Insert sample notifications using your actual users
INSERT INTO notifications (notificationID, userID, title, message, isRead) VALUES 
('notif_001', '7e864313-37e2-41e1-9727-de5b73582b39', 'Purchase Approved', 'Your purchase of the Subaru BRZ has been approved!', FALSE),
('notif_002', '53608f0c-70ab-4220-b81b-fe3b55205065', 'Test Drive Scheduled', 'Your test drive for the Mitsubishi ASX is scheduled for next week.', FALSE),
('notif_003', 'b8713b3f-b86b-461f-824d-aebf9a61e87f', 'Finance Application Update', 'Your finance application is under review.', TRUE)
ON CONFLICT (notificationID) DO NOTHING;

