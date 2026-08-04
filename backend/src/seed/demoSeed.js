// Builds the demo dataset.
//
// Everything written here carries `seeded: true`, so seed:reset can remove the
// whole dataset without touching real records. The generator is deterministic:
// the same DEMO_SEED always produces the same people, grades and timestamps.
//
// Rows are built entirely in memory and then written with bulkCreate in
// batches, because inserting ~5,000 rows one at a time over a remote
// connection is what would push this past the two-minute budget.

const bcrypt = require('bcryptjs');
const path = require('path');
const { fakerFR, fakerEN, fakerAR } = require('@faker-js/faker');

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

const { DEPARTMENTS, ASSIGNMENT_KINDS, topicsFor } = require('./catalog');
const { NOTES } = require('./notes');
const { topicFileName } = require('./topicNotes');
const { createRng, makeHelpers, DEFAULT_SEED } = require('./random');

const BATCH_SIZE = 500;

// Target counts from the specification.
const TARGET = {
    departmentHeads: 3,
    teachers: 40,
    students: 600,
    classes: 24,
    assignments: 300,
    submissions: 4000,
    materials: 180,
    inactiveStudentRatio: 0.1,
    emptyAssignmentRatio: 0.05,
};

// The demo runs on a semester that straddles today, so some deadlines are past
// and some are still upcoming.
const buildCalendar = (now) => {
    const start = new Date(now);
    start.setMonth(start.getMonth() - 4);
    start.setHours(8, 0, 0, 0);

    const end = new Date(now);
    end.setMonth(end.getMonth() + 2);
    end.setHours(18, 0, 0, 0);

    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const totalWeeks = Math.max(1, Math.round((end - start) / weekMs));

    return { start, end, totalWeeks, weekMs };
};

// Password hashing dominates the runtime for 640+ users, so every seeded
// account shares one hash computed once. bulkCreate also skips the beforeSave
// hook, which is why this is done explicitly.
const buildSharedHash = async (plain) => bcrypt.hash(plain, 10);

const insertInBatches = async (model, rows, onProgress) => {
    for (let index = 0; index < rows.length; index += BATCH_SIZE) {
        const batch = rows.slice(index, index + BATCH_SIZE);
        await model.bulkCreate(batch, { validate: false });
        if (onProgress) onProgress(Math.min(index + BATCH_SIZE, rows.length), rows.length);
    }
};

// Matricules are allocated from a per-year counter so they look like real
// registration numbers rather than random digits.
const createMatriculeIssuer = () => {
    const counters = new Map();
    return (year) => {
        const next = (counters.get(year) || 0) + 1;
        counters.set(year, next);
        return `${year}${String(next).padStart(4, '0')}`;
    };
};

// Names mix French, English and Arabic sources, which is what a North African
// university roll actually looks like.
const buildNamePool = (helpers, size) => {
    const locales = [
        { faker: fakerFR, weight: 0.45 },
        { faker: fakerAR, weight: 0.35 },
        { faker: fakerEN, weight: 0.2 },
    ];

    const names = new Set();
    let guard = 0;

    while (names.size < size && guard < size * 40) {
        guard += 1;
        const { faker } = helpers.pickWeighted(locales);
        const first = faker.person.firstName();
        const last = faker.person.lastName();
        names.add(`${first} ${last}`.replace(/\s+/g, ' ').trim());
    }

    // Faker can run out of distinct combinations before the pool is full; the
    // suffix keeps names unique without making them look generated.
    let filler = 1;
    while (names.size < size) {
        names.add(`${fakerFR.person.firstName()} ${fakerFR.person.lastName()} ${filler++}`);
    }

    return helpers.shuffle([...names]).slice(0, size);
};

