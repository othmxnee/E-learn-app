const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const {
    createUser,
    getUsers,
    deleteUser,
    importUsers,
    getStudentsByClass,
    assignStudentsToClass,
    removeStudentFromClass,
    updateStudentClass,
    getStats,
} = require('../controllers/adminController');
const { startSeed, startReset, getStatus } = require('../controllers/demoController');
const {
    getOverview,
    getGradeDistribution,
    getSubmissionsTimeline,
    getModulePerformance,
    getClassBreakdown,
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);
router.use(authorize('ADMIN'));

router.get('/stats', getStats);

// Analytics behind the admin dashboard
router.get('/analytics/overview', getOverview);
router.get('/analytics/grade-distribution', getGradeDistribution);
router.get('/analytics/submissions-timeline', getSubmissionsTimeline);
router.get('/analytics/modules', getModulePerformance);
router.get('/analytics/classes', getClassBreakdown);

// Demo dataset. Seeding runs as a background job, so the client starts it and
// then polls /demo/status for progress.
router.post('/demo/seed', startSeed);
router.post('/demo/reset', startReset);
router.get('/demo/status', getStatus);
router.route('/users').post(createUser).get(getUsers);
router.route('/users/import').post(upload.single('file'), importUsers);
router.route('/users/:id').delete(deleteUser);
router.route('/users/:userId/class').put(updateStudentClass);

// Class-Student management routes
router.route('/classes/:classId/students')
    .get(getStudentsByClass)
    .post(assignStudentsToClass);
router.route('/classes/:classId/students/:studentId')
    .delete(removeStudentFromClass);

module.exports = router;
