module.exports = (sequelize, DataTypes) => {
  const Employee = sequelize.define('Employee', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    employeeId: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        isNumeric: true,
        len: [10, 10]
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
    supervisorName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    unitHead: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    subLocation: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    doj: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true,
      }
    },
    gender: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    newOld: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    designation: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    dra: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    fieldFloor: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    portfolioCode: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    client: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    product: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    process: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive'),
      allowNull: false,
      defaultValue: 'Active'
    },
    ctc: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
        isDecimal: true
      }
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
        fields: ['status']
      },
      {
        fields: ['doj']
      }
    ]
  });

  // Instance methods
  Employee.prototype.getFullName = function() {
    return this.name;
  };

  Employee.prototype.isActive = function() {
    return this.status === 'Active';
  };

  Employee.prototype.calculateVintage = function() {
    const joinDate = new Date(this.doj);
    const currentDate = new Date();
    let years = currentDate.getFullYear() - joinDate.getFullYear();
    let months = currentDate.getMonth() - joinDate.getMonth();
    if (months < 0 || (months === 0 && currentDate.getDate() < joinDate.getDate())) {
      years--;
      months += 12;
    }
    return { years, months };
  };

  // Class methods
  Employee.findByEmployeeId = function(employeeId) {
    return this.findOne({
      where: { employeeId }
    });
  };

  Employee.findActiveEmployees = function() {
    return this.findAll({
      where: { status: 'Active' }
    });
  };

  return Employee;
};
