const {
    ModuleContent,
    Assignment,
    Submission,
    ModuleAllocation,
    User,
    teacherInclude,
    isTeacherOf,
} = require('../models');
const { isUuid, uuidList } = require('../utils/uuid');

// Teachers have to be loaded for the authorisation checks below.
const findAllocation = (id, adminId) =>
    isUuid(id)
        ? ModuleAllocation.findOne({ where: { id, adminId }, include: [teacherInclude()] })
        : null;

// @desc    Add content to a module
// @route   POST /api/modules/:allocationId/content
// @access  Private/Teacher
const addContent = async (req, res) => {
    const { type, title, fileUrl, link, description } = req.body;
    const allocationId = req.params.allocationId;

    const allocation = await findAllocation(allocationId, req.user.adminId);
    if (!allocation) {
        return res.status(404).json({ message: 'Module allocation not found' });
    }

    // Verify teacher
    if (!isTeacherOf(allocation, req.user.id)) {
        return res.status(403).json({ message: 'Not authorized to add content to this module' });
    }

    const content = await ModuleContent.create({
        allocationId,
        type,
        title,
        fileUrl,
        link,
        description,
        createdBy: req.user.id,
        adminId: req.user.adminId,
    });

    res.status(201).json(content);
};

// @desc    Get content for a module
// @route   GET /api/modules/:allocationId/content
// @access  Private
const getContent = async (req, res) => {
    const allocationId = req.params.allocationId;

    if (!isUuid(allocationId)) {
        return res.json([]);
    }

    const content = await ModuleContent.findAll({
        where: { allocationId, adminId: req.user.adminId },
        order: [['createdAt', 'DESC']],
    });
    res.json(content);
};

// @desc    Create assignment
// @route   POST /api/modules/:allocationId/assignments
// @access  Private/Teacher
const createAssignment = async (req, res) => {
    const { title, description, deadline } = req.body;
    const allocationId = req.params.allocationId;

    const allocation = await findAllocation(allocationId, req.user.adminId);
    if (!allocation) {
        return res.status(404).json({ message: 'Module allocation not found' });
    }

    if (!isTeacherOf(allocation, req.user.id)) {
        return res.status(403).json({ message: 'Not authorized' });
    }

    const assignment = await Assignment.create({
        allocationId,
        title,
        description,
        deadline,
        createdBy: req.user.id,
        adminId: req.user.adminId,
    });

    res.status(201).json(assignment);
};

// @desc    Get assignments for a module
// @route   GET /api/modules/:allocationId/assignments
// @access  Private
const getAssignments = async (req, res) => {
    const allocationId = req.params.allocationId;

    if (!isUuid(allocationId)) {
        return res.json([]);
    }

    const assignments = await Assignment.findAll({
        where: { allocationId, adminId: req.user.adminId },
        order: [['deadline', 'ASC']],
    });

    const payload = assignments.map((assignment) => assignment.toJSON());

    // If student, attach their submission
    if (req.user.role === 'STUDENT') {
        for (const assign of payload) {
            const submission = await Submission.findOne({
                where: {
                    assignmentId: assign._id,
                    studentId: req.user.id,
                    adminId: req.user.adminId,
                },
            });
            assign.mySubmission = submission;
        }
    }

    res.json(payload);
};

// @desc    Submit assignment
// @route   POST /api/assignments/:assignmentId/submit
// @access  Private/Student
const submitAssignment = async (req, res) => {
    const { fileUrl } = req.body;
    const assignmentId = req.params.assignmentId;

    const assignment = isUuid(assignmentId)
        ? await Assignment.findOne({ where: { id: assignmentId, adminId: req.user.adminId } })
        : null;
    if (!assignment) {
        return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check deadline
    const now = new Date();
    const status = now > assignment.deadline ? 'LATE' : 'SUBMITTED';

    // Check existing submission
    const existingSubmission = await Submission.findOne({
        where: {
            assignmentId,
            studentId: req.user.id,
            adminId: req.user.adminId,
        },
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
        studentId: req.user.id,
        fileUrl,
        status,
        submittedAt: now,
        adminId: req.user.adminId,
    });

    res.status(201).json(submission);
};

// @desc    Get submissions for an assignment
// @route   GET /api/assignments/:assignmentId/submissions
// @access  Private/Teacher
const getSubmissions = async (req, res) => {
    const assignmentId = req.params.assignmentId;

    const assignment = isUuid(assignmentId)
        ? await Assignment.findOne({
            where: { id: assignmentId, adminId: req.user.adminId },
            include: [
                {
                    model: ModuleAllocation,
                    as: 'allocation',
                    include: [teacherInclude(['id'])],
                },
            ],
        })
        : null;

    if (!assignment) {
        return res.status(404).json({ message: 'Assignment not found' });
    }

    // Verify teacher
    if (!assignment.allocation || !isTeacherOf(assignment.allocation, req.user.id)) {
        return res.status(403).json({ message: 'Not authorized' });
    }

    const submissions = await Submission.findAll({
        where: { assignmentId, adminId: req.user.adminId },
        include: [{ model: User, as: 'student', attributes: ['id', 'fullName', 'matricule'] }],
        order: [['submittedAt', 'DESC']],
    });

    res.json(submissions);
};

// @desc    Grade a submission
// @route   PUT /api/submissions/:submissionId/grade
// @access  Private/Teacher
const gradeSubmission = async (req, res) => {
    const { grade, feedback } = req.body;
    const { submissionId } = req.params;

    // A submission can be un-graded by sending null, so the absence of a grade
    // is only rejected when the key was left out entirely.
    const clearing = grade === null || grade === '';
    const parsed = clearing ? null : Number(grade);

    if (!clearing && (!Number.isFinite(parsed) || parsed < 0 || parsed > 20)) {
        return res.status(400).json({ message: 'Grade must be a number between 0 and 20' });
    }

    const submission = isUuid(submissionId)
        ? await Submission.findOne({ where: { id: submissionId, adminId: req.user.adminId } })
        : null;

    if (!submission) {
        return res.status(404).json({ message: 'Submission not found' });
    }

    // Only a teacher of the module the assignment belongs to may grade it.
    const assignment = await Assignment.findOne({
        where: { id: submission.assignmentId, adminId: req.user.adminId },
        include: [
            {
                model: ModuleAllocation,
                as: 'allocation',
                include: [teacherInclude(['id'])],
            },
        ],
    });

    if (!assignment || !assignment.allocation || !isTeacherOf(assignment.allocation, req.user.id)) {
        return res.status(403).json({ message: 'Not authorized to grade this submission' });
    }

    submission.grade = parsed;
    submission.feedback = clearing ? null : feedback ?? submission.feedback;
    submission.gradedAt = clearing ? null : new Date();
    submission.gradedBy = clearing ? null : req.user.id;
    await submission.save();

    res.json(submission);
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
    for (const allocationId of uuidList(allocationIds)) {
        const content = await ModuleContent.create({
            allocationId,
            type,
            title,
            fileUrl,
            link,
            description,
            createdBy: req.user.id,
            adminId: req.user.adminId,
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
    for (const allocationId of uuidList(allocationIds)) {
        const assignment = await Assignment.create({
            allocationId,
            title,
            description,
            deadline,
            createdBy: req.user.id,
            adminId: req.user.adminId,
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
    gradeSubmission,
    bulkAddContent,
    bulkCreateAssignment,
};
