import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { FileText, Download, Upload, Clock, Plus, X, Users } from 'lucide-react';

const ModuleDetails = () => {
    const { id } = useParams(); // Allocation ID
    const { user } = useSelector((state) => state.auth);
    const [module, setModule] = useState(null);
    const [content, setContent] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [activeTab, setActiveTab] = useState('content');

    // Forms
    const [showContentModal, setShowContentModal] = useState(false);
    const [contentForm, setContentForm] = useState({ type: 'COURSE', title: '', fileUrl: '', description: '' });
    const [uploading, setUploading] = useState(false);

    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assignForm, setAssignForm] = useState({ title: '', description: '', deadline: '' });

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const [modRes, contentRes, assignRes] = await Promise.all([
                api.get(`/modules/${id}`),
                api.get(`/modules/${id}/content`),
                api.get(`/modules/${id}/assignments`)
            ]);
            setModule(modRes.data);
            setContent(contentRes.data);
            setAssignments(assignRes.data);
        } catch (error) {
            console.error('Error fetching module details:', error);
        }
    };

    const handleFileUpload = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        setUploading(true);
        try {
            const res = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setUploading(false);
            return res.data.filePath;
        } catch (error) {
            console.error('Upload failed:', error);
            setUploading(false);
            alert('File upload failed');
            return null;
        }
    };

    const handleAddContent = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post(`/modules/${id}/content`, contentForm);
            setContent([res.data, ...content]);
            setShowContentModal(false);
            setContentForm({ type: 'COURSE', title: '', fileUrl: '', description: '' });
        } catch (error) {
            alert('Error adding content');
        }
    };

    const handleCreateAssignment = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post(`/modules/${id}/assignments`, assignForm);
            setAssignments([...assignments, res.data]);
            setShowAssignModal(false);
            setAssignForm({ title: '', description: '', deadline: '' });
        } catch (error) {
            alert('Error creating assignment');
        }
    };

    const handleSubmitAssignment = async (assignmentId, file) => {
        if (!file) return;
        const fileUrl = await handleFileUpload(file);
        if (!fileUrl) return;

        try {
            await api.post(`/assignments/${assignmentId}/submit`, { fileUrl });
            alert('Assignment submitted successfully');
            fetchData(); // Refresh to show status
        } catch (error) {
            alert('Error submitting assignment');
        }
    };

    const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [submissions, setSubmissions] = useState([]);

    const fetchSubmissions = async (assignment) => {
        try {
            const res = await api.get(`/assignments/${assignment._id}/submissions`);
            setSubmissions(res.data);
            setSelectedAssignment(assignment);
            setShowSubmissionsModal(true);
        } catch (error) {
            alert('Error fetching submissions');
        }
    };

    if (!module) return <div className="flex justify-center items-center h-64 text-gray-500">Loading module details...</div>;

    const isTeacher = user.role === 'TEACHER';

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary opacity-5 rounded-full -mr-16 -mt-16"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="px-3 py-1 rounded-full bg-blue-50 text-primary text-xs font-bold uppercase tracking-wider">
                            {module.levelId?.name || 'Academic Year'}
                        </span>
                        <span className="text-gray-300">|</span>
                        <span className="text-gray-500 text-sm font-medium">{module.moduleId.code}</span>
                    </div>
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-4">{module.moduleId.name}</h1>
                    <p className="text-gray-600 text-lg max-w-3xl leading-relaxed">{module.moduleId.description}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-8 bg-gray-100 p-1.5 rounded-2xl w-fit">
                <button
                    className={`px-8 py-3 rounded-xl font-bold transition-all ${activeTab === 'content' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('content')}
                >
                    Course Content
                </button>
                <button
                    className={`px-8 py-3 rounded-xl font-bold transition-all ${activeTab === 'assignments' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('assignments')}
                >
                    Assessments
                </button>
            </div>

            {/* Content Tab */}
            {activeTab === 'content' && (
                <div className="animate-fadeIn">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-800">Learning Resources</h2>
                        {isTeacher && (
                            <button
                                onClick={() => setShowContentModal(true)}
                                className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold flex items-center hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Add Resource
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        {content.map((item) => (
                            <div key={item._id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
                                <div className="flex items-center">
                                    <div className={`p-4 rounded-2xl mr-5 ${item.type === 'COURSE' ? 'bg-blue-50 text-blue-600' :
                                        item.type === 'TD' ? 'bg-green-50 text-green-600' :
                                            'bg-purple-50 text-purple-600'
                                        }`}>
                                        <FileText className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg group-hover:text-primary transition-colors">{item.title}</h3>
                                        <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                                                {item.type}
                                            </span>
                                            <span className="text-[10px] text-gray-400">
                                                Added on {new Date(item.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {item.fileUrl && (
                                    <a
                                        href={`http://localhost:5000${item.fileUrl}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-3 rounded-xl bg-gray-50 text-gray-400 hover:bg-primary hover:text-white transition-all"
                                        title="Download Resource"
                                    >
                                        <Download className="w-6 h-6" />
                                    </a>
                                )}
                            </div>
                        ))}
                        {content.length === 0 && (
                            <div className="text-center py-16 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 font-medium">No resources uploaded yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Assignments Tab */}
            {activeTab === 'assignments' && (
                <div className="animate-fadeIn">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-800">Module Assessments</h2>
                        {isTeacher && (
                            <button
                                onClick={() => setShowAssignModal(true)}
                                className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold flex items-center hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                New Assignment
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                        {assignments.map((assign) => (
                            <div key={assign._id} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-bold text-gray-900 mb-3">{assign.title}</h3>
                                        <p className="text-gray-600 leading-relaxed mb-6">{assign.description}</p>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center text-sm font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg">
                                                <Clock className="w-4 h-4 mr-2" />
                                                Deadline: {new Date(assign.deadline).toLocaleDateString()}
                                            </div>
                                            {isTeacher && (
                                                <button
                                                    onClick={() => fetchSubmissions(assign)}
                                                    className="text-sm font-bold text-primary hover:underline flex items-center"
                                                >
                                                    <Users className="w-4 h-4 mr-1" />
                                                    View Submissions
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {!isTeacher && (
                                        <div className="w-full md:w-auto shrink-0">
                                            {assign.mySubmission ? (
                                                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-center md:text-right">
                                                    <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${assign.mySubmission.status === 'LATE' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                                        }`}>
                                                        {assign.mySubmission.status === 'LATE' ? 'Late Submission' : 'Submitted'}
                                                    </span>
                                                    <p className="text-[11px] text-gray-400 mt-3 font-medium">
                                                        {new Date(assign.mySubmission.submittedAt).toLocaleString()}
                                                    </p>
                                                    <a
                                                        href={`http://localhost:5000${assign.mySubmission.fileUrl}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="mt-4 inline-flex items-center gap-2 text-primary font-bold text-sm hover:underline"
                                                    >
                                                        <Download className="w-4 h-4" /> My File
                                                    </a>
                                                </div>
                                            ) : (
                                                <label className="flex flex-col items-center justify-center w-full md:w-48 h-32 border-2 border-dashed border-gray-200 rounded-3xl cursor-pointer hover:border-primary hover:bg-blue-50 transition-all group">
                                                    <Upload className="w-8 h-8 text-gray-300 group-hover:text-primary mb-2" />
                                                    <span className="text-sm font-bold text-gray-500 group-hover:text-primary">Submit Solution</span>
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        onChange={(e) => handleSubmitAssignment(assign._id, e.target.files[0])}
                                                        disabled={uploading}
                                                    />
                                                </label>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {assignments.length === 0 && (
                            <div className="text-center py-16 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 font-medium">No assignments posted yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Submissions Modal */}
            {showSubmissionsModal && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">Submissions</h3>
                                <p className="text-gray-500 font-medium mt-1">{selectedAssignment?.title}</p>
                            </div>
                            <button onClick={() => setShowSubmissionsModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                <X className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-xs font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                                        <th className="pb-4">Student</th>
                                        <th className="pb-4">Matricule</th>
                                        <th className="pb-4">Date</th>
                                        <th className="pb-4">Status</th>
                                        <th className="pb-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {submissions.map((sub) => (
                                        <tr key={sub._id} className="group hover:bg-gray-50 transition-colors">
                                            <td className="py-4 font-bold text-gray-900">{sub.studentId.fullName}</td>
                                            <td className="py-4 text-gray-500 font-medium">{sub.studentId.matricule}</td>
                                            <td className="py-4 text-gray-500 text-sm">{new Date(sub.submittedAt).toLocaleString()}</td>
                                            <td className="py-4">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${sub.status === 'LATE' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                                    }`}>
                                                    {sub.status}
                                                </span>
                                            </td>
                                            <td className="py-4 text-right">
                                                <a
                                                    href={`http://localhost:5000${sub.fileUrl}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 text-primary font-bold hover:underline"
                                                >
                                                    <Download className="w-4 h-4" /> Download
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                    {submissions.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="py-12 text-center text-gray-400 font-medium italic">
                                                No submissions yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Content Modal */}
            {showContentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded w-96">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold">Add Content</h3>
                            <button onClick={() => setShowContentModal(false)}><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleAddContent}>
                            <div className="mb-3">
                                <label className="block text-sm mb-1">Title</label>
                                <input className="border w-full p-2 rounded" value={contentForm.title} onChange={e => setContentForm({ ...contentForm, title: e.target.value })} required />
                            </div>
                            <div className="mb-3">
                                <label className="block text-sm mb-1">Type</label>
                                <select className="border w-full p-2 rounded" value={contentForm.type} onChange={e => setContentForm({ ...contentForm, type: e.target.value })}>
                                    <option value="COURSE">Course</option>
                                    <option value="TD">TD</option>
                                    <option value="TP">TP</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                            <div className="mb-3">
                                <label className="block text-sm mb-1">File</label>
                                <input
                                    type="file"
                                    className="border w-full p-2 rounded"
                                    onChange={async (e) => {
                                        const url = await handleFileUpload(e.target.files[0]);
                                        if (url) setContentForm({ ...contentForm, fileUrl: url });
                                    }}
                                />
                                {uploading && <p className="text-xs text-blue-500 mt-1">Uploading...</p>}
                                {contentForm.fileUrl && <p className="text-xs text-green-500 mt-1">File uploaded!</p>}
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm mb-1">Description</label>
                                <textarea className="border w-full p-2 rounded" value={contentForm.description} onChange={e => setContentForm({ ...contentForm, description: e.target.value })} />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setShowContentModal(false)} className="bg-gray-300 px-3 py-1 rounded">Cancel</button>
                                <button type="submit" className="bg-primary text-white px-3 py-1 rounded" disabled={uploading}>Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assignment Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded w-96">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold">Create Assignment</h3>
                            <button onClick={() => setShowAssignModal(false)}><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleCreateAssignment}>
                            <div className="mb-3">
                                <label className="block text-sm mb-1">Title</label>
                                <input className="border w-full p-2 rounded" value={assignForm.title} onChange={e => setAssignForm({ ...assignForm, title: e.target.value })} required />
                            </div>
                            <div className="mb-3">
                                <label className="block text-sm mb-1">Deadline</label>
                                <input type="date" className="border w-full p-2 rounded" value={assignForm.deadline} onChange={e => setAssignForm({ ...assignForm, deadline: e.target.value })} required />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm mb-1">Description</label>
                                <textarea className="border w-full p-2 rounded" value={assignForm.description} onChange={e => setAssignForm({ ...assignForm, description: e.target.value })} />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setShowAssignModal(false)} className="bg-gray-300 px-3 py-1 rounded">Cancel</button>
                                <button type="submit" className="bg-primary text-white px-3 py-1 rounded">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModuleDetails;
