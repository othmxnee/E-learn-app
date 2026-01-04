const Module = require('../models/moduleModel');
const ModuleAllocation = require('../models/moduleAllocationModel');
const Class = require('../models/classModel');
const User = require('../models/userModel');
const AcademicLevel = require('../models/academicLevelModel');

// @desc    Create a new module definition
// @route   POST /api/admin/modules
// @access  Private/Admin
const createModule = async (req, res) => {
    const { name, description } = req.body;

    const module = await Module.create({
        name,
        description,
    });

    res.status(201).json(module);
};

// @desc    Allocate a module to a level and assign teachers
// @route   POST /api/admin/modules/allocate
// @access  Private/Admin
const allocateModule = async (req, res) => {
    const { moduleId, levelId, teacherIds } = req.body;

    // Validate existence
    const module = await Module.findById(moduleId);
    const level = await AcademicLevel.findById(levelId);

    if (!module || !level) {
        return res.status(404).json({ message: 'Module or Level not found' });
    }

    // Check if already allocated
    const existingAllocation = await ModuleAllocation.findOne({ moduleId, levelId });
    if (existingAllocation) {
        existingAllocation.teacherIds = teacherIds;
        await existingAllocation.save();
        return res.json(existingAllocation);
    }

    const allocation = await ModuleAllocation.create({
        moduleId,
        levelId,
        teacherIds,
    });

    res.status(201).json(allocation);
};

// @desc    Allocate a module to multiple levels (Bulk)
// @route   POST /api/admin/modules/allocate-bulk
// @access  Private/Admin
const allocateModuleBulk = async (req, res) => {
    const { moduleId, levelIds, teacherIds } = req.body;

    // Validate module exists
    const module = await Module.findById(moduleId);
    if (!module) {
        return res.status(404).json({ message: 'Module not found' });
    }

    const allocations = [];
    for (const levelId of levelIds) {
        const existingAllocation = await ModuleAllocation.findOne({ moduleId, levelId });
        if (existingAllocation) {
            existingAllocation.teacherIds = teacherIds;
            await existingAllocation.save();
            allocations.push(existingAllocation);
        } else {
            const allocation = await ModuleAllocation.create({
                moduleId,
                levelId,
                teacherIds,
            });
            allocations.push(allocation);
        }
    }

    res.status(201).json({
        message: `Module allocated to ${allocations.length} levels`,
        allocations
    });
};

// @desc    Get modules for the current user (Teacher or Student)
// @route   GET /api/modules
// @access  Private
const getMyModules = async (req, res) => {
    const user = req.user;

    try {
        let allocations = [];

        if (user.role === 'TEACHER') {
            // Find allocations where this teacher is assigned
            allocations = await ModuleAllocation.find({ teacherIds: user._id })
                .populate('moduleId', 'name code description')
                .populate('levelId', 'name');
        } else if (user.role === 'STUDENT') {
            // Find allocations for the student's level
            if (!user.classId) {
                return res.status(400).json({ message: 'Student is not assigned to a class' });
            }

            const studentClass = await Class.findById(user.classId);
            if (!studentClass) {
                return res.status(404).json({ message: 'Student class not found' });
            }

            allocations = await ModuleAllocation.find({ levelId: studentClass.levelId })
                .populate('moduleId', 'name code description')
                .populate('teacherIds', 'fullName');
        } else if (user.role === 'ADMIN') {
            const modules = await Module.find({});
            return res.json(modules);
        }

        res.json(allocations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get module details (allocations)
// @route   GET /api/modules/:id
// @access  Private
const getModuleDetails = async (req, res) => {
    const allocation = await ModuleAllocation.findById(req.params.id)
        .populate('moduleId')
        .populate('levelId')
        .populate('teacherIds', 'fullName email');

    if (!allocation) {
        return res.status(404).json({ message: 'Module not found' });
    }

    // Security check
    if (req.user.role === 'STUDENT') {
        const studentClass = await Class.findById(req.user.classId);
        if (!studentClass || studentClass.levelId.toString() !== allocation.levelId._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
    }
    if (req.user.role === 'TEACHER' && !allocation.teacherIds.some(t => t._id.toString() === req.user._id.toString())) {
        return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(allocation);
};

module.exports = {
    createModule,
    allocateModule,
    allocateModuleBulk,
    getMyModules,
    getModuleDetails,
};
