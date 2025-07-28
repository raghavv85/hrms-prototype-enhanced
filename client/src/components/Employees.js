import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Employees = ({ user }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    department: '',
    designation: '',
    dateOfJoining: '',
    baseSalary: '',
    phone: ''
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/api/employees');
      setEmployees(response.data);
    } catch (error) {
      setError('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/employees', formData);
      setShowAddForm(false);
      setFormData({
        employeeId: '',
        name: '',
        email: '',
        department: '',
        designation: '',
        dateOfJoining: '',
        baseSalary: '',
        phone: ''
      });
      fetchEmployees();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add employee');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/employees/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(response.data.message);
      fetchEmployees();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to upload file');
    }
  };

  if (loading) {
    return <div className="loading-container"><div className="loading-spinner"></div></div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Employee Management</h1>
        {user.role === 'HR_ADMIN' && (
          <div className="d-flex gap-2">
            <button 
              onClick={() => setShowAddForm(!showAddForm)} 
              className="btn btn-primary btn-sm"
            >
              Add Employee
            </button>
            <a 
              href="/api/employees/template/download" 
              className="btn btn-secondary btn-sm"
            >
              Download Template
            </a>
          </div>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {user.role === 'HR_ADMIN' && (
        <div className="card mb-3">
          <div className="card-header">
            <h3 className="card-title">Upload Employees</h3>
          </div>
          <div className="card-body">
            <div className="file-upload">
              <input
                type="file"
                id="employee-upload"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
              />
              <label htmlFor="employee-upload" className="file-upload-label">
                Click to upload Excel file
              </label>
            </div>
          </div>
        </div>
      )}

      {showAddForm && user.role === 'HR_ADMIN' && (
        <div className="card mb-3">
          <div className="card-header">
            <h3 className="card-title">Add New Employee</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Employee ID</label>
                  <input
                    type="text"
                    name="employeeId"
                    className="form-input"
                    value={formData.employeeId}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    name="name"
                    className="form-input"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    className="form-input"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input
                    type="text"
                    name="department"
                    className="form-input"
                    value={formData.department}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Designation</label>
                  <input
                    type="text"
                    name="designation"
                    className="form-input"
                    value={formData.designation}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Joining</label>
                  <input
                    type="date"
                    name="dateOfJoining"
                    className="form-input"
                    value={formData.dateOfJoining}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Base Salary</label>
                  <input
                    type="number"
                    name="baseSalary"
                    className="form-input"
                    value={formData.baseSalary}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    className="form-input"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary">Add Employee</button>
                <button 
                  type="button" 
                  onClick={() => setShowAddForm(false)} 
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Employee List ({employees.length})</h3>
        </div>
        <div className="card-body">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Date of Joining</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id}>
                    <td>{employee.employeeId}</td>
                    <td>{employee.name}</td>
                    <td>{employee.email}</td>
                    <td>{employee.department}</td>
                    <td>{employee.designation}</td>
                    <td>{employee.dateOfJoining}</td>
                    <td>{employee.status}</td>
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

export default Employees;
