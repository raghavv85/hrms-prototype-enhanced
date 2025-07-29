const { sequelize } = require('../config/database-sequelize');
const { DataTypes } = require('sequelize');

// Import all models
const User = require('./User')(sequelize, DataTypes);
const Employee = require('./Employee')(sequelize, DataTypes);
const Attendance = require('./Attendance')(sequelize, DataTypes);
const Performance = require('./Performance')(sequelize, DataTypes);
const Payroll = require('./Payroll')(sequelize, DataTypes);

// Define associations
const defineAssociations = () => {
  // Employee associations
  Employee.hasMany(Attendance, { foreignKey: 'employeeId', as: 'attendanceRecords' });
  Employee.hasMany(Performance, { foreignKey: 'employeeId', as: 'performanceRecords' });
  Employee.hasMany(Payroll, { foreignKey: 'employeeId', as: 'payrollRecords' });

  // Attendance associations
  Attendance.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

  // Performance associations
  Performance.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

  // Payroll associations
  Payroll.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
};

// Initialize associations
defineAssociations();

// Database sync function
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log(`✅ Database ${force ? 'recreated' : 'synchronized'} successfully.`);
  } catch (error) {
    console.error('❌ Database synchronization failed:', error);
    throw error;
  }
};

// Seed initial data
const seedDatabase = async () => {
  try {
    // Check if users already exist
    const userCount = await User.count();
    if (userCount > 0) {
      console.log('📊 Database already contains data, skipping seed.');
      return;
    }

    console.log('🌱 Seeding initial data...');

    // Create default users
    await User.bulkCreate([
      {
        username: 'hradmin',
        password: 'password', // Will be hashed by the model
        role: 'HR_ADMIN',
        email: 'hradmin@company.com',
        isActive: true
      },
      {
        username: 'teamlead',
        password: 'password', // Will be hashed by the model
        role: 'TEAM_LEAD',
        email: 'teamlead@company.com',
        isActive: true
      }
    ]);

    console.log('✅ Initial data seeded successfully.');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  User,
  Employee,
  Attendance,
  Performance,
  Payroll,
  syncDatabase,
  seedDatabase
};
