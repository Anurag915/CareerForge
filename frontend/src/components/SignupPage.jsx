import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Mail, Lock, User, Briefcase, Loader2, AlertCircle, ArrowLeft, ChevronDown, CheckCircle2, Inbox, ShieldCheck, Eye, EyeOff } from 'lucide-react';

import { useAuth } from '../context/AuthContext';

const SignupPage = () => {
    const { token } = useAuth();
    const navigate = useNavigate();

    // Force redirect authenticated users
    React.useEffect(() => {
        if (token || localStorage.getItem('accessToken')) {
            navigate('/', { replace: true });
        }
    }, [token, navigate]);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'candidate'
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [signupSuccess, setSignupSuccess] = useState(false);

    const roles = [
        { value: 'candidate', label: 'Candidate', description: 'Optimize resumes and improve ATS scores.' },
        { value: 'hiring_manager', label: 'Recruiter', description: 'Compare candidates and evaluate talent.' }
    ];

    const minLength = formData.password.length >= 8;
    const hasNumber = /\d/.test(formData.password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);
    const isPasswordValid = minLength && hasNumber && hasSpecial;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isPasswordValid) {
            setError("Please meet all password requirements.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await api.post('/signup', formData);
            setSignupSuccess(true);
        } catch (err) {
            setError(err.response?.data?.error || "Signup failed. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex text-slate-900 dark:text-slate-100 font-sans theme-transition selection:bg-blue-500/20 selection:text-blue-500">
            
            {/* Left Panel - Branding (Desktop only) */}
            <div className="hidden lg:flex flex-col justify-between w-[45%] max-w-[600px] bg-slate-900 text-white p-12 lg:p-16 relative overflow-hidden border-r border-slate-800">
                {/* Decorative Gradients */}
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />

                <div className="relative z-10 space-y-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-3 w-fit group">
                        <img src="/logo.svg" alt="CareerForge Icon" className="h-10 w-10 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] brightness-125 group-hover:scale-105 transition-transform" />
                        <span className="text-2xl font-extrabold tracking-tight font-outfit">
                            <span className="text-white">Career</span><span className="text-blue-400">Forge</span>
                        </span>
                    </Link>

                    {/* Value Prop */}
                    <div className="space-y-6">
                        <h1 className="text-5xl xl:text-6xl font-black tracking-tight leading-[1.1]">Build a Resume That Gets Interviews</h1>
                        <p className="text-slate-400 text-lg leading-relaxed max-w-md">
                            Analyze resumes, improve ATS scores, optimize keywords, and get AI-powered recommendations in seconds.
                        </p>
                    </div>

                    {/* Feature List */}
                    <ul className="space-y-5">
                        {['ATS Resume Analysis', 'AI Resume Copilot', 'Resume Comparison', 'Job Match Insights'].map((f, i) => (
                            <li key={i} className="flex items-center gap-4 text-slate-300">
                                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                                </div>
                                <span className="font-semibold">{f}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Subtle Statistics */}
                <div className="relative z-10 flex gap-12 pt-12 border-t border-slate-800/50 mt-12">
                    <div>
                        <div className="text-3xl font-black tracking-tight">10,000+</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1.5">Resumes Analyzed</div>
                    </div>
                    <div>
                        <div className="text-3xl font-black tracking-tight">94%</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1.5">ATS Accuracy</div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Auth Form */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-y-auto">
                {/* Mobile Brand Navigation */}
                <Link to="/" className="absolute top-8 left-6 lg:hidden flex items-center gap-3 group z-20 hover:scale-105 opacity-90 hover:opacity-100 transition-all duration-200">
                    <img src="/logo.svg" alt="CareerForge Icon" className="h-8 w-8 object-contain dark:drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] dark:brightness-125" />
                    <span className="text-xl font-extrabold tracking-tight font-outfit">
                        <span className="text-slate-900 dark:text-white">Career</span><span className="text-blue-500 dark:text-blue-400">Forge</span>
                    </span>
                </Link>

                <div className="w-full max-w-[460px] space-y-8 py-12">
                    {!signupSuccess ? (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                            
                            {/* Mobile Logo & Header */}
                            <div className="text-left space-y-3">
                                <div className="lg:hidden flex items-center space-x-3 mb-8 hidden">
                                    <img src="/logo.svg" alt="CareerForge Icon" className="h-12 w-12 object-contain dark:drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] dark:brightness-125" />
                                    <span className="text-3xl font-extrabold tracking-tight font-outfit">
                                        <span className="text-slate-900 dark:text-white">Career</span><span className="text-blue-500 dark:text-blue-400">Forge</span>
                                    </span>
                                </div>
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Create an account</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Get ATS scores, resume insights, and AI-powered recommendations to improve your chances of landing interviews.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-4">
                                    {/* Full Name */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 px-1">Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                                            <input 
                                                type="text"
                                                required
                                                className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:focus:border-blue-400 transition-all text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 font-medium shadow-sm"
                                                placeholder="John Doe"
                                                value={formData.name}
                                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            />
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 px-1">Work Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                                            <input 
                                                type="email"
                                                required
                                                className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:focus:border-blue-400 transition-all text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 font-medium shadow-sm"
                                                placeholder="john@example.com"
                                                value={formData.email}
                                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            />
                                        </div>
                                    </div>

                                    {/* Role Dropdown */}
                                    <div className="space-y-1.5 relative z-20">
                                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 px-1">I want to...</label>
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                                                className="w-full pl-11 pr-11 py-3.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:focus:border-blue-400 transition-all text-sm text-left text-slate-900 dark:text-slate-100 font-medium shadow-sm relative block"
                                            >
                                                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                                                <span className="truncate block">{roles.find(r => r.value === formData.role)?.label}</span>
                                                <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-transform duration-300 pointer-events-none ${isRoleDropdownOpen ? 'rotate-180' : ''}`}>
                                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                                </div>
                                            </button>
                                            
                                            <AnimatePresence>
                                                {isRoleDropdownOpen && (
                                                    <>
                                                        <div className="fixed inset-0 z-40" onClick={() => setIsRoleDropdownOpen(false)} />
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            exit={{ opacity: 0, y: 10, scale: 0.98 }}
                                                            className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden p-2 space-y-1"
                                                        >
                                                            {roles.map(r => (
                                                                <button
                                                                    key={r.value}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setFormData({ ...formData, role: r.value });
                                                                        setIsRoleDropdownOpen(false);
                                                                    }}
                                                                    className={`w-full text-left px-4 py-3 rounded-xl transition-all flex flex-col gap-1 ${formData.role === r.value ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                                                                >
                                                                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{r.label}</span>
                                                                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{r.description}</span>
                                                                </button>
                                                            ))}
                                                        </motion.div>
                                                    </>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    {/* Password */}
                                    <div className="space-y-1.5 z-10">
                                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 px-1">Secure Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                                            <input 
                                                type={showPassword ? "text" : "password"}
                                                required
                                                className="w-full pl-11 pr-12 py-3.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:focus:border-blue-400 transition-all text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 font-medium shadow-sm"
                                                placeholder="••••••••"
                                                value={formData.password}
                                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => setShowPassword(!showPassword)} 
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {/* Password Requirements */}
                                        <div className="flex flex-col gap-1.5 pt-2 px-1">
                                            <div className={`flex items-center gap-2 text-[11px] font-bold transition-colors ${minLength ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                <CheckCircle2 className="w-3.5 h-3.5" /> <span>Minimum 8 characters</span>
                                            </div>
                                            <div className={`flex items-center gap-2 text-[11px] font-bold transition-colors ${hasNumber ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                <CheckCircle2 className="w-3.5 h-3.5" /> <span>At least 1 number</span>
                                            </div>
                                            <div className={`flex items-center gap-2 text-[11px] font-bold transition-colors ${hasSpecial ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                <CheckCircle2 className="w-3.5 h-3.5" /> <span>At least 1 special character</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex items-center space-x-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 p-3 rounded-xl border border-red-200 dark:border-red-500/20 text-xs font-bold">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        <span>{error}</span>
                                    </motion.div>
                                )}

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Create Account</span>}
                                </button>
                                
                                {/* Trust Indicators */}
                                <div className="flex items-center justify-center gap-4 pt-2">
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                        <span>Secure</span>
                                    </div>
                                    <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <Mail className="w-3.5 h-3.5 text-blue-500" />
                                        <span>Verified</span>
                                    </div>
                                </div>
                            </form>

                            {/* Redirect */}
                            <div className="text-center pt-4 border-t border-slate-200 dark:border-slate-800/50">
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Already have an account? <Link to="/login" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">Sign in</Link>
                                </p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8 text-center py-12">
                            <div className="flex justify-center">
                                <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 rounded-3xl flex items-center justify-center shadow-inner border border-emerald-100 dark:border-emerald-500/20 relative">
                                    <Inbox className="w-10 h-10" />
                                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-950">
                                        <CheckCircle2 className="w-3 h-3 text-white" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Check Your Inbox</h2>
                                <p className="text-slate-500 dark:text-slate-400 text-base max-w-sm mx-auto leading-relaxed">
                                    We've sent a verification link to <strong className="text-slate-900 dark:text-white">{formData.email}</strong>. Please click the link to activate your account.
                                </p>
                            </div>
                            <div className="pt-6 space-y-3">
                                <a href="https://mail.google.com" target="_blank" rel="noreferrer" className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold shadow-lg block transition-all hover:bg-slate-800 dark:hover:bg-slate-100">
                                    Open Gmail
                                </a>
                                <Link to="/login" className="w-full py-4 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-xl font-bold block transition-all hover:bg-slate-200 dark:hover:bg-slate-800">
                                    Go to Login
                                </Link>
                                <button onClick={() => alert('Verification email resent!')} className="text-sm font-bold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 mt-4 transition-colors">
                                    Resend Verification Email
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SignupPage;
