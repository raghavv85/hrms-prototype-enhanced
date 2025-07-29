# Vercel Deployment Guide for HRMS Enhanced

## Overview
This guide explains how to deploy the HRMS Enhanced application to Vercel.

## Prerequisites
- Vercel account
- GitHub repository connected to Vercel
- Node.js application with React frontend

## Deployment Configuration

### 1. Vercel Configuration (`vercel.json`)
The project includes a `vercel.json` file that configures:
- Node.js backend deployment
- API routing
- Environment variables
- Production settings

### 2. Environment Variables
Set these environment variables in your Vercel dashboard:

**Required:**
- `NODE_ENV=production`
- `ENABLE_POSTGRES=false` (uses SQLite in-memory for demo)
- `JWT_SECRET=hrms_jwt_secret_key_2024_enhanced_prototype`

**Optional (for PostgreSQL):**
- `DB_USER=your_postgres_user`
- `DB_PASSWORD=your_postgres_password`
- `DB_HOST=your_postgres_host`
- `DB_PORT=5432`
- `DB_NAME=your_database_name`

### 3. Build Process
The application is configured to:
1. Build the React frontend (`client/build`)
2. Deploy the Node.js backend
3. Serve static files in production

### 4. API Routes
All API endpoints are available under `/api/*`:
- `/api/auth` - Authentication
- `/api/employees` - Employee management
- `/api/attendance` - Attendance tracking
- `/api/performance` - Performance management
- `/api/payroll` - Payroll processing
- `/api/reports` - Reports generation

### 5. Frontend Routes
All non-API routes serve the React application for client-side routing.

## Deployment Steps

1. **Connect Repository**: Link your GitHub repository to Vercel
2. **Configure Environment**: Set environment variables in Vercel dashboard
3. **Deploy**: Vercel will automatically build and deploy
4. **Test**: Access your deployed application

## Database Configuration

### SQLite (Default)
- Uses in-memory SQLite database
- Automatically seeds initial data
- Perfect for demos and testing
- No external database required

### PostgreSQL (Optional)
- Set `ENABLE_POSTGRES=true`
- Configure database connection variables
- Requires external PostgreSQL instance

## Troubleshooting

### Build Errors
- Ensure `client/build` directory exists
- Check that all dependencies are installed
- Verify environment variables are set

### Runtime Errors
- Check Vercel function logs
- Verify database connection
- Ensure all required environment variables are set

## Testing the Deployment

1. **API Status**: Visit `/api` to check server status
2. **Login**: Use credentials `hradmin` / `password`
3. **Features**: Test all HRMS modules

## Default Users
- **HR Admin**: `hradmin` / `password`
- **Team Lead**: `teamlead` / `password`

## Support
For deployment issues, check:
1. Vercel build logs
2. Function logs
3. Environment variable configuration
4. Database connection status
