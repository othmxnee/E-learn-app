import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { BookOpen } from 'lucide-react';

const ModuleList = () => {
    const [allocations, setAllocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const rolePrefix = location.pathname.split('/')[1]; // 'teacher' or 'student'

    useEffect(() => {
        fetchModules();
    }, []);

    const fetchModules = async () => {
        try {
            const response = await api.get('/modules');
            setAllocations(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching modules:', error);
            setLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-64 text-gray-500">Loading modules...</div>;

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-8">
                {rolePrefix === 'teacher' ? 'My Teaching Modules' : 'My Courses'}
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {allocations.map((alloc) => (
                    <Link
                        key={alloc._id}
                        to={`/${rolePrefix}/modules/${alloc._id}`}
                        className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all overflow-hidden flex flex-col"
                    >
                        <div className="p-8 flex-1">
                            <div className="flex items-center justify-between mb-6">
                                <div className="p-3 bg-blue-50 rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                    <BookOpen className="w-8 h-8" />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">{alloc.moduleId.code || 'MOD'}</span>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors">{alloc.moduleId.name}</h3>
                            <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed">{alloc.moduleId.description}</p>
                        </div>
                        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                            <span className="text-sm font-bold text-primary">{alloc.levelId?.name || 'All Levels'}</span>
                            <div className="flex items-center text-xs text-gray-400 font-medium">
                                View Details
                            </div>
                        </div>
                    </Link>
                ))}
                {allocations.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                        <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">No modules assigned yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ModuleList;
