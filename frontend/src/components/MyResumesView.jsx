import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, UploadCloud, Trash2, Search, Plus, Calendar, ShieldCheck } from 'lucide-react';

const MyResumesView = () => {
    const [resumes, setResumes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchResumes = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://127.0.0.1:5000/resumes');
            setResumes(res.data);
        } catch (err) {
            console.error("Failed to fetch resumes:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResumes();
    }, []);

    const handleUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append('resume', file);
                formData.append('type', 'resume');
                formData.append('persist', 'true');
                await axios.post('http://127.0.0.1:5000/upload', formData);
            }
            fetchResumes();
        } catch (err) {
            console.error("Upload failed:", err);
        } finally {
            setUploading(false);
        }
    };

    const filteredResumes = resumes.filter(r => 
        r.filename.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="w-full space-y-8 theme-transition">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-accent-600 dark:text-accent-500" />
                        My Resume Vault
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage your persistent professional documents securely.</p>
                </div>
                <label className="cursor-pointer bg-slate-900 dark:bg-accent-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg hover:bg-slate-800 dark:hover:bg-accent-700 transition-all active:scale-95 flex items-center space-x-2">
                    <input type="file" className="hidden" multiple onChange={handleUpload} accept=".pdf" />
                    {uploading ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>Upload Resume</span>
                </label>
            </div>

            <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-subtle space-y-6">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input 
                        type="text"
                        placeholder="Search your vault..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-4 focus:ring-accent-500/5 focus:border-accent-500 transition-all outline-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                        {loading ? (
                            Array(3).fill(0).map((_, i) => (
                                <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl border border-slate-200 dark:border-slate-700" />
                            ))
                        ) : filteredResumes.length === 0 ? (
                            <div className="col-span-full py-20 text-center space-y-4">
                                <div className="bg-slate-100 dark:bg-slate-800/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-slate-300 dark:text-slate-600">
                                    <UploadCloud className="w-8 h-8" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">No Resumes Found</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">Upload your first resume to start building your vault.</p>
                                </div>
                            </div>
                        ) : (
                            filteredResumes.map((r, idx) => (
                                <motion.div
                                    key={r.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl shadow-sm hover:border-accent-500/50 hover:shadow-md transition-all group relative overflow-hidden"
                                >
                                    <div className="flex items-start justify-between relative z-10">
                                        <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:bg-slate-900 dark:group-hover:bg-accent-600 group-hover:text-white transition-colors">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div className="flex items-center space-x-1 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-900/50 px-2 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                                            <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                            <span>Secured</span>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4 relative z-10">
                                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate mb-1">{r.filename}</h4>
                                        <div className="flex items-center text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                            <Calendar className="w-3 h-3 mr-1" />
                                            {new Date(r.created_at).toLocaleDateString()}
                                        </div>
                                    </div>

                                    <div className="absolute bottom-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    
                                    <div className="absolute -right-4 -bottom-4 opacity-[0.03] dark:opacity-[0.05] text-slate-900 dark:text-white transform rotate-12 group-hover:scale-110 transition-transform">
                                        <FileText className="w-24 h-24" />
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default MyResumesView;
