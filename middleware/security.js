import cors from 'cors';
import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';

/**
 * Simple CORS configuration
 */
export const corsMiddleware = cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
});

/**
 * Basic rate limiting - prevents accidental spam
 */
export const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: {
    error: 'Too many requests, please try again later.',
    statusCode: 429
  },
});

/**
 * Request logging middleware
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      contentLength: res.get('Content-Length') || 0,
      referer: req.get('Referer'),
      timestamp: new Date().toISOString()
    };

    // Log security events
    if (res.statusCode === 429) {
      logger.security('Rate limit exceeded', {
        ip: req.ip,
        url: req.originalUrl,
        method: req.method
      });
    }

    if (res.statusCode >= 400) {
      logger.error('Request failed', {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        ip: req.ip
      });
    } else {
      logger.http('Request completed', {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`
      });
    }
  });

  next();
};

/**
 * Response time header middleware
 */
export const responseTime = (req, res, next) => {
  const start = Date.now();
  
  // Set response time header before sending response
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    res.set('X-Response-Time', `${duration}ms`);
    return originalSend.call(this, data);
  };

  next();
};
