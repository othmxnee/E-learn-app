const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { User } = require('./models');

dotenv.config();

const importData = async () => {
    try {
        await connectDB();
        await User.destroy({ where: {} });

        const adminUser = await User.create({
            username: 'admin',
            password: 'admin123', // Will be hashed
            role: 'ADMIN',
            fullName: 'System Administrator',
            firstLogin: false,
        });

        adminUser.adminId = adminUser.id;
        await adminUser.save();

        console.log('Data Imported!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

importData();
