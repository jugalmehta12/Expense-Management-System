# 🧪 Comprehensive Testing Strategy

## Enterprise Testing Framework

This document outlines the complete testing strategy for the Enterprise Expense Management System, covering unit tests, integration tests, end-to-end tests, performance tests, and security tests.

---

## 📋 Testing Overview

### Testing Pyramid
```
     /\
    /  \   E2E Tests (10%)
   /____\
  /      \  Integration Tests (20%)
 /________\
/          \ Unit Tests (70%)
\__________/
```

### Testing Types
- **Unit Tests**: Test individual components and functions
- **Integration Tests**: Test API endpoints and database interactions
- **End-to-End Tests**: Test complete user workflows
- **Performance Tests**: Test system performance under load
- **Security Tests**: Test for vulnerabilities and security issues
- **Accessibility Tests**: Test for WCAG compliance
- **Mobile Tests**: Test mobile app functionality

---

## 🔧 Unit Testing

### Frontend Unit Tests (React/Jest)

#### Test Configuration
```javascript
// client/jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/__mocks__/fileMock.js'
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js',
    '!src/serviceWorker.js',
    '!src/**/*.test.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

#### Component Tests
```javascript
// client/src/components/__tests__/ExpenseForm.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import ExpenseForm from '../ExpenseForm';

const mockStore = configureStore([]);

const renderWithProviders = (component, initialState = {}) => {
  const store = mockStore(initialState);
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  );
};

describe('ExpenseForm', () => {
  const mockExpense = {
    id: '1',
    title: 'Test Expense',
    amount: 100,
    category: 'Meals',
    date: '2024-01-15',
    description: 'Test description'
  };

  it('renders expense form correctly', () => {
    renderWithProviders(<ExpenseForm />);
    
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderWithProviders(<ExpenseForm />);
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      expect(screen.getByText(/amount is required/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const onSubmit = jest.fn();
    renderWithProviders(<ExpenseForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: mockExpense.title }
    });
    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: mockExpense.amount }
    });
    fireEvent.change(screen.getByLabelText(/category/i), {
      target: { value: mockExpense.category }
    });

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: mockExpense.title,
          amount: mockExpense.amount,
          category: mockExpense.category
        })
      );
    });
  });

  it('handles file upload', async () => {
    renderWithProviders(<ExpenseForm />);
    
    const file = new File(['test'], 'receipt.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText(/upload receipt/i);
    
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/receipt.pdf/i)).toBeInTheDocument();
    });
  });
});
```

#### Redux Store Tests
```javascript
// client/src/store/__tests__/expenseSlice.test.js
import expenseReducer, {
  addExpense,
  updateExpense,
  deleteExpense,
  setExpenses
} from '../slices/expenseSlice';

describe('expense slice', () => {
  const initialState = {
    expenses: [],
    loading: false,
    error: null
  };

  const mockExpense = {
    id: '1',
    title: 'Test Expense',
    amount: 100,
    category: 'Meals'
  };

  it('should return the initial state', () => {
    expect(expenseReducer(undefined, { type: undefined })).toEqual(initialState);
  });

  it('should handle addExpense', () => {
    const actual = expenseReducer(initialState, addExpense(mockExpense));
    expect(actual.expenses).toHaveLength(1);
    expect(actual.expenses[0]).toEqual(mockExpense);
  });

  it('should handle updateExpense', () => {
    const stateWithExpense = {
      ...initialState,
      expenses: [mockExpense]
    };
    
    const updatedExpense = { ...mockExpense, title: 'Updated Expense' };
    const actual = expenseReducer(stateWithExpense, updateExpense(updatedExpense));
    
    expect(actual.expenses[0].title).toBe('Updated Expense');
  });

  it('should handle deleteExpense', () => {
    const stateWithExpense = {
      ...initialState,
      expenses: [mockExpense]
    };
    
    const actual = expenseReducer(stateWithExpense, deleteExpense('1'));
    expect(actual.expenses).toHaveLength(0);
  });
});
```

### Backend Unit Tests (Node.js/Jest)

#### API Controller Tests
```javascript
// server/tests/controllers/expenseController.test.js
const request = require('supertest');
const app = require('../../app');
const Expense = require('../../models/Expense');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');

jest.mock('../../models/Expense');
jest.mock('../../models/User');

