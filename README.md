# Voucher Receipt App - Backend

A robust, scalable backend API for managing voucher receipts with MongoDB integration and modern SDE practices.

## 🏗️ Architecture Overview

This backend follows **Software Development Engineering (SDE)** best practices with a clean, layered architecture:

```
backend/
├── config/           # Configuration files
│   └── database.js   # MongoDB connection management
├── controllers/      # Request/Response handling
│   └── voucherController.js
├── middleware/       # Custom middleware
│   ├── validation.js # Input validation
│   └── security.js   # Security & logging
├── models/          # Database models
│   └── Voucher.js   # Mongoose schema
├── routes/          # API routes
│   └── voucherRoutes.js
├── services/        # Business logic layer
│   └── voucherService.js
├── utils/           # Utility functions
│   ├── errors.js    # Error handling
│   └── logger.js    # Console logging
└── server.js        # Application entry point
```

## 🚀 Features

### Core Features

- ✅ **MongoDB Integration** - Robust NoSQL database with Mongoose ODM
- ✅ **RESTful API** - Clean, consistent API endpoints
- ✅ **Input Validation** - Comprehensive validation using express-validator
- ✅ **Error Handling** - Centralized error handling with custom error classes
- ✅ **Security** - Helmet, CORS, rate limiting, and request sanitization
- ✅ **Logging** - Request/response logging with Morgan
- ✅ **Pagination** - Built-in pagination for large datasets
- ✅ **Filtering** - Advanced filtering and search capabilities
- ✅ **Statistics** - Voucher analytics and reporting

### Advanced Features

- 📊 **Aggregation Pipeline** - Complex data analysis
- 🔒 **Rate Limiting** - API protection against abuse
- 🛡️ **Security Headers** - Comprehensive security middleware
- 📈 **Performance Monitoring** - Response time tracking
- 🔄 **Graceful Shutdown** - Proper cleanup on server termination
- 📝 **Console Logging** - Real-time operational monitoring

## 📋 API Endpoints

### Voucher Management

| Method | Endpoint            | Description                       | Auth Required |
| ------ | ------------------- | --------------------------------- | ------------- |
| POST   | `/api/vouchers`     | Create new voucher                | No            |
| GET    | `/api/vouchers`     | Get all vouchers (with filtering) | No            |
| GET    | `/api/vouchers/:id` | Get voucher by ID                 | No            |
| PUT    | `/api/vouchers/:id` | Update voucher                    | No            |
| DELETE | `/api/vouchers/:id` | Delete voucher                    | No            |

### Voucher Actions

| Method | Endpoint                    | Description     | Auth Required |
| ------ | --------------------------- | --------------- | ------------- |
| PATCH  | `/api/vouchers/:id/approve` | Approve voucher | No            |
| PATCH  | `/api/vouchers/:id/reject`  | Reject voucher  | No            |

### Analytics & Reporting

| Method | Endpoint                             | Description                    | Auth Required |
| ------ | ------------------------------------ | ------------------------------ | ------------- |
| GET    | `/api/vouchers/statistics`           | Get voucher statistics         | No            |
| GET    | `/api/vouchers/financial-year/:year` | Get vouchers by financial year | No            |
| GET    | `/api/vouchers/date-range`           | Get vouchers by date range     | No            |

### System

| Method | Endpoint  | Description  | Auth Required |
| ------ | --------- | ------------ | ------------- |
| GET    | `/health` | Health check | No            |

## 🛠️ Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the backend directory:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/voucher-receipt-app
MONGODB_TEST_URI=mongodb://localhost:27017/voucher-receipt-app-test

# Server Configuration
PORT=3000
NODE_ENV=development

# Security
JWT_SECRET=your-super-secret-jwt-key-here
BCRYPT_ROUNDS=12

# Logging
LOG_LEVEL=info
```

### 3. Start MongoDB

```bash
# Using MongoDB service
sudo systemctl start mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 4. Run the Application

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📊 Getting Started

### Create Your First Voucher

```bash
curl -X POST http://localhost:3000/api/vouchers \
  -H "Content-Type: application/json" \
  -d '{
    "association": "ABC Association",
    "financialYear": "2024-2025",
    "date": "2024-01-15",
    "payee": "John Doe",
    "amount": 1500.00,
    "purpose": "Office supplies",
    "approvedBy": "Manager Name"
  }'
```

## 🔧 Configuration

### Database Configuration

The database connection is managed in `config/database.js` with:

- Connection pooling
- Error handling
- Reconnection logic
- Graceful shutdown

### Validation Rules

Input validation is handled in `middleware/validation.js`:

- Required field validation
- Data type validation
- Format validation (dates, amounts, etc.)
- Custom business rules

### Security Configuration

Security middleware in `middleware/security.js`:

- Helmet for security headers
- CORS configuration
- Rate limiting
- Request sanitization

## 📈 Performance Features

### Pagination

All list endpoints support pagination:

```javascript
GET /api/vouchers?page=1&limit=10&sortBy=createdAt&sortOrder=desc
```

### Filtering

Advanced filtering capabilities:

```javascript
GET /api/vouchers?association=ABC&status=approved&minAmount=1000&maxAmount=5000
```

### Indexing

MongoDB indexes for optimal performance:

- Association + Financial Year
- Date (descending)
- Payee
- Amount
- Status
- Created At

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- --grep "Voucher Service"
```

## 📝 API Documentation

### Request/Response Format

#### Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "pagination": { ... } // For list endpoints
}
```

#### Error Response

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "statusCode": 400,
    "details": [ ... ], // Validation errors
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### Example API Calls

#### Create Voucher

```bash
curl -X POST http://localhost:3000/api/vouchers \
  -H "Content-Type: application/json" \
  -d '{
    "association": "ABC Association",
    "financialYear": "2024-2025",
    "date": "2024-01-15",
    "payee": "John Doe",
    "amount": 1500.00,
    "purpose": "Office supplies",
    "approvedBy": "Manager Name"
  }'
```

#### Get Vouchers with Filtering

```bash
curl "http://localhost:3000/api/vouchers?status=approved&page=1&limit=5"
```

## 🔍 Monitoring & Logging

### Health Check

```bash
curl http://localhost:3000/health
```

### Console Logging

- **Real-time monitoring** - See operations as they happen
- **Color-coded output** - Easy to read different log levels
- **Structured data** - JSON metadata for detailed information
- **Performance tracking** - Response times and slow operation alerts
- **Security events** - Rate limiting and suspicious activity detection
- **Database operations** - Connection status and query performance

#### Log Levels

- `ERROR` (Red) - Critical errors and failures
- `WARN` (Yellow) - Warnings and security events
- `INFO` (Cyan) - General information and operations
- `HTTP` (Magenta) - API requests and responses
- `DEBUG` (White) - Detailed debugging information

#### Environment Configuration

```env
LOG_LEVEL=info  # error, warn, info, http, debug
```

## 🚀 Deployment

### Production Considerations

1. Set `NODE_ENV=production`
2. Use environment variables for sensitive data
3. Configure MongoDB with authentication
4. Set up proper logging
5. Configure reverse proxy (nginx)
6. Set up monitoring and alerting

### Docker Support

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

For issues and questions:

1. Check the logs for error details
2. Verify MongoDB connection
3. Check environment configuration
4. Review API documentation
