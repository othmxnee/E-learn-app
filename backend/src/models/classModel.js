const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const { idAttributes, seededAttribute, applyJsonContract } = require('./jsonContract');

const Class = sequelize.define(
    'Class',
    {
        ...idAttributes,
        ...seededAttribute,
        levelId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        speciality: {
            type: DataTypes.STRING,
            // Optional, e.g., "IS", "IV". Required if level.hasSpeciality is true
            allowNull: true,
        },
        classNumber: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            // Auto-generated or manually set, e.g., "CS2-IS-1"
            allowNull: true,
        },
        adminId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
    },
    {
        tableName: 'classes',
        indexes: [{ fields: ['adminId'] }],
    }
);

applyJsonContract(Class, { populate: { level: 'levelId' } });

module.exports = Class;
