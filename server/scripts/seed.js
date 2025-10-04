const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

const User = require('../models/User');
const Company = require('../models/Company');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/expense_management', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Mock company data
const createMockCompany = async () => {
  try {
    // Check if company already exists
    const existingCompany = await Company.findOne({ name: 'Test Company Inc.' });
    if (existingCompany) {
      console.log('🏢 Test company already exists');
      return existingCompany;
    }

    const company = new Company({
      name: 'Test Company Inc.',
      industry: 'Technology',
      size: 'medium',
      country: 'US',
      defaultCurrency: 'USD',
      address: {
        street: '123 Business Ave',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94105',
        country: 'US'
      },
      settings: {
        expenseCategories: [
          { name: 'Travel', icon: 'flight', requiresReceipt: true },
          { name: 'Meals & Entertainment', icon: 'restaurant', requiresReceipt: true },
          { name: 'Office Supplies', icon: 'inventory', requiresReceipt: false },
          { name: 'Software & Subscriptions', icon: 'computer', requiresReceipt: true },
          { name: 'Training & Development', icon: 'school', requiresReceipt: true },
          { name: 'Marketing', icon: 'campaign', requiresReceipt: true },
          { name: 'Other', icon: 'receipt', requiresReceipt: true }
        ],
        approvalRules: {
          defaultFlow: ['manager', 'finance'],
          amountThresholds: [
            { amount: 500, approvers: ['manager'] },
            { amount: 2000, approvers: ['manager', 'finance'] },
            { amount: 10000, approvers: ['manager', 'finance', 'director'] }
          ]
        }
      }
    });

    await company.save();
    console.log('✅ Mock company created successfully');
    return company;
  } catch (error) {
    console.error('❌ Error creating mock company:', error);
    throw error;
  }
};

// Mock users data
const createMockUsers = async (company) => {
  const mockUsers = [
    {
      firstName: 'Admin',
      lastName: 'Super',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
      department: 'IT',
      employeeId: 'ADM001',
      phone: '+1-555-0101',
      isActive: true,
      company: company._id
    },
    {
      firstName: 'Director',
      lastName: 'Chief',
      email: 'director@test.com',
      password: 'password123',
      role: 'director',
      department: 'Executive',
      employeeId: 'DIR001',
      phone: '+1-555-0102',
      isActive: true,
      company: company._id
    },
    {
      firstName: 'Finance',
      lastName: 'Manager',
      email: 'finance@test.com',
      password: 'password123',
      role: 'finance',
      department: 'Finance',
      employeeId: 'FIN001',
      phone: '+1-555-0103',
      isActive: true,
      company: company._id
    },
    {
      firstName: 'Team',
      lastName: 'Manager',
      email: 'manager@test.com',
      password: 'password123',
      role: 'manager',
      department: 'Sales',
      employeeId: 'MGR001',
      phone: '+1-555-0104',
      isActive: true,
      company: company._id
    },
    {
      firstName: 'John',
      lastName: 'Employee',
      email: 'employee@test.com',
      password: 'password123',
      role: 'employee',
      department: 'Marketing',
      employeeId: 'EMP001',
      phone: '+1-555-0105',
      isActive: true,
      company: company._id,
      managerId: null // Will be set after creating manager
    },
    {
      firstName: 'Jane',
      lastName: 'Developer',
      email: 'developer@test.com',
      password: 'password123',
      role: 'employee',
      department: 'Engineering',
      employeeId: 'EMP002',
      phone: '+1-555-0106',
      isActive: true,
      company: company._id,
      managerId: null // Will be set after creating manager
    },
    {
      firstName: 'Bob',
      lastName: 'Designer',
      email: 'designer@test.com',
      password: 'password123',
      role: 'employee',
      department: 'Design',
      employeeId: 'EMP003',
      phone: '+1-555-0107',
      isActive: true,
      company: company._id,
      managerId: null // Will be set after creating manager
    }
  ];

  try {
    // Check if users already exist
    const existingUser = await User.findOne({ email: 'admin@test.com' });
    if (existingUser) {
      console.log('👥 Mock users already exist');
      return;
    }

    const createdUsers = [];

    // Create users one by one to handle password hashing
    for (const userData of mockUsers) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
      console.log(`✅ Created user: ${user.firstName} ${user.lastName} (${user.email})`);
    }

    // Set manager relationships
    const manager = createdUsers.find(user => user.role === 'manager');
    const employees = createdUsers.filter(user => user.role === 'employee');

    for (const employee of employees) {
      employee.managerId = manager._id;
      await employee.save();
    }

    console.log('✅ All mock users created successfully');
    return createdUsers;
  } catch (error) {
    console.error('❌ Error creating mock users:', error);
    throw error;
  }
};

// Main seeding function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    await connectDB();
    
    // Create mock company
    const company = await createMockCompany();
    
    // Create mock users
    await createMockUsers(company);
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Mock Login Credentials:');
    console.log('==========================');
    console.log('Admin:     admin@test.com     / password123');
    console.log('Director:  director@test.com  / password123');
    console.log('Finance:   finance@test.com   / password123');
    console.log('Manager:   manager@test.com   / password123');
    console.log('Employee:  employee@test.com  / password123');
    console.log('Developer: developer@test.com / password123');
    console.log('Designer:  designer@test.com  / password123');
    console.log('==========================\n');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

// Clear database function
const clearDatabase = async () => {
  try {
    console.log('🧹 Clearing database...');
    
    await connectDB();
    
    await User.deleteMany({});
    await Company.deleteMany({});
    
    console.log('✅ Database cleared successfully!');
    
  } catch (error) {
    console.error('❌ Error clearing database:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

// Check command line arguments
const command = process.argv[2];

switch (command) {
  case 'seed':
    seedDatabase();
    break;
  case 'clear':
    clearDatabase();
    break;
  default:
    console.log('Usage:');
    console.log('  npm run seed       - Seed the database with mock data');
    console.log('  npm run seed clear - Clear all data from database');
    process.exit(1);
}