const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Company = require('../models/Company');
const Expense = require('../models/Expense');
require('dotenv').config();

// Sample data
const sampleCompanies = [
  {
    name: 'TechCorp Solutions Inc.',
    code: 'TECH',
    country: 'USA',
    defaultCurrency: 'USD',
    industry: 'Technology',
    size: 'medium',
    address: {
      street: '123 Silicon Valley Blvd',
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      zipCode: '94105'
    },
    email: 'contact@techcorp.com',
    phone: '+1-555-0123',
    website: 'https://techcorp.com',
    settings: {
      expenseCategories: [
        { name: 'Travel', icon: 'flight', maxAmount: 2000, requiresReceipt: true },
        { name: 'Meals', icon: 'restaurant', maxAmount: 100, requiresReceipt: true },
        { name: 'Office', icon: 'business', maxAmount: 500, requiresReceipt: false },
        { name: 'Equipment', icon: 'computer', maxAmount: 1000, requiresReceipt: true },
        { name: 'Transportation', icon: 'directions_car', maxAmount: 200, requiresReceipt: false },
        { name: 'Accommodation', icon: 'hotel', maxAmount: 300, requiresReceipt: true }
      ],
      approvalRules: {
        defaultFlow: ['manager', 'finance'],
        amountThresholds: [
          { amount: 500, approvers: ['manager'], rule: 'all' },
          { amount: 1000, approvers: ['manager', 'finance'], rule: 'all' },
          { amount: 5000, approvers: ['manager', 'finance', 'director'], rule: 'all' }
        ]
      },
      fiscalYear: {
        startMonth: 1,
        endMonth: 12
      },
      currency: {
        primary: 'USD',
        supported: ['USD', 'EUR', 'GBP'],
        exchangeRateProvider: 'fixer.io'
      },
      policies: {
        receiptRequired: 50,
        approvalRequired: 100,
        maxExpenseAge: 90,
        allowPersonalReimbursement: true,
        requirePreApproval: false
      }
    }
  }
];

const sampleUsers = [
  {
    email: 'testuser456@example.com',
    password: 'TestPassword123!',
    firstName: 'John',
    lastName: 'Doe',
    role: 'employee',
    department: 'Engineering',
    employeeId: 'TECH-0001'
  },
  {
    email: 'manager@example.com',
    password: 'TestPassword123!',
    firstName: 'Sarah',
    lastName: 'Connor',
    role: 'manager',
    department: 'Engineering',
    employeeId: 'TECH-0002'
  },
  {
    email: 'finance@example.com',
    password: 'TestPassword123!',
    firstName: 'Mike',
    lastName: 'Johnson',
    role: 'finance',
    department: 'Finance',
    employeeId: 'TECH-0003'
  },
  {
    email: 'director@example.com',
    password: 'TestPassword123!',
    firstName: 'Lisa',
    lastName: 'Anderson',
    role: 'director',
    department: 'Operations',
    employeeId: 'TECH-0004'
  },
  {
    email: 'jane.smith@example.com',
    password: 'TestPassword123!',
    firstName: 'Jane',
    lastName: 'Smith',
    role: 'employee',
    department: 'Marketing',
    employeeId: 'TECH-0005'
  },
  {
    email: 'bob.wilson@example.com',
    password: 'TestPassword123!',
    firstName: 'Bob',
    lastName: 'Wilson',
    role: 'employee',
    department: 'Sales',
    employeeId: 'TECH-0006'
  },
  {
    email: 'alice.brown@example.com',
    password: 'TestPassword123!',
    firstName: 'Alice',
    lastName: 'Brown',
    role: 'employee',
    department: 'HR',
    employeeId: 'TECH-0007'
  }
];

