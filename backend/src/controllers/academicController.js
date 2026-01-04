const AcademicLevel = require('../models/academicLevelModel');
const Class = require('../models/classModel');

// @desc    Create a new academic level (e.g., CP1, M2)
// @route   POST /api/admin/academic-structure/levels
// @access  Private/Admin
// @desc    Create a new academic level with classes
// @route   POST /api/admin/academic-structure/levels
// @access  Private/Admin
const createAcademicLevel = async (req, res) => {
    const { name, type, hasSpeciality, classCount, specialities } = req.body;

    // 1. Create Level
    const levelExists = await AcademicLevel.findOne({ name });
    if (levelExists) {
        return res.status(400).json({ message: 'Academic level already exists' });
    }

    const level = await AcademicLevel.create({
        name,
        type,
        hasSpeciality,
    });

    // 2. Create Classes
    const classesToCreate = [];

    if (hasSpeciality && specialities && Array.isArray(specialities)) {
        // Create classes for each speciality
        for (const spec of specialities) {
            // spec: { name: 'IS', count: 2 }
            for (let i = 1; i <= spec.count; i++) {
                classesToCreate.push({
                    levelId: level._id,
                    speciality: spec.name,
                    classNumber: i,
                    name: `${name}-${spec.name}-${i}`,
                });
            }
        }
    } else if (!hasSpeciality && classCount > 0) {
        // Create classes without speciality
        for (let i = 1; i <= classCount; i++) {
            classesToCreate.push({
                levelId: level._id,
                classNumber: i,
                name: `${name}-${i}`,
            });
        }
    }

    if (classesToCreate.length > 0) {
        await Class.insertMany(classesToCreate);
    }

    res.status(201).json({ level, classesCreated: classesToCreate.length });
};

// @desc    Get all academic levels
// @route   GET /api/admin/academic-structure/levels
// @access  Private/Admin
const getAcademicLevels = async (req, res) => {
    const levels = await AcademicLevel.find({});
    res.json(levels);
};

// @desc    Create a new class
// @route   POST /api/admin/academic-structure/classes
// @access  Private/Admin
const createClass = async (req, res) => {
    const { levelId, speciality, classNumber } = req.body;

    const level = await AcademicLevel.findById(levelId);
    if (!level) {
        return res.status(404).json({ message: 'Academic level not found' });
    }

    if (level.hasSpeciality && !speciality) {
        return res.status(400).json({ message: 'Speciality is required for this level' });
    }

    // Generate name
    let name = `${level.name}`;
    if (speciality) {
        name += `-${speciality}`;
    }
    name += `-${classNumber}`; // e.g., CS2-IS-1

    const classExists = await Class.findOne({ name });
    if (classExists) {
        return res.status(400).json({ message: 'Class already exists' });
    }

    const newClass = await Class.create({
        levelId,
        speciality,
        classNumber,
        name,
    });

    res.status(201).json(newClass);
};

// @desc    Get all classes
// @route   GET /api/admin/academic-structure/classes
// @access  Private/Admin
const getClasses = async (req, res) => {
    const User = require('../models/userModel');

    const classes = await Class.find({}).populate('levelId', 'name type').lean();

    // Add student count to each class
    for (let cls of classes) {
        const studentCount = await User.countDocuments({
            classId: cls._id,
            role: 'STUDENT'
        });
        cls.studentCount = studentCount;
    }

    res.json(classes);
};

// @desc    Update academic level
// @route   PUT /api/admin/academic-structure/levels/:id
// @access  Private/Admin
const updateAcademicLevel = async (req, res) => {
    const { name, type, hasSpeciality } = req.body;
    const level = await AcademicLevel.findById(req.params.id);

    if (level) {
        level.name = name || level.name;
        level.type = type || level.type;
        level.hasSpeciality = hasSpeciality !== undefined ? hasSpeciality : level.hasSpeciality;

        const updatedLevel = await level.save();
        res.json(updatedLevel);
    } else {
        res.status(404).json({ message: 'Level not found' });
    }
};

// @desc    Delete academic level
// @route   DELETE /api/admin/academic-structure/levels/:id
// @access  Private/Admin
const deleteAcademicLevel = async (req, res) => {
    const level = await AcademicLevel.findById(req.params.id);

    if (level) {
        // Delete associated classes
        await Class.deleteMany({ levelId: level._id });
        await level.deleteOne();
        res.json({ message: 'Level and associated classes removed' });
    } else {
        res.status(404).json({ message: 'Level not found' });
    }
};

// @desc    Assign students to a class
// @route   POST /api/admin/academic-structure/classes/:id/students
// @access  Private/Admin
const assignStudentsToClass = async (req, res) => {
    const { studentIds } = req.body;
    const classId = req.params.id;

    const classObj = await Class.findById(classId);
    if (!classObj) {
        return res.status(404).json({ message: 'Class not found' });
    }

    // Update users
    await User.updateMany(
        { _id: { $in: studentIds }, role: 'STUDENT' },
        { $set: { classId: classId } }
    );

    res.json({ message: 'Students assigned successfully' });
};

module.exports = {
    createAcademicLevel,
    getAcademicLevels,
    createClass,
    getClasses,
    updateAcademicLevel,
    deleteAcademicLevel,
    assignStudentsToClass,
};
