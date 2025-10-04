# 🏗️ System Architecture & Deployment Guide

## 📋 Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Database Design](#database-design)
4. [API Documentation](#api-documentation)
5. [Deployment Guide](#deployment-guide)
6. [Security Implementation](#security-implementation)
7. [Performance Optimization](#performance-optimization)
8. [Monitoring & Logging](#monitoring--logging)

## 🏗️ Architecture Overview

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│  React.js Application (Port: 3000)                            │
│  ├── Employee Dashboard    ├── Manager Dashboard              │
│  ├── Admin Dashboard       ├── Mobile Responsive UI          │
│  ├── OCR Receipt Scanner   ├── Real-time Notifications       │
│  └── Analytics & Reports   └── Multi-language Support        │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS/WSS
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│  Node.js/Express API Server (Port: 5000)                      │
│  ├── Authentication Service  ├── Expense Management Service   │
│  ├── Approval Engine        ├── OCR Processing Service       │
│  ├── Currency Service       ├── Analytics Service            │
│  ├── Notification Service   ├── Audit Logging Service        │
│  └── File Upload Service    └── Real-time Socket.IO          │
└─────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   DATABASE      │ │   EXTERNAL      │ │    AI/ML        │
│     LAYER       │ │    SERVICES     │ │   SERVICES      │
├─────────────────┤ ├─────────────────┤ ├─────────────────┤
│ MongoDB         │ │ Currency APIs   │ │ Tesseract.js    │
│ ├── Users       │ │ ├── ExchangeRate│ │ ├── OCR Engine  │
│ ├── Companies   │ │ ├── Fixer.io    │ │ ├── Text Extract│
│ ├── Expenses    │ │ └── CurrencyAPI │ │ └── Auto-categorize│
│ ├── Approvals   │ │                 │ │                 │
│ └── Audit Logs  │ │ Email Service   │ │ Anomaly Detection│
│                 │ │ ├── SMTP        │ │ ├── Pattern Analysis│
│ Redis Cache     │ │ ├── SendGrid    │ │ ├── Duplicate Detection│
│ ├── Sessions    │ │ └── Mailgun     │ │ └── Fraud Prevention│
│ ├── Rate Limits │ │                 │ │                 │
│ └── Currency    │ │ Cloud Storage   │ │ Predictive Analytics│
│     Rates       │ │ ├── AWS S3      │ │ ├── Spending Forecasts│
└─────────────────┘ │ ├── Google Cloud│ │ ├── Budget Alerts   │
                    │ └── Azure Blob  │ │ └── Cost Optimization│
                    └─────────────────┘ └─────────────────┘
```

### Microservices Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    API GATEWAY (Future)                        │
│  ├── Rate Limiting        ├── Load Balancing                   │
│  ├── Authentication      ├── Request Routing                   │
│  └── API Versioning      └── Response Caching                  │
└─────────────────────────────────────────────────────────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            │                       │                       │
            ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AUTH SERVICE  │    │ EXPENSE SERVICE │    │ APPROVAL SERVICE│
│  Port: 5001     │    │  Port: 5002     │    │  Port: 5003     │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ ├── JWT Tokens  │    │ ├── CRUD Ops    │    │ ├── Workflow    │
│ ├── User Mgmt   │    │ ├── File Upload │    │ ├── Rules Engine│
│ ├── Company     │    │ ├── OCR Process │    │ ├── Notifications│
│ └── Permissions │    │ └── Validation  │    │ └── Overrides   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
            │                       │                       │
            ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ CURRENCY SERVICE│    │ ANALYTICS       │    │ NOTIFICATION    │
│  Port: 5004     │    │ SERVICE         │    │ SERVICE         │
├─────────────────┤    │  Port: 5005     │    │  Port: 5006     │
│ ├── Exchange    │    ├─────────────────┤    ├─────────────────┤
│     Rates       │    │ ├── Reports     │    │ ├── Email       │
│ ├── Conversion  │    │ ├── Dashboards  │    │ ├── Push        │
│ ├── Historical │    │ ├── Forecasting │    │ ├── SMS         │
│ └── Multi-Source│    │ └── Export      │    │ └── Real-time   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 💻 Technology Stack

### Frontend Stack
```javascript
{
  "framework": "React 18.2.0",
  "routing": "React Router DOM 6.8+",
  "state_management": "React Query + Context API",
  "ui_library": "Material-UI 5.15+",
  "styling": "Emotion + CSS-in-JS",
  "forms": "React Hook Form 7.48+",
  "charts": "Recharts 2.8+",
  "notifications": "React Hot Toast",
  "file_upload": "React Dropzone",
  "camera": "React Webcam",
  "animations": "Framer Motion",
  "testing": "Jest + React Testing Library",
  "build_tool": "Create React App"
}
```

### Backend Stack
```javascript
{
  "runtime": "Node.js 18+",
  "framework": "Express.js 4.18+",
  "database": "MongoDB 6.0+ with Mongoose",
  "cache": "Redis 7.0+",
  "authentication": "JWT + bcryptjs",
  "validation": "Joi + express-validator",
  "file_upload": "Multer + Sharp",
  "ocr": "Tesseract.js + External APIs",
  "real_time": "Socket.IO 4.7+",
  "logging": "Winston 3.11+",
  "monitoring": "Express Winston",
  "documentation": "Swagger/OpenAPI 3.0",
  "testing": "Jest + Supertest"
}
```

### Infrastructure & DevOps
```yaml
containerization:
  - Docker & Docker Compose
  - Multi-stage builds
  - Container orchestration

cloud_platforms:
  - AWS (EC2, S3, CloudWatch)
  - Google Cloud Platform
  - Azure (App Service, Blob Storage)
  - Heroku (for quick deployment)

ci_cd:
  - GitHub Actions
  - GitLab CI/CD
  - Jenkins
  - Docker Hub

monitoring:
  - Prometheus & Grafana
  - New Relic
  - DataDog
  - AWS CloudWatch
```

## 🗄️ Database Design

### MongoDB Collections Schema

#### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique, indexed),
  password: String (hashed),
  firstName: String,
  lastName: String,
  role: Enum['employee', 'manager', 'finance', 'director', 'admin'],
  company: ObjectId (ref: Company),
  manager: ObjectId (ref: User),
  department: String,
  employeeId: String (unique),
  profileImage: String,
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  bankDetails: {
    accountNumber: String (encrypted),
    routingNumber: String,
    bankName: String
  },
  preferences: {
    notifications: {
      email: Boolean,
      push: Boolean,
      sms: Boolean
    },
    currency: String,
    language: String
  },
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### Companies Collection
```javascript
{
  _id: ObjectId,
  name: String,
  code: String (unique),
  country: String,
  defaultCurrency: String,
  industry: String,
  settings: {
    expenseCategories: [{
      name: String,
      icon: String,
      maxAmount: Number,
      requiresReceipt: Boolean
    }],
    approvalRules: {
      defaultFlow: [String],
      amountThresholds: [{
        amount: Number,
        approvers: [String],
        rule: Enum['all', 'any', 'percentage'],
        percentage: Number
      }]
    },
    fiscalYear: {
      startMonth: Number,
      endMonth: Number
    }
  },
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### Expenses Collection
```javascript
{
  _id: ObjectId,
  expenseNumber: String (unique),
  amount: Number,
  originalAmount: Number,
  currency: String,
  originalCurrency: String,
  exchangeRate: Number,
  date: Date,
  category: String,
  description: String,
  vendor: String,
  location: {
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  receipts: [{
    filename: String,
    originalName: String,
    url: String,
    size: Number,
    mimeType: String,
    ocrData: {
      extractedText: String,
      confidence: Number,
      parsedData: {
        amount: Number,
        date: Date,
        vendor: String,
        category: String
      }
    }
  }],
  status: Enum['draft', 'submitted', 'approved', 'rejected', 'reimbursed'],
  submittedBy: ObjectId (ref: User),
  company: ObjectId (ref: Company),
  approvalFlow: [{
    approver: ObjectId (ref: User),
    role: String,
    status: Enum['pending', 'approved', 'rejected'],
    comments: String,
    timestamp: Date
  }],
  anomalyFlags: [{
    type: String,
    severity: Enum['low', 'medium', 'high', 'critical'],
    description: String,
    confidence: Number
  }],
  submittedAt: Date,
  approvedAt: Date,
  reimbursedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Database Indexes
```javascript
// Performance optimization indexes
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ company: 1, role: 1 })
db.users.createIndex({ manager: 1 })

db.companies.createIndex({ code: 1 }, { unique: true })

db.expenses.createIndex({ submittedBy: 1, status: 1 })
db.expenses.createIndex({ company: 1, status: 1 })
db.expenses.createIndex({ "approvalFlow.approver": 1, "approvalFlow.status": 1 })
db.expenses.createIndex({ date: -1 })
db.expenses.createIndex({ createdAt: -1 })
db.expenses.createIndex({ expenseNumber: 1 }, { unique: true })
```

## 🔧 API Documentation

### Authentication Endpoints
```
POST   /api/auth/register      - Register new user & company
POST   /api/auth/login         - User login
POST   /api/auth/logout        - User logout
GET    /api/auth/me            - Get current user
POST   /api/auth/refresh       - Refresh JWT token
POST   /api/auth/validate      - Validate token
```

### Expense Management Endpoints
```
GET    /api/expenses           - Get expenses (filtered)
POST   /api/expenses           - Create expense (with file upload)
GET    /api/expenses/:id       - Get expense details
PUT    /api/expenses/:id       - Update expense
DELETE /api/expenses/:id       - Delete expense
PATCH  /api/expenses/:id/submit - Submit for approval
GET    /api/expenses/pending-approvals - Get pending approvals
```

### Approval Workflow Endpoints
```
POST   /api/approvals/:id/approve  - Approve expense
POST   /api/approvals/:id/reject   - Reject expense
POST   /api/approvals/:id/override - Admin override
GET    /api/approvals/:id/history  - Get approval history
```

### OCR Processing Endpoints
```
POST   /api/ocr/process        - Process receipt image
GET    /api/ocr/history        - Get OCR processing history
```

### Analytics & Reporting Endpoints
```
GET    /api/analytics/dashboard      - Dashboard statistics
GET    /api/analytics/spending-trends - Spending trend analysis
GET    /api/analytics/category-breakdown - Category analysis
GET    /api/analytics/approval-stats    - Approval statistics
POST   /api/analytics/export          - Export reports
```

## 🚀 Deployment Guide

### Local Development Setup

1. **Prerequisites**
```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
sudo apt-get install -y mongodb

# Install Redis
sudo apt-get install -y redis-server

# Install Git
sudo apt-get install -y git
```

2. **Clone and Setup**
```bash
# Clone repository
git clone https://github.com/jugalmehta12/Expense-Management-System.git
cd Expense-Management-System

# Install dependencies
npm install
cd server && npm install
cd ../client && npm install
cd ..

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Start services
docker-compose up -d mongodb redis  # If using Docker
# OR start MongoDB and Redis manually

# Run development servers
npm run dev  # Starts both client and server
```

### Production Deployment

#### Docker Deployment
```dockerfile
# Dockerfile.server
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM base AS development
RUN npm ci
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]

FROM base AS production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

```dockerfile
# Dockerfile.client
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS production
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  client:
    build:
      context: ./client
      target: production
    ports:
      - "80:80"
    environment:
      - REACT_APP_API_URL=https://api.yourdomain.com
    depends_on:
      - server

  server:
    build:
      context: ./server
      target: production
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=mongodb://mongodb:27017/expense_management
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongodb
      - redis
    volumes:
      - ./uploads:/app/uploads

  mongodb:
    image: mongo:6.0
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=your_secure_password

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - client
      - server

volumes:
  mongodb_data:
  redis_data:
```

#### Cloud Deployment (AWS)

1. **AWS EC2 Setup**
```bash
# Launch EC2 instance (t3.medium recommended)
# Install Docker and Docker Compose
sudo yum update -y
sudo yum install -y docker
sudo systemctl start docker
sudo usermod -a -G docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Deploy application
git clone your-repo
cd expense-management-system
docker-compose -f docker-compose.prod.yml up -d
```

2. **AWS RDS MongoDB Atlas Setup**
```javascript
// Connection string for production
const mongoURI = `mongodb+srv://${username}:${password}@cluster0.mongodb.net/expense_management?retryWrites=true&w=majority`;
```

3. **AWS S3 for File Storage**
```javascript
// Configure AWS S3 for receipt storage
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});
```

#### Kubernetes Deployment
```yaml
# k8s/deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: expense-management-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: expense-management-api
  template:
    metadata:
      labels:
        app: expense-management-api
    spec:
      containers:
      - name: api
        image: your-registry/expense-management-api:latest
        ports:
        - containerPort: 5000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
---
apiVersion: v1
kind: Service
metadata:
  name: expense-management-api-service
spec:
  selector:
    app: expense-management-api
  ports:
  - port: 80
    targetPort: 5000
  type: LoadBalancer
```

## 🔒 Security Implementation

### Authentication & Authorization
```javascript
// JWT Token Security
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { userId: user._id, role: user.role },
  process.env.JWT_SECRET,
  { 
    expiresIn: '7d',
    issuer: 'expense-management-system',
    audience: 'expense-management-users'
  }
);

