# 🏗️ NextGen Expense Management System - Visual Architecture

## System Architecture Diagram

```mermaid
architecture-beta
    group frontend(cloud)[Frontend Layer]
    group backend(server)[Backend Services]
    group database(database)[Data Layer]
    group external(internet)[External Services]
    group ai(cloud)[AI/ML Services]

    service react(server)[React App] in frontend
    service mobile(server)[Mobile App] in frontend
    
    service api_gateway(server)[API Gateway] in backend
    service auth_service(server)[Auth Service] in backend
    service expense_service(server)[Expense Service] in backend
    service approval_service(server)[Approval Service] in backend
    service ocr_service(server)[OCR Service] in backend
    service currency_service(server)[Currency Service] in backend
    service notification_service(server)[Notification Service] in backend
    service analytics_service(server)[Analytics Service] in backend
    service websocket(server)[WebSocket Server] in backend
    
    service mongodb(database)[MongoDB] in database
    service redis(database)[Redis Cache] in database
    service file_storage(disk)[File Storage] in database
    
    service currency_api(internet)[Currency APIs] in external
    service email_service(internet)[Email Service] in external
    service sms_service(internet)[SMS Service] in external
    service cloud_storage(cloud)[Cloud Storage] in external
    
    service tesseract(cloud)[Tesseract OCR] in ai
    service anomaly_detector(cloud)[Anomaly Detection] in ai
    service ml_categorizer(cloud)[Auto Categorizer] in ai
    service fraud_detector(cloud)[Fraud Detection] in ai

    react:B --> T:api_gateway
    mobile:B --> T:api_gateway
    
    api_gateway:B --> T:auth_service
    api_gateway:B --> T:expense_service
    api_gateway:B --> T:approval_service
    api_gateway:B --> T:analytics_service
    
    expense_service:B --> T:ocr_service
    expense_service:R --> L:currency_service
    expense_service:R --> L:notification_service
    approval_service:R --> L:notification_service
    
    auth_service:B --> T:mongodb
    expense_service:B --> T:mongodb
    approval_service:B --> T:mongodb
    analytics_service:B --> T:mongodb
    
    auth_service:B --> T:redis
    currency_service:B --> T:redis
    expense_service:B --> T:redis
    
    expense_service:B --> T:file_storage
    
    currency_service:R --> L:currency_api
    notification_service:R --> L:email_service
    notification_service:R --> L:sms_service
    expense_service:R --> L:cloud_storage
    
    ocr_service:R --> L:tesseract
    expense_service:R --> L:anomaly_detector
    expense_service:R --> L:ml_categorizer
    expense_service:R --> L:fraud_detector
    
    websocket:B --> T:react
    websocket:B --> T:mobile
```

## Data Flow Architecture

```mermaid
flowchart TD
    A[User Login] --> B{Authentication}
    B -->|Success| C[Dashboard]
    B -->|Failure| A
    
    C --> D[Create Expense]
    C --> E[View Expenses]
    C --> F[Pending Approvals]
    C --> G[Analytics]
    
    D --> H[Upload Receipt]
    H --> I[OCR Processing]
    I --> J[Extract Data]
    J --> K[Auto-categorize]
    K --> L[Currency Conversion]
    L --> M[Anomaly Detection]
    M --> N[Submit for Approval]
    
    N --> O{Approval Rules}
    O -->|Manager| P[Manager Approval]
    O -->|Finance| Q[Finance Approval]
    O -->|Director| R[Director Approval]
    
    P --> S{Approved?}
    Q --> S
    R --> S
    
    S -->|Yes| T[Mark Approved]
    S -->|No| U[Mark Rejected]
    
    T --> V[Reimbursement]
    U --> W[Return to Employee]
    
    V --> X[Payment Processing]
    X --> Y[Audit Log]
    
    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style I fill:#fff3e0
    style M fill:#ffebee
    style S fill:#e8f5e8
```

## Microservices Communication

```mermaid
sequenceDiagram
    participant User as 👤 User
    participant Frontend as 🖥️ React App
    participant Gateway as 🚪 API Gateway
    participant Auth as 🔐 Auth Service
    participant Expense as 💰 Expense Service
    participant OCR as 📷 OCR Service
    participant Currency as 💱 Currency Service
    participant Approval as ✅ Approval Service
    participant Notification as 📧 Notification Service
    participant Database as 🗄️ MongoDB
    
    User->>Frontend: Login Request
    Frontend->>Gateway: POST /auth/login
    Gateway->>Auth: Authenticate User
    Auth->>Database: Verify Credentials
    Database-->>Auth: User Data
    Auth-->>Gateway: JWT Token
    Gateway-->>Frontend: Authentication Response
    Frontend-->>User: Dashboard
    
    User->>Frontend: Submit Expense + Receipt
    Frontend->>Gateway: POST /expenses (with file)
    Gateway->>Expense: Create Expense
    Expense->>OCR: Process Receipt
    OCR-->>Expense: Extracted Data
    Expense->>Currency: Convert Currency
    Currency-->>Expense: Converted Amount
    Expense->>Database: Save Expense
    Expense->>Approval: Trigger Approval Flow
    Approval->>Notification: Send Approval Request
    Notification-->>Approval: Notification Sent
    Approval-->>Expense: Approval Initiated
    Expense-->>Gateway: Expense Created
    Gateway-->>Frontend: Success Response
    Frontend-->>User: Confirmation
```

## Security Architecture

