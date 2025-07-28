const express = require('express');
const db = require('../config/database');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/performance
// @desc    Get all performance records
// @access  Private (HR Admin, Team Lead)
router.get('/', auth, requireRole(['HR_ADMIN', 'TEAM_LEAD']), async (req, res) => {
  try {
    const { employeeId, startDate, endDate } = req.query;
    let performance = await db.getAllPerformance();

    // Filter by employee ID if provided
    if (employeeId) {
      performance = performance.filter(perf => perf.employeeId === employeeId);
    }

    // Filter by date range if provided
    if (startDate && endDate) {
      performance = performance.filter(perf => {
        const perfDate = new Date(perf.date);
        return perfDate >= new Date(startDate) && perfDate <= new Date(endDate);
      });
    }

    res.json(performance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/performance
// @desc    Create performance record
// @access  Private (HR Admin only)
router.post('/', auth, requireRole(['HR_ADMIN']), async (req, res) => {
  try {
    const { 
      employeeId, 
      date, 
      callsHandled, 
      qualityScore, 
      adherencePercentage, 
      notes 
    } = req.body;

    // Validate required fields
    if (!employeeId || !date) {
      return res.status(400).json({ message: 'Please provide employeeId and date' });
    }

    // Validate employee exists
    const employees = await db.getAllEmployees();
    const employee = employees.find(emp => emp.employeeId === employeeId);
    if (!employee) {
      return res.status(400).json({ message: 'Employee not found' });
    }

    // Validate numeric fields
    if (callsHandled && (isNaN(callsHandled) || callsHandled < 0)) {
      return res.status(400).json({ message: 'Calls handled must be a positive number' });
    }

    if (qualityScore && (isNaN(qualityScore) || qualityScore < 0 || qualityScore > 100)) {
      return res.status(400).json({ message: 'Quality score must be between 0 and 100' });
    }

    if (adherencePercentage && (isNaN(adherencePercentage) || adherencePercentage < 0 || adherencePercentage > 100)) {
      return res.status(400).json({ message: 'Adherence percentage must be between 0 and 100' });
    }

    const performanceData = {
      employeeId,
      employeeName: employee.name,
      date,
      callsHandled: parseInt(callsHandled) || 0,
      qualityScore: parseFloat(qualityScore) || 0,
      adherencePercentage: parseFloat(adherencePercentage) || 0,
      notes: notes || ''
    };

    const performance = await db.createPerformance(performanceData);
    res.status(201).json(performance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/performance/dashboard
// @desc    Get performance dashboard data
// @access  Private (HR Admin, Team Lead)
router.get('/dashboard', auth, requireRole(['HR_ADMIN', 'TEAM_LEAD']), async (req, res) => {
  try {
    const { employeeId, period = '30' } = req.query;
    
    // Calculate date range based on period (days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    let performance = await db.getAllPerformance();
    
    // Filter by date range
    performance = performance.filter(perf => {
      const perfDate = new Date(perf.date);
      return perfDate >= startDate && perfDate <= endDate;
    });

    // Filter by employee if specified
    if (employeeId) {
      performance = performance.filter(perf => perf.employeeId === employeeId);
    }

    // Calculate aggregated metrics
    const dashboard = {
      totalRecords: performance.length,
      averageCallsHandled: 0,
      averageQualityScore: 0,
      averageAdherence: 0,
      topPerformers: [],
      dailyTrends: {},
      employeeMetrics: {}
    };

    if (performance.length > 0) {
      // Calculate averages
      dashboard.averageCallsHandled = Math.round(
        performance.reduce((sum, perf) => sum + perf.callsHandled, 0) / performance.length
      );
      
      dashboard.averageQualityScore = Math.round(
        performance.reduce((sum, perf) => sum + perf.qualityScore, 0) / performance.length * 100
      ) / 100;
      
      dashboard.averageAdherence = Math.round(
        performance.reduce((sum, perf) => sum + perf.adherencePercentage, 0) / performance.length * 100
      ) / 100;

      // Group by employee for metrics
      const employeeGroups = {};
      performance.forEach(perf => {
        if (!employeeGroups[perf.employeeId]) {
          employeeGroups[perf.employeeId] = {
            employeeId: perf.employeeId,
            employeeName: perf.employeeName,
            records: []
          };
        }
        employeeGroups[perf.employeeId].records.push(perf);
      });

      // Calculate employee metrics
      Object.values(employeeGroups).forEach(group => {
        const records = group.records;
        dashboard.employeeMetrics[group.employeeId] = {
          employeeName: group.employeeName,
          totalCalls: records.reduce((sum, r) => sum + r.callsHandled, 0),
          avgQuality: Math.round(records.reduce((sum, r) => sum + r.qualityScore, 0) / records.length * 100) / 100,
          avgAdherence: Math.round(records.reduce((sum, r) => sum + r.adherencePercentage, 0) / records.length * 100) / 100,
          recordCount: records.length
        };
      });

      // Get top performers (by quality score)
      dashboard.topPerformers = Object.values(dashboard.employeeMetrics)
        .sort((a, b) => b.avgQuality - a.avgQuality)
        .slice(0, 5);

      // Daily trends
      performance.forEach(perf => {
        const date = perf.date;
        if (!dashboard.dailyTrends[date]) {
          dashboard.dailyTrends[date] = {
            date,
            totalCalls: 0,
            avgQuality: 0,
            avgAdherence: 0,
            recordCount: 0
          };
        }
        
        dashboard.dailyTrends[date].totalCalls += perf.callsHandled;
        dashboard.dailyTrends[date].avgQuality += perf.qualityScore;
        dashboard.dailyTrends[date].avgAdherence += perf.adherencePercentage;
        dashboard.dailyTrends[date].recordCount++;
      });

      // Calculate daily averages
      Object.values(dashboard.dailyTrends).forEach(day => {
        day.avgQuality = Math.round(day.avgQuality / day.recordCount * 100) / 100;
        day.avgAdherence = Math.round(day.avgAdherence / day.recordCount * 100) / 100;
      });
    }

    res.json(dashboard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/performance/employee/:employeeId
// @desc    Get performance data for specific employee
// @access  Private (HR Admin, Team Lead)
router.get('/employee/:employeeId', auth, requireRole(['HR_ADMIN', 'TEAM_LEAD']), async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { period = '30' } = req.query;

    // Validate employee exists
    const employees = await db.getAllEmployees();
    const employee = employees.find(emp => emp.employeeId === employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    let performance = await db.getAllPerformance();
    performance = performance.filter(perf => {
      const perfDate = new Date(perf.date);
      return perf.employeeId === employeeId && 
             perfDate >= startDate && 
             perfDate <= endDate;
    });

    const employeePerformance = {
      employee: {
        id: employee.id,
        employeeId: employee.employeeId,
        name: employee.name,
        department: employee.department,
        designation: employee.designation
      },
      summary: {
        totalRecords: performance.length,
        totalCalls: 0,
        averageQuality: 0,
        averageAdherence: 0,
        bestDay: null,
        worstDay: null
      },
      records: performance.sort((a, b) => new Date(b.date) - new Date(a.date))
    };

    if (performance.length > 0) {
      employeePerformance.summary.totalCalls = performance.reduce((sum, perf) => sum + perf.callsHandled, 0);
      employeePerformance.summary.averageQuality = Math.round(
        performance.reduce((sum, perf) => sum + perf.qualityScore, 0) / performance.length * 100
      ) / 100;
      employeePerformance.summary.averageAdherence = Math.round(
        performance.reduce((sum, perf) => sum + perf.adherencePercentage, 0) / performance.length * 100
      ) / 100;

      // Find best and worst performing days
      const sortedByQuality = [...performance].sort((a, b) => b.qualityScore - a.qualityScore);
      employeePerformance.summary.bestDay = sortedByQuality[0];
      employeePerformance.summary.worstDay = sortedByQuality[sortedByQuality.length - 1];
    }

    res.json(employeePerformance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
