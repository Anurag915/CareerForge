import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, Loader2, AlertCircle, Sparkles, ArrowLeft } from 'lucide-react';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { login, token } = useAuth();
    const navigate = useNavigate();

    // Bulletproof Redirect: Force eject logged-in users immediately
    React.useEffect(() => {
        if (token || localStorage.getItem('token')) {
            navigate('/', { replace: true });
        }
    }, [token, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/login`, { email, password });
            login(res.data.token, res.data.user);
            navigate('/', { replace: true });
        } catch (err) {
            setError(err.response?.data?.error || "Login failed. Check your credentials.");
        } finally {
            setLoading(false);
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
                <div className="text-center space-y-2">
                    <div className="bg-slate-900 dark:bg-accent-600 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md shadow-slate-900/10 dark:shadow-accent-600/10 hover:scale-105 transition-all">
                        <Sparkles className="w-5 h-5 text-white animate-pulse" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Welcome Back</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Enter your credentials to access your dashboard.</p>
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
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Password</label>
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
