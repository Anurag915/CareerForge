import { useState, useEffect } from 'react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Columns, Check, AlertCircle, Sparkles, UserPlus, Trash2, BrainCircuit } from 'lucide-react';
import PaginationControls from './PaginationControls';
import { useQuery } from '@tanstack/react-query';

const ComparisonDashboard = ({ preSelectedIds = [] }) => {
    // Shared query cache with MyResumesView
    const { data: resumes = [] } = useQuery({
        queryKey: ['resumes'],
        queryFn: async () => {
            const res = await api.get('/resumes');
            return res.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000,   // 10 minutes cache
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false
    });

    const [selectedIds, setSelectedIds] = useState(preSelectedIds);
    const [comparisonData, setComparisonData] = useState(null);
    const [jobDescription, setJobDescription] = useState('');
    const [topN, setTopN] = useState(0); // 0 means all
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [tempResumes, setTempResumes] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    useEffect(() => {
        if (preSelectedIds && preSelectedIds.length > 0) {
            setSelectedIds(preSelectedIds);
        }
    }, [preSelectedIds]);

    const toggleSelection = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBatchUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setLoading(true);
        const newTemps = [];
        const newIds = [];

        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append('resume', file);
                formData.append('persist', 'false');
                
                const res = await api.post('/analyze-advanced', formData);
                newTemps.push({
                    id: res.data.resume_id,
                    filename: file.name,
                    isTemp: true,
                    ...res.data
                });
                newIds.push(res.data.resume_id);
            }
            setTempResumes(prev => [...prev, ...newTemps]);
            setSelectedIds(prev => [...prev, ...newIds]);
        } catch (err) {
            setError("Batch upload failed for one or more files.");
        } finally {
            setLoading(false);
        }
    };

    const handleCompare = async () => {
        if (selectedIds.length < 2 || !jobDescription.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const res = await api.post('/compare', { 
                resume_ids: selectedIds,
                job_description: jobDescription,
                top_n: topN > 0 ? parseInt(topN) : null
            });
            setComparisonData(res.data);
        } catch (err) {
            setError(err.response?.data?.error || "Comparison failed");
        } finally {
            setLoading(false);
        }
    };

    const allResumes = [...resumes, ...tempResumes];

    const totalPages = Math.ceil(allResumes.length / itemsPerPage);
    const paginatedResumes = allResumes.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="w-full space-y-4 theme-transition">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Columns className="w-6 h-6 text-accent-600 dark:text-accent-500" />
                        Compare Candidates
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Select multiple resumes and provide a JD to compare candidates side-by-side.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <label className="cursor-pointer bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-900 transition-all shadow-subtle flex items-center space-x-2">
                        <input type="file" className="hidden" multiple onChange={handleBatchUpload} />
                        <UserPlus className="w-4 h-4" />
                        <span>Quick Batch Upload</span>
                    </label>
                    <button
                        onClick={handleCompare}
                        disabled={selectedIds.length < 2 || !jobDescription.trim() || loading}
                        className="flex items-center space-x-2 bg-slate-900 dark:bg-accent-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm disabled:opacity-30 shadow-lg hover:shadow-xl transition-all"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <BrainCircuit className="w-4 h-4" />
                        )}
                        <span>Run AI Comparison</span>
                    </button>
                </div>
            </div>

            {/* JD & Top N Selection */}
            <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl shadow-subtle">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Target Job Description (Required)</label>
                    <textarea 
                        className="w-full h-24 p-3 bg-slate-50/30 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-4 focus:ring-accent-500/5 transition-all outline-none"
                        placeholder="Paste the job description..."
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                    />
                </div>
                <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl shadow-subtle flex flex-col justify-between">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Shortlist Filter</label>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-4 leading-relaxed">Limit results to the top <strong>N</strong> candidates. Leave at 0 to see all.</p>
                        <div className="relative">
                            <input 
                                type="number" 
                                min="0"
                                className="w-full p-4 bg-slate-50/30 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 text-lg font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-4 focus:ring-accent-500/5"
                                value={topN}
                                onChange={(e) => setTopN(e.target.value)}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-300 dark:text-slate-600 pointer-events-none">Candidates</div>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        <span>Selected</span>
                        <span className="text-slate-900 dark:text-accent-500 bg-slate-100 dark:bg-accent-500/10 px-2 py-0.5 rounded-full">{selectedIds.length}</span>
                    </div>
                </div>
            </div>

            {/* Selection Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {paginatedResumes.map(r => (
                    <div
                        key={r.id}
                        onClick={() => toggleSelection(r.id)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all relative ${
                            selectedIds.includes(r.id) 
                            ? 'bg-slate-100 dark:bg-accent-500/10 border-slate-900 dark:border-accent-500 ring-2 ring-slate-900/10 dark:ring-accent-500/20' 
                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
                        }`}
                    >
                        {selectedIds.includes(r.id) && (
                            <div className="absolute top-2 right-2 bg-slate-900 dark:bg-accent-600 text-white p-1 rounded-full">
                                <Check className="w-3 h-3" />
                            </div>
                        )}
                        <FileIcon className={`w-8 h-8 mb-3 ${r.isTemp ? 'text-amber-400' : 'text-slate-200 dark:text-slate-700'}`} />
                        <div className="flex items-center space-x-1 mb-0.5 min-w-0">
                           <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{r.filename}</h4>
                           {r.isTemp && <span className="text-[7px] bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 px-1 rounded font-black uppercase">Temp</span>}
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono uppercase">ID: {r.id}</p>
                    </div>
                ))}
            </div>

            {allResumes.length > 0 && (
                <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl shadow-subtle">
                    <PaginationControls
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        totalItems={allResumes.length}
                        itemsPerPage={itemsPerPage}
                    />
                </div>
            )}

            {/* Results Table */}
            <AnimatePresence>
                {comparisonData && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden shadow-premium"
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                                        <th className="px-6 py-5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">Metric</th>
                                        {comparisonData.metrics.map(m => (
                                            <th key={m.id} className="px-6 py-5 text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700">
                                                {m.filename}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    <tr className="hover:bg-slate-50/30 dark:hover:bg-slate-900/30 transition-colors">
                                        <td className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-500 border-b border-slate-50/50 dark:border-slate-700 uppercase text-[10px] tracking-widest">Rank</td>
                                        {comparisonData.metrics.map((m, idx) => (
                                            <td key={m.id} className="px-6 py-4 border-b border-slate-50/50 dark:border-slate-700">
                                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold ${idx === 0 ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-500/20' : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300'}`}>
                                                    #{idx + 1}
                                                </span>
                                            </td>
                                        ))}
                                    </tr>
                                    <tr className="hover:bg-slate-50/30 dark:hover:bg-slate-900/30 transition-colors">
                                        <td className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-50/50 dark:border-slate-700">ATS Score</td>
                                        {comparisonData.metrics.map(m => (
                                            <td key={m.id} className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-500 border-b border-slate-50/50 dark:border-slate-700">{m.ats_score}%</td>
                                        ))}
                                    </tr>
                                    <tr className="hover:bg-slate-50/30 dark:hover:bg-slate-900/30 transition-colors">
                                        <td className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-50/50 dark:border-slate-700">Skills Match</td>
                                        {comparisonData.metrics.map(m => (
                                            <td key={m.id} className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100 border-b border-slate-50/50 dark:border-slate-700">{m.skills_count} extracted</td>
                                        ))}
                                    </tr>
                                    <tr className="hover:bg-slate-50/30 dark:hover:bg-slate-900/30 transition-colors">
                                        <td className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-50/50 dark:border-slate-700">Missing Keys</td>
                                        {comparisonData.metrics.map(m => (
                                            <td key={m.id} className="px-6 py-4 font-bold text-red-500 dark:text-red-400 border-b border-slate-50/50 dark:border-slate-700">{m.missing_skills.length} skills</td>
                                        ))}
                                    </tr>
                                    <tr className="hover:bg-slate-50/30 dark:hover:bg-slate-900/30 transition-colors">
                                        <td className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-50/50 dark:border-slate-700">Experience</td>
                                        {comparisonData.metrics.map(m => (
                                            <td key={m.id} className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100 border-b border-slate-50/50 dark:border-slate-700">{m.experience_years} years</td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* AI Synthesis */}
                        <div className="p-8 bg-slate-50/30 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700">
                            <div className="flex items-center space-x-2 mb-4">
                                <Sparkles className="w-5 h-5 text-slate-900 dark:text-accent-500" />
                                <h3 className="font-bold text-slate-900 dark:text-slate-100">AI Comparison Synthesis</h3>
                            </div>
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                {comparisonData.llm_analysis.overall_summary || "No summary available."}
                            </p>
                            
                            <div className="grid sm:grid-cols-2 gap-4 mt-6">
                                {comparisonData.llm_analysis.individual_suggestions?.map(s => (
                                    <div key={s.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs shadow-subtle">
                                        <span className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider block mb-2 underline decoration-slate-200 dark:decoration-slate-700 underline-offset-4 transition-colors group-hover:decoration-accent-500">ID: {s.id} Suggestion</span>
                                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{s.suggestion}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const FileIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14.5 2H6C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V6.5L14.5 2Z" />
        <path d="M14 2V6.5H18.5" />
    </svg>
);

export default ComparisonDashboard;
