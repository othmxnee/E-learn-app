// Removes the demo dataset.
//
// Only rows carrying `seeded: true` are deleted, so anything a real user
// created survives a reset. Deletion runs children first because the models
// deliberately declare no foreign keys — nothing would cascade on its own.

const {
    sequelize,
    User,
    AcademicLevel,
    Class,
    Module,
    ModuleAllocation,
    ModuleContent,
    Assignment,
    Submission,
} = require('../models');

const resetDemoData = async ({ adminId, onProgress = () => {} } = {}) => {
    if (!adminId) throw new Error('resetDemoData requires an adminId');

    const where = { adminId, seeded: true };
    const removed = {};

    // The teacher join table has no seeded flag of its own, so its rows are
    // dropped by matching the allocations that are about to be deleted.
    const seededAllocations = await ModuleAllocation.findAll({
        where,
        attributes: ['id'],
        raw: true,
    });

    if (seededAllocations.length) {
        const joinTable = ModuleAllocation.associations.teachers.through.model;
        await joinTable.destroy({
            where: { allocationId: seededAllocations.map((row) => row.id) },
        });
    }

    const order = [
        ['submissions', Submission],
        ['assignments', Assignment],
        ['materials', ModuleContent],
        ['allocations', ModuleAllocation],
        ['modules', Module],
        ['users', User],
        ['classes', Class],
        ['levels', AcademicLevel],
    ];

    for (const [label, model] of order) {
        onProgress({ step: 'reset', message: `Removing ${label}` });
        removed[label] = await model.destroy({ where });
    }

    return removed;
};

// A demo is considered present if any seeded row exists for this admin. The
// seeder uses this to stay idempotent: re-running resets first rather than
// stacking a second copy of the dataset on top of the first.
const countDemoData = async (adminId) => {
    const where = { adminId, seeded: true };
    const [students, teachers, modules, assignments, submissions] = await Promise.all([
        User.count({ where: { ...where, role: 'STUDENT' } }),
        User.count({ where: { ...where, role: 'TEACHER' } }),
        Module.count({ where }),
        Assignment.count({ where }),
        Submission.count({ where }),
    ]);

    return {
        students,
        teachers,
        modules,
        assignments,
        submissions,
        present: students + teachers + modules + assignments + submissions > 0,
    };
};

module.exports = { resetDemoData, countDemoData };
