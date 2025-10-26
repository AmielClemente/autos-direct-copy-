const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { supabaseConfig } = require('../config/supabaseConfig.js');

// Initialize Supabase client
const supabase = supabaseConfig.url && supabaseConfig.serviceRoleKey 
  ? createClient(supabaseConfig.url, supabaseConfig.serviceRoleKey)
  : null;

// Helper function to generate session ID
const generateSessionId = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Helper function to generate customer key from email/phone
const generateCustomerKey = (email, phone, sessionId) => {
  // Generate completely unique customer keys per browser session
  // Use sessionId as the primary identifier to ensure absolute uniqueness
  // Contact info is secondary and doesn't affect key uniqueness
  const identifier = `session_${sessionId}`;
  return crypto.createHash('sha256').update(identifier).digest('hex');
};

// Helper function to check if it's business hours (9 AM - 5 PM, Monday-Friday)
const isBusinessHours = () => {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const hour = now.getHours();
  
  // Monday to Friday (1-5), 9 AM to 5 PM (9-17)
  return day >= 1 && day <= 5 && hour >= 9 && hour < 17;
};

// Helper function to generate AI response based on common questions
const generateAIResponse = (message) => {
  const lowerMessage = message.toLowerCase();
  
  // Greeting responses
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return "Hello! Welcome to Auto Direct. I'm here to help you with information about our vehicles, services, and more. How can I assist you today?";
  }
  
  // Vehicle availability questions
  if (lowerMessage.includes('car') || lowerMessage.includes('vehicle') || lowerMessage.includes('available')) {
    return "We have a wide selection of vehicles available! You can browse our inventory on our website or visit our showroom. What type of vehicle are you looking for? (SUV, sedan, hatchback, etc.)";
  }
  
  // Pricing questions
  if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('how much')) {
    return "Our pricing varies depending on the vehicle model, year, and features. I'd be happy to help you find pricing for specific vehicles. Which vehicle are you interested in?";
  }
  
  // Test drive questions
  if (lowerMessage.includes('test drive') || lowerMessage.includes('drive test')) {
    return "Test drives are available! You can schedule a test drive by visiting our website or calling us. What vehicle would you like to test drive?";
  }
  
  // Financing questions
  if (lowerMessage.includes('finance') || lowerMessage.includes('loan') || lowerMessage.includes('payment')) {
    return "We offer various financing options to help you purchase your vehicle. Our finance team can work with you to find the best rates and terms. Would you like to speak with our finance department?";
  }
  
  // Service questions
  if (lowerMessage.includes('service') || lowerMessage.includes('repair') || lowerMessage.includes('maintenance')) {
    return "We provide comprehensive vehicle service and maintenance. Our service center is equipped to handle all your vehicle needs. What type of service are you looking for?";
  }
  
  // Hours questions
  if (lowerMessage.includes('hours') || lowerMessage.includes('open') || lowerMessage.includes('time')) {
    return "Our business hours are Monday to Friday, 9 AM to 5 PM. We're closed on weekends. Is there anything specific you'd like to know about our services?";
  }
  
  // Location questions
  if (lowerMessage.includes('location') || lowerMessage.includes('address') || lowerMessage.includes('where')) {
    return "You can find us at our main showroom location. For specific directions and contact information, please visit our website or give us a call during business hours.";
  }
  
  // Default response for complex questions
  return "I understand you're looking for help with that. For more detailed assistance, I'll connect you with our customer service team who can provide personalized support. Please hold on while I transfer you.";
};

