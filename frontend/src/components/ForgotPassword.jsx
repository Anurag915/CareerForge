import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, KeyRound, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../services/api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/forgot-password', { email });
            setSubmitted(true);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to process request. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors duration-300">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-8 shadow-xl overflow-hidden relative"
            >
                {/* Decorative grid blur */}
                <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/20 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0))] opacity-30 pointer-events-none"></div>
                
                <div className="relative z-10">
                    <div className="mb-6 flex justify-center">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center shadow-inner">
                            <KeyRound className="w-8 h-8 text-slate-500" />
                        </div>
                    </div>

                    {!submitted ? (
                        <div className="space-y-6">
                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Forgot Password?</h2>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">
                                    Enter your account email address and we will dispatch a secured 1-hour password reset link.
                                </p>
                            </div>

                            <AnimatePresence mode="wait">
                                {error && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/10 text-red-600 dark:text-red-400 p-3 rounded-xl text-xs font-medium flex items-center gap-2"
                                    >
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        <span>{error}</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="email" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input 
                                            id="email"
                                            type="email" 
                                            required
                                            placeholder="name@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:ring-4 focus:ring-accent-500/10 focus:border-accent-500 transition-all"
                                        />
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-accent-600 dark:hover:bg-accent-700 text-white font-bold py-3 px-4 rounded-xl transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-lg"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Requesting Reset...</span>
                                        </>
                                    ) : (
                                        <span>Send Recovery Link</span>
                                    )}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-6 text-center"
                        >
                            <div className="flex justify-center">
                                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Dispatch Complete</h2>
                                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                    If <strong>{email}</strong> exists within the CareerForge registries, a reset link is landing in your inbox shortly. Please check your SPAM folder as well!
                                </p>
                            </div>
                        </motion.div>
                    )}

                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <Link to="/login" className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Back to Sign In</span>
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