describe('Expense Controller', () => {
  let authToken;
  let mockUser;

  beforeEach(() => {
    mockUser = {
      _id: 'user123',
      email: 'test@example.com',
      name: 'Test User'
    };
    
    authToken = jwt.sign({ userId: mockUser._id }, process.env.JWT_SECRET);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/expenses', () => {
    it('should create a new expense', async () => {
      const expenseData = {
        title: 'Test Expense',
        amount: 100,
        category: 'Meals',
        date: '2024-01-15'
      };

      const mockExpense = {
        _id: 'expense123',
        ...expenseData,
        user: mockUser._id
      };

      Expense.prototype.save = jest.fn().mockResolvedValue(mockExpense);
      User.findById = jest.fn().mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(expenseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(expenseData.title);
      expect(Expense.prototype.save).toHaveBeenCalled();
    });

    it('should return 400 for invalid expense data', async () => {
      const invalidData = {
        title: '', // Empty title
        amount: -100 // Negative amount
      };

      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    it('should return 401 for unauthorized request', async () => {
      const expenseData = {
        title: 'Test Expense',
        amount: 100,
        category: 'Meals'
      };

      await request(app)
        .post('/api/expenses')
        .send(expenseData)
        .expect(401);
    });
  });

  describe('GET /api/expenses', () => {
    it('should get user expenses', async () => {
      const mockExpenses = [
        { _id: '1', title: 'Expense 1', amount: 100, user: mockUser._id },
        { _id: '2', title: 'Expense 2', amount: 200, user: mockUser._id }
      ];

      Expense.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockExpenses)
        })
      });

      const response = await request(app)
        .get('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(Expense.find).toHaveBeenCalledWith({ user: mockUser._id });
    });

    it('should support pagination', async () => {
      const mockExpenses = Array.from({ length: 5 }, (_, i) => ({
        _id: `expense${i}`,
        title: `Expense ${i}`,
        amount: 100,
        user: mockUser._id
      }));

      Expense.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              skip: jest.fn().mockResolvedValue(mockExpenses.slice(0, 2))
            })
          })
        })
      });

      Expense.countDocuments = jest.fn().mockResolvedValue(5);

      const response = await request(app)
        .get('/api/expenses?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.total).toBe(5);
      expect(response.body.pagination.page).toBe(1);
    });
  });
});
```

#### Service Layer Tests
```javascript
// server/tests/services/expenseService.test.js
const ExpenseService = require('../../services/expenseService');
const Expense = require('../../models/Expense');
const AIService = require('../../services/aiService');

jest.mock('../../models/Expense');
jest.mock('../../services/aiService');

describe('ExpenseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('categorizeExpense', () => {
    it('should categorize expense using AI', async () => {
      const expenseData = {
        title: 'Starbucks Coffee',
        amount: 5.50,
        description: 'Morning coffee'
      };

      AIService.categorizeExpense = jest.fn().mockResolvedValue({
        category: 'Meals & Entertainment',
        confidence: 0.95,
        tags: ['coffee', 'beverage']
      });

      const result = await ExpenseService.categorizeExpense(expenseData);

      expect(result.category).toBe('Meals & Entertainment');
      expect(result.confidence).toBe(0.95);
      expect(AIService.categorizeExpense).toHaveBeenCalledWith(expenseData);
    });

    it('should handle AI service errors', async () => {
      const expenseData = {
        title: 'Unknown Expense',
        amount: 100
      };

      AIService.categorizeExpense = jest.fn().mockRejectedValue(
        new Error('AI service unavailable')
      );

      const result = await ExpenseService.categorizeExpense(expenseData);

      expect(result.category).toBe('Other');
      expect(result.confidence).toBe(0);
    });
  });

  describe('detectDuplicates', () => {
    it('should detect duplicate expenses', async () => {
      const newExpense = {
        title: 'Lunch at Restaurant',
        amount: 25.00,
        date: '2024-01-15',
        userId: 'user123'
      };

      const existingExpenses = [
        {
          _id: 'expense1',
          title: 'Lunch at Restaurant',
          amount: 25.00,
          date: '2024-01-15',
          user: 'user123'
        }
      ];

      Expense.find = jest.fn().mockResolvedValue(existingExpenses);

      const duplicates = await ExpenseService.detectDuplicates(newExpense);

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0]._id).toBe('expense1');
    });

    it('should not flag different expenses as duplicates', async () => {
      const newExpense = {
        title: 'Lunch at Restaurant',
        amount: 25.00,
        date: '2024-01-15',
        userId: 'user123'
      };

      const existingExpenses = [
        {
          _id: 'expense1',
          title: 'Dinner at Restaurant',
          amount: 50.00,
          date: '2024-01-15',
          user: 'user123'
        }
      ];

      Expense.find = jest.fn().mockResolvedValue(existingExpenses);

      const duplicates = await ExpenseService.detectDuplicates(newExpense);

      expect(duplicates).toHaveLength(0);
    });
  });
});
```

---

## 🔗 Integration Testing

### API Integration Tests
```javascript
// server/tests/integration/expenses.integration.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../../models/User');
const Expense = require('../../models/Expense');

