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
const { connectionConfig } = require('./config/connectionsConfig');
const pool = mysql.createPool(connectionConfig);

// CORS configuration to allow requests from Vercel frontend
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://autos-direct-copy.vercel.app',
    'https://autos-direct-copy-npn58n1s2-amielclementes-projects.vercel.app',
    'https://autos-direct.com.au'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json()); // Needed to parse JSON bodies

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), ports: { frontend: 5173, backend: 3000 } });
});

app.use('/user', userRoutes);
app.use('/vehicle', vehicleRoutes);
app.use('/manufacturer', manufacturerRoutes);
app.use('/vehicle-images', express.static(path.join(__dirname, 'vehicle-images')));
app.use('/admin', adminRoutes);
app.use("/manage-dealerships", dealerRoutes);
app.use("/test-drive", testDriveBookingRoutes);
app.use("/purchases", purchasesRoute);
app.use("/order-processing", orderProcessingRoutes);
app.use("/finance", financeRoutes);
app.use("/finance-requests", financeRequestsRoutes);
app.use("/vehicle-comparison", vehicleComparisonRoutes);
app.use("/api/complaints", complaintsRoutes);
app.use("/api/chatbot", chatbotRoutes);

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