import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, Loader2, AlertCircle, Sparkles, ArrowLeft, CheckCircle2 } from 'lucide-react';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center px-6 relative overflow-hidden theme-transition font-sans selection:bg-blue-500/20 selection:text-blue-500">
            
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
                className="w-full max-w-[400px] bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 rounded-[32px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.12)] p-8 space-y-6 backdrop-blur-xl relative z-10"
            >
                {/* Brand Logo & Header */}
                <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <img src="/logo.svg" alt="CareerForge Icon" className="h-16 w-16 object-contain dark:drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] dark:brightness-125" />
                        <span className="text-3xl font-extrabold tracking-tight font-outfit">
                            <span className="text-slate-900 dark:text-white">Career</span><span className="text-blue-500 dark:text-blue-400">Forge</span>
                        </span>
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Welcome Back</h1>
                        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1 mb-6">AI Resume Analyzer & Copilot</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email Input */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-600" />
                            <input 
                                type="email"
                                required
                                className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800/60 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:focus:border-blue-400 transition-all text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-700 font-medium"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Password</label>
                            <Link to="/forgot-password" className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline">Forgot Password?</Link>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-600" />
                            <input 
                                type="password"
                                required
                                className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800/60 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:focus:border-blue-400 transition-all text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-700 font-medium"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex flex-col space-y-2 text-red-500 bg-red-500/10 p-3 rounded-xl border border-red-500/20 text-[11px] font-bold"
                        >
                            <div className="flex items-center space-x-2">
                                <AlertCircle className="w-4 h-4 shrink-0 animate-bounce" />
                                <span>{error}</span>
                            </div>
                            {needsVerify && (
                                <button
                                    type="button"
                                    onClick={handleResendVerification}
                                    disabled={resendLoading}
                                    className="mt-1 text-left text-[10px] text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
                                >
                                    {resendLoading ? "Dispatching link..." : "➡️ Click here to Resend Verification Link"}
                                </button>
                            )}
                        </motion.div>
                    )}

                    {resendMessage && (
                        <motion.div 
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-[11px] font-bold"
                        >
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>{resendMessage}</span>
                        </motion.div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-slate-900 dark:bg-accent-600 text-white rounded-xl font-bold shadow-lg shadow-slate-900/10 dark:shadow-accent-600/20 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Sign In</span>}
                    </button>
                </form>

                {/* Redirect Link */}
                <div className="text-center pt-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Don't have an account? <Link to="/signup" className="text-blue-600 dark:text-blue-400 font-extrabold hover:underline">Create Account</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
