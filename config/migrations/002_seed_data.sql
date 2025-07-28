-- Seed data for HRMS Enhanced

-- Insert admin users
INSERT INTO users (username, password, email, role, first_name, last_name)
VALUES
  -- Password: admin123 (hashed with bcrypt)
  ('admin', '$2a$10$mLK.rrdlvx9DCFb6Eck1t.TlltnGulepXnov3bBp5T2TloO1MYj52', 'admin@example.com', 'HR Admin', 'Admin', 'User'),
  -- Password: lead123 (hashed with bcrypt)
  ('teamlead', '$2a$10$mLK.rrdlvx9DCFb6Eck1t.TlltnGulepXnov3bBp5T2TloO1MYj52', 'lead@example.com', 'Team Lead', 'Team', 'Lead'),
  -- Password: user123 (hashed with bcrypt)
  ('user', '$2a$10$mLK.rrdlvx9DCFb6Eck1t.TlltnGulepXnov3bBp5T2TloO1MYj52', 'user@example.com', 'Employee', 'Normal', 'User')
ON CONFLICT (username) DO NOTHING;

-- Insert departments
INSERT INTO employees (employee_id, name, email, department, designation, date_of_joining, base_salary, phone, status)
VALUES
  ('EMP001', 'John Doe', 'john.doe@example.com', 'Engineering', 'Software Engineer', '2022-01-15', 75000.00, '555-1234', 'Active'),
  ('EMP002', 'Jane Smith', 'jane.smith@example.com', 'HR', 'HR Manager', '2021-05-20', 85000.00, '555-2345', 'Active'),
  ('EMP003', 'Michael Johnson', 'michael.johnson@example.com', 'Sales', 'Sales Representative', '2022-03-10', 65000.00, '555-3456', 'Active'),
  ('EMP004', 'Emily Davis', 'emily.davis@example.com', 'Marketing', 'Marketing Specialist', '2022-02-28', 68000.00, '555-4567', 'Active'),
  ('EMP005', 'Robert Wilson', 'robert.wilson@example.com', 'Engineering', 'Senior Developer', '2020-11-18', 95000.00, '555-5678', 'Active'),
  ('EMP006', 'Sarah Thompson', 'sarah.thompson@example.com', 'Finance', 'Financial Analyst', '2021-08-12', 72000.00, '555-6789', 'Active'),
  ('EMP007', 'David Martinez', 'david.martinez@example.com', 'Engineering', 'QA Engineer', '2022-04-05', 70000.00, '555-7890', 'Active'),
  ('EMP008', 'Jennifer Garcia', 'jennifer.garcia@example.com', 'Customer Support', 'Support Specialist', '2021-12-10', 62000.00, '555-8901', 'Active'),
  ('EMP009', 'James Rodriguez', 'james.rodriguez@example.com', 'Sales', 'Sales Manager', '2020-07-22', 90000.00, '555-9012', 'Active'),
  ('EMP010', 'Lisa Miller', 'lisa.miller@example.com', 'Marketing', 'Marketing Manager', '2021-03-15', 88000.00, '555-0123', 'Active')
ON CONFLICT (employee_id) DO NOTHING;

-- Insert attendance records (for the last 7 days)
DO $$
DECLARE
  emp_id INTEGER;
  curr_date DATE := CURRENT_DATE;
BEGIN
  FOR emp_id IN SELECT id FROM employees LOOP
    FOR i IN 1..7 LOOP
      -- Skip weekends (Saturday and Sunday)
      IF EXTRACT(DOW FROM (curr_date - (i-1) * INTERVAL '1 day')) NOT IN (0, 6) THEN
        INSERT INTO attendance (employee_id, date, status, shift, check_in, check_out, notes)
        VALUES (
          emp_id,
          curr_date - (i-1) * INTERVAL '1 day',
          CASE WHEN RANDOM() < 0.9 THEN 'Present' ELSE 'Absent' END,
          'Day',
          '09:00:00'::TIME + (RANDOM() * INTERVAL '30 minutes'),
          '18:00:00'::TIME + (RANDOM() * INTERVAL '30 minutes'),
          NULL
        )
        ON CONFLICT (employee_id, date) DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

