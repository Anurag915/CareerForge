import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Mail, Lock, User, Briefcase, Loader2, AlertCircle, Sparkles, ArrowLeft, ChevronDown } from 'lucide-react';

import { useAuth } from '../context/AuthContext';

const SignupPage = () => {
    const { token } = useAuth();
    const navigate = useNavigate();

    // Bulletproof Redirect: Force eject logged-in users immediately
    React.useEffect(() => {
        if (token || localStorage.getItem('token')) {
            navigate('/', { replace: true });
        }
    }, [token, navigate]);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'candidate'
    });
    const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const roles = [
        { value: 'candidate', label: 'Candidate (Analyze Resumes)', description: 'Optimize resumes, get scores' },
        { value: 'hiring_manager', label: 'Hiring Manager (Rank & Compare)', description: 'Batch process, compare talent' }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await axios.post('http://127.0.0.1:5000/signup', formData);
            navigate('/login', { state: { message: "Account created! Please sign in." } });
        } catch (err) {
            setError(err.response?.data?.error || "Signup failed. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden theme-transition font-sans selection:bg-blue-500/20 selection:text-blue-500">
            
            {/* Background Decorative Gradients */}
            <div className="absolute inset-0 pointer-events-none z-0 opacity-70 dark:opacity-40">
                <div className="absolute -top-[10%] left-[20%] w-[500px] h-[500px] rounded-full bg-blue-400/20 dark:bg-blue-600/10 blur-[100px]" />
                <div className="absolute top-[40%] right-[10%] w-[600px] h-[600px] rounded-full bg-indigo-400/20 dark:bg-indigo-600/10 blur-[120px]" />
            </div>

            {/* Back to Home Link */}
            <Link 
                to="/" 
                className="absolute top-8 left-8 flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all group z-10"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Back to Home</span>
            </Link>

            {/* Main Auth Container */}
            <motion.div 
                initial={{ opacity: 0, y: 30, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 100 }}
                className="w-full max-w-[420px] bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 rounded-[32px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.12)] p-8 space-y-6 backdrop-blur-xl relative z-10"
            >
                {/* Brand Logo & Header */}
                <div className="text-center space-y-2">
                    <div className="bg-slate-900 dark:bg-accent-600 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md shadow-slate-900/10 dark:shadow-accent-600/10 hover:scale-105 transition-all">
                        <Sparkles className="w-5 h-5 text-white animate-pulse" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Join CareerForge</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Create your account to unlock AI resume analysis.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-4">
                        {/* Full Name Input */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-600" />
                                <input 
                                    type="text"
                                    required
                                    className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800/60 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:focus:border-blue-400 transition-all text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-700 font-medium"
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                        </div>

                        {/* Email Input */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Work Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-600" />
                                <input 
                                    type="email"
                                    required
                                    className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800/60 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:focus:border-blue-400 transition-all text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-700 font-medium"
                                    placeholder="john@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                        </div>

                        {/* Custom Role Select Dropdown */}
                        <div className="space-y-1.5 relative">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Access Level (Role)</label>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                                    className="w-full pl-11 pr-10 py-3 bg-white/50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800/60 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:focus:border-blue-400 transition-all text-sm text-left text-slate-900 dark:text-slate-100 font-medium flex items-center justify-between"
                                >
                                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-600 pointer-events-none" />
                                    <span className="truncate">{roles.find(r => r.value === formData.role)?.label}</span>
                                    <div className={`transition-transform duration-300 ${isRoleDropdownOpen ? 'rotate-180' : ''}`}>
                                        <ChevronDown className="w-4 h-4 text-slate-400" />
                                    </div>
                                </button>
                                
                                <AnimatePresence>
                                    {isRoleDropdownOpen && (
                                        <>
                                            {/* Click outside backdrop */}
                                            <div className="fixed inset-0 z-40" onClick={() => setIsRoleDropdownOpen(false)} />
                                            
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-2xl z-50 overflow-hidden p-1.5 space-y-1 backdrop-blur-xl"
                                            >
                                                {roles.map(r => (
                                                    <button
                                                        key={r.value}
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData({ ...formData, role: r.value });
                                                            setIsRoleDropdownOpen(false);
                                                        }}
                                                        className={`w-full text-left px-4 py-2.5 rounded-xl transition-all flex flex-col gap-0.5 ${formData.role === r.value ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'hover:bg-slate-50 dark:hover:bg-slate-900/60'}`}
                                                    >
                                                        <span className="text-xs font-bold">{r.label}</span>
                                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{r.description}</span>
                                                    </button>
                                                ))}
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Secure Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-600" />
                                <input 
                                    type="password"
                                    required
                                    className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800/60 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:focus:border-blue-400 transition-all text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-700 font-medium"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center space-x-2 text-red-500 bg-red-500/10 p-3 rounded-xl border border-red-500/20 text-[11px] font-bold"
                        >
                            <AlertCircle className="w-4 h-4 shrink-0 animate-bounce" />
                            <span>{error}</span>
                        </motion.div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-slate-900 dark:bg-accent-600 text-white rounded-xl font-bold shadow-lg shadow-slate-900/10 dark:shadow-accent-600/20 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Create Account</span>}
                    </button>
                </form>

                {/* Redirect Link */}
                <div className="text-center pt-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Already part of the network? <Link to="/login" className="text-blue-600 dark:text-blue-400 font-extrabold hover:underline">Sign In Instead</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default SignupPage;
