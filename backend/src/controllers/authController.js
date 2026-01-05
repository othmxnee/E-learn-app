const User = require('../models/userModel');
const generateToken = require('../utils/generateToken');

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { username, password } = req.body;

    // Find all users with this username (could be multiple across different admins)
    const users = await User.find({ username });

    let authenticatedUser = null;

    for (const user of users) {
        if (await user.matchPassword(password)) {
            authenticatedUser = user;
            break;
        }
    }

    if (authenticatedUser) {
        res.json({
            _id: authenticatedUser._id,
            username: authenticatedUser.username,
            fullName: authenticatedUser.fullName,
            role: authenticatedUser.role,
            firstLogin: authenticatedUser.firstLogin,
            token: generateToken(authenticatedUser._id),
        });
    } else {
        res.status(401).json({ message: 'Invalid username or password' });
    }
};

// @desc    Change password (first login or voluntary)
// @route   POST /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (user) {
        // If it's NOT first login, verify old password
        if (!user.firstLogin) {
            if (!(await user.matchPassword(oldPassword))) {
                return res.status(400).json({ message: 'Invalid old password' });
            }
        }

        user.password = newPassword;
        user.firstLogin = false;
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            username: user.username,
            fullName: user.fullName,
            role: user.role,
            classId: user.classId,
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Register a new admin
// @route   POST /api/auth/register-admin
// @access  Public
const registerAdmin = async (req, res) => {
    try {
        const { fullName, username, password, matricule } = req.body;

        const userExists = await User.findOne({ $or: [{ username }, { matricule }] });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists with this username or matricule' });
        }

        const user = await User.create({
            fullName,
            username,
            password,
            matricule,
            role: 'ADMIN',
            firstLogin: false
        });

        if (user) {
            user.adminId = user._id;
            await user.save();
            res.status(201).json({
                _id: user._id,
                username: user.username,
                fullName: user.fullName,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error('Register Admin Error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    loginUser,
    changePassword,
    getMe,
    registerAdmin,
};
