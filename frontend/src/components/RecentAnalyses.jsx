import React, { useState } from 'react';
import api from '../services/api';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, AlertCircle, Loader2, Ban, Sparkles, Activity, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useJobTracker } from '../api/queries/useJobTracker';

const parseDateTime = (str) => {
    if (!str) return new Date();
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d;
    if (!str.includes('Z') && !str.includes('+')) {
        return new Date(str.replace(' ', 'T') + 'Z');
    }
    return new Date(str);
};

const formatDate = (dateString) => {
    const d = parseDateTime(dateString);
    const datePart = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    const timePart = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    return `${datePart} - ${timePart}`;
};

const RecentAnalyses = ({ onViewResult, onViewMore }) => {
    const [fetchingJobId, setFetchingJobId] = useState(null);
    const { queue: processingQueue } = useJobTracker();

    const { data: jobs = [], isLoading: loading } = useQuery({
        queryKey: ['jobs'],
        queryFn: async () => {
            const res = await api.get('/api/jobs');
            return res.data;
        },
        refetchInterval: (query) => {
            const activeData = query.state?.data;
            if (!activeData || activeData.length === 0) return 30000;
            const hasActiveJobs = activeData.some(j => !['completed', 'failed', 'cancelled'].includes(j.status));
            return hasActiveJobs ? 3000 : 30000;
        }
    });

    const handleViewClick = async (e, jobId) => {
        e.stopPropagation();
        setFetchingJobId(jobId);
        await onViewResult(jobId);
        setFetchingJobId(null);
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
            case 'failed': return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
            case 'cancelled': return <Ban className="w-3.5 h-3.5 text-slate-500" />;
            case 'pending': return <Clock className="w-3.5 h-3.5 text-slate-400" />;
            default: return <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />;
        }
    };

    const getStatusBadge = (job) => {
        const baseClasses = "inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide shadow-sm border";
        switch (job.status) {
            case 'completed': return <span className={`${baseClasses} bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20`}>{getStatusIcon(job.status)} Completed</span>;
            case 'failed': return <span className={`${baseClasses} bg-red-50 text-red-700 border-red-200/60 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20`}>{getStatusIcon(job.status)} Failed</span>;
            case 'cancelled': return <span className={`${baseClasses} bg-slate-50 text-slate-700 border-slate-200/60 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700`}>{getStatusIcon(job.status)} Cancelled</span>;
            default: return <span className={`${baseClasses} bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20`}>{getStatusIcon(job.status)} {job.status === 'processing' ? 'Processing' : job.status} {job.progress > 0 ? `(${job.progress}%)` : ''}</span>;
        }
    };

    const combinedJobsMap = new Map();
    jobs.forEach(j => combinedJobsMap.set(j.id, j));
    processingQueue.forEach(pq => {
        const existing = combinedJobsMap.get(pq.id);
        combinedJobsMap.set(pq.id, {
            ...existing,
            ...pq,
            created_at: existing?.created_at || new Date().toISOString()
        });
    });
    
    const combinedJobs = Array.from(combinedJobsMap.values());
    const sortedJobs = [...combinedJobs].sort((a, b) => {
        const aValue = a.created_at ? parseDateTime(a.created_at).getTime() : 0;
        const bValue = b.created_at ? parseDateTime(b.created_at).getTime() : 0;
        return bValue - aValue; // Newest first
    });

    const recentJobs = sortedJobs.slice(0, 5);

    if (loading && combinedJobs.length === 0) return null;

    return (
        <div className="w-full space-y-4 mb-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                Recent Analyses
            </h3>
            
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                {recentJobs.length === 0 ? (
                    <div className="p-12 text-center">
                        <Activity className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">No recent analyses</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">You haven't run any analysis pipelines recently.</p>
                        <button 
                            onClick={onViewMore}
                            className="px-5 py-2 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 rounded-xl text-sm font-semibold hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors inline-flex items-center gap-2"
                        >
                            <Sparkles className="w-4 h-4" /> View Analysis History
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
                                    <th className="px-4 py-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                        Resume Name
                                    </th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                        Pipeline
                                    </th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap hidden sm:table-cell">
                                        Created
                                    </th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {recentJobs.map((job) => {
                                    const isActive = !['completed', 'failed', 'cancelled'].includes(job.status);
                                    return (
                                        <tr key={job.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate max-w-[150px] md:max-w-[250px]">{job.name || 'Untitled Document'}</span>
                                                    <span className="text-[11px] text-slate-400 font-mono mt-0.5">#{job.id.substr(0,8)}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800/80 px-2.5 py-1 rounded-md whitespace-nowrap border border-slate-200/50 dark:border-slate-700/50">
                                                    {job.type} Pipeline
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col gap-2.5 w-32 md:w-40">
                                                    {getStatusBadge(job)}
                                                    {isActive && (
                                                        <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                            <motion.div 
                                                                className="h-full bg-blue-500"
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${job.progress}%` }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap hidden sm:table-cell">
                                                {formatDate(job.created_at)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {job.status === 'completed' && (
                                                    <button 
                                                        onClick={(e) => handleViewClick(e, job.id)}
                                                        disabled={fetchingJobId === job.id}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-500 hover:text-white text-blue-600 dark:text-blue-400 rounded-lg text-xs font-semibold transition-all group/btn shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Open Analysis"
                                                    >
                                                        {fetchingJobId === job.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                                        {fetchingJobId === job.id ? 'Loading...' : 'Analysis'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        
                        <div className="p-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800 flex justify-center">
                            <button 
                                onClick={onViewMore}
                                className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5"
                            >
                                View More Analyses <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecentAnalyses;