const sampleExpenses = [
  {
    description: 'Business Lunch - Client Meeting with Acme Corp',
    amount: 125.50,
    currency: 'USD',
    category: 'Meals',
    date: new Date('2025-10-03'),
    status: 'submitted',
    notes: 'Discussed Q4 partnership opportunities'
  },
  {
    description: 'Hotel Stay - Boston Tech Conference',
    amount: 450.00,
    currency: 'USD',
    category: 'Accommodation',
    date: new Date('2025-10-02'),
    status: 'approved',
    notes: 'Attending annual technology summit'
  },
  {
    description: 'Taxi to Airport - Business Trip',
    amount: 45.75,
    currency: 'USD',
    category: 'Transportation',
    date: new Date('2025-10-01'),
    status: 'submitted',
    notes: 'Return trip from client visit'
  },
  {
    description: 'Office Supplies - Notebooks and Pens',
    amount: 89.25,
    currency: 'USD',
    category: 'Office',
    date: new Date('2025-09-30'),
    status: 'approved',
    notes: 'Supplies for team workshop'
  },
  {
    description: 'Flight to New York - Client Presentation',
    amount: 650.00,
    currency: 'USD',
    category: 'Travel',
    date: new Date('2025-09-28'),
    status: 'approved',
    notes: 'Quarterly business review meeting'
  },
  {
    description: 'Team Dinner - Project Completion',
    amount: 320.00,
    currency: 'USD',
    category: 'Meals',
    date: new Date('2025-09-25'),
    status: 'approved',
    notes: 'Celebrating successful project delivery'
  },
  {
    description: 'Laptop Repair - Hardware Issue',
    amount: 180.00,
    currency: 'USD',
    category: 'Equipment',
    date: new Date('2025-09-20'),
    status: 'approved',
    notes: 'Screen replacement and diagnostic'
  },
  {
    description: 'Parking Fees - Client Visit Downtown',
    amount: 25.00,
    currency: 'USD',
    category: 'Transportation',
    date: new Date('2025-09-18'),
    status: 'approved',
    notes: 'All-day parking for client meeting'
  },
  {
    description: 'Conference Registration - DevOps Summit',
    amount: 899.00,
    currency: 'USD',
    category: 'Training',
    date: new Date('2025-09-15'),
    status: 'approved',
    notes: 'Professional development opportunity'
  },
  {
    description: 'Coffee Meeting - Vendor Discussion',
    amount: 15.50,
    currency: 'USD',
    category: 'Meals',
    date: new Date('2025-09-12'),
    status: 'approved',
    notes: 'Discussing new software licensing terms'
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/expense-management');
    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Company.deleteMany({}),
      Expense.deleteMany({})
    ]);

    // Create companies
    console.log('Creating companies...');
    const createdCompanies = await Company.insertMany(sampleCompanies);
    const company = createdCompanies[0];

    // Hash passwords and create users
    console.log('Creating users...');
    const usersToCreate = await Promise.all(
      sampleUsers.map(async (userData) => {
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        return {
          ...userData,
          password: hashedPassword,
          company: company._id,
          manager: userData.role === 'employee' ? null : undefined // Will be set later
        };
      })
    );

    const createdUsers = await User.insertMany(usersToCreate);
    
    // Set manager relationships
    const manager = createdUsers.find(user => user.role === 'manager');
    if (manager) {
      await User.updateMany(
        { role: 'employee', company: company._id },
        { manager: manager._id }
      );
    }

    // Create expenses
    console.log('Creating expenses...');
    const john = createdUsers.find(user => user.firstName === 'John');
    const jane = createdUsers.find(user => user.firstName === 'Jane');
    const bob = createdUsers.find(user => user.firstName === 'Bob');
    const alice = createdUsers.find(user => user.firstName === 'Alice');

    const expensesToCreate = sampleExpenses.map((expenseData, index) => {
      // Rotate between different users
      const users = [john, jane, bob, alice];
      const submittedBy = users[index % users.length];
      
      return {
        ...expenseData,
        submittedBy: submittedBy._id,
        company: company._id,
        expenseNumber: `EXP-${String(index + 1).padStart(3, '0')}`,
        receiptRequired: expenseData.amount > 50,
        approvalFlow: [
          {
            approver: manager._id,
            role: 'manager',
            status: expenseData.status === 'approved' ? 'approved' : 
                   expenseData.status === 'submitted' ? 'pending' : 'pending',
            comments: expenseData.status === 'approved' ? 'Approved for business purposes' : '',
            timestamp: expenseData.status === 'approved' ? new Date() : new Date()
          }
        ],
        ocrData: index % 3 === 0 ? {
          processed: true,
          confidence: 95 + Math.random() * 5,
          extractedText: `Receipt for ${expenseData.description}`,
          extractedAmount: expenseData.amount,
          extractedDate: expenseData.date,
          extractedVendor: 'Sample Vendor Inc.'
        } : null
      };
    });

    await Expense.insertMany(expensesToCreate);

    console.log('Database seeded successfully!');
    console.log('\nTest Credentials:');
    console.log('Employee: testuser456@example.com / TestPassword123!');
    console.log('Manager: manager@example.com / TestPassword123!');
    console.log('Finance: finance@example.com / TestPassword123!');
    console.log('Director: director@example.com / TestPassword123!');
    console.log('\nCompany Code: TECH');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeder
seedDatabase();