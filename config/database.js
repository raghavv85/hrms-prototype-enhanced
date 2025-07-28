const { Pool } = require('pg');

// For prototype, we'll use in-memory storage instead of PostgreSQL
// In production, you would use actual PostgreSQL connection
class MockDatabase {
  constructor() {
    this.users = [
      {
        id: 1,
        username: 'hradmin',
        password: '$2a$10$qroLSyzOXhcXRUvTrJJBvuDNHIqEVgWp.p3fQASoXgNoZnTm5vCWu', // password
        role: 'HR_ADMIN',
        email: 'hr@company.com'
      },
      {
        id: 2,
        username: 'teamlead',
        password: '$2a$10$qroLSyzOXhcXRUvTrJJBvuDNHIqEVgWp.p3fQASoXgNoZnTm5vCWu', // password
        role: 'TEAM_LEAD',
        email: 'lead@company.com'
      }
    ];
    
    this.employees = [];
    this.attendance = [];
    this.performance = [];
    this.payroll = [];
    
    this.nextEmployeeId = 1;
    this.nextAttendanceId = 1;
    this.nextPerformanceId = 1;
    this.nextPayrollId = 1;
  }

  // User methods
  async findUserByUsername(username) {
    return this.users.find(user => user.username === username);
  }

  async findUserById(id) {
    return this.users.find(user => user.id === id);
  }

  // Employee methods
  async getAllEmployees() {
    return this.employees;
  }

  async getEmployeeById(id) {
    return this.employees.find(emp => emp.id === parseInt(id));
  }

  async createEmployee(employeeData) {
    const employee = {
      id: this.nextEmployeeId++,
      ...employeeData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.employees.push(employee);
    return employee;
  }

  async updateEmployee(id, employeeData) {
    const index = this.employees.findIndex(emp => emp.id === parseInt(id));
    if (index !== -1) {
      this.employees[index] = {
        ...this.employees[index],
        ...employeeData,
        updatedAt: new Date()
      };
      return this.employees[index];
    }
    return null;
  }

  async deleteEmployee(id) {
    const index = this.employees.findIndex(emp => emp.id === parseInt(id));
    if (index !== -1) {
      return this.employees.splice(index, 1)[0];
    }
    return null;
  }

  // Attendance methods
  async getAllAttendance() {
    return this.attendance;
  }

  async createAttendance(attendanceData) {
    const attendance = {
      id: this.nextAttendanceId++,
      ...attendanceData,
      createdAt: new Date()
    };
    this.attendance.push(attendance);
    return attendance;
  }

  async getAttendanceByDateRange(startDate, endDate) {
    return this.attendance.filter(att => {
      const attDate = new Date(att.date);
      return attDate >= new Date(startDate) && attDate <= new Date(endDate);
    });
  }

  // Performance methods
  async getAllPerformance() {
    return this.performance;
  }

  async createPerformance(performanceData) {
    const performance = {
      id: this.nextPerformanceId++,
      ...performanceData,
      createdAt: new Date()
    };
    this.performance.push(performance);
    return performance;
  }

  // Payroll methods
  async getAllPayroll() {
    return this.payroll;
  }

  async createPayroll(payrollData) {
    const payroll = {
      id: this.nextPayrollId++,
      ...payrollData,
      createdAt: new Date()
    };
    this.payroll.push(payroll);
    return payroll;
  }
}

const db = new MockDatabase();

module.exports = db;