describe('Expenses API Integration', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_TEST_URI);
  });

  beforeEach(async () => {
    // Clear database and create test user
    await User.deleteMany({});
    await Expense.deleteMany({});

    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });

    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Expense CRUD Operations', () => {
    it('should create, read, update, and delete expense', async () => {
      // Create expense
      const expenseData = {
        title: 'Integration Test Expense',
        amount: 150,
        category: 'Travel',
        date: '2024-01-15',
        description: 'Test expense for integration testing'
      };

      const createResponse = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(expenseData)
        .expect(201);

      const createdExpense = createResponse.body.data;
      expect(createdExpense.title).toBe(expenseData.title);

      // Read expense
      const getResponse = await request(app)
        .get(`/api/expenses/${createdExpense._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getResponse.body.data.title).toBe(expenseData.title);

      // Update expense
      const updateData = { title: 'Updated Expense Title' };
      const updateResponse = await request(app)
        .put(`/api/expenses/${createdExpense._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.data.title).toBe(updateData.title);

      // Delete expense
      await request(app)
        .delete(`/api/expenses/${createdExpense._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify deletion
      await request(app)
        .get(`/api/expenses/${createdExpense._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should handle expense filtering and search', async () => {
      // Create multiple expenses
      const expenses = [
        { title: 'Coffee', amount: 5, category: 'Meals', date: '2024-01-15' },
        { title: 'Lunch', amount: 25, category: 'Meals', date: '2024-01-15' },
        { title: 'Flight', amount: 500, category: 'Travel', date: '2024-01-16' }
      ];

      for (const expense of expenses) {
        await request(app)
          .post('/api/expenses')
          .set('Authorization', `Bearer ${authToken}`)
          .send(expense);
      }

      // Filter by category
      const categoryResponse = await request(app)
        .get('/api/expenses?category=Meals')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(categoryResponse.body.data).toHaveLength(2);

      // Search by title
      const searchResponse = await request(app)
        .get('/api/expenses?search=coffee')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(searchResponse.body.data).toHaveLength(1);
      expect(searchResponse.body.data[0].title).toBe('Coffee');

      // Filter by date range
      const dateResponse = await request(app)
        .get('/api/expenses?startDate=2024-01-16&endDate=2024-01-16')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(dateResponse.body.data).toHaveLength(1);
      expect(dateResponse.body.data[0].title).toBe('Flight');
    });
  });

  describe('File Upload Integration', () => {
    it('should upload and process receipt', async () => {
      const filePath = path.join(__dirname, '../fixtures/sample-receipt.pdf');
      
      const response = await request(app)
        .post('/api/expenses/upload-receipt')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('receipt', filePath)
        .expect(200);

      expect(response.body.data.filename).toBeDefined();
      expect(response.body.data.extractedData).toBeDefined();
      expect(response.body.data.extractedData.amount).toBeGreaterThan(0);
    });
  });
});
```

### Database Integration Tests
```javascript
// server/tests/integration/database.integration.test.js
const mongoose = require('mongoose');
const User = require('../../models/User');
const Expense = require('../../models/Expense');

