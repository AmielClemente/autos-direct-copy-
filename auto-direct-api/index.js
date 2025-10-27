const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');

// Import routes with error handling
let userRoutes, vehicleRoutes, manufacturerRoutes, adminRoutes, dealerRoutes;
let testDriveBookingRoutes, purchasesRoute, orderProcessingRoutes, financeRoutes;
let financeRequestsRoutes, vehicleComparisonRoutes, complaintsRoutes, chatbotRoutes;

// Import routes with error handling - don't crash if one fails
try {
  userRoutes = require('./routes/user-routes');
  vehicleRoutes = require('./routes/vehicle-routes');
  manufacturerRoutes = require('./routes/manufacturer-routes');
  adminRoutes = require('./routes/admin-routes');
  dealerRoutes = require('./routes/dealer-routes');
  testDriveBookingRoutes = require('./routes/test-drive-booking-routes');
  purchasesRoute = require('./routes/purchase-routes');
  orderProcessingRoutes = require('./routes/order-processing-routes');
  financeRoutes = require('./routes/finance-routes');
  financeRequestsRoutes = require('./routes/finance-requests-routes');
  vehicleComparisonRoutes = require('./routes/vehicle-comparison-routes');
  complaintsRoutes = require('./routes/complaints-routes');
  chatbotRoutes = require('./routes/chatbot-routes');
  console.log('All routes loaded successfully');
} catch (error) {
  console.error('ERROR loading routes:', error);
  console.error('ERROR stack:', error.stack);
  // Don't throw - let the app start and handle errors at runtime
}

const app = express();
const server = http.createServer(app);
let io;
let connectDB;
try {
  connectDB = require("./service/databaseConnection");
} catch (e) {
  console.log('Could not load databaseConnection:', e.message);
  connectDB = () => console.log('DatabaseConnection not available');
}
const PORT = process.env.PORT || 3000;

// Import with error handling
let mysql, connectionConfig, supabaseConfig, createClient, SupabaseAdapter;
try {
  mysql = require('mysql2');
  const config = require('./config/supabaseConfig');
  connectionConfig = config.connectionConfig;
  supabaseConfig = config.supabaseConfig;
  createClient = require('@supabase/supabase-js').createClient;
  SupabaseAdapter = require('./service/supabase-adapter').SupabaseAdapter;
} catch (e) {
  console.error('Error loading dependencies:', e.message);
  mysql = null;
  connectionConfig = null;
  supabaseConfig = null;
}

// Initialize Supabase client for production
let supabase;
try {
  console.log('[INIT] Environment check:', {
    NODE_ENV: process.env.NODE_ENV,
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
  });
  
  if (process.env.NODE_ENV === 'production' && supabaseConfig && supabaseConfig.url && supabaseConfig.serviceRoleKey && createClient) {
    console.log('[INIT] Creating Supabase client');
    supabase = createClient(supabaseConfig.url, supabaseConfig.serviceRoleKey);
    console.log('[INIT] Supabase client initialized');
  } else {
    console.log('[INIT] Supabase not configured');
  }
} catch (error) {
  console.error('[INIT] Error initializing Supabase:', error.message);
}

// Create a simple connection pool with error handling for MySQL (development only)
let pool;
if (process.env.NODE_ENV !== 'production' && mysql && connectionConfig) {
  try {
    console.log('[INIT] Creating MySQL pool');
    pool = mysql.createPool(connectionConfig);
    
    // Test the connection
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('[INIT] Database connection failed:', err.message);
      } else {
        console.log('[INIT] Database connected successfully');
        connection.release();
      }
    });
  } catch (error) {
    console.error('[INIT] Failed to initialize database pool:', error.message);
  }
} else {
  console.log('[INIT] Skipping MySQL pool creation');
}

// CORS configuration to allow requests from Vercel frontend
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    // Allow localhost for development
    if (origin.includes('localhost')) return callback(null, true);
    
    // Allow ALL Vercel preview and production URLs
    // This includes all subdomains and preview URLs
    if (origin.includes('vercel.app')) {
      return callback(null, true);
    }
    
    // Allow custom domain
    if (origin.includes('autos-direct.com.au')) {
      return callback(null, true);
    }
    
    // Allow any other origin - permissive CORS
    console.log('[CORS] Allowing origin:', origin);
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json()); // Needed to parse JSON bodies

