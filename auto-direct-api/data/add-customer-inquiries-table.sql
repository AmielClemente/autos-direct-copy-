-- Add customer_inquiries table for chatbot
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS customer_inquiries (
  id SERIAL PRIMARY KEY,
  customer_key VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(255),
  customer_name VARCHAR(255),
  customer_message TEXT NOT NULL,
  session_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_inquiries_key ON customer_inquiries(customer_key);
CREATE INDEX IF NOT EXISTS idx_customer_inquiries_session ON customer_inquiries(session_id);

