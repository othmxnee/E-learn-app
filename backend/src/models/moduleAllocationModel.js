const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const { idAttributes, applyJsonContract } = require('./jsonContract');

const ModuleAllocation = sequelize.define(
    'ModuleAllocation',
    {
        ...idAttributes,
        moduleId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        levelId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        adminId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
    },
    {
        tableName: 'module_allocations',
        indexes: [
            // Ensure a module is allocated to a level only once per admin
            { unique: true, fields: ['moduleId', 'levelId', 'adminId'] },
        ],
    }
);

// The teachers list was an array of refs on the document; in Postgres it is a
// join table, serialised back as `teacherIds` for the API.
applyJsonContract(ModuleAllocation, {
    populate: { module: 'moduleId', level: 'levelId', teachers: 'teacherIds' },
});

module.exports = ModuleAllocation;
