import React, { useState } from 'react';

const Reports = ({ user }) => {
  const [loading, setLoading] = useState(false);

  const downloadReport = async (reportType, params = {}) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams(params).toString();
      const url = `/api/reports/${reportType}?format=excel&${queryParams}`;
      window.open(url);
    } catch (error) {
      alert('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const generateEmployeeReport = () => {
    const department = prompt('Enter department (optional):') || '';
    downloadReport('employees', { department });
  };

  const generateAttendanceReport = () => {
    const startDate = prompt('Enter start date (YYYY-MM-DD):');
    const endDate = prompt('Enter end date (YYYY-MM-DD):');
    const department = prompt('Enter department (optional):') || '';
    
    if (!startDate || !endDate) {
      alert('Please provide both start and end dates');
      return;
    }
    
    downloadReport('attendance', { startDate, endDate, department });
  };

  const generatePerformanceReport = () => {
    const startDate = prompt('Enter start date (YYYY-MM-DD):');
    const endDate = prompt('Enter end date (YYYY-MM-DD):');
    const department = prompt('Enter department (optional):') || '';
    
    if (!startDate || !endDate) {
      alert('Please provide both start and end dates');
      return;
    }
    
    downloadReport('performance', { startDate, endDate, department });
  };

  const generatePayrollReport = () => {
    const month = prompt('Enter month (1-12):');
    const year = prompt('Enter year (e.g., 2024):');
    const department = prompt('Enter department (optional):') || '';
    
    if (!month || !year) {
      alert('Please provide both month and year');
      return;
    }
    
    downloadReport('payroll', { month, year, department });
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Reports</h1>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Generate Reports</h3>
        </div>
        <div className="card-body">
          <div className="form-row">
            <div className="card">
              <div className="card-body text-center">
                <h4>Employee Report</h4>
                <p>Generate comprehensive employee master report with filtering options.</p>
                <button 
                  onClick={generateEmployeeReport}
                  className="btn btn-primary"
                  disabled={loading}
                >
                  Generate Employee Report
                </button>
              </div>
            </div>

            <div className="card">
              <div className="card-body text-center">
                <h4>Attendance Report</h4>
                <p>Generate detailed attendance reports with summary statistics.</p>
                <button 
                  onClick={generateAttendanceReport}
                  className="btn btn-success"
                  disabled={loading}
                >
                  Generate Attendance Report
                </button>
              </div>
            </div>

            <div className="card">
              <div className="card-body text-center">
                <h4>Performance Report</h4>
                <p>Generate performance analysis reports with employee metrics.</p>
                <button 
                  onClick={generatePerformanceReport}
                  className="btn btn-secondary"
                  disabled={loading}
                >
                  Generate Performance Report
                </button>
              </div>
            </div>

            {user.role === 'HR_ADMIN' && (
              <div className="card">
                <div className="card-body text-center">
                  <h4>Payroll Report</h4>
                  <p>Generate comprehensive payroll reports with salary breakdowns.</p>
                  <button 
                    onClick={generatePayrollReport}
                    className="btn btn-danger"
                    disabled={loading}
                  >
                    Generate Payroll Report
                  </button>
                </div>
              </div>
            )}
          </div>

          {loading && (
            <div className="text-center mt-3">
              <div className="loading-spinner"></div>
              <p>Generating report...</p>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Report Features</h3>
        </div>
        <div className="card-body">
          <ul>
            <li><strong>Employee Reports:</strong> Complete employee master data with department filtering</li>
            <li><strong>Attendance Reports:</strong> Detailed attendance records with summary statistics and employee-wise analysis</li>
            <li><strong>Performance Reports:</strong> Performance metrics including calls handled, quality scores, and adherence percentages</li>
            {user.role === 'HR_ADMIN' && (
              <li><strong>Payroll Reports:</strong> Comprehensive salary reports with earnings, deductions, and department-wise summaries</li>
            )}
            <li><strong>Export Formats:</strong> All reports are exported as Excel files with multiple sheets for detailed analysis</li>
            <li><strong>Date Range Filtering:</strong> Flexible date range selection for time-based reports</li>
            <li><strong>Department Filtering:</strong> Filter reports by specific departments</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Reports;
