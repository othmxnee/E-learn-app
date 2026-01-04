const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middlewares/authMiddleware');
const { uploadFile } = require('../controllers/uploadController');

// Configure Multer Storage
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename(req, file, cb) {
        cb(
            null,
            `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
        );
    },
});

// Check File Type
function checkFileType(file, cb) {
    const filetypes = /jpg|jpeg|png|pdf|doc|docx|ppt|pptx|zip|rar/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // const mimetype = filetypes.test(file.mimetype); // Mimetype check can be tricky with some files

    if (extname) {
        return cb(null, true);
    } else {
        cb('Error: Invalid file type!');
    }
}

const upload = multer({
    storage,
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    },
});

router.post('/', protect, upload.single('file'), uploadFile);

module.exports = router;
