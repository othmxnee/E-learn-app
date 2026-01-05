const express = require('express');
const router = express.Router();
const {
    loginUser,
    changePassword,
    getMe,
    registerAdmin,
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/login', loginUser);
router.post('/register-admin', registerAdmin);
router.post('/change-password', protect, changePassword);
router.get('/me', protect, getMe);

module.exports = router;
