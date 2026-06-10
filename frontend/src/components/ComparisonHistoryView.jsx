import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Columns, Calendar, Eye, Activity, CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronUp, FileText, Award, Target, FileSearch, FileStack } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useJobTracker } from '../api/queries/useJobTracker';
import MultiResumeViewerModal from './MultiResumeViewerModal';

const parseDateTime = (str) => {
    if (!str) return new Date();
    // Handles ISO strings and standard format (e.g. 2023-10-10 12:00:00)
    let d = new Date(str);
    if (!isNaN(d.getTime())) return d;
    
    // Fallback for missing 'T' and 'Z'
    if (typeof str === 'string' && !str.includes('Z') && !str.includes('+') && str.includes(' ')) {
        d = new Date(str.replace(' ', 'T') + 'Z');
        if (!isNaN(d.getTime())) return d;
    }
    return new Date(str);
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    const d = parseDateTime(dateString);
    if (isNaN(d.getTime())) return '-';
    const datePart = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    const timePart = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    return `${datePart} at ${timePart}`;
};

const formatDuration = (start, end) => {
    if (!start || !end) return '-';
    const durationMs = parseDateTime(end) - parseDateTime(start);
    if (durationMs < 0) return '-';
    const seconds = Math.floor(durationMs / 1000);
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const remainingSecs = seconds % 60;
    return `${mins}m ${remainingSecs}s`;
};

