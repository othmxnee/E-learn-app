import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LandingPage from './pages/LandingPage';
import DashboardLayout from './components/layout/DashboardLayout';
import AdminDashboard from './features/admin/AdminDashboard';
import UserManagement from './features/admin/UserManagement';
import StructureManagement from './features/admin/StructureManagement';
import ModuleManagement from './features/admin/ModuleManagement';
import ModuleList from './features/dashboard/ModuleList';
import ModuleDetails from './features/dashboard/ModuleDetails';
import Profile from './features/common/Profile';

function App() {
    const { user } = useSelector((state) => state.auth);

    const getRedirectPath = () => {
        if (!user) return null;
        if (user.role === 'ADMIN') return '/admin';
        if (user.role === 'TEACHER') return '/teacher';
        if (user.role === 'STUDENT') return '/student';
        return null;
    };

    const redirectPath = getRedirectPath();

    return (
        <Router>
            <Routes>
                <Route path="/" element={redirectPath ? <Navigate to={redirectPath} replace /> : <LandingPage />} />
                <Route path="/login" element={redirectPath ? <Navigate to={redirectPath} replace /> : <LoginPage />} />
                <Route path="/register" element={redirectPath ? <Navigate to={redirectPath} replace /> : <RegisterPage />} />

                <Route path="/admin" element={<DashboardLayout role="ADMIN" />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="users" element={<UserManagement />} />
                    <Route path="structure" element={<StructureManagement />} />
                    <Route path="modules" element={<ModuleManagement />} />
                    <Route path="profile" element={<Profile />} />
                </Route>

                <Route path="/teacher" element={<DashboardLayout role="TEACHER" />}>
                    <Route index element={<Navigate to="modules" replace />} />
                    <Route path="modules" element={<ModuleList />} />
                    <Route path="modules/:id" element={<ModuleDetails />} />
                    <Route path="profile" element={<Profile />} />
                </Route>

                <Route path="/student" element={<DashboardLayout role="STUDENT" />}>
                    <Route index element={<Navigate to="modules" replace />} />
                    <Route path="modules" element={<ModuleList />} />
                    <Route path="modules/:id" element={<ModuleDetails />} />
                    <Route path="profile" element={<Profile />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;
