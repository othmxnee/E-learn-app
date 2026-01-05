const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        sparse: true, // Allow null/undefined (for students/teachers who use matricule as username alias)
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['ADMIN', 'TEACHER', 'STUDENT'],
        required: true,
    },
    fullName: {
        type: String,
        required: true,
    },
    matricule: {
        type: String,
        sparse: true, // Admin might not have matricule
    },
    firstLogin: {
        type: Boolean,
        default: true,
    },
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
    },
    preferredLanguage: {
        type: String,
        enum: ['ar', 'en', 'fr'],
        default: 'fr',
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true,
});

userSchema.index({ adminId: 1 });
userSchema.index({ username: 1, adminId: 1 }, { unique: true });
userSchema.index({ matricule: 1, adminId: 1 }, { unique: true });

// Match password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password using bcrypt
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);
module.exports = User;
