/**
 * PDF Generator Utility
 * 
 * This module provides functionality for generating various PDF reports
 * in the HRMS system, such as payslips, attendance reports, and performance reviews.
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

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

/**
 * Generate a payslip PDF for an employee
 * @param {Object} employee - Employee data
 * @param {Object} payroll - Payroll data
 * @param {string} outputPath - Optional custom output path
 * @returns {Promise<string>} - Path to the generated PDF file
 */
const generatePayslipPDF = async (employee, payroll, outputPath = null) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Payslip - ${employee.name} - ${payroll.payPeriod}`,
          Author: 'HRMS Enhanced',
          Subject: 'Employee Payslip',
        }
      });

      // Set default output path if not provided
      if (!outputPath) {
        const fileName = `Payslip_${employee.employeeId}_${payroll.payPeriod.replace(/\s/g, '_')}.pdf`;
        outputPath = path.join(reportsDir, fileName);
      }

      // Pipe output to file
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // Add company logo (placeholder)
      // doc.image('path/to/logo.png', 50, 45, { width: 150 });

      // Add company name and address
      doc.fontSize(20).text('HRMS Enhanced', { align: 'right' });
      doc.fontSize(10).text('123 Business Street', { align: 'right' });
      doc.text('City, State 12345', { align: 'right' });
      doc.text('Phone: (123) 456-7890', { align: 'right' });
      doc.moveDown(2);

      // Add payslip title
      doc.fontSize(16).text('PAYSLIP', { align: 'center' });
      doc.fontSize(12).text(`Pay Period: ${payroll.payPeriod}`, { align: 'center' });
      doc.moveDown(2);

      // Add employee details
      doc.fontSize(12).text('Employee Details', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      doc.text(`Employee ID: ${employee.employeeId}`);
      doc.text(`Name: ${employee.name}`);
      doc.text(`Department: ${employee.department}`);
      doc.text(`Designation: ${employee.designation}`);
      doc.text(`Date of Joining: ${new Date(employee.dateOfJoining).toLocaleDateString()}`);
      doc.moveDown(2);

      // Add attendance summary
      doc.fontSize(12).text('Attendance Summary', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      doc.text(`Working Days: ${payroll.workingDays}`);
      doc.text(`Present Days: ${payroll.presentDays}`);
      doc.text(`Absent Days: ${payroll.workingDays - payroll.presentDays}`);
      doc.moveDown(2);

      // Add earnings table
      doc.fontSize(12).text('Earnings', { underline: true });
      doc.moveDown(0.5);
      
      // Table headers
      const earningsTable = {
        headers: ['Description', 'Amount'],
        rows: [
          ['Basic Salary', `$${payroll.basicSalary.toFixed(2)}`],
          ['Allowances', `$${payroll.allowances.toFixed(2)}`]
        ]
      };
      
      // Draw table
      const earningsStartY = doc.y;
      doc.fontSize(10);
      
      // Draw headers
      doc.font('Helvetica-Bold');
      doc.text(earningsTable.headers[0], 50, earningsStartY, { width: 200 });
      doc.text(earningsTable.headers[1], 250, earningsStartY, { width: 200, align: 'right' });
      doc.font('Helvetica');
      
      // Draw rows
      let rowY = earningsStartY + 20;
      earningsTable.rows.forEach(row => {
        doc.text(row[0], 50, rowY, { width: 200 });
        doc.text(row[1], 250, rowY, { width: 200, align: 'right' });
        rowY += 20;
      });
      
      // Draw total
      rowY += 10;
      doc.moveTo(50, rowY).lineTo(450, rowY).stroke();
      rowY += 10;
      doc.font('Helvetica-Bold');
      doc.text('Total Earnings', 50, rowY, { width: 200 });
      doc.text(`$${(payroll.basicSalary + payroll.allowances).toFixed(2)}`, 250, rowY, { width: 200, align: 'right' });
      doc.font('Helvetica');
      
      doc.moveDown(3);
      
      // Add deductions table
      doc.fontSize(12).text('Deductions', { underline: true });
      doc.moveDown(0.5);
      
      // Table headers
      const deductionsTable = {
        headers: ['Description', 'Amount'],
        rows: [
          ['Tax', `$${(payroll.deductions * 0.7).toFixed(2)}`],
          ['Other Deductions', `$${(payroll.deductions * 0.3).toFixed(2)}`]
        ]
      };
      
      // Draw table
      const deductionsStartY = doc.y;
      doc.fontSize(10);
      
      // Draw headers
      doc.font('Helvetica-Bold');
      doc.text(deductionsTable.headers[0], 50, deductionsStartY, { width: 200 });
      doc.text(deductionsTable.headers[1], 250, deductionsStartY, { width: 200, align: 'right' });
      doc.font('Helvetica');
      
      // Draw rows
      rowY = deductionsStartY + 20;
      deductionsTable.rows.forEach(row => {
        doc.text(row[0], 50, rowY, { width: 200 });
        doc.text(row[1], 250, rowY, { width: 200, align: 'right' });
        rowY += 20;
      });
      
      // Draw total
      rowY += 10;
      doc.moveTo(50, rowY).lineTo(450, rowY).stroke();
      rowY += 10;
      doc.font('Helvetica-Bold');
      doc.text('Total Deductions', 50, rowY, { width: 200 });
      doc.text(`$${payroll.deductions.toFixed(2)}`, 250, rowY, { width: 200, align: 'right' });
      doc.font('Helvetica');
      
      doc.moveDown(3);
      
      // Add net salary
      doc.fontSize(14).font('Helvetica-Bold');
      doc.text('Net Salary', 50, doc.y, { width: 200 });
      doc.text(`$${payroll.netSalary.toFixed(2)}`, 250, doc.y, { width: 200, align: 'right' });
      doc.font('Helvetica');
      
      doc.moveDown(4);
      
      // Add footer
      doc.fontSize(8).text('This is a computer-generated document. No signature is required.', { align: 'center' });
      doc.text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
      
      // Finalize PDF file
      doc.end();
      
      stream.on('finish', () => {
        resolve(outputPath);
      });
      
      stream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate an attendance report PDF
 * @param {Array} attendanceData - Array of attendance records
 * @param {Object} options - Report options (startDate, endDate, employeeId, etc.)
 * @param {string} outputPath - Optional custom output path
 * @returns {Promise<string>} - Path to the generated PDF file
 */
const generateAttendanceReportPDF = async (attendanceData, options, outputPath = null) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: 'Attendance Report',
          Author: 'HRMS Enhanced',
          Subject: 'Employee Attendance Report',
        }
      });

      // Set default output path if not provided
      if (!outputPath) {
        const fileName = `Attendance_Report_${options.startDate}_to_${options.endDate}.pdf`;
        outputPath = path.join(reportsDir, fileName);
      }

      // Pipe output to file
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // Add title
      doc.fontSize(20).text('Attendance Report', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).text(`Period: ${options.startDate} to ${options.endDate}`, { align: 'center' });
      
      if (options.employeeId) {
        doc.text(`Employee ID: ${options.employeeId}`, { align: 'center' });
      }
      
      if (options.department) {
        doc.text(`Department: ${options.department}`, { align: 'center' });
      }
      
      doc.moveDown(2);

      // Add attendance summary
      const totalDays = attendanceData.length;
      const presentDays = attendanceData.filter(a => a.status === 'Present').length;
      const absentDays = attendanceData.filter(a => a.status === 'Absent').length;
      const lateDays = attendanceData.filter(a => a.status === 'Late').length;
      
      doc.fontSize(14).text('Summary', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      doc.text(`Total Records: ${totalDays}`);
      doc.text(`Present: ${presentDays} (${((presentDays / totalDays) * 100).toFixed(2)}%)`);
      doc.text(`Absent: ${absentDays} (${((absentDays / totalDays) * 100).toFixed(2)}%)`);
      doc.text(`Late: ${lateDays} (${((lateDays / totalDays) * 100).toFixed(2)}%)`);
      doc.moveDown(2);

      // Add attendance details table
      doc.fontSize(14).text('Attendance Details', { underline: true });
      doc.moveDown(0.5);
      
      // Table headers
      const tableTop = doc.y;
      const tableHeaders = ['Date', 'Employee ID', 'Status', 'Check In', 'Check Out'];
      const columnWidths = [80, 80, 80, 100, 100];
      
      // Draw headers
      doc.font('Helvetica-Bold').fontSize(10);
      let xPos = 50;
      tableHeaders.forEach((header, i) => {
        doc.text(header, xPos, tableTop, { width: columnWidths[i], align: 'left' });
        xPos += columnWidths[i];
      });
      
      // Draw rows
      doc.font('Helvetica').fontSize(9);
      let rowY = tableTop + 20;
      
      // Only show first 30 records to avoid very large PDFs
      const recordsToShow = attendanceData.slice(0, 30);
      
      recordsToShow.forEach((record, index) => {
        // Add a new page if we're at the bottom
        if (rowY > 700) {
          doc.addPage();
          rowY = 50;
          
          // Redraw headers on new page
          doc.font('Helvetica-Bold').fontSize(10);
          xPos = 50;
          tableHeaders.forEach((header, i) => {
            doc.text(header, xPos, rowY, { width: columnWidths[i], align: 'left' });
            xPos += columnWidths[i];
          });
          doc.font('Helvetica').fontSize(9);
          rowY += 20;
        }
        
        // Draw row with alternating background
        if (index % 2 === 0) {
          doc.rect(50, rowY, 440, 20).fill('#f5f5f5');
          doc.fillColor('black');
        }
        
        // Draw row data
        xPos = 50;
        const date = new Date(record.date).toLocaleDateString();
        const checkIn = record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : 'N/A';
        const checkOut = record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : 'N/A';
        
        const rowData = [date, record.employeeId, record.status, checkIn, checkOut];
        
        rowData.forEach((data, i) => {
          doc.text(data, xPos, rowY + 5, { width: columnWidths[i], align: 'left' });
          xPos += columnWidths[i];
        });
        
        rowY += 20;
      });
      
      // Add note if records were truncated
      if (attendanceData.length > 30) {
        doc.moveDown(1);
        doc.fontSize(9).text(`Note: Showing 30 of ${attendanceData.length} records. Please export to CSV for complete data.`, { italic: true });
      }
      
      // Add footer
      doc.fontSize(8).text('This is a computer-generated document. No signature is required.', { align: 'center' });
      doc.text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
      
      // Finalize PDF file
      doc.end();
      
      stream.on('finish', () => {
        resolve(outputPath);
      });
      
      stream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate a performance review PDF
 * @param {Object} employee - Employee data
 * @param {Array} performanceData - Performance records
 * @param {string} period - Review period (e.g., "Q1 2023")
 * @param {string} outputPath - Optional custom output path
 * @returns {Promise<string>} - Path to the generated PDF file
 */
const generatePerformanceReviewPDF = async (employee, performanceData, period, outputPath = null) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Performance Review - ${employee.name} - ${period}`,
          Author: 'HRMS Enhanced',
          Subject: 'Employee Performance Review',
        }
      });

      // Set default output path if not provided
      if (!outputPath) {
        const fileName = `Performance_Review_${employee.employeeId}_${period.replace(/\s/g, '_')}.pdf`;
        outputPath = path.join(reportsDir, fileName);
      }

      // Pipe output to file
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // Add title
      doc.fontSize(20).text('Performance Review', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).text(`Period: ${period}`, { align: 'center' });
      doc.moveDown(2);

      // Add employee details
      doc.fontSize(14).text('Employee Information', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      doc.text(`Employee ID: ${employee.employeeId}`);
      doc.text(`Name: ${employee.name}`);
      doc.text(`Department: ${employee.department}`);
      doc.text(`Designation: ${employee.designation}`);
      doc.text(`Date of Joining: ${new Date(employee.dateOfJoining).toLocaleDateString()}`);
      doc.moveDown(2);

      // Calculate performance metrics
      const avgCallsHandled = performanceData.reduce((sum, p) => sum + p.callsHandled, 0) / performanceData.length;
      const avgQualityScore = performanceData.reduce((sum, p) => sum + p.qualityScore, 0) / performanceData.length;
      const avgAdherence = performanceData.reduce((sum, p) => sum + p.adherencePercentage, 0) / performanceData.length;
      
      // Add performance summary
      doc.fontSize(14).text('Performance Summary', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      doc.text(`Average Calls Handled: ${avgCallsHandled.toFixed(2)} per day`);
      doc.text(`Average Quality Score: ${avgQualityScore.toFixed(2)}%`);
      doc.text(`Average Adherence: ${avgAdherence.toFixed(2)}%`);
      doc.moveDown(1);
      
      // Add performance rating
      let overallRating = (avgQualityScore * 0.5) + (avgAdherence * 0.3) + (Math.min(avgCallsHandled / 50, 1) * 20 * 0.2);
      let ratingText = '';
      
      if (overallRating >= 90) ratingText = 'Excellent';
      else if (overallRating >= 80) ratingText = 'Very Good';
      else if (overallRating >= 70) ratingText = 'Good';
      else if (overallRating >= 60) ratingText = 'Satisfactory';
      else ratingText = 'Needs Improvement';
      
      doc.font('Helvetica-Bold');
      doc.text(`Overall Performance Rating: ${overallRating.toFixed(2)}% (${ratingText})`);
      doc.font('Helvetica');
      doc.moveDown(2);

      // Add performance details table
      doc.fontSize(14).text('Performance Details', { underline: true });
      doc.moveDown(0.5);
      
      // Table headers
      const tableTop = doc.y;
      const tableHeaders = ['Date', 'Calls Handled', 'Quality Score', 'Adherence %', 'Notes'];
      const columnWidths = [80, 80, 80, 80, 120];
      
      // Draw headers
      doc.font('Helvetica-Bold').fontSize(10);
      let xPos = 50;
      tableHeaders.forEach((header, i) => {
        doc.text(header, xPos, tableTop, { width: columnWidths[i], align: 'left' });
        xPos += columnWidths[i];
      });
      
      // Draw rows
      doc.font('Helvetica').fontSize(9);
      let rowY = tableTop + 20;
      
      // Only show first 15 records to avoid very large PDFs
      const recordsToShow = performanceData.slice(0, 15);
      
      recordsToShow.forEach((record, index) => {
        // Add a new page if we're at the bottom
        if (rowY > 700) {
          doc.addPage();
          rowY = 50;
          
          // Redraw headers on new page
          doc.font('Helvetica-Bold').fontSize(10);
          xPos = 50;
          tableHeaders.forEach((header, i) => {
            doc.text(header, xPos, rowY, { width: columnWidths[i], align: 'left' });
            xPos += columnWidths[i];
          });
          doc.font('Helvetica').fontSize(9);
          rowY += 20;
        }
        
        // Draw row with alternating background
        if (index % 2 === 0) {
          doc.rect(50, rowY, 440, 20).fill('#f5f5f5');
          doc.fillColor('black');
        }
        
        // Draw row data
        xPos = 50;
        const date = new Date(record.date).toLocaleDateString();
        
        const rowData = [
          date, 
          record.callsHandled.toString(), 
          `${record.qualityScore}%`, 
          `${record.adherencePercentage}%`, 
          record.notes || ''
        ];
        
        rowData.forEach((data, i) => {
          doc.text(data, xPos, rowY + 5, { width: columnWidths[i], align: 'left' });
          xPos += columnWidths[i];
        });
        
        rowY += 20;
      });
      
      // Add note if records were truncated
      if (performanceData.length > 15) {
        doc.moveDown(1);
        doc.fontSize(9).text(`Note: Showing 15 of ${performanceData.length} records.`, { italic: true });
      }
      
      // Add recommendations section
      doc.moveDown(2);
      doc.fontSize(14).text('Recommendations', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      
      if (overallRating >= 80) {
        doc.text('Employee is performing exceptionally well. Consider for promotion or additional responsibilities.');
      } else if (overallRating >= 70) {
        doc.text('Employee is performing well. Provide positive feedback and opportunities for growth.');
      } else if (overallRating >= 60) {
        doc.text('Employee is meeting expectations. Identify areas for improvement and provide necessary support.');
      } else {
        doc.text('Employee needs improvement. Develop a performance improvement plan and provide additional training.');
      }
      
      // Add signature section
      doc.moveDown(4);
      doc.text('_______________________', 50, doc.y, { width: 200 });
      doc.text('_______________________', 300, doc.y, { width: 200 });
      doc.moveDown(0.5);
      doc.text('Manager Signature', 50, doc.y, { width: 200 });
      doc.text('Employee Signature', 300, doc.y, { width: 200 });
      
      // Add footer
      doc.moveDown(2);
      doc.fontSize(8).text('This is a computer-generated document.', { align: 'center' });
      doc.text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
      
      // Finalize PDF file
      doc.end();
      
      stream.on('finish', () => {
        resolve(outputPath);
      });
      
      stream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generatePayslipPDF,
  generateAttendanceReportPDF,
  generatePerformanceReviewPDF
};
