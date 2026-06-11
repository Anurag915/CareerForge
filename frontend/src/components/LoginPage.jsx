import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, Loader2, AlertCircle, ArrowLeft, CheckCircle2, ShieldCheck, MailCheck, Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendMessage, setResendMessage] = useState(null);
    const [needsVerify, setNeedsVerify] = useState(false);
    
    const { login, token } = useAuth();
    const navigate = useNavigate();

    // Force redirect authenticated users
    React.useEffect(() => {
        if (token || localStorage.getItem('accessToken')) {
            navigate('/', { replace: true });
        }
    }, [token, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setNeedsVerify(false);
        setResendMessage(null);

        try {
            const res = await api.post('/login', { email, password });
            login(res.data.accessToken, res.data.user);
            navigate('/', { replace: true });
        } catch (err) {
            const errData = err.response?.data;
            if (errData?.requires_verification) {
                setNeedsVerify(true);
                setError(errData.error);
            } else {
                setError(errData?.error || "Login failed. Check your credentials.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResendVerification = async () => {
        setResendLoading(true);
        setResendMessage(null);
        try {
            const res = await api.post('/resend-verification', { email });
            setResendMessage(res.data.message);
        } catch (err) {
            setResendMessage(err.response?.data?.error || "Failed to resend link.");
        } finally {
            setResendLoading(false);
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
                        <h1 className="text-5xl xl:text-6xl font-black tracking-tight leading-[1.1]">Build Resumes That Get Interviews</h1>
                        <p className="text-slate-400 text-lg leading-relaxed max-w-md">
                            Analyze resumes, improve ATS scores, optimize keywords, and get AI-powered recommendations before applying.
                        </p>
                    </div>

                    {/* Feature List */}
                    <ul className="space-y-5">
                        {['ATS Resume Analysis', 'AI Resume Copilot', 'Resume Comparison', 'Candidate Evaluation'].map((f, i) => (
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
                    <div>
                        <div className="text-3xl font-black tracking-tight">4.9/5</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1.5">User Satisfaction</div>
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
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                        
                        {/* Header Area */}
                        <div className="text-left space-y-3">
                            <div className="lg:hidden flex items-center space-x-3 mb-8 hidden">
                                <img src="/logo.svg" alt="CareerForge Icon" className="h-12 w-12 object-contain dark:drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] dark:brightness-125" />
                                <span className="text-3xl font-extrabold tracking-tight font-outfit">
                                    <span className="text-slate-900 dark:text-white">Career</span><span className="text-blue-500 dark:text-blue-400">Forge</span>
                                </span>
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Welcome Back</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                Analyze resumes, improve ATS scores, and manage candidates with AI-powered insights.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Email */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 px-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                                    <input 
                                        type="email"
                                        required
                                        className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:focus:border-blue-400 transition-all text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 font-medium shadow-sm"
                                        placeholder="name@company.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 px-1">Secure Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                                    <input 
                                        type={showPassword ? "text" : "password"}
                                        required
                                        className="w-full pl-11 pr-12 py-3.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:focus:border-blue-400 transition-all text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 font-medium shadow-sm"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowPassword(!showPassword)} 
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Remember Me & Forgot Password */}
                            <div className="flex items-center justify-between px-1 mt-2">
                                <label className="flex items-center space-x-2 cursor-pointer group">
                                    <div className="relative flex items-center justify-center">
                                        <input 
                                            type="checkbox" 
                                            checked={rememberMe}
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500/20 dark:bg-slate-900 transition-colors cursor-pointer appearance-none checked:bg-blue-600 checked:border-blue-600"
                                        />
                                        {rememberMe && <CheckCircle2 className="w-3 h-3 text-white absolute pointer-events-none" />}
                                    </div>
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">Remember Me</span>
                                </label>
                                <Link to="/forgot-password" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                                    Forgot Password?
                                </Link>
                            </div>

                            {/* Error & Verification State */}
                            {error && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex flex-col space-y-3 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 p-4 rounded-xl border border-red-200 dark:border-red-500/20 text-xs font-bold">
                                    <div className="flex items-start space-x-2">
                                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                        <span className="leading-relaxed">{error}</span>
                                    </div>
                                    {needsVerify && (
                                        <div className="pt-2 border-t border-red-200/50 dark:border-red-500/20">
                                            <button
                                                type="button"
                                                onClick={handleResendVerification}
                                                disabled={resendLoading}
                                                className="w-full py-2.5 bg-red-100 dark:bg-red-500/20 hover:bg-red-200 dark:hover:bg-red-500/30 text-red-700 dark:text-red-300 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                                            >
                                                {resendLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><MailCheck className="w-4 h-4" /> Resend Verification Email</>}
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {resendMessage && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start space-x-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 p-3 rounded-xl border border-emerald-200 dark:border-emerald-500/20 text-xs font-bold">
                                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span className="leading-relaxed">{resendMessage}</span>
                                </motion.div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Sign In to CareerForge</span>}
                            </button>
                            
                            {/* Trust Indicators */}
                            <div className="flex items-center justify-center gap-4 pt-3">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>Secure</span>
                                </div>
                                <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <Lock className="w-3.5 h-3.5 text-blue-500" />
                                    <span>Private</span>
                                </div>
                                <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <MailCheck className="w-3.5 h-3.5 text-amber-500" />
                                    <span>Verified</span>
                                </div>
                            </div>
                        </form>

                        {/* Redirect */}
                        <div className="text-center pt-4 border-t border-slate-200 dark:border-slate-800/50">
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Don't have an account? <Link to="/signup" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">Sign up for free</Link>
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
