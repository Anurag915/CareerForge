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
            const res = await axios.get('http://localhost:5000/resumes');
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
                await axios.post('http://localhost:5000/upload', formData);
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
        <div className="w-full space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-xl font-semibold text-brand-900 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        My Resume Vault
                    </h2>
                    <p className="text-xs text-brand-500 mt-1">Manage your persistent professional documents securely.</p>
                </div>
                <label className="cursor-pointer bg-brand-900 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg hover:bg-brand-800 transition-all active:scale-95 flex items-center space-x-2">
                    <input type="file" className="hidden" multiple onChange={handleUpload} accept=".pdf" />
                    {uploading ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>Upload Resume</span>
                </label>
            </div>

            <div className="bg-white border border-brand-100 rounded-3xl p-6 shadow-subtle space-y-6">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-400" />
                    <input 
                        type="text"
                        placeholder="Search your vault..."
                        className="w-full pl-10 pr-4 py-2.5 bg-brand-50/50 rounded-xl border border-brand-100 text-xs focus:ring-4 focus:ring-brand-900/5 transition-all outline-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                        {loading ? (
                            Array(3).fill(0).map((_, i) => (
                                <div key={i} className="h-32 bg-brand-50 animate-pulse rounded-2xl border border-brand-100" />
                            ))
                        ) : filteredResumes.length === 0 ? (
                            <div className="col-span-full py-20 text-center space-y-4">
                                <div className="bg-brand-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-brand-300">
                                    <UploadCloud className="w-8 h-8" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-bold text-brand-900 text-lg">No Resumes Found</h3>
                                    <p className="text-brand-500 text-sm">Upload your first resume to start building your vault.</p>
                                </div>
                            </div>
                        ) : (
                            filteredResumes.map((r, idx) => (
                                <motion.div
                                    key={r.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="bg-white border border-brand-100 p-5 rounded-2xl shadow-sm hover:border-brand-900/20 hover:shadow-md transition-all group relative overflow-hidden"
                                >
                                    <div className="flex items-start justify-between relative z-10">
                                        <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600 group-hover:bg-brand-900 group-hover:text-white transition-colors">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div className="flex items-center space-x-1 text-[9px] font-bold text-brand-400 uppercase tracking-widest bg-brand-50 px-2 py-1 rounded-full">
                                            <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                            <span>Secured</span>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4 relative z-10">
                                        <h4 className="font-bold text-brand-900 text-sm truncate mb-1">{r.filename}</h4>
                                        <div className="flex items-center text-[10px] text-brand-400 font-medium">
                                            <Calendar className="w-3 h-3 mr-1" />
                                            {new Date(r.created_at).toLocaleDateString()}
                                        </div>
                                    </div>

                                    <div className="absolute bottom-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-2 text-brand-300 hover:text-red-500 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    
                                    {/* Subtle background decoration */}
                                    <div className="absolute -right-4 -bottom-4 opacity-[0.03] text-brand-900 transform rotate-12 group-hover:scale-110 transition-transform">
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
