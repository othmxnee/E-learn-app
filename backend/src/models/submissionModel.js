const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const { idAttributes, seededAttribute, applyJsonContract } = require('./jsonContract');

const Submission = sequelize.define(
    'Submission',
    {
        ...idAttributes,
        ...seededAttribute,
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
        // Marked out of 20, the scale the rest of the platform uses. Null until
        // a teacher grades it, which is what `isGraded` below reports.
        grade: {
            type: DataTypes.FLOAT,
            allowNull: true,
            validate: { min: 0, max: 20 },
        },
        feedback: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        gradedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        gradedBy: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        // Grading is kept off `status` so a graded submission still reports
        // whether it arrived on time or late.
        isGraded: {
            type: DataTypes.VIRTUAL,
            get() {
                return this.getDataValue('grade') !== null && this.getDataValue('grade') !== undefined;
            },
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
