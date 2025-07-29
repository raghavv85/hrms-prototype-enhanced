module.exports = (sequelize, DataTypes) => {
  const Employee = sequelize.define('Employee', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    employeeId: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING(15),
      allowNull: true,
      validate: {
        is: /^[\+]?[1-9][\d]{0,15}$/
      }
    },
    department: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    designation: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    dateOfJoining: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true,
        isBefore: new Date().toISOString().split('T')[0]
      }
    },
    salary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
        isDecimal: true
      }
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'TERMINATED'),
      allowNull: false,
      defaultValue: 'ACTIVE'
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    emergencyContact: {
      type: DataTypes.JSONB,
      allowNull: true,
      validate: {
        isValidEmergencyContact(value) {
          if (value && typeof value === 'object') {
            if (!value.name || !value.phone) {
              throw new Error('Emergency contact must have name and phone');
            }
          }
        }
      }
    },
    bankDetails: {
      type: DataTypes.JSONB,
      allowNull: true,
      validate: {
        isValidBankDetails(value) {
          if (value && typeof value === 'object') {
            if (!value.accountNumber || !value.bankName) {
              throw new Error('Bank details must have account number and bank name');
            }
          }
        }
      }
    },
    documents: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
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
    tableName: 'employees',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['employeeId']
      },
      {
        unique: true,
        fields: ['email']
      },
      {
        fields: ['department']
      },
      {
        fields: ['designation']
      },
      {
        fields: ['status']
      },
      {
        fields: ['dateOfJoining']
      }
    ]
  });

  // Instance methods
  Employee.prototype.getFullName = function() {
    return this.name;
  };

  Employee.prototype.isActive = function() {
    return this.status === 'ACTIVE';
  };

  Employee.prototype.calculateTenure = function() {
    const joinDate = new Date(this.dateOfJoining);
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate - joinDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    return { years, months, totalDays: diffDays };
  };

  // Class methods
  Employee.findByEmployeeId = function(employeeId) {
    return this.findOne({
      where: { employeeId }
    });
  };

  Employee.findByDepartment = function(department) {
    return this.findAll({
      where: { department, status: 'ACTIVE' }
    });
  };

  Employee.findActiveEmployees = function() {
    return this.findAll({
      where: { status: 'ACTIVE' }
    });
  };

  Employee.getDepartmentStats = async function() {
    const stats = await this.findAll({
      attributes: [
        'department',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: { status: 'ACTIVE' },
      group: ['department'],
      raw: true
    });
    
    return stats.reduce((acc, stat) => {
      acc[stat.department] = parseInt(stat.count);
      return acc;
    }, {});
  };

  return Employee;
};
