import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Activity, Clock, CheckCircle2, AlertCircle, ChevronRight, Loader2, RefreshCw } from 'lucide-react';

const JobsView = ({ onViewResult }) => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchJobs = async () => {
        try {
            const res = await axios.get('http://127.0.0.1:5000/api/jobs');
            setJobs(res.data);
        } catch (err) {
            console.error("Failed to fetch jobs:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
        const interval = setInterval(fetchJobs, 5000); // Poll every 5s for updates
        return () => clearInterval(interval);
    }, []);

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
            case 'failed': return <AlertCircle className="w-5 h-5 text-red-500" />;
            case 'processing': return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
            default: return <Clock className="w-5 h-5 text-slate-400" />;
        }
    };

    if (loading) return (
        <div className="w-full py-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-sm text-slate-500 font-medium italic">Loading your processing history...</p>
        </div>
    );

    return (
        <div className="w-full space-y-8 max-w-5xl mx-auto">
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
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${
                                        job.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-500/10' : 
                                        job.status === 'failed' ? 'bg-red-50 dark:bg-red-500/10' : 
                                        'bg-blue-50 dark:bg-blue-500/10'
                                    }`}>
                                        {getStatusIcon(job.status)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            {job.type.toUpperCase()} Analysis
                                            <span className="text-[10px] text-slate-400 font-mono">#{job.id.substr(0,8)}</span>
                                        </h4>
                                        <div className="flex flex-wrap items-center gap-3 mt-1">
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${
                                                job.status === 'completed' ? 'text-emerald-500' :
                                                job.status === 'failed' ? 'text-red-500' :
                                                'text-blue-500'
                                            }`}>
                                                {job.status} {job.status === 'processing' && `(${job.progress}%)`}
                                            </span>
                                            <span className="w-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-full" />
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                Created: {new Date(job.created_at).toLocaleTimeString()}
                                            </span>
                                            {job.started_at && (
                                                <>
                                                    <span className="w-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-full" />
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                        Started: {new Date(job.started_at).toLocaleTimeString()}
                                                    </span>
                                                </>
                                            )}
                                            {job.completed_at && (
                                                <>
                                                    <span className="w-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-full" />
                                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                                                        Done: {new Date(job.completed_at).toLocaleTimeString()} 
                                                        ({((new Date(job.completed_at) - new Date(job.started_at || job.created_at))/1000).toFixed(1)}s)
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
                            </div>
                            
                            {job.status === 'processing' && (
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
