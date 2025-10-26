-- PostgreSQL Migration Script for Supabase
-- Converted from MySQL schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  userID UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  employeeID UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  userID UUID NOT NULL REFERENCES users(userID),
  title VARCHAR(45),
  department VARCHAR(45)
);

-- Manufacturers table
CREATE TABLE IF NOT EXISTS manufacturers (
  manufacturerID UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  manufacturerName VARCHAR(45) NOT NULL,
  ABN VARCHAR(45) NOT NULL,
  country VARCHAR(45) NOT NULL,
  manufacturerStatus VARCHAR(10) NOT NULL DEFAULT 'Active' CHECK (manufacturerStatus IN ('Active', 'Inactive'))
);

-- Makes table
CREATE TABLE IF NOT EXISTS makes (
  makeID UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  manufacturerID UUID NOT NULL REFERENCES manufacturers(manufacturerID),
  makeName VARCHAR(45) NOT NULL
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  vehicleID UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  makeID UUID NOT NULL REFERENCES makes(makeID),
  model VARCHAR(45) NOT NULL,
  year INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  mileage INTEGER NOT NULL,
  color VARCHAR(45) NOT NULL,
  fuelType VARCHAR(45) NOT NULL,
  transmission VARCHAR(45) NOT NULL,
  bodyType VARCHAR(45) NOT NULL,
  engineSize VARCHAR(45) NOT NULL,
  doors INTEGER NOT NULL,
  seats INTEGER NOT NULL,
  description TEXT,
  imagePath VARCHAR(255),
  vehicleStatus VARCHAR(10) NOT NULL DEFAULT 'Available' CHECK (vehicleStatus IN ('Available', 'Sold', 'Reserved')),
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  roleID UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  roleName VARCHAR(45) NOT NULL UNIQUE,
  description TEXT
);

-- User roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
  userID UUID NOT NULL REFERENCES users(userID),
  roleID UUID NOT NULL REFERENCES roles(roleID),
  PRIMARY KEY (userID, roleID)
);

-- Purchases table
CREATE TABLE IF NOT EXISTS purchases (
  purchaseID UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  userID UUID NOT NULL REFERENCES users(userID),
  vehicleID UUID NOT NULL REFERENCES vehicles(vehicleID),
  purchaseDate TIMESTAMP NOT NULL DEFAULT NOW(),
  purchasePrice DECIMAL(10,2) NOT NULL,
  paymentMethod VARCHAR(45) NOT NULL,
  purchaseStatus VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (purchaseStatus IN ('Pending', 'Approved', 'Rejected', 'Completed'))
);

-- Test drive bookings table
CREATE TABLE IF NOT EXISTS test_drive_bookings (
  bookingID UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  userID UUID NOT NULL REFERENCES users(userID),
  vehicleID UUID NOT NULL REFERENCES vehicles(vehicleID),
  bookingDate DATE NOT NULL,
  bookingTime TIME NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Completed')),
  notes TEXT,
  createdAt TIMESTAMP DEFAULT NOW()
);

-- Complaints table
CREATE TABLE IF NOT EXISTS complaints (
  complaintID UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  userID UUID NOT NULL REFERENCES users(userID),
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

-- Chatbot inquiries table
CREATE TABLE IF NOT EXISTS chatbot_inquiries (
  inquiryID UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  requestID UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  userID UUID NOT NULL REFERENCES users(userID),
  vehicleID UUID NOT NULL REFERENCES vehicles(vehicleID),
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
  comparisonID UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  userID UUID NOT NULL REFERENCES users(userID),
  vehicle1ID UUID NOT NULL REFERENCES vehicles(vehicleID),
  vehicle2ID UUID NOT NULL REFERENCES vehicles(vehicleID),
  createdAt TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(emailAddress);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(user_status);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(vehicleStatus);
CREATE INDEX IF NOT EXISTS idx_vehicles_make ON vehicles(makeID);
CREATE INDEX IF NOT EXISTS idx_purchases_user ON purchases(userID);
CREATE INDEX IF NOT EXISTS idx_purchases_vehicle ON purchases(vehicleID);
CREATE INDEX IF NOT EXISTS idx_test_drive_user ON test_drive_bookings(userID);
CREATE INDEX IF NOT EXISTS idx_test_drive_vehicle ON test_drive_bookings(vehicleID);
CREATE INDEX IF NOT EXISTS idx_chatbot_session ON chatbot_inquiries(sessionID);

-- Insert default roles
INSERT INTO roles (roleName, description) VALUES 
('Administrator', 'Full system access'),
('Manufacturer', 'Vehicle management access'),
('Customer', 'Standard customer access')
ON CONFLICT (roleName) DO NOTHING;

