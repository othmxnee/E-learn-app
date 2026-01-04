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
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);
router.use(authorize('ADMIN'));

router.get('/stats', getStats);
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
