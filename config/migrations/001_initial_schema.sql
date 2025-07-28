-- Initial database schema for HRMS Enhanced

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  employee_id VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  department VARCHAR(50) NOT NULL,
  designation VARCHAR(50) NOT NULL,
  date_of_joining DATE NOT NULL,
  base_salary DECIMAL(10, 2) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  status VARCHAR(20) DEFAULT 'Active',
  manager_id INTEGER REFERENCES employees(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL,
  date DATE NOT NULL,
  status VARCHAR(20) NOT NULL, -- Present, Absent, Half-day, Leave
  shift VARCHAR(20),
  check_in TIME,
  check_out TIME,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(employee_id, date),
  CONSTRAINT fk_employee
    FOREIGN KEY(employee_id)
    REFERENCES employees(id)
    ON DELETE CASCADE
);

-- Performance table
CREATE TABLE IF NOT EXISTS performance (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL,
  date DATE NOT NULL,
  calls_handled INTEGER,
  quality_score DECIMAL(5, 2),
  adherence_percentage DECIMAL(5, 2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(employee_id, date),
  CONSTRAINT fk_employee
    FOREIGN KEY(employee_id)
    REFERENCES employees(id)
    ON DELETE CASCADE
);

-- Payroll table
CREATE TABLE IF NOT EXISTS payroll (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL,
  pay_period VARCHAR(20) NOT NULL, -- e.g., "2023-01"
  working_days INTEGER NOT NULL,
  present_days INTEGER NOT NULL,
  basic_salary DECIMAL(10, 2) NOT NULL,
  allowances DECIMAL(10, 2) DEFAULT 0,
  deductions DECIMAL(10, 2) DEFAULT 0,
  net_salary DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'Pending', -- Pending, Approved, Paid
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(employee_id, pay_period),
  CONSTRAINT fk_employee
    FOREIGN KEY(employee_id)
    REFERENCES employees(id)
    ON DELETE CASCADE
);

-- Documents table for file management
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL,
  document_type VARCHAR(50) NOT NULL, -- Resume, ID Proof, Certificate, etc.
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  CONSTRAINT fk_employee
    FOREIGN KEY(employee_id)
    REFERENCES employees(id)
    ON DELETE CASCADE
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user
    FOREIGN KEY(user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL, -- Employee, Attendance, Payroll, etc.
  entity_id INTEGER,
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user
    FOREIGN KEY(user_id)
    REFERENCES users(id)
    ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_employee_id ON attendance(employee_id);
CREATE INDEX idx_performance_employee_id ON performance(employee_id);
CREATE INDEX idx_payroll_employee_id ON payroll(employee_id);
CREATE INDEX idx_payroll_pay_period ON payroll(pay_period);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
