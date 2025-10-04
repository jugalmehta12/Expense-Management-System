# 🚀 Production Deployment Guide

## Complete Enterprise Deployment Strategy

This guide provides step-by-step instructions for deploying the Enterprise Expense Management System to production environments with high availability, security, and scalability.

---

## 📋 Pre-Deployment Checklist

### Environment Preparation
- [ ] **Production servers provisioned** (AWS/Azure/GCP)
- [ ] **Domain name configured** with SSL certificates
- [ ] **CDN setup** for global content delivery
- [ ] **Load balancer configured** for high availability
- [ ] **Database clusters provisioned** (MongoDB replica sets)
- [ ] **Redis cluster setup** for caching and sessions
- [ ] **Monitoring tools configured** (New Relic, DataDog, etc.)
- [ ] **Backup strategies implemented**
- [ ] **Security scanning completed**

### Code Preparation
- [ ] **Environment variables configured**
- [ ] **Security secrets rotated**
- [ ] **Database migrations prepared**
- [ ] **Build artifacts optimized**
- [ ] **Performance testing completed**
- [ ] **Security penetration testing done**

---

## 🏗️ Infrastructure Architecture

### Recommended Production Architecture

```
Internet → CDN → Load Balancer → Web Servers (Frontend)
                    ↓
              API Gateway → App Servers (Backend)
                    ↓
        Database Cluster ← Cache Cluster
                    ↓
          File Storage (S3/Azure Blob)
```

### Server Specifications

#### **Frontend Servers (2+ instances)**
- **CPU**: 2-4 vCPUs
- **RAM**: 4-8 GB
- **Storage**: 50 GB SSD
- **OS**: Ubuntu 22.04 LTS or Amazon Linux 2

#### **Backend API Servers (3+ instances)**
- **CPU**: 4-8 vCPUs  
- **RAM**: 8-16 GB
- **Storage**: 100 GB SSD
- **OS**: Ubuntu 22.04 LTS or Amazon Linux 2

#### **Database Servers (3+ instances for replica set)**
- **CPU**: 8-16 vCPUs
- **RAM**: 32-64 GB
- **Storage**: 500 GB SSD (expandable)
- **OS**: Ubuntu 22.04 LTS

#### **Redis Cache Servers (3+ instances)**
- **CPU**: 2-4 vCPUs
- **RAM**: 8-16 GB
- **Storage**: 50 GB SSD
- **OS**: Ubuntu 22.04 LTS

---

## 🐳 Docker Deployment

### Frontend Dockerfile
```dockerfile
# Frontend Production Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Backend Dockerfile
```dockerfile
# Backend Production Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodeuser -u 1001
USER nodeuser

EXPOSE 5000
CMD ["node", "server.js"]
```

### Docker Compose Production
```yaml
version: '3.8'

services:
  frontend:
    build: ./client
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
    restart: unless-stopped

  backend:
    build: ./server
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - mongodb
      - redis
    restart: unless-stopped

  mongodb:
    image: mongo:7.0
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=${MONGO_USERNAME}
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASSWORD}
    volumes:
      - mongodb_data:/data/db
      - ./mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

volumes:
  mongodb_data:
  redis_data:
