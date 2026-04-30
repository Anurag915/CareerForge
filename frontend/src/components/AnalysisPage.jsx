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
                const response = await axios.get(`http://localhost:5000/resume/${id}`);
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
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Loader2 className="w-12 h-12 text-brand-600 animate-spin" />
                <p className="text-brand-500 font-medium">Reconstructing analysis intelligence...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-2xl mx-auto mt-12 p-8 bg-red-50 border border-red-200 rounded-2xl text-center space-y-4">
                <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-red-900">Analysis Not Found</h2>
                <p className="text-red-700">{error}</p>
                <button 
                    onClick={() => navigate('/')}
                    className="px-6 py-2 bg-white border border-red-200 text-red-800 rounded-lg font-semibold hover:bg-red-100 transition-colors"
                >
                    Go Back Home
                </button>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="max-w-2xl mx-auto mt-12 p-8 text-center space-y-4">
                <p className="text-brand-500 font-medium">No analysis data available. Please upload a resume first.</p>
                <button 
                    onClick={() => navigate('/')}
                    className="px-6 py-2 bg-brand-900 text-white rounded-lg font-semibold hover:bg-brand-800 transition-colors"
                >
                    Analyze Resume
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <button 
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 text-brand-500 hover:text-brand-900 transition-colors group mb-2"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-semibold">Back to Dashboard</span>
            </button>

            <ResultCard results={data} onReset={() => navigate('/')} />
        </div>
    );
};

export default AnalysisPage;