// Add error handler early to catch all errors
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  console.error('Error stack:', err.stack);
  
  // Always return JSON, never HTML
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message || 'An error occurred',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Make database clients available to routes
app.use((req, res, next) => {
  req.supabase = supabase;
  
  console.log('[Middleware] Initializing database clients for', req.method, req.path);
  console.log('[Middleware] Supabase available:', !!supabase);
  console.log('[Middleware] Environment:', process.env.NODE_ENV);
  
  // In production with Supabase, use SupabaseAdapter to make Supabase work like MySQL pool
  if (supabase && process.env.NODE_ENV === 'production' && SupabaseAdapter) {
    console.log('[Middleware] Using Supabase adapter for production');
    try {
      const adapter = new SupabaseAdapter(supabase);
      req.pool = {
        query: (sql, params, callback) => {
          console.log('[Middleware] Query called with SQL:', sql.substring(0, 100));
          const result = adapter.query(sql, params);
          if (callback) {
            result
              .then(data => {
                console.log('[Middleware] Query returned', data?.length || 0, 'rows');
                callback(null, data);
              })
              .catch(err => {
                console.error('[Middleware] Query error:', err);
                callback(err);
              });
          }
          return result;
        }
      };
    } catch (error) {
      console.error('[Middleware] Failed to create SupabaseAdapter:', error);
      req.pool = null;
    }
  } else {
    console.log('[Middleware] Using MySQL pool for development');
    req.pool = pool;
  }
  
  next();
});

// Simple test endpoint - should ALWAYS work
app.get('/test', (req, res) => {
  res.json({ message: 'API is working!', time: new Date().toISOString() });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(), 
    supabase: !!supabase,
    pool: !!pool,
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

// Only use routes if they were loaded successfully
if (userRoutes) app.use('/user', userRoutes);
if (vehicleRoutes) app.use('/vehicle', vehicleRoutes);
if (manufacturerRoutes) app.use('/manufacturer', manufacturerRoutes);
if (dealerRoutes) app.use("/manage-dealerships", dealerRoutes);
if (testDriveBookingRoutes) app.use("/test-drive", testDriveBookingRoutes);
if (purchasesRoute) app.use("/purchases", purchasesRoute);
if (orderProcessingRoutes) app.use("/order-processing", orderProcessingRoutes);
if (financeRoutes) app.use("/finance", financeRoutes);
if (financeRequestsRoutes) app.use("/finance-requests", financeRequestsRoutes);
if (vehicleComparisonRoutes) app.use("/vehicle-comparison", vehicleComparisonRoutes);
if (complaintsRoutes) app.use("/api/complaints", complaintsRoutes);
if (chatbotRoutes) app.use('/api/chatbot', chatbotRoutes);
if (adminRoutes) app.use('/admin', adminRoutes);

// Static files with error handling
try {
  app.use('/vehicle-images', express.static(path.join(__dirname, 'vehicle-images')));
} catch (error) {
  console.error('Error serving static files:', error);
}

// Only connect to MySQL in development
if (process.env.NODE_ENV !== 'production') {
  connectDB();
} else {
  console.log('Production mode: Skipping MySQL connection');
}

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
    // Use req.pool from middleware (Supabase in production)
    const dbClient = req.pool || pool;
    if (!dbClient) {
      return res.status(500).send('No database connection available');
    }
    
    dbClient.query('SELECT * from users', (err, results) => {
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

// Catch-all for unmatched routes - return JSON
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  server.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`)
  })
}

// Export app for Vercel serverless functions with error handling
try {
  console.log('Exporting Express app for Vercel serverless functions');
  module.exports = app;
} catch (error) {
  console.error('FATAL ERROR in module initialization:', error);
  // Export a minimal app that returns errors as JSON
  const errorApp = express();
  errorApp.use(cors());
  errorApp.use(express.json());
  errorApp.use((req, res) => {
    res.status(500).json({ 
      error: 'Server initialization failed', 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  });
  module.exports = errorApp;
}