module.exports = (sequelize, DataTypes) => {
  const { Op } = require('sequelize');
  
  const Payroll = sequelize.define('Payroll', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'employees',
        key: 'id'
      }
    },
    period: {
      type: DataTypes.STRING(7), // Format: YYYY-MM
      allowNull: false,
      validate: {
        is: /^\d{4}-\d{2}$/
      }
    },
    basicSalary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    allowances: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      validate: {
        isValidAllowances(value) {
          if (value && typeof value === 'object') {
            Object.values(value).forEach(amount => {
              if (typeof amount !== 'number' || amount < 0) {
                throw new Error('All allowance amounts must be non-negative numbers');
              }
            });
          }
        }
      }
    },
    deductions: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      validate: {
        isValidDeductions(value) {
          if (value && typeof value === 'object') {
            Object.values(value).forEach(amount => {
              if (typeof amount !== 'number' || amount < 0) {
                throw new Error('All deduction amounts must be non-negative numbers');
              }
            });
          }
        }
      }
    },
    overtimeHours: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    overtimeRate: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    overtimePay: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    bonuses: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      validate: {
        isValidBonuses(value) {
          if (value && typeof value === 'object') {
            Object.values(value).forEach(amount => {
              if (typeof amount !== 'number' || amount < 0) {
                throw new Error('All bonus amounts must be non-negative numbers');
              }
            });
          }
        }
      }
    },
    grossSalary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    totalDeductions: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    netSalary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    tax: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      validate: {
        isValidTax(value) {
          if (value && typeof value === 'object') {
            const validKeys = ['incomeTax', 'professionalTax', 'tds', 'cess'];
            Object.keys(value).forEach(key => {
              if (!validKeys.includes(key)) {
                throw new Error(`Invalid tax key: ${key}`);
              }
              if (typeof value[key] !== 'number' || value[key] < 0) {
                throw new Error(`Tax amount for ${key} must be a non-negative number`);
              }
            });
          }
        }
      }
    },
    workingDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 31
      }
    },
    presentDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 31
      }
    },
    leaveDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    status: {
      type: DataTypes.ENUM('DRAFT', 'CALCULATED', 'APPROVED', 'PAID', 'CANCELLED'),
      allowNull: false,
      defaultValue: 'DRAFT'
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    paymentMethod: {
      type: DataTypes.ENUM('BANK_TRANSFER', 'CASH', 'CHEQUE'),
      allowNull: true
    },
    paymentReference: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    processedBy: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    approvedBy: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'payroll',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['employeeId', 'period']
      },
      {
        fields: ['period']
      },
      {
        fields: ['employeeId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['paymentDate']
      },
      {
        fields: ['processedBy']
      }
    ],
    hooks: {
      beforeSave: (payroll) => {
        // Calculate overtime pay
        if (payroll.overtimeHours && payroll.overtimeRate) {
          payroll.overtimePay = parseFloat(payroll.overtimeHours) * parseFloat(payroll.overtimeRate);
        }
        
        // Calculate total allowances
        const totalAllowances = payroll.allowances 
          ? Object.values(payroll.allowances).reduce((sum, amount) => sum + parseFloat(amount || 0), 0)
          : 0;
        
        // Calculate total bonuses
        const totalBonuses = payroll.bonuses 
          ? Object.values(payroll.bonuses).reduce((sum, amount) => sum + parseFloat(amount || 0), 0)
          : 0;
        
        // Calculate gross salary
        payroll.grossSalary = parseFloat(payroll.basicSalary) + 
                             totalAllowances + 
                             parseFloat(payroll.overtimePay || 0) + 
                             totalBonuses;
        
        // Calculate total deductions
        const deductionAmount = payroll.deductions 
          ? Object.values(payroll.deductions).reduce((sum, amount) => sum + parseFloat(amount || 0), 0)
          : 0;
        
        const taxAmount = payroll.tax 
          ? Object.values(payroll.tax).reduce((sum, amount) => sum + parseFloat(amount || 0), 0)
          : 0;
        
        payroll.totalDeductions = deductionAmount + taxAmount;
        
        // Calculate net salary
        payroll.netSalary = parseFloat(payroll.grossSalary) - parseFloat(payroll.totalDeductions);
        
        // Ensure net salary is not negative
        if (payroll.netSalary < 0) {
          payroll.netSalary = 0;
        }
        
        // Round to 2 decimal places
        payroll.grossSalary = Math.round(parseFloat(payroll.grossSalary) * 100) / 100;
        payroll.totalDeductions = Math.round(parseFloat(payroll.totalDeductions) * 100) / 100;
        payroll.netSalary = Math.round(parseFloat(payroll.netSalary) * 100) / 100;
        payroll.overtimePay = Math.round(parseFloat(payroll.overtimePay || 0) * 100) / 100;
      }
    }
  });

  // Instance methods
  Payroll.prototype.getTotalAllowances = function() {
    if (!this.allowances) return 0;
    return Object.values(this.allowances).reduce((sum, amount) => sum + parseFloat(amount || 0), 0);
  };

  Payroll.prototype.getTotalBonuses = function() {
    if (!this.bonuses) return 0;
    return Object.values(this.bonuses).reduce((sum, amount) => sum + parseFloat(amount || 0), 0);
  };

  Payroll.prototype.getTotalTax = function() {
    if (!this.tax) return 0;
    return Object.values(this.tax).reduce((sum, amount) => sum + parseFloat(amount || 0), 0);
  };

  Payroll.prototype.getAttendancePercentage = function() {
    if (this.workingDays === 0) return 0;
    return Math.round((this.presentDays / this.workingDays) * 100);
  };

  Payroll.prototype.isPaid = function() {
    return this.status === 'PAID';
  };

  Payroll.prototype.canBeModified = function() {
    return ['DRAFT', 'CALCULATED'].includes(this.status);
  };

  // Class methods
  Payroll.findByEmployee = function(employeeId, startPeriod, endPeriod) {
    const where = { employeeId };
    
    if (startPeriod && endPeriod) {
      where.period = {
        [Op.between]: [startPeriod, endPeriod]
      };
    } else if (startPeriod) {
      where.period = {
        [Op.gte]: startPeriod
      };
    } else if (endPeriod) {
      where.period = {
        [Op.lte]: endPeriod
      };
    }
    
    return this.findAll({
      where,
      order: [['period', 'DESC']]
    });
  };

  Payroll.getPayrollStats = async function(period) {
    const where = {};
    if (period) {
      where.period = period;
    }
    
    const stats = await this.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalProcessed'],
        [sequelize.fn('SUM', sequelize.col('grossSalary')), 'totalGrossSalary'],
        [sequelize.fn('SUM', sequelize.col('netSalary')), 'totalNetSalary'],
        [sequelize.fn('SUM', sequelize.col('totalDeductions')), 'totalDeductions'],
        [sequelize.fn('AVG', sequelize.col('grossSalary')), 'averageSalary']
      ],
      where,
      raw: true
    });
    
    const result = stats[0] || {};
    
    // Convert to proper numbers and round
    Object.keys(result).forEach(key => {
      if (result[key] !== null) {
        result[key] = key === 'totalProcessed' 
          ? parseInt(result[key]) 
          : Math.round(parseFloat(result[key]) * 100) / 100;
      }
    });
    
    return result;
  };

  Payroll.getDepartmentCosts = async function(period) {
    const where = {};
    if (period) {
      where.period = period;
    }
    
    const stats = await this.findAll({
      attributes: [
        [sequelize.col('employee.department'), 'department'],
        [sequelize.fn('SUM', sequelize.col('grossSalary')), 'totalCost'],
        [sequelize.fn('COUNT', sequelize.col('Payroll.id')), 'employeeCount']
      ],
      include: [{
        model: sequelize.models.Employee,
        as: 'employee',
        attributes: []
      }],
      where,
      group: [sequelize.col('employee.department')],
      raw: true
    });
    
    const result = {};
    stats.forEach(stat => {
      if (stat.department) {
        result[stat.department] = {
          totalCost: Math.round(parseFloat(stat.totalCost || 0) * 100) / 100,
          employeeCount: parseInt(stat.employeeCount || 0)
        };
      }
    });
    
    return result;
  };

  Payroll.getStatusDistribution = async function(period) {
    const where = {};
    if (period) {
      where.period = period;
    }
    
    const stats = await this.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where,
      group: ['status'],
      raw: true
    });
    
    const distribution = {
      DRAFT: 0,
      CALCULATED: 0,
      APPROVED: 0,
      PAID: 0,
      CANCELLED: 0
    };
    
    stats.forEach(stat => {
      if (stat.status) {
        distribution[stat.status] = parseInt(stat.count);
      }
    });
    
    return distribution;
  };

  Payroll.getMonthlyTrend = async function(year) {
    const stats = await this.findAll({
      attributes: [
        'period',
        [sequelize.fn('SUM', sequelize.col('grossSalary')), 'totalGross'],
        [sequelize.fn('SUM', sequelize.col('netSalary')), 'totalNet'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'employeeCount']
      ],
      where: {
        period: {
          [Op.like]: `${year}-%`
        }
      },
      group: ['period'],
      order: [['period', 'ASC']],
      raw: true
    });
    
    return stats.map(stat => ({
      period: stat.period,
      totalGross: Math.round(parseFloat(stat.totalGross || 0) * 100) / 100,
      totalNet: Math.round(parseFloat(stat.totalNet || 0) * 100) / 100,
      employeeCount: parseInt(stat.employeeCount || 0)
    }));
  };

  return Payroll;
};