// POST /api/chatbot/register - Register user before starting chat
router.post('/register', async (req, res) => {
  try {
    const { customerName, customerEmail, customerPhone } = req.body;
    
    // All fields are now optional - no validation required
    // Generate session and customer identifiers even without contact info
    const sessionId = generateSessionId();
    const customerKey = generateCustomerKey(customerEmail, customerPhone, sessionId);

    // Use Supabase
    if (!supabase) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    // Check if customer already exists
    const { data: existingCustomers, error: selectError } = await supabase
      .from('customer_inquiries')
      .select('id, session_id')
      .eq('customer_key', customerKey)
      .order('created_at', { ascending: false })
      .limit(1);

    if (selectError) {
      console.error('Error checking existing customer:', selectError);
      return res.status(500).json({ error: 'Database error' });
    }

    if (existingCustomers && existingCustomers.length > 0) {
      // Customer exists, return existing session
      res.json({
        success: true,
        sessionId: existingCustomers[0].session_id,
        customerKey: customerKey,
        message: 'Welcome back!'
      });
    } else {
      // New customer, create initial inquiry record
      const { data: newInquiry, error: insertError } = await supabase
        .from('customer_inquiries')
        .insert({
          customer_message: `Customer ${customerName || 'Anonymous'} started a new conversation`,
          customer_email: customerEmail || null,
          customer_phone: customerPhone || null,
          session_id: sessionId,
          customer_key: customerKey,
          status: 'pending'
        })
        .select();

      if (insertError) {
        console.error('Error creating customer inquiry:', insertError);
        return res.status(500).json({ error: 'Failed to create customer record' });
      }

      res.json({
        success: true,
        sessionId: sessionId,
        customerKey: customerKey,
        inquiryId: newInquiry[0].id,
        message: 'Registration successful! You can now start chatting.'
      });
    }

  } catch (error) {
    console.error('Error in register endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/chatbot/message - Send a message in a conversation
router.post('/message', async (req, res) => {
  try {
    const { sessionId, customerKey, message, sender = 'user', customerEmail, customerName, customerPhone } = req.body;
    
    if (!sessionId || !message) {
      return res.status(400).json({ error: 'Session ID and message are required' });
    }

    if (!supabase) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    // Find inquiry for this session
    const { data: inquiries, error: findError } = await supabase
      .from('customer_inquiries')
      .select('id')
      .eq('session_id', sessionId)
      .eq('customer_key', customerKey)
      .order('created_at', { ascending: false })
      .limit(1);

    if (findError) {
      console.error('Error finding inquiry:', findError);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!inquiries || inquiries.length === 0) {
      return res.status(404).json({ error: 'Session not found. Please register first.' });
    }

    const inquiryId = inquiries[0].id;

    // Update customer information if provided (for user messages)
    if (sender === 'user' && (customerEmail || customerPhone)) {
      const updateData = {};
      if (customerEmail) updateData.customer_email = customerEmail;
      if (customerPhone) updateData.customer_phone = customerPhone;
      
      await supabase
        .from('customer_inquiries')
        .update(updateData)
        .eq('id', inquiryId);
    }

    // Insert message into chatbot_messages table
    const { data: newMessage, error: insertError } = await supabase
      .from('chatbot_messages')
      .insert({
        inquiry_id: inquiryId,
        sender: sender,
        message: message
      })
      .select();

    if (insertError) {
      console.error('Error inserting message:', insertError);
      return res.status(500).json({ error: 'Failed to save message' });
    }

    const messageId = newMessage[0].id;

    // Generate AI response if it's a user message
    if (sender === 'user') {
      const aiResponse = generateAIResponse(message);
      const needsHumanAgent = aiResponse.includes('connect you with our customer service team');
      
      // Insert AI response as a message
      await supabase
        .from('chatbot_messages')
        .insert({
          inquiry_id: inquiryId,
          sender: 'ai',
          message: aiResponse
        });
      
      // Update inquiry status
      const newStatus = needsHumanAgent ? 'pending' : 'ai_handled';
      await supabase
        .from('customer_inquiries')
        .update({ status: newStatus })
        .eq('id', inquiryId);
      
      // Emit real-time update
      const io = req.app.get('io');
      if (io) {
        io.emit('customer_message', {
          inquiryId: inquiryId,
          message: message,
          timestamp: new Date().toISOString()
        });
      }
      
      res.json({
        success: true,
        messageId: messageId,
        inquiryId: inquiryId,
        aiResponse: aiResponse,
        needsHumanAgent: needsHumanAgent
      });
    } else {
      // Handle non-user messages
      const newStatus = sender === 'user' ? 'pending' : 'responded';
      
      await supabase
        .from('customer_inquiries')
        .update({ status: newStatus })
        .eq('id', inquiryId);
      
      // Emit real-time update for customer messages
      const io = req.app.get('io');
      if (io && sender === 'user') {
        io.emit('customer_message', {
          inquiryId: inquiryId,
          message: message,
          timestamp: new Date().toISOString()
        });
      }
      
      res.json({
        success: true,
        messageId: messageId,
        inquiryId: inquiryId
      });
    }

  } catch (error) {
    console.error('Error in message endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/chatbot/inquiries - Get all inquiries for admin dashboard
router.get('/inquiries', async (req, res) => {
  try {
    const query = `
      SELECT 
        ci.id,
        ci.customer_message,
        ci.customer_email,
        ci.customer_phone,
        ci.status,
        ci.created_at,
        ci.updated_at,
        ci.session_id,
        ci.customer_key,
        ci.assigned_to,
        ci.priority,
        COUNT(cm.id) as message_count,
        MAX(cm.created_at) as last_message_time
      FROM customer_inquiries ci
      LEFT JOIN chatbot_messages cm ON ci.id = cm.inquiry_id
      GROUP BY ci.id
      ORDER BY ci.created_at DESC
    `;
    
    pool.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching inquiries:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({ inquiries: results });
    });

  } catch (error) {
    console.error('Error in inquiries endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/chatbot/my-inquiries - Get inquiries for a specific customer
router.get('/my-inquiries', async (req, res) => {
  try {
    const { customerKey } = req.query;
    
    if (!customerKey) {
      return res.status(400).json({ error: 'Customer key is required' });
    }

    const query = `
      SELECT 
        ci.id,
        ci.customer_message,
        ci.customer_email,
        ci.customer_phone,
        ci.status,
        ci.created_at,
        ci.updated_at,
        ci.session_id,
        ci.customer_key,
        ci.assigned_to,
        ci.priority,
        COUNT(cm.id) as message_count,
        MAX(cm.created_at) as last_message_time
      FROM customer_inquiries ci
      LEFT JOIN chatbot_messages cm ON ci.id = cm.inquiry_id
      WHERE ci.customer_key = ?
      GROUP BY ci.id
      ORDER BY ci.created_at DESC
    `;
    
    pool.query(query, [customerKey], (err, results) => {
      if (err) {
        console.error('Error fetching customer inquiries:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({ inquiries: results });
    });

  } catch (error) {
    console.error('Error in my-inquiries endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/chatbot/messages/:inquiryId - Get all messages for a specific inquiry
router.get('/messages/:inquiryId', async (req, res) => {
  try {
    const { inquiryId } = req.params;
    
    const query = `
      SELECT 
        cm.id,
        cm.sender,
        cm.message,
        cm.created_at,
        ci.customer_email,
        ci.customer_phone
      FROM chatbot_messages cm
      JOIN customer_inquiries ci ON cm.inquiry_id = ci.id
      WHERE cm.inquiry_id = ?
      ORDER BY cm.created_at ASC
    `;
    
    pool.query(query, [inquiryId], (err, results) => {
      if (err) {
        console.error('Error fetching messages:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({ messages: results });
    });

  } catch (error) {
    console.error('Error in messages endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/chatbot/reply - Send a reply from customer service agent
router.post('/reply', async (req, res) => {
  try {
    const { id: inquiryId, sessionId, replyText } = req.body;
    
    console.log('Reply endpoint called with:', { inquiryId, sessionId, replyText });
    
    if (!inquiryId || !replyText) {
      console.log('Missing required fields:', { inquiryId: !!inquiryId, replyText: !!replyText });
      return res.status(400).json({ error: 'Inquiry ID and reply text are required' });
    }

    // Insert agent reply as a message
    const insertMessageQuery = `
      INSERT INTO chatbot_messages (inquiry_id, sender, message, created_at)
      VALUES (?, 'agent', ?, NOW())
    `;
    
    pool.query(insertMessageQuery, [inquiryId, replyText], (err, result) => {
      if (err) {
        console.error('Error inserting agent reply:', err);
        return res.status(500).json({ error: 'Failed to send reply' });
      }

      // Update inquiry status
      const updateInquiryQuery = `
        UPDATE customer_inquiries 
        SET status = 'responded', updated_at = NOW()
        WHERE id = ?
      `;
      
      pool.query(updateInquiryQuery, [inquiryId], (err) => {
        if (err) {
          console.error('Error updating inquiry status:', err);
        }

        // Emit real-time update via Socket.IO
        const io = req.app.get('io');
        if (io && sessionId) {
          const eventData = {
            inquiryId: inquiryId,
            message: replyText,
            timestamp: new Date().toISOString()
          };
          
          console.log('Emitting agent_reply to session room:', sessionId, 'with data:', eventData);
          
          // Emit to the specific session room AND broadcast to all clients
          io.to(sessionId).emit('agent_reply', eventData);
          // Also emit to all clients for admin dashboard updates
          io.emit('agent_reply', eventData);
          
          console.log('Agent reply emitted successfully');
        } else {
          console.log('Socket.IO not available or sessionId missing:', { io: !!io, sessionId });
        }
        
        res.json({
          success: true,
          messageId: result.insertId
        });
      });
    });

  } catch (error) {
    console.error('Error in reply endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/chatbot/assign - Assign inquiry to an agent
router.put('/assign', async (req, res) => {
  try {
    const { id: inquiryId, agent } = req.body;
    
    if (!inquiryId || !agent) {
      return res.status(400).json({ error: 'Inquiry ID and agent are required' });
    }

    const query = `
      UPDATE customer_inquiries 
      SET assigned_to = ?, updated_at = NOW()
      WHERE id = ?
    `;
    
    pool.query(query, [agent, inquiryId], (err, result) => {
      if (err) {
        console.error('Error assigning inquiry:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Inquiry not found' });
      }
      
      res.json({ success: true, message: 'Inquiry assigned successfully' });
    });

  } catch (error) {
    console.error('Error in assign endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/chatbot/unassign - Unassign inquiry from agent
router.put('/unassign', async (req, res) => {
  try {
    const { id: inquiryId } = req.body;
    
    if (!inquiryId) {
      return res.status(400).json({ error: 'Inquiry ID is required' });
    }

    const query = `
      UPDATE customer_inquiries 
      SET assigned_to = NULL, updated_at = NOW()
      WHERE id = ?
    `;
    
    pool.query(query, [inquiryId], (err, result) => {
      if (err) {
        console.error('Error unassigning inquiry:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Inquiry not found' });
      }
      
      res.json({ success: true, message: 'Inquiry unassigned successfully' });
    });

  } catch (error) {
    console.error('Error in unassign endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/chatbot/status - Update inquiry status
router.put('/status', async (req, res) => {
  try {
    const { id: inquiryId, status } = req.body;
    
    if (!inquiryId || !status) {
      return res.status(400).json({ error: 'Inquiry ID and status are required' });
    }

    const validStatuses = ['pending', 'ai_handled', 'responded', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const query = `
      UPDATE customer_inquiries 
      SET status = ?, updated_at = NOW()
      WHERE id = ?
    `;
    
    pool.query(query, [status, inquiryId], (err, result) => {
      if (err) {
        console.error('Error updating status:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Inquiry not found' });
      }
      
      res.json({ success: true, message: 'Status updated successfully' });
    });

  } catch (error) {
    console.error('Error in status endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/chatbot/after-hours-inquiry - Handle after-hours inquiries
router.post('/after-hours-inquiry', async (req, res) => {
  try {
    const { customerName, customerEmail, customerPhone, message, inquiryType } = req.body;
    
    // Validate required fields
    if (!customerName || !message) {
      return res.status(400).json({ 
        error: 'Name and message are required' 
      });
    }

    // Create after-hours inquiry record
    const createInquiryQuery = `
      INSERT INTO customer_inquiries 
      (customer_message, customer_email, customer_phone, status, created_at, priority)
      VALUES (?, ?, ?, 'after_hours', NOW(), 'low')
    `;
    
    pool.query(createInquiryQuery, [
      `After-hours inquiry: ${message}`,
      customerEmail,
      customerPhone
    ], (err, result) => {
      if (err) {
        console.error('Error creating after-hours inquiry:', err);
        return res.status(500).json({ error: 'Failed to create inquiry' });
      }

      res.json({
        success: true,
        inquiryId: result.insertId,
        message: 'Your inquiry has been submitted. We will get back to you during business hours.'
      });
    });

  } catch (error) {
    console.error('Error in after-hours inquiry endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/chatbot/business-hours - Check if it's business hours
router.get('/business-hours', (req, res) => {
  const isOpen = isBusinessHours();
  const now = new Date();
  
  res.json({
    isBusinessHours: isOpen,
    currentTime: now.toISOString(),
    message: isOpen 
      ? 'We are currently open for business.' 
      : 'Our customer service is currently closed and will be back Monday to Friday, 9 AM to 5 PM. For any concerns, please fill out our contact form and we will get back to you during business hours.'
  });
});

// Test route to verify DELETE method works
router.delete('/test-delete', (req, res) => {
  console.log('Test DELETE route hit');
  res.json({ success: true, message: 'DELETE method works' });
});

// DELETE /api/chatbot/messages/:messageId - Delete a specific message
router.delete('/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    
    console.log('Delete message request received for ID:', messageId);
    console.log('Request URL:', req.url);
    console.log('Request method:', req.method);
    console.log('Request params:', req.params);
    
    if (!messageId) {
      console.log('No message ID provided');
      return res.status(400).json({ error: 'Message ID is required' });
    }

    const query = `
      DELETE FROM chatbot_messages 
      WHERE id = ?
    `;
    
    console.log('Executing delete query:', query, 'with ID:', messageId);
    
    pool.query(query, [messageId], (err, result) => {
      if (err) {
        console.error('Error deleting message:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      console.log('Delete result:', result);
      
      if (result.affectedRows === 0) {
        console.log('No rows affected - message not found');
        return res.status(404).json({ error: 'Message not found' });
      }
      
      console.log('Message deleted successfully');
      res.json({ success: true, message: 'Message deleted successfully' });
    });

  } catch (error) {
    console.error('Error in delete message endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/chatbot/inquiries/:inquiryId - Delete an entire inquiry and all its messages
router.delete('/inquiries/:inquiryId', async (req, res) => {
  try {
    const { inquiryId } = req.params;
    
    console.log('Delete inquiry request received for ID:', inquiryId);
    
    if (!inquiryId) {
      console.log('No inquiry ID provided');
      return res.status(400).json({ error: 'Inquiry ID is required' });
    }

    // Delete inquiry (this will cascade delete all messages due to foreign key constraint)
    const query = `
      DELETE FROM customer_inquiries 
      WHERE id = ?
    `;
    
    console.log('Executing delete inquiry query:', query, 'with ID:', inquiryId);
    
    pool.query(query, [inquiryId], (err, result) => {
      if (err) {
        console.error('Error deleting inquiry:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      console.log('Delete inquiry result:', result);
      
      if (result.affectedRows === 0) {
        console.log('No rows affected - inquiry not found');
        return res.status(404).json({ error: 'Inquiry not found' });
      }
      
      console.log('Inquiry deleted successfully');
      res.json({ success: true, message: 'Inquiry and all messages deleted successfully' });
    });

  } catch (error) {
    console.error('Error in delete inquiry endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;