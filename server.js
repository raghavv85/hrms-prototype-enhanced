const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import database configuration
const db = require('./config/db-config');

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
});

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
// Temporarily disabled due to missing nodemailer dependency
// app.use('/api/password-reset', require('./routes/password-reset'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/performance', require('./routes/performance'));
app.use('/api/payroll', require('./routes/payroll'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/notifications', require('./routes/notifications').router);

// Serve static files from React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

app.get('/', (req, res) => {
  res.json({ 
    message: 'HRMS Enhanced API Server is running!',
    version: '1.1.0',
    databaseType: process.env.ENABLE_POSTGRES === 'true' ? 'PostgreSQL' : 'In-Memory'
  });
});

app.listen(PORT, () => {
  console.log(`HRMS Enhanced Server is running on port ${PORT}`);
  console.log(`Database: ${process.env.ENABLE_POSTGRES === 'true' ? 'PostgreSQL' : 'In-Memory'}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
