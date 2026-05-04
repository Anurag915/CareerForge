import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import ResultCard from './ResultCard';

const ResumeDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnalysis = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`http://localhost:5000/resume/${id}`);
                setData(response.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching analysis:", err);
                setError(err.response?.data?.error || "Failed to load analysis results.");
                setLoading(false);
            }
        };

        if (id) fetchAnalysis();
    }, [id]);

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
                    onClick={() => navigate(-1)}
                    className="px-6 py-2 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-500/20 text-red-800 dark:text-red-400 rounded-lg font-semibold hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 theme-transition">
            <button 
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors group mb-2"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-semibold">Back to Dashboard</span>
            </button>

            {data && <ResultCard results={data} onReset={() => navigate('/')} />}
        </div>
    );
};

export default ResumeDetail;
