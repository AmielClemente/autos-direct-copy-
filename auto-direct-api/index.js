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
const { SupabaseAdapter } = require('./service/supabase-adapter');

// Initialize Supabase client for production
let supabase;
try {
  console.log('Environment check:', {
    NODE_ENV: process.env.NODE_ENV,
    SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'NOT SET',
    SUPABASE_URL_VALUE: process.env.SUPABASE_URL?.substring(0, 30) + '...' || 'NOT SET',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET (LENGTH: ' + process.env.SUPABASE_SERVICE_ROLE_KEY.length + ')' : 'NOT SET',
    supabaseConfig_url: supabaseConfig.url ? 'SET' : 'NOT SET',
    supabaseConfig_serviceRoleKey: supabaseConfig.serviceRoleKey ? 'SET (LENGTH: ' + supabaseConfig.serviceRoleKey.length + ')' : 'NOT SET'
  });
  
  if (process.env.NODE_ENV === 'production' && supabaseConfig && supabaseConfig.url && supabaseConfig.serviceRoleKey) {
    console.log('Creating Supabase client with:', {
      url: supabaseConfig.url.substring(0, 30) + '...',
      hasKey: !!supabaseConfig.serviceRoleKey,
      keyPreview: supabaseConfig.serviceRoleKey?.substring(0, 20) + '...'
    });
    supabase = createClient(supabaseConfig.url, supabaseConfig.serviceRoleKey);
    console.log('Supabase client initialized for production');
  } else {
    console.log('Supabase not configured, using MySQL for development');
    console.log('Reason:', {
      isProduction: process.env.NODE_ENV === 'production',
      hasConfig: !!supabaseConfig,
      hasUrl: !!supabaseConfig?.url,
      hasServiceRoleKey: !!supabaseConfig?.serviceRoleKey
    });
  }
} catch (error) {
  console.error('Error initializing Supabase:', error.message);
  console.log('Running without Supabase, using MySQL for development');
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
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    // Allow localhost for development
    if (origin.includes('localhost')) return callback(null, true);
    
    // Allow all Vercel preview and production URLs
    if (origin.includes('vercel.app') || origin.includes('autos-direct.com.au')) {
      return callback(null, true);
    }
    
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json()); // Needed to parse JSON bodies

// Make database clients available to routes
app.use((req, res, next) => {
  req.supabase = supabase;
  
  // In production with Supabase, use SupabaseAdapter to make Supabase work like MySQL pool
  if (supabase && process.env.NODE_ENV === 'production') {
    console.log('[Middleware] Using Supabase adapter');
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
  } else {
    console.log('[Middleware] Using MySQL pool');
    req.pool = pool;
  }
  
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