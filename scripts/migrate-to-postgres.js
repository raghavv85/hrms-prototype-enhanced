/**
 * Database Migration Script
 * 
 * This script migrates data from the in-memory database to PostgreSQL.
 * It creates the necessary tables and transfers all existing data.
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Import the in-memory database to extract data
const mockDb = require('../config/database');

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'hrms_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

// Path to migration SQL files
const migrationsPath = path.join(__dirname, '..', 'config', 'migrations');

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Starting database migration...');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Run schema creation script
    console.log('Creating database schema...');
    const schemaSQL = fs.readFileSync(path.join(migrationsPath, '001_initial_schema.sql'), 'utf8');
    await client.query(schemaSQL);
    
    // Migrate users from in-memory database
    console.log('Migrating users...');
    const users = mockDb.users;
    for (const user of users) {
      await client.query(
        'INSERT INTO users (username, password, email, role, first_name, last_name) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (username) DO NOTHING',
        [user.username, user.password, user.email, user.role, user.firstName || '', user.lastName || '']
      );
    }
    
    // Migrate employees
    console.log('Migrating employees...');
    const employees = mockDb.employees;
    for (const emp of employees) {
      const result = await client.query(
        `INSERT INTO employees 
         (employee_id, name, email, department, designation, date_of_joining, base_salary, phone, status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
         ON CONFLICT (employee_id) DO NOTHING
         RETURNING id`,
        [
          emp.employeeId,
          emp.name,
          emp.email,
          emp.department,
          emp.designation,
          emp.dateOfJoining,
          emp.baseSalary,
          emp.phone || '',
          emp.status || 'Active'
        ]
      );
    }
    
    // Migrate attendance records
    console.log('Migrating attendance records...');
    const attendance = mockDb.attendance;
    for (const record of attendance) {
      // Get the employee id from the employees table
      const empResult = await client.query('SELECT id FROM employees WHERE employee_id = $1', [record.employeeId]);
      if (empResult.rows.length > 0) {
        const employeeId = empResult.rows[0].id;
        await client.query(
          `INSERT INTO attendance 
           (employee_id, date, status, shift, check_in, check_out, notes) 
           VALUES ($1, $2, $3, $4, $5, $6, $7) 
           ON CONFLICT (employee_id, date) DO NOTHING`,
          [
            employeeId,
            record.date,
            record.status,
            record.shift || 'Day',
            record.checkIn,
            record.checkOut,
            record.notes || ''
          ]
        );
      }
    }
    
    // Migrate performance records
    console.log('Migrating performance records...');
    const performance = mockDb.performance;
    for (const record of performance) {
      // Get the employee id from the employees table
      const empResult = await client.query('SELECT id FROM employees WHERE employee_id = $1', [record.employeeId]);
      if (empResult.rows.length > 0) {
        const employeeId = empResult.rows[0].id;
        await client.query(
          `INSERT INTO performance 
           (employee_id, date, calls_handled, quality_score, adherence_percentage, notes) 
           VALUES ($1, $2, $3, $4, $5, $6) 
           ON CONFLICT (employee_id, date) DO NOTHING`,
          [
            employeeId,
            record.date,
            record.callsHandled,
            record.qualityScore,
            record.adherencePercentage,
            record.notes || ''
          ]
        );
      }
    }
    
    // Migrate payroll records
    console.log('Migrating payroll records...');
    const payroll = mockDb.payroll;
    for (const record of payroll) {
      // Get the employee id from the employees table
      const empResult = await client.query('SELECT id FROM employees WHERE employee_id = $1', [record.employeeId]);
      if (empResult.rows.length > 0) {
        const employeeId = empResult.rows[0].id;
        await client.query(
          `INSERT INTO payroll 
           (employee_id, pay_period, working_days, present_days, basic_salary, allowances, deductions, net_salary, status) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
           ON CONFLICT (employee_id, pay_period) DO NOTHING`,
          [
            employeeId,
            record.payPeriod,
            record.workingDays,
            record.presentDays,
            record.basicSalary,
            record.allowances,
            record.deductions,
            record.netSalary,
            record.status || 'Paid'
          ]
        );
      }
    }
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('Migration completed successfully!');
    
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    // Release client
    client.release();
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('Migration script completed.');
      process.exit(0);
    })
    .catch(err => {
      console.error('Migration script failed:', err);
      process.exit(1);
    });
}

module.exports = { runMigration };
