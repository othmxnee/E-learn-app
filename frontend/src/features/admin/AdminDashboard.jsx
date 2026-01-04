import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Users, Layers, BookOpen, GraduationCap, UserCheck } from 'lucide-react';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        students: 0,
        teachers: 0,
        classes: 0,
        modules: 0,
        totalUsers: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/admin/stats');
                setStats(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching stats:', error);
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const statCards = [
        { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
        { title: 'Students', value: stats.students, icon: GraduationCap, color: 'text-green-600', bg: 'bg-green-100' },
        { title: 'Teachers', value: stats.teachers, icon: UserCheck, color: 'text-purple-600', bg: 'bg-purple-100' },
        { title: 'Classes', value: stats.classes, icon: Layers, color: 'text-orange-600', bg: 'bg-orange-100' },
        { title: 'Modules', value: stats.modules, icon: BookOpen, color: 'text-red-600', bg: 'bg-red-100' },
    ];

    if (loading) return <div className="flex justify-center items-center h-64">Loading statistics...</div>;

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Admin Overview</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {statCards.map((card, index) => (
                    <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-xl ${card.bg} ${card.color}`}>
                                <card.icon className="w-6 h-6" />
                            </div>
                        </div>
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{card.title}</h3>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Quick Actions or Recent Activity could go here */}
            <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Platform Growth</h2>
                    <p className="text-gray-600">The platform currently hosts {stats.students} students and {stats.teachers} teachers across {stats.classes} classes. A total of {stats.modules} modules are being managed.</p>
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">System Status</h2>
                    <div className="flex items-center text-green-600 font-medium">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                        All systems operational
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
