const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/userModel');
const connectDB = require('./config/db');

dotenv.config();

const importData = async () => {
    try {
        await connectDB();
        await User.deleteMany();

        const adminUser = new User({
            username: 'admin',
            password: 'admin123', // Will be hashed
            role: 'ADMIN',
            fullName: 'System Administrator',
            firstLogin: false,
        });

        await adminUser.save();

        console.log('Data Imported!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

importData();
