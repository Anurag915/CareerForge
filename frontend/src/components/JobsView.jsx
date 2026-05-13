import axios from 'axios';
import { motion } from 'framer-motion';
import { Activity, Clock, CheckCircle2, AlertCircle, ChevronRight, Loader2, RefreshCw, Ban } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const parseDateTime = (str) => {
    if (!str) return new Date();
    if (!str.includes('Z') && !str.includes('+')) {
        return new Date(str.replace(' ', 'T') + 'Z');
    }
    return new Date(str);
};

const JobsView = ({ onViewResult }) => {
    const queryClient = useQueryClient();

    // Intelligent Fetch Configuration
    const { data: jobs = [], isLoading: loading, refetch: fetchJobs } = useQuery({
        queryKey: ['jobs'],
        queryFn: async () => {
            const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/api/jobs`);
            return res.data;
        },
        // Adaptive Polling Strategy: Poll every 3s ONLY when background jobs are running, 
        // otherwise fallback to slow heartbeat to preserve battery/bandwidth.
        refetchInterval: (query) => {
            const activeData = query.state.data;
            if (!activeData || activeData.length === 0) return 30000;
            const hasActiveJobs = activeData.some(j => !['completed', 'failed', 'cancelled'].includes(j.status));
            return hasActiveJobs ? 3000 : 20000;
        }
    });

    // Cancel Task Mutation
    const cancelMutation = useMutation({
        mutationFn: async (jobId) => {
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/api/job/${jobId}/cancel`);
        },
        onSuccess: () => {
            // Invalidate queue to instantly show cancelled state
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
        },
        onError: (err) => {
            console.error("Cancellation error:", err);
            alert("Cancellation command failed to issue. Please refresh the page.");
        }
    });

    const handleCancel = (jobId) => {
        if (!window.confirm("Are you sure you want to terminate this task? The queue position and current analysis progress will be lost.")) return;
        cancelMutation.mutate(jobId);
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
            case 'failed': return <AlertCircle className="w-5 h-5 text-red-500" />;
            case 'cancelled': return <Ban className="w-5 h-5 text-slate-500" />;
            case 'pending': return <Clock className="w-5 h-5 text-slate-400" />;
            default: return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
        }
    };

    if (loading) return (
        <div className="w-full py-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-sm text-slate-500 font-medium italic">Loading your processing history...</p>
        </div>
    );

    const totalJobs = jobs.length;
    const completedJobs = jobs.filter(j => j.status === 'completed').length;
    const activeJobs = jobs.filter(j => !['completed', 'failed', 'cancelled'].includes(j.status)).length;
    const failedJobs = jobs.filter(j => j.status === 'failed').length;

    return (
        <div className="w-full space-y-8 pb-10 theme-transition">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <Activity className="w-6 h-6 text-blue-500" />
                        Analysis Queue
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Monitor your background analysis jobs and results.</p>
                </div>
                <button 
                    onClick={fetchJobs}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                    <RefreshCw className="w-5 h-5 text-slate-400" />
                </button>
            </div>

            {/* Metrics Dashboard Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {[
                    { label: 'Total Tasks', value: totalJobs, color: 'text-slate-900 dark:text-white', bg: 'bg-slate-50 dark:bg-slate-800/20', icon: Activity, iconColor: 'text-blue-500' },
                    { label: 'Completed', value: completedJobs, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50/50 dark:bg-emerald-500/5', icon: CheckCircle2, iconColor: 'text-emerald-500' },
                    { label: 'In Progress', value: activeJobs, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50/50 dark:bg-blue-500/5', icon: Loader2, iconColor: 'text-blue-500', spin: activeJobs > 0 },
                    { label: 'Failed', value: failedJobs, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50/50 dark:bg-red-500/5', icon: AlertCircle, iconColor: 'text-red-500' }
                ].map((card, i) => (
                    <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md flex items-center justify-between group hover:shadow-md transition-all duration-300"
                    >
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{card.label}</p>
                            <p className={`text-2xl font-black mt-1 ${card.color}`}>{card.value}</p>
                        </div>
                        <div className={`p-3 rounded-xl ${card.bg}`}>
                            <card.icon className={`w-5 h-5 ${card.iconColor} ${card.spin ? 'animate-spin' : ''}`} />
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid gap-4">
                {jobs.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-16 text-center">
                        <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">No jobs found</h3>
                        <p className="text-slate-500 dark:text-slate-400">Your background tasks will appear here once you start an analysis.</p>
                    </div>
                ) : (
                    jobs.map((job, idx) => (
                        <motion.div
                            key={job.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-blue-500/30 transition-all group"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${
                                        job.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-500/10' : 
                                        job.status === 'failed' ? 'bg-red-50 dark:bg-red-500/10' : 
                                        job.status === 'cancelled' ? 'bg-slate-100 dark:bg-slate-800' :
                                        'bg-blue-50 dark:bg-blue-500/10'
                                    }`}>
                                        {getStatusIcon(job.status)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            {job.name || `${job.type.toUpperCase()} Analysis`}
                                            <span className="text-[10px] text-slate-400 font-mono">#{job.id.substr(0,8)}</span>
                                        </h4>
                                        {job.name && (
                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-0.5">
                                                {job.type} Pipeline
                                            </div>
                                        )}
                                        <div className="flex flex-wrap items-center gap-3 mt-1">
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${
                                                job.status === 'completed' ? 'text-emerald-500' :
                                                job.status === 'failed' ? 'text-red-500' :
                                                job.status === 'cancelled' ? 'text-slate-500' :
                                                'text-blue-500'
                                            }`}>
                                                {job.status === 'completed' ? 'Completed' :
                                                 job.status === 'failed' ? 'Failed' :
                                                 job.status === 'cancelled' ? 'Manually Cancelled' :
                                                 job.status === 'Upload' ? 'Uploading resume...' :
                                                 job.status === 'processing' ? 'Analyzing resume...' :
                                                 job.status} {['completed', 'failed', 'cancelled'].indexOf(job.status) === -1 && `(${job.progress}%)`}
                                            </span>
                                            <span className="w-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-full" />
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                Created: {parseDateTime(job.created_at).toLocaleTimeString()}
                                            </span>
                                            {job.started_at && (
                                                <>
                                                    <span className="w-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-full" />
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                        Started: {parseDateTime(job.started_at).toLocaleTimeString()}
                                                    </span>
                                                </>
                                            )}
                                            {job.completed_at && (
                                                <>
                                                    <span className="w-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-full" />
                                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                                                        Done: {parseDateTime(job.completed_at).toLocaleTimeString()} 
                                                        ({((parseDateTime(job.completed_at) - parseDateTime(job.started_at || job.created_at))/1000).toFixed(1)}s)
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {job.status === 'completed' && (
                                    <button 
                                        onClick={() => onViewResult(job.id)}
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600 rounded-xl text-xs font-bold transition-all group"
                                    >
                                        View Result
                                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                )}

                                {['completed', 'failed', 'cancelled'].indexOf(job.status) === -1 && (
                                    <button 
                                        onClick={() => handleCancel(job.id)}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold transition-all"
                                    >
                                        <Ban className="w-3 h-3" />
                                        Cancel
                                    </button>
                                )}
                            </div>
                            
                            {['completed', 'failed', 'cancelled'].indexOf(job.status) === -1 && (
                                <div className="mt-4 w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div 
                                        className="h-full bg-blue-500"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${job.progress}%` }}
                                    />
                                </div>
                            )}
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};

export default JobsView;
