const ModuleContent = require('../models/moduleContentModel');
const Assignment = require('../models/assignmentModel');
const Submission = require('../models/submissionModel');
const ModuleAllocation = require('../models/moduleAllocationModel');

// @desc    Add content to a module
// @route   POST /api/modules/:allocationId/content
// @access  Private/Teacher
const addContent = async (req, res) => {
    const { type, title, fileUrl, link, description } = req.body;
    const allocationId = req.params.allocationId;

    const allocation = await ModuleAllocation.findById(allocationId);
    if (!allocation) {
        return res.status(404).json({ message: 'Module allocation not found' });
    }

    // Verify teacher
    if (!allocation.teacherIds.some(id => id.toString() === req.user._id.toString())) {
        return res.status(403).json({ message: 'Not authorized to add content to this module' });
    }

    const content = await ModuleContent.create({
        allocationId,
        type,
        title,
        fileUrl,
        link,
        description,
        createdBy: req.user._id,
    });

    res.status(201).json(content);
};

// @desc    Get content for a module
// @route   GET /api/modules/:allocationId/content
// @access  Private
const getContent = async (req, res) => {
    const allocationId = req.params.allocationId;

    // Security check (simplified, ideally check if student belongs to class or teacher belongs to module)
    // Assuming the route protection handles basic auth, but strictly we should check relation.

    const content = await ModuleContent.find({ allocationId }).sort({ createdAt: -1 });
    res.json(content);
};

// @desc    Create assignment
// @route   POST /api/modules/:allocationId/assignments
// @access  Private/Teacher
const createAssignment = async (req, res) => {
    const { title, description, deadline } = req.body;
    const allocationId = req.params.allocationId;

    const allocation = await ModuleAllocation.findById(allocationId);
    if (!allocation) {
        return res.status(404).json({ message: 'Module allocation not found' });
    }

    if (!allocation.teacherIds.some(id => id.toString() === req.user._id.toString())) {
        return res.status(403).json({ message: 'Not authorized' });
    }

    const assignment = await Assignment.create({
        allocationId,
        title,
        description,
        deadline,
        createdBy: req.user._id,
    });

    res.status(201).json(assignment);
};

// @desc    Get assignments for a module
// @route   GET /api/modules/:allocationId/assignments
// @access  Private
const getAssignments = async (req, res) => {
    const allocationId = req.params.allocationId;
    const assignments = await Assignment.find({ allocationId }).sort({ deadline: 1 }).lean();

    // If student, attach their submission
    if (req.user.role === 'STUDENT') {
        for (let assign of assignments) {
            const submission = await Submission.findOne({
                assignmentId: assign._id,
                studentId: req.user._id,
            });
            assign.mySubmission = submission;
        }
    }

    res.json(assignments);
};

// @desc    Submit assignment
// @route   POST /api/assignments/:assignmentId/submit
// @access  Private/Student
const submitAssignment = async (req, res) => {
    const { fileUrl } = req.body;
    const assignmentId = req.params.assignmentId;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
        return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check deadline
    const now = new Date();
    const status = now > assignment.deadline ? 'LATE' : 'SUBMITTED';

    // Check existing submission
    const existingSubmission = await Submission.findOne({
        assignmentId,
        studentId: req.user._id,
    });

    if (existingSubmission) {
        // Update existing
        existingSubmission.fileUrl = fileUrl;
        existingSubmission.submittedAt = now;
        existingSubmission.status = status;
        await existingSubmission.save();
        return res.json(existingSubmission);
    }

    const submission = await Submission.create({
        assignmentId,
        studentId: req.user._id,
        fileUrl,
        status,
        submittedAt: now,
    });

    res.status(201).json(submission);
};

// @desc    Get submissions for an assignment
// @route   GET /api/assignments/:assignmentId/submissions
// @access  Private/Teacher
const getSubmissions = async (req, res) => {
    const assignmentId = req.params.assignmentId;

    const assignment = await Assignment.findById(assignmentId).populate('allocationId');
    if (!assignment) {
        return res.status(404).json({ message: 'Assignment not found' });
    }

    // Verify teacher
    if (!assignment.allocationId.teacherIds.some(id => id.toString() === req.user._id.toString())) {
        return res.status(403).json({ message: 'Not authorized' });
    }

    const submissions = await Submission.find({ assignmentId })
        .populate('studentId', 'fullName matricule')
        .sort({ submittedAt: -1 });

    res.json(submissions);
};

// @desc    Add content to multiple allocations
// @route   POST /api/modules/bulk/content
// @access  Private/Teacher
const bulkAddContent = async (req, res) => {
    const { allocationIds, type, title, fileUrl, link, description } = req.body;

    if (!allocationIds || !Array.isArray(allocationIds)) {
        return res.status(400).json({ message: 'Invalid allocationIds' });
    }

    const contents = [];
    for (const allocationId of allocationIds) {
        const content = await ModuleContent.create({
            allocationId,
            type,
            title,
            fileUrl,
            link,
            description,
            createdBy: req.user._id,
        });
        contents.push(content);
    }

    res.status(201).json(contents);
};

// @desc    Create assignment for multiple allocations
// @route   POST /api/modules/bulk/assignments
// @access  Private/Teacher
const bulkCreateAssignment = async (req, res) => {
    const { allocationIds, title, description, deadline } = req.body;

    if (!allocationIds || !Array.isArray(allocationIds)) {
        return res.status(400).json({ message: 'Invalid allocationIds' });
    }

    const assignments = [];
    for (const allocationId of allocationIds) {
        const assignment = await Assignment.create({
            allocationId,
            title,
            description,
            deadline,
            createdBy: req.user._id,
        });
        assignments.push(assignment);
    }

    res.status(201).json(assignments);
};

module.exports = {
    addContent,
    getContent,
    createAssignment,
    getAssignments,
    submitAssignment,
    getSubmissions,
    bulkAddContent,
    bulkCreateAssignment,
};
