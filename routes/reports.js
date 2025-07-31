const express = require('express');
const XLSX = require('xlsx');
const db = require('../config/db-config');
const { auth, requireRole } = require('../middleware/auth');
const { generatePayslipPDF, generateAttendanceReportPDF, generatePerformanceReviewPDF } = require('../utils/pdf-generator');
// Temporarily disabled due to missing nodemailer dependency
// const { sendPayslipEmail } = require('../utils/email-service');
// Mock function for sendPayslipEmail
const sendPayslipEmail = async () => { return { success: false, message: 'Email service is disabled' }; };
const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Ensure reports directory exists
const reportsDir = path.join(uploadsDir, 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

const router = express.Router();

// @route   GET /api/reports/employees
// @desc    Generate employee master report
// @access  Private (HR Admin, Team Lead)
router.get('/employees', auth, requireRole(['HR_ADMIN', 'TEAM_LEAD']), async (req, res) => {
  try {
    const { department, status, format = 'json' } = req.query;
    let employees = await db.getAllEmployees();

    // Apply filters
    if (department) {
      employees = employees.filter(emp => emp.department.toLowerCase().includes(department.toLowerCase()));
    }

    if (status) {
      employees = employees.filter(emp => emp.status.toLowerCase() === status.toLowerCase());
    }

    if (format === 'pdf') {
      // This is a bug, it should generate an employee report, not an attendance report.
      // For now, I will return an error. A proper fix would be to create a new PDF generator for employee reports.
      return res.status(501).json({ message: 'Employee report PDF generation is not implemented yet.' });
    } else if (format === 'excel') {
      // Generate Excel file
      const excelData = employees.map(emp => ({
        'Employee ID': emp.employeeId,
        'Name': emp.name,
        'Email': emp.email,
        'Department': emp.department,
        'Designation': emp.designation,
        'Date of Joining': emp.dateOfJoining,
        'Base Salary': emp.baseSalary,
        'Phone': emp.phone,
        'Status': emp.status,
        'Created At': emp.createdAt
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Disposition', 'attachment; filename=employee_report.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } else {
      res.json({
        totalEmployees: employees.length,
        filters: { department, status },
        employees
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/attendance
// @desc    Generate attendance report
// @access  Private (HR Admin, Team Lead)
router.get('/attendance', auth, requireRole(['HR_ADMIN', 'TEAM_LEAD']), async (req, res) => {
  try {
    const { startDate, endDate, department, employeeId, format = 'json' } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Please provide startDate and endDate' });
    }

    let attendance = await db.getAttendanceByDateRange(startDate, endDate);
    let employees = await db.getAllEmployees();

    // Apply filters
    if (department) {
      const deptEmployees = employees.filter(emp => emp.department.toLowerCase().includes(department.toLowerCase()));
      const deptEmployeeIds = deptEmployees.map(emp => emp.employeeId);
      attendance = attendance.filter(att => deptEmployeeIds.includes(att.employeeId));
    }

    if (employeeId) {
      attendance = attendance.filter(att => att.employeeId === employeeId);
    }

    // Calculate summary statistics
    const summary = {
      totalRecords: attendance.length,
      present: attendance.filter(att => att.status.toLowerCase() === 'present').length,
      absent: attendance.filter(att => att.status.toLowerCase() === 'absent').length,
      halfDay: attendance.filter(att => att.status.toLowerCase() === 'half day').length,
      leave: attendance.filter(att => att.status.toLowerCase() === 'leave').length
    };

    // Employee-wise summary
    const employeeSummary = {};
    attendance.forEach(att => {
      if (!employeeSummary[att.employeeId]) {
        employeeSummary[att.employeeId] = {
          employeeId: att.employeeId,
          employeeName: att.employeeName,
          present: 0,
          absent: 0,
          halfDay: 0,
          leave: 0,
          total: 0
        };
      }

      employeeSummary[att.employeeId].total++;
      switch (att.status.toLowerCase()) {
        case 'present':
          employeeSummary[att.employeeId].present++;
          break;
        case 'absent':
          employeeSummary[att.employeeId].absent++;
          break;
        case 'half day':
          employeeSummary[att.employeeId].halfDay++;
          break;
        case 'leave':
          employeeSummary[att.employeeId].leave++;
          break;
      }
    });

    if (format === 'excel') {
      // Generate Excel file with multiple sheets
      const workbook = XLSX.utils.book_new();

      // Detailed attendance sheet
      const detailedData = attendance.map(att => ({
        'Employee ID': att.employeeId,
        'Employee Name': att.employeeName,
        'Date': att.date,
        'Status': att.status,
        'Shift': att.shift,
        'Check In': att.checkIn,
        'Check Out': att.checkOut,
        'Notes': att.notes
      }));

      const detailedSheet = XLSX.utils.json_to_sheet(detailedData);
      XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Detailed Attendance');

      // Summary sheet
      const summaryData = Object.values(employeeSummary).map(emp => ({
        'Employee ID': emp.employeeId,
        'Employee Name': emp.employeeName,
        'Total Days': emp.total,
        'Present': emp.present,
        'Absent': emp.absent,
        'Half Day': emp.halfDay,
        'Leave': emp.leave,
        'Attendance %': emp.total > 0 ? Math.round((emp.present + emp.halfDay * 0.5) / emp.total * 100) : 0
      }));

      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Disposition', 'attachment; filename=attendance_report.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } else {
      res.json({
        dateRange: { startDate, endDate },
        filters: { department, employeeId },
        summary,
        employeeSummary: Object.values(employeeSummary),
        detailedRecords: attendance
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/performance
// @desc    Generate performance report
// @access  Private (HR Admin, Team Lead)
router.get('/performance', auth, requireRole(['HR_ADMIN', 'TEAM_LEAD']), async (req, res) => {
  try {
    const { startDate, endDate, department, employeeId, format = 'json' } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Please provide startDate and endDate' });
    }

    let performance = await db.getAllPerformance();
    let employees = await db.getAllEmployees();

    // Filter by date range
    performance = performance.filter(perf => {
      const perfDate = new Date(perf.date);
      return perfDate >= new Date(startDate) && perfDate <= new Date(endDate);
    });

    // Apply filters
    if (department) {
      const deptEmployees = employees.filter(emp => emp.department.toLowerCase().includes(department.toLowerCase()));
      const deptEmployeeIds = deptEmployees.map(emp => emp.employeeId);
      performance = performance.filter(perf => deptEmployeeIds.includes(perf.employeeId));
    }

    if (employeeId) {
      performance = performance.filter(perf => perf.employeeId === employeeId);
    }
    
    // Generate PDF if format is pdf
    if (format === 'pdf') {
      // Generate PDF report
      const options = { startDate, endDate, department, employeeId };
      const pdfPath = await generatePerformanceReviewPDF(performance, options);
      
      // Send file for download
      res.download(pdfPath, `Performance_Report_${startDate}_to_${endDate}.pdf`, (err) => {
        if (err) {
          console.error('Error sending file:', err);
        } else {
          // Delete the file after sending (optional)
          // fs.unlinkSync(pdfPath);
        }
      });
      return;
    }

    // Calculate summary statistics
    const summary = {
      totalRecords: performance.length,
      averageCallsHandled: performance.length > 0 ? Math.round(performance.reduce((sum, perf) => sum + perf.callsHandled, 0) / performance.length) : 0,
      averageQualityScore: performance.length > 0 ? Math.round(performance.reduce((sum, perf) => sum + perf.qualityScore, 0) / performance.length * 100) / 100 : 0,
      averageAdherence: performance.length > 0 ? Math.round(performance.reduce((sum, perf) => sum + perf.adherencePercentage, 0) / performance.length * 100) / 100 : 0
    };

    // Employee-wise performance summary
    const employeePerformance = {};
    performance.forEach(perf => {
      if (!employeePerformance[perf.employeeId]) {
        employeePerformance[perf.employeeId] = {
          employeeId: perf.employeeId,
          employeeName: perf.employeeName,
          totalCalls: 0,
          totalQualityScore: 0,
          totalAdherence: 0,
          recordCount: 0,
          averageCallsHandled: 0,
          averageQualityScore: 0,
          averageAdherence: 0
        };
      }

      const emp = employeePerformance[perf.employeeId];
      emp.totalCalls += perf.callsHandled;
      emp.totalQualityScore += perf.qualityScore;
      emp.totalAdherence += perf.adherencePercentage;
      emp.recordCount++;
    });

    // Calculate averages
    Object.values(employeePerformance).forEach(emp => {
      emp.averageCallsHandled = Math.round(emp.totalCalls / emp.recordCount);
      emp.averageQualityScore = Math.round(emp.totalQualityScore / emp.recordCount * 100) / 100;
      emp.averageAdherence = Math.round(emp.totalAdherence / emp.recordCount * 100) / 100;
    });

    if (format === 'excel') {
      const workbook = XLSX.utils.book_new();

      // Detailed performance sheet
      const detailedData = performance.map(perf => ({
        'Employee ID': perf.employeeId,
        'Employee Name': perf.employeeName,
        'Date': perf.date,
        'Calls Handled': perf.callsHandled,
        'Quality Score': perf.qualityScore,
        'Adherence %': perf.adherencePercentage,
        'Notes': perf.notes
      }));

      const detailedSheet = XLSX.utils.json_to_sheet(detailedData);
      XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Detailed Performance');

      // Summary sheet
      const summaryData = Object.values(employeePerformance).map(emp => ({
        'Employee ID': emp.employeeId,
        'Employee Name': emp.employeeName,
        'Total Records': emp.recordCount,
        'Total Calls': emp.totalCalls,
        'Avg Calls/Day': emp.averageCallsHandled,
        'Avg Quality Score': emp.averageQualityScore,
        'Avg Adherence %': emp.averageAdherence
      }));

      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Performance Summary');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Disposition', 'attachment; filename=performance_report.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } else {
      res.json({
        dateRange: { startDate, endDate },
        filters: { department, employeeId },
        summary,
        employeePerformance: Object.values(employeePerformance),
        detailedRecords: performance
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/payroll
// @desc    Generate payroll report
// @access  Private (HR Admin only)
router.get('/payroll', auth, requireRole(['HR_ADMIN']), async (req, res) => {
  try {
    const { month, year, department, format = 'json' } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({ message: 'Please provide month and year' });
    }

    let payroll = await db.getAllPayroll();
    let employees = await db.getAllEmployees();

    // Filter by month and year
    payroll = payroll.filter(pay => {
      const payDate = new Date(pay.payPeriod);
      return payDate.getMonth() + 1 === parseInt(month) && 
             payDate.getFullYear() === parseInt(year);
    });

    // Apply department filter
    if (department) {
      const deptEmployees = employees.filter(emp => emp.department.toLowerCase().includes(department.toLowerCase()));
      const deptEmployeeIds = deptEmployees.map(emp => emp.employeeId);
      payroll = payroll.filter(pay => deptEmployeeIds.includes(pay.employeeId));
    }

    // Calculate summary statistics
    const summary = {
      totalEmployees: payroll.length,
      totalGrossSalary: payroll.reduce((sum, pay) => sum + pay.grossSalary, 0),
      totalNetSalary: payroll.reduce((sum, pay) => sum + pay.netSalary, 0),
      totalDeductions: payroll.reduce((sum, pay) => sum + pay.totalDeductions, 0),
      averageGrossSalary: payroll.length > 0 ? Math.round(payroll.reduce((sum, pay) => sum + pay.grossSalary, 0) / payroll.length) : 0,
      averageNetSalary: payroll.length > 0 ? Math.round(payroll.reduce((sum, pay) => sum + pay.netSalary, 0) / payroll.length) : 0
    };

    // Department-wise summary
    const departmentSummary = {};
    payroll.forEach(pay => {
      if (!departmentSummary[pay.department]) {
        departmentSummary[pay.department] = {
          department: pay.department,
          employeeCount: 0,
          totalGrossSalary: 0,
          totalNetSalary: 0,
          totalDeductions: 0
        };
      }

      const dept = departmentSummary[pay.department];
      dept.employeeCount++;
      dept.totalGrossSalary += pay.grossSalary;
      dept.totalNetSalary += pay.netSalary;
      dept.totalDeductions += pay.totalDeductions;
    });

    if (format === 'excel') {
      const workbook = XLSX.utils.book_new();

      // Detailed payroll sheet
      const detailedData = payroll.map(pay => ({
        'Employee ID': pay.employeeId,
        'Employee Name': pay.employeeName,
        'Department': pay.department,
        'Designation': pay.designation,
        'Base Salary': pay.baseSalary,
        'Working Days': pay.workingDays,
        'Present Days': pay.presentDays,
        'Absent Days': pay.absentDays,
        'Half Days': pay.halfDays,
        'Leave Days': pay.leaveDays,
        'Earned Basic Salary': pay.earnedBasicSalary,
        'Allowances': pay.allowances,
        'Gross Salary': pay.grossSalary,
        'PF Deduction': pay.providentFund,
        'Tax Deduction': pay.tax,
        'Absent Deduction': pay.absentDeduction,
        'Total Deductions': pay.totalDeductions,
        'Net Salary': pay.netSalary
      }));

      const detailedSheet = XLSX.utils.json_to_sheet(detailedData);
      XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Payroll Details');

      // Department summary sheet
      const deptSummaryData = Object.values(departmentSummary).map(dept => ({
        'Department': dept.department,
        'Employee Count': dept.employeeCount,
        'Total Gross Salary': dept.totalGrossSalary,
        'Total Net Salary': dept.totalNetSalary,
        'Total Deductions': dept.totalDeductions,
        'Avg Gross Salary': Math.round(dept.totalGrossSalary / dept.employeeCount),
        'Avg Net Salary': Math.round(dept.totalNetSalary / dept.employeeCount)
      }));

      const deptSummarySheet = XLSX.utils.json_to_sheet(deptSummaryData);
      XLSX.utils.book_append_sheet(workbook, deptSummarySheet, 'Department Summary');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Disposition', 'attachment; filename=payroll_report.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } else {
      res.json({
        period: { month, year },
        filters: { department },
        summary,
        departmentSummary: Object.values(departmentSummary),
        payrollRecords: payroll
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/dashboard
// @desc    Generate dashboard summary report
// @access  Private (HR Admin, Team Lead)
router.get('/dashboard', auth, requireRole(['HR_ADMIN', 'TEAM_LEAD']), async (req, res) => {
  try {
    const employees = await db.getAllEmployees();
    const attendance = await db.getAllAttendance();
    const performance = await db.getAllPerformance();
    const payroll = await db.getAllPayroll();

    // Current month data
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Filter current month data
    const currentMonthAttendance = attendance.filter(att => {
      const attDate = new Date(att.date);
      return attDate.getMonth() + 1 === currentMonth && attDate.getFullYear() === currentYear;
    });

    const currentMonthPerformance = performance.filter(perf => {
      const perfDate = new Date(perf.date);
      return perfDate.getMonth() + 1 === currentMonth && perfDate.getFullYear() === currentYear;
    });

    const currentMonthPayroll = payroll.filter(pay => {
      const payDate = new Date(pay.payPeriod);
      return payDate.getMonth() + 1 === currentMonth && payDate.getFullYear() === currentYear;
    });

    // Calculate dashboard metrics
    const dashboard = {
      employees: {
        total: employees.length,
        active: employees.filter(emp => emp.status === 'Active').length,
        byDepartment: {},
        recentHires: employees.filter(emp => {
          const hireDate = new Date(emp.dateOfJoining);
          const ninetyDaysAgo = new Date();
          ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
          return hireDate >= ninetyDaysAgo;
        }).length
      },
      attendance: {
        totalRecords: currentMonthAttendance.length,
        present: currentMonthAttendance.filter(att => att.status.toLowerCase() === 'present').length,
        absent: currentMonthAttendance.filter(att => att.status.toLowerCase() === 'absent').length,
        averageAttendance: 0,
        trend: getLast7DaysAttendanceTrend(attendance)
      },
      performance: {
        totalRecords: currentMonthPerformance.length,
        averageCallsHandled: 0,
        averageQualityScore: 0,
        averageAdherence: 0,
        topPerformers: getTopPerformers(performance, 5)
      },
      payroll: {
        totalProcessed: currentMonthPayroll.length,
        totalGrossSalary: currentMonthPayroll.reduce((sum, pay) => sum + pay.grossSalary, 0),
        totalNetSalary: currentMonthPayroll.reduce((sum, pay) => sum + pay.netSalary, 0),
        averageSalary: 0,
        departmentCosts: getDepartmentPayrollCosts(currentMonthPayroll)
      }
    };

    // Department-wise employee count
    employees.forEach(emp => {
      if (!dashboard.employees.byDepartment[emp.department]) {
        dashboard.employees.byDepartment[emp.department] = 0;
      }
      dashboard.employees.byDepartment[emp.department]++;
    });

    // Calculate averages
    if (currentMonthAttendance.length > 0) {
      dashboard.attendance.averageAttendance = Math.round(
        (dashboard.attendance.present / currentMonthAttendance.length) * 100
      );
    }

    if (currentMonthPerformance.length > 0) {
      dashboard.performance.averageCallsHandled = Math.round(
        currentMonthPerformance.reduce((sum, perf) => sum + perf.callsHandled, 0) / currentMonthPerformance.length
      );
      dashboard.performance.averageQualityScore = Math.round(
        currentMonthPerformance.reduce((sum, perf) => sum + perf.qualityScore, 0) / currentMonthPerformance.length * 100
      ) / 100;
      dashboard.performance.averageAdherence = Math.round(
        currentMonthPerformance.reduce((sum, perf) => sum + perf.adherencePercentage, 0) / currentMonthPerformance.length * 100
      ) / 100;
    }

    if (currentMonthPayroll.length > 0) {
      dashboard.payroll.averageSalary = Math.round(dashboard.payroll.totalNetSalary / currentMonthPayroll.length);
    }

    // Helper functions for dashboard metrics
    function getLast7DaysAttendanceTrend(attendanceData) {
      const trend = {};
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      // Initialize the trend object with dates
      for (let i = 0; i < 7; i++) {
        const day = new Date();
        day.setDate(day.getDate() - i);
        const dateStr = day.toISOString().split('T')[0];
        trend[dateStr] = { total: 0, present: 0, absent: 0, leave: 0 };
      }
      
      // Fill in the attendance data
      attendanceData.forEach(att => {
        const attDate = new Date(att.date);
        if (attDate >= sevenDaysAgo) {
          const dateStr = attDate.toISOString().split('T')[0];
          if (trend[dateStr]) {
            trend[dateStr].total++;
            const status = att.status.toLowerCase();
            if (status === 'present') trend[dateStr].present++;
            else if (status === 'absent') trend[dateStr].absent++;
            else if (status === 'leave') trend[dateStr].leave++;
          }
        }
      });
      
      return trend;
    }
    
    function getTopPerformers(performanceData, limit) {
      // Group by employee and calculate average scores
      const employeePerformance = {};
      performanceData.forEach(perf => {
        if (!employeePerformance[perf.employeeId]) {
          employeePerformance[perf.employeeId] = {
            employeeId: perf.employeeId,
            employeeName: perf.employeeName,
            totalScore: 0,
            count: 0
          };
        }
        employeePerformance[perf.employeeId].totalScore += perf.qualityScore;
        employeePerformance[perf.employeeId].count++;
      });
      
      // Calculate average and sort
      return Object.values(employeePerformance)
        .map(emp => ({
          employeeId: emp.employeeId,
          employeeName: emp.employeeName,
          averageScore: Math.round(emp.totalScore / emp.count * 100) / 100
        }))
        .sort((a, b) => b.averageScore - a.averageScore)
        .slice(0, limit);
    }
    
    function getDepartmentPayrollCosts(payrollData) {
      const deptCosts = {};
      payrollData.forEach(pay => {
        if (pay.department) {
          if (!deptCosts[pay.department]) {
            deptCosts[pay.department] = 0;
          }
          deptCosts[pay.department] += pay.netSalary;
        }
      });
      return deptCosts;
    }

    res.json({
      period: `${currentMonth}/${currentYear}`,
      dashboard
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/reports/payslip/email/:employeeId/:payPeriod
// @desc    Generate and email payslip PDF
// @access  Private (HR Admin only)
router.post('/payslip/email/:employeeId/:payPeriod', auth, requireRole(['HR_ADMIN']), async (req, res) => {
  // Temporarily disabled due to missing nodemailer dependency
  return res.status(503).json({ message: 'Email service is temporarily disabled' });
  try {
    const { employeeId, payPeriod } = req.params;
    
    // Get employee data
    const employee = await db.getEmployeeById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Get payroll data for the specified period
    // In a real implementation, this would query the database
    // For this prototype, we'll use mock data if not found
    let payroll = {}; // This would be fetched from the database
    
    // Mock data for demonstration
    payroll = {
      employeeId,
      payPeriod,
      workingDays: 22,
      presentDays: 20,
      basicSalary: 5000,
      allowances: 1000,
      deductions: 800,
      netSalary: 5200
    };
    
    // Generate PDF
    const pdfPath = await generatePayslipPDF(employee, payroll);
    
    // Read the PDF file
    const pdfBuffer = fs.readFileSync(pdfPath);
    
    // Send email with PDF attachment
    await sendPayslipEmail(employee, payroll, pdfBuffer);
    
    // Delete the file after sending (optional)
    // fs.unlinkSync(pdfPath);
    
    res.status(200).json({ message: 'Payslip sent successfully' });
  } catch (error) {
    console.error('Email payslip error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/performance-review/:employeeId/:period
// @desc    Generate and download performance review PDF
// @access  Private (HR Admin, Team Lead, Employee - own review only)
router.get('/performance-review/:employeeId/:period', auth, async (req, res) => {
  try {
    const { employeeId, period } = req.params;
    
    // Check if user is authorized to access this performance review
    if (req.user.role !== 'HR Admin' && req.user.role !== 'Team Lead' && req.user.employeeId !== employeeId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get employee data
    const employee = await db.getEmployeeById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Get performance data
    // In a real implementation, this would query the database
    // For this prototype, we'll use mock data
    const performanceData = [];
    
    // Generate mock data for demonstration
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      performanceData.push({
        employeeId,
        date,
        callsHandled: Math.floor(Math.random() * 30) + 30,
        qualityScore: Math.floor(Math.random() * 20) + 80,
        adherencePercentage: Math.floor(Math.random() * 15) + 85,
        notes: i % 5 === 0 ? 'Excellent performance' : ''
      });
    }
    
    // Generate PDF
    const pdfPath = await generatePerformanceReviewPDF(employee, performanceData, period);
    
    // Send file for download
    res.download(pdfPath, `Performance_Review_${employeeId}_${period.replace(/\s/g, '_')}.pdf`, (err) => {
      if (err) {
        console.error('Error sending file:', err);
      } else {
        // Delete the file after sending (optional)
        // fs.unlinkSync(pdfPath);
      }
    });
  } catch (error) {
    console.error('Generate performance review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/payslip/:employeeId/:payPeriod
// @desc    Generate and download payslip PDF
// @access  Private (HR Admin, Employee)
router.get('/payslip/:employeeId/:payPeriod', auth, async (req, res) => {
  try {
    const { employeeId, payPeriod } = req.params;
    
    // Authorization check - only HR Admin or the employee themselves can access
    if (req.user.role !== 'HR Admin' && req.user.employeeId !== employeeId) {
      return res.status(403).json({ message: 'Not authorized to access this payslip' });
    }
    
    // Get employee data
    const employee = await db.getEmployeeById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Get payroll data for the period
    // For demo, we'll use mock data if real data isn't available
    let payrollData = await db.getPayrollByEmployeeAndPeriod(employeeId, payPeriod);
    
    if (!payrollData) {
      // Use mock data for demonstration
      payrollData = {
        employeeId,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        payPeriod,
        basicSalary: 5000,
        allowances: 1000,
        deductions: 500,
        taxAmount: 800,
        netSalary: 4700,
        paymentDate: new Date().toISOString().split('T')[0],
        bankAccount: employee.bankAccount || '****1234',
        department: employee.department
      };
    }
    
    // Generate PDF
    const pdfPath = await generatePayslipPDF(payrollData, employee);
    
    // Send file for download
    res.download(pdfPath, `Payslip_${employeeId}_${payPeriod}.pdf`, (err) => {
      if (err) {
        console.error('Error sending file:', err);
      } else {
        // Delete the file after sending (optional)
        // fs.unlinkSync(pdfPath);
      }
    });
  } catch (error) {
    console.error('Error generating payslip:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/reports/payslip/email/:employeeId/:payPeriod
// @desc    Email payslip PDF to employee
// @access  Private (HR Admin)
router.post('/payslip/email/:employeeId/:payPeriod', auth, requireRole(['HR_ADMIN']), async (req, res) => {
  // Temporarily disabled due to missing nodemailer dependency
  return res.status(503).json({ message: 'Email service is temporarily disabled' });
  try {
    const { employeeId, payPeriod } = req.params;
    
    // Get employee data
    const employee = await db.getEmployeeById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    if (!employee.email) {
      return res.status(400).json({ message: 'Employee email not found' });
    }
    
    // Get payroll data for the period
    // For demo, we'll use mock data if real data isn't available
    let payrollData = await db.getPayrollByEmployeeAndPeriod(employeeId, payPeriod);
    
    if (!payrollData) {
      // Use mock data for demonstration
      payrollData = {
        employeeId,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        payPeriod,
        basicSalary: 5000,
        allowances: 1000,
        deductions: 500,
        taxAmount: 800,
        netSalary: 4700,
        paymentDate: new Date().toISOString().split('T')[0],
        bankAccount: employee.bankAccount || '****1234',
        department: employee.department
      };
    }
    
    // Generate PDF
    const pdfPath = await generatePayslipPDF(payrollData, employee);
    
    // Send email with PDF attachment
    if (emailEnabled) {
      await sendPayslipEmail(employee.email, employee.firstName, payPeriod, pdfPath);
      
      // Delete the file after sending
      fs.unlinkSync(pdfPath);
      
      res.json({ success: true, message: 'Payslip sent successfully' });
    } else {
      res.json({ 
        success: false, 
        message: 'Email service is disabled. Enable it in environment variables.',
        note: 'PDF was generated but not sent.'
      });
    }
  } catch (error) {
    console.error('Error emailing payslip:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
