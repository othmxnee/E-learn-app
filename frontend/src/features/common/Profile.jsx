import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { User, Lock, Save } from 'lucide-react';

const Profile = () => {
    const { userInfo } = useSelector((state) => state.auth);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Password change form
    const [passwordForm, setPasswordForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/auth/me');
            setProfile(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching profile:', error);
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        // Validation
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError('New passwords do not match');
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            setPasswordError('Password must be at least 6 characters');
            return;
        }

        try {
            await api.post('/auth/change-password', {
                oldPassword: passwordForm.oldPassword,
                newPassword: passwordForm.newPassword
            });
            setPasswordSuccess('Password updated successfully!');
            setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            setPasswordError(error.response?.data?.message || 'Error updating password');
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Profile Information */}
            <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center mb-6">
                    <User className="w-6 h-6 mr-2 text-primary" />
                    <h2 className="text-2xl font-bold text-gray-800">Profile Information</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <div className="p-3 bg-gray-50 rounded border">
                            {profile?.fullName}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <div className="p-3 bg-gray-50 rounded border">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${profile?.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                                    profile?.role === 'TEACHER' ? 'bg-blue-100 text-blue-800' :
                                        'bg-green-100 text-green-800'
                                }`}>
                                {profile?.role}
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <div className="p-3 bg-gray-50 rounded border">
                            {profile?.username}
                        </div>
                    </div>

                    {userInfo?.role === 'STUDENT' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Matricule</label>
                            <div className="p-3 bg-gray-50 rounded border">
                                {profile?.username}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Change Password */}
            <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center mb-6">
                    <Lock className="w-6 h-6 mr-2 text-primary" />
                    <h2 className="text-2xl font-bold text-gray-800">Change Password</h2>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Current Password
                        </label>
                        <input
                            type="password"
                            className="w-full p-3 border rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                            value={passwordForm.oldPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            New Password
                        </label>
                        <input
                            type="password"
                            className="w-full p-3 border rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            required
                            minLength={6}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirm New Password
                        </label>
                        <input
                            type="password"
                            className="w-full p-3 border rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            required
                            minLength={6}
                        />
                    </div>

                    {passwordError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                            {passwordError}
                        </div>
                    )}

                    {passwordSuccess && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
                            {passwordSuccess}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="bg-primary text-white px-6 py-3 rounded hover:bg-blue-700 flex items-center"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        Update Password
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Profile;