const StatusBadge = ({ status }) => {
    const config = {
        'completed': { icon: CheckCircle2, color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
        'processing': { icon: Activity, color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
        'pending': { icon: Clock, color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
        'failed': { icon: AlertCircle, color: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10' }
    };
    const c = config[status] || config['pending'];
    const Icon = c.icon;
    
    return (
        <div className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full ${c.bg} ${c.color} text-[10px] font-bold uppercase tracking-wider`}>
            <Icon className="w-3.5 h-3.5" />
            <span>{status}</span>
        </div>
    );
};

const ExpandedDetails = ({ job }) => {
    const [showAllSkills, setShowAllSkills] = useState(false);
    
    // Determine the best resume and skills
    const resumes = job.resumes || [];
    const validResumes = resumes.filter(r => r && r.id);
    
    let bestResume = null;
    let extractedSkills = [];
    
    if (job.status === 'completed' && validResumes.length > 0) {
        bestResume = validResumes.find(r => r.rank === 1) || validResumes[0];
        
        // Extract skills from analysis data of the best resume
        if (bestResume && bestResume.analysis_data) {
            try {
                const data = typeof bestResume.analysis_data === 'string' 
                    ? JSON.parse(bestResume.analysis_data) 
                    : bestResume.analysis_data;
                
                // If it's a phase 2 structure where analysis_data is {metrics: [...]}
                const candidateMetric = data.metrics?.find(m => m.id === bestResume.id);
                if (candidateMetric) {
                    const matched = candidateMetric.matched_skills || [];
                    const missing = candidateMetric.missing_skills || [];
                    extractedSkills = [...new Set([...matched, ...missing])];
                } else if (data.matched_skills || data.missing_skills) {
                    const matched = data.matched_skills || [];
                    const missing = data.missing_skills || [];
                    extractedSkills = [...new Set([...matched, ...missing])];
                }
            } catch (e) {
                console.error("Failed to parse skills from analysis data", e);
            }
        }
    }

    const visibleSkills = showAllSkills ? extractedSkills : extractedSkills.slice(0, 4);
    const hiddenSkillsCount = showAllSkills ? 0 : extractedSkills.length - 4;

    return (
        <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full bg-slate-50/50 dark:bg-slate-900/30 overflow-hidden border-t border-slate-100 dark:border-slate-800 whitespace-normal"
        >
            <div className="p-6 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Column 1: Key Skills Evaluated */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold mb-2">
                            <Target className="w-4 h-4 text-accent-500" />
                            <h3>Key Skills Evaluated</h3>
                        </div>
                        
                        {extractedSkills.length > 0 ? (
                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                                <div className="flex flex-wrap gap-1.5">
                                    {visibleSkills.map((skill, i) => (
                                        <span key={i} className="px-2 py-1 bg-slate-200/50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 rounded text-xs whitespace-nowrap border border-slate-200 dark:border-slate-700/50">
                                            {skill}
                                        </span>
                                    ))}
                                    {hiddenSkillsCount > 0 && (
                                        <button 
                                            onClick={() => setShowAllSkills(true)}
                                            className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded text-xs whitespace-nowrap font-medium transition-colors cursor-pointer"
                                        >
                                            +{hiddenSkillsCount} more
                                        </button>
                                    )}
                                    {showAllSkills && extractedSkills.length > 4 && (
                                        <button 
                                            onClick={() => setShowAllSkills(false)}
                                            className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded text-xs whitespace-nowrap font-medium transition-colors cursor-pointer"
                                        >
                                            Show less
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm text-slate-500 italic">
                                No skills evaluated.
                            </div>
                        )}
                    </div>

                    {/* Column 2: Selected Resumes */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold mb-2">
                            <FileSearch className="w-4 h-4 text-blue-500" />
                            <h3>Selected Resumes ({validResumes.length})</h3>
                        </div>
                        <div className="flex flex-col gap-2">
                            {validResumes.length > 0 ? validResumes.map((resume, i) => (
                                <div key={i} className="flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                                        <span className="text-sm text-slate-700 dark:text-slate-300 truncate">
                                            {resume.filename || `Resume ${i+1}`}
                                        </span>
                                    </div>
                                    {resume.pdf_url && (
                                        <button 
                                            onClick={() => job.onViewResume && job.onViewResume(job, resume)}
                                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-accent-500 transition-colors shrink-0"
                                            title="Preview Resume"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            )) : (
                                <p className="text-sm text-slate-500 italic">No resumes selected or data unavailable.</p>
                            )}
                        </div>
                    </div>

                    {/* Column 3: Additional Info */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold mb-2">
                            <Activity className="w-4 h-4 text-emerald-500" />
                            <h3>Comparison Insights</h3>
                        </div>
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col gap-4">
                            
                            <div>
                                <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Top Resume</span>
                                {bestResume ? (
                                    <div className="flex items-center gap-2">
                                        <Award className="w-5 h-5 text-amber-500" />
                                        <div>
                                            <span className="block text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{bestResume.filename}</span>
                                            <span className="block text-xs text-emerald-600 dark:text-emerald-400 font-semibold">ATS Score: {bestResume.score}%</span>
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-sm text-slate-500">{job.status === 'completed' ? 'Unavailable' : 'Pending completion...'}</span>
                                )}
                            </div>

                            <div className="h-px bg-slate-100 dark:bg-slate-700 w-full"></div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Processing Time</span>
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {formatDuration(job.created_at, job.completed_at)}
                                    </span>
                                </div>
                                <div>
                                    <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Completion Date</span>
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {job.completed_at ? formatDate(job.completed_at) : '-'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const ComparisonHistoryView = () => {
    const navigate = useNavigate();
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [viewingJobResumes, setViewingJobResumes] = useState(null);
    const { queue: processingQueue } = useJobTracker();
    
    const { data: history = [], isLoading: loading } = useQuery({
        queryKey: ['comparison_history'],
        queryFn: async () => {
            const res = await api.get('/api/comparisons');
            return res.data;
        },
        refetchInterval: (query) => {
            const activeData = query.state?.data;
            if (!activeData || activeData.length === 0) return 30000;
            const hasActiveJobs = activeData.some(j => !['completed', 'failed', 'cancelled'].includes(j.status));
            return hasActiveJobs ? 3000 : 30000;
        }
    });

    const combinedHistory = history.map(job => {
        const tracked = processingQueue.find(q => q.id === job.id);
        if (tracked) {
            return { ...job, status: tracked.status };
        }
        return job;
    });

    const handleViewResume = (job, resume) => {
        const resumes = job.resumes || [];
        const index = resumes.findIndex(r => r.id === resume.id);
        setViewingJobResumes({ ...job, initialIndex: index >= 0 ? index : 0 });
    };

    const toggleRow = (id) => {
        const newSet = new Set(expandedRows);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setExpandedRows(newSet);
    };

    if (loading) return (
        <div className="w-full py-12 flex flex-col items-center justify-center space-y-4 theme-transition">
            <div className="w-8 h-8 border-2 border-slate-900 dark:border-accent-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium italic">Retrieving your comparison history...</p>
        </div>
    );

    return (
        <div className="w-full space-y-8 theme-transition">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Columns className="w-5 h-5 text-accent-600 dark:text-accent-500" />
                        Resume Comparison History
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Review and manage your previous resume comparison reports.</p>
                </div>
                <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                    {combinedHistory.length} Comparisons
                </div>
            </div>

            {combinedHistory.length === 0 ? (
                <div className="bg-white dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center">
                    <div className="bg-slate-100 dark:bg-slate-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Columns className="w-6 h-6 text-slate-400" />
                    </div>
                    <h3 className="text-slate-900 dark:text-slate-100 font-semibold mb-1">No Comparison History Yet</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Start by comparing multiple resumes to see it here.</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-subtle overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                                <tr>
                                    <th className="px-6 py-4">Comparison</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Resumes</th>
                                    <th className="px-6 py-4">Created</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                {combinedHistory.map((job, idx) => {
                                    const isExpanded = expandedRows.has(job.id);
                                    
                                    return (
                                        <React.Fragment key={job.id}>
                                            <motion.tr 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className={`transition-colors group ${isExpanded ? 'bg-slate-50/30 dark:bg-slate-800/20' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'}`}
                                            >
                                                <td className="px-6 py-4 w-1/3">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[200px] md:max-w-[300px]">
                                                            {job.comparison_name || "Resume Comparison"}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase">ID: {job.id.split('-')[0]}...</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <StatusBadge status={job.status} />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                                        {job.resumes_count || job.resumes?.length || 0}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center text-slate-500 dark:text-slate-400 text-xs">
                                                        <Calendar className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                                                        {formatDate(job.created_at)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <button
                                                            onClick={() => setViewingJobResumes(job)}
                                                            className="inline-flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm group/btn"
                                                            title="View Resumes"
                                                        >
                                                            <FileStack className="w-4 h-4" />
                                                        </button>
                                                        
                                                        <button
                                                            onClick={() => navigate(`/comparisons/${job.id}`)}
                                                            disabled={job.status !== 'completed'}
                                                            className="inline-flex items-center justify-center bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-800 dark:hover:bg-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed group/btn"
                                                        >
                                                            <span>View Report</span>
                                                        </button>
                                                        
                                                        <button
                                                            onClick={() => toggleRow(job.id)}
                                                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-all"
                                                            title={isExpanded ? "Collapse Details" : "Expand Details"}
                                                        >
                                                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                            
                                            {/* Expandable Content Row */}
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <tr>
                                                        <td colSpan="5" className="p-0 border-b border-slate-100 dark:border-slate-800">
                                                            <ExpandedDetails job={{...job, onViewResume: handleViewResume}} />
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
                </div>
            )}

            <MultiResumeViewerModal 
                isOpen={!!viewingJobResumes}
                onClose={() => setViewingJobResumes(null)}
                resumes={viewingJobResumes?.resumes || []}
                comparisonName={viewingJobResumes?.comparison_name}
                initialIndex={viewingJobResumes?.initialIndex || 0}
            />
        </div>
    );
};

export default ComparisonHistoryView;
