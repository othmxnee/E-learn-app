const User = require('../models/userModel');
const Class = require('../models/classModel');
const Module = require('../models/moduleModel');
const bcrypt = require('bcryptjs');

// @desc    Create a new user (Teacher or Student)
// @route   POST /api/admin/users
// @access  Private/Admin
const createUser = async (req, res) => {
    try {
        const { fullName, role, matricule, classId, username, password } = req.body;

        // Validation
        if (!fullName || !role) {
            return res.status(400).json({ message: 'Full name and role are required' });
        }

        let userData = { fullName, role, classId, adminId: req.user.adminId };

        if (role === 'ADMIN') {
            if (!username || !password) {
                return res.status(400).json({ message: 'Username and password are required for Admin' });
            }
            userData.username = username;
            userData.password = password;
        } else {
            // Teacher or Student
            if (!matricule) {
                return res.status(400).json({ message: 'Matricule is required for Teachers and Students' });
            }
            // Ensure matricule contains only numbers
            if (!/^\d+$/.test(matricule)) {
                return res.status(400).json({ message: 'Matricule must contain only numbers' });
            }

            userData.matricule = matricule;
            userData.username = matricule; // Alias username to matricule for login simplicity
            userData.password = matricule; // Default password is the matricule
        }

        const userExists = await User.findOne({
            $or: [
                { username: userData.username },
                { matricule: userData.matricule }
            ]
        });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create(userData);

        res.status(201).json({
            _id: user._id,
            fullName: user.fullName,
            username: user.username,
            role: user.role,
            matricule: user.matricule,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res) => {
    const users = await User.find({ adminId: req.user.adminId }).select('-password');
    res.json(users);
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    const user = await User.findOne({ _id: req.params.id, adminId: req.user.adminId });

    if (user) {
        await user.deleteOne();
        res.json({ message: 'User removed' });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

const importUsersFromCSV = require('../utils/csvImport');

// @desc    Import users from CSV
// @route   POST /api/admin/users/import
// @access  Private/Admin
const importUsers = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Please upload a CSV file' });
    }

    try {
        const result = await importUsersFromCSV(req.file.path, req.user.adminId);
        res.json({
            message: `Import complete: ${result.created} created, ${result.skipped} skipped.`,
            created: result.created,
            skipped: result.skipped
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get students by class ID
// @route   GET /api/admin/classes/:classId/students
// @access  Private/Admin
const getStudentsByClass = async (req, res) => {
    try {
        const students = await User.find({
            classId: req.params.classId,
            role: 'STUDENT',
            adminId: req.user.adminId
        }).select('-password');

        res.json(students);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Assign students to a class
// @route   POST /api/admin/classes/:classId/students
// @access  Private/Admin
const assignStudentsToClass = async (req, res) => {
    try {
        const { studentIds } = req.body;
        const { classId } = req.params;

        if (!studentIds || !Array.isArray(studentIds)) {
            return res.status(400).json({ message: 'studentIds array is required' });
        }

        // Update all students with the new classId
        const result = await User.updateMany(
            { _id: { $in: studentIds }, role: 'STUDENT', adminId: req.user.adminId },
            { $set: { classId: classId } }
        );

        res.json({
            message: `Successfully assigned ${result.modifiedCount} students to class`,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Remove student from class
// @route   DELETE /api/admin/classes/:classId/students/:studentId
// @access  Private/Admin
const removeStudentFromClass = async (req, res) => {
    try {
        const student = await User.findOne({ _id: req.params.studentId, adminId: req.user.adminId });

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        if (student.role !== 'STUDENT') {
            return res.status(400).json({ message: 'User is not a student' });
        }

        student.classId = undefined;
        await student.save();

        res.json({ message: 'Student removed from class' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update student's class
// @route   PUT /api/admin/users/:userId/class
// @access  Private/Admin
const updateStudentClass = async (req, res) => {
    try {
        const { classId } = req.body;
        const student = await User.findOne({ _id: req.params.userId, adminId: req.user.adminId });

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        if (student.role !== 'STUDENT') {
            return res.status(400).json({ message: 'User is not a student' });
        }

        student.classId = classId || undefined;
        await student.save();

        res.json({
            message: 'Student class updated successfully',
            student: {
                _id: student._id,
                fullName: student.fullName,
                matricule: student.matricule,
                classId: student.classId
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getStats = async (req, res) => {
    try {
        const [studentCount, teacherCount, classCount, moduleCount] = await Promise.all([
            User.countDocuments({ role: 'STUDENT', adminId: req.user.adminId }),
            User.countDocuments({ role: 'TEACHER', adminId: req.user.adminId }),
            Class.countDocuments({ adminId: req.user.adminId }),
            Module.countDocuments({ adminId: req.user.adminId }),
        ]);

        res.json({
            students: studentCount,
            teachers: teacherCount,
            classes: classCount,
            modules: moduleCount,
            totalUsers: studentCount + teacherCount + 1, // +1 for the admin itself
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createUser,
    getUsers,
    deleteUser,
    importUsers,
    getStudentsByClass,
    assignStudentsToClass,
    removeStudentFromClass,
    updateStudentClass,
    getStats,
};
