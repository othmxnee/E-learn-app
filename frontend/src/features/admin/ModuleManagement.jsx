import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Plus, BookOpen, CheckSquare, Square, X } from 'lucide-react';
import toast from 'react-hot-toast';

const ModuleManagement = () => {
    const [modules, setModules] = useState([]);
    const [levels, setLevels] = useState([]);
    const [classes, setClasses] = useState([]);
    const [teachers, setTeachers] = useState([]);

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAllocModal, setShowAllocModal] = useState(false);

    // Form states
    const [createForm, setCreateForm] = useState({ name: '', description: '' });
    const [allocForm, setAllocForm] = useState({
        moduleId: '',
        levelId: '',
        selectedSpecialities: [],
        teacherIds: []
    });

    const [submitting, setSubmitting] = useState(false);
    const [allocating, setAllocating] = useState(false);

    // Available specialities for selected level
    const [availableSpecialities, setAvailableSpecialities] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [modulesRes, levelsRes, classesRes, usersRes] = await Promise.all([
                api.get('/modules'), // Admin gets all definitions
                api.get('/admin/academic-structure/levels'),
                api.get('/admin/academic-structure/classes'),
                api.get('/admin/users')
            ]);
            setModules(modulesRes.data);
            setLevels(levelsRes.data);
            setClasses(classesRes.data);
            setTeachers(usersRes.data.filter(u => u.role === 'TEACHER'));
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const handleCreateModule = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const loadingToast = toast.loading('Creating module...');
        try {
            const res = await api.post('/modules', createForm);
            setModules([...modules, res.data]);
            setShowCreateModal(false);
            setCreateForm({ name: '', description: '' });
            toast.success('Module created successfully', { id: loadingToast });
        } catch (error) {
            console.error('Error creating module:', error);
            toast.error('Error creating module', { id: loadingToast });
        } finally {
            setSubmitting(false);
        }
    };

    const handleAllocateModule = async (e) => {
        e.preventDefault();
        setAllocating(true);
        const loadingToast = toast.loading('Allocating module...');
        try {
            await api.post('/modules/allocate-bulk', {
                moduleId: allocForm.moduleId,
                levelIds: [allocForm.levelId],
                teacherIds: allocForm.teacherIds
            });
            toast.success('Module allocated successfully', { id: loadingToast });
            setShowAllocModal(false);
            setAllocForm({ moduleId: '', levelId: '', teacherIds: [] });
        } catch (error) {
            console.error('Error allocating module:', error);
            toast.error(error.response?.data?.message || 'Error allocating module', { id: loadingToast });
        } finally {
            setAllocating(false);
        }
    };

    const handleTeacherSelect = (e) => {
        const options = e.target.options;
        const value = [];
        for (let i = 0, l = options.length; i < l; i++) {
            if (options[i].selected) {
                value.push(options[i].value);
            }
        }
        setAllocForm({ ...allocForm, teacherIds: value });
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2" />
                    Modules
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-primary text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                        Create Module
                    </button>
                    <button
                        onClick={() => setShowAllocModal(true)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                    >
                        Allocate Module
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {modules.map((mod) => (
                    <div key={mod._id} className="bg-white p-4 rounded shadow">
                        <h3 className="font-bold text-lg">{mod.name}</h3>
                        <p className="text-gray-600 mt-2">{mod.description}</p>
                    </div>
                ))}
            </div>

            {/* Create Module Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl border border-gray-100 relative">
                        <button
                            onClick={() => setShowCreateModal(false)}
                            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <h3 className="text-2xl font-bold mb-6 text-gray-800">Create Module</h3>
                        <form onSubmit={handleCreateModule}>
                            <div className="mb-3">
                                <label className="block text-sm mb-1">Name</label>
                                <input className="border w-full p-2 rounded" value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} required />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm mb-1">Description</label>
                                <textarea className="border w-full p-2 rounded" value={createForm.description} onChange={e => setCreateForm({ ...createForm, description: e.target.value })} />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="bg-primary text-white px-8 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Save Module'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Allocate Module Modal */}
            {showAllocModal && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white p-8 rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 relative">
                        <button
                            onClick={() => setShowAllocModal(false)}
                            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <h3 className="text-2xl font-bold mb-6 text-gray-800">Allocate Module to Level</h3>
                        <form onSubmit={handleAllocateModule}>
                            <div className="mb-3">
                                <label className="block text-sm mb-1 font-medium">Module</label>
                                <select className="border w-full p-2 rounded" value={allocForm.moduleId} onChange={e => setAllocForm({ ...allocForm, moduleId: e.target.value })} required>
                                    <option value="">Select Module</option>
                                    {modules.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                                </select>
                            </div>

                            <div className="mb-3">
                                <label className="block text-sm mb-1 font-medium">Academic Year/Level</label>
                                <select
                                    className="border w-full p-2 rounded"
                                    value={allocForm.levelId}
                                    onChange={e => setAllocForm({ ...allocForm, levelId: e.target.value })}
                                    required
                                >
                                    <option value="">Select Year</option>
                                    {levels.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm mb-1 font-medium">Teachers (Hold Ctrl to select multiple)</label>
                                <select multiple className="border w-full p-2 rounded h-32" value={allocForm.teacherIds} onChange={handleTeacherSelect} required>
                                    {teachers.map(t => <option key={t._id} value={t._id}>{t.fullName}</option>)}
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAllocModal(false);
                                        setAllocForm({ moduleId: '', levelId: '', teacherIds: [] });
                                    }}
                                    className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={allocating}
                                    className="bg-green-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {allocating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Allocate Module'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModuleManagement;
