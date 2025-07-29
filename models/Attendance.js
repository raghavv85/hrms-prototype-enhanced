module.exports = (sequelize, DataTypes) => {
  const { Op } = require('sequelize');
  const Attendance = sequelize.define('Attendance', {
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
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true
      }
    },
    status: {
      type: DataTypes.ENUM('PRESENT', 'ABSENT', 'HALF_DAY', 'LATE', 'LEAVE'),
      allowNull: false,
      defaultValue: 'PRESENT'
    },
    checkInTime: {
      type: DataTypes.TIME,
      allowNull: true
    },
    checkOutTime: {
      type: DataTypes.TIME,
      allowNull: true
    },
    workingHours: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 24
      }
    },
    overtimeHours: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: true,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isHoliday: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    leaveType: {
      type: DataTypes.ENUM('SICK', 'CASUAL', 'ANNUAL', 'MATERNITY', 'PATERNITY', 'EMERGENCY'),
      allowNull: true
    },
    approvedBy: {
      type: DataTypes.STRING(100),
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
    tableName: 'attendance',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['employeeId', 'date']
      },
      {
        fields: ['date']
      },
      {
        fields: ['status']
      },
      {
        fields: ['employeeId']
      },
      {
        fields: ['isHoliday']
      }
    ],
    hooks: {
      beforeSave: (attendance) => {
        // Calculate working hours if check-in and check-out times are provided
        if (attendance.checkInTime && attendance.checkOutTime && attendance.status === 'PRESENT') {
          const checkIn = new Date(`1970-01-01T${attendance.checkInTime}`);
          const checkOut = new Date(`1970-01-01T${attendance.checkOutTime}`);
          const diffMs = checkOut - checkIn;
          const diffHours = diffMs / (1000 * 60 * 60);
          
          if (diffHours > 0) {
            attendance.workingHours = Math.round(diffHours * 100) / 100;
            
            // Calculate overtime (assuming 8 hours is standard)
            if (diffHours > 8) {
              attendance.overtimeHours = Math.round((diffHours - 8) * 100) / 100;
            }
          }
        }
        
        // Set working hours for half day
        if (attendance.status === 'HALF_DAY') {
          attendance.workingHours = 4;
        }
        
        // Set working hours to 0 for absent/leave
        if (['ABSENT', 'LEAVE'].includes(attendance.status)) {
          attendance.workingHours = 0;
          attendance.overtimeHours = 0;
        }
      }
    }
  });

  // Instance methods
  Attendance.prototype.isPresent = function() {
    return ['PRESENT', 'HALF_DAY', 'LATE'].includes(this.status);
  };

  Attendance.prototype.getTotalHours = function() {
    return (parseFloat(this.workingHours) || 0) + (parseFloat(this.overtimeHours) || 0);
  };

  // Class methods
  Attendance.findByEmployee = function(employeeId, startDate, endDate) {
    const where = { employeeId };
    
    if (startDate && endDate) {
      where.date = {
        [Op.between]: [startDate, endDate]
      };
    } else if (startDate) {
      where.date = {
        [Op.gte]: startDate
      };
    } else if (endDate) {
      where.date = {
        [Op.lte]: endDate
      };
    }
    
    return this.findAll({
      where,
      order: [['date', 'DESC']]
    });
  };

  Attendance.getAttendanceStats = async function(startDate, endDate) {
    const where = {};
    
    if (startDate && endDate) {
      where.date = {
        [Op.between]: [startDate, endDate]
      };
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
    
    const result = {
      totalRecords: 0,
      present: 0,
      absent: 0,
      halfDay: 0,
      late: 0,
      leave: 0
    };
    
    stats.forEach(stat => {
      const count = parseInt(stat.count);
      result.totalRecords += count;
      
      switch (stat.status) {
        case 'PRESENT':
          result.present = count;
          break;
        case 'ABSENT':
          result.absent = count;
          break;
        case 'HALF_DAY':
          result.halfDay = count;
          break;
        case 'LATE':
          result.late = count;
          break;
        case 'LEAVE':
          result.leave = count;
          break;
      }
    });
    
    // Calculate attendance percentage
    const presentCount = result.present + result.halfDay + result.late;
    result.averageAttendance = result.totalRecords > 0 
      ? Math.round((presentCount / result.totalRecords) * 100) 
      : 0;
    
    return result;
  };

  Attendance.getMonthlyTrend = async function(year) {
    const stats = await this.findAll({
      attributes: [
        [sequelize.fn('EXTRACT', sequelize.literal('MONTH FROM date')), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status IN ('PRESENT', 'HALF_DAY', 'LATE') THEN 1 ELSE 0 END")), 'present']
      ],
      where: {
        date: {
          [Op.between]: [`${year}-01-01`, `${year}-12-31`]
        }
      },
      group: [sequelize.fn('EXTRACT', sequelize.literal('MONTH FROM date'))],
      order: [[sequelize.fn('EXTRACT', sequelize.literal('MONTH FROM date')), 'ASC']],
      raw: true
    });
    
    return stats.map(stat => ({
      month: parseInt(stat.month),
      total: parseInt(stat.total),
      present: parseInt(stat.present),
      percentage: stat.total > 0 ? Math.round((stat.present / stat.total) * 100) : 0
    }));
  };

  return Attendance;
};
