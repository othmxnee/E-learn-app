// Tracks the demo seed as a background job.
//
// Seeding takes long enough that holding the HTTP request open would hit
// proxy timeouts, so the endpoint starts the work and returns immediately
// while the client polls for progress.
//
// State is kept in memory, which is the right scope here: a restart loses the
// progress record but the database work either committed or did not, and the
// admin can simply re-run. Only one job may run at a time per admin.

const jobs = new Map();

const STEP_WEIGHTS = {
    reset: 5,
    levels: 6,
    classes: 8,
    users: 30,
    modules: 40,
    teachers: 45,
    materials: 55,
    assignments: 68,
    submissions: 80,
};

const COMPLETION_MESSAGES = {
    seed: 'Demo data ready',
    reset: 'Demo data removed',
    reindex: 'Chat index rebuilt',
};

const newJob = (adminId, kind) => {
    const job = {
        id: `${kind}-${Date.now()}`,
        kind,
        adminId,
        status: 'running',
        progress: 0,
        message: 'Starting',
        startedAt: new Date().toISOString(),
        finishedAt: null,
        result: null,
        error: null,
    };
    jobs.set(adminId, job);
    return job;
};

const getJob = (adminId) => jobs.get(adminId) || null;

const isRunning = (adminId) => {
    const job = jobs.get(adminId);
    return Boolean(job && job.status === 'running');
};

// The seeder reports which step it is on rather than a percentage, so the
// weights above turn that into a bar that moves forward monotonically.
const attachProgress = (job) => ({ step, message }) => {
    const weight = STEP_WEIGHTS[step];
    if (weight !== undefined) job.progress = Math.max(job.progress, weight);
    // Indexing reports file-by-file rather than by named step, so it advances
    // the bar gradually instead of snapping to fixed weights.
    else if (job.kind === 'reindex') job.progress = Math.min(95, job.progress + 4);
    job.message = message;
};

// The promise is deliberately not awaited by the caller; failures are recorded
// on the job instead of escalating to an unhandled rejection.
const runJob = (adminId, kind, work) => {
    const job = newJob(adminId, kind);

    Promise.resolve()
        .then(() => work(attachProgress(job)))
        .then((result) => {
            job.status = 'done';
            job.progress = 100;
            job.message = COMPLETION_MESSAGES[kind] || 'Done';
            job.result = result;
            job.finishedAt = new Date().toISOString();
        })
        .catch((error) => {
            job.status = 'failed';
            job.message = 'Failed';
            job.error = error.message;
            job.finishedAt = new Date().toISOString();
            console.error(`Demo ${kind} job failed:`, error);
        });

    return job;
};

module.exports = { runJob, getJob, isRunning };
