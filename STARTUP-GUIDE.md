# 🚀 HRMS Prototype - Quick Startup Guide

## Easiest Way to Start (Windows)

### Option 1: Batch File (Recommended)
1. **Double-click** `start-hrms.bat`
2. Wait for the script to complete
3. Application opens automatically in browser

### Option 2: PowerShell Script
1. **Right-click** `start-hrms.ps1` → **Run with PowerShell**
2. If prompted about execution policy, type `Y` and press Enter
3. Wait for the script to complete
4. Application opens automatically in browser

---

## What the Startup Scripts Do

✅ **Check Prerequisites**: Verify Node.js is installed
✅ **Install Dependencies**: Automatically install all required packages
✅ **Start Backend**: Launch server on http://localhost:5000
✅ **Start Frontend**: Launch React app on http://localhost:3000
✅ **Open Browser**: Automatically open the application

---

## Login Credentials

Once the application opens:

### HR Admin (Full Access)
- **Username**: `hradmin`
- **Password**: `password`

### Team Lead (Limited Access)
- **Username**: `teamlead`
- **Password**: `password`

---

## Manual Steps (If Scripts Don't Work)

### Prerequisites
- Install Node.js from https://nodejs.org/

### Commands to Run
```bash
# 1. Install backend dependencies
npm install

# 2. Install frontend dependencies
cd client
npm install
cd ..

# 3. Start backend (keep this terminal open)
node server.js

# 4. In a NEW terminal, start frontend
cd client
npm start
```

### Access Application
- Open browser and go to: http://localhost:3000

---

## Stopping the Application

- **If using startup scripts**: Close both server windows that opened
- **If using manual method**: Press `Ctrl+C` in both terminals

---

## Troubleshooting

### "Node.js not found"
- Install Node.js from https://nodejs.org/
- Restart your computer after installation

### "Port already in use"
- Close any existing Node.js processes
- Restart your computer if needed

### "Permission denied" (PowerShell)
- Run PowerShell as Administrator
- Or use the batch file instead

### Application doesn't load
- Wait 30-60 seconds for servers to fully start
- Check that both servers are running
- Try refreshing the browser

---

## Features to Test

Once logged in, you can explore:

📊 **Dashboard** - Overview and metrics
👥 **Employees** - Add and manage employee records
📅 **Attendance** - Track employee attendance
📈 **Performance** - Monitor performance metrics
💰 **Payroll** - Calculate salaries (HR Admin only)
📋 **Reports** - Generate Excel reports

---

## Need Help?

1. Check the console/terminal windows for error messages
2. Ensure both servers are running (you should see 2 windows)
3. Try refreshing the browser page
4. Restart the application using the startup scripts

---

**Happy Testing! 🎉**
