import mongoose from 'mongoose';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/voucher-receipt-app';

class Database {
  constructor() {
    this.connection = null;
    this.connectionStartTime = null;
  }

  async connect() {
    try {
      if (this.connection) {
        logger.info('Database connection already exists', { 
          readyState: mongoose.connection.readyState 
        });
        return this.connection;
      }

      this.connectionStartTime = Date.now();
      logger.info('Attempting to connect to MongoDB', { 
        uri: MONGODB_URI.replace(/\/\/.*@/, '//***:***@'), // Hide credentials in logs
        nodeEnv: process.env.NODE_ENV 
      });

      const options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
      };

      this.connection = await mongoose.connect(MONGODB_URI, options);
      
      const connectionTime = Date.now() - this.connectionStartTime;
      logger.info('MongoDB connected successfully', {
        connectionTime: `${connectionTime}ms`,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name,
        readyState: mongoose.connection.readyState
      });
      
      // Handle connection events
      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error', {
          error: err.message,
          stack: err.stack,
          readyState: mongoose.connection.readyState
        });
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected', {
          readyState: mongoose.connection.readyState,
          reason: 'Connection lost'
        });
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected', {
          readyState: mongoose.connection.readyState,
          host: mongoose.connection.host,
          port: mongoose.connection.port
        });
      });

      mongoose.connection.on('close', () => {
        logger.info('MongoDB connection closed', {
          readyState: mongoose.connection.readyState
        });
      });

      // Log database operations in development
      if (process.env.NODE_ENV === 'development') {
        mongoose.set('debug', (collection, method, query, doc) => {
          logger.database(method, collection, query);
        });
      }

      return this.connection;
    } catch (error) {
      const connectionTime = this.connectionStartTime ? Date.now() - this.connectionStartTime : 0;
      logger.error('MongoDB connection failed', {
        error: error.message,
        stack: error.stack,
        connectionTime: `${connectionTime}ms`,
        uri: MONGODB_URI.replace(/\/\/.*@/, '//***:***@')
      });
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.connection) {
        const disconnectStartTime = Date.now();
        logger.info('Disconnecting from MongoDB');
        
        await mongoose.disconnect();
        this.connection = null;
        
        const disconnectTime = Date.now() - disconnectStartTime;
        logger.info('MongoDB disconnected successfully', {
          disconnectTime: `${disconnectTime}ms`
        });
      } else {
        logger.warn('Attempted to disconnect but no active connection found');
      }
    } catch (error) {
      logger.error('Error disconnecting from MongoDB', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  async clearDatabase() {
    if (process.env.NODE_ENV === 'test') {
      logger.info('Clearing test database');
      const collections = mongoose.connection.collections;
      const clearedCollections = [];
      
      for (const key in collections) {
        const collection = collections[key];
        const count = await collection.countDocuments();
        await collection.deleteMany({});
        clearedCollections.push({ name: key, count });
      }
      
      logger.info('Test database cleared', { clearedCollections });
    } else {
      logger.warn('Database clear attempted in non-test environment', {
        nodeEnv: process.env.NODE_ENV
      });
    }
  }

  getConnectionStatus() {
    return {
      connected: mongoose.connection.readyState === 1,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };
  }
}

export default new Database();
