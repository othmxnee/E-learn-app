// Aggregate queries behind the admin analytics dashboard.
//
// Everything is computed in SQL rather than by loading rows into Node, because
// the demo dataset alone is 4,000 submissions and the charts need to stay
// responsive on Render's free instance.

const { sequelize, DB_SCHEMA } = require('../config/db');
const { QueryTypes } = require('sequelize');

const query = (sql, replacements) =>
    sequelize.query(sql, { replacements, type: QueryTypes.SELECT });

// Table names are interpolated from this constant, never from user input.
const t = (name) => `"${DB_SCHEMA}"."${name}"`;

// @desc    Headline counters for the dashboard tiles
// @route   GET /api/admin/analytics/overview
// @access  Private/Admin
const getOverview = async (req, res) => {
    try {
        const adminId = req.user.adminId;

        const [rows] = await query(
            `SELECT
                (SELECT COUNT(*) FROM ${t('users')} WHERE "adminId" = :adminId AND role = 'STUDENT')   AS students,
                (SELECT COUNT(*) FROM ${t('users')} WHERE "adminId" = :adminId AND role = 'TEACHER')   AS teachers,
                (SELECT COUNT(*) FROM ${t('classes')} WHERE "adminId" = :adminId)                      AS classes,
                (SELECT COUNT(*) FROM ${t('modules')} WHERE "adminId" = :adminId)                      AS modules,
                (SELECT COUNT(*) FROM ${t('assignments')} WHERE "adminId" = :adminId)                  AS assignments,
                (SELECT COUNT(*) FROM ${t('module_contents')} WHERE "adminId" = :adminId)              AS materials,
                (SELECT COUNT(*) FROM ${t('submissions')} WHERE "adminId" = :adminId)                  AS submissions,
                (SELECT COUNT(*) FROM ${t('submissions')} WHERE "adminId" = :adminId AND status = 'LATE') AS late,
                (SELECT COUNT(*) FROM ${t('submissions')} WHERE "adminId" = :adminId AND grade IS NOT NULL) AS graded,
                (SELECT ROUND(AVG(grade)::numeric, 2) FROM ${t('submissions')} WHERE "adminId" = :adminId AND grade IS NOT NULL) AS "averageGrade",
                (SELECT COUNT(*) FROM ${t('users')} WHERE "adminId" = :adminId AND role = 'STUDENT' AND "firstLogin" = TRUE) AS "inactiveStudents",
                (SELECT COUNT(*) FROM ${t('assignments')} WHERE "adminId" = :adminId AND deadline > NOW()) AS "upcomingAssignments"`,
            { adminId }
        );

        // Postgres returns COUNT as a string via node-postgres, which would
        // make the client concatenate rather than add. Everything is coerced
        // once here so the tiles can treat the payload as numbers.
        const counters = {};
        for (const [key, value] of Object.entries(rows)) {
            counters[key] = value === null ? null : Number(value);
        }

        const submissions = counters.submissions || 0;

        res.json({
            ...counters,
            // Percentages are derived here so every tile agrees on the maths.
            lateRate: submissions ? Math.round((counters.late / submissions) * 1000) / 10 : 0,
            gradedRate: submissions ? Math.round((counters.graded / submissions) * 1000) / 10 : 0,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Grade distribution, bucketed for a histogram
// @route   GET /api/admin/analytics/grade-distribution
// @access  Private/Admin
const getGradeDistribution = async (req, res) => {
    try {
        const adminId = req.user.adminId;

        // Buckets are two marks wide across the 0-20 scale. A grade of exactly
        // 20 would fall outside width_bucket's range, hence the LEAST clamp.
        const rows = await query(
            `SELECT
                (LEAST(WIDTH_BUCKET(grade, 0, 20, 10), 10) - 1) * 2 AS "from",
                LEAST(WIDTH_BUCKET(grade, 0, 20, 10), 10) * 2       AS "to",
                COUNT(*)                                            AS count
             FROM ${t('submissions')}
             WHERE "adminId" = :adminId AND grade IS NOT NULL
             GROUP BY 1, 2
             ORDER BY 1`,
            { adminId }
        );

        // Empty buckets are filled in so the histogram keeps a fixed shape.
        const buckets = Array.from({ length: 10 }, (_, index) => {
            const from = index * 2;
            const found = rows.find((row) => Number(row.from) === from);
            return {
                label: `${from}-${from + 2}`,
                from,
                to: from + 2,
                count: found ? Number(found.count) : 0,
            };
        });

        res.json(buckets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Submissions per week over the semester
// @route   GET /api/admin/analytics/submissions-timeline
// @access  Private/Admin
const getSubmissionsTimeline = async (req, res) => {
    try {
        const adminId = req.user.adminId;
        const weeks = Math.min(Math.max(Number(req.query.weeks) || 26, 4), 52);

        const rows = await query(
            `SELECT
                DATE_TRUNC('week', "submittedAt")            AS week,
                COUNT(*)                                     AS total,
                COUNT(*) FILTER (WHERE status = 'LATE')      AS late,
                ROUND(AVG(grade)::numeric, 2)                AS "averageGrade"
             FROM ${t('submissions')}
             WHERE "adminId" = :adminId
               AND "submittedAt" >= NOW() - (:weeks * INTERVAL '1 week')
             GROUP BY 1
             ORDER BY 1`,
            { adminId, weeks }
        );

        res.json(
            rows.map((row) => ({
                week: row.week,
                total: Number(row.total),
                late: Number(row.late),
                onTime: Number(row.total) - Number(row.late),
                averageGrade: row.averageGrade === null ? null : Number(row.averageGrade),
            }))
        );
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Per-module performance, sortable and paginated
// @route   GET /api/admin/analytics/modules
// @access  Private/Admin
const getModulePerformance = async (req, res) => {
    try {
        const adminId = req.user.adminId;

        const page = Math.max(Number(req.query.page) || 1, 1);
        const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 10, 1), 100);
        const search = (req.query.search || '').trim();
        const levelId = (req.query.levelId || '').trim();

        // Sorting is restricted to a known set so the ORDER BY can never carry
        // caller-supplied SQL.
        const SORTABLE = {
            module: 'm.name',
            level: 'l.name',
            assignments: 'assignments',
            submissions: 'submissions',
            averageGrade: '"averageGrade"',
            lateRate: '"lateRate"',
        };
        const sortColumn = SORTABLE[req.query.sortBy] || 'm.name';
        const direction = String(req.query.sortDir).toLowerCase() === 'desc' ? 'DESC' : 'ASC';

        const filters = ['al."adminId" = :adminId'];
        if (search) filters.push('m.name ILIKE :search');
        if (levelId) filters.push('al."levelId" = :levelId');
        const where = filters.join(' AND ');

        const replacements = {
            adminId,
            search: `%${search}%`,
            levelId,
            limit: pageSize,
            offset: (page - 1) * pageSize,
        };

        // Aggregates are computed per allocation in a subquery first; joining
        // assignments and submissions directly would multiply the counts.
        const base = `
            FROM ${t('module_allocations')} al
            JOIN ${t('modules')} m ON m.id = al."moduleId"
            LEFT JOIN ${t('academic_levels')} l ON l.id = al."levelId"
            LEFT JOIN LATERAL (
                SELECT
                    COUNT(DISTINCT a.id)                                  AS assignments,
                    COUNT(s.id)                                           AS submissions,
                    COUNT(s.id) FILTER (WHERE s.status = 'LATE')          AS late,
                    ROUND(AVG(s.grade)::numeric, 2)                       AS avg_grade
                FROM ${t('assignments')} a
                LEFT JOIN ${t('submissions')} s ON s."assignmentId" = a.id
                WHERE a."allocationId" = al.id
            ) stats ON TRUE
            WHERE ${where}`;

        const [{ count }] = await query(`SELECT COUNT(*)::int AS count ${base}`, replacements);

        const rows = await query(
            `SELECT
                al.id                       AS "allocationId",
                m.name                      AS module,
                l.name                      AS level,
                COALESCE(stats.assignments, 0)::int AS assignments,
                COALESCE(stats.submissions, 0)::int AS submissions,
                stats.avg_grade             AS "averageGrade",
                CASE WHEN COALESCE(stats.submissions, 0) = 0 THEN 0
                     ELSE ROUND((stats.late::numeric / stats.submissions) * 100, 1)
                END                         AS "lateRate"
             ${base}
             ORDER BY ${sortColumn} ${direction} NULLS LAST, m.name ASC
             LIMIT :limit OFFSET :offset`,
            replacements
        );

        res.json({
            rows: rows.map((row) => ({
                ...row,
                averageGrade: row.averageGrade === null ? null : Number(row.averageGrade),
                lateRate: Number(row.lateRate),
            })),
            page,
            pageSize,
            total: count,
            totalPages: Math.max(1, Math.ceil(count / pageSize)),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Headcount and average grade per class
// @route   GET /api/admin/analytics/classes
// @access  Private/Admin
const getClassBreakdown = async (req, res) => {
    try {
        const adminId = req.user.adminId;

        const rows = await query(
            `SELECT
                c.id,
                c.name,
                c.speciality,
                l.name                                   AS level,
                COUNT(DISTINCT u.id)::int                AS students,
                COUNT(DISTINCT u.id) FILTER (WHERE u."firstLogin" = TRUE)::int AS inactive,
                ROUND(AVG(s.grade)::numeric, 2)          AS "averageGrade"
             FROM ${t('classes')} c
             LEFT JOIN ${t('academic_levels')} l ON l.id = c."levelId"
             LEFT JOIN ${t('users')} u ON u."classId" = c.id AND u.role = 'STUDENT'
             LEFT JOIN ${t('submissions')} s ON s."studentId" = u.id AND s.grade IS NOT NULL
             WHERE c."adminId" = :adminId
             GROUP BY c.id, c.name, c.speciality, l.name
             ORDER BY l.name NULLS LAST, c.name`,
            { adminId }
        );

        res.json(
            rows.map((row) => ({
                ...row,
                averageGrade: row.averageGrade === null ? null : Number(row.averageGrade),
            }))
        );
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getOverview,
    getGradeDistribution,
    getSubmissionsTimeline,
    getModulePerformance,
    getClassBreakdown,
};
