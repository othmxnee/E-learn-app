const mongoose = require('mongoose');

const moduleContentSchema = new mongoose.Schema({
    allocationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ModuleAllocation',
        required: true,
    },
    type: {
        type: String,
        enum: ['COURSE', 'TD', 'TP', 'OTHER'],
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    fileUrl: {
        type: String,
        // URL to the file or external link
    },
    link: {
        type: String,
        // Optional external link if not a file
    },
    description: {
        type: String,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: true,
});

const ModuleContent = mongoose.model('ModuleContent', moduleContentSchema);
module.exports = ModuleContent;
