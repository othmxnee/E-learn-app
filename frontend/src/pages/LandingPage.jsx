import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Shield, Zap, CheckCircle, ArrowRight, Layers, UserCheck, GraduationCap } from 'lucide-react';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans">
            {/* Navigation */}
            <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                    <div className="bg-primary p-2 rounded-lg">
                        <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight text-primary">E-Learn</span>
                </div>
                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
                    <a href="#features" className="hover:text-primary transition-colors">Features</a>
                    <a href="#how-it-works" className="hover:text-primary transition-colors">How it Works</a>
                    <a href="#about" className="hover:text-primary transition-colors">About</a>
                </div>
                <Link
                    to="/login"
                    className="bg-primary text-white px-6 py-2.5 rounded-full font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                >
                    Sign In
                </Link>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-20 pb-32 overflow-hidden">
                <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="relative z-10">
                        <span className="inline-block py-1 px-3 rounded-full bg-blue-50 text-primary text-xs font-bold uppercase tracking-widest mb-6">
                            Next-Gen Learning Management
                        </span>
                        <h1 className="text-6xl lg:text-7xl font-extrabold leading-tight mb-8">
                            Empower Your <span className="text-primary">Academic</span> Journey.
                        </h1>
                        <p className="text-xl text-gray-600 mb-10 leading-relaxed max-w-lg">
                            A comprehensive E-learning platform designed for modern institutions. Seamlessly manage classes, modules, and assessments in one unified space.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                to="/login"
                                className="flex items-center justify-center gap-2 bg-primary text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-200"
                            >
                                Sign In <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                to="/register"
                                className="flex items-center justify-center gap-2 bg-white text-primary px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-50 transition-all border-2 border-primary shadow-lg shadow-blue-50"
                            >
                                Register Admin
                            </Link>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
                        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
                        <div className="relative bg-white p-8 rounded-3xl shadow-2xl border border-gray-100">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <div className="bg-blue-50 p-6 rounded-2xl">
                                        <Users className="w-8 h-8 text-blue-600 mb-2" />
                                        <h4 className="font-bold">700+ Students</h4>
                                        <p className="text-xs text-gray-500">Active learners</p>
                                    </div>
                                    <div className="bg-purple-50 p-6 rounded-2xl">
                                        <Layers className="w-8 h-8 text-purple-600 mb-2" />
                                        <h4 className="font-bold">35 Classes</h4>
                                        <p className="text-xs text-gray-500">Organized structure</p>
                                    </div>
                                </div>
                                <div className="space-y-4 pt-8">
                                    <div className="bg-green-50 p-6 rounded-2xl">
                                        <BookOpen className="w-8 h-8 text-green-600 mb-2" />
                                        <h4 className="font-bold">200+ Modules</h4>
                                        <p className="text-xs text-gray-500">Rich curriculum</p>
                                    </div>
                                    <div className="bg-orange-50 p-6 rounded-2xl">
                                        <Zap className="w-8 h-8 text-orange-600 mb-2" />
                                        <h4 className="font-bold">Real-time</h4>
                                        <p className="text-xs text-gray-500">Instant updates</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">Everything you need to succeed</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto text-lg">Powerful tools for administrators, teachers, and students to collaborate effectively.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                title: "Admin Control",
                                desc: "Manage academic structures, bulk import students, and monitor platform statistics with ease.",
                                icon: Shield,
                                color: "text-blue-600",
                                bg: "bg-blue-100"
                            },
                            {
                                title: "Teacher Hub",
                                desc: "Upload course materials, create assignments, and track student submissions by level or class.",
                                icon: UserCheck,
                                color: "text-purple-600",
                                bg: "bg-purple-100"
                            },
                            {
                                title: "Student Portal",
                                desc: "Access modules, download resources, and submit assignments with real-time status tracking.",
                                icon: GraduationCap,
                                color: "text-green-600",
                                bg: "bg-green-100"
                            }
                        ].map((feature, i) => (
                            <div key={i} className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all group">
                                <div className={`w-14 h-14 rounded-2xl ${feature.bg} ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                    <feature.icon className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="py-24">
                <div className="max-w-7xl mx-auto px-8">
                    <div className="flex flex-col lg:flex-row gap-16 items-center">
                        <div className="lg:w-1/2">
                            <h2 className="text-4xl font-bold mb-8 leading-tight">Simplified workflow for <br />academic excellence</h2>
                            <div className="space-y-8">
                                {[
                                    { step: "01", title: "Structure & Import", desc: "Admins define levels and classes, then bulk import students via CSV." },
                                    { step: "02", title: "Module Allocation", desc: "Modules are assigned to classes and teachers for the academic year." },
                                    { step: "03", title: "Learning & Assessment", desc: "Teachers share content and students submit assignments for evaluation." }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-6">
                                        <div className="text-4xl font-black text-blue-100">{item.step}</div>
                                        <div>
                                            <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                                            <p className="text-gray-600">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="lg:w-1/2 bg-primary rounded-3xl p-12 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-20 -mt-20"></div>
                            <h3 className="text-3xl font-bold mb-6">Ready to transform your learning experience?</h3>
                            <p className="text-blue-100 mb-8 text-lg">Join hundreds of students and teachers already using E-Learn to streamline their education.</p>
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-50 transition-all"
                            >
                                Start Now <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-16">
                <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary p-2 rounded-lg">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight">E-Learn</span>
                    </div>
                    <p className="text-gray-400">© 2026 E-Learn Platform. All rights reserved.</p>
                    <div className="flex gap-6 text-gray-400">
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms</a>
                        <a href="#" className="hover:text-white transition-colors">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
