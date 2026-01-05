import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { User, Lock, Save, Shield, BadgeCheck } from 'lucide-react';
import toast from 'react-hot-toast';

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
    const [submitting, setSubmitting] = useState(false);

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

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setSubmitting(true);
        const loadingToast = toast.loading('Updating password...');
        try {
            await api.post('/auth/change-password', {
                oldPassword: passwordForm.oldPassword,
                newPassword: passwordForm.newPassword
            });
            toast.success('Password updated successfully!', { id: loadingToast });
            setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            console.error('Error updating password:', error);
            toast.error(error.response?.data?.message || 'Error updating password', { id: loadingToast });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Profile Information */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary opacity-5 rounded-full -mr-16 -mt-16"></div>
                <div className="flex items-center gap-4 mb-8 relative z-10">
                    <div className="bg-blue-50 p-3 rounded-2xl">
                        <User className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
                        <p className="text-gray-500 font-medium">Manage your personal account details</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                    <div className="space-y-1">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400">Full Name</label>
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-gray-800">
                            {profile?.fullName}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400">Account Role</label>
                        <div className="flex">
                            <span className={`px-4 py-2 rounded-2xl text-sm font-black uppercase tracking-widest flex items-center gap-2 ${profile?.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                                profile?.role === 'TEACHER' ? 'bg-blue-100 text-blue-700' :
                                    'bg-green-100 text-green-700'
                                }`}>
                                <Shield className="w-4 h-4" />
                                {profile?.role}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400">Username</label>
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-gray-800">
                            {profile?.username}
                        </div>
                    </div>

                    {profile?.role === 'STUDENT' && (
                        <div className="space-y-1">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-400">Matricule</label>
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-gray-800 flex items-center gap-2">
                                <BadgeCheck className="w-5 h-5 text-green-500" />
                                {profile?.matricule || profile?.username}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                <div className="flex items-center gap-4 mb-8">
                    <div className="bg-red-50 p-3 rounded-2xl">
                        <Lock className="w-8 h-8 text-red-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Security</h2>
                        <p className="text-gray-500 font-medium">Update your password to keep your account secure</p>
                    </div>
                </div>

                <form onSubmit={handlePasswordChange} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2 block">Current Password</label>
                        <input
                            type="password"
                            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                            value={passwordForm.oldPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                            required
                            placeholder="••••••••"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2 block">New Password</label>
                        <input
                            type="password"
                            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            required
                            minLength={6}
                            placeholder="••••••••"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2 block">Confirm New Password</label>
                        <input
                            type="password"
                            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            required
                            minLength={6}
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="md:col-span-2 pt-4">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="bg-primary text-white px-10 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center gap-2 disabled:opacity-50"
                        >
                            {submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><Save className="w-5 h-5" /> Update Password</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Profile;
