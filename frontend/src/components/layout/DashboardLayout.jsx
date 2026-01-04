import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Outlet, Link } from 'react-router-dom';
import { logout } from '../../features/auth/authSlice';
import { LogOut, User, BookOpen, Layers, Users } from 'lucide-react';

const DashboardLayout = ({ role }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const adminLinks = [
        { name: 'Users', path: '/admin/users', icon: Users },
        { name: 'Academic Structure', path: '/admin/structure', icon: Layers },
        { name: 'Modules', path: '/admin/modules', icon: BookOpen },
        { name: 'Profile', path: '/admin/profile', icon: User },
    ];

    const teacherLinks = [
        { name: 'My Modules', path: '/teacher/modules', icon: BookOpen },
        { name: 'Profile', path: '/teacher/profile', icon: User },
    ];

    const studentLinks = [
        { name: 'My Modules', path: '/student/modules', icon: BookOpen },
        { name: 'Profile', path: '/student/profile', icon: User },
    ];

    let links = [];
    if (role === 'ADMIN') links = adminLinks;
    else if (role === 'TEACHER') links = teacherLinks;
    else if (role === 'STUDENT') links = studentLinks;

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="w-64 bg-white shadow-md">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-primary">E-Learn</h1>
                </div>
                <nav className="mt-6">
                    {links.map((link) => (
                        <Link
                            key={link.name}
                            to={link.path}
                            className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-primary"
                        >
                            <link.icon className="w-5 h-5 mr-3" />
                            {link.name}
                        </Link>
                    ))}
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="flex items-center justify-between px-6 py-4 bg-white shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>
                    <div className="flex items-center gap-4">
                        <span className="text-gray-600">{user?.fullName}</span>
                        <button
                            onClick={handleLogout}
                            className="flex items-center text-gray-600 hover:text-red-600"
                        >
                            <LogOut className="w-5 h-5 mr-1" />
                            Logout
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
