require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const apiRoutes = require('./routes/apiRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const http = require('http');
const supportRoutes = require('./routes/supportRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const url = require('url');
const wsService = require('./services/WebSocketService');
const config = require('./config/config');
const rateLimit = require('express-rate-limit');

const app = express();
const server = http.createServer(app);

// WebSocket server with proper configuration for App Runner
const wss = new WebSocket.Server({ 
  noServer: true,
  path: process.env.WS_PATH || '/ws'  // Use the configured WS_PATH
});

// Add rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Apply to all routes
app.use(limiter);

// Handle WebSocket connections
wss.on('connection', function connection(ws, request, user) {
  const origin = request.headers.origin;
  if (Array.isArray(config.CORS_ORIGIN) 
      ? config.CORS_ORIGIN.includes(origin)
      : config.CORS_ORIGIN === origin) {
    console.log(`User ${user.username} connected to WebSocket`);
    if (user.id) {
      wsService.addConnection(user.id, ws);
    }
  } else {
    console.log(`Rejected WebSocket connection from origin: ${origin}`);
    ws.close();
    return;
  }

  ws.on('message', function incoming(message) {
    console.log('received:', message.toString());
  });

  ws.on('close', function close() {
    console.log(`User ${user.username} disconnected`);
    if (user.id) {
      wsService.removeConnection(user.id);
    }
  });

  // Send initial connection confirmation
  ws.send(JSON.stringify({ type: 'connection', status: 'connected' }));
});

// Handle upgrade of HTTP connection to WebSocket
server.on('upgrade', function upgrade(request, socket, head) {
  const { query } = url.parse(request.url, true);
  const token = query.token;

  if (!token) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }

  // Verify JWT token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    wss.handleUpgrade(request, socket, head, function done(ws) {
      wss.emit('connection', ws, request, decoded);
    });
  } catch (err) {
    console.error('WebSocket authentication failed:', err);
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
  }
});

// Connect to MongoDB
connectDB();

// CORS configuration
app.use(cors({
  origin: Array.isArray(config.CORS_ORIGIN) 
    ? config.CORS_ORIGIN 
    : [config.CORS_ORIGIN],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/support', supportRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/v1', apiRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/super-admin', superAdminRoutes);

// Debug endpoint
app.get('/debug/routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    }
  });
  res.json(routes);
});

// Update the server listen to use 0.0.0.0
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server running on path: ${process.env.WS_PATH || '/ws'}`);
  console.log('Available routes:');
  app._router.stack.forEach((r) => {
    if (r.route && r.route.path) {
      console.log(`${Object.keys(r.route.methods)[0].toUpperCase()} ${r.route.path}`);
    }
  });
});

// Make wsService globally available
global.wsService = wsService;