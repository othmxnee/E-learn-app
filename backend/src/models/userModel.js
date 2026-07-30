const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/db');
const { idAttributes, applyJsonContract } = require('./jsonContract');

const User = sequelize.define(
    'User',
    {
        ...idAttributes,
        username: {
            type: DataTypes.STRING,
            // Null for users who log in with their matricule instead.
            allowNull: true,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        role: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: { isIn: [['ADMIN', 'TEACHER', 'STUDENT']] },
        },
        fullName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        matricule: {
            type: DataTypes.STRING,
            // Admin might not have matricule
            allowNull: true,
        },
        firstLogin: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        classId: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        preferredLanguage: {
            type: DataTypes.STRING,
            defaultValue: 'fr',
            validate: { isIn: [['ar', 'en', 'fr']] },
        },
        adminId: {
            type: DataTypes.UUID,
            allowNull: true,
        },
    },
    {
        tableName: 'users',
        indexes: [
            { fields: ['adminId'] },
            // Postgres treats nulls as distinct, which reproduces the sparse
            // unique indexes these replace.
            { unique: true, fields: ['username', 'adminId'] },
            { unique: true, fields: ['matricule', 'adminId'] },
        ],
    }
);

User.prototype.matchPassword = async function (enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password);
};

// CSV imports hash their own passwords in bulk, and bulkCreate skips this hook
// unless individualHooks is set, so there is no double hashing.
User.beforeSave(async (user) => {
    if (!user.changed('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
});

applyJsonContract(User, { hidden: ['password'] });

module.exports = User;
