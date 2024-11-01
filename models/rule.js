import { DataTypes } from 'sequelize';
import { sequelize } from '../utils/database.js';

export const rule = sequelize.define('rule', {
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.INTEGER,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        args: true,
        msg: 'name can not be empty',
      },
      len: {
        args: [1, 100],
        msg: 'name must be between 1 and 100 characters',
      },
    },
  },
  rule: {
    type: DataTypes.STRING(4095),
    allowNull: false,
    validate: {
      notEmpty: {
        args: true,
        msg: 'rule can not be empty',
      },
      len: {
        args: [1, 4095],
        msg: 'rule must be between 1 and 4095 characters',
      },
    },
  },
});
