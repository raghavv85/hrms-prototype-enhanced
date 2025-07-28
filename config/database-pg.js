const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL connection configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'hrms_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err.stack);
  } else {
    console.log('Database connected successfully at:', res.rows[0].now);
  }
});

class PostgresDatabase {
  constructor() {
    this.pool = pool;
  }

  // User methods
  async findUserByUsername(username) {
    const query = 'SELECT * FROM users WHERE username = $1';
    const result = await this.pool.query(query, [username]);
    return result.rows[0];
  }

  async findUserById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return result.rows[0];
  }

  async findUserByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await this.pool.query(query, [email]);
    return result.rows[0];
  }

  async updateUserPassword(userId, hashedPassword) {
    const query = 'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2 RETURNING id, username, email';
    const result = await this.pool.query(query, [hashedPassword, userId]);
    return result.rows[0];
  }

  // Employee methods
  async getAllEmployees() {
    const query = 'SELECT * FROM employees ORDER BY id';
    const result = await this.pool.query(query);
    return result.rows;
  }

  async getEmployeeById(id) {
    const query = 'SELECT * FROM employees WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return result.rows[0];
  }

  async createEmployee(employeeData) {
    const {
      employeeId,
      name,
      email,
      department,
      designation,
      dateOfJoining,
      baseSalary,
      phone,
      status
    } = employeeData;

    const query = `
      INSERT INTO employees (
        employee_id, name, email, department, designation, 
        date_of_joining, base_salary, phone, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      employeeId,
      name,
      email,
      department,
      designation,
      dateOfJoining,
      baseSalary,
      phone,
      status || 'Active'
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async updateEmployee(id, employeeData) {
    // Build dynamic update query based on provided fields
    const fields = Object.keys(employeeData).map((key, index) => {
      // Convert camelCase to snake_case for PostgreSQL
      const column = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      return `${column} = $${index + 2}`;
    });

    const query = `
      UPDATE employees 
      SET ${fields.join(', ')}, updated_at = NOW() 
      WHERE id = $1 
      RETURNING *
    `;

    const values = [id, ...Object.values(employeeData)];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async deleteEmployee(id) {
    const query = 'DELETE FROM employees WHERE id = $1 RETURNING *';
    const result = await this.pool.query(query, [id]);
    return result.rows[0];
  }

  // Attendance methods
  async getAllAttendance() {
    const query = 'SELECT * FROM attendance ORDER BY date DESC';
    const result = await this.pool.query(query);
    return result.rows;
  }

  async createAttendance(attendanceData) {
    const {
      employeeId,
      date,
      status,
      shift,
      checkIn,
      checkOut,
      notes
    } = attendanceData;

    const query = `
      INSERT INTO attendance (
        employee_id, date, status, shift, check_in, check_out, notes, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
    `;

    const values = [
      employeeId,
      date,
      status,
      shift,
      checkIn,
      checkOut,
      notes
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getAttendanceByDateRange(startDate, endDate) {
    const query = `
      SELECT * FROM attendance 
      WHERE date BETWEEN $1 AND $2 
      ORDER BY date DESC
    `;
    const result = await this.pool.query(query, [startDate, endDate]);
    return result.rows;
  }

  // Performance methods
  async getAllPerformance() {
    const query = 'SELECT * FROM performance ORDER BY date DESC';
    const result = await this.pool.query(query);
    return result.rows;
  }

  async createPerformance(performanceData) {
    const {
      employeeId,
      date,
      callsHandled,
      qualityScore,
      adherencePercentage,
      notes
    } = performanceData;

    const query = `
      INSERT INTO performance (
        employee_id, date, calls_handled, quality_score, adherence_percentage, notes, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `;

    const values = [
      employeeId,
      date,
      callsHandled,
      qualityScore,
      adherencePercentage,
      notes
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  // Payroll methods
  async getAllPayroll() {
    const query = 'SELECT * FROM payroll ORDER BY pay_period DESC';
    const result = await this.pool.query(query);
    return result.rows;
  }

  async createPayroll(payrollData) {
    const {
      employeeId,
      payPeriod,
      workingDays,
      presentDays,
      basicSalary,
      allowances,
      deductions,
      netSalary
    } = payrollData;

    const query = `
      INSERT INTO payroll (
        employee_id, pay_period, working_days, present_days, 
        basic_salary, allowances, deductions, net_salary, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *
    `;

    const values = [
      employeeId,
      payPeriod,
      workingDays,
      presentDays,
      basicSalary,
      allowances,
      deductions,
      netSalary
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getPayrollByEmployeeAndPeriod(employeeId, payPeriod) {
    const query = 'SELECT * FROM payroll WHERE employee_id = $1 AND pay_period = $2';
    const result = await this.pool.query(query, [employeeId, payPeriod]);
    return result.rows[0];
  }
}

module.exports = new PostgresDatabase();