```mermaid
flowchart LR
    subgraph "Security Layers"
        A[WAF/Firewall] --> B[Load Balancer]
        B --> C[API Gateway]
        C --> D[Rate Limiting]
        D --> E[Authentication]
        E --> F[Authorization]
        F --> G[Input Validation]
        G --> H[Data Encryption]
    end
    
    subgraph "Authentication Flow"
        I[JWT Tokens] --> J[Refresh Tokens]
        J --> K[Role-based Access]
        K --> L[Permission Checks]
    end
    
    subgraph "Data Protection"
        M[Encryption at Rest] --> N[Encryption in Transit]
        N --> O[Secure File Storage]
        O --> P[Audit Logging]
    end
    
    A --> I
    H --> M
    
    style A fill:#ffcdd2
    style E fill:#c8e6c9
    style H fill:#fff9c4
```

## Deployment Architecture

```mermaid
flowchart TB
    subgraph "CDN Layer"
        A[CloudFlare/AWS CloudFront]
    end
    
    subgraph "Load Balancer"
        B[Application Load Balancer]
    end
    
    subgraph "Container Orchestration"
        C[Kubernetes Cluster]
        D[Docker Containers]
        E[Auto Scaling Groups]
    end
    
    subgraph "Application Tier"
        F[React Frontend Pods]
        G[Node.js API Pods]
        H[Background Workers]
    end
    
    subgraph "Data Tier"
        I[MongoDB Cluster]
        J[Redis Cluster]
        K[File Storage S3]
    end
    
    subgraph "Monitoring"
        L[Prometheus]
        M[Grafana]
        N[ELK Stack]
    end
    
    A --> B
    B --> C
    C --> D
    C --> E
    D --> F
    D --> G
    D --> H
    G --> I
    G --> J
    G --> K
    
    L --> M
    L --> N
    
    style A fill:#e3f2fd
    style C fill:#f3e5f5
    style I fill:#e8f5e8
    style L fill:#fff3e0
```

## Database Schema Relationships

```mermaid
erDiagram
    COMPANY ||--o{ USER : "employs"
    COMPANY ||--o{ EXPENSE : "owns"
    USER ||--o{ EXPENSE : "submits"
    USER ||--o{ APPROVAL : "approves"
    EXPENSE ||--o{ APPROVAL : "requires"
    EXPENSE ||--o{ RECEIPT : "includes"
    EXPENSE ||--o{ ANOMALY_FLAG : "triggers"
    USER ||--o{ AUDIT_LOG : "creates"
    
    COMPANY {
        ObjectId id PK
        string name
        string code UK
        string country
        string defaultCurrency
        object settings
        boolean isActive
        date createdAt
        date updatedAt
    }
    
    USER {
        ObjectId id PK
        string email UK
        string password
        string firstName
        string lastName
        enum role
        ObjectId company FK
        ObjectId manager FK
        string department
        string employeeId UK
        object preferences
        boolean isActive
        date lastLogin
        date createdAt
        date updatedAt
    }
    
    EXPENSE {
        ObjectId id PK
        string expenseNumber UK
        number amount
        string currency
        date date
        string category
        string description
        string vendor
        object location
        enum status
        ObjectId submittedBy FK
        ObjectId company FK
        array approvalFlow
        array anomalyFlags
        date submittedAt
        date approvedAt
        date createdAt
        date updatedAt
    }
    
    APPROVAL {
        ObjectId id PK
        ObjectId expense FK
        ObjectId approver FK
        string role
        enum status
        string comments
        date timestamp
    }
    
    RECEIPT {
        ObjectId id PK
        ObjectId expense FK
        string filename
        string url
        number size
        string mimeType
        object ocrData
        date uploadedAt
    }
    
    ANOMALY_FLAG {
        ObjectId id PK
        ObjectId expense FK
        string type
        enum severity
        string description
        number confidence
        date detectedAt
    }
    
    AUDIT_LOG {
        ObjectId id PK
        ObjectId user FK
        string action
        string entity
        ObjectId entityId
        object changes
        string ipAddress
        string userAgent
        date timestamp
    }
```

## Technology Stack Overview

```mermaid
mindmap
  root((NextGen Expense Management))
    Frontend
      React 18
        Material-UI
        React Query
        React Router
        Socket.IO Client
      Mobile
        React Native
        Expo
    Backend
      Node.js
        Express.js
        Socket.IO
        JWT
      Microservices
        Auth Service
        Expense Service
        Approval Service
        OCR Service
        Currency Service
        Notification Service
        Analytics Service
    Database
      MongoDB
        Mongoose ODM
        Aggregation Pipeline
      Redis
        Caching
        Session Store
        Rate Limiting
      File Storage
        AWS S3
        Azure Blob
        Google Cloud Storage
    External APIs
      Currency
        ExchangeRate-API
        Fixer.io
        CurrencyAPI
      OCR
        Tesseract.js
        Google Vision API
        AWS Textract
      Notifications
        SendGrid
        Twilio
        Firebase
    AI/ML
      Anomaly Detection
        Statistical Analysis
        Pattern Recognition
      Auto Categorization
        NLP
        Machine Learning
      Fraud Detection
        Risk Scoring
        Behavioral Analysis
    DevOps
      Containerization
        Docker
        Kubernetes
      CI/CD
        GitHub Actions
        Jenkins
      Monitoring
        Prometheus
        Grafana
        ELK Stack
```

This visual architecture provides a comprehensive overview of the NextGen Expense Management System, showing all components, their relationships, data flow, security layers, and deployment structure.