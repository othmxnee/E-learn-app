const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
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
        unique: true,
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
}, {
    timestamps: true,
});

// Match password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);
module.exports = User;
