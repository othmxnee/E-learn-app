import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Plus, Trash2, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [importing, setImporting] = useState(false);

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        fullName: '',
        role: 'STUDENT',
        matricule: '',
    });

    const [importFile, setImportFile] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [usersRes, classesRes] = await Promise.all([
                api.get('/admin/users'),
                api.get('/admin/academic-structure/classes')
            ]);
            setUsers(usersRes.data);
            setClasses(classesRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            const loadingToast = toast.loading('Deleting user...');
            try {
                await api.delete(`/admin/users/${id}`);
                setUsers(users.filter((user) => user._id !== id));
                toast.success('User deleted successfully', { id: loadingToast });
            } catch (error) {
                console.error('Error deleting user:', error);
                toast.error('Failed to delete user', { id: loadingToast });
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const loadingToast = toast.loading('Creating user...');
        try {
            const response = await api.post('/admin/users', formData);
            setUsers([...users, response.data]);
            setShowModal(false);
            setFormData({
                username: '',
                password: '',
                fullName: '',
                role: 'STUDENT',
                matricule: '',
            });
            toast.success('User created successfully', { id: loadingToast });
        } catch (error) {
            console.error('Error creating user:', error);
            toast.error(error.response?.data?.message || 'Error creating user', { id: loadingToast });
        } finally {
            setSubmitting(false);
        }
    };

    const handleImport = async (e) => {
        e.preventDefault();
        if (!importFile) return;

        setImporting(true);
        const loadingToast = toast.loading('Importing users... This may take a moment.');

        const formData = new FormData();
        formData.append('file', importFile);

        try {
            const res = await api.post('/admin/users/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success(res.data.message || 'Import completed successfully', { id: loadingToast, duration: 5000 });
            setShowImportModal(false);
            setImportFile(null);
            fetchData();
        } catch (error) {
            console.error('Error importing users:', error);
            toast.error('Error importing users. Please check your CSV format.', { id: loadingToast });
        } finally {
            setImporting(false);
        }
    };

    // Organize users
    const admins = users.filter(u => u.role === 'ADMIN');
    const teachers = users.filter(u => u.role === 'TEACHER');
    const students = users.filter(u => u.role === 'STUDENT');

    // Sort students by class
    const studentsWithClass = students.filter(s => s.classId);
    const studentsWithoutClass = students.filter(s => !s.classId);

    studentsWithClass.sort((a, b) => {
        const classA = classes.find(c => c._id === a.classId)?.name || '';
        const classB = classes.find(c => c._id === b.classId)?.name || '';
        return classA.localeCompare(classB);
    });

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="bg-green-600 text-white px-4 py-2 rounded flex items-center hover:bg-green-700"
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        Import CSV
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-primary text-white px-4 py-2 rounded flex items-center hover:bg-blue-700"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add User
                    </button>
                </div>
            </div>

            {/* Admins */}
            {admins.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-700 mb-3">Administrators ({admins.length})</h2>
                    <div className="bg-white shadow-md rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Full Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {admins.map((user) => (
                                    <tr key={user._id}>
                                        <td className="px-6 py-4">{user.fullName}</td>
                                        <td className="px-6 py-4">{user.username}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button onClick={() => handleDelete(user._id)} className="text-red-600 hover:text-red-900">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Teachers */}
            {teachers.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-700 mb-3">Teachers ({teachers.length})</h2>
                    <div className="bg-white shadow-md rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Full Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Matricule</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {teachers.map((user) => (
                                    <tr key={user._id}>
                                        <td className="px-6 py-4">{user.fullName}</td>
                                        <td className="px-6 py-4">{user.matricule}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button onClick={() => handleDelete(user._id)} className="text-red-600 hover:text-red-900">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Students */}
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-700 mb-3">Students ({students.length})</h2>
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Full Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Matricule</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {studentsWithClass.map((user) => (
                                <tr key={user._id}>
                                    <td className="px-6 py-4">{user.fullName}</td>
                                    <td className="px-6 py-4">{user.matricule}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded">
                                            {classes.find(c => c._id === user.classId)?.name || '-'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => handleDelete(user._id)} className="text-red-600 hover:text-red-900">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {studentsWithoutClass.map((user) => (
                                <tr key={user._id} className="bg-yellow-50">
                                    <td className="px-6 py-4">{user.fullName}</td>
                                    <td className="px-6 py-4">{user.matricule}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                                            Not assigned
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => handleDelete(user._id)} className="text-red-600 hover:text-red-900">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add User Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl border border-gray-100 relative">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">Add New User</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-bold mb-2">Role</label>
                                <select
                                    className="w-full border rounded px-3 py-2"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="STUDENT">Student</option>
                                    <option value="TEACHER">Teacher</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-bold mb-2">Full Name</label>
                                <input
                                    type="text"
                                    className="w-full border rounded px-3 py-2"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    required
                                />
                            </div>

                            {formData.role === 'ADMIN' ? (
                                <>
                                    <div className="mb-4">
                                        <label className="block text-sm font-bold mb-2">Username</label>
                                        <input
                                            type="text"
                                            className="w-full border rounded px-3 py-2"
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-bold mb-2">Password</label>
                                        <input
                                            type="password"
                                            className="w-full border rounded px-3 py-2"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="mb-4">
                                    <label className="block text-sm font-bold mb-2">Matricule (ID)</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded px-3 py-2"
                                        value={formData.matricule}
                                        onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
                                        required
                                        placeholder="Numbers only"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Password will be same as Matricule</p>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="bg-primary text-white px-8 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Save User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl border border-gray-100 relative">
                        <button
                            onClick={() => setShowImportModal(false)}
                            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">Import Users (CSV)</h2>
                        <form onSubmit={handleImport}>
                            <div className="mb-4">
                                <label className="block text-sm font-bold mb-2">Select CSV File</label>
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={(e) => setImportFile(e.target.files[0])}
                                    required
                                    className="w-full"
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    Format: fullName,role,matricule,classId(optional)(ex:CP2-1 or CS1-ISI-1)
                                </p>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowImportModal(false)}
                                    className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={importing}
                                    className="bg-green-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {importing ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Start Import'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
