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
    supervisorName: '',
    unitHead: '',
    state: '',
    location: '',
    subLocation: '',
    doj: '',
    gender: '',
    newOld: '',
    designation: '',
    dra: '',
    fieldFloor: '',
    portfolioCode: '',
    client: '',
    product: '',
    process: '',
    status: 'Active',
    ctc: ''
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const calculateVintage = (doj) => {
    if (!doj) return { years: 0, months: 0 };
    
    const joinDate = new Date(doj);
    const currentDate = new Date();
    
    let years = currentDate.getFullYear() - joinDate.getFullYear();
    let months = currentDate.getMonth() - joinDate.getMonth();
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    return { years, months };
  };

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
        supervisorName: '',
        unitHead: '',
        state: '',
        location: '',
        subLocation: '',
        doj: '',
        gender: '',
        newOld: '',
        designation: '',
        dra: '',
        fieldFloor: '',
        portfolioCode: '',
        client: '',
        product: '',
        process: '',
        status: 'Active',
        ctc: ''
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

  const handleDownloadTemplate = async () => {
    try {
      const response = await axios.get('/api/employees/template/download', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'employee_template.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to download template');
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
            <button 
              onClick={handleDownloadTemplate}
              className="btn btn-secondary btn-sm"
            >
              Download Template
            </button>
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
                  <input type="text" name="employeeId" className="form-input" value={formData.employeeId} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input type="text" name="name" className="form-input" value={formData.name} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Supervisor Name</label>
                  <input type="text" name="supervisorName" className="form-input" value={formData.supervisorName} onChange={handleInputChange} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Unit Head</label>
                  <input type="text" name="unitHead" className="form-input" value={formData.unitHead} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <input type="text" name="state" className="form-input" value={formData.state} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input type="text" name="location" className="form-input" value={formData.location} onChange={handleInputChange} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Sub Location</label>
                  <input type="text" name="subLocation" className="form-input" value={formData.subLocation} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Joining</label>
                  <input type="date" name="doj" className="form-input" value={formData.doj} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <input type="text" name="gender" className="form-input" value={formData.gender} onChange={handleInputChange} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">New/Old</label>
                  <input type="text" name="newOld" className="form-input" value={formData.newOld} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Designation</label>
                  <input type="text" name="designation" className="form-input" value={formData.designation} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">DRA</label>
                  <input type="text" name="dra" className="form-input" value={formData.dra} onChange={handleInputChange} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Field/Floor</label>
                  <input type="text" name="fieldFloor" className="form-input" value={formData.fieldFloor} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Portfolio Code</label>
                  <input type="text" name="portfolioCode" className="form-input" value={formData.portfolioCode} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Client</label>
                  <input type="text" name="client" className="form-input" value={formData.client} onChange={handleInputChange} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Product</label>
                  <input type="text" name="product" className="form-input" value={formData.product} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Process</label>
                  <input type="text" name="process" className="form-input" value={formData.process} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select name="status" className="form-input" value={formData.status} onChange={handleInputChange}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">CTC</label>
                  <input type="number" name="ctc" className="form-input" value={formData.ctc} onChange={handleInputChange} required />
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
                  <th>Supervisor Name</th>
                  <th>Unit Head</th>
                  <th>State</th>
                  <th>Location</th>
                  <th>Sub Location</th>
                  <th>DOJ</th>
                  <th>Vintage</th>
                  <th>Gender</th>
                  <th>New/Old</th>
                  <th>Designation</th>
                  <th>DRA</th>
                  <th>Field/Floor</th>
                  <th>Portfolio Code</th>
                  <th>Client</th>
                  <th>Product</th>
                  <th>Process</th>
                  <th>Status</th>
                  <th>CTC</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => {
                  const vintage = calculateVintage(employee.doj);
                  return (
                    <tr key={employee.id}>
                      <td>{employee.employeeId || 'N/A'}</td>
                      <td>{employee.name || 'N/A'}</td>
                      <td>{employee.supervisorName || 'N/A'}</td>
                      <td>{employee.unitHead || 'N/A'}</td>
                      <td>{employee.state || 'N/A'}</td>
                      <td>{employee.location || 'N/A'}</td>
                      <td>{employee.subLocation || 'N/A'}</td>
                      <td>{employee.doj || 'N/A'}</td>
                      <td>{`${vintage.years}y ${vintage.months}m`}</td>
                      <td>{employee.gender || 'N/A'}</td>
                      <td>{employee.newOld || 'N/A'}</td>
                      <td>{employee.designation || 'N/A'}</td>
                      <td>{employee.dra || 'N/A'}</td>
                      <td>{employee.fieldFloor || 'N/A'}</td>
                      <td>{employee.portfolioCode || 'N/A'}</td>
                      <td>{employee.client || 'N/A'}</td>
                      <td>{employee.product || 'N/A'}</td>
                      <td>{employee.process || 'N/A'}</td>
                      <td>{employee.status || 'Active'}</td>
                      <td>{employee.ctc || 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Employees;
