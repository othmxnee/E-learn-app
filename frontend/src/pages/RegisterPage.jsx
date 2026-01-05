import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { login } from '../features/auth/authSlice';
import { BookOpen, Lock, User as UserIcon, ArrowLeft, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        matricule: '',
        password: '',
        confirmPassword: ''
    });
    const [localError, setLocalError] = useState('');
    const [loading, setLoading] = useState(false);

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    useEffect(() => {
        if (user) {
            if (user.role === 'ADMIN') navigate('/admin');
            else if (user.role === 'TEACHER') navigate('/teacher');
            else if (user.role === 'STUDENT') navigate('/student');
        }
    }, [user, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');

        if (formData.password !== formData.confirmPassword) {
            setLocalError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/register-admin', {
                fullName: formData.fullName,
                username: formData.username,
                matricule: formData.matricule,
                password: formData.password
            });

            // Auto login after registration
            dispatch(login({ username: formData.username, password: formData.password }));
        } catch (err) {
            setLocalError(err.response?.data?.message || 'Registration failed');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-5xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-100">
                {/* Left Side - Info */}
                <div className="md:w-2/5 bg-primary p-12 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-20 -mt-20"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-10 -mb-10"></div>

                    <div className="relative z-10">
                        <Link to="/login" className="inline-flex items-center gap-2 text-blue-100 hover:text-white transition-colors mb-12">
                            <ArrowLeft className="w-4 h-4" /> Back to Login
                        </Link>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-white p-2 rounded-xl">
                                <BookOpen className="w-8 h-8 text-primary" />
                            </div>
                            <span className="text-3xl font-bold tracking-tight">E-Learn</span>
                        </div>
                        <h2 className="text-4xl font-extrabold leading-tight mb-6">
                            Create an Admin Account.
                        </h2>
                        <p className="text-blue-100 text-lg leading-relaxed">
                            Join our platform as an administrator to manage academic structures, users, and module allocations.
                        </p>
                    </div>

                    <div className="relative z-10 mt-12">
                        <div className="flex items-center gap-4 text-sm text-blue-100">
                            <div className="w-10 h-10 rounded-full bg-blue-400/30 flex items-center justify-center">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <span>Full administrative control over the platform.</span>
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="md:w-3/5 p-12 lg:p-16">
                    <div className="mb-10">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Registration</h1>
                        <p className="text-gray-500">Fill in the details to create your administrator profile.</p>
                    </div>

                    {localError && (
                        <div className="bg-red-50 border border-red-100 text-red-700 p-4 mb-8 rounded-2xl flex items-center gap-3 animate-shake">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <span className="text-sm font-medium">{localError}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-2" htmlFor="fullName">
                                Full Name
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <UserIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                                    id="fullName"
                                    type="text"
                                    placeholder="John Doe"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2" htmlFor="username">
                                Username
                            </label>
                            <input
                                className="block w-full px-4 py-3.5 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                                id="username"
                                type="text"
                                placeholder="johndoe"
                                value={formData.username}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2" htmlFor="matricule">
                                Matricule
                            </label>
                            <input
                                className="block w-full px-4 py-3.5 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                                id="matricule"
                                type="text"
                                placeholder="ADM001"
                                value={formData.matricule}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2" htmlFor="password">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2" htmlFor="confirmPassword">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2 pt-4">
                            <button
                                className="w-full bg-primary text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        Create Admin Account
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-gray-500 text-sm">
                            Already have an account? <br />
                            <Link to="/login" className="text-primary font-bold hover:underline">Sign in here</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
