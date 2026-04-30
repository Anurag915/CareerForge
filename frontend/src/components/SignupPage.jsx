import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, User, Briefcase, Loader2, AlertCircle } from 'lucide-react';

const SignupPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'candidate'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await axios.post('http://localhost:5000/signup', formData);
            navigate('/login', { state: { message: "Account created! Please sign in." } });
        } catch (err) {
            setError(err.response?.data?.error || "Signup failed. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[90vh] flex items-center justify-center">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[420px] bg-white rounded-3xl shadow-card border border-brand-100 p-7 space-y-6"
            >
                <div className="text-center space-y-1.5">
                    <div className="bg-emerald-600 w-11 h-11 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <UserPlus className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-brand-900 tracking-tight">Join CareerForge</h1>
                    <p className="text-xs text-brand-500">Create your account to unlock AI resume analysis.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 gap-5">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-brand-500 uppercase tracking-widest px-1">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-300" />
                                <input 
                                    type="text"
                                    required
                                    className="w-full pl-11 pr-4 py-3 bg-brand-50/50 border border-brand-100 rounded-xl outline-none focus:ring-2 focus:ring-brand-900/5 transition-all text-sm"
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-brand-500 uppercase tracking-widest px-1">Work Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-300" />
                                <input 
                                    type="email"
                                    required
                                    className="w-full pl-11 pr-4 py-3 bg-brand-50/50 border border-brand-100 rounded-xl outline-none focus:ring-2 focus:ring-brand-900/5 transition-all text-sm"
                                    placeholder="john@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-brand-500 uppercase tracking-widest px-1">Access Level (Role)</label>
                            <div className="relative">
                                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-300" />
                                <select 
                                    className="w-full pl-11 pr-4 py-3 bg-brand-50/50 border border-brand-100 rounded-xl outline-none focus:ring-2 focus:ring-brand-900/5 transition-all text-sm appearance-none cursor-pointer"
                                    value={formData.role}
                                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                                >
                                    <option value="candidate">Candidate (Analyze Resumes)</option>
                                    <option value="hiring_manager">Hiring Manager (Rank & Compare)</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-brand-500 uppercase tracking-widest px-1">Secure Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-300" />
                                <input 
                                    type="password"
                                    required
                                    className="w-full pl-11 pr-4 py-3 bg-brand-50/50 border border-brand-100 rounded-xl outline-none focus:ring-2 focus:ring-brand-900/5 transition-all text-sm"
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
                            className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 text-xs font-medium"
                        >
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </motion.div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-brand-900 text-white rounded-xl font-semibold shadow-subtle hover:bg-brand-800 transition-all flex items-center justify-center space-x-2 active:scale-[0.98]"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Create Account</span>}
                    </button>
                </form>

                <div className="text-center">
                    <p className="text-sm text-brand-500">
                        Already part of the network? <Link to="/login" className="text-brand-900 font-bold hover:underline">Sign In Instead</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default SignupPage;
