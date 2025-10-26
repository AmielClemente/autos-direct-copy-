-- PostgreSQL Migration Script for Supabase
-- Converted from existing MySQL schema with actual data

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (matches your MySQL structure)
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

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
  employeeID VARCHAR(36) PRIMARY KEY,
  userID VARCHAR(36) NOT NULL REFERENCES users(userID),
  title VARCHAR(45),
  department VARCHAR(45)
);

-- Manufacturers table (matches your MySQL structure)
CREATE TABLE IF NOT EXISTS manufacturers (
  manufacturerID VARCHAR(36) PRIMARY KEY,
  manufacturerName VARCHAR(45) NOT NULL,
  ABN VARCHAR(45) NOT NULL,
  country VARCHAR(45) NOT NULL,
  manufacturerStatus VARCHAR(10) NOT NULL DEFAULT 'Active' CHECK (manufacturerStatus IN ('Active', 'Inactive'))
);

-- Makes table (matches your MySQL structure)
CREATE TABLE IF NOT EXISTS makes (
  makeID VARCHAR(36) PRIMARY KEY,
  manufacturerID VARCHAR(36) NOT NULL REFERENCES manufacturers(manufacturerID),
  makeName VARCHAR(45) NOT NULL
);

-- Vehicles table (matches your MySQL structure exactly)
CREATE TABLE IF NOT EXISTS vehicles (
  vehicleID VARCHAR(36) PRIMARY KEY,
  makeID VARCHAR(36) NOT NULL REFERENCES makes(makeID),
  modelName VARCHAR(45) NOT NULL,
  bodyType VARCHAR(45) NOT NULL,
  fuel VARCHAR(45) NOT NULL,
  driveType VARCHAR(45) NOT NULL,
  cylinders INTEGER NOT NULL,
  doors INTEGER NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  colour VARCHAR(45) NOT NULL,
  transmission VARCHAR(45) NOT NULL,
  approvalStatus VARCHAR(20) NOT NULL DEFAULT 'Pending Approval' CHECK (approvalStatus IN ('Approved','Pending Approval','Denied')),
  deletedStatus VARCHAR(10) NOT NULL DEFAULT 'Active' CHECK (deletedStatus IN ('Active','Deleted'))
);

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  roleID VARCHAR(36) PRIMARY KEY,
  roleName VARCHAR(45) NOT NULL UNIQUE,
  description TEXT
);

-- User roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
  userID VARCHAR(36) NOT NULL REFERENCES users(userID),
  roleID VARCHAR(36) NOT NULL REFERENCES roles(roleID),
  PRIMARY KEY (userID, roleID)
);

-- Purchases table
CREATE TABLE IF NOT EXISTS purchases (
  purchaseID VARCHAR(36) PRIMARY KEY,
  userID VARCHAR(36) NOT NULL REFERENCES users(userID),
  vehicleID VARCHAR(36) NOT NULL REFERENCES vehicles(vehicleID),
  purchaseDate TIMESTAMP NOT NULL DEFAULT NOW(),
  purchasePrice DECIMAL(10,2) NOT NULL,
  paymentMethod VARCHAR(45) NOT NULL,
  purchaseStatus VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (purchaseStatus IN ('Pending', 'Approved', 'Rejected', 'Completed'))
);

-- Test drive bookings table
CREATE TABLE IF NOT EXISTS test_drive_bookings (
  bookingID VARCHAR(36) PRIMARY KEY,
  userID VARCHAR(36) NOT NULL REFERENCES users(userID),
  vehicleID VARCHAR(36) NOT NULL REFERENCES vehicles(vehicleID),
  bookingDate DATE NOT NULL,
  bookingTime TIME NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Completed')),
  notes TEXT,
  createdAt TIMESTAMP DEFAULT NOW()
);