describe('Database Integration', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_TEST_URI);
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Expense.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('User-Expense Relationships', () => {
    it('should maintain referential integrity', async () => {
      // Create user
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });

      // Create expense linked to user
      const expense = await Expense.create({
        title: 'Test Expense',
        amount: 100,
        category: 'Meals',
        user: user._id
      });

      // Populate user in expense
      const populatedExpense = await Expense.findById(expense._id).populate('user');
      expect(populatedExpense.user.name).toBe('Test User');

      // Test cascade deletion
      await User.findByIdAndDelete(user._id);
      const orphanedExpense = await Expense.findById(expense._id).populate('user');
      expect(orphanedExpense.user).toBeNull();
    });

    it('should handle complex queries', async () => {
      const user1 = await User.create({
        name: 'User 1',
        email: 'user1@example.com',
        password: 'password123'
      });

      const user2 = await User.create({
        name: 'User 2',
        email: 'user2@example.com',
        password: 'password123'
      });

      // Create expenses for both users
      await Expense.create([
        { title: 'Expense 1', amount: 100, category: 'Meals', user: user1._id },
        { title: 'Expense 2', amount: 200, category: 'Travel', user: user1._id },
        { title: 'Expense 3', amount: 50, category: 'Meals', user: user2._id }
      ]);

      // Aggregate query: total expenses by user
      const aggregation = await Expense.aggregate([
        {
          $group: {
            _id: '$user',
            totalAmount: { $sum: '$amount' },
            expenseCount: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        }
      ]);

      expect(aggregation).toHaveLength(2);
      
      const user1Stats = aggregation.find(stat => 
        stat.user[0]._id.toString() === user1._id.toString()
      );
      expect(user1Stats.totalAmount).toBe(300);
      expect(user1Stats.expenseCount).toBe(2);
    });
  });
});
```

---

## 🎭 End-to-End Testing

### Cypress E2E Tests
```javascript
// client/cypress/e2e/expense-management.cy.js
describe('Expense Management E2E', () => {
  beforeEach(() => {
    // Reset database and login
    cy.task('db:seed');
    cy.login('test@example.com', 'password123');
  });

  it('should complete full expense workflow', () => {
    // Navigate to expenses page
    cy.visit('/expenses');
    cy.url().should('include', '/expenses');

    // Create new expense
    cy.get('[data-cy=add-expense-btn]').click();
    cy.get('[data-cy=expense-form]').should('be.visible');

    // Fill expense form
    cy.get('[data-cy=expense-title]').type('E2E Test Expense');
    cy.get('[data-cy=expense-amount]').type('75.50');
    cy.get('[data-cy=expense-category]').select('Meals');
    cy.get('[data-cy=expense-date]').type('2024-01-15');
    cy.get('[data-cy=expense-description]').type('Automated test expense');

    // Upload receipt
    cy.get('[data-cy=receipt-upload]').selectFile('cypress/fixtures/sample-receipt.pdf');
    cy.get('[data-cy=receipt-preview]').should('be.visible');

    // Submit form
    cy.get('[data-cy=submit-expense]').click();
    cy.get('[data-cy=success-message]').should('contain', 'Expense created successfully');

    // Verify expense appears in list
    cy.get('[data-cy=expense-list]').should('contain', 'E2E Test Expense');
    cy.get('[data-cy=expense-item]').first().should('contain', '$75.50');

    // Edit expense
    cy.get('[data-cy=expense-item]').first().find('[data-cy=edit-btn]').click();
    cy.get('[data-cy=expense-title]').clear().type('Updated E2E Expense');
    cy.get('[data-cy=submit-expense]').click();
    cy.get('[data-cy=expense-list]').should('contain', 'Updated E2E Expense');

    // Filter expenses
    cy.get('[data-cy=category-filter]').select('Meals');
    cy.get('[data-cy=expense-item]').should('have.length', 1);

    // Search expenses
    cy.get('[data-cy=search-input]').type('Updated');
    cy.get('[data-cy=expense-item]').should('have.length', 1);

    // Delete expense
    cy.get('[data-cy=expense-item]').first().find('[data-cy=delete-btn]').click();
    cy.get('[data-cy=confirm-delete]').click();
    cy.get('[data-cy=expense-list]').should('not.contain', 'Updated E2E Expense');
  });

  it('should handle expense categories and analytics', () => {
    // Navigate to analytics
    cy.visit('/analytics');
    
    // Verify charts are rendered
    cy.get('[data-cy=category-chart]').should('be.visible');
    cy.get('[data-cy=monthly-trend]').should('be.visible');
    cy.get('[data-cy=expense-summary]').should('be.visible');

    // Test date range picker
    cy.get('[data-cy=date-range-picker]').click();
    cy.get('[data-cy=date-range-start]').clear().type('2024-01-01');
    cy.get('[data-cy=date-range-end]').clear().type('2024-01-31');
    cy.get('[data-cy=apply-date-range]').click();

    // Verify analytics update
    cy.get('[data-cy=loading-spinner]').should('not.exist');
    cy.get('[data-cy=total-expenses]').should('be.visible');
  });

  it('should handle mobile responsive design', () => {
    cy.viewport('iphone-x');
    
    cy.visit('/expenses');
    
    // Mobile menu should be visible
    cy.get('[data-cy=mobile-menu-toggle]').should('be.visible');
    cy.get('[data-cy=mobile-menu-toggle]').click();
    cy.get('[data-cy=mobile-nav]').should('be.visible');

    // Expense cards should stack vertically
    cy.get('[data-cy=expense-item]').should('have.css', 'width').and('match', /^(100%|[0-9]+px)$/);
  });

  it('should work offline with PWA features', () => {
    cy.visit('/expenses');
    
    // Go offline
    cy.window().then((win) => {
      win.navigator.serviceWorker.ready.then(() => {
        // Simulate offline
        cy.wrap(win).its('navigator').invoke('setOnline', false);
      });
    });

    // Try to create expense offline
    cy.get('[data-cy=add-expense-btn]').click();
    cy.get('[data-cy=expense-title]').type('Offline Expense');
    cy.get('[data-cy=expense-amount]').type('25.00');
    cy.get('[data-cy=submit-expense]').click();

    // Should show offline message
    cy.get('[data-cy=offline-notification]').should('be.visible');
    
    // Go back online
    cy.window().then((win) => {
      cy.wrap(win).its('navigator').invoke('setOnline', true);
    });

    // Data should sync
    cy.get('[data-cy=sync-notification]').should('be.visible');
    cy.get('[data-cy=expense-list]').should('contain', 'Offline Expense');
  });
});
```

### Custom Cypress Commands
```javascript
// client/cypress/support/commands.js
Cypress.Commands.add('login', (email, password) => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.get('[data-cy=email-input]').type(email);
    cy.get('[data-cy=password-input]').type(password);
    cy.get('[data-cy=login-button]').click();
    cy.url().should('not.include', '/login');
    cy.window().its('localStorage.token').should('exist');
  });
});

Cypress.Commands.add('createExpense', (expenseData) => {
  cy.request({
    method: 'POST',
    url: '/api/expenses',
    headers: {
      Authorization: `Bearer ${window.localStorage.getItem('token')}`
    },
    body: expenseData
  });
});

