const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const { idAttributes, seededAttribute, applyJsonContract } = require('./jsonContract');

const Assignment = sequelize.define(
    'Assignment',
    {
        ...idAttributes,
        ...seededAttribute,
        allocationId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        deadline: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        createdBy: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        adminId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
    },
    {
        tableName: 'assignments',
        indexes: [{ fields: ['adminId'] }],
    }
);

applyJsonContract(Assignment, { populate: { allocation: 'allocationId' } });

module.exports = Assignment;
