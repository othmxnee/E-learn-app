const mongoose = require('mongoose');

const moduleAllocationSchema = new mongoose.Schema({
    moduleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Module',
        required: true,
    },
    levelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicLevel',
        required: true,
    },
    teacherIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: true,
});

// Ensure a module is allocated to a level only once per admin
moduleAllocationSchema.index({ moduleId: 1, levelId: 1, adminId: 1 }, { unique: true });

const ModuleAllocation = mongoose.model('ModuleAllocation', moduleAllocationSchema);
module.exports = ModuleAllocation;
