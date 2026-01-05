import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Plus, Layers, Trash2, Edit2, X, Users, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

const StructureManagement = () => {
    const [levels, setLevels] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [showLevelModal, setShowLevelModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    // Student Assignment Modal
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedClass, setSelectedClass] = useState(null);
    const [students, setStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);

    // Form states
    const [levelForm, setLevelForm] = useState({
        name: '',
        type: 'UNIVERSITY',
        hasSpeciality: false,
        classCount: 1,
        specialities: [{ name: '', count: 1 }]
    });

    const [submitting, setSubmitting] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [importing, setImporting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [levelsRes, classesRes] = await Promise.all([
                api.get('/admin/academic-structure/levels'),
                api.get('/admin/academic-structure/classes')
            ]);
            setLevels(levelsRes.data);
            setClasses(classesRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const handleCreateLevel = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const loadingToast = toast.loading(isEditing ? 'Updating level...' : 'Creating level...');
        try {
            if (isEditing) {
                const res = await api.put(`/admin/academic-structure/levels/${editId}`, levelForm);
                setLevels(levels.map(l => l._id === editId ? res.data : l));
                toast.success('Level updated successfully', { id: loadingToast });
            } else {
                await api.post('/admin/academic-structure/levels', levelForm);
                fetchData();
                toast.success('Level and classes created successfully', { id: loadingToast });
            }
            closeModal();
        } catch (error) {
            console.error('Error saving level:', error);
            toast.error(error.response?.data?.message || 'Error saving level', { id: loadingToast });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteLevel = async (id) => {
        if (window.confirm('Are you sure? This will delete all classes in this level.')) {
            const loadingToast = toast.loading('Deleting level...');
            try {
                await api.delete(`/admin/academic-structure/levels/${id}`);
                fetchData();
                toast.success('Level deleted successfully', { id: loadingToast });
            } catch (error) {
                console.error('Error deleting level:', error);
                toast.error('Error deleting level', { id: loadingToast });
            }
        }
    };

    const openEditModal = (level) => {
        setIsEditing(true);
        setEditId(level._id);
        setLevelForm({
            name: level.name,
            type: level.type,
            hasSpeciality: level.hasSpeciality,
            classCount: 0, // Not used in edit
            specialities: [] // Not used in edit
        });
        setShowLevelModal(true);
    };

    const closeModal = () => {
        setShowLevelModal(false);
        setIsEditing(false);
        setEditId(null);
        setLevelForm({
            name: '',
            type: 'UNIVERSITY',
            hasSpeciality: false,
            classCount: 1,
            specialities: [{ name: '', count: 1 }]
        });
    };

    const handleSpecialityChange = (index, field, value) => {
        const newSpecs = [...levelForm.specialities];
        newSpecs[index][field] = value;
        setLevelForm({ ...levelForm, specialities: newSpecs });
    };

    const addSpeciality = () => {
        setLevelForm({ ...levelForm, specialities: [...levelForm.specialities, { name: '', count: 1 }] });
    };

    const removeSpeciality = (index) => {
        const newSpecs = levelForm.specialities.filter((_, i) => i !== index);
        setLevelForm({ ...levelForm, specialities: newSpecs });
    };

    const openAssignModal = async (cls) => {
        setSelectedClass(cls);
        const loadingToast = toast.loading('Loading students...');
        try {
            const [allUsersRes, classStudentsRes] = await Promise.all([
                api.get('/admin/users'),
                api.get(`/admin/classes/${cls._id}/students`)
            ]);

            const allStudents = allUsersRes.data.filter(u => u.role === 'STUDENT');
            setStudents(allStudents);

            const currentStudentIds = classStudentsRes.data.map(s => s._id);
            setSelectedStudents(currentStudentIds);
            setShowAssignModal(true);
            toast.dismiss(loadingToast);
        } catch (error) {
            console.error('Error fetching students:', error);
            toast.error('Error loading students', { id: loadingToast });
        }
    };

    const handleAssignStudents = async () => {
        setAssigning(true);
        const loadingToast = toast.loading('Assigning students...');
        try {
            await api.post(`/admin/classes/${selectedClass._id}/students`, {
                studentIds: selectedStudents
            });
            toast.success('Students assigned successfully', { id: loadingToast });
            setShowAssignModal(false);
            fetchData();
        } catch (error) {
            console.error('Error assigning students:', error);
            toast.error(error.response?.data?.message || 'Error assigning students', { id: loadingToast });
        } finally {
            setAssigning(false);
        }
    };

    const handleRemoveStudent = async (studentId) => {
        if (!window.confirm('Remove this student from the class?')) return;

        const loadingToast = toast.loading('Removing student...');
        try {
            await api.delete(`/admin/classes/${selectedClass._id}/students/${studentId}`);
            setSelectedStudents(selectedStudents.filter(id => id !== studentId));
            const res = await api.get('/admin/users');
            setStudents(res.data.filter(u => u.role === 'STUDENT'));
            toast.success('Student removed from class', { id: loadingToast });
        } catch (error) {
            console.error('Error removing student:', error);
            toast.error('Error removing student', { id: loadingToast });
        }
    };

    const handleCSVUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImporting(true);
        const loadingToast = toast.loading('Importing students...');
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/admin/users/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success(res.data.message || 'Import successful', { id: loadingToast });
            fetchData();
            const allUsersRes = await api.get('/admin/users');
            setStudents(allUsersRes.data.filter(u => u.role === 'STUDENT'));

            if (selectedClass) {
                const classStudentsRes = await api.get(`/admin/classes/${selectedClass._id}/students`);
                setSelectedStudents(classStudentsRes.data.map(s => s._id));
            }
        } catch (error) {
            console.error('Error importing students:', error);
            toast.error(error.response?.data?.message || 'Error importing students', { id: loadingToast });
        } finally {
            setImporting(false);
        }
        e.target.value = '';
    };


    const toggleStudentSelection = (studentId) => {
        if (selectedStudents.includes(studentId)) {
            setSelectedStudents(selectedStudents.filter(id => id !== studentId));
        } else {
            setSelectedStudents([...selectedStudents, studentId]);
        }
    };

    return (
        <div className="space-y-8">
            {/* Academic Levels Section */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center">
                        <Layers className="w-5 h-5 mr-2" />
                        Academic Levels (Years)
                    </h2>
                    <button
                        onClick={() => setShowLevelModal(true)}
                        className="bg-primary text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center"
                    >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Level
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {levels.map((level) => (
                        <div key={level._id} className="bg-white p-4 rounded shadow border-l-4 border-primary relative group">
                            <div className="absolute top-2 right-2 hidden group-hover:flex gap-1">
                                <button onClick={() => openEditModal(level)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDeleteLevel(level._id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            <h3 className="font-bold text-lg">{level.name}</h3>
                            <p className="text-sm text-gray-500">{level.type}</p>
                            {level.hasSpeciality && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded mt-2 inline-block">Has Speciality</span>}
                        </div>
                    ))}
                </div>
            </div>

            {/* Classes Section - Organized by Level */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center">
                        <Layers className="w-5 h-5 mr-2" />
                        Classes by Year
                    </h2>
                </div>

                {levels.map((level) => {
                    const levelClasses = classes.filter(c => c.levelId?._id === level._id);

                    if (levelClasses.length === 0) return null;

                    return (
                        <div key={level._id} className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                                <span className="bg-primary text-white px-3 py-1 rounded mr-2">{level.name}</span>
                                <span className="text-sm text-gray-500">({levelClasses.length} classes)</span>
                            </h3>
                            <div className="bg-white shadow rounded-lg overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Speciality</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {levelClasses.map((cls) => (
                                            <tr key={cls._id}>
                                                <td className="px-6 py-4 font-medium">{cls.name}</td>
                                                <td className="px-6 py-4">{cls.speciality || '-'}</td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {cls.studentCount || 0}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => openAssignModal(cls)}
                                                        className="text-white bg-primary hover:bg-blue-700 px-3 py-1.5 rounded flex items-center text-sm font-medium"
                                                    >
                                                        <Users className="w-4 h-4 mr-1" />
                                                        Manage Students
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Level Modal */}
            {showLevelModal && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white p-8 rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-800">{isEditing ? 'Edit Level' : 'Add Academic Level'}</h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="w-6 h-6" /></button>
                        </div>
                        <form onSubmit={handleCreateLevel}>
                            <div className="mb-3">
                                <label className="block text-sm mb-1">Name (e.g. CP1)</label>
                                <input className="border w-full p-2 rounded" value={levelForm.name} onChange={e => setLevelForm({ ...levelForm, name: e.target.value })} required />
                            </div>
                            <div className="mb-3">
                                <label className="block text-sm mb-1">Type</label>
                                <select className="border w-full p-2 rounded" value={levelForm.type} onChange={e => setLevelForm({ ...levelForm, type: e.target.value })}>
                                    <option value="UNIVERSITY">University</option>
                                    <option value="ECOLE_SUPERIEURE">École Supérieure</option>
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="flex items-center">
                                    <input type="checkbox" className="mr-2" checked={levelForm.hasSpeciality} onChange={e => setLevelForm({ ...levelForm, hasSpeciality: e.target.checked })} />
                                    Has Speciality?
                                </label>
                            </div>

                            {!isEditing && (
                                <div className="border-t pt-4 mt-4">
                                    <h4 className="font-semibold mb-2 text-sm text-gray-600">Class Generation</h4>
                                    {levelForm.hasSpeciality ? (
                                        <div className="space-y-2">
                                            {levelForm.specialities.map((spec, idx) => (
                                                <div key={idx} className="flex gap-2 items-center">
                                                    <input
                                                        placeholder="Speciality (e.g. IS)"
                                                        className="border p-2 rounded w-1/2"
                                                        value={spec.name}
                                                        onChange={e => handleSpecialityChange(idx, 'name', e.target.value)}
                                                        required
                                                    />
                                                    <input
                                                        type="number"
                                                        placeholder="Count"
                                                        className="border p-2 rounded w-20"
                                                        value={spec.count}
                                                        onChange={e => handleSpecialityChange(idx, 'count', parseInt(e.target.value))}
                                                        min="1"
                                                        required
                                                    />
                                                    {idx > 0 && (
                                                        <button type="button" onClick={() => removeSpeciality(idx)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                                                    )}
                                                </div>
                                            ))}
                                            <button type="button" onClick={addSpeciality} className="text-sm text-primary flex items-center mt-2">
                                                <Plus className="w-3 h-3 mr-1" /> Add Speciality
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="mb-3">
                                            <label className="block text-sm mb-1">Number of Classes</label>
                                            <input
                                                type="number"
                                                className="border w-full p-2 rounded"
                                                value={levelForm.classCount}
                                                onChange={e => setLevelForm({ ...levelForm, classCount: parseInt(e.target.value) })}
                                                min="1"
                                                required
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="bg-primary text-white px-8 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Save Level'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Students Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white p-8 rounded-3xl w-full max-w-3xl shadow-2xl border border-gray-100 relative max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-800">Manage Students - {selectedClass?.name}</h3>
                            <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="w-6 h-6" /></button>
                        </div>

                        {/* CSV Upload Section */}
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                            <label className="block text-sm font-medium mb-2">Import Students from CSV</label>
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleCSVUpload}
                                className="text-sm"
                            />
                            <p className="text-xs text-gray-600 mt-1">
                                CSV format: fullName, role, matricule, className
                            </p>
                        </div>

                        {/* Current Students in Class */}
                        <div className="mb-4">
                            <h4 className="font-semibold text-sm mb-2">Current Students ({selectedStudents.length})</h4>
                            <div className="max-h-40 overflow-y-auto border rounded p-2 bg-gray-50">
                                {students.filter(s => selectedStudents.includes(s._id)).length > 0 ? (
                                    <div className="space-y-1">
                                        {students.filter(s => selectedStudents.includes(s._id)).map(student => (
                                            <div key={student._id} className="flex justify-between items-center p-2 bg-white rounded text-sm">
                                                <span>{student.fullName} ({student.matricule})</span>
                                                <button
                                                    onClick={() => handleRemoveStudent(student._id)}
                                                    className="text-red-600 hover:text-red-800"
                                                    title="Remove from class"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 text-center py-2">No students assigned yet</p>
                                )}
                            </div>
                        </div>

                        {/* Add Students Section */}
                        <div className="flex-1 overflow-y-auto mb-4">
                            <h4 className="font-semibold text-sm mb-2">Add Students to Class</h4>
                            <div className="border rounded p-2">
                                <table className="min-w-full">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs">Select</th>
                                            <th className="px-4 py-2 text-left text-xs">Name</th>
                                            <th className="px-4 py-2 text-left text-xs">Matricule</th>
                                            <th className="px-4 py-2 text-left text-xs">Current Class</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.filter(s => !selectedStudents.includes(s._id)).map(student => (
                                            <tr key={student._id} className="border-t hover:bg-gray-50">
                                                <td className="px-4 py-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedStudents.includes(student._id)}
                                                        onChange={() => toggleStudentSelection(student._id)}
                                                    />
                                                </td>
                                                <td className="px-4 py-2 text-sm">{student.fullName}</td>
                                                <td className="px-4 py-2 text-sm">{student.matricule}</td>
                                                <td className="px-4 py-2 text-xs text-gray-500">
                                                    {classes.find(c => c._id === student.classId)?.name || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {students.filter(s => !selectedStudents.includes(s._id)).length === 0 && (
                                    <p className="text-sm text-gray-500 text-center py-4">All students are assigned to this class</p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-6 border-t border-gray-100">
                            <span className="text-sm text-gray-500 font-medium">
                                {selectedStudents.length} students selected
                            </span>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowAssignModal(false)}
                                    className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAssignStudents}
                                    disabled={assigning}
                                    className="bg-primary text-white px-8 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {assigning ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StructureManagement;
