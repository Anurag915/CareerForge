import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
    Trophy, ArrowLeft, Star, TrendingUp, AlertTriangle, BookOpen, 
    UserCheck, ShieldAlert, Award, Download, FileText, Share2, 
    ChevronDown, ChevronUp, CheckCircle2, Clock, Calendar, BarChart3,
    FileSearch, Activity, Target
} from 'lucide-react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import MultiResumeViewerModal from './MultiResumeViewerModal';

const parseDateTime = (str) => {
    if (!str) return new Date();
    let d = new Date(str);
    if (!isNaN(d.getTime())) return d;
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
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatDuration = (start, end) => {
    if (!start || !end) return '-';
    const durationMs = parseDateTime(end) - parseDateTime(start);
    if (durationMs < 0) return '-';
    const seconds = Math.floor(durationMs / 1000);
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    return `${mins}m ${seconds % 60}s`;
};

const MatchBadge = ({ score }) => {
    if (score >= 80) return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold whitespace-nowrap border border-emerald-200 dark:border-emerald-800/50"><CheckCircle2 className="w-3 h-3"/> Excellent Match</span>;
    if (score >= 60) return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold whitespace-nowrap border border-blue-200 dark:border-blue-800/50"><Star className="w-3 h-3"/> Good Match</span>;
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold whitespace-nowrap border border-amber-200 dark:border-amber-800/50"><AlertTriangle className="w-3 h-3"/> Needs Review</span>;
};

const ComparisonDetailView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [viewingResumes, setViewingResumes] = useState(false);
    const [initialViewerIndex, setInitialViewerIndex] = useState(0);
    const [showSkillMatrix, setShowSkillMatrix] = useState(false);

    const { data: detail, isLoading, error } = useQuery({
        queryKey: ['comparison_detail', id],
        queryFn: async () => {
            const res = await api.get(`/api/comparisons/${id}`);
            return res.data;
        },
        retry: false
    });

    // Invalidate stale cache if backend was just updated to include pdf_url
    React.useEffect(() => {
        if (detail?.results?.length > 0 && detail.results[0].pdf_url === undefined) {
            queryClient.invalidateQueries(['comparison_detail', id]);
        }
    }, [detail, id, queryClient]);

    if (isLoading) return (
        <div className="w-full py-20 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-slate-900 dark:border-accent-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-slate-500 font-medium">Loading intelligence report...</p>
        </div>
    );

    if (error || !detail) return (
        <div className="w-full py-20 flex flex-col items-center justify-center space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-6 rounded-2xl flex flex-col items-center text-center max-w-md border border-red-200 dark:border-red-800">
                <ShieldAlert className="w-12 h-12 mb-4" />
                <h3 className="font-bold text-lg mb-2">Report Not Found</h3>
                <p className="text-sm opacity-80 mb-6">We couldn't locate this evaluation. It may have been deleted or you might not have access.</p>
                <button onClick={() => navigate('/')} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl font-semibold transition-colors">
                    Return to Dashboard
                </button>
            </div>
        </div>
    );

    const results = detail.results || [];
    const winner = results.length > 0 ? results[0] : null;
    
    const allSkillsSet = new Set();
    const candidateSkillsMap = {};
    let totalScore = 0;
    let minScore = 100;
    let maxScore = 0;

    results.forEach(res => {
        const analysis = res.analysis_data || {};
        const metrics = (analysis.metrics || []).find(m => m.id === res.resume_id) || {};
        const matched = metrics.matched_skills || [];
        const missing = metrics.missing_skills || [];
        
        matched.forEach(s => allSkillsSet.add(s));
        missing.forEach(s => allSkillsSet.add(s));
        
        const totalSkills = matched.length + missing.length;
        candidateSkillsMap[res.resume_id] = {
            matched: new Set(matched),
            missing: new Set(missing),
            coverage: totalSkills > 0 ? Math.round((matched.length / totalSkills) * 100) : 0,
            missingCount: missing.length
        };

        totalScore += res.score || 0;
        if (res.score < minScore) minScore = res.score;
        if (res.score > maxScore) maxScore = res.score;
    });
    
    if (minScore === 100 && results.length === 0) minScore = 0;

    const masterSkills = Array.from(allSkillsSet).sort();
    const avgScore = results.length > 0 ? Math.round(totalScore / results.length) : 0;
    const avgCoverage = results.length > 0 ? Math.round(results.reduce((acc, r) => acc + candidateSkillsMap[r.resume_id].coverage, 0) / results.length) : 0;

    const handleMockAction = (featureName) => {
        toast.info(`${featureName} is coming soon!`);
    };

    const handleViewResume = (resumeId) => {
        const index = results.findIndex(r => r.resume_id === resumeId);
        setInitialViewerIndex(index >= 0 ? index : 0);
        setViewingResumes(true);
    };

    let winningReasons = [];
    if (winner && results.length > 0) {
        const winStats = candidateSkillsMap[winner.resume_id];
        
        if (winner.score === maxScore && results.length > 1) winningReasons.push(`Highest ATS Score (${winner.score}%) out of all candidates evaluated.`);
        if (winStats?.coverage >= 80) winningReasons.push(`Exceptional technical skill alignment with ${winStats.coverage}% keyword coverage.`);
        else if (winStats?.coverage > avgCoverage) winningReasons.push(`Strong technical skill alignment (${winStats.coverage}% coverage vs group average of ${avgCoverage}%).`);
        
        if (winStats?.missingCount === 0) winningReasons.push("Matches all strictly required skills identified in the Job Description.");
        else if (winStats?.missingCount <= 2) winningReasons.push(`Only ${winStats.missingCount} minor skill gap(s) identified.`);
        
        const winnerMetrics = (winner.analysis_data?.metrics || []).find(m => m.id === winner.resume_id);
        if (winnerMetrics && winnerMetrics.strengths && winnerMetrics.strengths.length > 0) {
            winningReasons.push(winnerMetrics.strengths[0]);
        }
    }

    const jobDescription = detail.job_description || "Custom Job Description";

    return (
        <div className="w-full max-w-[1200px] mx-auto space-y-8 pb-20 font-sans theme-transition">
            
            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6 pt-2">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-transparent dark:border-slate-700"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-500" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Resume Comparison Report</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                            Evaluation #{id.split('-')[0].toUpperCase()}
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                    <button onClick={() => setViewingResumes(true)} className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm whitespace-nowrap">
                        <FileText className="w-4 h-4 text-blue-500" /> View Resumes
                    </button>
                    <button onClick={() => handleMockAction('Export PDF')} className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm whitespace-nowrap">
                        <Share2 className="w-4 h-4 text-emerald-500" /> Export PDF
                    </button>
                    <button onClick={() => handleMockAction('Download Results')} className="flex items-center gap-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 dark:hover:bg-white transition-colors shadow-sm whitespace-nowrap">
                        <Download className="w-4 h-4" /> Download JSON
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                    <Target className="w-5 h-5 text-accent-500" />
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Role Profile Summary</h2>
                </div>
                
                <div className="grid md:grid-cols-[2fr_1fr] gap-8">
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Target Job Description</h3>
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-5 border border-slate-100 dark:border-slate-800 max-h-[250px] overflow-y-auto">
                            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                {jobDescription}
                            </p>
                        </div>
                        
                        {masterSkills.length > 0 && (
                            <div className="pt-2">
                                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Extracted Core Requirements</h3>
                                <div className="flex flex-wrap gap-2">
                                    {masterSkills.map(s => (
                                        <span key={s} className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50 rounded-lg text-xs font-semibold">
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="space-y-4 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-700 pt-6 md:pt-0 md:pl-8">
                        <div>
                            <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-2"><FileSearch className="w-3.5 h-3.5"/> Pipeline Size</span>
                            <span className="text-lg font-black text-slate-900 dark:text-white">{results.length} Resumes Evaluated</span>
                        </div>
                        <div>
                            <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-2"><Calendar className="w-3.5 h-3.5"/> Initiated</span>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{formatDate(detail.created_at)}</span>
                        </div>
                        <div>
                            <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5"/> Completed</span>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{formatDate(detail.completed_at)}</span>
                        </div>
                        <div>
                            <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-2"><Clock className="w-3.5 h-3.5"/> Processing Time</span>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{formatDuration(detail.created_at, detail.completed_at)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Recommended Candidate */}
                {winner && (
                    <div className="lg:col-span-2 relative bg-gradient-to-br from-amber-100 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/10 border border-amber-200 dark:border-amber-700/30 rounded-2xl p-6 overflow-hidden shadow-sm">
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                            <Trophy className="w-48 h-48" />
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row gap-8">
                            <div className="flex-shrink-0 bg-white dark:bg-amber-900/50 w-28 h-28 rounded-full flex items-center justify-center shadow-md border-4 border-amber-50 dark:border-amber-800/50">
                                <span className="text-4xl">🏆</span>
                            </div>
                            <div className="flex-grow">
                                <h2 className="text-amber-700 dark:text-amber-500 font-black tracking-widest uppercase text-xs mb-2 flex items-center gap-2">
                                    <Award className="w-4 h-4" /> Top Recommendation
                                </h2>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 truncate">{winner.filename}</h3>
                                <div className="inline-flex items-center gap-2 bg-amber-500 text-white px-4 py-1.5 rounded-xl font-bold text-sm shadow-sm mb-6">
                                    <Star className="w-4 h-4 fill-current" />
                                    Overall Match: {winner.score}%
                                </div>
                                
                                <div className="bg-white/60 dark:bg-black/20 rounded-xl p-5 border border-amber-200/50 dark:border-amber-700/50 backdrop-blur-sm">
                                    <h4 className="text-xs font-bold text-slate-900 dark:text-amber-100 uppercase tracking-wider mb-3">Why This Resume Won</h4>
                                    <ul className="space-y-2">
                                        {winningReasons.map((reason, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-slate-800 dark:text-slate-300 font-medium">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                                <span className="leading-snug">{reason}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Executive Metrics */}
                <div className="bg-slate-900 dark:bg-slate-800 rounded-2xl p-6 text-white shadow-lg border border-slate-800 dark:border-slate-700 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                        <BarChart3 className="w-48 h-48" />
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                            <Activity className="w-4 h-4" /> Cohort Metrics
                        </h2>
                        
                        <div className="grid grid-cols-2 gap-6 mb-8">
                            <div>
                                <span className="block text-4xl font-black text-white">{avgScore}<span className="text-xl text-slate-500">%</span></span>
                                <span className="block text-xs font-bold text-slate-400 mt-1 uppercase">Avg Score</span>
                            </div>
                            <div>
                                <span className="block text-4xl font-black text-white">{avgCoverage}<span className="text-xl text-slate-500">%</span></span>
                                <span className="block text-xs font-bold text-slate-400 mt-1 uppercase">Avg Skill Match</span>
                            </div>
                            <div>
                                <span className="block text-3xl font-black text-emerald-400">{maxScore}<span className="text-base text-emerald-700">%</span></span>
                                <span className="block text-[10px] font-bold text-slate-400 mt-1 uppercase">High Score</span>
                            </div>
                            <div>
                                <span className="block text-3xl font-black text-red-400">{minScore}<span className="text-base text-red-700">%</span></span>
                                <span className="block text-[10px] font-bold text-slate-400 mt-1 uppercase">Low Score</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="relative z-10 pt-6 border-t border-slate-800 dark:border-slate-700">
                        <div className="flex justify-between items-center text-sm font-medium">
                            <span className="text-slate-400">Total Pipeline</span>
                            <span className="bg-slate-800 dark:bg-slate-900 px-3 py-1 rounded-lg font-bold">{results.length} Resumes</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ranking Table */}
            <div className="bg-white dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
                    <TrendingUp className="w-6 h-6 text-indigo-500" />
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Resume Ranking</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-4 w-24 text-center">Rank</th>
                                <th className="px-6 py-4">Resume Profile</th>
                                <th className="px-6 py-4">Coverage</th>
                                <th className="px-6 py-4">Gaps</th>
                                <th className="px-6 py-4">Recommendation</th>
                                <th className="px-6 py-4 text-right">ATS Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {results.map((res, idx) => {
                                const stats = candidateSkillsMap[res.resume_id] || { coverage: 0, missingCount: 0 };
                                return (
                                    <tr key={res.resume_id} className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/80 ${idx === 0 ? "bg-amber-50/20 dark:bg-amber-900/10" : ""}`}>
                                        <td className="px-6 py-4 text-center text-xl">
                                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : <span className="text-sm font-bold text-slate-400">#{idx + 1}</span>}
                                        </td>
                                        <td className="px-6 py-5 font-bold text-slate-900 dark:text-white truncate max-w-[200px] cursor-pointer hover:text-accent-500 transition-colors" onClick={() => handleViewResume(res.resume_id)}>
                                            {res.filename}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${stats.coverage}%` }}/>
                                                </div>
                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{stats.coverage}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${stats.missingCount === 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                                                {stats.missingCount} Missing
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <MatchBadge score={res.score} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-lg font-black text-slate-900 dark:text-white">
                                                {res.score}<span className="text-sm text-slate-400 font-bold ml-0.5">%</span>
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Collapsible Skill Coverage Matrix */}
            <div className="bg-white dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <button 
                    onClick={() => setShowSkillMatrix(!showSkillMatrix)}
                    className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <BookOpen className="w-6 h-6 text-indigo-500" />
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">Detailed Skill Matrix</h3>
                        <span className="hidden md:inline-block px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold rounded-full ml-2 uppercase tracking-wider">Advanced</span>
                    </div>
                    {showSkillMatrix ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </button>
                
                <AnimatePresence>
                    {showSkillMatrix && (
                        <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden border-t border-slate-100 dark:border-slate-700"
                        >
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                                    <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-xs uppercase tracking-wider font-bold text-slate-400">
                                        <tr>
                                            <th className="px-6 py-4 sticky left-0 bg-slate-50 dark:bg-slate-900 z-10 min-w-[200px] border-r border-slate-200 dark:border-slate-700">Requirement</th>
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
                                                <tr key={skill} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="px-6 py-3 font-semibold sticky left-0 bg-white dark:bg-slate-800 border-r border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200">{skill}</td>
                                                    {results.map(res => {
                                                        const hasSkill = candidateSkillsMap[res.resume_id]?.matched?.has(skill);
                                                        const missingSkill = candidateSkillsMap[res.resume_id]?.missing?.has(skill);
                                                        return (
                                                            <td key={res.resume_id} className="px-4 py-3 text-center">
                                                                {hasSkill ? (
                                                                    <span className="inline-flex justify-center items-center text-emerald-500 font-black">✓</span>
                                                                ) : missingSkill ? (
                                                                    <span className="inline-flex justify-center items-center text-red-400 font-bold opacity-50">✗</span>
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
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Detailed Insights */}
            <div className="space-y-6 pt-4">
                <div className="flex items-center gap-3 mb-6">
                    <UserCheck className="w-6 h-6 text-accent-500" />
                    <h3 className="font-bold text-xl text-slate-900 dark:text-white">Individual Resume Reports</h3>
                </div>
                
                <div className="grid lg:grid-cols-2 gap-6">
                    {results.map((res) => {
                        const analysis = res.analysis_data || {};
                        const metrics = (analysis.metrics || []).find(m => m.id === res.resume_id) || {};
                        const stats = candidateSkillsMap[res.resume_id] || { coverage: 0, missingCount: 0 };
                        
                        return (
                            <motion.div 
                                key={res.resume_id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex flex-col"
                            >
                                <div className="flex justify-between items-start mb-5 pb-5 border-b border-slate-100 dark:border-slate-700">
                                    <div className="pr-4">
                                        <h4 className="font-black text-xl text-slate-900 dark:text-white mb-2 leading-tight">{res.filename}</h4>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <MatchBadge score={res.score} />
                                            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-md border border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                                                {stats.coverage}% Coverage
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end shrink-0">
                                        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex flex-col items-center justify-center border border-blue-100 dark:border-blue-800/50 text-blue-700 dark:text-blue-400">
                                            <span className="text-2xl font-black leading-none">{res.score}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6 flex-1 text-sm">
                                    {/* Strengths */}
                                    <div>
                                        <h5 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                                            <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"><CheckCircle2 className="w-3.5 h-3.5" /></div> 
                                            Key Strengths
                                        </h5>
                                        <ul className="space-y-2">
                                            {(metrics.strengths && metrics.strengths.length > 0) ? 
                                                metrics.strengths.map((s, i) => (
                                                    <li key={i} className="flex gap-2.5 text-slate-600 dark:text-slate-300 leading-relaxed">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5"></span>
                                                        <span>{s}</span>
                                                    </li>
                                                )) : 
                                                <li className="italic opacity-50 text-slate-500">No notable strengths identified.</li>
                                            }
                                        </ul>
                                    </div>

                                    {/* Weaknesses */}
                                    <div>
                                        <h5 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                                            <div className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center"><AlertTriangle className="w-3.5 h-3.5" /></div> 
                                            Areas for Improvement
                                        </h5>
                                        <ul className="space-y-2">
                                            {(metrics.weaknesses && metrics.weaknesses.length > 0) ? 
                                                metrics.weaknesses.map((w, i) => (
                                                    <li key={i} className="flex gap-2.5 text-slate-600 dark:text-slate-300 leading-relaxed">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-1.5"></span>
                                                        <span>{w}</span>
                                                    </li>
                                                )) : 
                                                <li className="italic opacity-50 text-slate-500">No major weaknesses identified.</li>
                                            }
                                        </ul>
                                    </div>

                                    {/* Missing Skills */}
                                    {metrics.missing_skills && metrics.missing_skills.length > 0 && (
                                        <div className="pt-2">
                                            <h5 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-3">Missing Requirements</h5>
                                            <div className="flex flex-wrap gap-2">
                                                {metrics.missing_skills.map((skill, i) => (
                                                    <span key={i} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Recommendations */}
                                    {metrics.recommendations && metrics.recommendations.length > 0 && (
                                        <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl p-5 border border-blue-100 dark:border-blue-900/30 mt-4">
                                            <h5 className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-3 text-xs uppercase tracking-wider">
                                                <BookOpen className="w-4 h-4" /> Recruiter Recommendation
                                            </h5>
                                            <ul className="space-y-2 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                                                {metrics.recommendations.map((rec, i) => (
                                                    <li key={i} className="flex gap-2">
                                                        <span className="text-blue-500 mt-0.5">•</span>
                                                        <span>{rec}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
                                    <button 
                                        onClick={() => handleViewResume(res.resume_id)}
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl text-slate-700 dark:text-slate-300 font-bold transition-colors"
                                    >
                                        <FileText className="w-4 h-4" /> Review Original Resume
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            <MultiResumeViewerModal 
                isOpen={viewingResumes}
                onClose={() => setViewingResumes(false)}
                resumes={results.map(r => ({ ...r, id: r.resume_id }))}
                comparisonName={`Comparison #${id.split('-')[0]}`}
                initialIndex={initialViewerIndex}
            />
        </div>
    );
};

export default ComparisonDetailView;
