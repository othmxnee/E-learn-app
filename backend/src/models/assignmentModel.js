const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
    allocationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ModuleAllocation',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    deadline: {
        type: Date,
        required: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: true,
});

const Assignment = mongoose.model('Assignment', assignmentSchema);
module.exports = Assignment;