```

---

## ☁️ Cloud Platform Deployment

### AWS Deployment with ECS

#### ECS Task Definition
```json
{
  "family": "expense-management-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "expense-backend",
      "image": "your-account.dkr.ecr.region.amazonaws.com/expense-backend:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:prod/expense-management/database"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:prod/expense-management/jwt"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/expense-management",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### Terraform Configuration
```hcl
# main.tf
provider "aws" {
  region = var.aws_region
}

# VPC and Networking
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "expense-management-vpc"
  }
}

resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "expense-management-private-${count.index + 1}"
  }
}

resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 10}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "expense-management-public-${count.index + 1}"
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "expense-management"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "expense-management-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = true
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier     = "expense-management-db"
  engine         = "postgres"
  engine_version = "14.9"
  instance_class = "db.t3.large"
  
  allocated_storage     = 100
  max_allocated_storage = 1000
  storage_type          = "gp2"
  storage_encrypted     = true
  
  db_name  = "expense_management"
  username = var.db_username
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = false
  final_snapshot_identifier = "expense-management-final-snapshot"
  
  tags = {
    Name = "expense-management-database"
  }
}

# ElastiCache Redis Cluster
resource "aws_elasticache_subnet_group" "main" {
  name       = "expense-management-cache-subnet"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_elasticache_replication_group" "main" {
  replication_group_id         = "expense-management-redis"
  description                  = "Redis cluster for expense management"
  
  node_type                    = "cache.t3.micro"
  port                         = 6379
  parameter_group_name         = "default.redis7"
  
  num_cache_clusters           = 2
  automatic_failover_enabled   = true
  multi_az_enabled            = true
  
  subnet_group_name           = aws_elasticache_subnet_group.main.name
  security_group_ids          = [aws_security_group.redis.id]
  
  at_rest_encryption_enabled  = true
  transit_encryption_enabled  = true
  auth_token                  = var.redis_auth_token
}
```

### Azure Deployment with Container Instances

#### Azure Resource Manager Template
```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "containerGroupName": {
      "type": "string",
      "defaultValue": "expense-management"
    },
    "location": {
      "type": "string",
      "defaultValue": "[resourceGroup().location]"
    }
  },
  "resources": [
    {
      "type": "Microsoft.ContainerInstance/containerGroups",
      "apiVersion": "2021-09-01",
      "name": "[parameters('containerGroupName')]",
      "location": "[parameters('location')]",
      "properties": {
        "containers": [
          {
            "name": "expense-backend",
            "properties": {
              "image": "your-registry.azurecr.io/expense-backend:latest",
              "ports": [
                {
                  "port": 5000,
                  "protocol": "TCP"
                }
              ],
              "environmentVariables": [
                {
                  "name": "NODE_ENV",
                  "value": "production"
                }
              ],
              "resources": {
                "requests": {
                  "cpu": 2.0,
                  "memoryInGB": 4.0
                }
              }
            }
          }
        ],
        "osType": "Linux",
        "ipAddress": {
          "type": "Public",
          "ports": [
            {
              "port": 5000,
              "protocol": "TCP"
            }
          ]
        }
      }
    }
  ]
}
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]
  release:
    types: [ published ]

env:
  NODE_VERSION: '18'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          cd client && npm ci
          cd ../server && npm ci
          cd ../integrations && npm ci
          cd ../ai-services && pip install -r requirements.txt
      
      - name: Run tests
        run: |
          cd client && npm test -- --coverage --watchAll=false
          cd ../server && npm test -- --coverage
          cd ../integrations && npm test -- --coverage
      
      - name: Run security audit
        run: |
          cd client && npm audit --audit-level high
          cd ../server && npm audit --audit-level high
          cd ../integrations && npm audit --audit-level high
      
      - name: Run linting
        run: |
          cd client && npm run lint
          cd ../server && npm run lint
          cd ../integrations && npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Build and push Frontend
        uses: docker/build-push-action@v5
        with:
          context: ./client
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-frontend:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
      
      - name: Build and push Backend
        uses: docker/build-push-action@v5
        with:
          context: ./server
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-backend:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
      
      - name: Build and push Integrations
        uses: docker/build-push-action@v5
        with:
          context: ./integrations
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-integrations:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to AWS ECS
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: .aws/task-definition.json
          service: expense-management-service
          cluster: expense-management-cluster
          wait-for-service-stability: true
      
      - name: Run database migrations
        run: |
          # Run database migrations
          kubectl exec -it deployment/expense-backend -- npm run migrate
      
      - name: Health check
        run: |
          # Wait for deployment to be ready
          sleep 60
          
          # Check health endpoints
          curl -f https://api.expensemanagement.com/health || exit 1
          curl -f https://expensemanagement.com/health || exit 1
      
      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        if: always()
```

---

## 🔐 Security Configuration

### SSL/TLS Configuration
```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name expensemanagement.com;
    
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:; frame-ancestors 'none';" always;
    
    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api {
        proxy_pass http://backend:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Environment Variables Security
```bash
# Use AWS Secrets Manager or Azure Key Vault
export JWT_SECRET=$(aws secretsmanager get-secret-value --secret-id prod/jwt-secret --query SecretString --output text)
export DATABASE_URL=$(aws secretsmanager get-secret-value --secret-id prod/database-url --query SecretString --output text)
export REDIS_URL=$(aws secretsmanager get-secret-value --secret-id prod/redis-url --query SecretString --output text)
```

---

## 📊 Monitoring & Observability

### Application Performance Monitoring
```javascript
// server/middleware/monitoring.js
const newrelic = require('newrelic');
const prometheus = require('prom-client');

// Create metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

const httpRequestTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

module.exports = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);
    
    httpRequestTotal
      .labels(req.method, route, res.statusCode)
      .inc();
  });
  
  next();
};
```

### Health Check Endpoints
```javascript
// server/routes/health.js
const express = require('express');
const mongoose = require('mongoose');
const redis = require('redis');
const router = express.Router();

