import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../features/auth/authSlice';
import { useTranslation } from 'react-i18next';
import { BookOpen, Lock, User as UserIcon, ArrowLeft, AlertCircle, ArrowRight } from 'lucide-react';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { user, loading, error } = useSelector((state) => state.auth);

    useEffect(() => {
        if (user) {
            if (user.role === 'ADMIN') navigate('/admin');
            else if (user.role === 'TEACHER') navigate('/teacher');
            else if (user.role === 'STUDENT') navigate('/student');
        }
    }, [user, navigate]);

    const handleSubmit = (e) => {
        e.preventDefault();
        dispatch(login({ username, password }));
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-100">
                {/* Left Side - Branding/Info */}
                <div className="md:w-1/2 bg-primary p-12 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-20 -mt-20"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-10 -mb-10"></div>

                    <div className="relative z-10">
                        <Link to="/" className="inline-flex items-center gap-2 text-blue-100 hover:text-white transition-colors mb-12">
                            <ArrowLeft className="w-4 h-4" /> Back to Home
                        </Link>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-white p-2 rounded-xl">
                                <BookOpen className="w-8 h-8 text-primary" />
                            </div>
                            <span className="text-3xl font-bold tracking-tight">E-Learn</span>
                        </div>
                        <h2 className="text-4xl font-extrabold leading-tight mb-6">
                            Welcome back to your learning portal.
                        </h2>
                        <p className="text-blue-100 text-lg leading-relaxed">
                            Access your courses, track your progress, and collaborate with your academic community.
                        </p>
                    </div>

                    <div className="relative z-10 mt-12">
                        <div className="flex items-center gap-4 text-sm text-blue-100">
                            <div className="w-10 h-10 rounded-full bg-blue-400/30 flex items-center justify-center">
                                <Lock className="w-5 h-5" />
                            </div>
                            <span>Secure, encrypted access to your academic data.</span>
                        </div>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="md:w-1/2 p-12 lg:p-16">
                    <div className="mb-10">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('login')}</h1>
                        <p className="text-gray-500">Please enter your credentials to continue.</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-700 p-4 mb-8 rounded-2xl flex items-center gap-3 animate-shake">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <span className="text-sm font-medium">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2" htmlFor="username">
                                {t('username')}
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <UserIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                                    id="username"
                                    type="text"
                                    placeholder="Enter your matricule or username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2" htmlFor="password">
                                {t('password')}
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
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            className="w-full bg-primary text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    {t('login')}
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-12 text-center">
                        <p className="text-gray-500 text-sm mb-4">
                            Don't have an account? <br />
                            <Link to="/register" className="text-primary font-bold hover:underline">Create an Admin Account</Link>
                        </p>
                        <p className="text-gray-500 text-xs">
                            Having trouble logging in? <br />
                            <a href="#" className="text-primary font-bold hover:underline">Contact your administrator</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
