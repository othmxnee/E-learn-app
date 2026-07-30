const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const { idAttributes, applyJsonContract } = require('./jsonContract');

const AcademicLevel = sequelize.define(
    'AcademicLevel',
    {
        ...idAttributes,
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            // e.g., CP1, CP2, L1, L2, L3, M1, M2, CS1, CS2, CS3
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: { isIn: [['UNIVERSITY', 'ECOLE_SUPERIEURE']] },
        },
        hasSpeciality: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        adminId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
    },
    {
        tableName: 'academic_levels',
        indexes: [{ fields: ['adminId'] }],
    }
);

applyJsonContract(AcademicLevel);

module.exports = AcademicLevel;
