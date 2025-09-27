import express from "express";
import dotenv from "dotenv";
import compression from "compression";
import morgan from "morgan";
import database from "./config/database.js";
import voucherRoutes from './routes/voucherRoutes.js';
import { corsMiddleware, rateLimitMiddleware, requestLogger, responseTime } from "./middleware/security.js";
import { errorHandler, notFound } from "./utils/errors.js";
import logger from "./utils/logger.js";

// Load environment variables
dotenv.config();

logger.info('Starting Voucher Receipt App server', {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  logLevel: process.env.LOG_LEVEL || 'info'
});

const app = express();

// Basic security middleware
app.use(corsMiddleware);
app.use(rateLimitMiddleware);

// Compression middleware
app.use(compression());

// Request logging
app.use(morgan('combined'));
app.use(requestLogger);
app.use(responseTime);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  const healthData = {
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: database.getConnectionStatus(),
    memory: process.memoryUsage(),
    version: process.version
  };

  logger.info('Health check requested', {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(200).json(healthData);
});

// API routes
app.use("/api/vouchers", voucherRoutes);

// 404 handler
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await database.connect();
    
    // Start server
    app.listen(PORT, () => {
      logger.info('Server started successfully', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        database: 'Connected to MongoDB',
        pid: process.pid
      });
    });
  } catch (error) {
    logger.error('Failed to start server', {
      error: error.message,
      stack: error.stack,
      port: PORT
    });
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await database.disconnect();
  logger.info('Server shutdown completed');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  await database.disconnect();
  logger.info('Server shutdown completed');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise: promise.toString()
  });
  process.exit(1);
});

startServer();
``