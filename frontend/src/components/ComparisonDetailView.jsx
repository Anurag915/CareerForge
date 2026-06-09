import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Trophy, ArrowLeft, Star, TrendingUp, AlertTriangle, BookOpen, UserCheck, ShieldAlert, Award } from 'lucide-react';
import api from '../services/api';
import { motion } from 'framer-motion';

const ComparisonDetailView = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: detail, isLoading, error } = useQuery({
        queryKey: ['comparison_detail', id],
        queryFn: async () => {
            const res = await api.get(`/api/comparisons/${id}`);
            return res.data;
        },
        retry: false
    });

    if (isLoading) return (
        <div className="w-full py-20 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-slate-900 dark:border-accent-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-slate-500 font-medium">Loading comparison report...</p>
        </div>
    );

    if (error || !detail) return (
        <div className="w-full py-20 flex flex-col items-center justify-center space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-6 rounded-2xl flex flex-col items-center text-center max-w-md border border-red-200 dark:border-red-800">
                <ShieldAlert className="w-12 h-12 mb-4" />
                <h3 className="font-bold text-lg mb-2">Report Not Found</h3>
                <p className="text-sm opacity-80 mb-6">We couldn't locate this comparison report. It may have been deleted or you might not have access.</p>
                <button onClick={() => navigate('/')} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl font-semibold transition-colors">
                    Return to Dashboard
                </button>
            </div>
        </div>
    );

    const results = detail.results || [];
    const winner = results.length > 0 ? results[0] : null;

    // Master Skill List extraction
    const allSkillsSet = new Set();
    const candidateSkillsMap = {};

    results.forEach(res => {
        const analysis = res.analysis_data || {};
        const metrics = (analysis.metrics || []).find(m => m.id === res.resume_id) || {};
        const matched = metrics.matched_skills || [];
        const missing = metrics.missing_skills || [];
        
        matched.forEach(s => allSkillsSet.add(s));
        missing.forEach(s => allSkillsSet.add(s));
        
        candidateSkillsMap[res.resume_id] = {
            matched: new Set(matched),
            missing: new Set(missing)
        };
    });
    
    const masterSkills = Array.from(allSkillsSet).sort();

    const rankIcons = ['🥇', '🥈', '🥉'];

    return (
        <div className="w-full max-w-5xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
                <button 
                    onClick={() => navigate('/')}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-slate-500" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Comparison Report</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 truncate max-w-xl">
                        Target Role: {detail.job_description || "Custom Role"}
                    </p>
                </div>
                <div className="ml-auto bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300">
                    ID: {id.split('-')[0]}
                </div>
            </div>

            {/* Winner Section */}
            {winner && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative bg-gradient-to-br from-amber-100 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/10 border border-amber-200 dark:border-amber-700/30 rounded-3xl p-8 overflow-hidden shadow-xl shadow-amber-900/5"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                        <Trophy className="w-48 h-48" />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                        <div className="flex-shrink-0 bg-white dark:bg-amber-900/50 w-32 h-32 rounded-full flex items-center justify-center shadow-lg border-4 border-amber-50 dark:border-amber-800/50">
                            <span className="text-5xl">🏆</span>
                        </div>
                        <div className="flex-grow text-center md:text-left">
                            <h2 className="text-amber-600 dark:text-amber-500 font-black tracking-widest uppercase text-xs mb-2 flex items-center justify-center md:justify-start gap-2">
                                <Award className="w-4 h-4" /> Recommended Resume
                            </h2>
                            <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{winner.filename}</h3>
                            <div className="inline-flex items-center gap-2 bg-amber-500 text-white px-4 py-1.5 rounded-full font-bold text-sm shadow-md">
                                <Star className="w-4 h-4 fill-current" />
                                Match Score: {winner.score}%
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Ranking Table */}
            <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-subtle overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-accent-500" /> Executive Ranking
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                        <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-xs uppercase tracking-wider font-bold text-slate-400">
                            <tr>
                                <th className="px-6 py-4 w-24 text-center">Rank</th>
                                <th className="px-6 py-4">Candidate Profile</th>
                                <th className="px-6 py-4 text-right">ATS Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {results.map((res, idx) => (
                                <tr key={res.resume_id} className={idx === 0 ? "bg-amber-50/30 dark:bg-amber-900/10" : ""}>
                                    <td className="px-6 py-4 text-center text-xl">
                                        {idx < 3 ? rankIcons[idx] : <span className="text-sm font-bold text-slate-400">#{idx + 1}</span>}
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                                        {res.filename}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`inline-block px-3 py-1 rounded-lg font-black ${
                                            res.score >= 80 ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30' :
                                            res.score >= 60 ? 'text-blue-700 bg-blue-100 dark:bg-blue-900/30' :
                                            'text-red-700 bg-red-100 dark:bg-red-900/30'
                                        }`}>
                                            {res.score}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Score Distribution */}
            <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-subtle p-6">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                    <TrendingUp className="w-5 h-5 text-blue-500" /> Score Distribution
                </h3>
                <div className="space-y-5">
                    {results.map((res, idx) => (
                        <div key={res.resume_id}>
                            <div className="flex justify-between text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                <span>{res.filename}</span>
                                <span>{res.score}</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    whileInView={{ width: `${res.score}%` }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 1, ease: "easeOut", delay: idx * 0.1 }}
                                    className={`h-full rounded-full ${
                                        res.score >= 80 ? 'bg-emerald-500' :
                                        res.score >= 60 ? 'bg-blue-500' :
                                        'bg-red-500'
                                    }`}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Skill Coverage Matrix */}
            <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-subtle overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-indigo-500" /> Skill Coverage Matrix
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                        <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-xs uppercase tracking-wider font-bold text-slate-400">
                            <tr>
                                <th className="px-6 py-4 sticky left-0 bg-slate-50 dark:bg-slate-900 z-10 w-1/3 border-r border-slate-200 dark:border-slate-700">Required Skill</th>
                                {results.map(res => (
                                    <th key={res.resume_id} className="px-4 py-4 text-center truncate max-w-[150px]">{res.filename}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {masterSkills.length === 0 ? (
                                <tr><td colSpan={results.length + 1} className="px-6 py-8 text-center opacity-50 italic">No skills extracted.</td></tr>
                            ) : (
                                masterSkills.map(skill => (
                                    <tr key={skill} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                        <td className="px-6 py-3 font-medium sticky left-0 bg-white dark:bg-slate-800 border-r border-slate-100 dark:border-slate-700">{skill}</td>
                                        {results.map(res => {
                                            const hasSkill = candidateSkillsMap[res.resume_id]?.matched?.has(skill);
                                            const missingSkill = candidateSkillsMap[res.resume_id]?.missing?.has(skill);
                                            return (
                                                <td key={res.resume_id} className="px-4 py-3 text-center">
                                                    {hasSkill ? (
                                                        <span className="inline-flex justify-center items-center text-emerald-500 font-black">✓</span>
                                                    ) : missingSkill ? (
                                                        <span className="inline-flex justify-center items-center text-red-500/50 font-bold">✗</span>
                                                    ) : (
                                                        <span className="inline-flex justify-center items-center text-slate-300 dark:text-slate-600">-</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detailed Insights */}
            <div className="space-y-6">
                <h3 className="font-bold text-slate-900 dark:text-white text-xl border-b border-slate-200 dark:border-slate-800 pb-2">Detailed Matrix Insights</h3>
                
                <div className="grid lg:grid-cols-2 gap-6">
                    {results.map((res) => {
                        const analysis = res.analysis_data || {};
                        const llm = analysis.llm_analysis || {};
                        const metrics = (analysis.metrics || []).find(m => m.id === res.resume_id) || {};
                        
                        return (
                            <motion.div 
                                key={res.resume_id}
                                initial={{ opacity: 0, scale: 0.98 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="flex justify-between items-start mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">
                                    <div>
                                        <h4 className="font-bold text-lg text-slate-900 dark:text-white">{res.filename}</h4>
                                        <p className="text-xs text-slate-500 font-mono mt-1">ID: {res.resume_id.substring(0,8)}</p>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-3xl font-black text-slate-900 dark:text-white">{res.score}%</span>
                                        <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Match</span>
                                    </div>
                                </div>

                                <div className="space-y-5 text-sm">
                                    {/* Strengths */}
                                    <div>
                                        <h5 className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 mb-2">
                                            <UserCheck className="w-4 h-4" /> Core Strengths
                                        </h5>
                                        <ul className="list-disc list-outside ml-5 text-slate-600 dark:text-slate-300 space-y-1">
                                            {(metrics.strengths && metrics.strengths.length > 0) ? 
                                                metrics.strengths.map((s, i) => <li key={i}>{s}</li>) : 
                                                <li className="italic opacity-50">No notable strengths identified.</li>
                                            }
                                        </ul>
                                    </div>

                                    {/* Weaknesses */}
                                    <div>
                                        <h5 className="font-bold text-red-500 dark:text-red-400 flex items-center gap-2 mb-2">
                                            <AlertTriangle className="w-4 h-4" /> Areas for Improvement
                                        </h5>
                                        <ul className="list-disc list-outside ml-5 text-slate-600 dark:text-slate-300 space-y-1">
                                            {(metrics.weaknesses && metrics.weaknesses.length > 0) ? 
                                                metrics.weaknesses.map((w, i) => <li key={i}>{w}</li>) : 
                                                <li className="italic opacity-50">No major weaknesses.</li>
                                            }
                                        </ul>
                                    </div>

                                    {/* Missing Skills */}
                                    {metrics.missing_skills && metrics.missing_skills.length > 0 && (
                                        <div>
                                            <h5 className="font-bold text-amber-600 dark:text-amber-500 text-xs uppercase tracking-wider mb-2">Missing Key Skills</h5>
                                            <div className="flex flex-wrap gap-1.5">
                                                {metrics.missing_skills.map((skill, i) => (
                                                    <span key={i} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] rounded-md border border-slate-200 dark:border-slate-600">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Recommendations */}
                                    {metrics.recommendations && metrics.recommendations.length > 0 && (
                                        <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-900/30">
                                            <h5 className="font-bold text-blue-700 dark:text-blue-400 flex items-center gap-2 mb-2 text-xs uppercase tracking-wider">
                                                <BookOpen className="w-4 h-4" /> Recommendations
                                            </h5>
                                            <ul className="list-disc list-outside ml-4 text-slate-700 dark:text-slate-300 text-xs space-y-1">
                                                {metrics.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ComparisonDetailView;
