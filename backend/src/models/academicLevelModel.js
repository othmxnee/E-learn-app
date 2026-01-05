const mongoose = require('mongoose');

const academicLevelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        // e.g., CP1, CP2, L1, L2, L3, M1, M2, CS1, CS2, CS3
    },
    type: {
        type: String,
        enum: ['UNIVERSITY', 'ECOLE_SUPERIEURE'],
        required: true,
    },
    hasSpeciality: {
        type: Boolean,
        default: false,
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: true,
});

academicLevelSchema.index({ adminId: 1 });

const AcademicLevel = mongoose.model('AcademicLevel', academicLevelSchema);
module.exports = AcademicLevel;
