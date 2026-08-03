// Command line entry point for the demo dataset.
//
//   npm run seed:demo    build the dataset (resets an existing one first)
//   npm run seed:reset   remove the dataset, leaving real data untouched
//
// The demo attaches to an existing admin, or creates the demo administrator if
// the database is empty, so a fresh deployment can be populated in one step.

require('dotenv').config();

const connectDB = require('../config/db');
const { User } = require('../models');
const { seedDemoData } = require('./demoSeed');
const { resetDemoData, countDemoData } = require('./resetDemo');
const { DEFAULT_SEED } = require('./random');

const DEMO_ADMIN = {
    username: 'admin',
    password: 'admin123',
    fullName: 'System Administrator',
};

// Prefers a real administrator so the demo lands in the account the operator
// already logs in with; falls back to creating one on an empty database.
const resolveAdmin = async () => {
    const existing = await User.findOne({
        where: { role: 'ADMIN' },
        order: [['createdAt', 'ASC']],
    });

    if (existing) {
        if (!existing.adminId) {
            existing.adminId = existing.id;
            await existing.save();
        }
        return existing;
    }

    const created = await User.create({
        ...DEMO_ADMIN,
        role: 'ADMIN',
        firstLogin: false,
    });
    created.adminId = created.id;
    await created.save();

    console.log(`Created demo administrator "${DEMO_ADMIN.username}" (password: ${DEMO_ADMIN.password})`);
    return created;
};

const logProgress = ({ message }) => {
    process.stdout.write(`\r  ${message.padEnd(60)}`);
};

const run = async () => {
    const mode = process.argv[2] === 'reset' ? 'reset' : 'demo';
    const started = Date.now();

    await connectDB();
    const admin = await resolveAdmin();

    if (mode === 'reset') {
        console.log('Removing demo data...');
        const removed = await resetDemoData({ adminId: admin.adminId, onProgress: logProgress });
        process.stdout.write('\r'.padEnd(64));
        console.log('\nDemo data removed:');
        console.table(removed);
    } else {
        // Re-running must never duplicate, so any previous demo goes first.
        const existing = await countDemoData(admin.adminId);
        if (existing.present) {
            console.log('Existing demo data found - clearing it first...');
            await resetDemoData({ adminId: admin.adminId, onProgress: logProgress });
            process.stdout.write('\r'.padEnd(64));
        }

        console.log('Seeding demo data...');
        const seedValue = Number(process.env.DEMO_SEED || DEFAULT_SEED);
        const summary = await seedDemoData({
            adminId: admin.adminId,
            seed: seedValue,
            onProgress: logProgress,
        });

        process.stdout.write('\r'.padEnd(64));
        console.log('\nDemo data created:');
        console.table(summary);
        console.log(`\nAll demo accounts use the password "demo1234".`);
        console.log(`Teachers and students log in with their matricule.`);
    }

    console.log(`Finished in ${((Date.now() - started) / 1000).toFixed(1)}s`);
    process.exit(0);
};

run().catch((error) => {
    console.error(`\nSeed failed: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
});