// Database seeding task
cy.task('db:seed', () => {
  // Implementation depends on your database setup
  // This could call a seed script or API endpoint
  return cy.exec('npm run db:seed:test');
});
```

---

## ⚡ Performance Testing

### Load Testing with Artillery
```yaml
# performance/load-test.yml
config:
  target: 'https://api.expensemanagement.com'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 300
      arrivalRate: 50
      name: "Sustained load"
    - duration: 120
      arrivalRate: 100
      name: "Peak load"
  defaults:
    headers:
      Content-Type: 'application/json'

scenarios:
  - name: "User Journey"
    weight: 70
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "test{{ $randomNumber() }}@example.com"
            password: "password123"
          capture:
            - json: "$.token"
              as: "authToken"
      - get:
          url: "/api/expenses"
          headers:
            Authorization: "Bearer {{ authToken }}"
      - post:
          url: "/api/expenses"
          headers:
            Authorization: "Bearer {{ authToken }}"
          json:
            title: "Load Test Expense {{ $randomNumber() }}"
            amount: "{{ $randomNumber(10, 500) }}"
            category: "{{ $randomPick('Meals', 'Travel', 'Office', 'Other') }}"
            date: "2024-01-15"
      - get:
          url: "/api/analytics/summary"
          headers:
            Authorization: "Bearer {{ authToken }}"

  - name: "Heavy Analytics"
    weight: 30
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "analyst{{ $randomNumber() }}@example.com"
            password: "password123"
          capture:
            - json: "$.token"
              as: "authToken"
      - get:
          url: "/api/analytics/category-breakdown"
          headers:
            Authorization: "Bearer {{ authToken }}"
      - get:
          url: "/api/analytics/monthly-trends"
          headers:
            Authorization: "Bearer {{ authToken }}"
      - get:
          url: "/api/reports/detailed?startDate=2024-01-01&endDate=2024-12-31"
          headers:
            Authorization: "Bearer {{ authToken }}"
```

### K6 Performance Tests
```javascript
// performance/k6-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

export let errorRate = new Rate('errors');

export let options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up
    { duration: '5m', target: 50 }, // Stay at 50 users
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.1'], // Error rate must be below 10%
  },
};

const BASE_URL = 'https://api.expensemanagement.com';

export function setup() {
  // Create test user
  let response = http.post(`${BASE_URL}/api/auth/register`, {
    name: 'Load Test User',
    email: `loadtest-${Date.now()}@example.com`,
    password: 'password123'
  });
  
  return { userId: response.json('user.id') };
}

export default function(data) {
  // Login
  let loginResponse = http.post(`${BASE_URL}/api/auth/login`, {
    email: `loadtest-${Date.now()}@example.com`,
    password: 'password123'
  });

  check(loginResponse, {
    'login successful': (resp) => resp.status === 200,
    'token received': (resp) => resp.json('token') !== undefined,
  }) || errorRate.add(1);

  if (loginResponse.status !== 200) return;

  let authToken = loginResponse.json('token');
  let headers = { 
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };

  // Get expenses
  let expensesResponse = http.get(`${BASE_URL}/api/expenses`, { headers });
  check(expensesResponse, {
    'expenses retrieved': (resp) => resp.status === 200,
  }) || errorRate.add(1);

  // Create expense
  let createResponse = http.post(`${BASE_URL}/api/expenses`, JSON.stringify({
    title: `Load Test Expense ${Math.random()}`,
    amount: Math.floor(Math.random() * 500) + 10,
    category: 'Testing',
    date: '2024-01-15'
  }), { headers });

  check(createResponse, {
    'expense created': (resp) => resp.status === 201,
  }) || errorRate.add(1);

  // Get analytics
  let analyticsResponse = http.get(`${BASE_URL}/api/analytics/summary`, { headers });
  check(analyticsResponse, {
    'analytics retrieved': (resp) => resp.status === 200,
  }) || errorRate.add(1);

  sleep(1);
}

export function teardown(data) {
  // Cleanup test data if needed
}
```

---

## 🔒 Security Testing

### OWASP ZAP Automated Security Testing
```python
# security/zap_security_test.py
import requests
import json
import time
from zapv2 import ZAPv2

