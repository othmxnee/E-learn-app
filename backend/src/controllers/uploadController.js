const path = require('path');

// @desc    Upload a file
// @route   POST /api/upload
// @access  Private
const uploadFile = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    // Return the path relative to the server
    // Assuming we serve 'uploads' folder statically
    const filePath = `/${req.file.path}`;
    res.json({ filePath });
};

module.exports = {
    uploadFile,
};
