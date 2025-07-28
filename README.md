# HRMS Prototype Enhanced - Human Resource Management System

An enhanced version of the comprehensive HRMS solution built with Node.js, Express, and React for managing employees, attendance, performance, payroll, and generating reports.

## Features

### Core Modules
- **Employee Management**: Add, view, and manage employee records with Excel import/export
- **Attendance Management**: Track employee attendance with bulk upload capabilities
- **Performance Management**: Monitor employee performance metrics (calls handled, quality scores, adherence)
- **Payroll Management**: Calculate salaries, generate payslips, and manage payroll data
- **Reports & Analytics**: Generate comprehensive reports in Excel format

### Key Capabilities
- Role-based access control (HR Admin, Team Lead)
- Excel file import/export for bulk operations
- PDF payslip generation
- Dashboard with real-time analytics
- RESTful API architecture
- Responsive web interface

## Planned Enhancements

### 1. Database Implementation
- Replace in-memory database with PostgreSQL for data persistence
- Implement proper data relationships and integrity constraints
- Add database migration scripts

### 2. Authentication Improvements
- Add token refresh mechanism
- Implement password reset functionality
- Add multi-factor authentication option
- Store JWT secret in environment variables

### 3. Frontend Modernization
- Implement a modern UI component library
- Add dark mode support
- Improve mobile responsiveness
- Implement form validation with Formik or React Hook Form

### 4. Workflow Automation
- Add email notifications for key events
- Implement scheduled tasks for report generation
- Create approval workflows for leave requests

### 5. Dashboard Improvements
- Add interactive charts using Chart.js
- Implement customizable dashboard widgets
- Add trend analysis for key metrics

### 6. Additional Features
- Document management system
- Calendar view for attendance
- Employee self-service portal
- Multi-language support

## Technology Stack

### Backend
- Node.js with Express.js
- PostgreSQL database (planned upgrade from in-memory)
- JWT authentication
- Excel processing (xlsx)
- PDF generation (pdfkit)
- File upload handling (multer)

### Frontend
- React 18 with functional components
- React Router for navigation
- Axios for API calls
- Responsive CSS design
- Modern UI components (planned upgrade)

## Quick Start (Recommended)

### 🚀 One-Click Startup

**For Windows Users:**

1. **Double-click** `start-hrms.bat` (Command Prompt version)
   - OR -
2. **Right-click** `start-hrms.ps1` → **Run with PowerShell** (PowerShell version)

The script will automatically:
- ✅ Check Node.js installation
- ✅ Install all dependencies (if needed)
- ✅ Start both backend and frontend servers
- ✅ Open the application in your browser

**That's it! The application will be ready to use.**

---

## Manual Installation & Setup

### Prerequisites
- Node.js (v14 or higher) - [Download here](https://nodejs.org/)
- npm (comes with Node.js)

### Step-by-Step Manual Setup

1. **Navigate to project directory:**
```bash
cd hrms-prototype-enhanced
```

2. **Install backend dependencies:**
```bash
npm install
```

3. **Install frontend dependencies:**
```bash
cd client
npm install
cd ..
```

4. **Start backend server (Terminal 1):**
```bash
node server.js
```
*Backend runs on http://localhost:5000*

5. **Start frontend server (Terminal 2):**
```bash
cd client
npm start
```
*Frontend runs on http://localhost:3000*

6. **Open browser and go to:** `http://localhost:3000`

## Default Login Credentials

### HR Admin
- Username: `hradmin`
- Password: `password`
- Access: Full system access including payroll management

### Team Lead
- Username: `teamlead`
- Password: `password`
- Access: Limited access (no payroll management)

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Employee Management
- `GET /api/employees` - Get all employees
- `POST /api/employees` - Add new employee
- `POST /api/employees/upload` - Bulk upload employees via Excel
- `GET /api/employees/template/download` - Download Excel template

### Attendance Management
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance/upload` - Bulk upload attendance via Excel
- `GET /api/attendance/template/download` - Download Excel template

### Performance Management
- `GET /api/performance` - Get performance records
- `POST /api/performance` - Add performance record
- `POST /api/performance/upload` - Bulk upload performance via Excel
- `GET /api/performance/template/download` - Download Excel template

### Payroll Management (HR Admin only)
- `GET /api/payroll` - Get payroll records
- `POST /api/payroll/calculate` - Calculate payroll for a period
- `GET /api/payroll/export/excel` - Export payroll to Excel
- `GET /api/payroll/payslip/:employeeId` - Generate PDF payslip

### Reports
- `GET /api/reports/employees` - Employee master report
- `GET /api/reports/attendance` - Attendance report
- `GET /api/reports/performance` - Performance report
- `GET /api/reports/payroll` - Payroll report (HR Admin only)
- `GET /api/reports/dashboard` - Dashboard summary data