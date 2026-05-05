import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await axios.post('http://127.0.0.1:5000/login', { email, password });
            login(res.data.token, res.data.user);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || "Login failed. Check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[60vh] flex items-center justify-center theme-transition">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[380px] bg-white dark:bg-slate-800/50 rounded-3xl shadow-premium border border-slate-200 dark:border-slate-700 p-7 space-y-6"
            >
                <div className="text-center space-y-1.5">
                    <div className="bg-slate-900 dark:bg-accent-600 w-11 h-11 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <LogIn className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Welcome Back</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Enter your credentials to access your dashboard.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest px-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500/50 dark:text-slate-500/30" />
                            <input 
                                type="email"
                                required
                                className="w-full pl-11 pr-4 py-3 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-4 focus:ring-accent-500/5 focus:border-accent-500 transition-all text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest px-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500/50 dark:text-slate-500/30" />
                            <input 
                                type="password"
                                required
                                className="w-full pl-11 pr-4 py-3 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-4 focus:ring-accent-500/5 focus:border-accent-500 transition-all text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600"
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
                            className="flex items-center space-x-2 text-red-500 bg-red-500/10 p-3 rounded-xl border border-red-500/20 text-[11px] font-medium"
                        >
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </motion.div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-slate-900 dark:bg-accent-600 text-white rounded-xl font-semibold shadow-subtle hover:bg-slate-800 dark:hover:bg-accent-700 transition-all flex items-center justify-center space-x-2 active:scale-[0.98]"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Sign In</span>}
                    </button>
                </form>

                <div className="text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                        Don't have an account? <Link to="/signup" className="text-accent-500 dark:text-accent-400 font-bold hover:underline">Create Account</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
