const { sequelize } = require('../config/db');
const User = require('./userModel');
const AcademicLevel = require('./academicLevelModel');
const Class = require('./classModel');
const Module = require('./moduleModel');
const ModuleAllocation = require('./moduleAllocationModel');
const ModuleContent = require('./moduleContentModel');
const Assignment = require('./assignmentModel');
const Submission = require('./submissionModel');

// Foreign key constraints are deliberately left off. The document store these
// models replace allowed dangling references, and code such as deleting a level
// without its allocations relies on that staying true.
const link = { constraints: false };

Class.belongsTo(AcademicLevel, { as: 'level', foreignKey: 'levelId', ...link });

ModuleAllocation.belongsTo(Module, { as: 'module', foreignKey: 'moduleId', ...link });
ModuleAllocation.belongsTo(AcademicLevel, { as: 'level', foreignKey: 'levelId', ...link });

// `teacherIds` was an array of refs, which becomes a join table here.
const TEACHER_JOIN_TABLE = 'module_allocation_teachers';

ModuleAllocation.belongsToMany(User, {
    as: 'teachers',
    through: TEACHER_JOIN_TABLE,
    foreignKey: 'allocationId',
    otherKey: 'teacherId',
    timestamps: false,
});

User.belongsToMany(ModuleAllocation, {
    as: 'allocations',
    through: TEACHER_JOIN_TABLE,
    foreignKey: 'teacherId',
    otherKey: 'allocationId',
    timestamps: false,
});

ModuleContent.belongsTo(ModuleAllocation, { as: 'allocation', foreignKey: 'allocationId', ...link });
Assignment.belongsTo(ModuleAllocation, { as: 'allocation', foreignKey: 'allocationId', ...link });

Submission.belongsTo(User, { as: 'student', foreignKey: 'studentId', ...link });
Submission.belongsTo(Assignment, { as: 'assignment', foreignKey: 'assignmentId', ...link });

// Teachers are always eager loaded so `teacherIds` is never missing from a
// serialised allocation.
const teacherInclude = (attributes = ['id', 'fullName', 'matricule']) => ({
    model: User,
    as: 'teachers',
    attributes,
    through: { attributes: [] },
});

// Works whether teacherIds holds plain ids or serialised teacher objects.
const isTeacherOf = (allocation, userId) => {
    const teachers = allocation.teachers || [];
    return teachers.some((teacher) => String(teacher.id || teacher._id || teacher) === String(userId));
};

module.exports = {
    sequelize,
    User,
    AcademicLevel,
    Class,
    Module,
    ModuleAllocation,
    ModuleContent,
    Assignment,
    Submission,
    teacherInclude,
    isTeacherOf,
};