-- Complaints table
CREATE TABLE IF NOT EXISTS complaints (
  complaintID VARCHAR(36) PRIMARY KEY,
  userID VARCHAR(36) NOT NULL REFERENCES users(userID),
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

-- Chatbot inquiries table
CREATE TABLE IF NOT EXISTS chatbot_inquiries (
  inquiryID VARCHAR(36) PRIMARY KEY,
  sessionID VARCHAR(255) NOT NULL,
  customerKey VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  sender VARCHAR(10) NOT NULL CHECK (sender IN ('user', 'ai', 'agent')),
  timestamp TIMESTAMP DEFAULT NOW(),
  customerEmail VARCHAR(255),
  customerName VARCHAR(255),
  customerPhone VARCHAR(255)
);

-- Finance requests table
CREATE TABLE IF NOT EXISTS finance_requests (
  requestID VARCHAR(36) PRIMARY KEY,
  userID VARCHAR(36) NOT NULL REFERENCES users(userID),
  vehicleID VARCHAR(36) NOT NULL REFERENCES vehicles(vehicleID),
  loanAmount DECIMAL(10,2) NOT NULL,
  downPayment DECIMAL(10,2) NOT NULL,
  loanTerm INTEGER NOT NULL,
  annualIncome DECIMAL(10,2) NOT NULL,
  employmentStatus VARCHAR(45) NOT NULL,
  creditScore INTEGER,
  status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Under Review')),
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

-- Vehicle comparisons table
CREATE TABLE IF NOT EXISTS vehicle_comparisons (
  comparisonID VARCHAR(36) PRIMARY KEY,
  userID VARCHAR(36) NOT NULL REFERENCES users(userID),
  vehicle1ID VARCHAR(36) NOT NULL REFERENCES vehicles(vehicleID),
  vehicle2ID VARCHAR(36) NOT NULL REFERENCES vehicles(vehicleID),
  createdAt TIMESTAMP DEFAULT NOW()
);

-- Additional tables from your MySQL database
CREATE TABLE IF NOT EXISTS advice_requests (
  requestID VARCHAR(36) PRIMARY KEY,
  userID VARCHAR(36) NOT NULL REFERENCES users(userID),
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Open',
  createdAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bank_details (
  bankID VARCHAR(36) PRIMARY KEY,
  userID VARCHAR(36) NOT NULL REFERENCES users(userID),
  bankName VARCHAR(100) NOT NULL,
  accountNumber VARCHAR(50) NOT NULL,
  routingNumber VARCHAR(50),
  createdAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chatbot_messages (
  messageID VARCHAR(36) PRIMARY KEY,
  sessionID VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  sender VARCHAR(10) NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_inquiries (
  inquiryID VARCHAR(36) PRIMARY KEY,
  userID VARCHAR(36) NOT NULL REFERENCES users(userID),
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Open',
  createdAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dealers (
  dealerID VARCHAR(36) PRIMARY KEY,
  dealerName VARCHAR(100) NOT NULL,
  location VARCHAR(255) NOT NULL,
  contactInfo VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Active',
  createdAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS makes_images (
  imageID VARCHAR(36) PRIMARY KEY,
  makeID VARCHAR(36) NOT NULL REFERENCES makes(makeID),
  imagePath VARCHAR(255) NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  notificationID VARCHAR(36) PRIMARY KEY,
  userID VARCHAR(36) NOT NULL REFERENCES users(userID),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  isRead BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS registration_tokens (
  tokenID VARCHAR(36) PRIMARY KEY,
  userID VARCHAR(36) NOT NULL REFERENCES users(userID),
  token VARCHAR(255) NOT NULL,
  expiresAt TIMESTAMP NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saved_vehicle (
  savedID VARCHAR(36) PRIMARY KEY,
  userID VARCHAR(36) NOT NULL REFERENCES users(userID),
  vehicleID VARCHAR(36) NOT NULL REFERENCES vehicles(vehicleID),
  savedAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_images (
  imageID VARCHAR(36) PRIMARY KEY,
  userID VARCHAR(36) NOT NULL REFERENCES users(userID),
  imagePath VARCHAR(255) NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicle_images (
  imageID VARCHAR(36) PRIMARY KEY,
  vehicleID VARCHAR(36) NOT NULL REFERENCES vehicles(vehicleID),
  imagePath VARCHAR(255) NOT NULL,
  isMain BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(emailAddress);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(user_status);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(deletedStatus);
CREATE INDEX IF NOT EXISTS idx_vehicles_approval ON vehicles(approvalStatus);
CREATE INDEX IF NOT EXISTS idx_vehicles_make ON vehicles(makeID);
CREATE INDEX IF NOT EXISTS idx_purchases_user ON purchases(userID);
CREATE INDEX IF NOT EXISTS idx_purchases_vehicle ON purchases(vehicleID);
CREATE INDEX IF NOT EXISTS idx_test_drive_user ON test_drive_bookings(userID);
CREATE INDEX IF NOT EXISTS idx_test_drive_vehicle ON test_drive_bookings(vehicleID);
CREATE INDEX IF NOT EXISTS idx_chatbot_session ON chatbot_inquiries(sessionID);

-- Insert default roles
INSERT INTO roles (roleID, roleName, description) VALUES 
('role_admin', 'Administrator', 'Full system access'),
('role_manufacturer', 'Manufacturer', 'Vehicle management access'),
('role_customer', 'Customer', 'Standard customer access')
ON CONFLICT (roleID) DO NOTHING;

