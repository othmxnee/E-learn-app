const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const { idAttributes, applyJsonContract } = require('./jsonContract');

const Submission = sequelize.define(
    'Submission',
    {
        ...idAttributes,
        assignmentId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        studentId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        fileUrl: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        submittedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: 'SUBMITTED',
            validate: { isIn: [['SUBMITTED', 'LATE']] },
        },
        adminId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
    },
    {
        tableName: 'submissions',
        indexes: [
            // Ensure a student submits only once per assignment per admin
            { unique: true, fields: ['assignmentId', 'studentId', 'adminId'] },
        ],
    }
);

applyJsonContract(Submission, { populate: { student: 'studentId' } });

module.exports = Submission;
