import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Check, BrainCircuit, Sparkles, FileText, TrendingUp, Trophy, AlertCircle } from 'lucide-react';

const ABTestingView = () => {
    const [resumes, setResumes] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [jobDescription, setJobDescription] = useState('');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [tempResumes, setTempResumes] = useState([]);

    useEffect(() => {
        const fetchResumes = async () => {
            try {
                const res = await axios.get('http://localhost:5000/resumes');
                setResumes(res.data);
            } catch (err) {
                console.error("Failed to fetch resumes:", err);
            }
        };
        fetchResumes();
    }, []);

    const toggleSelection = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleQuickUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('resume', file);
        formData.append('persist', 'false'); // Do not save to DB permanently yet

        try {
            const res = await axios.post('http://localhost:5000/analyze-advanced', formData);
            const newTemp = {
                id: res.data.resume_id,
                filename: file.filename || file.name,
                isTemp: true,
                ...res.data
            };
            setTempResumes(prev => [...prev, newTemp]);
            setSelectedIds(prev => [...prev, res.data.resume_id]);
        } catch (err) {
            setError("Failed to process temporary resume.");
        } finally {
            setLoading(false);
        }
    };

    const handleRunTest = async () => {
        if (selectedIds.length < 2 || !jobDescription.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const res = await axios.post('http://localhost:5000/compare-my-resumes', {
                resume_ids: selectedIds,
                job_description: jobDescription
            });
            setResults(res.data);
        } catch (err) {
            setError(err.response?.data?.error || "A/B Test failed");
        } finally {
            setLoading(false);
        }
    };

    const allSelectableResumes = [...resumes, ...tempResumes];

    return (
        <div className="w-full space-y-10">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-brand-900 flex items-center gap-2">
                        <TrendingUp className="w-6 h-6" />
                        Find Best Resume
                    </h2>
                    <p className="text-sm text-brand-500 mt-1">Determine which version of your resume performs best for a specific role.</p>
                </div>
                <div className="px-4 py-1.5 bg-brand-900 text-white rounded-full text-[10px] font-bold uppercase tracking-widest">
                    Candidate Optimization
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Step 1: Select Resumes */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between text-brand-900 font-bold text-xs uppercase tracking-widest">
                        <div className="flex items-center space-x-2">
                            <span className="w-6 h-6 bg-brand-900 text-white rounded-full flex items-center justify-center text-[10px]">1</span>
                            <span>Select Your Versions</span>
                        </div>
                        <label className="cursor-pointer bg-brand-50 hover:bg-brand-100 text-brand-700 px-2 py-1 rounded border border-brand-200 transition-colors">
                            <input type="file" className="hidden" onChange={handleQuickUpload} />
                            + Quick Upload
                        </label>
                    </div>
                    <div className="grid gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {allSelectableResumes.map(r => (
                            <motion.div
                                key={r.id}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => toggleSelection(r.id)}
                                className={`p-4 rounded-2xl border cursor-pointer transition-all relative flex items-center space-x-3 ${
                                    selectedIds.includes(r.id) 
                                    ? 'bg-brand-50 border-brand-900 ring-1 ring-brand-900/10' 
                                    : 'bg-white border-brand-100 hover:border-brand-200'
                                }`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedIds.includes(r.id) ? 'bg-brand-900 text-white' : 'bg-brand-50 text-brand-400'}`}>
                                    <FileText className="w-4 h-4" />
                                </div>
                                <div className="flex-grow min-w-0">
                                    <div className="flex items-center space-x-2">
                                        <h4 className="text-xs font-bold text-brand-900 truncate">{r.filename}</h4>
                                        {r.isTemp && <span className="text-[8px] bg-brand-200 px-1 rounded font-black text-brand-700 uppercase tracking-tighter">Temp</span>}
                                    </div>
                                    <p className="text-[10px] text-brand-400 mt-0.5">{r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Just uploaded'}</p>
                                </div>
                                {selectedIds.includes(r.id) && (
                                    <Check className="w-4 h-4 text-brand-900" />
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Step 2: Input JD */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center space-x-2 text-brand-900 font-bold text-xs uppercase tracking-widest">
                        <span className="w-6 h-6 bg-brand-900 text-white rounded-full flex items-center justify-center text-[10px]">2</span>
                        <span>Target Job Description</span>
                    </div>
                    <div className="bg-white border border-brand-100 p-6 rounded-3xl shadow-subtle space-y-6">
                        <textarea 
                            className="w-full h-48 p-5 bg-brand-50/30 rounded-2xl border border-brand-100 text-sm focus:ring-4 focus:ring-brand-900/5 transition-all outline-none resize-none"
                            placeholder="Paste the job description you want to optimize for..."
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                        />
                        <div className="flex items-center justify-between">
                            <div className="text-[10px] text-brand-400 font-bold uppercase tracking-widest">
                                {selectedIds.length} Resumes Selected
                            </div>
                            <button
                                onClick={handleRunTest}
                                disabled={selectedIds.length < 2 || !jobDescription.trim() || loading}
                                className="flex items-center space-x-2 bg-brand-900 text-white px-8 py-3 rounded-xl font-bold text-sm disabled:opacity-30 shadow-xl hover:bg-brand-800 transition-all active:scale-95"
                            >
                                {loading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <BrainCircuit className="w-4 h-4" />
                                )}
                                <span>Find My Best Resume</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Section */}
            <AnimatePresence>
                {results && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        <div className="bg-gradient-to-br from-brand-900 to-brand-800 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 opacity-10">
                                <Trophy className="w-64 h-64" />
                            </div>
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                <div className="space-y-3">
                                    <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                                        <Sparkles className="w-3 h-3" />
                                        <span>Winning Version Identified</span>
                                    </div>
                                    <h3 className="text-3xl font-bold tracking-tight">
                                        {resumes.find(r => r.id === results.best_resume_id)?.filename}
                                    </h3>
                                    <p className="text-brand-100 text-sm max-w-xl leading-relaxed">
                                        {results.ai_explanation.overall_summary}
                                    </p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/10 text-center">
                                    <div className="text-5xl font-black mb-1">
                                        {results.ranking[0].ats_score}%
                                    </div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                                        Match Reliability
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="bg-white border border-brand-100 rounded-3xl p-8 shadow-subtle">
                                <h3 className="text-xs font-bold text-brand-900 uppercase tracking-widest mb-6">Comparative Ranking</h3>
                                <div className="space-y-4">
                                    {results.ranking.map((item, idx) => (
                                        <div key={item.id} className="flex items-center justify-between p-4 bg-brand-50/50 rounded-2xl border border-brand-100">
                                            <div className="flex items-center space-x-4">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${idx === 0 ? 'bg-amber-100 text-amber-700' : 'bg-brand-100 text-brand-700'}`}>
                                                    #{idx + 1}
                                                </div>
                                                <span className="text-sm font-bold text-brand-900">{item.filename}</span>
                                            </div>
                                            <div className="text-sm font-black text-brand-900">{item.ats_score}%</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white border border-brand-100 rounded-3xl p-8 shadow-subtle">
                                <h3 className="text-xs font-bold text-brand-900 uppercase tracking-widest mb-6">Optimization Insights</h3>
                                <div className="space-y-4">
                                    {results.ai_explanation.individual_suggestions?.map(s => (
                                        <div key={s.id} className="p-4 rounded-2xl border border-brand-50 bg-brand-50/30">
                                            <div className="text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                                                <span>For {resumes.find(r => r.id === s.id)?.filename}</span>
                                                <Layers className="w-3 h-3" />
                                            </div>
                                            <p className="text-xs text-brand-700 leading-relaxed font-medium">{s.suggestion}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ABTestingView;
