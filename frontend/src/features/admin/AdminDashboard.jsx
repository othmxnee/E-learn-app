import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Users, Layers, BookOpen, GraduationCap, FileText,
    ClipboardList, Clock, Award, ChevronLeft, ChevronRight, Search, ArrowUpDown,
} from 'lucide-react';
import api from '../../services/api';
import BarChart from '../../components/charts/BarChart';
import LineChart from '../../components/charts/LineChart';
import DemoDataPanel from './DemoDataPanel';
import { SERIES, STATUS, gradeStatus, sequentialStep } from '../../components/charts/palette';

const PAGE_SIZE = 8;

const formatWeek = (value) => {
    const date = new Date(value);
    return `${date.getDate()}/${date.getMonth() + 1}`;
};

// A stat tile: one number, its label, and an optional secondary line. No plot,
// so it carries no hover layer.
const StatTile = ({ icon: Icon, label, value, hint, tone = 'text-blue-600', bg = 'bg-blue-50' }) => (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className={`mb-3 inline-flex rounded-xl p-2.5 ${bg} ${tone}`}>
            <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</h3>
        <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-gray-400">{hint}</p>}
    </div>
);

const AdminDashboard = () => {
    const [overview, setOverview] = useState(null);
    const [distribution, setDistribution] = useState([]);
    const [timeline, setTimeline] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);

    // Module table state: server-side search, sort and pagination.
    const [modules, setModules] = useState({ rows: [], total: 0, totalPages: 1, page: 1 });
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [sortBy, setSortBy] = useState('module');
    const [sortDir, setSortDir] = useState('asc');
    const [tableLoading, setTableLoading] = useState(false);
    const [showClassTable, setShowClassTable] = useState(false);

    const loadDashboard = useCallback(async () => {
        setLoading(true);
        try {
            const [overviewRes, distributionRes, timelineRes, classesRes] = await Promise.all([
                api.get('/admin/analytics/overview'),
                api.get('/admin/analytics/grade-distribution'),
                api.get('/admin/analytics/submissions-timeline?weeks=20'),
                api.get('/admin/analytics/classes'),
            ]);
            setOverview(overviewRes.data);
            setDistribution(distributionRes.data);
            setTimeline(timelineRes.data);
            setClasses(classesRes.data);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadDashboard(); }, [loadDashboard]);

    // Typing in the search box should not fire a request per keystroke.
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const loadModules = useCallback(async () => {
        setTableLoading(true);
        try {
            const { data } = await api.get('/admin/analytics/modules', {
                params: { page, pageSize: PAGE_SIZE, search: debouncedSearch, sortBy, sortDir },
            });
            setModules(data);
        } catch (error) {
            console.error('Error loading modules:', error);
        } finally {
            setTableLoading(false);
        }
    }, [page, debouncedSearch, sortBy, sortDir]);

    useEffect(() => { loadModules(); }, [loadModules]);

    const toggleSort = (column) => {
        if (sortBy === column) {
            setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortBy(column);
            setSortDir('asc');
        }
        setPage(1);
    };

    const distributionData = useMemo(
        () => distribution.map((bucket) => {
            const midpoint = (bucket.from + bucket.to) / 2;
            return {
                label: bucket.label,
                value: bucket.count,
                // Magnitude within the bell, so the shape reads even in greyscale.
                color: sequentialStep(midpoint / 20),
                tooltip: `${bucket.count} submissions graded ${bucket.label}/20`,
            };
        }),
        [distribution]
    );

    const timelineSeries = useMemo(
        () => [
            { name: 'On time', color: SERIES.blue, points: timeline.map((week) => week.onTime) },
            { name: 'Late', color: SERIES.orange, points: timeline.map((week) => week.late) },
        ],
        [timeline]
    );

    const classData = useMemo(
        () => classes.map((entry) => ({
            label: entry.name || '—',
            value: entry.students,
            color: SERIES.aqua,
            tooltip: `${entry.name}: ${entry.students} students, ${entry.inactive} inactive${
                entry.averageGrade !== null ? `, average ${entry.averageGrade}/20` : ''
            }`,
        })),
        [classes]
    );

    if (loading) {
        return <div className="flex h-64 items-center justify-center text-gray-500">Loading dashboard…</div>;
    }

    const empty = !overview || overview.submissions === 0;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Admin Overview</h1>
                <p className="mt-1 text-sm text-gray-500">Platform activity across every programme.</p>
            </div>

            <DemoDataPanel onChanged={() => { loadDashboard(); loadModules(); }} />

            {empty ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
                    <ClipboardList className="mx-auto mb-3 h-8 w-8 text-gray-300" />
                    <h2 className="text-lg font-semibold text-gray-700">No activity yet</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Load the demo data above to see the dashboard populated.
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        <StatTile icon={GraduationCap} label="Students" value={overview.students}
                            hint={`${overview.inactiveStudents} never signed in`}
                            tone="text-blue-600" bg="bg-blue-50" />
                        <StatTile icon={Users} label="Teachers" value={overview.teachers}
                            hint={`${overview.classes} classes`}
                            tone="text-violet-600" bg="bg-violet-50" />
                        <StatTile icon={BookOpen} label="Modules" value={overview.modules}
                            hint={`${overview.materials} course materials`}
                            tone="text-emerald-600" bg="bg-emerald-50" />
                        <StatTile icon={Award} label="Average grade"
                            value={overview.averageGrade !== null ? `${overview.averageGrade}/20` : '—'}
                            hint={`${overview.graded} graded submissions`}
                            tone="text-amber-600" bg="bg-amber-50" />
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        <StatTile icon={ClipboardList} label="Assignments" value={overview.assignments}
                            hint={`${overview.upcomingAssignments} still open`}
                            tone="text-sky-600" bg="bg-sky-50" />
                        <StatTile icon={FileText} label="Submissions" value={overview.submissions}
                            hint={`${overview.gradedRate}% graded`}
                            tone="text-teal-600" bg="bg-teal-50" />
                        <StatTile icon={Clock} label="Late submissions" value={overview.late}
                            hint={`${overview.lateRate}% of all submissions`}
                            tone="text-orange-600" bg="bg-orange-50" />
                        <StatTile icon={Layers} label="Classes" value={overview.classes}
                            hint={`${Math.round(overview.students / Math.max(overview.classes, 1))} students on average`}
                            tone="text-indigo-600" bg="bg-indigo-50" />
                    </div>

                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-gray-800">Grade distribution</h2>
                            <p className="mb-4 text-sm text-gray-500">
                                Graded submissions by mark, out of 20.
                            </p>
                            <BarChart data={distributionData} height={260} />
                        </div>

                        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-gray-800">Submissions over time</h2>
                            <p className="mb-4 text-sm text-gray-500">
                                Weekly hand-ins across the semester.
                            </p>
                            <LineChart
                                series={timelineSeries}
                                labels={timeline.map((week) => formatWeek(week.week))}
                                height={260}
                            />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">Class sizes</h2>
                                <p className="text-sm text-gray-500">Enrolled students per cohort.</p>
                            </div>
                            {/* The fill sits below 3:1 on a light surface, so a
                                table view is always reachable as the relief. */}
                            <button
                                type="button"
                                onClick={() => setShowClassTable((current) => !current)}
                                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
                            >
                                {showClassTable ? 'Show chart' : 'Show table'}
                            </button>
                        </div>

                        {showClassTable ? (
                            <div className="max-h-80 overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-white">
                                        <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wider text-gray-500">
                                            <th className="py-2 pr-4 font-medium">Class</th>
                                            <th className="py-2 pr-4 font-medium">Level</th>
                                            <th className="py-2 pr-4 font-medium">Students</th>
                                            <th className="py-2 pr-4 font-medium">Inactive</th>
                                            <th className="py-2 font-medium">Avg grade</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {classes.map((entry) => (
                                            <tr key={entry.id} className="border-b border-gray-50 last:border-0">
                                                <td className="py-2 pr-4 font-medium text-gray-800">{entry.name || '—'}</td>
                                                <td className="py-2 pr-4 text-gray-500">{entry.level || '—'}</td>
                                                <td className="py-2 pr-4 text-gray-600">{entry.students}</td>
                                                <td className="py-2 pr-4 text-gray-600">{entry.inactive}</td>
                                                <td className="py-2 text-gray-600">
                                                    {entry.averageGrade === null ? '—' : `${entry.averageGrade}/20`}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <BarChart data={classData} height={280} rotateLabels />
                        )}
                    </div>

                    {/* Module performance: search, sort and pagination in one place. */}
                    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-6">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">Module performance</h2>
                                <p className="text-sm text-gray-500">{modules.total} modules allocated</p>
                            </div>
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search modules…"
                                    className="w-56 rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wider text-gray-500">
                                        {[
                                            ['module', 'Module'],
                                            ['level', 'Level'],
                                            ['assignments', 'Assignments'],
                                            ['submissions', 'Submissions'],
                                            ['averageGrade', 'Avg grade'],
                                            ['lateRate', 'Late'],
                                        ].map(([key, label]) => (
                                            <th key={key} className="px-6 py-3 font-medium">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleSort(key)}
                                                    className={`inline-flex items-center gap-1 transition hover:text-gray-800 ${
                                                        sortBy === key ? 'text-gray-800' : ''
                                                    }`}
                                                >
                                                    {label}
                                                    <ArrowUpDown className="h-3 w-3" />
                                                </button>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className={tableLoading ? 'opacity-50' : ''}>
                                    {modules.rows.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                                                No modules match “{debouncedSearch}”.
                                            </td>
                                        </tr>
                                    ) : (
                                        modules.rows.map((row) => {
                                            const status = gradeStatus(row.averageGrade);
                                            return (
                                                <tr key={row.allocationId} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                                                    <td className="px-6 py-3 font-medium text-gray-800">{row.module}</td>
                                                    <td className="px-6 py-3 text-gray-500">{row.level || '—'}</td>
                                                    <td className="px-6 py-3 text-gray-600">{row.assignments}</td>
                                                    <td className="px-6 py-3 text-gray-600">{row.submissions}</td>
                                                    <td className="px-6 py-3">
                                                        {row.averageGrade === null ? (
                                                            <span className="text-gray-400">—</span>
                                                        ) : (
                                                            // Colour is paired with the number, never carrying it alone.
                                                            <span className="inline-flex items-center gap-1.5 font-medium text-gray-800">
                                                                <span
                                                                    className="inline-block h-2 w-2 rounded-full"
                                                                    style={{ backgroundColor: STATUS[status] }}
                                                                />
                                                                {row.averageGrade}/20
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-3 text-gray-600">{row.lateRate}%</td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
                            <span className="text-sm text-gray-500">
                                Page {modules.page} of {modules.totalPages}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                                    disabled={page <= 1}
                                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <ChevronLeft className="h-4 w-4" /> Previous
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPage((current) => Math.min(modules.totalPages, current + 1))}
                                    disabled={page >= modules.totalPages}
                                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Next <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminDashboard;