const seedDemoData = async ({
    adminId,
    seed = DEFAULT_SEED,
    now: requestedNow,
    onProgress = () => {},
} = {}) => {
    if (!adminId) throw new Error('seedDemoData requires an adminId');

    // The reference point is snapped to midnight. Deciding which deadlines have
    // passed against a moving clock would make two runs on the same day produce
    // different grades, which breaks the determinism the seed promises, while
    // still letting the demo follow the real calendar day to day.
    const now = new Date(requestedNow || Date.now());
    now.setHours(0, 0, 0, 0);

    const helpers = makeHelpers(createRng(seed));
    const calendar = buildCalendar(now);
    const nextMatricule = createMatriculeIssuer();

    // Faker carries its own RNG, so it is seeded too or names would drift
    // between runs even though everything else is stable.
    fakerFR.seed(seed);
    fakerEN.seed(seed + 1);
    fakerAR.seed(seed + 2);

    const report = (step, message) => onProgress({ step, message });

    // ---------------------------------------------------------------- levels
    report('levels', 'Creating academic levels');

    // Departments share level names (two teach CP1), so each department gets
    // its own level row and the alias keeps the names distinct in the UI.
    const levelRows = [];
    const departmentLevels = new Map();

    for (const department of DEPARTMENTS) {
        const levels = department.levels.map((level) => {
            const row = {
                name: level.alias || level.name,
                type: level.type,
                hasSpeciality: level.hasSpeciality,
                adminId,
                seeded: true,
            };
            levelRows.push(row);
            return { ...level, row };
        });
        departmentLevels.set(department.code, levels);
    }

    const createdLevels = await AcademicLevel.bulkCreate(levelRows, { returning: true });
    createdLevels.forEach((created, index) => {
        levelRows[index].id = created.id;
    });

    // ---------------------------------------------------------------- classes
    report('classes', 'Creating classes');

    // 24 cohorts spread over 12 levels, each carrying its department's
    // speciality where the level supports one.
    const classRows = [];
    const allLevels = [];
    for (const department of DEPARTMENTS) {
        for (const level of departmentLevels.get(department.code)) {
            allLevels.push({ department, level });
        }
    }

    let classIndex = 0;
    while (classRows.length < TARGET.classes) {
        const { department, level } = allLevels[classIndex % allLevels.length];
        const perLevel = Math.floor(classIndex / allLevels.length) + 1;
        const speciality = level.hasSpeciality ? department.speciality : null;
        const name = speciality
            ? `${level.row.name}-${speciality}-${perLevel}`
            : `${level.row.name}-${perLevel}`;

        classRows.push({
            levelId: level.row.id,
            speciality,
            classNumber: perLevel,
            name,
            adminId,
            seeded: true,
            _levelRef: level,
            _department: department,
        });
        classIndex += 1;
    }

    const createdClasses = await Class.bulkCreate(
        classRows.map(({ _levelRef, _department, ...row }) => row),
        { returning: true }
    );
    createdClasses.forEach((created, index) => {
        classRows[index].id = created.id;
    });

    // ------------------------------------------------------------------ users
    report('users', 'Creating teachers and students');

    const sharedPassword = await buildSharedHash('demo1234');
    const currentYear = now.getFullYear();

    const namePool = buildNamePool(helpers, TARGET.teachers + TARGET.students + TARGET.departmentHeads + 8);
    let nameCursor = 0;
    const takeName = () => namePool[nameCursor++];

    const userRows = [];

    // Department heads are admins for display, but they stay inside the demo
    // tenant: giving them their own adminId would partition the dataset and
    // each would see only a slice of it.
    const headRows = [];
    for (let i = 0; i < TARGET.departmentHeads; i += 1) {
        const department = DEPARTMENTS[i % DEPARTMENTS.length];
        const row = {
            fullName: takeName(),
            username: `head.${department.code.toLowerCase()}`,
            matricule: nextMatricule(currentYear - 10),
            password: sharedPassword,
            role: 'ADMIN',
            firstLogin: false,
            preferredLanguage: helpers.pick(['fr', 'en', 'ar']),
            adminId,
            seeded: true,
        };
        headRows.push(row);
        userRows.push(row);
    }

    const teacherRows = [];
    for (let i = 0; i < TARGET.teachers; i += 1) {
        const matricule = nextMatricule(currentYear - 8);
        const row = {
            fullName: takeName(),
            username: matricule,
            matricule,
            password: sharedPassword,
            role: 'TEACHER',
            firstLogin: false,
            preferredLanguage: helpers.pick(['fr', 'fr', 'en', 'ar']),
            adminId,
            seeded: true,
        };
        teacherRows.push(row);
        userRows.push(row);
    }

    // Students are distributed 20-30 per class rather than evenly, so class
    // sizes vary the way real cohorts do.
    const studentRows = [];
    const classSizes = classRows.map(() => helpers.int(20, 30));
    let sizeTotal = classSizes.reduce((sum, size) => sum + size, 0);

    // Nudge the sizes until they add up to exactly the target headcount.
    while (sizeTotal !== TARGET.students) {
        const index = helpers.int(0, classSizes.length - 1);
        if (sizeTotal < TARGET.students && classSizes[index] < 30) {
            classSizes[index] += 1;
            sizeTotal += 1;
        } else if (sizeTotal > TARGET.students && classSizes[index] > 20) {
            classSizes[index] -= 1;
            sizeTotal -= 1;
        }
    }

    classRows.forEach((classRow, index) => {
        // Enrolment year is derived from the level so matricules stay coherent
        // with how far through the programme a cohort is.
        const levelName = classRow._levelRef.name;
        const yearOffset = /M2|CS3|L3/.test(levelName) ? 4 : /M1|CS2|L2/.test(levelName) ? 3 : /CS1|L1/.test(levelName) ? 2 : 1;
        const enrolmentYear = currentYear - yearOffset + 1;

        for (let i = 0; i < classSizes[index]; i += 1) {
            const matricule = nextMatricule(enrolmentYear);
            const row = {
                fullName: takeName(),
                username: matricule,
                matricule,
                password: sharedPassword,
                role: 'STUDENT',
                // 10% never changed their initial password, which is what an
                // inactive account looks like in this schema.
                firstLogin: helpers.chance(TARGET.inactiveStudentRatio),
                classId: classRow.id,
                preferredLanguage: helpers.pick(['fr', 'fr', 'en', 'ar']),
                adminId,
                seeded: true,
                _class: classRow,
            };
            studentRows.push(row);
            userRows.push(row);
        }
    });

    await insertInBatches(
        User,
        userRows.map(({ _class, ...row }) => row),
        (done, total) => report('users', `Creating users (${done}/${total})`)
    );

    // bulkCreate with returning is avoided for the large tables; ids are read
    // back once instead.
    const persistedUsers = await User.findAll({
        where: { adminId, seeded: true },
        attributes: ['id', 'matricule', 'username', 'role'],
        raw: true,
    });

    const byMatricule = new Map(persistedUsers.map((user) => [user.matricule, user.id]));
    teacherRows.forEach((row) => { row.id = byMatricule.get(row.matricule); });
    studentRows.forEach((row) => { row.id = byMatricule.get(row.matricule); });
    headRows.forEach((row) => { row.id = byMatricule.get(row.matricule); });

    // ---------------------------------------------------------------- modules
    report('modules', 'Creating modules and allocations');

    const moduleRows = [];
    for (const department of DEPARTMENTS) {
        for (const [name, description] of department.modules) {
            moduleRows.push({
                name,
                description,
                adminId,
                seeded: true,
                _department: department,
            });
        }
    }

    const createdModules = await Module.bulkCreate(
        moduleRows.map(({ _department, ...row }) => row),
        { returning: true }
    );
    createdModules.forEach((created, index) => {
        moduleRows[index].id = created.id;
    });

    // Each department's modules are spread across its own levels, five per
    // level, which reproduces the "5 modules per program" shape.
    const allocationRows = [];
    for (const department of DEPARTMENTS) {
        const levels = departmentLevels.get(department.code);
        const departmentModules = moduleRows.filter((row) => row._department === department);

        departmentModules.forEach((moduleRow, index) => {
            const level = levels[Math.floor(index / 5) % levels.length];
            allocationRows.push({
                moduleId: moduleRow.id,
                levelId: level.row.id,
                adminId,
                seeded: true,
                _module: moduleRow,
                _level: level,
                _department: department,
            });
        });
    }

    const createdAllocations = await ModuleAllocation.bulkCreate(
        allocationRows.map(({ _module, _level, _department, ...row }) => row),
        { returning: true }
    );
    createdAllocations.forEach((created, index) => {
        allocationRows[index].id = created.id;
    });

    // Teachers are assigned round-robin within their department so every
    // teacher has a plausible load and no module is left unstaffed.
    report('teachers', 'Assigning teachers to modules');

    const teachersByDepartment = new Map();
    DEPARTMENTS.forEach((department, index) => {
        const slice = teacherRows.filter((_, teacherIndex) => teacherIndex % DEPARTMENTS.length === index);
        teachersByDepartment.set(department.code, slice);
    });

    const allocationTeachers = [];
    allocationRows.forEach((allocation, index) => {
        const pool = teachersByDepartment.get(allocation._department.code);
        const primary = pool[index % pool.length];
        allocation._teachers = [primary];

        // A third of modules are co-taught.
        if (helpers.chance(0.33) && pool.length > 1) {
            const secondary = pool[(index + 1 + helpers.int(0, pool.length - 2)) % pool.length];
            if (secondary.id !== primary.id) allocation._teachers.push(secondary);
        }

        for (const teacher of allocation._teachers) {
            allocationTeachers.push({ allocationId: allocation.id, teacherId: teacher.id });
        }
    });

    // The join table has no model, so it is written directly.
    const joinTable = ModuleAllocation.associations.teachers.through.model;
    await insertInBatches(joinTable, allocationTeachers);

    // -------------------------------------------------------------- materials
    report('materials', 'Creating course materials');

    // Each weekly material gets the note written for its own topic, so a
    // material titled "Week 4 - Divide and Conquer" contains divide-and-conquer
    // content. Sharing one file per module made every week look identical to
    // the assistant, which could then only answer about a single topic.
    const notesByTopic = new Map(NOTES.map((note) => [note.topic, note]));

    // Submissions are student work, not course notes; any real PDF will do.
    const noteFor = (moduleName, index) =>
        notesByTopic.get(moduleName) || NOTES[index % NOTES.length];

    const contentRows = [];
    let materialIndex = 0;

    while (contentRows.length < TARGET.materials) {
        const allocation = allocationRows[materialIndex % allocationRows.length];
        const round = Math.floor(materialIndex / allocationRows.length);
        const topics = topicsFor(allocation._module.name);
        const topic = topics[round % topics.length];
        const week = round * 3 + (materialIndex % 3) + 1;
        const note = noteFor(allocation._module.name, materialIndex);
        const teacher = allocation._teachers[materialIndex % allocation._teachers.length];

        const createdAt = helpers.workingMoment(
            new Date(calendar.start.getTime() + (week - 1) * calendar.weekMs)
        );

        contentRows.push({
            allocationId: allocation.id,
            // Weighted so a module page is mostly lecture material with regular
            // tutorials and labs, rather than an even split across the types.
            type: helpers.pickWeighted([
                { label: 'COURSE', weight: 5 },
                { label: 'TD', weight: 3 },
                { label: 'TP', weight: 2 },
                { label: 'OTHER', weight: 1 },
            ]).label,
            title: `Week ${week} - ${topic}`,
            fileUrl: `/seed-data/${topicFileName(allocation._module.name, topic)}`,
            description: `${topic} for ${allocation._module.name}.`,
            createdBy: teacher.id,
            adminId,
            seeded: true,
            createdAt,
            updatedAt: createdAt,
        });

        materialIndex += 1;
    }

    await insertInBatches(ModuleContent, contentRows, (done, total) =>
        report('materials', `Creating materials (${done}/${total})`)
    );

    // ------------------------------------------------------------ assignments
    report('assignments', 'Creating assignments');

    const assignmentRows = [];
    for (let i = 0; i < TARGET.assignments; i += 1) {
        const allocation = allocationRows[i % allocationRows.length];
        const kind = helpers.pickWeighted(ASSIGNMENT_KINDS);
        const topics = topicsFor(allocation._module.name);
        const topic = topics[Math.floor(i / allocationRows.length) % topics.length];

        // Deadlines span the whole semester, so the demo shows both overdue and
        // upcoming work.
        const deadline = helpers.workingMoment(helpers.dateBetween(calendar.start, calendar.end));
        deadline.setHours(23, 59, 0, 0);

        // Assignments are published a couple of weeks before they are due.
        const createdAt = new Date(deadline.getTime() - helpers.int(10, 21) * 24 * 60 * 60 * 1000);

        assignmentRows.push({
            allocationId: allocation.id,
            title: `${kind.label} ${Math.floor(i / allocationRows.length) + 1} - ${topic}`,
            description: `${kind.label} covering ${topic.toLowerCase()} in ${allocation._module.name}.`,
            deadline,
            createdBy: allocation._teachers[0].id,
            adminId,
            seeded: true,
            createdAt: createdAt < calendar.start ? calendar.start : createdAt,
            updatedAt: createdAt < calendar.start ? calendar.start : createdAt,
            _allocation: allocation,
        });
    }

    await insertInBatches(
        Assignment,
        assignmentRows.map(({ _allocation, ...row }) => row),
        (done, total) => report('assignments', `Creating assignments (${done}/${total})`)
    );

    const persistedAssignments = await Assignment.findAll({
        where: { adminId, seeded: true },
        attributes: ['id', 'allocationId', 'title', 'deadline'],
        raw: true,
    });

    // Titles repeat across allocations, so assignments are matched on the pair
    // that is actually unique.
    const assignmentKey = (row) => `${row.allocationId}::${row.title}`;
    const assignmentIds = new Map(persistedAssignments.map((row) => [assignmentKey(row), row.id]));
    assignmentRows.forEach((row) => { row.id = assignmentIds.get(assignmentKey(row)); });

    // ------------------------------------------------------------ submissions
    report('submissions', 'Creating submissions');

    // Students only submit to assignments belonging to a module allocated to
    // their own level, which is the rule the app enforces when reading.
    const studentsByLevel = new Map();
    for (const student of studentRows) {
        const levelId = student._class._levelRef.row.id;
        if (!studentsByLevel.has(levelId)) studentsByLevel.set(levelId, []);
        studentsByLevel.get(levelId).push(student);
    }

    const gradedCutoff = now;
    const submissionRows = [];

    // 5% of assignments deliberately receive nothing, so the demo contains the
    // empty states a real system has.
    const eligible = assignmentRows.filter(() => !helpers.chance(TARGET.emptyAssignmentRatio));

    // Work that is not due yet has barely been handed in, so only assignments
    // whose deadline has passed carry a full set of submissions. Sizing the
    // per-assignment quota against that smaller group is what gets the total
    // near the target instead of well short of it.
    const dueAssignments = eligible.filter((assignment) => assignment.deadline <= now);
    const perAssignment = Math.max(
        1,
        Math.round(TARGET.submissions / Math.max(1, dueAssignments.length))
    );

    for (const assignment of eligible) {
        if (submissionRows.length >= TARGET.submissions) break;

        const cohort = studentsByLevel.get(assignment._allocation._level.row.id) || [];
        if (!cohort.length) continue;

        const isDue = assignment.deadline <= now;

        // Not everyone submits: a share of each cohort is simply missing, which
        // is what makes the completion figures believable.
        const participation = isDue ? helpers.float(0.72, 0.97) : helpers.float(0.35, 0.7);

        // The pool is drawn wider than the quota because the filters below
        // discard a good share of it. Assignments that are still open collect
        // only a handful of early submissions.
        const quota = isDue
            ? Math.min(cohort.length, perAssignment + helpers.int(2, 8))
            : Math.min(cohort.length, helpers.int(3, 9));
        const candidates = helpers.shuffle(cohort).slice(0, quota);

        for (const student of candidates) {
            if (submissionRows.length >= TARGET.submissions) break;
            // Inactive students rarely submit anything.
            if (student.firstLogin && !helpers.chance(0.15)) continue;
            if (!helpers.chance(participation)) continue;

            const isLate = helpers.chance(0.18);
            const deadline = new Date(assignment.deadline);

            // Late work lands after the deadline; on-time work lands in the
            // days before it, clustered close to the deadline.
            let submittedAt = isLate
                ? helpers.workingMoment(new Date(deadline.getTime() + helpers.int(1, 96) * 60 * 60 * 1000))
                : helpers.workingMoment(new Date(deadline.getTime() - helpers.int(1, 240) * 60 * 60 * 1000));

            // Nothing can have been handed in later than right now. Early work
            // on an assignment that is still open is pulled back into the past
            // rather than dropped, so upcoming deadlines still show activity.
            if (submittedAt > now) {
                if (isLate) continue;
                submittedAt = helpers.workingMoment(
                    new Date(now.getTime() - helpers.int(1, 14) * 24 * 60 * 60 * 1000)
                );
                if (submittedAt > now) continue;
            }

            // Only past work is graded, and not all of it — teachers are behind.
            const isGraded = deadline < gradedCutoff && helpers.chance(0.82);

            // Grades are normal around 13/20; late work is penalised slightly.
            const grade = isGraded
                ? helpers.normalClamped(isLate ? 11.4 : 13.1, 3.1, 0, 20, 2)
                : null;

            submissionRows.push({
                assignmentId: assignment.id,
                studentId: student.id,
                fileUrl: `/seed-data/${noteFor(assignment._allocation._module.name, submissionRows.length).file}`,
                status: isLate ? 'LATE' : 'SUBMITTED',
                submittedAt,
                grade,
                feedback: isGraded ? gradeComment(grade, helpers) : null,
                gradedAt: isGraded
                    ? helpers.workingMoment(new Date(submittedAt.getTime() + helpers.int(2, 21) * 24 * 60 * 60 * 1000))
                    : null,
                gradedBy: isGraded ? assignment._allocation._teachers[0].id : null,
                adminId,
                seeded: true,
                createdAt: submittedAt,
                updatedAt: submittedAt,
            });
        }
    }

    await insertInBatches(Submission, submissionRows, (done, total) =>
        report('submissions', `Creating submissions (${done}/${total})`)
    );

    return {
        levels: levelRows.length,
        classes: classRows.length,
        departmentHeads: headRows.length,
        teachers: teacherRows.length,
        students: studentRows.length,
        modules: moduleRows.length,
        allocations: allocationRows.length,
        materials: contentRows.length,
        assignments: assignmentRows.length,
        submissions: submissionRows.length,
    };
};

// Short feedback lines matched to the mark, so the grading view is not a wall
// of identical text.
function gradeComment(grade, helpers) {
    if (grade >= 16) {
        return helpers.pick([
            'Excellent work, clearly argued throughout.',
            'Very strong submission. Well structured and complete.',
            'Outstanding grasp of the material.',
        ]);
    }
    if (grade >= 13) {
        return helpers.pick([
            'Good work overall, with a few minor gaps.',
            'Solid submission. Watch the justification in the later sections.',
            'Well done. Some steps could be explained more fully.',
        ]);
    }
    if (grade >= 10) {
        return helpers.pick([
            'Acceptable, but several points need more detail.',
            'Passing work. Revise the core definitions.',
            'Adequate. The method is right, the execution is uneven.',
        ]);
    }
    return helpers.pick([
        'Below the expected standard. Please see me during office hours.',
        'Incomplete. Key parts of the question are unanswered.',
        'Significant misunderstandings. Review the lecture notes and resubmit.',
    ]);
}

module.exports = { seedDemoData, TARGET, BATCH_SIZE };
