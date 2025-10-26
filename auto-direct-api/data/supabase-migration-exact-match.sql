-- PostgreSQL Migration Script for Supabase
-- Converted from autosdirect_db21.05.sql MySQL schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (exact match to MySQL)
CREATE TABLE IF NOT EXISTS users (
  userID VARCHAR(36) PRIMARY KEY,
  firstName VARCHAR(45) NOT NULL,
  lastName VARCHAR(45) NOT NULL,
  emailAddress VARCHAR(45) UNIQUE NOT NULL,
  passwordHash VARCHAR(60) NOT NULL,
  phone VARCHAR(45) NOT NULL,
  createdTime TIMESTAMP NOT NULL DEFAULT NOW(),
  streetNo VARCHAR(45) NOT NULL,
  streetName VARCHAR(45) NOT NULL,
  suburb VARCHAR(45) NOT NULL,
  postcode INTEGER NOT NULL,
  user_status VARCHAR(10) NOT NULL DEFAULT 'Active' CHECK (user_status IN ('Active', 'Inactive'))
);

-- Employees table (exact match to MySQL)
CREATE TABLE IF NOT EXISTS employees (
  employeeID VARCHAR(36) PRIMARY KEY,
  userID VARCHAR(36) NOT NULL REFERENCES users(userID),
  title VARCHAR(45),
  department VARCHAR(45)
);

-- Manufacturers table (exact match to MySQL)
CREATE TABLE IF NOT EXISTS manufacturers (
  manufacturerID VARCHAR(36) PRIMARY KEY,
  manufacturerName VARCHAR(45) NOT NULL,
  ABN VARCHAR(45) NOT NULL,
  country VARCHAR(45) NOT NULL,
  manufacturerStatus VARCHAR(10) NOT NULL DEFAULT 'Active' CHECK (manufacturerStatus IN ('Active', 'Inactive'))
);

-- Makes table (exact match to MySQL)
CREATE TABLE IF NOT EXISTS makes (
  makeID VARCHAR(36) PRIMARY KEY,
  manufacturerID VARCHAR(36) NOT NULL REFERENCES manufacturers(manufacturerID),
  makeName VARCHAR(45) NOT NULL
);

-- Vehicles table (exact match to MySQL)
CREATE TABLE IF NOT EXISTS vehicles (
  vehicleID VARCHAR(36) PRIMARY KEY,
  makeID VARCHAR(36) NOT NULL REFERENCES makes(makeID),
  modelName VARCHAR(45) NOT NULL,
  bodyType VARCHAR(45) NOT NULL,
  fuel VARCHAR(45) NOT NULL,
  driveType VARCHAR(45) NOT NULL,
  cylinders INTEGER NOT NULL,
  doors INTEGER NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  colour VARCHAR(45) NOT NULL,
  transmission VARCHAR(45) NOT NULL,
  approvalStatus VARCHAR(20) NOT NULL DEFAULT 'Pending Approval' CHECK (approvalStatus IN ('Approved','Pending Approval','Denied')),
  deletedStatus VARCHAR(10) NOT NULL DEFAULT 'Active' CHECK (deletedStatus IN ('Active','Deleted'))
);

-- Advice requests table (exact match to MySQL)
CREATE TABLE IF NOT EXISTS advice_requests (
  requestID VARCHAR(36) PRIMARY KEY,
  requesterID VARCHAR(36) NOT NULL REFERENCES users(userID),
  employeeID VARCHAR(36) REFERENCES users(userID),
  vehicleID VARCHAR(36) NOT NULL REFERENCES vehicles(vehicleID),
  status VARCHAR(20) NOT NULL CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Cancelled')),
  description TEXT NOT NULL,
  submittedAt TIMESTAMP NOT NULL DEFAULT NOW(),
  closedAt TIMESTAMP,
  closureNotes TEXT
);

