const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const db = require('../config/database');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `employees_${Date.now()}_${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'), false);
    }
  }
});

// @route   GET /api/employees
// @desc    Get all employees
// @access  Private (HR Admin, Team Lead)
router.get('/', auth, requireRole(['HR_ADMIN', 'TEAM_LEAD']), async (req, res) => {
  try {
    const employees = await db.getAllEmployees();
    res.json(employees);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/employees/:id
// @desc    Get employee by ID
// @access  Private (HR Admin, Team Lead)
router.get('/:id', auth, requireRole(['HR_ADMIN', 'TEAM_LEAD']), async (req, res) => {
  try {
    const employee = await db.getEmployeeById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/employees
// @desc    Create new employee
// @access  Private (HR Admin only)
router.post('/', auth, requireRole(['HR_ADMIN']), async (req, res) => {
  try {
    const { employeeId, name, email, department, designation, dateOfJoining, baseSalary, phone } = req.body;

    // Validate required fields
    if (!employeeId || !name || !email || !department || !dateOfJoining) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check for duplicate employee ID
    const existingEmployee = await db.getAllEmployees();
    const duplicate = existingEmployee.find(emp => emp.employeeId === employeeId);
    if (duplicate) {
      return res.status(400).json({ message: 'Employee ID already exists' });
    }

    const employeeData = {
      employeeId,
      name,
      email,
      department,
      designation: designation || '',
      dateOfJoining,
      baseSalary: baseSalary || 0,
      phone: phone || '',
      status: 'Active'
    };

    const employee = await db.createEmployee(employeeData);
    res.status(201).json(employee);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/employees/:id
// @desc    Update employee
// @access  Private (HR Admin only)
router.put('/:id', auth, requireRole(['HR_ADMIN']), async (req, res) => {
  try {
    const employee = await db.updateEmployee(req.params.id, req.body);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/employees/:id
// @desc    Delete employee
// @access  Private (HR Admin only)
router.delete('/:id', auth, requireRole(['HR_ADMIN']), async (req, res) => {
  try {
    const employee = await db.deleteEmployee(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/employees/upload
// @desc    Upload employees via Excel
// @access  Private (HR Admin only)
router.post('/upload', auth, requireRole(['HR_ADMIN']), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an Excel file' });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const results = {
      success: [],
      errors: []
    };

    const existingEmployees = await db.getAllEmployees();
    const existingIds = existingEmployees.map(emp => emp.employeeId);

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        // Validate required fields
        if (!row.EmployeeID || !row.Name || !row.Email || !row.Department || !row.DateOfJoining) {
          results.errors.push({
            row: i + 2,
            error: 'Missing required fields',
            data: row
          });
          continue;
        }

        // Check for duplicate
        if (existingIds.includes(row.EmployeeID)) {
          results.errors.push({
            row: i + 2,
            error: 'Employee ID already exists',
            data: row
          });
          continue;
        }

        const employeeData = {
          employeeId: row.EmployeeID,
          name: row.Name,
          email: row.Email,
          department: row.Department,
          designation: row.Designation || '',
          dateOfJoining: row.DateOfJoining,
          baseSalary: row.BaseSalary || 0,
          phone: row.Phone || '',
          status: 'Active'
        };

        const employee = await db.createEmployee(employeeData);
        existingIds.push(employee.employeeId);
        results.success.push(employee);
      } catch (error) {
        results.errors.push({
          row: i + 2,
          error: error.message,
          data: row
        });
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      message: `Upload completed. ${results.success.length} employees added, ${results.errors.length} errors.`,
      results
    });
  } catch (error) {
    console.error(error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Server error during file upload' });
  }
});

// @route   GET /api/employees/template/download
// @desc    Download employee template
// @access  Private (HR Admin only)
router.get('/template/download', auth, requireRole(['HR_ADMIN']), (req, res) => {
  try {
    const templateData = [
      {
        EmployeeID: 'EMP001',
        Name: 'John Doe',
        Email: 'john.doe@company.com',
        Department: 'IT',
        Designation: 'Software Engineer',
        DateOfJoining: '2024-01-15',
        BaseSalary: 50000,
        Phone: '+1234567890'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=employee_template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error generating template' });
  }
});

module.exports = router;
