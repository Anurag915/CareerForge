import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import ResultCard from './ResultCard';

const AnalysisPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Check if we have data passed from navigation (live upload)
    const [data, setData] = useState(location.state?.results || null);
    const [loading, setLoading] = useState(id && !data ? true : false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnalysis = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/resume/${id}`);
                console.log("DEBUG - ANALYSIS DATA RECEIVED:", response.data);
                setData(response.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching analysis:", err);
                setError(err.response?.data?.error || "Failed to load analysis results.");
                setLoading(false);
            }
        };

        // Only fetch if we have an ID and NO data yet (historical view)
        if (id && !location.state?.results) {
            fetchAnalysis();
        }
    }, [id, location.state]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 theme-transition">
                <Loader2 className="w-12 h-12 text-slate-900 dark:text-accent-500 animate-spin" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">Reconstructing analysis intelligence...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-2xl mx-auto mt-12 p-8 bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 rounded-2xl text-center space-y-4 theme-transition">
                <div className="bg-red-100 dark:bg-red-500/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-red-900 dark:text-red-100">Analysis Not Found</h2>
                <p className="text-red-700 dark:text-red-300/80">{error}</p>
                <button 
                    onClick={() => navigate('/')}
                    className="px-6 py-2 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-500/20 text-red-800 dark:text-red-400 rounded-lg font-semibold hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                    Go Back Home
                </button>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="max-w-2xl mx-auto mt-12 p-8 text-center space-y-4 theme-transition">
                <p className="text-slate-500 dark:text-slate-400 font-medium">No analysis data available. Please upload a resume first.</p>
                <button 
                    onClick={() => navigate('/')}
                    className="px-6 py-2 bg-slate-900 dark:bg-accent-600 text-white rounded-lg font-semibold hover:bg-slate-800 dark:hover:bg-accent-700 transition-colors"
                >
                    Analyze Resume
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 theme-transition">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <button 
                    onClick={() => navigate('/')}
                    className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-semibold">Back to Dashboard</span>
                </button>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Analysis Context:</span>
                    <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        {data.filename}
                    </div>
                </div>
            </div>

            {/* Target Job Description Section */}
            <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm mb-6">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
                        <AlertCircle className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight uppercase tracking-wider">Target Job Description</h3>
                </div>
                <div className="p-6">
                    <div className="max-h-40 overflow-y-auto custom-scrollbar">
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap italic">
                            "{data.job_description || 'No job description provided for this analysis.'}"
                        </p>
                    </div>
                </div>
            </div>

            <ResultCard results={data} onReset={() => navigate('/')} />
        </div>
    );
};

export default AnalysisPage;
