require('dotenv').config();

const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const { query } = require('./config/database');
const SocketService = require('./services/socketService');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const teamRoutes = require('./routes/teams');
const messageRoutes = require('./routes/messages');
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS'));
  },
  credentials: true
};

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '100kb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/messages', messageRoutes);
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use((error, _req, res, _next) => {
  logger.error('Unhandled request error', { message: error.message });
  res.status(error.status || 500).json({ error: 'Internal server error' });
});

const io = new Server(server, { cors: corsOptions });
SocketService.setupSocketHandlers(io);

const port = Number(process.env.PORT || 5000);

const start = async () => {
  await query('SELECT 1');
  server.listen(port, () => logger.info(`Server listening on port ${port}`));
};

start().catch((error) => {
  logger.error('Unable to start server', { message: error.message });
  process.exit(1);
});
