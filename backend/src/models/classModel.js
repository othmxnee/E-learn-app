const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
    levelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicLevel',
        required: true,
    },
    speciality: {
        type: String,
        // Optional, e.g., "IS", "IV". Required if level.hasSpeciality is true
    },
    classNumber: {
        type: Number,
        required: true,
    },
    name: {
        type: String,
        // Auto-generated or manually set, e.g., "CS2-IS-1"
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: true,
});

classSchema.index({ adminId: 1 });

const Class = mongoose.model('Class', classSchema);
module.exports = Class;
