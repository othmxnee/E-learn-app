// Admin endpoints for loading and clearing the demo dataset.

const { seedDemoData } = require('../seed/demoSeed');
const { resetDemoData, countDemoData } = require('../seed/resetDemo');
const { runJob, getJob, isRunning } = require('../seed/jobRunner');
const { DEFAULT_SEED } = require('../seed/random');

// @desc    Start loading the demo dataset
// @route   POST /api/admin/demo/seed
// @access  Private/Admin
const startSeed = async (req, res) => {
    const adminId = req.user.adminId;

    if (isRunning(adminId)) {
        return res.status(409).json({ message: 'A demo job is already running', job: getJob(adminId) });
    }

    const seed = Number(req.body?.seed || process.env.DEMO_SEED || DEFAULT_SEED);

    const job = runJob(adminId, 'seed', async (onProgress) => {
        // Re-running must not stack a second dataset on top of the first.
        const existing = await countDemoData(adminId);
        if (existing.present) {
            onProgress({ step: 'reset', message: 'Clearing previous demo data' });
            await resetDemoData({ adminId, onProgress });
        }
        return seedDemoData({ adminId, seed, onProgress });
    });

    res.status(202).json({ message: 'Demo seed started', job });
};

// @desc    Start removing the demo dataset
// @route   POST /api/admin/demo/reset
// @access  Private/Admin
const startReset = async (req, res) => {
    const adminId = req.user.adminId;

    if (isRunning(adminId)) {
        return res.status(409).json({ message: 'A demo job is already running', job: getJob(adminId) });
    }

    const job = runJob(adminId, 'reset', (onProgress) => resetDemoData({ adminId, onProgress }));

    res.status(202).json({ message: 'Demo reset started', job });
};

// @desc    Poll the running or last finished job, plus what is currently seeded
// @route   GET /api/admin/demo/status
// @access  Private/Admin
const getStatus = async (req, res) => {
    const adminId = req.user.adminId;

    try {
        const [counts, job] = await Promise.all([countDemoData(adminId), getJob(adminId)]);
        res.json({ job, counts });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { startSeed, startReset, getStatus };