class SecurityTester:
    def __init__(self, target_url, zap_proxy='http://127.0.0.1:8080'):
        self.target_url = target_url
        self.zap = ZAPv2(proxies={'http': zap_proxy, 'https': zap_proxy})
        
    def run_security_tests(self):
        print("Starting OWASP ZAP Security Tests...")
        
        # Start spider scan
        print("Starting spider scan...")
        spider_id = self.zap.spider.scan(self.target_url)
        
        # Wait for spider to complete
        while int(self.zap.spider.status(spider_id)) < 100:
            print(f"Spider progress: {self.zap.spider.status(spider_id)}%")
            time.sleep(5)
            
        print("Spider scan completed")
        
        # Start active scan
        print("Starting active scan...")
        active_scan_id = self.zap.ascan.scan(self.target_url)
        
        # Wait for active scan to complete
        while int(self.zap.ascan.status(active_scan_id)) < 100:
            print(f"Active scan progress: {self.zap.ascan.status(active_scan_id)}%")
            time.sleep(10)
            
        print("Active scan completed")
        
        # Generate report
        self.generate_report()
        
    def generate_report(self):
        # Get alerts
        alerts = self.zap.core.alerts()
        
        high_risk = [alert for alert in alerts if alert['risk'] == 'High']
        medium_risk = [alert for alert in alerts if alert['risk'] == 'Medium']
        
        report = {
            'summary': {
                'total_alerts': len(alerts),
                'high_risk': len(high_risk),
                'medium_risk': len(medium_risk),
                'low_risk': len([alert for alert in alerts if alert['risk'] == 'Low'])
            },
            'high_risk_vulnerabilities': high_risk,
            'medium_risk_vulnerabilities': medium_risk
        }
        
        # Save report
        with open('security_report.json', 'w') as f:
            json.dump(report, f, indent=2)
            
        print(f"Security report generated: {report['summary']}")
        
        # Fail if high risk vulnerabilities found
        if len(high_risk) > 0:
            raise Exception(f"High risk vulnerabilities found: {len(high_risk)}")

if __name__ == "__main__":
    tester = SecurityTester("https://expensemanagement.com")
    tester.run_security_tests()
```

### SQL Injection Testing
```javascript
// security/sql-injection.test.js
const request = require('supertest');
const app = require('../../server/app');