router.get('/health', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    checks: {}
  };
  
  try {
    // Check database connection
    if (mongoose.connection.readyState === 1) {
      health.checks.database = 'connected';
    } else {
      health.checks.database = 'disconnected';
      health.message = 'Degraded';
    }
    
    // Check Redis connection
    const redisClient = redis.createClient(process.env.REDIS_URL);
    await redisClient.ping();
    health.checks.redis = 'connected';
    await redisClient.quit();
    
    // Check external services
    health.checks.currency_api = await checkCurrencyAPI();
    health.checks.ocr_service = await checkOCRService();
    
    res.status(200).json(health);
  } catch (error) {
    health.message = 'Error';
    health.error = error.message;
    res.status(503).json(health);
  }
});

module.exports = router;
```

---

## 🔄 Backup & Recovery

### Database Backup Strategy
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mongodb"
S3_BUCKET="expense-management-backups"

# Create backup directory
mkdir -p $BACKUP_DIR

# Perform MongoDB backup
mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/backup_$DATE"

# Compress backup
tar -czf "$BACKUP_DIR/backup_$DATE.tar.gz" -C "$BACKUP_DIR" "backup_$DATE"

# Upload to S3
aws s3 cp "$BACKUP_DIR/backup_$DATE.tar.gz" "s3://$S3_BUCKET/mongodb/"

# Clean up local files older than 7 days
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete

# Remove local backup directory
rm -rf "$BACKUP_DIR/backup_$DATE"

echo "Backup completed: backup_$DATE.tar.gz"
```

### Disaster Recovery Plan
```yaml
# disaster-recovery.yml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: backup-cronjob
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: mongo:7.0
            command:
            - /bin/bash
            - -c
            - |
              mongodump --uri="$MONGODB_URI" --out="/backup"
              tar -czf "/backup/backup_$(date +%Y%m%d_%H%M%S).tar.gz" -C "/backup" .
              aws s3 cp "/backup/*.tar.gz" "s3://expense-management-backups/"
            env:
            - name: MONGODB_URI
              valueFrom:
                secretKeyRef:
                  name: mongodb-secret
                  key: uri
            - name: AWS_ACCESS_KEY_ID
              valueFrom:
                secretKeyRef:
                  name: aws-secret
                  key: access-key-id
            - name: AWS_SECRET_ACCESS_KEY
              valueFrom:
                secretKeyRef:
                  name: aws-secret
                  key: secret-access-key
          restartPolicy: OnFailure
```

---

## 🚀 Performance Optimization

### Frontend Optimization
- **Code Splitting**: Implement route-based code splitting
- **CDN**: Use CloudFront or Azure CDN for static assets
- **Image Optimization**: Implement WebP format with fallbacks
- **Caching**: Implement service worker for offline capability
- **Minification**: Use production builds with minification

### Backend Optimization
- **Connection Pooling**: Configure MongoDB connection pooling
- **Caching Strategy**: Implement Redis caching for frequently accessed data
- **Database Indexing**: Create proper database indexes
- **Load Balancing**: Use multiple backend instances
- **API Rate Limiting**: Implement rate limiting for API endpoints

---

## 📈 Scaling Strategy

### Horizontal Scaling
- **Auto Scaling Groups**: Configure auto-scaling based on CPU/memory usage
- **Load Balancers**: Distribute traffic across multiple instances
- **Database Sharding**: Implement MongoDB sharding for large datasets
- **Microservices**: Consider breaking down into microservices

### Vertical Scaling
- **Instance Upgrades**: Upgrade server specifications as needed
- **Database Optimization**: Optimize queries and add indexes
- **Caching**: Implement multi-layer caching strategy

---

## 📞 Support & Maintenance

### Monitoring Alerts
```yaml
# alerting-rules.yml
groups:
- name: expense-management
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: High error rate detected
      description: Error rate is {{ $value }} errors per second
  
  - alert: DatabaseConnectionIssue
    expr: mongodb_connections_available < 10
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: Low database connections available
      description: Only {{ $value }} database connections available
```

### Maintenance Windows
- **Scheduled Maintenance**: Every Sunday 2-4 AM UTC
- **Security Updates**: Monthly security patches
- **Dependency Updates**: Quarterly dependency updates
- **Performance Reviews**: Monthly performance analysis

---

This comprehensive deployment guide provides everything needed to successfully deploy and maintain the Enterprise Expense Management System in production environments. Follow security best practices, implement proper monitoring, and maintain regular backups for optimal system reliability.