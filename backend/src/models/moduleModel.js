const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const { idAttributes, applyJsonContract } = require('./jsonContract');

const Module = sequelize.define(
    'Module',
    {
        ...idAttributes,
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        adminId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
    },
    {
        tableName: 'modules',
        indexes: [{ fields: ['adminId'] }],
    }
);

applyJsonContract(Module);

module.exports = Module;
