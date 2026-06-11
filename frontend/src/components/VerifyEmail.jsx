import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, Mail, ArrowRight } from 'lucide-react';
import api from '../services/api';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [errorMessage, setErrorMessage] = useState('');
    
    const token = searchParams.get('token');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setErrorMessage('Verification token is missing.');
            return;
        }

        const performVerification = async () => {
            try {
                await api.post('/verify-email', { token });
                setStatus('success');
            } catch (err) {
                setStatus('error');
                setErrorMessage(err.response?.data?.error || 'This verification link is invalid or has expired.');
            }
        };

        performVerification();
    }, [token]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors duration-300 relative">
            
            {/* Brand Navigation */}
            <Link to="/" className="absolute top-8 left-8 flex items-center gap-3 group z-20 hover:scale-105 opacity-90 hover:opacity-100 transition-all duration-200">
                <img src="/logo.svg" alt="CareerForge Icon" className="h-8 w-8 object-contain dark:drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] dark:brightness-125" />
                <span className="text-xl font-extrabold tracking-tight font-outfit hidden sm:block">
                    <span className="text-slate-900 dark:text-white">Career</span><span className="text-blue-500 dark:text-blue-400">Forge</span>
                </span>
            </Link>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 backdrop-blur-xl rounded-3xl p-8 text-center shadow-xl"
            >
                <div className="mb-6 flex justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center shadow-inner">
                        <Mail className="w-8 h-8 text-slate-500" />
                    </div>
                </div>

                {status === 'verifying' && (
                    <div className="space-y-4">
                        <div className="flex justify-center">
                            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Confirming Address</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Please hold while we securely verify your verification token against Neon DB...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="space-y-6">
                        <div className="flex justify-center">
                            <motion.div 
                                initial={{ scale: 0.5, rotate: -45 }} 
                                animate={{ scale: 1, rotate: 0 }} 
                                className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center"
                            >
                                <CheckCircle className="w-8 h-8" />
                            </motion.div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Verification Success!</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Your account is now active. You can unlock CareerForge and explore all AI analysis components.</p>
                        </div>
                        <button 
                            onClick={() => navigate('/login')}
                            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-accent-600 dark:hover:bg-accent-700 text-white font-bold py-3 px-4 rounded-xl transition-all active:scale-98 shadow-lg"
                        >
                            <span>Proceed to Log In</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="space-y-6">
                        <div className="flex justify-center">
                            <motion.div 
                                initial={{ scale: 0.5, rotate: 45 }} 
                                animate={{ scale: 1, rotate: 0 }} 
                                className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center"
                            >
                                <XCircle className="w-8 h-8" />
                            </motion.div>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Verification Failed</h2>
                            <p className="text-red-600 dark:text-red-400 text-xs mt-2 bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10 rounded-xl p-3 font-medium leading-relaxed">
                                {errorMessage}
                            </p>
                        </div>
                        <div className="space-y-3">
                            <button 
                                onClick={() => navigate('/login')}
                                className="w-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3 px-4 rounded-xl transition-all"
                            >
                                Go Back to Sign In
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default VerifyEmail;
