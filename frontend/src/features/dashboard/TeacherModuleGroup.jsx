import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { FileText, Download, Upload, Clock, Plus, X, Users, ChevronRight, ChevronDown } from 'lucide-react';
import { FILE_BASE_URL } from '../../config';

const TeacherModuleGroup = () => {
    const { moduleId, levelId } = useParams();
    const { user } = useSelector((state) => state.auth);

    const [allocations, setAllocations] = useState([]);
    const [moduleInfo, setModuleInfo] = useState(null);
    const [levelInfo, setLevelInfo] = useState(null);

    const [content, setContent] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [activeTab, setActiveTab] = useState('content');
    const [loading, setLoading] = useState(true);

    // Submissions state
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);

    // Forms
    const [showContentModal, setShowContentModal] = useState(false);
    const [contentForm, setContentForm] = useState({ type: 'COURSE', title: '', fileUrl: '', description: '' });
    const [uploading, setUploading] = useState(false);

    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assignForm, setAssignForm] = useState({ title: '', description: '', deadline: '' });

    useEffect(() => {
        fetchGroupData();
    }, [moduleId, levelId]);

    const fetchGroupData = async () => {
        try {
            setLoading(true);
            // 1. Get all allocations for this teacher
            const allAllocRes = await api.get('/modules');
            const filteredAllocations = allAllocRes.data.filter(
                a => a.moduleId._id === moduleId && a.classId.levelId?._id === levelId
            );

            setAllocations(filteredAllocations);
            if (filteredAllocations.length > 0) {
                setModuleInfo(filteredAllocations[0].moduleId);
                setLevelInfo(filteredAllocations[0].classId.levelId);
            }

            // 2. Fetch content and assignments for all allocations
            const allocationIds = filteredAllocations.map(a => a._id);

            const contentPromises = allocationIds.map(id => api.get(`/modules/${id}/content`));
            const assignPromises = allocationIds.map(id => api.get(`/modules/${id}/assignments`));

            const contentResults = await Promise.all(contentPromises);
            const assignResults = await Promise.all(assignPromises);

            // Flatten and group by title (unique items)
            const allContent = contentResults.flatMap(r => r.data);
            const uniqueContent = Array.from(new Map(allContent.map(item => [item.title, item])).values());

            const allAssign = assignResults.flatMap(r => r.data);
            // For assignments, we group by title and deadline
            const groupedAssign = [];
            const assignMap = new Map();

            allAssign.forEach(a => {
                const key = `${a.title}-${a.deadline}`;
                if (!assignMap.has(key)) {
                    assignMap.set(key, { ...a, relatedIds: [a._id], classNames: [filteredAllocations.find(al => al._id === a.allocationId)?.classId.name] });
                } else {
                    const existing = assignMap.get(key);
                    existing.relatedIds.push(a._id);
                    existing.classNames.push(filteredAllocations.find(al => al._id === a.allocationId)?.classId.name);
                }
            });

            setContent(uniqueContent);
            setAssignments(Array.from(assignMap.values()));
            setLoading(false);
        } catch (error) {
            console.error('Error fetching group data:', error);
            setLoading(false);
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

    const handleAddContentBulk = async (e) => {
        e.preventDefault();
        try {
            const allocationIds = allocations.map(a => a._id);
            await api.post('/modules/bulk/content', {
                ...contentForm,
                allocationIds
            });
            setShowContentModal(false);
            setContentForm({ type: 'COURSE', title: '', fileUrl: '', description: '' });
            fetchGroupData();
        } catch (error) {
            alert('Error adding content');
        }
    };

    const handleCreateAssignmentBulk = async (e) => {
        e.preventDefault();
        try {
            const allocationIds = allocations.map(a => a._id);
            await api.post('/modules/bulk/assignments', {
                ...assignForm,
                allocationIds
            });
            setShowAssignModal(false);
            setAssignForm({ title: '', description: '', deadline: '' });
            fetchGroupData();
        } catch (error) {
            alert('Error creating assignment');
        }
    };

    const viewSubmissions = async (groupedAssign) => {
        setSelectedAssignment(groupedAssign);
        setSubmissions([]);
        setShowSubmissionsModal(true);

        try {
            const submissionPromises = groupedAssign.relatedIds.map(id => api.get(`/assignments/${id}/submissions`));
            const results = await Promise.all(submissionPromises);
            const allSubmissions = results.flatMap(r => r.data);
            setSubmissions(allSubmissions);
        } catch (error) {
            console.error('Error fetching submissions:', error);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading level modules...</div>;
    if (!moduleInfo) return <div className="p-8 text-center">No modules found for this level.</div>;

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6 border-l-4 border-primary">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-primary font-bold uppercase tracking-wider mb-1">
                            <span>{levelInfo?.name}</span>
                            <ChevronRight className="w-4 h-4" />
                            <span>{moduleInfo.code}</span>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800">{moduleInfo.name}</h1>
                        <p className="text-gray-600 mt-2">{moduleInfo.description}</p>
                    </div>
                    <div className="text-right">
                        <span className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold border border-blue-100">
                            {allocations.length} Classes
                        </span>
                        <div className="mt-2 text-xs text-gray-400">
                            {allocations.map(a => a.classId.name).join(', ')}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6 bg-white rounded-t-lg px-4">
                <button
                    className={`px-6 py-4 font-bold transition-all ${activeTab === 'content' ? 'border-b-4 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('content')}
                >
                    Course Resources
                </button>
                <button
                    className={`px-6 py-4 font-bold transition-all ${activeTab === 'assignments' ? 'border-b-4 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('assignments')}
                >
                    Assessments & Submissions
                </button>
            </div>

            {/* Content Tab */}
            {activeTab === 'content' && (
                <div className="animate-fadeIn">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-700">Shared Resources</h2>
                        <button
                            onClick={() => setShowContentModal(true)}
                            className="bg-primary text-white px-4 py-2 rounded-lg flex items-center shadow-md hover:bg-blue-700 transition-colors"
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload to All Classes
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {content.map((item) => (
                            <div key={item._id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                                <div className="flex items-center">
                                    <div className={`p-3 rounded-xl mr-4 ${item.type === 'COURSE' ? 'bg-blue-50 text-blue-600' :
                                        item.type === 'TD' ? 'bg-green-50 text-green-600' :
                                            'bg-purple-50 text-purple-600'
                                        }`}>
                                        <FileText className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-lg">{item.title}</h3>
                                        <p className="text-sm text-gray-500 mb-1">{item.description}</p>
                                        <div className="flex gap-2">
                                            <span className="text-[10px] font-bold uppercase tracking-widest bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{item.type}</span>
                                            <span className="text-[10px] font-bold uppercase tracking-widest bg-blue-50 text-blue-600 px-2 py-0.5 rounded">All Classes</span>
                                        </div>
                                    </div>
                                </div>
                                {item.fileUrl && (
                                    <a
                                        href={`${FILE_BASE_URL}${item.fileUrl}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-gray-50 p-2 rounded-full text-primary hover:bg-primary hover:text-white transition-all"
                                        title="Download"
                                    >
                                        <Download className="w-6 h-6" />
                                    </a>
                                )}
                            </div>
                        ))}
                        {content.length === 0 && (
                            <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-200">
                                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 font-medium">No resources uploaded yet for this level.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Assignments Tab */}
            {activeTab === 'assignments' && (
                <div className="animate-fadeIn">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-700">Level Assessments</h2>
                        <button
                            onClick={() => setShowAssignModal(true)}
                            className="bg-primary text-white px-4 py-2 rounded-lg flex items-center shadow-md hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            New Level Assignment
                        </button>
                    </div>

                    <div className="space-y-6">
                        {assignments.map((assign) => (
                            <div key={assign._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-xl text-gray-800">{assign.title}</h3>
                                            <p className="text-gray-600 mt-1">{assign.description}</p>
                                            <div className="flex items-center mt-3 gap-4">
                                                <div className="flex items-center text-sm text-red-600 font-semibold bg-red-50 px-3 py-1 rounded-full">
                                                    <Clock className="w-4 h-4 mr-1.5" />
                                                    Deadline: {new Date(assign.deadline).toLocaleDateString()}
                                                </div>
                                                <div className="flex items-center text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                                                    <Users className="w-4 h-4 mr-1.5" />
                                                    Classes: {assign.classNames.join(', ')}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => viewSubmissions(assign)}
                                            className="bg-green-600 text-white px-5 py-2.5 rounded-lg font-bold shadow-sm hover:bg-green-700 transition-all flex items-center"
                                        >
                                            <Users className="w-4 h-4 mr-2" />
                                            View Submissions
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {assignments.length === 0 && (
                            <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-200">
                                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 font-medium">No assignments created for this level yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Submissions Modal */}
            {showSubmissionsModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">Submissions: {selectedAssignment?.title}</h3>
                                <p className="text-sm text-gray-500">Total: {submissions.length} student(s) submitted</p>
                            </div>
                            <button onClick={() => setShowSubmissionsModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                <X className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Student</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Matricule</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {submissions.map((sub) => (
                                        <tr key={sub._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-800">{sub.studentId?.fullName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">{sub.studentId?.matricule}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(sub.submittedAt).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${sub.status === 'LATE' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                                    }`}>
                                                    {sub.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <a
                                                    href={`${FILE_BASE_URL}${sub.fileUrl}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center text-primary hover:underline font-bold"
                                                >
                                                    <Download className="w-4 h-4 mr-1" />
                                                    Download
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                    {submissions.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-gray-400 italic">
                                                No submissions found for this assignment.
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-800">Bulk Upload</h3>
                            <button onClick={() => setShowContentModal(false)} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-6 h-6 text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleAddContentBulk} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Title</label>
                                <input className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none" value={contentForm.title} onChange={e => setContentForm({ ...contentForm, title: e.target.value })} required placeholder="e.g. Chapter 1: Introduction" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Resource Type</label>
                                <select className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none appearance-none bg-white" value={contentForm.type} onChange={e => setContentForm({ ...contentForm, type: e.target.value })}>
                                    <option value="COURSE">Course Material</option>
                                    <option value="TD">TD (Tutorial)</option>
                                    <option value="TP">TP (Practical Work)</option>
                                    <option value="OTHER">Other Resource</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">File</label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                        onChange={async (e) => {
                                            const url = await handleFileUpload(e.target.files[0]);
                                            if (url) setContentForm({ ...contentForm, fileUrl: url });
                                        }}
                                    />
                                    {uploading && <div className="absolute right-3 top-3"><Clock className="w-5 h-5 text-blue-500 animate-spin" /></div>}
                                </div>
                                {contentForm.fileUrl && <p className="text-xs text-green-600 mt-1 font-bold">✓ File uploaded successfully</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Description (Optional)</label>
                                <textarea className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none h-24" value={contentForm.description} onChange={e => setContentForm({ ...contentForm, description: e.target.value })} placeholder="Briefly describe this resource..." />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowContentModal(false)} className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 bg-primary text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50" disabled={uploading || !contentForm.fileUrl}>Upload to All</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assignment Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-800">New Level Assignment</h3>
                            <button onClick={() => setShowAssignModal(false)} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-6 h-6 text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleCreateAssignmentBulk} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Assignment Title</label>
                                <input className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none" value={assignForm.title} onChange={e => setAssignForm({ ...assignForm, title: e.target.value })} required placeholder="e.g. Homework 1" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Submission Deadline</label>
                                <input type="date" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none" value={assignForm.deadline} onChange={e => setAssignForm({ ...assignForm, deadline: e.target.value })} required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Instructions</label>
                                <textarea className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none h-32" value={assignForm.description} onChange={e => setAssignForm({ ...assignForm, description: e.target.value })} placeholder="Provide clear instructions for students..." />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowAssignModal(false)} className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 bg-primary text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg">Create for All</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherModuleGroup;
