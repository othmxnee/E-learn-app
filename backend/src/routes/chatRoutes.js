const express = require('express');
const router = express.Router();
const { chat, getChatStatus } = require('../controllers/chatController');
const { protect } = require('../middlewares/authMiddleware');

// Every role that can read course material can ask about it; the controller
// checks that the caller is entitled to the specific module.
router.use(protect);

router.post('/', chat);
router.get('/status', getChatStatus);

module.exports = router;
