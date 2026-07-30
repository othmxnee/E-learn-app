const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const { idAttributes, applyJsonContract } = require('./jsonContract');

const ModuleContent = sequelize.define(
    'ModuleContent',
    {
        ...idAttributes,
        allocationId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: { isIn: [['COURSE', 'TD', 'TP', 'OTHER']] },
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        fileUrl: {
            type: DataTypes.STRING,
            // URL to the file or external link
            allowNull: true,
        },
        link: {
            type: DataTypes.STRING,
            // Optional external link if not a file
            allowNull: true,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
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
        tableName: 'module_contents',
        indexes: [{ fields: ['adminId'] }],
    }
);

applyJsonContract(ModuleContent, { populate: { allocation: 'allocationId' } });

module.exports = ModuleContent;
