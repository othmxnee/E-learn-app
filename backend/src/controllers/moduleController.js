const { Op } = require('sequelize');
const {
    Module,
    ModuleAllocation,
    Class,
    User,
    AcademicLevel,
    teacherInclude,
    isTeacherOf,
} = require('../models');
const { isUuid, uuidList } = require('../utils/uuid');

const moduleInclude = (attributes = ['id', 'name', 'description']) => ({
    model: Module,
    as: 'module',
    attributes,
});

const levelInclude = (attributes = ['id', 'name']) => ({
    model: AcademicLevel,
    as: 'level',
    attributes,
});

// @desc    Create a new module definition
// @route   POST /api/admin/modules
// @access  Private/Admin
const createModule = async (req, res) => {
    const { name, description } = req.body;

    const module = await Module.create({
        name,
        description,
        adminId: req.user.adminId,
    });

    res.status(201).json(module);
};

// Allocations are always returned with their teachers loaded so `teacherIds` is
// present on the response.
const reloadAllocation = (id) =>
    ModuleAllocation.findByPk(id, { include: [teacherInclude()] });

// @desc    Allocate a module to a level and assign teachers
// @route   POST /api/admin/modules/allocate
// @access  Private/Admin
const allocateModule = async (req, res) => {
    const { moduleId, levelId, teacherIds } = req.body;

    // Validate existence
    const module = isUuid(moduleId)
        ? await Module.findOne({ where: { id: moduleId, adminId: req.user.adminId } })
        : null;
    const level = isUuid(levelId)
        ? await AcademicLevel.findOne({ where: { id: levelId, adminId: req.user.adminId } })
        : null;

    if (!module || !level) {
        return res.status(404).json({ message: 'Module or Level not found' });
    }

    // Check if already allocated
    const existingAllocation = await ModuleAllocation.findOne({
        where: { moduleId, levelId, adminId: req.user.adminId },
    });

    if (existingAllocation) {
        await existingAllocation.setTeachers(uuidList(teacherIds));
        return res.json(await reloadAllocation(existingAllocation.id));
    }

    const allocation = await ModuleAllocation.create({
        moduleId,
        levelId,
        adminId: req.user.adminId,
    });
    await allocation.setTeachers(uuidList(teacherIds));

    res.status(201).json(await reloadAllocation(allocation.id));
};

// @desc    Allocate a module to multiple levels (Bulk)
// @route   POST /api/admin/modules/allocate-bulk
// @access  Private/Admin
const allocateModuleBulk = async (req, res) => {
    const { moduleId, levelIds, teacherIds } = req.body;

    // Validate module exists
    const module = isUuid(moduleId)
        ? await Module.findOne({ where: { id: moduleId, adminId: req.user.adminId } })
        : null;
    if (!module) {
        return res.status(404).json({ message: 'Module not found' });
    }

    const teachers = uuidList(teacherIds);
    const allocations = [];

    for (const levelId of uuidList(levelIds)) {
        const existingAllocation = await ModuleAllocation.findOne({
            where: { moduleId, levelId, adminId: req.user.adminId },
        });

        if (existingAllocation) {
            await existingAllocation.setTeachers(teachers);
            allocations.push(await reloadAllocation(existingAllocation.id));
        } else {
            const allocation = await ModuleAllocation.create({
                moduleId,
                levelId,
                adminId: req.user.adminId,
            });
            await allocation.setTeachers(teachers);
            allocations.push(await reloadAllocation(allocation.id));
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
            // Find allocations where this teacher is assigned. The membership
            // filter runs first so the response can still list every teacher.
            const assigned = await ModuleAllocation.findAll({
                attributes: ['id'],
                where: { adminId: user.adminId },
                include: [
                    {
                        model: User,
                        as: 'teachers',
                        attributes: [],
                        through: { attributes: [] },
                        where: { id: user.id },
                    },
                ],
            });

            allocations = await ModuleAllocation.findAll({
                where: { id: { [Op.in]: assigned.map((a) => a.id) } },
                include: [moduleInclude(), levelInclude(), teacherInclude()],
            });
        } else if (user.role === 'STUDENT') {
            // Find allocations for the student's level
            if (!user.classId) {
                return res.status(400).json({ message: 'Student is not assigned to a class' });
            }

            const studentClass = await Class.findOne({
                where: { id: user.classId, adminId: user.adminId },
            });
            if (!studentClass) {
                return res.status(404).json({ message: 'Student class not found' });
            }

            allocations = await ModuleAllocation.findAll({
                where: { levelId: studentClass.levelId, adminId: user.adminId },
                include: [moduleInclude(), levelInclude(), teacherInclude(['id', 'fullName'])],
            });
        } else if (user.role === 'ADMIN') {
            const modules = await Module.findAll({ where: { adminId: user.adminId } });
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
    const allocation = isUuid(req.params.id)
        ? await ModuleAllocation.findOne({
            where: { id: req.params.id, adminId: req.user.adminId },
            include: [
                moduleInclude(['id', 'name', 'description']),
                levelInclude(['id', 'name', 'type', 'hasSpeciality']),
                teacherInclude(),
            ],
        })
        : null;

    if (!allocation) {
        return res.status(404).json({ message: 'Module not found' });
    }

    // Security check
    if (req.user.role === 'STUDENT') {
        const studentClass = req.user.classId
            ? await Class.findOne({ where: { id: req.user.classId, adminId: req.user.adminId } })
            : null;
        if (!studentClass || String(studentClass.levelId) !== String(allocation.levelId)) {
            return res.status(403).json({ message: 'Not authorized' });
        }
    }
    if (req.user.role === 'TEACHER' && !isTeacherOf(allocation, req.user.id)) {
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
