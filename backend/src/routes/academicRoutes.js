const express = require('express');
const router = express.Router();
const {
    createAcademicLevel,
    getAcademicLevels,
    createClass,
    getClasses,
    updateAcademicLevel,
    deleteAcademicLevel,
    assignStudentsToClass,
} = require('../controllers/academicController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);
router.use(authorize('ADMIN'));

router.route('/levels')
    .post(createAcademicLevel)
    .get(getAcademicLevels);

router.route('/levels/:id')
    .put(updateAcademicLevel)
    .delete(deleteAcademicLevel);

router.route('/classes')
    .post(createClass)
    .get(getClasses);

router.route('/classes/:id/students')
    .post(assignStudentsToClass);

module.exports = router;
