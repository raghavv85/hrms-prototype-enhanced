const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
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
    cb(null, `attendance_${Date.now()}_${file.originalname}`);
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

// @route   GET /api/attendance
// @desc    Get all attendance records
// @access  Private (HR Admin, Team Lead)
router.get('/', auth, requireRole(['HR_ADMIN', 'TEAM_LEAD']), async (req, res) => {
  try {
    const { startDate, endDate, employeeId } = req.query;
    let attendance;

    if (startDate && endDate) {
      attendance = await db.getAttendanceByDateRange(startDate, endDate);
    } else {
      attendance = await db.getAllAttendance();
    }

    if (employeeId) {
      attendance = attendance.filter(att => att.employeeId === employeeId);
    }

    res.json(attendance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/attendance
// @desc    Create attendance record
// @access  Private (HR Admin only)
router.post('/', auth, requireRole(['HR_ADMIN']), async (req, res) => {
  try {
    const { employeeId, date, status, shift, checkIn, checkOut, notes } = req.body;

    // Validate required fields
    if (!employeeId || !date || !status) {
      return res.status(400).json({ message: 'Please provide employeeId, date, and status' });
    }

    // Validate employee exists
    const employees = await db.getAllEmployees();
    const employee = employees.find(emp => emp.employeeId === employeeId);
    if (!employee) {
      return res.status(400).json({ message: 'Employee not found' });
    }

    const attendanceData = {
      employeeId,
      employeeName: employee.name,
      date,
      status, // Present, Absent, Half Day, Leave
      shift: shift || 'Day',
      checkIn: checkIn || null,
      checkOut: checkOut || null,
      notes: notes || ''
    };

    const attendance = await db.createAttendance(attendanceData);
    res.status(201).json(attendance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/attendance/upload
// @desc    Upload attendance via Excel
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

    const employees = await db.getAllEmployees();
    const employeeMap = {};
    employees.forEach(emp => {
      employeeMap[emp.employeeId] = emp;
    });

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        // Validate required fields
        if (!row.EmployeeID || !row.Date || !row.Status) {
          results.errors.push({
            row: i + 2,
            error: 'Missing required fields (EmployeeID, Date, Status)',
            data: row
          });
          continue;
        }

        // Validate employee exists
        const employee = employeeMap[row.EmployeeID];
        if (!employee) {
          results.errors.push({
            row: i + 2,
            error: 'Employee not found',
            data: row
          });
          continue;
        }

        // Validate status
        const validStatuses = ['Present', 'Absent', 'Half Day', 'Leave'];
        if (!validStatuses.includes(row.Status)) {
          results.errors.push({
            row: i + 2,
            error: 'Invalid status. Must be: Present, Absent, Half Day, or Leave',
            data: row
          });
          continue;
        }

        const attendanceData = {
          employeeId: row.EmployeeID,
          employeeName: employee.name,
          date: row.Date,
          status: row.Status,
          shift: row.Shift || 'Day',
          checkIn: row.CheckIn || null,
          checkOut: row.CheckOut || null,
          notes: row.Notes || ''
        };

        const attendance = await db.createAttendance(attendanceData);
        results.success.push(attendance);
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
      message: `Upload completed. ${results.success.length} records added, ${results.errors.length} errors.`,
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

// @route   GET /api/attendance/template/download
// @desc    Download attendance template
// @access  Private (HR Admin only)
router.get('/template/download', auth, requireRole(['HR_ADMIN']), (req, res) => {
  try {
    const templateData = [
      {
        EmployeeID: 'EMP001',
        Date: '2024-01-15',
        Status: 'Present',
        Shift: 'Day',
        CheckIn: '09:00',
        CheckOut: '18:00',
        Notes: 'On time'
      },
      {
        EmployeeID: 'EMP002',
        Date: '2024-01-15',
        Status: 'Absent',
        Shift: 'Day',
        CheckIn: '',
        CheckOut: '',
        Notes: 'Sick leave'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=attendance_template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error generating template' });
  }
});

// @route   GET /api/attendance/summary
// @desc    Get attendance summary
// @access  Private (HR Admin, Team Lead)
router.get('/summary', auth, requireRole(['HR_ADMIN', 'TEAM_LEAD']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let attendance;

    if (startDate && endDate) {
      attendance = await db.getAttendanceByDateRange(startDate, endDate);
    } else {
      // Default to current month
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      attendance = await db.getAttendanceByDateRange(firstDay.toISOString().split('T')[0], lastDay.toISOString().split('T')[0]);
    }

    const summary = {};
    attendance.forEach(att => {
      if (!summary[att.employeeId]) {
        summary[att.employeeId] = {
          employeeId: att.employeeId,
          employeeName: att.employeeName,
          present: 0,
          absent: 0,
          halfDay: 0,
          leave: 0,
          total: 0
        };
      }

      summary[att.employeeId].total++;
      switch (att.status.toLowerCase()) {
        case 'present':
          summary[att.employeeId].present++;
          break;
        case 'absent':
          summary[att.employeeId].absent++;
          break;
        case 'half day':
          summary[att.employeeId].halfDay++;
          break;
        case 'leave':
          summary[att.employeeId].leave++;
          break;
      }
    });

    res.json(Object.values(summary));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
