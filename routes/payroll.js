const express = require('express');
const PDFDocument = require('pdfkit');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const db = require('../config/database');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/payroll
// @desc    Get all payroll records
// @access  Private (HR Admin only)
router.get('/', auth, requireRole(['HR_ADMIN']), async (req, res) => {
  try {
    const { month, year, employeeId } = req.query;
    let payroll = await db.getAllPayroll();

    // Filter by month and year if provided
    if (month && year) {
      payroll = payroll.filter(pay => {
        const payDate = new Date(pay.payPeriod);
        return payDate.getMonth() + 1 === parseInt(month) && 
               payDate.getFullYear() === parseInt(year);
      });
    }

    // Filter by employee if provided
    if (employeeId) {
      payroll = payroll.filter(pay => pay.employeeId === employeeId);
    }

    res.json(payroll);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/payroll/calculate
// @desc    Calculate payroll for a specific period
// @access  Private (HR Admin only)
router.post('/calculate', auth, requireRole(['HR_ADMIN']), async (req, res) => {
  try {
    const { month, year, employeeIds } = req.body;

    if (!month || !year) {
      return res.status(400).json({ message: 'Please provide month and year' });
    }

    const employees = await db.getAllEmployees();
    let targetEmployees = employees;

    // Filter employees if specific IDs provided
    if (employeeIds && employeeIds.length > 0) {
      targetEmployees = employees.filter(emp => employeeIds.includes(emp.employeeId));
    }

    const results = {
      success: [],
      errors: []
    };

    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Get attendance data for the period
    const attendance = await db.getAttendanceByDateRange(startDateStr, endDateStr);

    for (const employee of targetEmployees) {
      try {
        // Calculate attendance summary for employee
        const empAttendance = attendance.filter(att => att.employeeId === employee.employeeId);
        
        const attendanceSummary = {
          present: 0,
          absent: 0,
          halfDay: 0,
          leave: 0,
          totalDays: empAttendance.length
        };

        empAttendance.forEach(att => {
          switch (att.status.toLowerCase()) {
            case 'present':
              attendanceSummary.present++;
              break;
            case 'absent':
              attendanceSummary.absent++;
              break;
            case 'half day':
              attendanceSummary.halfDay++;
              break;
            case 'leave':
              attendanceSummary.leave++;
              break;
          }
        });

        // Calculate working days (excluding weekends)
        const workingDays = getWorkingDaysInMonth(year, month - 1);
        
        // Calculate salary components
        const baseSalary = employee.baseSalary || 0;
        const dailyRate = baseSalary / workingDays;
        
        // Calculate effective working days (present + half days as 0.5)
        const effectiveWorkingDays = attendanceSummary.present + (attendanceSummary.halfDay * 0.5);
        
        // Basic salary calculation
        const earnedBasicSalary = Math.round(dailyRate * effectiveWorkingDays);
        
        // Allowances (example: 20% of basic salary)
        const allowances = Math.round(earnedBasicSalary * 0.2);
        
        // Deductions
        const providentFund = Math.round(earnedBasicSalary * 0.12); // 12% PF
        const tax = Math.round((earnedBasicSalary + allowances) * 0.1); // 10% tax
        const absentDeduction = Math.round(dailyRate * attendanceSummary.absent);
        
        const totalDeductions = providentFund + tax + absentDeduction;
        const grossSalary = earnedBasicSalary + allowances;
        const netSalary = grossSalary - totalDeductions;

        const payrollData = {
          employeeId: employee.employeeId,
          employeeName: employee.name,
          department: employee.department,
          designation: employee.designation,
          payPeriod: `${year}-${month.toString().padStart(2, '0')}-01`,
          baseSalary: baseSalary,
          workingDays: workingDays,
          presentDays: attendanceSummary.present,
          absentDays: attendanceSummary.absent,
          halfDays: attendanceSummary.halfDay,
          leaveDays: attendanceSummary.leave,
          effectiveWorkingDays: effectiveWorkingDays,
          earnedBasicSalary: earnedBasicSalary,
          allowances: allowances,
          grossSalary: grossSalary,
          providentFund: providentFund,
          tax: tax,
          absentDeduction: absentDeduction,
          totalDeductions: totalDeductions,
          netSalary: netSalary
        };

        const payroll = await db.createPayroll(payrollData);
        results.success.push(payroll);
      } catch (error) {
        results.errors.push({
          employeeId: employee.employeeId,
          employeeName: employee.name,
          error: error.message
        });
      }
    }

    res.json({
      message: `Payroll calculation completed. ${results.success.length} records created, ${results.errors.length} errors.`,
      results
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/payroll/export/excel
// @desc    Export payroll to Excel
// @access  Private (HR Admin only)
router.get('/export/excel', auth, requireRole(['HR_ADMIN']), async (req, res) => {
  try {
    const { month, year } = req.query;
    let payroll = await db.getAllPayroll();

    // Filter by month and year if provided
    if (month && year) {
      payroll = payroll.filter(pay => {
        const payDate = new Date(pay.payPeriod);
        return payDate.getMonth() + 1 === parseInt(month) && 
               payDate.getFullYear() === parseInt(year);
      });
    }

    // Prepare data for Excel
    const excelData = payroll.map(pay => ({
      'Employee ID': pay.employeeId,
      'Employee Name': pay.employeeName,
      'Department': pay.department,
      'Designation': pay.designation,
      'Pay Period': pay.payPeriod,
      'Base Salary': pay.baseSalary,
      'Working Days': pay.workingDays,
      'Present Days': pay.presentDays,
      'Absent Days': pay.absentDays,
      'Half Days': pay.halfDays,
      'Leave Days': pay.leaveDays,
      'Effective Working Days': pay.effectiveWorkingDays,
      'Earned Basic Salary': pay.earnedBasicSalary,
      'Allowances': pay.allowances,
      'Gross Salary': pay.grossSalary,
      'Provident Fund': pay.providentFund,
      'Tax': pay.tax,
      'Absent Deduction': pay.absentDeduction,
      'Total Deductions': pay.totalDeductions,
      'Net Salary': pay.netSalary
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payroll');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const filename = `payroll_${month || 'all'}_${year || new Date().getFullYear()}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error generating Excel file' });
  }
});

// @route   GET /api/payroll/payslip/:employeeId
// @desc    Generate payslip PDF for employee
// @access  Private (HR Admin only)
router.get('/payslip/:employeeId', auth, requireRole(['HR_ADMIN']), async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: 'Please provide month and year' });
    }

    const payroll = await db.getAllPayroll();
    const payrollRecord = payroll.find(pay => {
      const payDate = new Date(pay.payPeriod);
      return pay.employeeId === employeeId &&
             payDate.getMonth() + 1 === parseInt(month) &&
             payDate.getFullYear() === parseInt(year);
    });

    if (!payrollRecord) {
      return res.status(404).json({ message: 'Payroll record not found' });
    }

    // Create PDF
    const doc = new PDFDocument();
    const filename = `payslip_${employeeId}_${month}_${year}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

    doc.pipe(res);

    // PDF Header
    doc.fontSize(20).text('PAYSLIP', 50, 50, { align: 'center' });
    doc.fontSize(12).text(`Pay Period: ${getMonthName(parseInt(month))} ${year}`, 50, 80, { align: 'center' });

    // Employee Details
    doc.fontSize(14).text('Employee Details:', 50, 120);
    doc.fontSize(10)
       .text(`Employee ID: ${payrollRecord.employeeId}`, 50, 140)
       .text(`Name: ${payrollRecord.employeeName}`, 50, 155)
       .text(`Department: ${payrollRecord.department}`, 50, 170)
       .text(`Designation: ${payrollRecord.designation}`, 50, 185);

    // Attendance Summary
    doc.fontSize(14).text('Attendance Summary:', 300, 120);
    doc.fontSize(10)
       .text(`Working Days: ${payrollRecord.workingDays}`, 300, 140)
       .text(`Present Days: ${payrollRecord.presentDays}`, 300, 155)
       .text(`Absent Days: ${payrollRecord.absentDays}`, 300, 170)
       .text(`Half Days: ${payrollRecord.halfDays}`, 300, 185)
       .text(`Leave Days: ${payrollRecord.leaveDays}`, 300, 200);

    // Salary Details
    doc.fontSize(14).text('Salary Details:', 50, 230);
    
    // Earnings
    doc.fontSize(12).text('Earnings:', 50, 250);
    doc.fontSize(10)
       .text(`Basic Salary: ₹${payrollRecord.earnedBasicSalary}`, 70, 270)
       .text(`Allowances: ₹${payrollRecord.allowances}`, 70, 285)
       .text(`Gross Salary: ₹${payrollRecord.grossSalary}`, 70, 305, { underline: true });

    // Deductions
    doc.fontSize(12).text('Deductions:', 300, 250);
    doc.fontSize(10)
       .text(`Provident Fund: ₹${payrollRecord.providentFund}`, 320, 270)
       .text(`Tax: ₹${payrollRecord.tax}`, 320, 285)
       .text(`Absent Deduction: ₹${payrollRecord.absentDeduction}`, 320, 300)
       .text(`Total Deductions: ₹${payrollRecord.totalDeductions}`, 320, 320, { underline: true });

    // Net Salary
    doc.fontSize(16).text(`Net Salary: ₹${payrollRecord.netSalary}`, 50, 350, { 
      align: 'center',
      underline: true,
      stroke: true
    });

    // Footer
    doc.fontSize(8).text('This is a computer-generated payslip and does not require a signature.', 50, 500, { align: 'center' });

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error generating payslip' });
  }
});

// Helper function to get working days in a month (excluding weekends)
function getWorkingDaysInMonth(year, month) {
  const date = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate();
  let workingDays = 0;

  for (let day = 1; day <= lastDay; day++) {
    date.setDate(day);
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
      workingDays++;
    }
  }

  return workingDays;
}

// Helper function to get month name
function getMonthName(monthNumber) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthNumber - 1];
}

module.exports = router;