-- Dealers table (exact match to MySQL)
CREATE TABLE IF NOT EXISTS dealers (
  dealerID VARCHAR(36) PRIMARY KEY,
  manufacturerID VARCHAR(36) NOT NULL REFERENCES manufacturers(manufacturerID),
  dealerName VARCHAR(45) NOT NULL,
  address VARCHAR(255),
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6)
);

-- Bank details table (exact match to MySQL)
CREATE TABLE IF NOT EXISTS bank_details (
  detailsID VARCHAR(36) PRIMARY KEY,
  dealerID VARCHAR(36) NOT NULL REFERENCES dealers(dealerID),
  BSB VARCHAR(45) NOT NULL,
  ACC VARCHAR(45) NOT NULL
);

-- Makes images table (exact match to MySQL)
CREATE TABLE IF NOT EXISTS makes_images (
  makesImageID VARCHAR(36) PRIMARY KEY,
  makesID VARCHAR(36) NOT NULL REFERENCES makes(makeID),
  path VARCHAR(60) NOT NULL,
  uploadedAt TIMESTAMP NOT NULL
);

-- Notifications table (exact match to MySQL)
CREATE TABLE IF NOT EXISTS notifications (
  notificationID VARCHAR(36) PRIMARY KEY,
  userID VARCHAR(36) NOT NULL REFERENCES users(userID),
  status VARCHAR(10) NOT NULL CHECK (status IN ('Read', 'Unread')),
  date TIMESTAMP NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL
);

-- Purchases table (exact match to MySQL)
CREATE TABLE IF NOT EXISTS purchases (
  purchaseID VARCHAR(36) PRIMARY KEY,
  purchaserID VARCHAR(36) NOT NULL REFERENCES users(userID),
  vehicleID VARCHAR(36) NOT NULL REFERENCES vehicles(vehicleID),
  orderStatus VARCHAR(20) NOT NULL DEFAULT 'Ongoing' CHECK (orderStatus IN ('Ongoing', 'Cancelled', 'Completed')),
  orderDate TIMESTAMP NOT NULL,
  paymentStatus VARCHAR(10) NOT NULL DEFAULT 'Unpaid' CHECK (paymentStatus IN ('Unpaid', 'Paid')),
  paymentDate TIMESTAMP,
  deliveryStatus VARCHAR(20) NOT NULL DEFAULT 'Pending Delivery' CHECK (deliveryStatus IN ('Pending Delivery', 'Delivered')),
  deliveryDate TIMESTAMP,
  notes TEXT
);

-- Roles table (exact match to MySQL)
CREATE TABLE IF NOT EXISTS roles (
  roleID VARCHAR(36) PRIMARY KEY,
  label VARCHAR(45) NOT NULL
);

-- Saved vehicle table (exact match to MySQL)
CREATE TABLE IF NOT EXISTS saved_vehicle (
  savedID VARCHAR(36) PRIMARY KEY,
  userID VARCHAR(36) NOT NULL REFERENCES users(userID),
  vehicleID VARCHAR(36) NOT NULL REFERENCES vehicles(vehicleID),
  savedAt TIMESTAMP NOT NULL
);

-- Test drive bookings table (exact match to MySQL)
CREATE TABLE IF NOT EXISTS test_drive_bookings (
  bookingID VARCHAR(36) PRIMARY KEY,
  userID VARCHAR(36) NOT NULL REFERENCES users(userID),
  vehicleID VARCHAR(36) NOT NULL REFERENCES vehicles(vehicleID),
  dealerID VARCHAR(36) NOT NULL REFERENCES dealers(dealerID),
  time TIMESTAMP NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Booked', 'Completed', 'Cancelled')),
  customerNotes TEXT
);

