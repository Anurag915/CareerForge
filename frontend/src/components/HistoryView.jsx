import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { History, FileText, Calendar, ChevronRight, Activity } from 'lucide-react';

const HistoryView = () => {
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await axios.get('http://localhost:5000/history');
                setHistory(res.data);
            } catch (err) {
                console.error("Failed to fetch history:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    if (loading) return (
        <div className="w-full py-12 flex flex-col items-center justify-center space-y-4">
            <div className="w-8 h-8 border-2 border-brand-900 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-brand-500 font-medium italic">Retrieving your analysis history...</p>
        </div>
    );

    return (
        <div className="w-full space-y-8">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h2 className="text-xl font-semibold text-brand-900 flex items-center gap-2">
                        <History className="w-5 h-5" />
                        Analysis History
                    </h2>
                    <p className="text-xs text-brand-500 mt-1">Review your past resume analyses and improvements.</p>
                </div>
                <div className="px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-xs font-bold border border-brand-100 uppercase tracking-wider">
                    {history.length} Sessions
                </div>
            </div>

            <div className="grid gap-4">
                {history.length === 0 ? (
                    <div className="bg-white border border-dashed border-brand-200 rounded-2xl p-12 text-center">
                        <div className="bg-brand-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Activity className="w-6 h-6 text-brand-400" />
                        </div>
                        <h3 className="text-brand-900 font-semibold mb-1">No History Yet</h3>
                        <p className="text-brand-500 text-sm">Start by analyzing your first resume to see it here.</p>
                    </div>
                ) : (
                    history.map((item, idx) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => navigate(`/analysis/${item.resume_id}`)}
                            className="bg-white border border-brand-100 rounded-2xl p-5 shadow-subtle hover:border-brand-300 hover:shadow-md transition-all cursor-pointer group"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center group-hover:bg-brand-900 transition-colors">
                                        <FileText className="w-5 h-5 text-brand-600 group-hover:text-white" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-brand-900 text-sm leading-tight">{item.filename}</h4>
                                        <div className="flex items-center space-x-3 mt-1.5">
                                            <div className="flex items-center text-[11px] text-brand-400 font-medium">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </div>
                                            <span className="w-1 h-1 bg-brand-200 rounded-full"></span>
                                            <span className="text-[11px] text-brand-400 font-medium truncate max-w-[200px]">
                                                {item.job_description.substring(0, 40)}...
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-6">
                                    <div className="text-right">
                                        <div className="text-xl font-bold text-brand-900 leading-none">{item.ats_score}%</div>
                                        <div className="text-[10px] text-brand-400 font-bold uppercase tracking-widest mt-1">Score</div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-brand-200 group-hover:text-brand-900 group-hover:translate-x-1 transition-all" />
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
