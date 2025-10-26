const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const userRoutes = require('./routes/user-routes');
const vehicleRoutes = require('./routes/vehicle-routes');
const manufacturerRoutes = require('./routes/manufacturer-routes');
const adminRoutes = require('./routes/admin-routes');
const dealerRoutes = require('./routes/dealer-routes');
const testDriveBookingRoutes = require('./routes/test-drive-booking-routes');
const purchasesRoute = require('./routes/purchase-routes');
const orderProcessingRoutes = require('./routes/order-processing-routes');
const financeRoutes = require('./routes/finance-routes');
const financeRequestsRoutes = require('./routes/finance-requests-routes');
const vehicleComparisonRoutes = require('./routes/vehicle-comparison-routes');
const complaintsRoutes = require('./routes/complaints-routes');
const chatbotRoutes = require('./routes/chatbot-routes');

const app = express();
const server = http.createServer(app);
let io;
const connectDB = require("./service/databaseConnection");
const PORT = process.env.PORT || 3000;

const mysql = require('mysql2')
const { connectionConfig, supabaseConfig } = require('./config/supabaseConfig');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client for production
let supabase;
if (process.env.NODE_ENV === 'production' && supabaseConfig.url && supabaseConfig.serviceRoleKey) {
  supabase = createClient(supabaseConfig.url, supabaseConfig.serviceRoleKey);
  console.log('Supabase client initialized for production');
} else {
  console.log('Supabase not configured, using MySQL for development');
}

// Create a simple connection pool with error handling for MySQL (development)
let pool;
try {
  // Try to create the connection pool
  pool = mysql.createPool(connectionConfig);
  
  // Test the connection
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Database connection failed:', err.message);
      console.log('Running without database connection...');
    } else {
      console.log('Database connected successfully');
      connection.release();
    }
  });
} catch (error) {
  console.error('Failed to initialize database pool:', error.message);
  console.log('Running without database connection...');
}

// CORS configuration to allow requests from Vercel frontend
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://autos-direct-copy.vercel.app',
    'https://autos-direct-copy-npn58n1s2-amielclementes-projects.vercel.app',
    'https://autos-direct-copy-gror20anm-amielclementes-projects.vercel.app',
    'https://autos-direct-copy-8enxxthyn-amielclementes-projects.vercel.app',
    'https://autos-direct-copy-llcoybx5k-amielclementes-projects.vercel.app',
    'https://autos-direct-copy-3mvjqx35a-amielclementes-projects.vercel.app',
    'https://autos-direct-copy-dw3pes44v-amielclementes-projects.vercel.app',
    'https://autos-direct-copy-hv24gsfjp-amielclementes-projects.vercel.app',
    'https://autos-direct.com.au'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json()); // Needed to parse JSON bodies

// Make database clients available to routes
app.use((req, res, next) => {
  req.supabase = supabase;
  req.pool = pool;
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(), 
    database: supabase ? 'Supabase Connected' : (pool ? 'MySQL Connected' : 'Not Available'),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Simple API endpoint for testing
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.use('/user', userRoutes);
app.use('/vehicle', vehicleRoutes);
app.use('/manufacturer', manufacturerRoutes);
app.use('/vehicle-images', express.static(path.join(__dirname, 'vehicle-images')));
app.use('/api/chatbot', chatbotRoutes);
app.use('/admin', adminRoutes);
app.use("/manage-dealerships", dealerRoutes);
app.use("/test-drive", testDriveBookingRoutes);
app.use("/purchases", purchasesRoute);
app.use("/order-processing", orderProcessingRoutes);
app.use("/finance", financeRoutes);
app.use("/finance-requests", financeRequestsRoutes);
app.use("/vehicle-comparison", vehicleComparisonRoutes);
app.use("/api/complaints", complaintsRoutes);

connectDB();

// Setup Socket.IO for real-time chatbot replies
try {
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  io.on('connection', (socket) => {
    socket.on('join', (sessionId) => {
      if (typeof sessionId === 'string' && sessionId.length > 0) {
        socket.join(sessionId);
      }
    });
  });

  // Make io accessible in routes
  app.set('io', io);
} catch (e) {
  console.error('Socket.IO failed to initialize:', e.message);
}

/*
 * Below code block is a test for the database connection. It will be used to
 * simply retrieve all users from the database.
 * THIS MUST BE REMOVED BEFORE HANDOVER
*/

  app.get('/api/db-connection-test', (req, res) => {
    pool.query('SELECT * from users', (err, results) => {
      if (err) {
        console.error(`Query failed: ${err}`);
        res.status(500).send('Server error');
      }
      else {
        res.json(results);
      }

      // pool.destroy(); // Commented out - not needed for connection pools
    });
  });

// End of database connection test

server.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`)
})