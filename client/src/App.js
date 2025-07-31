import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, CircularProgress, Typography } from '@mui/material';
import axios from 'axios';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Employees from './components/Employees';
import Attendance from './components/Attendance';
import Performance from './components/Performance';
import Payroll from './components/Payroll';
import Reports from './components/Reports';
import Navbar from './components/Navbar';
import muiTheme, { darkTheme } from './theme/muiTheme';
import './App.css';

// Set up axios defaults
axios.defaults.baseURL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5002';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', JSON.stringify(newMode));
  };

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
                  setUser(null); // Explicitly log out the user
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
      <ThemeProvider theme={darkMode ? darkTheme : muiTheme}>
        <CssBaseline />
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
          bgcolor="background.default"
        >
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.primary">
            Loading HRMS...
          </Typography>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={darkMode ? darkTheme : muiTheme}>
      <CssBaseline />
      <Router>
        <Box className="App" bgcolor="background.default" minHeight="100vh">
          {user ? (
            <>
              <Navbar 
                user={user} 
                onLogout={handleLogout} 
                darkMode={darkMode}
                onToggleDarkMode={toggleDarkMode}
              />
              <Box component="main" sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
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
              </Box>
            </>
          ) : (
            <Routes>
              <Route path="/login" element={<Login onLogin={handleLogin} />} />
              <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
          )}
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