describe('SQL Injection Security Tests', () => {
  const sqlInjectionPayloads = [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "' UNION SELECT * FROM users --",
    "1' OR '1'='1' /*",
    "'; INSERT INTO users VALUES('hacker','password'); --"
  ];

  sqlInjectionPayloads.forEach(payload => {
    it(`should prevent SQL injection with payload: ${payload}`, async () => {
      // Test login endpoint
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: payload,
          password: 'password'
        });

      // Should not result in successful login or SQL error
      expect(response.status).not.toBe(200);
      expect(response.body.message).not.toContain('SQL');
      expect(response.body.message).not.toContain('syntax error');
    });

    it(`should prevent SQL injection in search with payload: ${payload}`, async () => {
      const authToken = await getAuthToken();
      
      const response = await request(app)
        .get(`/api/expenses?search=${encodeURIComponent(payload)}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Should not result in SQL error or unauthorized data access
      expect(response.status).toBeLessThan(500);
      if (response.status === 200) {
        expect(response.body.data).toBeDefined();
        // Verify response doesn't contain sensitive data
        expect(JSON.stringify(response.body)).not.toContain('password');
        expect(JSON.stringify(response.body)).not.toContain('credit_card');
      }
    });
  });
});
```

### XSS Testing
```javascript
// security/xss.test.js
const request = require('supertest');
const app = require('../../server/app');

describe('XSS Security Tests', () => {
  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '<img src="x" onerror="alert(1)">',
    'javascript:alert("XSS")',
    '<svg onload="alert(1)">',
    '"><script>alert("XSS")</script>'
  ];

  xssPayloads.forEach(payload => {
    it(`should prevent XSS with payload: ${payload}`, async () => {
      const authToken = await getAuthToken();
      
      // Test expense creation with XSS payload
      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: payload,
          amount: 100,
          category: 'Testing',
          description: payload
        });

      if (response.status === 201) {
        // Verify the response doesn't contain unescaped script tags
        expect(response.body.data.title).not.toBe(payload);
        expect(response.body.data.description).not.toBe(payload);
        
        // Verify data is properly escaped
        expect(response.body.data.title).not.toContain('<script>');
        expect(response.body.data.description).not.toContain('<script>');
      }
    });
  });
});
```

---

## 📱 Mobile Testing

### React Native Testing with Detox
```javascript
// mobile/__tests__/e2e/expense.e2e.js
const { device, expect, element, by, waitFor } = require('detox');

describe('Mobile Expense App E2E', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should login successfully', async () => {
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();
    
    await waitFor(element(by.id('expense-list')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should create expense with camera', async () => {
    // Login first
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();
    
    await waitFor(element(by.id('expense-list'))).toBeVisible();
    
    // Create new expense
    await element(by.id('add-expense-fab')).tap();
    
    // Fill form
    await element(by.id('expense-title')).typeText('Mobile Test Expense');
    await element(by.id('expense-amount')).typeText('50.00');
    
    // Take photo
    await element(by.id('camera-button')).tap();
    await element(by.id('take-photo')).tap();
    await element(by.id('use-photo')).tap();
    
    // Submit
    await element(by.id('submit-expense')).tap();
    
    await waitFor(element(by.text('Mobile Test Expense')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should work offline', async () => {
    // Login and create expense offline
    await device.setNetworkConnection(false);
    
    await element(by.id('add-expense-fab')).tap();
    await element(by.id('expense-title')).typeText('Offline Expense');
    await element(by.id('expense-amount')).typeText('25.00');
    await element(by.id('submit-expense')).tap();
    
    // Should show offline indicator
    await expect(element(by.id('offline-banner'))).toBeVisible();
    
    // Go back online
    await device.setNetworkConnection(true);
    
    // Should sync
    await waitFor(element(by.id('sync-success')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('should handle biometric authentication', async () => {
    // Enable biometric auth in settings
    await element(by.id('settings-tab')).tap();
    await element(by.id('biometric-toggle')).tap();
    
    // Logout and try to login with biometric
    await element(by.id('logout-button')).tap();
    await element(by.id('biometric-login')).tap();
    
    // Simulate successful biometric auth
    await device.setBiometricEnrollment(true);
    await device.matchBiometric();
    
    await waitFor(element(by.id('expense-list')))
      .toBeVisible()
      .withTimeout(5000);
  });
});
```

---

## ♿ Accessibility Testing

### Accessibility Test Suite
```javascript
// client/src/__tests__/accessibility.test.js
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import ExpenseForm from '../components/ExpenseForm';
import ExpenseList from '../components/ExpenseList';
import Dashboard from '../pages/Dashboard';

expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
  it('ExpenseForm should not have accessibility violations', async () => {
    const { container } = render(<ExpenseForm />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('ExpenseList should not have accessibility violations', async () => {
    const mockExpenses = [
      { id: '1', title: 'Test Expense', amount: 100, category: 'Meals' }
    ];
    
    const { container } = render(<ExpenseList expenses={mockExpenses} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Dashboard should not have accessibility violations', async () => {
    const { container } = render(<Dashboard />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper keyboard navigation', async () => {
    const { getByRole } = render(<ExpenseForm />);
    
    const titleInput = getByRole('textbox', { name: /title/i });
    const amountInput = getByRole('textbox', { name: /amount/i });
    const submitButton = getByRole('button', { name: /submit/i });
    
    // Test tab order
    titleInput.focus();
    expect(document.activeElement).toBe(titleInput);
    
    // Simulate tab key
    userEvent.tab();
    expect(document.activeElement).toBe(amountInput);
    
    userEvent.tab();
    expect(document.activeElement).toBe(submitButton);
  });

  it('should have proper ARIA labels', () => {
    const { getByLabelText, getByRole } = render(<ExpenseForm />);
    
    expect(getByLabelText(/title/i)).toBeInTheDocument();
    expect(getByLabelText(/amount/i)).toBeInTheDocument();
    expect(getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });
});
```

---

## 📊 Test Reporting

### Test Coverage Report Configuration
```javascript
// jest.config.js
module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/components/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js',
    '!src/serviceWorker.js',
    '!src/**/*.test.js',
    '!src/setupTests.js'
  ]
};
```

### Automated Test Reporting
```javascript
// scripts/generate-test-report.js
const fs = require('fs');
const path = require('path');

class TestReporter {
  constructor() {
    this.results = {
      unit: null,
      integration: null,
      e2e: null,
      performance: null,
      security: null,
      accessibility: null
    };
  }

  async generateReport() {
    console.log('Generating comprehensive test report...');
    
    // Read test results
    this.results.unit = this.readJestResults('./coverage/unit-test-results.json');
    this.results.integration = this.readJestResults('./coverage/integration-test-results.json');
    this.results.e2e = this.readCypressResults('./cypress/results/results.json');
    this.results.performance = this.readPerformanceResults('./performance/results.json');
    this.results.security = this.readSecurityResults('./security/security_report.json');
    
    // Generate HTML report
    const htmlReport = this.generateHtmlReport();
    fs.writeFileSync('./test-report.html', htmlReport);
    
    // Generate summary
    const summary = this.generateSummary();
    console.log(summary);
    
    return summary;
  }

  generateSummary() {
    const summary = {
      timestamp: new Date().toISOString(),
      overall: 'PASS',
      details: {
        unit_tests: {
          total: this.results.unit?.numTotalTests || 0,
          passed: this.results.unit?.numPassedTests || 0,
          failed: this.results.unit?.numFailedTests || 0,
          coverage: this.results.unit?.coverageMap?.total?.lines?.pct || 0
        },
        integration_tests: {
          total: this.results.integration?.numTotalTests || 0,
          passed: this.results.integration?.numPassedTests || 0,
          failed: this.results.integration?.numFailedTests || 0
        },
        e2e_tests: {
          total: this.results.e2e?.totalTests || 0,
          passed: this.results.e2e?.totalPassed || 0,
          failed: this.results.e2e?.totalFailed || 0
        },
        performance: {
          status: this.results.performance?.summary?.status || 'UNKNOWN',
          avg_response_time: this.results.performance?.summary?.avg_response_time || 'N/A',
          error_rate: this.results.performance?.summary?.error_rate || 'N/A'
        },
        security: {
          vulnerabilities: this.results.security?.summary?.total_alerts || 0,
          high_risk: this.results.security?.summary?.high_risk || 0,
          medium_risk: this.results.security?.summary?.medium_risk || 0
        }
      }
    };

    // Determine overall status
    if (summary.details.unit_tests.failed > 0 ||
        summary.details.integration_tests.failed > 0 ||
        summary.details.e2e_tests.failed > 0 ||
        summary.details.security.high_risk > 0) {
      summary.overall = 'FAIL';
    }

    return summary;
  }

  readJestResults(filePath) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      console.warn(`Could not read Jest results from ${filePath}`);
      return null;
    }
  }

  readCypressResults(filePath) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      console.warn(`Could not read Cypress results from ${filePath}`);
      return null;
    }
  }

  readPerformanceResults(filePath) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      console.warn(`Could not read performance results from ${filePath}`);
      return null;
    }
  }

  readSecurityResults(filePath) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      console.warn(`Could not read security results from ${filePath}`);
      return null;
    }
  }

  generateHtmlReport() {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Test Report - Expense Management System</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; }
        .section { margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .pass { color: green; }
        .fail { color: red; }
        .warning { color: orange; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Test Report - Expense Management System</h1>
        <p>Generated: ${new Date().toISOString()}</p>
        <p>Overall Status: <span class="${this.results.overall === 'PASS' ? 'pass' : 'fail'}">${this.results.overall}</span></p>
    </div>

    <div class="section">
        <h2>Test Summary</h2>
        <table>
            <tr><th>Test Type</th><th>Total</th><th>Passed</th><th>Failed</th><th>Status</th></tr>
            <tr>
                <td>Unit Tests</td>
                <td>${this.results.unit?.numTotalTests || 0}</td>
                <td>${this.results.unit?.numPassedTests || 0}</td>
                <td>${this.results.unit?.numFailedTests || 0}</td>
                <td class="${(this.results.unit?.numFailedTests || 0) === 0 ? 'pass' : 'fail'}">
                    ${(this.results.unit?.numFailedTests || 0) === 0 ? 'PASS' : 'FAIL'}
                </td>
            </tr>
            <tr>
                <td>Integration Tests</td>
                <td>${this.results.integration?.numTotalTests || 0}</td>
                <td>${this.results.integration?.numPassedTests || 0}</td>
                <td>${this.results.integration?.numFailedTests || 0}</td>
                <td class="${(this.results.integration?.numFailedTests || 0) === 0 ? 'pass' : 'fail'}">
                    ${(this.results.integration?.numFailedTests || 0) === 0 ? 'PASS' : 'FAIL'}
                </td>
            </tr>
            <tr>
                <td>E2E Tests</td>
                <td>${this.results.e2e?.totalTests || 0}</td>
                <td>${this.results.e2e?.totalPassed || 0}</td>
                <td>${this.results.e2e?.totalFailed || 0}</td>
                <td class="${(this.results.e2e?.totalFailed || 0) === 0 ? 'pass' : 'fail'}">
                    ${(this.results.e2e?.totalFailed || 0) === 0 ? 'PASS' : 'FAIL'}
                </td>
            </tr>
        </table>
    </div>

    <div class="section">
        <h2>Code Coverage</h2>
        <p>Overall Coverage: ${this.results.unit?.coverageMap?.total?.lines?.pct || 0}%</p>
        <p>Statements: ${this.results.unit?.coverageMap?.total?.statements?.pct || 0}%</p>
        <p>Branches: ${this.results.unit?.coverageMap?.total?.branches?.pct || 0}%</p>
        <p>Functions: ${this.results.unit?.coverageMap?.total?.functions?.pct || 0}%</p>
    </div>

    <div class="section">
        <h2>Security Analysis</h2>
        <p>Total Vulnerabilities: ${this.results.security?.summary?.total_alerts || 0}</p>
        <p>High Risk: <span class="${(this.results.security?.summary?.high_risk || 0) > 0 ? 'fail' : 'pass'}">${this.results.security?.summary?.high_risk || 0}</span></p>
        <p>Medium Risk: <span class="${(this.results.security?.summary?.medium_risk || 0) > 0 ? 'warning' : 'pass'}">${this.results.security?.summary?.medium_risk || 0}</span></p>
        <p>Low Risk: ${this.results.security?.summary?.low_risk || 0}</p>
    </div>

    <div class="section">
        <h2>Performance Metrics</h2>
        <p>Average Response Time: ${this.results.performance?.summary?.avg_response_time || 'N/A'}</p>
        <p>Error Rate: ${this.results.performance?.summary?.error_rate || 'N/A'}</p>
        <p>Throughput: ${this.results.performance?.summary?.throughput || 'N/A'}</p>
    </div>
</body>
</html>
    `;
  }
}

if (require.main === module) {
  const reporter = new TestReporter();
  reporter.generateReport()
    .then(summary => {
      console.log('Test report generated successfully');
      process.exit(summary.overall === 'PASS' ? 0 : 1);
    })
    .catch(error => {
      console.error('Failed to generate test report:', error);
      process.exit(1);
    });
}

module.exports = TestReporter;
```

---

This comprehensive testing strategy provides complete coverage for the Enterprise Expense Management System. The testing framework includes unit tests, integration tests, end-to-end tests, performance tests, security tests, and accessibility tests, ensuring the highest quality and reliability of the system.