// Password Security
const bcrypt = require('bcryptjs');
const saltRounds = 12;
const hashedPassword = await bcrypt.hash(password, saltRounds);

// Rate Limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
```

### Data Encryption
```javascript
// Sensitive Data Encryption
const crypto = require('crypto');
const algorithm = 'aes-256-gcm';
const secretKey = process.env.ENCRYPTION_KEY;

const encrypt = (text) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, secretKey);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return {
    iv: iv.toString('hex'),
    content: encrypted.toString('hex')
  };
};
```

### Input Validation & Sanitization
```javascript
// Schema Validation with Joi
const Joi = require('joi');
const expenseSchema = Joi.object({
  amount: Joi.number().positive().required(),
  date: Joi.date().max('now').required(),
  category: Joi.string().trim().max(100).required(),
  description: Joi.string().trim().max(500).required(),
  vendor: Joi.string().trim().max(200).optional()
});

// Express Validator
const { body, validationResult } = require('express-validator');
const validateExpense = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
  body('description').trim().escape().isLength({ min: 1, max: 500 })
];
```

## ⚡ Performance Optimization

### Database Optimization
```javascript
// MongoDB Aggregation Pipelines
const getExpenseStats = async (companyId) => {
  return await Expense.aggregate([
    { $match: { company: companyId } },
    { $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);
};

// Indexing Strategy
db.expenses.createIndex({ 
  company: 1, 
  status: 1, 
  submittedAt: -1 
});
```

### Caching Strategy
```javascript
// Redis Caching
const redis = require('redis');
const client = redis.createClient();

const cacheExpenses = async (key, data) => {
  await client.setEx(key, 3600, JSON.stringify(data)); // 1 hour cache
};

const getCachedExpenses = async (key) => {
  const cached = await client.get(key);
  return cached ? JSON.parse(cached) : null;
};

// Application-level caching
const NodeCache = require('node-cache');
const myCache = new NodeCache({ stdTTL: 600 }); // 10 minutes
```

### File Upload Optimization
```javascript
// Image Processing with Sharp
const sharp = require('sharp');

const processReceiptImage = async (buffer) => {
  return await sharp(buffer)
    .resize(1200, null, { withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
};

// Chunked Upload for Large Files
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    cb(null, allowedTypes.includes(file.mimetype));
  }
});
```

## 📊 Monitoring & Logging

### Application Monitoring
```javascript
// Winston Logging Configuration
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'expense-management' },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

// Request Logging Middleware
const expressWinston = require('express-winston');
app.use(expressWinston.logger({
  winstonInstance: logger,
  meta: true,
  msg: "HTTP {{req.method}} {{req.url}}",
  expressFormat: true
}));
```

### Health Checks
```javascript
// Health Check Endpoint
app.get('/health', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    checks: {
      database: 'OK',
      redis: 'OK',
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    }
  };

  try {
    // Check database connection
    await mongoose.connection.db.admin().ping();
    health.checks.database = 'OK';
  } catch (error) {
    health.checks.database = 'ERROR';
    health.message = 'UNHEALTHY';
  }

  const statusCode = health.message === 'OK' ? 200 : 503;
  res.status(statusCode).json(health);
});
```

### Performance Metrics
```javascript
// Prometheus Metrics
const promClient = require('prom-client');

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code']
});

const expenseCounter = new promClient.Counter({
  name: 'expenses_total',
  help: 'Total number of expenses created',
  labelNames: ['status', 'category']
});
```

This comprehensive architecture documentation provides the foundation for building, deploying, and maintaining the NextGen Expense Management System. The system is designed to be scalable, secure, and maintainable with modern best practices.