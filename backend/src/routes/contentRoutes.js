const express = require('express');
const router = express.Router();
const {
    addContent,
    getContent,
    createAssignment,
    getAssignments,
    submitAssignment,
    getSubmissions,
    bulkAddContent,
    bulkCreateAssignment,
} = require('../controllers/contentController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);

// Bulk Routes
router.post('/modules/bulk/content', authorize('TEACHER'), bulkAddContent);
router.post('/modules/bulk/assignments', authorize('TEACHER'), bulkCreateAssignment);

// Content Routes
router.route('/modules/:allocationId/content')
    .post(authorize('TEACHER'), addContent)
    .get(getContent);

// Assignment Routes
router.route('/modules/:allocationId/assignments')
    .post(authorize('TEACHER'), createAssignment)
    .get(getAssignments);

// Submission Routes
router.route('/assignments/:assignmentId/submit')
    .post(authorize('STUDENT'), submitAssignment);

router.route('/assignments/:assignmentId/submissions')
    .get(authorize('TEACHER'), getSubmissions);

module.exports = router;
