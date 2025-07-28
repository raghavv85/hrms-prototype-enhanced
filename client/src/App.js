import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Employees from './components/Employees';
import Attendance from './components/Attendance';
import Performance from './components/Performance';
import Payroll from './components/Payroll';
import Reports from './components/Reports';
import Navbar from './components/Navbar';
import './App.css';

// Set up axios defaults
axios.defaults.baseURL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5001';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Verify token
      axios.get('/api/auth/me')
        .then(response => {
          setUser(response.data);
        })
        .catch(error => {
          console.error('Token verification failed:', error);
          // Try to refresh the token if it's expired
          if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED') {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              axios.post('/api/auth/refresh-token', { refreshToken })
                .then(response => {
                  localStorage.setItem('token', response.data.accessToken);
                  localStorage.setItem('refreshToken', response.data.refreshToken);
                  axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.accessToken}`;
                  return axios.get('/api/auth/me');
                })
                .then(response => {
                  setUser(response.data);
                })
                .catch(refreshError => {
                  console.error('Token refresh failed:', refreshError);
                  localStorage.removeItem('token');
                  localStorage.removeItem('refreshToken');
                  delete axios.defaults.headers.common['Authorization'];
                });
            } else {
              localStorage.removeItem('token');
              delete axios.defaults.headers.common['Authorization'];
            }
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            delete axios.defaults.headers.common['Authorization'];
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (userData, token, refreshToken) => {
    setUser(userData);
    localStorage.setItem('token', token);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const handleLogout = () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      // Call the logout API to invalidate the refresh token
      axios.post('/api/auth/logout', { refreshToken })
        .catch(error => console.error('Logout error:', error));
    }
    
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    delete axios.defaults.headers.common['Authorization'];
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        {user ? (
          <>
            <Navbar user={user} onLogout={handleLogout} />
            <div className="main-content">
              <Routes>
                <Route path="/" element={<Dashboard user={user} />} />
                <Route path="/dashboard" element={<Dashboard user={user} />} />
                <Route path="/employees" element={<Employees user={user} />} />
                <Route path="/attendance" element={<Attendance user={user} />} />
                <Route path="/performance" element={<Performance user={user} />} />
                <Route path="/payroll" element={<Payroll user={user} />} />
                <Route path="/reports" element={<Reports user={user} />} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
              </Routes>
            </div>
          </>
        ) : (
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        )}
      </div>
    </Router>
  );
}

export default App;
