import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { motion } from 'framer-motion';
import { Columns, Calendar, Eye, Activity, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

const parseDateTime = (str) => {
    if (!str) return new Date();
    if (!str.includes('Z') && !str.includes('+')) {
        return new Date(str.replace(' ', 'T') + 'Z');
    }
    return new Date(str);
};

const formatDate = (dateString) => {
    const d = parseDateTime(dateString);
    const datePart = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    return `${datePart}`;
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

const ComparisonHistoryView = () => {
    const navigate = useNavigate();
    const { data: history = [], isLoading: loading } = useQuery({
        queryKey: ['comparison_history'],
        queryFn: async () => {
            const res = await api.get('/api/comparisons');
            return res.data;
        }
    });

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
                        Comparison History
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Review your past multi-candidate comparisons.</p>
                </div>
                <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                    {history.length} Comparisons
                </div>
            </div>

            {history.length === 0 ? (
                <div className="bg-white dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center">
                    <div className="bg-slate-100 dark:bg-slate-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Columns className="w-6 h-6 text-slate-400" />
                    </div>
                    <h3 className="text-slate-900 dark:text-slate-100 font-semibold mb-1">No Comparison History Yet</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Start by comparing multiple candidates to see it here.</p>
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
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                {history.map((job, idx) => (
                                    <motion.tr 
                                        key={job.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group"
                                    >
                                        <td className="px-6 py-4 w-1/3">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[200px] md:max-w-[300px]">
                                                    {job.job_description ? job.job_description.substring(0, 50) + (job.job_description.length > 50 ? '...' : '') : 'Comparison Run'}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase">ID: {job.id.split('-')[0]}...</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={job.status} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                                {job.resumes_count}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-slate-500 dark:text-slate-400 text-xs">
                                                <Calendar className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                                                {formatDate(job.created_at)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => navigate(`/comparisons/${job.id}`)}
                                                className="inline-flex items-center justify-center bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 dark:hover:bg-white hover:-translate-y-0.5 transition-all shadow-subtle group/btn"
                                            >
                                                <span>View</span>
                                                <Eye className="w-3.5 h-3.5 ml-1.5 opacity-70 group-hover/btn:opacity-100 transition-opacity" />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComparisonHistoryView;
