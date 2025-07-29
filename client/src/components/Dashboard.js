import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Avatar,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  AccessTime as AccessTimeIcon,
  TrendingUp as TrendingUpIcon,
  Payment as PaymentIcon,
  Assessment as AssessmentIcon,
  Upload as UploadIcon,
  Calculate as CalculateIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  AttendanceChart, 
  PerformanceChart, 
  DepartmentChart,
  PayrollChart 
} from './charts';

const Dashboard = ({ user }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/reports/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    setError('');
    fetchDashboardData();
  };

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Loading dashboard...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        sx={{ borderRadius: 2 }}
        action={
          <Button color="inherit" size="small" onClick={handleRefresh}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  const { dashboard } = dashboardData || {};

  const statCards = [
    {
      title: 'Total Employees',
      value: dashboard?.employees?.total || 0,
      icon: <PeopleIcon />,
      color: 'primary',
      bgColor: 'rgba(25, 118, 210, 0.1)'
    },
    {
      title: 'Active Employees',
      value: dashboard?.employees?.active || 0,
      icon: <PersonAddIcon />,
      color: 'success',
      bgColor: 'rgba(76, 175, 80, 0.1)'
    },
    {
      title: 'Average Attendance',
      value: `${dashboard?.attendance?.averageAttendance || 0}%`,
      icon: <AccessTimeIcon />,
      color: 'info',
      bgColor: 'rgba(33, 150, 243, 0.1)'
    },
    {
      title: 'Avg Quality Score',
      value: dashboard?.performance?.averageQualityScore || 0,
      icon: <TrendingUpIcon />,
      color: 'warning',
      bgColor: 'rgba(255, 152, 0, 0.1)'
    }
  ];

  const quickActions = [
    ...(user.role === 'HR_ADMIN' ? [
      { label: 'Add Employee', path: '/employees', icon: <PersonAddIcon />, color: 'primary' },
      { label: 'Upload Attendance', path: '/attendance', icon: <UploadIcon />, color: 'secondary' },
      { label: 'Add Performance', path: '/performance', icon: <TrendingUpIcon />, color: 'success' },
      { label: 'Calculate Payroll', path: '/payroll', icon: <CalculateIcon />, color: 'primary' }
    ] : []),
    { label: 'Generate Reports', path: '/reports', icon: <AssessmentIcon />, color: 'info' }
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back, {user.username}! • Period: {dashboardData?.period}
          </Typography>
        </Box>
        <Tooltip title="Refresh Dashboard">
          <IconButton onClick={handleRefresh} color="primary">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              elevation={2}
              sx={{
                height: '100%',
                background: `linear-gradient(135deg, ${stat.bgColor} 0%, rgba(255,255,255,0.9) 100%)`,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h3" fontWeight="bold" color={`${stat.color}.main`}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {stat.title}
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: `${stat.color}.main`,
                      width: 56,
                      height: 56
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Attendance Trend
              </Typography>
              <AttendanceChart attendanceTrend={dashboard?.attendance?.trend} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Performers
              </Typography>
              <PerformanceChart topPerformers={dashboard?.performance?.topPerformers} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Department Distribution
              </Typography>
              <DepartmentChart departmentData={dashboard?.employees?.byDepartment} />
            </CardContent>
          </Card>
        </Grid>
        {user.role === 'HR_ADMIN' && (
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Payroll by Department
                </Typography>
                <PayrollChart departmentCosts={dashboard?.payroll?.departmentCosts} />
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Department Overview Table */}
      <Card elevation={2} sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Department Overview
          </Typography>
          {dashboard?.employees?.byDepartment && Object.keys(dashboard.employees.byDepartment).length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Department</strong></TableCell>
                    <TableCell align="right"><strong>Employee Count</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(dashboard.employees.byDepartment).map(([dept, count]) => (
                    <TableRow key={dept} hover>
                      <TableCell>{dept}</TableCell>
                      <TableCell align="right">
                        <Chip label={count} color="primary" variant="outlined" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="text.secondary">No department data available</Typography>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Attendance Summary
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Total Records:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {dashboard?.attendance?.totalRecords || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Present:</Typography>
                  <Typography variant="body2" fontWeight="bold" color="success.main">
                    {dashboard?.attendance?.present || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Absent:</Typography>
                  <Typography variant="body2" fontWeight="bold" color="error.main">
                    {dashboard?.attendance?.absent || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="success">
                Performance Summary
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Total Records:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {dashboard?.performance?.totalRecords || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Avg Calls Handled:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {dashboard?.performance?.averageCallsHandled || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Avg Adherence:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {dashboard?.performance?.averageAdherence || 0}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {user.role === 'HR_ADMIN' && (
          <Grid item xs={12} md={4}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="warning.main">
                  Payroll Summary
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Processed:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {dashboard?.payroll?.totalProcessed || 0}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Total Gross:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      ₹{dashboard?.payroll?.totalGrossSalary?.toLocaleString() || 0}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Avg Salary:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      ₹{dashboard?.payroll?.averageSalary?.toLocaleString() || 0}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Quick Actions */}
      <Card elevation={2}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="contained"
                color={action.color}
                startIcon={action.icon}
                onClick={() => navigate(action.path)}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500
                }}
              >
                {action.label}
              </Button>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard;
