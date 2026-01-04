const express = require('express');
const router = express.Router();
const {
    createModule,
    allocateModule,
    allocateModuleBulk,
    getMyModules,
    getModuleDetails,
} = require('../controllers/moduleController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);

// Admin Routes
router.post('/', authorize('ADMIN'), createModule);
router.post('/allocate', authorize('ADMIN'), allocateModule);
router.post('/allocate-bulk', authorize('ADMIN'), allocateModuleBulk);

// Shared Routes (Teacher/Student/Admin)
router.get('/', getMyModules);
router.get('/:id', getModuleDetails);

module.exports = router;
