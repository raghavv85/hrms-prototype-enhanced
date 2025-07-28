import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  AttendanceChart, 
  PerformanceChart, 
  DepartmentChart,
  PayrollChart 
} from './charts';

const Dashboard = ({ user }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/reports/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        {error}
      </div>
    );
  }

  const { dashboard } = dashboardData || {};

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Dashboard</h1>
        <div className="text-right">
          <small>Welcome back, {user.username}!</small><br />
          <small>Period: {dashboardData?.period}</small>
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-number">{dashboard?.employees?.total || 0}</div>
          <div className="stat-label">Total Employees</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-number">{dashboard?.employees?.active || 0}</div>
          <div className="stat-label">Active Employees</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-number">{dashboard?.attendance?.averageAttendance || 0}%</div>
          <div className="stat-label">Average Attendance</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-number">{dashboard?.performance?.averageQualityScore || 0}</div>
          <div className="stat-label">Avg Quality Score</div>
        </div>
      </div>
      
      <div className="dashboard-charts">
        <AttendanceChart attendanceTrend={dashboard?.attendance?.trend} />
        <PerformanceChart topPerformers={dashboard?.performance?.topPerformers} />
      </div>
      
      <div className="dashboard-charts">
        <DepartmentChart departmentData={dashboard?.employees?.byDepartment} />
        {user.role === 'HR_ADMIN' && (
          <PayrollChart departmentCosts={dashboard?.payroll?.departmentCosts} />
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Department Overview</h3>
        </div>
        <div className="card-body">
          {dashboard?.employees?.byDepartment && Object.keys(dashboard.employees.byDepartment).length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Employee Count</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(dashboard.employees.byDepartment).map(([dept, count]) => (
                    <tr key={dept}>
                      <td>{dept}</td>
                      <td>{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No department data available</p>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Current Month Summary</h3>
        </div>
        <div className="card-body">
          <div className="form-row">
            <div>
              <h4>Attendance</h4>
              <p>Total Records: {dashboard?.attendance?.totalRecords || 0}</p>
              <p>Present: {dashboard?.attendance?.present || 0}</p>
              <p>Absent: {dashboard?.attendance?.absent || 0}</p>
            </div>
            
            <div>
              <h4>Performance</h4>
              <p>Total Records: {dashboard?.performance?.totalRecords || 0}</p>
              <p>Avg Calls Handled: {dashboard?.performance?.averageCallsHandled || 0}</p>
              <p>Avg Adherence: {dashboard?.performance?.averageAdherence || 0}%</p>
            </div>
            
            {user.role === 'HR_ADMIN' && (
              <div>
                <h4>Payroll</h4>
                <p>Processed: {dashboard?.payroll?.totalProcessed || 0}</p>
                <p>Total Gross: ₹{dashboard?.payroll?.totalGrossSalary?.toLocaleString() || 0}</p>
                <p>Avg Salary: ₹{dashboard?.payroll?.averageSalary?.toLocaleString() || 0}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Quick Actions</h3>
        </div>
        <div className="card-body">
          <div className="d-flex gap-2">
            {user.role === 'HR_ADMIN' && (
              <>
                <a href="/employees" className="btn btn-primary btn-sm">
                  Add Employee
                </a>
                <a href="/attendance" className="btn btn-secondary btn-sm">
                  Upload Attendance
                </a>
                <a href="/performance" className="btn btn-success btn-sm">
                  Add Performance
                </a>
                <a href="/payroll" className="btn btn-primary btn-sm">
                  Calculate Payroll
                </a>
              </>
            )}
            <a href="/reports" className="btn btn-secondary btn-sm">
              Generate Reports
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
