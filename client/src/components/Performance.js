import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Performance = ({ user }) => {
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPerformance();
  }, []);

  const fetchPerformance = async () => {
    try {
      const response = await axios.get('/api/performance');
      setPerformance(response.data);
    } catch (error) {
      setError('Failed to load performance data');
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
      const response = await axios.post('/api/performance/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(response.data.message);
      fetchPerformance();
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
        <h1>Performance Management</h1>
        {user.role === 'HR_ADMIN' && (
          <a href="/api/performance/template/download" className="btn btn-secondary btn-sm">
            Download Template
          </a>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {user.role === 'HR_ADMIN' && (
        <div className="card mb-3">
          <div className="card-header">
            <h3 className="card-title">Upload Performance Data</h3>
          </div>
          <div className="card-body">
            <div className="file-upload">
              <input
                type="file"
                id="performance-upload"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
              />
              <label htmlFor="performance-upload" className="file-upload-label">
                Click to upload Excel file
              </label>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Performance Records ({performance.length})</h3>
        </div>
        <div className="card-body">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Employee Name</th>
                  <th>Date</th>
                  <th>Calls Handled</th>
                  <th>Quality Score</th>
                  <th>Adherence %</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {performance.map((record) => (
                  <tr key={record.id}>
                    <td>{record.employeeId}</td>
                    <td>{record.employeeName}</td>
                    <td>{record.date}</td>
                    <td>{record.callsHandled}</td>
                    <td>{record.qualityScore}</td>
                    <td>{record.adherencePercentage}%</td>
                    <td>{record.notes || '-'}</td>
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

export default Performance;
