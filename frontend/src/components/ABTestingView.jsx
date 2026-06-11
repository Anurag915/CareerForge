import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { 
    Layers, Check, BrainCircuit, Sparkles, FileText, TrendingUp, 
    Trophy, AlertCircle, Clock, Loader2, ChevronDown, ChevronUp, Ban 
} from 'lucide-react';

const ABTestingView = () => {
    // React Query Shared Caches (Shared with Library & Queue tabs)
    const { data: resumes = [] } = useQuery({
        queryKey: ['resumes'],
        queryFn: async () => {
            const res = await api.get('/resumes');
            return res.data;
        }
    });

    const { data: allJobs = [] } = useQuery({
        queryKey: ['jobs'],
        queryFn: async () => {
            const res = await api.get('/api/jobs');
            return res.data;
        }
    });

    const [selectedIds, setSelectedIds] = useState(() => JSON.parse(sessionStorage.getItem('abtest_selectedIds') || '[]'));
    const [jobDescription, setJobDescription] = useState(() => sessionStorage.getItem('abtest_jobDescription') || '');
    const [tempResumes, setTempResumes] = useState(() => JSON.parse(sessionStorage.getItem('abtest_tempResumes') || '[]'));
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- NEW: Queue and Subscription states ---
    const [optJobs, setOptJobs] = useState([]);
    const [expandedJobId, setExpandedJobId] = useState(null);
    const socketRef = useRef(null);

    // Computed safety check to remove 'ghost IDs' from logic
    const allSelectableResumes = [...resumes, ...tempResumes];
    const validSelectedIds = selectedIds.filter(sid => allSelectableResumes.some(r => r.id === sid));
    const currentSelectedCount = validSelectedIds.length;

    // Save controls data to storage
    useEffect(() => {
        sessionStorage.setItem('abtest_selectedIds', JSON.stringify(selectedIds));
        sessionStorage.setItem('abtest_jobDescription', jobDescription);
        sessionStorage.setItem('abtest_tempResumes', JSON.stringify(tempResumes));
    }, [selectedIds, jobDescription, tempResumes]);

    // Setup socket on mount
    useEffect(() => {
        socketRef.current = io(import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000');
        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, []);

    // Hydrate optJobs from central query cache once loaded
    useEffect(() => {
        if (allJobs.length > 0 && optJobs.length === 0) {
            const optimizationJobs = allJobs.filter(j => j.type === 'optimization');
            setOptJobs(optimizationJobs);

            // Bind listeners to any active running jobs
            optimizationJobs.forEach(job => {
                if (job.status !== 'completed' && job.status !== 'failed') {
                    attachSocketListener(job.id);
                }
            });
        }
    }, [allJobs]);

    const attachSocketListener = (jobId) => {
        if (!socketRef.current) return;
        
        // Clear existing to prevent double-binding
        socketRef.current.off(`job:${jobId}`);
        
        socketRef.current.on(`job:${jobId}`, (update) => {
            setOptJobs(prevJobs => prevJobs.map(j => {
                if (j.id === jobId) {
                    const merged = { ...j, ...update };
                    // If complete, make sure fully hydrated from the DB immediately or update payload
                    return merged;
                }
                return j;
            }));

            // If status completed, fetch full full final result blob optionally, 
            // or if standard broadcast provided it, we already mapped it.
            if (update.status === 'completed' || update.status === 'failed') {
                // Refetch single job after 500ms purely to guarantee backend storage write consistency
                setTimeout(async () => {
                    try {
                        const finalData = await api.get(`/api/job/${jobId}`);
                        setOptJobs(prev => prev.map(j => j.id === jobId ? finalData.data : j));
                    } catch (e) {}
                }, 500);
                socketRef.current.off(`job:${jobId}`);
            }
        });
    };

    const toggleSelection = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleQuickUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('resume', file);
        formData.append('persist', 'false'); 

        try {
            const res = await api.post('/analyze-advanced', formData);
            const newTemp = {
                id: res.data.resume_id,
                filename: file.filename || file.name,
                isTemp: true,
                ...res.data
            };
            setTempResumes(prev => [...prev, newTemp]);
            setSelectedIds(prev => [...prev, res.data.resume_id]);
        } catch (err) {
            setError("Failed to process temporary resume.");
        } finally {
            setLoading(false);
        }
    };

    // The New Async Fire function
    const handleRunTest = async () => {
        if (currentSelectedCount < 1 || !jobDescription.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const res = await api.post('/compare-my-resumes', {
                resume_ids: validSelectedIds, // Pass strictly valid IDs only
                job_description: jobDescription
            });
            
            const newJobId = res.data.jobId;

            // 1. Optimistically Insert into top of jobs feed
            const placeholderJob = {
                id: newJobId,
                type: 'optimization',
                status: 'Initializing',
                progress: 5,
                created_at: new Date().toISOString(),
                result: null
            };
            
            setOptJobs(prev => [placeholderJob, ...prev]);
            
            // 2. Establish Real-time websocket handler
            attachSocketListener(newJobId);

            // 3. Clear inputs option (Optional UX cleanup)
            // We will retain them for user friendliness but clear the active loading mask
            
        } catch (err) {
            setError(err.response?.data?.error || "A/B Test kick-off failed");
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOptimization = async (jobId) => {
        if (!window.confirm("Terminate optimization run? All processed results will be lost.")) return;
        try {
            await api.post(`/api/job/${jobId}/cancel`);
            // Fast Optimistic update UI locally to reflect cancel without waiting for socket bounce
            setOptJobs(prev => prev.map(j => j.id === jobId ? {...j, status: 'cancelled'} : j));
        } catch (e) {
            console.error("Failed to cancel.");
        }
    };

    const handleToggleExpand = async (jobId) => {
        if (expandedJobId === jobId) {
            setExpandedJobId(null);
            return;
        }
        
        const currentJob = optJobs.find(j => j.id === jobId);
        
        // If job already has result loaded into memory, just expand instantly
        if (currentJob && currentJob.result) {
            setExpandedJobId(jobId);
            return;
        }

        // Otherwise, lazy-load the high-bandwidth payload from backend
        try {
            const response = await api.get(`/api/job/${jobId}`);
            setOptJobs(prev => prev.map(j => 
                j.id === jobId ? { ...j, result: response.data.result } : j
            ));
            setExpandedJobId(jobId);
        } catch (err) {
            console.error("Fatal: Cannot retrieve job details payload", err);
            setError("Failed to load data findings. Retrying...");
        }
    };


    // Status Color Utilities
    const getStatusStyles = (status) => {
        switch(status?.toLowerCase()) {
            case 'completed': return 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20';
            case 'failed': return 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20';
            case 'cancelled': return 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700';
            default: return 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20 animate-pulse';
        }
    };

    const currentViewJob = optJobs.find(j => j.id === expandedJobId);
    const results = currentViewJob?.result;

    return (
        <div className="w-full space-y-8 pb-20 theme-transition">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                        <div className="p-2 bg-accent-500/10 rounded-xl">
                            <TrendingUp className="w-6 h-6 text-accent-600 dark:text-accent-500" />
                        </div>
                        Smart Optimization
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Determine the winning resume variations using production background workers.</p>
                </div>
            </div>

            {/* Dynamic Inputs Grid */}
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Step 1: Select Resumes */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between text-slate-900 dark:text-slate-100 font-bold text-md  tracking-widest">
                        <div className="flex items-center space-x-2">
                            <span className="w-6 h-6 bg-accent-600 text-white rounded-full flex items-center justify-center text-[10px]">1</span>
                            <span>Select Your Versions</span>
                        </div>
                        <label className="cursor-pointer text-[10px] bg-white dark:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 transition-all shadow-sm">
                            <input type="file" className="hidden" onChange={handleQuickUpload} />
                            + Quick Upload
                        </label>
                    </div>
                    <div className="grid gap-2 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                        {allSelectableResumes.length === 0 ? (
                            <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center text-slate-400 text-xs font-medium">
                                No resumes in library yet.
                            </div>
                        ) : (
                            allSelectableResumes.map(r => (
                                <motion.div
                                    key={r.id}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => toggleSelection(r.id)}
                                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all relative flex items-center space-x-3 ${
                                        selectedIds.includes(r.id) 
                                        ? 'bg-accent-50 dark:bg-accent-500/10 border-accent-500 ring-1 ring-accent-500/20' 
                                        : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                                    }`}
                                >
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${selectedIds.includes(r.id) ? 'bg-accent-600 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-400'}`}>
                                        <FileText className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{r.filename}</h4>
                                        <div className="flex items-center gap-2">
                                            {r.isTemp && <span className="text-[7px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded font-black text-slate-600 dark:text-slate-400 uppercase">Temp</span>}
                                            <p className="text-[9px] text-slate-400 mt-0.5">{r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Just now'}</p>
                                        </div>
                                    </div>
                                    {selectedIds.includes(r.id) && <Check className="w-3.5 h-3.5 text-accent-600" />}
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* Step 2: Input JD */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center space-x-2 text-slate-900 dark:text-slate-100 font-bold text-md tracking-widest">
                        <span className="w-6 h-6 bg-accent-600 text-white rounded-full flex items-center justify-center text-[10px]">2</span>
                        <span>Target Job Description</span>
                    </div>
                    <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 p-6 rounded-[24px] shadow-sm space-y-5 backdrop-blur-md">
                        <textarea 
                            className="w-full h-36 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-all outline-none resize-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/10"
                            placeholder="Enter job description requirements to test against..."
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                        />
                        <div className="flex items-center justify-between">
                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                {currentSelectedCount} Files Armed
                            </div>
                            <button
                                onClick={handleRunTest}
                                disabled={currentSelectedCount < 1 || !jobDescription.trim() || loading}
                                className={`flex items-center space-x-3 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300
                                    ${(currentSelectedCount < 1 || !jobDescription.trim() || loading)
                                        ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-inner border border-slate-200 dark:border-slate-700'
                                        : 'bg-slate-900 dark:bg-accent-600 text-white hover:scale-[1.02] active:scale-95 shadow-lg shadow-accent-500/20 cursor-pointer'
                                    }`}
                            >
                                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BrainCircuit className="w-3.5 h-3.5" />}
                                <span>Enqueue Test Job</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Phase 3: The Active / Historical Streams */}
            <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <h3 className="text-md font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Optimization History Queue
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                        {optJobs.length} Recorded
                    </span>
                </div>

                <div className="space-y-3">
                    {optJobs.length === 0 ? (
                        <div className="text-center py-12 bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                            <p className="text-sm text-slate-500 font-medium">Your job history is empty. Trigger a test above.</p>
                        </div>
                    ) : (
                        optJobs.map(job => {
                            const isSelected = expandedJobId === job.id;
                            const isReady = job.status === 'completed';
                            const hasFailed = job.status === 'failed';
                            const isCancelled = job.status === 'cancelled';
                            const isInProgress = !isReady && !hasFailed && !isCancelled;

                            return (
                                <div key={job.id} className="flex flex-col space-y-2">
                                    {/* Job Card */}
                                    <motion.div 
                                        layout="position"
                                        className={`p-4 rounded-2xl border transition-all bg-white dark:bg-slate-900/80 flex flex-wrap md:flex-nowrap items-center justify-between gap-4 group ${
                                            isSelected 
                                            ? 'ring-2 ring-accent-500 border-transparent shadow-xl' 
                                            : 'border-slate-200 dark:border-slate-800 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4 min-w-[250px]">
                                            <div className={`p-2 rounded-xl ${isReady ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600' : isCancelled ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                                {isReady ? <Trophy className="w-4 h-4" /> : isCancelled ? <Ban className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-tighter">Job #{job.id.substr(0,6)}</span>
                                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getStatusStyles(job.status)}`}>
                                                        {job.status}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-slate-500 mt-1">Created {new Date(job.created_at).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</p>
                                            </div>
                                        </div>

                                        {/* Progress Stream Inline */}
                                        <div className="flex-grow max-w-md">
                                            {isInProgress ? (
                                                <div className="w-full space-y-1.5">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{job.message || 'Processing...'}</span>
                                                        <span className="text-[10px] font-bold text-accent-600">{job.progress}%</span>
                                                    </div>
                                                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                        <motion.div 
                                                            className="h-full bg-accent-500"
                                                            initial={{ width: '0%' }}
                                                            animate={{ width: `${job.progress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ) : isReady ? (
                                                <div className="text-xs text-slate-500 truncate">
                                                    <span className="font-bold text-slate-700 dark:text-slate-300">Payload: </span>
                                                    {job.result?.job_description_preview || "Loaded successfully"}
                                                </div>
                                            ) : isCancelled ? (
                                                <div className="text-xs text-slate-400 font-medium italic">Job terminated manually by user.</div>
                                            ) : (
                                                <div className="text-xs text-red-500 font-bold">{job.error || "Pipeline malfunction."}</div>
                                            )}
                                        </div>

                                        {/* Action Button */}
                                        {isInProgress ? (
                                            <button 
                                                onClick={() => handleCancelOptimization(job.id)}
                                                className="px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-500 hover:text-white text-red-600 dark:text-red-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100 dark:border-red-800/50 transition-all flex items-center gap-2 shadow-sm"
                                            >
                                                <Ban className="w-3.5 h-3.5" />
                                                Cancel Test
                                            </button>
                                        ) : (
                                            <button
                                                disabled={!isReady}
                                                onClick={() => handleToggleExpand(job.id)}
                                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2
                                                    ${!isReady ? 'opacity-30 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400' 
                                                    : isSelected ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                                                    : 'bg-slate-50 dark:bg-slate-800 hover:bg-accent-600 hover:text-white text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}
                                                `}
                                            >
                                                {isSelected ? 'Collapse' : 'View Findings'}
                                                {isSelected ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                            </button>
                                        )}
                                    </motion.div>
                                    
                                    {/* Inline expanded result view for currently toggled job */}
                                    <AnimatePresence>
                                        {isSelected && results && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="py-6 space-y-8">
                                                    {/* Winning Hero */}
                                                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-accent-600 dark:to-accent-700 rounded-[24px] p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
                                                        <div className="absolute top-0 right-0 p-12 opacity-10">
                                                            <Trophy className="w-48 h-48" />
                                                        </div>
                                                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                            <div className="space-y-3">
                                                                <div className="inline-flex items-center space-x-2 bg-white/15 backdrop-blur-xl border border-white/10 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest">
                                                                    <Sparkles className="w-3 h-3" />
                                                                    <span>AI Evaluation Complete</span>
                                                                </div>
                                                                <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
                                                                    Winner: {results.ranking?.[0]?.filename || "Unknown Target"}
                                                                </h3>
                                                                <p className="text-slate-200 dark:text-white/90 text-sm max-w-2xl leading-relaxed font-medium">
                                                                    {results.ai_explanation?.overall_summary}
                                                                </p>
                                                            </div>
                                                            <div className="bg-black/20 dark:bg-white/10 backdrop-blur-xl p-5 px-8 rounded-2xl border border-white/10 text-center min-w-[160px]">
                                                                <div className="text-4xl font-black tracking-tighter mb-0.5">
                                                                    {results.ranking?.[0]?.ats_score || 0}%
                                                                </div>
                                                                <div className="text-[8px] font-black uppercase tracking-widest opacity-70">
                                                                    Top Match Score
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Metrics Grid */}
                                                    <div className="grid md:grid-cols-2 gap-6">
                                                        {/* Comparative Stack */}
                                                        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-[24px] p-6 shadow-sm">
                                                            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest mb-5 flex items-center gap-2">
                                                                <Layers className="w-3.5 h-3.5 text-accent-500" />
                                                                Performance Matrix
                                                            </h4>
                                                            <div className="space-y-3">
                                                                {results.ranking?.map((item, idx) => (
                                                                    <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                                                                        <div className="flex items-center space-x-3 min-w-0">
                                                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px] flex-shrink-0 ${idx === 0 ? 'bg-amber-500/10 text-amber-600' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                                                                                #{idx + 1}
                                                                            </div>
                                                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{item.filename}</span>
                                                                        </div>
                                                                        <div className="text-xs font-black text-slate-900 dark:text-white ml-2">{item.ats_score}%</div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Detailed Recommendations */}
                                                        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-[24px] p-6 shadow-sm">
                                                            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest mb-5 flex items-center gap-2">
                                                                <BrainCircuit className="w-3.5 h-3.5 text-purple-500" />
                                                                Optimization Delta
                                                            </h4>
                                                            <div className="space-y-3 h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                                                {results.ai_explanation?.individual_suggestions?.map((s, idx) => {
                                                                    // Find lookup in overall selectable resumes or just raw fallback
                                                                    const f = results.ranking?.find(r => r.id === s.id)?.filename || "Item";
                                                                    return (
                                                                        <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Target: {f}</div>
                                                                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{s.suggestion}</p>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Simple Global Error Toast Container for optimization View */}
            <AnimatePresence>
                {error && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-6 right-6 z-50 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-bold"
                    >
                        <AlertCircle className="w-4 h-4" />
                        {error}
                        <button onClick={() => setError(null)} className="ml-2 opacity-60 hover:opacity-100">×</button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ABTestingView;
