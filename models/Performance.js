module.exports = (sequelize, DataTypes) => {
  const { Op } = require('sequelize');
  
  const Performance = sequelize.define('Performance', {
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
    callsHandled: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    qualityScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
      }
    },
    adherence: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
      }
    },
    customerSatisfaction: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 100
      }
    },
    averageHandleTime: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      validate: {
        min: 0
      }
    },
    firstCallResolution: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 100
      }
    },
    targets: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      validate: {
        isValidTargets(value) {
          if (value && typeof value === 'object') {
            const validKeys = ['callsHandled', 'qualityScore', 'adherence', 'customerSatisfaction'];
            const keys = Object.keys(value);
            const invalidKeys = keys.filter(key => !validKeys.includes(key));
            if (invalidKeys.length > 0) {
              throw new Error(`Invalid target keys: ${invalidKeys.join(', ')}`);
            }
          }
        }
      }
    },
    achievements: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    feedback: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    rating: {
      type: DataTypes.ENUM('EXCELLENT', 'GOOD', 'SATISFACTORY', 'NEEDS_IMPROVEMENT', 'POOR'),
      allowNull: true
    },
    reviewedBy: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    reviewDate: {
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
    tableName: 'performance',
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
        fields: ['qualityScore']
      },
      {
        fields: ['rating']
      },
      {
        fields: ['reviewDate']
      }
    ],
    hooks: {
      beforeSave: (performance) => {
        // Calculate overall rating based on metrics
        if (!performance.rating) {
          const qualityScore = parseFloat(performance.qualityScore) || 0;
          const adherence = parseFloat(performance.adherence) || 0;
          const avgScore = (qualityScore + adherence) / 2;
          
          if (avgScore >= 90) {
            performance.rating = 'EXCELLENT';
          } else if (avgScore >= 80) {
            performance.rating = 'GOOD';
          } else if (avgScore >= 70) {
            performance.rating = 'SATISFACTORY';
          } else if (avgScore >= 60) {
            performance.rating = 'NEEDS_IMPROVEMENT';
          } else {
            performance.rating = 'POOR';
          }
        }
      }
    }
  });

  // Instance methods
  Performance.prototype.getOverallScore = function() {
    const qualityScore = parseFloat(this.qualityScore) || 0;
    const adherence = parseFloat(this.adherence) || 0;
    const customerSat = parseFloat(this.customerSatisfaction) || 0;
    
    let totalScore = qualityScore + adherence;
    let count = 2;
    
    if (customerSat > 0) {
      totalScore += customerSat;
      count++;
    }
    
    return Math.round((totalScore / count) * 100) / 100;
  };

  Performance.prototype.isTargetMet = function(metric) {
    if (!this.targets || !this.targets[metric]) {
      return null;
    }
    
    const target = this.targets[metric];
    const actual = this[metric];
    
    return parseFloat(actual) >= parseFloat(target);
  };

  Performance.prototype.getTargetAchievement = function() {
    if (!this.targets) return {};
    
    const achievement = {};
    Object.keys(this.targets).forEach(metric => {
      const target = this.targets[metric];
      const actual = this[metric];
      if (target && actual) {
        achievement[metric] = {
          target: parseFloat(target),
          actual: parseFloat(actual),
          percentage: Math.round((parseFloat(actual) / parseFloat(target)) * 100),
          met: parseFloat(actual) >= parseFloat(target)
        };
      }
    });
    
    return achievement;
  };

  // Class methods
  Performance.findByEmployee = function(employeeId, startPeriod, endPeriod) {
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

  Performance.getPerformanceStats = async function(period) {
    const where = {};
    if (period) {
      where.period = period;
    }
    
    const stats = await this.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalRecords'],
        [sequelize.fn('AVG', sequelize.col('callsHandled')), 'averageCallsHandled'],
        [sequelize.fn('AVG', sequelize.col('qualityScore')), 'averageQualityScore'],
        [sequelize.fn('AVG', sequelize.col('adherence')), 'averageAdherence'],
        [sequelize.fn('AVG', sequelize.col('customerSatisfaction')), 'averageCustomerSatisfaction']
      ],
      where,
      raw: true
    });
    
    const result = stats[0] || {};
    
    // Convert to proper numbers and round
    Object.keys(result).forEach(key => {
      if (result[key] !== null) {
        result[key] = key === 'totalRecords' 
          ? parseInt(result[key]) 
          : Math.round(parseFloat(result[key]) * 100) / 100;
      }
    });
    
    return result;
  };

  Performance.getTopPerformers = async function(period, limit = 10) {
    const where = {};
    if (period) {
      where.period = period;
    }
    
    return this.findAll({
      where,
      include: [{
        model: sequelize.models.Employee,
        as: 'employee',
        attributes: ['name', 'employeeId', 'department']
      }],
      order: [
        ['qualityScore', 'DESC'],
        ['adherence', 'DESC'],
        ['callsHandled', 'DESC']
      ],
      limit
    });
  };

  Performance.getRatingDistribution = async function(period) {
    const where = {};
    if (period) {
      where.period = period;
    }
    
    const stats = await this.findAll({
      attributes: [
        'rating',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where,
      group: ['rating'],
      raw: true
    });
    
    const distribution = {
      EXCELLENT: 0,
      GOOD: 0,
      SATISFACTORY: 0,
      NEEDS_IMPROVEMENT: 0,
      POOR: 0
    };
    
    stats.forEach(stat => {
      if (stat.rating) {
        distribution[stat.rating] = parseInt(stat.count);
      }
    });
    
    return distribution;
  };

  Performance.getMonthlyTrend = async function(year) {
    const stats = await this.findAll({
      attributes: [
        'period',
        [sequelize.fn('AVG', sequelize.col('qualityScore')), 'avgQualityScore'],
        [sequelize.fn('AVG', sequelize.col('adherence')), 'avgAdherence'],
        [sequelize.fn('AVG', sequelize.col('callsHandled')), 'avgCallsHandled']
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
      avgQualityScore: Math.round(parseFloat(stat.avgQualityScore || 0) * 100) / 100,
      avgAdherence: Math.round(parseFloat(stat.avgAdherence || 0) * 100) / 100,
      avgCallsHandled: Math.round(parseFloat(stat.avgCallsHandled || 0))
    }));
  };

  return Performance;
};
