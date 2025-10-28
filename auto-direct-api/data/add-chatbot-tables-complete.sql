-- Add complete chatbot tables for Supabase
-- Run this in Supabase SQL Editor

-- Customer inquiries table
CREATE TABLE IF NOT EXISTS customer_inquiries (
  id SERIAL PRIMARY KEY,
  customer_key VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(255),
  customer_name VARCHAR(255),
  customer_message TEXT NOT NULL,
  session_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  assigned_to VARCHAR(100),
  priority VARCHAR(20) DEFAULT 'medium',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Chatbot messages table  
CREATE TABLE IF NOT EXISTS chatbot_messages (
  id SERIAL PRIMARY KEY,
  inquiry_id INTEGER NOT NULL REFERENCES customer_inquiries(id) ON DELETE CASCADE,
  sender VARCHAR(20) NOT NULL CHECK (sender IN ('user', 'agent', 'ai')),
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_inquiries_key ON customer_inquiries(customer_key);
CREATE INDEX IF NOT EXISTS idx_customer_inquiries_session ON customer_inquiries(session_id);
CREATE INDEX IF NOT EXISTS idx_customer_inquiries_status ON customer_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_inquiry ON chatbot_messages(inquiry_id);

