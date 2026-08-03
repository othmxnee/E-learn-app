import React, { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Database, RotateCcw, Loader2, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

// Loads and clears the demo dataset.
//
// Seeding takes long enough that the request would time out behind a proxy, so
// the endpoint starts a background job and this panel polls for progress until
// it finishes.

const POLL_INTERVAL = 1200;

const DemoDataPanel = ({ onChanged }) => {
    const [job, setJob] = useState(null);
    const [counts, setCounts] = useState(null);
    const [starting, setStarting] = useState(false);
    const [confirmingReset, setConfirmingReset] = useState(false);

    const timerRef = useRef(null);
    // Held in a ref so the poll callback can compare against the previous
    // status without being re-created on every tick.
    const wasRunningRef = useRef(false);

    const fetchStatus = useCallback(async () => {
        try {
            const { data } = await api.get('/admin/demo/status');
            setJob(data.job);
            setCounts(data.counts);

            if (wasRunningRef.current && data.job && data.job.status !== 'running') {
                wasRunningRef.current = false;
                if (data.job.status === 'done') {
                    toast.success(data.job.message);
                    if (onChanged) onChanged();
                } else {
                    toast.error(data.job.error || 'Demo job failed');
                }
            }

            return data.job;
        } catch (error) {
            return null;
        }
    }, [onChanged]);

    // Polling runs only while a job is in flight.
    useEffect(() => {
        fetchStatus();
        return () => clearInterval(timerRef.current);
    }, [fetchStatus]);

    useEffect(() => {
        const running = job?.status === 'running';
        wasRunningRef.current = wasRunningRef.current || running;

        clearInterval(timerRef.current);
        if (running) {
            timerRef.current = setInterval(fetchStatus, POLL_INTERVAL);
        }
        return () => clearInterval(timerRef.current);
    }, [job?.status, fetchStatus]);

    const start = async (endpoint, label) => {
        setStarting(true);
        try {
            const { data } = await api.post(endpoint);
            wasRunningRef.current = true;
            setJob(data.job);
            toast.success(`${label} started`);
        } catch (error) {
            const message = error.response?.data?.message || `Could not start ${label.toLowerCase()}`;
            toast.error(message);
        } finally {
            setStarting(false);
            setConfirmingReset(false);
        }
    };

    const running = job?.status === 'running';
    const busy = running || starting;
    const hasDemoData = counts?.present;

    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-lg font-bold text-gray-800">Demo data</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Populate the platform with a realistic university dataset for demonstrations.
                    </p>
                </div>
                <Database className="h-5 w-5 shrink-0 text-gray-400" />
            </div>

            {counts && (
                <div className="mb-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
                    <span>{counts.students} students</span>
                    <span>{counts.teachers} teachers</span>
                    <span>{counts.modules} modules</span>
                    <span>{counts.assignments} assignments</span>
                    <span>{counts.submissions} submissions</span>
                </div>
            )}

            {running && (
                <div className="mb-4">
                    <div className="mb-1.5 flex items-center justify-between text-xs text-gray-600">
                        <span className="flex items-center gap-1.5">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            {job.message}
                        </span>
                        <span className="font-medium">{job.progress}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                            className="h-full rounded-full bg-blue-600 transition-all duration-500"
                            style={{ width: `${job.progress}%` }}
                        />
                    </div>
                </div>
            )}

            {job?.status === 'failed' && (
                <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{job.error}</span>
                </div>
            )}

            <div className="flex flex-wrap gap-3">
                <button
                    type="button"
                    onClick={() => start('/admin/demo/seed', 'Demo seed')}
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <Database className="h-4 w-4" />
                    {hasDemoData ? 'Reload demo data' : 'Load demo data'}
                </button>

                {confirmingReset ? (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Remove all demo data?</span>
                        <button
                            type="button"
                            onClick={() => start('/admin/demo/reset', 'Demo reset')}
                            disabled={busy}
                            className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                        >
                            Yes, remove
                        </button>
                        <button
                            type="button"
                            onClick={() => setConfirmingReset(false)}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => setConfirmingReset(true)}
                        disabled={busy || !hasDemoData}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <RotateCcw className="h-4 w-4" />
                        Reset demo data
                    </button>
                )}
            </div>

            <p className="mt-3 text-xs text-gray-400">
                Only demo records are affected — data you created yourself is never touched.
                Demo accounts sign in with their matricule and the password <code className="font-mono">demo1234</code>.
            </p>
        </div>
    );
};

export default DemoDataPanel;
