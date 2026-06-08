import React, { useState } from 'react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Clock, CheckCircle2, AlertCircle, Loader2, RefreshCw, Ban, ChevronDown, ChevronUp, ArrowUpDown, Eye, Sparkles } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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

const JobsView = ({ onViewResult }) => {
    const queryClient = useQueryClient();
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [fetchingJobId, setFetchingJobId] = useState(null);

    // Intelligent Fetch Configuration
    const { data: jobs = [], isLoading: loading, refetch: fetchJobs } = useQuery({
        queryKey: ['jobs'],
        queryFn: async () => {
            const res = await api.get('/api/jobs');
            return res.data;
        },
        refetchInterval: (query) => {
            const activeData = query.state?.data;
            if (!activeData || activeData.length === 0) return 30000;
            const hasActiveJobs = activeData.some(j => !['completed', 'failed', 'cancelled'].includes(j.status));
            return hasActiveJobs ? 3000 : 20000;
        }
    });

    // Cancel Task Mutation
    const cancelMutation = useMutation({
        mutationFn: async (jobId) => {
            await api.post(`/api/job/${jobId}/cancel`);
        },
        onMutate: async (jobId) => {
            await queryClient.cancelQueries({ queryKey: ['jobs'] });
            const previousJobs = queryClient.getQueryData(['jobs']);
            queryClient.setQueryData(['jobs'], old => 
                old ? old.map(job => job.id === jobId ? { ...job, status: 'cancelled' } : job) : []
            );
            return { previousJobs };
        },
        onError: (err, jobId, context) => {
            if (context?.previousJobs) {
                queryClient.setQueryData(['jobs'], context.previousJobs);
            }
            console.error("Cancellation error:", err);
            alert("Cancellation command failed to issue. Please refresh the page.");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
        }
    });

    const handleCancel = (e, jobId) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to terminate this task? The queue position and current analysis progress will be lost.")) return;
        cancelMutation.mutate(jobId);
    };

    const toggleRow = (e, jobId) => {
        e.stopPropagation(); // Stop event bubbling so clicking the chevron doesn't trigger the row click if we bind to both
        setExpandedRows(prev => {
            const next = new Set(prev);
            if (next.has(jobId)) next.delete(jobId);
            else next.add(jobId);
            return next;
        });
    };

    const handleViewClick = async (e, jobId) => {
        e.stopPropagation();
        setFetchingJobId(jobId);
        await onViewResult(jobId);
        setFetchingJobId(null);
    };

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
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

    const sortedJobs = [...jobs].sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key.includes('at')) {
            aValue = aValue ? parseDateTime(aValue).getTime() : 0;
            bValue = bValue ? parseDateTime(bValue).getTime() : 0;
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return <ArrowUpDown className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />;
        return sortConfig.direction === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-blue-500" /> : <ChevronDown className="w-3.5 h-3.5 text-blue-500" />;
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
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shadow-sm border border-slate-200 dark:border-slate-800"
                >
                    <RefreshCw className="w-5 h-5 text-slate-500" />
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

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                {jobs.length === 0 ? (
                    <div className="p-16 text-center">
                        <Activity className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">No jobs found</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Your background tasks will appear here once you start an analysis.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
                                    <th 
                                        className="px-6 py-5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest cursor-pointer group hover:text-slate-700 dark:hover:text-slate-300 whitespace-nowrap"
                                        onClick={() => handleSort('name')}
                                    >
                                        <div className="flex items-center gap-2">Resume Name <SortIcon columnKey="name" /></div>
                                    </th>
                                    <th 
                                        className="px-6 py-5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest cursor-pointer group hover:text-slate-700 dark:hover:text-slate-300 whitespace-nowrap"
                                        onClick={() => handleSort('type')}
                                    >
                                        <div className="flex items-center gap-2">Pipeline <SortIcon columnKey="type" /></div>
                                    </th>
                                    <th 
                                        className="px-6 py-5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest cursor-pointer group hover:text-slate-700 dark:hover:text-slate-300 whitespace-nowrap"
                                        onClick={() => handleSort('status')}
                                    >
                                        <div className="flex items-center gap-2">Status <SortIcon columnKey="status" /></div>
                                    </th>
                                    <th 
                                        className="px-6 py-5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest cursor-pointer group hover:text-slate-700 dark:hover:text-slate-300 whitespace-nowrap hidden sm:table-cell"
                                        onClick={() => handleSort('created_at')}
                                    >
                                        <div className="flex items-center gap-2">Created <SortIcon columnKey="created_at" /></div>
                                    </th>
                                    <th className="px-6 py-5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {sortedJobs.map((job) => {
                                    const isExpanded = expandedRows.has(job.id);
                                    const isActive = !['completed', 'failed', 'cancelled'].includes(job.status);
                                    
                                    return (
                                        <React.Fragment key={job.id}>
                                            <tr 
                                                className={`group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer ${isActive ? 'bg-blue-50/10 dark:bg-blue-900/10' : ''}`}
                                                onClick={(e) => toggleRow(e, job.id)}
                                            >
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate max-w-[200px] md:max-w-[300px]">{job.name || 'Untitled Document'}</span>
                                                        <span className="text-[11px] text-slate-400 font-mono mt-1">#{job.id.substr(0,8)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800/80 px-2.5 py-1 rounded-md whitespace-nowrap border border-slate-200/50 dark:border-slate-700/50">
                                                        {job.type} Pipeline
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
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
                                                <td className="px-6 py-5 text-sm font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap hidden sm:table-cell">
                                                    {formatDate(job.created_at)}
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button 
                                                            onClick={(e) => toggleRow(e, job.id)}
                                                            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                                            title="Toggle Details"
                                                        >
                                                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                        </button>
                                                        
                                                        {job.status === 'completed' && (
                                                            <button 
                                                                onClick={(e) => handleViewClick(e, job.id)}
                                                                disabled={fetchingJobId === job.id}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-500 hover:text-white text-blue-600 dark:text-blue-400 rounded-lg text-xs font-semibold transition-all group/btn shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                                title="Open Analysis"
                                                            >
                                                                {fetchingJobId === job.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                                                {fetchingJobId === job.id ? 'Loading...' : 'Analysis'}
                                                            </button>
                                                        )}
                                                        {isActive && (
                                                            <button 
                                                                onClick={(e) => handleCancel(e, job.id)}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-red-500 hover:text-white text-slate-500 hover:text-white dark:text-slate-400 rounded-lg text-xs font-semibold transition-all group/btn shadow-sm border border-slate-200 dark:border-slate-700"
                                                                title="Cancel Job"
                                                            >
                                                                <Ban className="w-3.5 h-3.5" />
                                                                Cancel
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                            
                                            {/* Expanded Row Content */}
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <tr>
                                                        <td colSpan={5} className="p-0">
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="overflow-hidden bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800/50"
                                                            >
                                                                <div className="px-8 sm:px-16 py-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                                                    <div className="sm:hidden">
                                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">Created At</p>
                                                                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                                            {formatDate(job.created_at)}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">Started At</p>
                                                                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                                            {job.started_at ? formatDate(job.started_at) : '—'}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">Completed At</p>
                                                                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                                            {job.completed_at ? formatDate(job.completed_at) : '—'}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">Processing Duration</p>
                                                                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                                            {job.completed_at && job.started_at ? 
                                                                                `${((parseDateTime(job.completed_at) - parseDateTime(job.started_at))/1000).toFixed(1)}s` : 
                                                                                (isActive ? 'Running...' : '—')
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </AnimatePresence>
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JobsView;
