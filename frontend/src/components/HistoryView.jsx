import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { History, FileText, Calendar, ChevronRight, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

const parseDateTime = (str) => {
    if (!str) return new Date();
    if (!str.includes('Z') && !str.includes('+')) {
        return new Date(str.replace(' ', 'T') + 'Z');
    }
    return new Date(str);
};

const HistoryView = () => {
    const navigate = useNavigate();
    const { data: history = [], isLoading: loading } = useQuery({
        queryKey: ['history'],
        queryFn: async () => {
            const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/history`);
            return res.data;
        }
    });

    if (loading) return (
        <div className="w-full py-12 flex flex-col items-center justify-center space-y-4 theme-transition">
            <div className="w-8 h-8 border-2 border-slate-900 dark:border-accent-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium italic">Retrieving your analysis history...</p>
        </div>
    );

    return (
        <div className="w-full space-y-8 theme-transition">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <History className="w-5 h-5 text-accent-600 dark:text-accent-500" />
                        Analysis History
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Review your past resume analyses and improvements.</p>
                </div>
                <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                    {history.length} Sessions
                </div>
            </div>

            <div className="grid gap-4">
                {history.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center">
                        <div className="bg-slate-100 dark:bg-slate-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Activity className="w-6 h-6 text-slate-400" />
                        </div>
                        <h3 className="text-slate-900 dark:text-slate-100 font-semibold mb-1">No History Yet</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Start by analyzing your first resume to see it here.</p>
                    </div>
                ) : (
                    history.map((item, idx) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => navigate(`/analysis/${item.resume_id}`)}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-subtle hover:border-accent-500/50 hover:shadow-md transition-all cursor-pointer group"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center group-hover:bg-slate-900 dark:group-hover:bg-accent-600 transition-colors">
                                        <FileText className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-white" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-tight group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors">{item.filename}</h4>
                                        <div className="flex items-center space-x-3 mt-1.5">
                                            <div className="flex items-center text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                {parseDateTime(item.created_at).toLocaleDateString()} {parseDateTime(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </div>
                                            <span className="w-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full"></span>
                                            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate max-w-[200px]">
                                                {item.job_description.substring(0, 40)}...
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-6">
                                    <div className="text-right">
                                        <div className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-none">{item.ats_score}%</div>
                                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Score</div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-200 dark:text-slate-700 group-hover:text-slate-900 dark:group-hover:text-slate-100 group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};

export default HistoryView;
