import React, { useState } from 'react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, UploadCloud, Trash2, Search, Plus, Calendar, ShieldCheck, Eye, Sparkles, Columns, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ResumeViewerModal from './ResumeViewerModal';
import { useNavigate } from 'react-router-dom';

const parseDateTime = (str) => {
    if (!str) return new Date();
    if (!str.includes('Z') && !str.includes('+')) {
        return new Date(str.replace(' ', 'T') + 'Z');
    }
    return new Date(str);
};

const MyResumesView = ({ setActiveTab, setPreSelectedCompareIds }) => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    
    // UI States
    const [selectedIds, setSelectedIds] = useState([]);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [activePdfUrl, setActivePdfUrl] = useState(null);
    const [activeFilename, setActiveFilename] = useState(null);
    
    const [analyzeModalOpen, setAnalyzeModalOpen] = useState(false);
    const [analyzeResumeId, setAnalyzeResumeId] = useState(null);
    const [jobDescription, setJobDescription] = useState('');

    // Fetch Hook with Caching
    const { data: resumes = [], isLoading: loading } = useQuery({
        queryKey: ['resumes'],
        queryFn: async () => {
            const res = await api.get('/resumes');
            return res.data;
        }
    });

    // Upload Mutation with Global Cache Invalidation
    const uploadMutation = useMutation({
        mutationFn: async (files) => {
            for (const file of files) {
                const formData = new FormData();
                formData.append('resume', file);
                formData.append('type', 'resume');
                formData.append('persist', 'true');
                await api.post('/upload', formData);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['resumes'] });
        },
        onError: (err) => {
            console.error("Upload failed:", err);
            alert("Some resume files failed to upload. Please verify their formats and try again.");
        }
    });

    const analyzeMutation = useMutation({
        mutationFn: async ({ resumeId, jd }) => {
            const res = await api.post('/api/job/analyze-existing', {
                resume_id: resumeId,
                job_description: jd
            });
            return res.data;
        },
        onSuccess: (data) => {
            setAnalyzeModalOpen(false);
            setJobDescription('');
            // Optional: You can navigate to history or queue directly here
            if (setActiveTab) setActiveTab('history');
        },
        onError: (err) => {
            alert(err.response?.data?.error || "Analysis failed to start.");
        }
    });

    const handleUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        uploadMutation.mutate(files);
    };

    const uploading = uploadMutation.isPending;

    const filteredResumes = resumes.filter(r => 
        r.filename.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleSelection = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleCompareSelected = () => {
        if (setPreSelectedCompareIds && setActiveTab) {
            setPreSelectedCompareIds(selectedIds);
            setActiveTab('compare');
        }
    };

    const openViewer = (r, e) => {
        e.stopPropagation();
        setActivePdfUrl(r.pdf_url);
        setActiveFilename(r.filename);
        setViewerOpen(true);
    };

    const openAnalyze = (r, e) => {
        e.stopPropagation();
        setAnalyzeResumeId(r.id);
        setAnalyzeModalOpen(true);
    };

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
                            filteredResumes.map((r, idx) => {
                                const isSelected = selectedIds.includes(r.id);
                                return (
                                    <motion.div
                                        key={r.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        onClick={() => toggleSelection(r.id)}
                                        className={`p-5 rounded-2xl transition-all group relative overflow-hidden cursor-pointer border ${
                                            isSelected
                                                ? 'bg-blue-50 dark:bg-accent-500/10 border-blue-500 dark:border-accent-500 ring-2 ring-blue-500/20'
                                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-accent-500/50 hover:shadow-md shadow-sm'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between relative z-10">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                                                isSelected ? 'bg-blue-500 text-white' : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 group-hover:bg-slate-900 dark:group-hover:bg-accent-600 group-hover:text-white'
                                            }`}>
                                                <FileText className="w-6 h-6" />
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                {/* Checkbox circle for selection visual */}
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                    isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-300 dark:border-slate-600'
                                                }`}>
                                                    {isSelected && <ShieldCheck className="w-3 h-3 text-white" />}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-4 relative z-10">
                                            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate mb-1 pr-8">{r.filename}</h4>
                                            <div className="flex items-center text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                {parseDateTime(r.created_at).toLocaleDateString()}
                                            </div>
                                        </div>

                                        {/* Hover Action Bar */}
                                        <div className="absolute bottom-0 right-0 left-0 p-3 bg-gradient-to-t from-white via-white to-transparent dark:from-slate-800 dark:via-slate-800 opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-1 translate-y-2 group-hover:translate-y-0 z-20">
                                            <button 
                                                onClick={(e) => openViewer(r, e)}
                                                className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                                                title="View Resume"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={(e) => openAnalyze(r, e)}
                                                className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-accent-600 dark:hover:text-accent-400 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                                                title="Analyze Resume"
                                            >
                                                <Sparkles className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); toggleSelection(r.id); }}
                                                className={`p-2 rounded-lg transition-colors ${isSelected ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                                                title="Compare Resume"
                                            >
                                                <Columns className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={(e) => e.stopPropagation()} // Placeholder for delete
                                                className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                                title="Delete Resume"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        
                                        <div className="absolute -right-4 -bottom-4 opacity-[0.03] dark:opacity-[0.05] text-slate-900 dark:text-white transform rotate-12 group-hover:scale-110 transition-transform z-0 pointer-events-none">
                                            <FileText className="w-24 h-24" />
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </AnimatePresence>
                </div>
            </div>
            {/* Floating Action Bar for Compare */}
            <AnimatePresence>
                {selectedIds.length >= 2 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6"
                    >
                        <div className="flex items-center gap-2">
                            <Columns className="w-5 h-5 text-accent-400 dark:text-accent-600" />
                            <span className="font-bold text-sm">{selectedIds.length} Resumes Selected</span>
                        </div>
                        <div className="flex items-center gap-3 border-l border-slate-700 dark:border-slate-200 pl-6">
                            <button 
                                onClick={() => setSelectedIds([])}
                                className="text-sm font-medium text-slate-400 dark:text-slate-500 hover:text-white dark:hover:text-slate-900 transition-colors"
                            >
                                Clear
                            </button>
                            <button 
                                onClick={handleCompareSelected}
                                className="bg-accent-600 hover:bg-accent-500 text-white px-5 py-2 rounded-xl font-bold text-sm transition-colors shadow-lg"
                            >
                                Compare Now
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Resume Viewer Modal */}
            <ResumeViewerModal 
                isOpen={viewerOpen}
                onClose={() => setViewerOpen(false)}
                pdfUrl={activePdfUrl}
                filename={activeFilename}
            />

            {/* Analyze Job Description Modal */}
            <AnimatePresence>
                {analyzeModalOpen && (
                    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            onClick={() => setAnalyzeModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
                        >
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-accent-50 dark:bg-accent-500/10 flex items-center justify-center text-accent-600 dark:text-accent-500">
                                        <Sparkles className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Analyze Resume</h3>
                                </div>
                                <button onClick={() => setAnalyzeModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-6">
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Target Job Description</label>
                                <textarea
                                    className="w-full h-32 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:ring-4 focus:ring-accent-500/10 outline-none transition-all placeholder:text-slate-400"
                                    placeholder="Paste the job description here..."
                                    value={jobDescription}
                                    onChange={(e) => setJobDescription(e.target.value)}
                                />
                                <div className="mt-6 flex justify-end">
                                    <button
                                        onClick={() => analyzeMutation.mutate({ resumeId: analyzeResumeId, jd: jobDescription })}
                                        disabled={!jobDescription.trim() || analyzeMutation.isPending}
                                        className="bg-slate-900 dark:bg-accent-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 hover:bg-slate-800 dark:hover:bg-accent-500 transition-colors shadow-lg flex items-center gap-2"
                                    >
                                        {analyzeMutation.isPending && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                        Start Analysis
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MyResumesView;