-- User images table (exact match to MySQL)
CREATE TABLE IF NOT EXISTS user_images (
  imageID VARCHAR(36) PRIMARY KEY,
  userID VARCHAR(36) NOT NULL REFERENCES users(userID),
  uploadedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

-- User roles table (exact match to MySQL)
CREATE TABLE IF NOT EXISTS user_roles (
  userRoleID VARCHAR(36) PRIMARY KEY,
  userID VARCHAR(36) NOT NULL REFERENCES users(userID),
  roleID VARCHAR(36) NOT NULL REFERENCES roles(roleID),
  manufacturerID VARCHAR(36) REFERENCES manufacturers(manufacturerID),
  dealerID VARCHAR(36) REFERENCES dealers(dealerID)
);

-- Vehicle images table (exact match to MySQL)
CREATE TABLE IF NOT EXISTS vehicle_images (
  imageID VARCHAR(36) PRIMARY KEY,
  vehicleID VARCHAR(36) NOT NULL REFERENCES vehicles(vehicleID),
  path VARCHAR(100) NOT NULL,
  imageOrder INTEGER NOT NULL,
  altText VARCHAR(100),
  uploadedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(emailAddress);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(user_status);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(deletedStatus);
CREATE INDEX IF NOT EXISTS idx_vehicles_approval ON vehicles(approvalStatus);
CREATE INDEX IF NOT EXISTS idx_vehicles_make ON vehicles(makeID);
CREATE INDEX IF NOT EXISTS idx_purchases_purchaser ON purchases(purchaserID);
CREATE INDEX IF NOT EXISTS idx_purchases_vehicle ON purchases(vehicleID);
CREATE INDEX IF NOT EXISTS idx_test_drive_user ON test_drive_bookings(userID);
CREATE INDEX IF NOT EXISTS idx_test_drive_vehicle ON test_drive_bookings(vehicleID);
CREATE INDEX IF NOT EXISTS idx_test_drive_dealer ON test_drive_bookings(dealerID);
CREATE INDEX IF NOT EXISTS idx_advice_requester ON advice_requests(requesterID);
CREATE INDEX IF NOT EXISTS idx_advice_vehicle ON advice_requests(vehicleID);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(userID);
CREATE INDEX IF NOT EXISTS idx_saved_vehicle_user ON saved_vehicle(userID);
CREATE INDEX IF NOT EXISTS idx_saved_vehicle_vehicle ON saved_vehicle(vehicleID);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(userID);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(roleID);
CREATE INDEX IF NOT EXISTS idx_vehicle_images_vehicle ON vehicle_images(vehicleID);
CREATE INDEX IF NOT EXISTS idx_makes_images_make ON makes_images(makesID);
CREATE INDEX IF NOT EXISTS idx_user_images_user ON user_images(userID);
CREATE INDEX IF NOT EXISTS idx_dealers_manufacturer ON dealers(manufacturerID);
CREATE INDEX IF NOT EXISTS idx_bank_details_dealer ON bank_details(dealerID);
CREATE INDEX IF NOT EXISTS idx_makes_manufacturer ON makes(manufacturerID);
CREATE INDEX IF NOT EXISTS idx_employees_user ON employees(userID);
CREATE INDEX IF NOT EXISTS idx_advice_employee ON advice_requests(employeeID);
CREATE INDEX IF NOT EXISTS idx_advice_status ON advice_requests(status);
CREATE INDEX IF NOT EXISTS idx_purchases_order_status ON purchases(orderStatus);
CREATE INDEX IF NOT EXISTS idx_purchases_payment_status ON purchases(paymentStatus);
CREATE INDEX IF NOT EXISTS idx_purchases_delivery_status ON purchases(deliveryStatus);
CREATE INDEX IF NOT EXISTS idx_test_drive_status ON test_drive_bookings(status);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_manufacturers_status ON manufacturers(manufacturerStatus);
CREATE INDEX IF NOT EXISTS idx_user_roles_manufacturer ON user_roles(manufacturerID);
CREATE INDEX IF NOT EXISTS idx_user_roles_dealer ON user_roles(dealerID);

