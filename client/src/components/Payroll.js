import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Payroll = ({ user }) => {
  const [payroll, setPayroll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    fetchPayroll();
  }, []);

  const fetchPayroll = async () => {
    try {
      const response = await axios.get('/api/payroll');
      setPayroll(response.data);
    } catch (error) {
      setError('Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  };

  const calculatePayroll = async () => {
    const month = prompt('Enter month (1-12):');
    const year = prompt('Enter year (e.g., 2024):');
    
    if (!month || !year) return;

    setCalculating(true);
    try {
      const response = await axios.post('/api/payroll/calculate', {
        month: parseInt(month),
        year: parseInt(year)
      });
      alert(response.data.message);
      fetchPayroll();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to calculate payroll');
    } finally {
      setCalculating(false);
    }
  };

  const downloadPayslip = (employeeId) => {
    const month = prompt('Enter month (1-12):');
    const year = prompt('Enter year (e.g., 2024):');
    
    if (!month || !year) return;

    window.open(`/api/payroll/payslip/${employeeId}?month=${month}&year=${year}`);
  };

  if (loading) {
    return <div className="loading-container"><div className="loading-spinner"></div></div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Payroll Management</h1>
        <div className="d-flex gap-2">
          <button 
            onClick={calculatePayroll} 
            className="btn btn-primary btn-sm"
            disabled={calculating}
          >
            {calculating ? 'Calculating...' : 'Calculate Payroll'}
          </button>
          <a href="/api/payroll/export/excel" className="btn btn-secondary btn-sm">
            Export Excel
          </a>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Payroll Records ({payroll.length})</h3>
        </div>
        <div className="card-body">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Employee Name</th>
                  <th>Department</th>
                  <th>Pay Period</th>
                  <th>Gross Salary</th>
                  <th>Deductions</th>
                  <th>Net Salary</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payroll.map((record) => (
                  <tr key={record.id}>
                    <td>{record.employeeId}</td>
                    <td>{record.employeeName}</td>
                    <td>{record.department}</td>
                    <td>{record.payPeriod}</td>
                    <td>₹{record.grossSalary?.toLocaleString()}</td>
                    <td>₹{record.totalDeductions?.toLocaleString()}</td>
                    <td>₹{record.netSalary?.toLocaleString()}</td>
                    <td>
                      <button 
                        onClick={() => downloadPayslip(record.employeeId)}
                        className="btn btn-sm btn-secondary"
                      >
                        Payslip
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payroll;
