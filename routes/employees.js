const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const { Employee } = require('../models');
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

// Enhanced date parsing function to handle all Excel date formats
function parseDoj(dojValue) {
  // Handle potential undefined, null, or empty inputs gracefully
  if (dojValue === null || dojValue === undefined || dojValue === '') {
    console.warn("DOJ value is null, undefined, or empty");
    return null;
  }

  // If it's already a Date object (from Excel date cells)
  if (dojValue instanceof Date && !isNaN(dojValue)) {
    return dojValue;
  }

  // Handle numeric Excel serial dates
  if (typeof dojValue === 'number' && !isNaN(dojValue)) {
    // Excel epoch is December 30, 1899
    const excelEpochAsUnixTimestamp = (dojValue - 1 - 25569) * 86400000;
    const date = new Date(excelEpochAsUnixTimestamp);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Handle string formats
  if (typeof dojValue === 'string') {
    // Remove extra spaces
    const cleanDateStr = dojValue.trim();
    
    // Try ISO format first (YYYY-MM-DD)
    let parsedDate = new Date(cleanDateStr);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }

    // Try parsing m/d/yyyy format
    const mdyMatch = cleanDateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (mdyMatch) {
      const month = parseInt(mdyMatch[1], 10) - 1; // JavaScript months are 0-indexed
      const day = parseInt(mdyMatch[2], 10);
      const year = parseInt(mdyMatch[3], 10);
      
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    // Try parsing dd-mmm-yyyy format (e.g., 15-Jul-2025)
    const dmyMatch = cleanDateStr.match(/^(\d{1,2})-([a-zA-Z]{3})-(\d{4})$/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const monthName = dmyMatch[2].toLowerCase();
      const year = parseInt(dmyMatch[3], 10);
      
      const monthNames = {
        'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
        'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
      };
      
      if (monthNames[monthName]) {
        const date = new Date(year, monthNames[monthName], day);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }

    // Try parsing dd/mm/yyyy format
    const dmymatch = cleanDateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dmymatch) {
      const day = parseInt(dmymatch[1], 10);
      const month = parseInt(dmymatch[2], 10) - 1;
      const year = parseInt(dmymatch[3], 10);
      
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }

  // If all parsing attempts fail, throw an error
  console.error(`Invalid date format provided for DOJ: ${dojValue}`);
  throw new Error(`Invalid date format for DOJ: '${dojValue}'. Expected format like YYYY-MM-DD, MM/DD/YYYY, or DD-MMM-YYYY.`);
}

// @route   GET /api/employees
// @desc    Get all employees
// @access  Private (HR Admin, Team Lead)
router.get('/', auth, requireRole(['HR_ADMIN', 'TEAM_LEAD']), async (req, res) => {
  try {
    const employees = await Employee.findAll();
    res.json(employees);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/employees/template/download
// @desc    Download employee template
// @access  Private (HR Admin only)
router.get('/template/download', auth, requireRole(['HR_ADMIN']), (req, res) => {
  try {
    const templateData = [
      {
        'EMPLOYEE ID': '1234567890',
        'EMPLOYEE NAME': 'John Doe',
        'SUPERVISOR NAME': 'Jane Smith',
        'Unit Head': 'Mike Johnson',
        'State': 'California',
        'LOCATION': 'Los Angeles',
        'SUB LOCATION': 'Downtown',
        'DOJ': '15-Jul-2025',
        'Gender': 'Male',
        'NEW/OLD': 'New',
        'Designation': 'Software Engineer',
        'DRA': 'N/A',
        'FIELD/FLOOR': 'Floor 5',
        'Portfolio code': 'PC001',
        'Client': 'ABC Corp',
        'PRODUCT': 'Product A',
        'Process': 'Development',
        'STATUS': 'Active',
        'CTC': 60000
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    
    const columnWidths = [
      { wch: 15 }, // EMPLOYEE ID
      { wch: 20 }, // EMPLOYEE NAME
      { wch: 20 }, // SUPERVISOR NAME
      { wch: 20 }, // Unit Head
      { wch: 15 }, // State
      { wch: 15 }, // LOCATION
      { wch: 15 }, // SUB LOCATION
      { wch: 15 }, // DOJ
      { wch: 10 }, // Gender
      { wch: 10 }, // NEW/OLD
      { wch: 20 }, // Designation
      { wch: 10 }, // DRA
      { wch: 15 }, // FIELD/FLOOR
      { wch: 15 }, // Portfolio code
      { wch: 15 }, // Client
      { wch: 15 }, // PRODUCT
      { wch: 15 }, // Process
      { wch: 10 }, // STATUS
      { wch: 10 }  // CTC
    ];
    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employee Template');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=employee_template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error generating template' });
  }
});

// @route   GET /api/employees/:id
// @desc    Get employee by ID
// @access  Private (HR Admin, Team Lead)
router.get('/:id', auth, requireRole(['HR_ADMIN', 'TEAM_LEAD']), async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
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
    const { employeeId, name, doj, ctc } = req.body;

    if (!employeeId || !name || !doj || !ctc) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const employee = await Employee.create(req.body);
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
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    await employee.update(req.body);
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
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    await employee.destroy();
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

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        const employeeData = {
          employeeId: String(row['EMPLOYEE ID'] || '').trim(),
          name: String(row['EMPLOYEE NAME'] || '').trim(),
          supervisorName: String(row['SUPERVISOR NAME'] || '').trim(),
          unitHead: String(row['Unit Head'] || '').trim(),
          state: String(row['State'] || '').trim(),
          location: String(row['LOCATION'] || '').trim(),
          subLocation: String(row['SUB LOCATION'] || '').trim(),
          doj: parseDoj(row['DOJ']),
          gender: String(row['Gender'] || '').trim(),
          newOld: String(row['NEW/OLD'] || '').trim(),
          designation: String(row['Designation'] || '').trim(),
          dra: String(row['DRA'] || '').trim(),
          fieldFloor: String(row['FIELD/FLOOR'] || '').trim(),
          portfolioCode: String(row['Portfolio code'] || '').trim(),
          client: String(row['Client'] || '').trim(),
          product: String(row['PRODUCT'] || '').trim(),
          process: String(row['Process'] || '').trim(),
          status: String(row['STATUS'] || 'Active').trim(),
          ctc: parseFloat(row['CTC']) || 0
        };

        const employee = await Employee.create(employeeData);
        results.success.push(employee);
      } catch (error) {
        results.errors.push({
          row: i + 2,
          error: error.message,
          data: row
        });
      }
    }

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

module.exports = router;