-- Insert performance records (for the last 30 days)
DO $$
DECLARE
  emp_id INTEGER;
  curr_date DATE := CURRENT_DATE;
BEGIN
  FOR emp_id IN SELECT id FROM employees LOOP
    FOR i IN 1..30 LOOP
      -- Skip weekends (Saturday and Sunday)
      IF EXTRACT(DOW FROM (curr_date - (i-1) * INTERVAL '1 day')) NOT IN (0, 6) THEN
        INSERT INTO performance (employee_id, date, calls_handled, quality_score, adherence_percentage, notes)
        VALUES (
          emp_id,
          curr_date - (i-1) * INTERVAL '1 day',
          FLOOR(RANDOM() * 50) + 20,  -- 20-70 calls
          70 + (RANDOM() * 30),       -- 70-100 quality score
          80 + (RANDOM() * 20),       -- 80-100 adherence
          NULL
        )
        ON CONFLICT (employee_id, date) DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

-- Insert payroll records (for the last 3 months)
DO $$
DECLARE
  emp_id INTEGER;
  emp_record RECORD;
  curr_date DATE := CURRENT_DATE;
  month_start DATE;
  month_end DATE;
  working_days INTEGER;
  present_days INTEGER;
  basic_salary DECIMAL(10,2);
  allowances DECIMAL(10,2);
  deductions DECIMAL(10,2);
  net_salary DECIMAL(10,2);
BEGIN
  FOR emp_record IN SELECT id, base_salary FROM employees LOOP
    emp_id := emp_record.id;
    basic_salary := emp_record.base_salary / 12;
    
    FOR i IN 1..3 LOOP
      month_start := DATE_TRUNC('month', curr_date - ((i-1) * INTERVAL '1 month'))::DATE;
      month_end := (DATE_TRUNC('month', curr_date - ((i-1) * INTERVAL '1 month')) + INTERVAL '1 month - 1 day')::DATE;
      
      -- Calculate working days (excluding weekends)
      SELECT COUNT(*) INTO working_days
      FROM generate_series(month_start, month_end, '1 day') AS day
      WHERE EXTRACT(DOW FROM day) NOT IN (0, 6);
      
      -- Simulate present days (80-100% of working days)
      present_days := FLOOR(working_days * (0.8 + (RANDOM() * 0.2)));
      
      -- Calculate salary components
      allowances := ROUND(basic_salary * 0.2, 2);
      deductions := ROUND(basic_salary * 0.1, 2);
      net_salary := ROUND(basic_salary + allowances - deductions, 2);
      
      INSERT INTO payroll (employee_id, pay_period, working_days, present_days, basic_salary, allowances, deductions, net_salary, status)
      VALUES (
        emp_id,
        TO_CHAR(month_start, 'YYYY-MM'),
        working_days,
        present_days,
        basic_salary,
        allowances,
        deductions,
        net_salary,
        CASE WHEN i = 1 THEN 'Pending' ELSE 'Paid' END
      )
      ON CONFLICT (employee_id, pay_period) DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$;

-- Insert sample notifications
INSERT INTO notifications (user_id, title, message, is_read)
VALUES
  (1, 'Welcome to HRMS Enhanced', 'Welcome to the enhanced version of our HR Management System. Explore the new features!', FALSE),
  (1, 'Payroll Processed', 'The payroll for the current month has been processed and is ready for review.', FALSE),
  (2, 'Team Performance Update', 'Your team''s performance metrics for the last month are now available in the reports section.', FALSE),
  (3, 'Attendance Reminder', 'Please remember to log your attendance daily using the new self-service portal.', FALSE);

-- Insert sample audit logs
INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
VALUES
  (1, 'LOGIN', 'User', 1, '{"browser": "Chrome", "os": "Windows"}', '192.168.1.100'),
  (1, 'CREATE', 'Employee', 1, '{"fields": ["name", "email", "department"]}', '192.168.1.100'),
  (1, 'UPDATE', 'Employee', 2, '{"fields": ["designation", "salary"]}', '192.168.1.100'),
  (2, 'VIEW', 'Payroll', 1, NULL, '192.168.1.101'),
  (3, 'LOGIN', 'User', 3, '{"browser": "Firefox", "os": "MacOS"}', '192.168.1.102');
