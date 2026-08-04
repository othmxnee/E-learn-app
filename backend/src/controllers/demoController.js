// Admin endpoints for loading and clearing the demo dataset.

const { seedDemoData } = require('../seed/demoSeed');
const { resetDemoData, countDemoData } = require('../seed/resetDemo');
const { runJob, getJob, isRunning } = require('../seed/jobRunner');
const { DEFAULT_SEED } = require('../seed/random');
const { ingestAll } = require('../rag/ingest');
const { isConfigured, EMBEDDING_MODEL } = require('../rag/embeddings');
const { Chunk } = require('../models');

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

// @desc    Rebuild the chat index over every PDF material
// @route   POST /api/admin/demo/reindex
// @access  Private/Admin
const startReindex = async (req, res) => {
    const adminId = req.user.adminId;

    if (!isConfigured()) {
        return res.status(503).json({
            message: 'GEMINI_API_KEY is not set on this deployment, so the chat index cannot be built.',
        });
    }

    if (isRunning(adminId)) {
        return res.status(409).json({ message: 'A demo job is already running', job: getJob(adminId) });
    }

    const job = runJob(adminId, 'reindex', (onProgress) => ingestAll({ adminId, onProgress }));

    res.status(202).json({ message: 'Indexing started', job });
};

// @desc    Poll the running or last finished job, plus what is currently seeded
// @route   GET /api/admin/demo/status
// @access  Private/Admin
const getStatus = async (req, res) => {
    const adminId = req.user.adminId;

    try {
        const [counts, job, indexedChunks] = await Promise.all([
            countDemoData(adminId),
            getJob(adminId),
            Chunk.count({ where: { adminId, embeddingModel: EMBEDDING_MODEL } }),
        ]);

        res.json({
            job,
            counts,
            chat: {
                configured: isConfigured(),
                indexedChunks,
                embeddingModel: EMBEDDING_MODEL,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { startSeed, startReset, startReindex, getStatus };
