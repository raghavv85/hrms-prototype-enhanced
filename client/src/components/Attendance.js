import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Attendance = ({ user }) => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const response = await axios.get('/api/attendance');
      setAttendance(response.data);
    } catch (error) {
      setError('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/attendance/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(response.data.message);
      fetchAttendance();
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
        <h1>Attendance Management</h1>
        {user.role === 'HR_ADMIN' && (
          <a href="/api/attendance/template/download" className="btn btn-secondary btn-sm">
            Download Template
          </a>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {user.role === 'HR_ADMIN' && (
        <div className="card mb-3">
          <div className="card-header">
            <h3 className="card-title">Upload Attendance</h3>
          </div>
          <div className="card-body">
            <div className="file-upload">
              <input
                type="file"
                id="attendance-upload"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
              />
              <label htmlFor="attendance-upload" className="file-upload-label">
                Click to upload Excel file
              </label>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Attendance Records ({attendance.length})</h3>
        </div>
        <div className="card-body">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Employee Name</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Shift</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((record) => (
                  <tr key={record.id}>
                    <td>{record.employeeId}</td>
                    <td>{record.employeeName}</td>
                    <td>{record.date}</td>
                    <td>{record.status}</td>
                    <td>{record.shift}</td>
                    <td>{record.checkIn || '-'}</td>
                    <td>{record.checkOut || '-'}</td>
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

export default Attendance;
