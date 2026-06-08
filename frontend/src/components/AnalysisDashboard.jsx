import React, { useMemo } from 'react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import { 
    ChevronLeft, FileText, Download, ExternalLink, MessageSquare, Scale, RefreshCw, 
    DownloadCloud, Target, CheckCircle2, AlertCircle, TrendingUp, TrendingDown, 
    Briefcase, GraduationCap, Award, Hash, Zap, Clock, Check, XCircle, LayoutTemplate, Star,
    Loader2
} from 'lucide-react';

const Card = ({ children, className = "" }) => (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden ${className}`}>
        {children}
    </div>
);

const SectionHeader = ({ icon: Icon, title, badge }) => (
    <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-blue-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">{title}</h3>
        </div>
        {badge && <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full">{badge}</span>}
    </div>
);

const AnalysisDashboard = ({ results, onBack }) => {
    const { 
        ats_score = 0, 
        matched_skills = [], 
        missing_skills = [],
        keywords = [],
        sections = {},
        improved_points = [],
        pdf_url = null,
        filename = "Resume Document"
    } = results || {};

    const defaultLayoutPluginInstance = defaultLayoutPlugin();

    // Derived Data
    const skillCount = matched_skills.length;
    const missingCount = missing_skills.length;
    const keywordCount = keywords.length;
    
    // Attempt to parse sections for counts if they are arrays
    const parseCount = (data) => {
        if (Array.isArray(data)) return data.length;
        if (typeof data === 'string') {
            const lines = data.split('\n').filter(l => l.trim().length > 10);
            return lines.length > 0 ? lines.length : 1;
        }
        return 0;
    };

    const expCount = parseCount(sections.experience);
    const projCount = parseCount(sections.projects);
    const eduCount = parseCount(sections.education);

    // AI Strengths and Weaknesses derived logic
    const strengths = useMemo(() => {
        let s = [];
        if (ats_score > 70) s.push("Strong overall ATS alignment");
        if (skillCount > 5) s.push(`Demonstrates solid technical foundation (${skillCount} matching skills)`);
        if (expCount > 1) s.push("Relevant professional experience detected");
        if (projCount > 1) s.push("Strong portfolio of practical projects");
        return s.length > 0 ? s : ["Baseline qualifications met"];
    }, [ats_score, skillCount, expCount, projCount]);

    const weaknesses = useMemo(() => {
        let w = [];
        if (ats_score < 50) w.push("Low semantic match with job description");
        if (missingCount > 3) w.push(`Critical skills missing (${missingCount} gaps)`);
        if (improved_points.length > 0) w.push("Impact statements lack measurable metrics");
        return w.length > 0 ? w : ["No critical weaknesses detected"];
    }, [ats_score, missingCount, improved_points]);

    const matchCategory = ats_score >= 80 ? { label: "Excellent Match", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/20" }
        : ats_score >= 60 ? { label: "Good Match", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10", border: "border-blue-200 dark:border-blue-500/20" }
        : ats_score >= 40 ? { label: "Moderate Match", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-200 dark:border-amber-500/20" }
        : { label: "Weak Match", color: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10", border: "border-red-200 dark:border-red-500/20" };

    const renderLoader = (percentages) => (
        <div className="flex flex-col items-center justify-center w-full h-full text-slate-400 bg-slate-50 dark:bg-slate-900">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-500" />
            <p className="text-sm font-medium">Loading document {Math.round(percentages)}%</p>
        </div>
    );

    const renderError = () => (
        <div className="flex flex-col items-center justify-center w-full h-full text-slate-500 p-6 text-center bg-slate-50 dark:bg-slate-900">
            <AlertCircle className="w-10 h-10 mb-3 text-red-400 opacity-80" />
            <p className="font-medium text-sm">Failed to load PDF</p>
        </div>
    );

    const formatContent = (content) => {
        if (!content) return <p className="text-sm text-slate-400 italic">No information available.</p>;
        if (typeof content === 'string') return <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{content}</p>;
        if (Array.isArray(content)) {
            return (
                <ul className="space-y-3">
                    {content.map((item, idx) => (
                        <li key={idx} className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed flex gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <span>{typeof item === 'string' ? item : JSON.stringify(item)}</span>
                        </li>
                    ))}
                </ul>
            );
        }
        return <pre className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg overflow-x-auto">{JSON.stringify(content, null, 2)}</pre>;
    };

    return (
        <div className="flex flex-col lg:flex-row w-full h-[calc(100vh-64px)] bg-slate-200 dark:bg-slate-800 overflow-hidden font-sans gap-[1px]">
            
            {/* LEFT PANEL: RESUME VIEWER */}
            <div className="w-full lg:w-1/2 h-[50vh] lg:h-full flex flex-col bg-white dark:bg-slate-900 z-10">
                {/* Custom Viewer Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={onBack}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-500 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-slate-400" />
                                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 max-w-[200px] truncate" title={filename}>{filename}</h2>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 rounded uppercase tracking-wider">Analyzed</span>
                                <span className="text-[10px] font-bold text-slate-400">SCORE: {ats_score}%</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                        {pdf_url && (
                            <>
                                <a 
                                    href={pdf_url} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-md transition-colors tooltip-trigger"
                                    title="Open in new tab"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                                <a 
                                    href={pdf_url} 
                                    download
                                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-md transition-colors"
                                    title="Download PDF"
                                >
                                    <Download className="w-4 h-4" />
                                </a>
                            </>
                        )}
                    </div>
                </div>

                {/* PDF Viewer Canvas */}
                <div className="flex-1 w-full relative bg-slate-100 dark:bg-[#1e1e24] overflow-hidden">
                    {!pdf_url ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                            <FileText className="w-12 h-12 mb-3 opacity-20" />
                            <p className="text-sm font-medium">Document Source Unavailable</p>
                        </div>
                    ) : (
                        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                            <Viewer
                                fileUrl={pdf_url}
                                plugins={[defaultLayoutPluginInstance]}
                                renderLoader={renderLoader}
                                renderError={renderError}
                                theme={{ theme: 'auto' }}
                            />
                        </Worker>
                    )}
                </div>
            </div>

            {/* RIGHT PANEL: INTELLIGENCE FEED */}
            <div className="w-full lg:w-1/2 h-[50vh] lg:h-full flex flex-col bg-slate-50 dark:bg-[#0f1117] relative z-10">
                
                {/* Sticky Quick Actions */}
                <div className="sticky top-0 z-20 flex items-center gap-2 p-3 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shrink-0">
                    <button className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm">
                        <MessageSquare className="w-3.5 h-3.5" /> Chat
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-lg transition-colors shadow-sm">
                        <Scale className="w-3.5 h-3.5" /> Compare
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-lg transition-colors shadow-sm">
                        <RefreshCw className="w-3.5 h-3.5" /> Re-run
                    </button>
                    <button className="w-10 flex items-center justify-center py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors shadow-sm" title="Export Report">
                        <DownloadCloud className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Scrollable Feed */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-6 space-y-6">
                    
                    {/* 1. Executive Summary & Timeline */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="col-span-1 md:col-span-2 p-4">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Extraction Summary</h3>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="text-center p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                    <div className="text-lg font-black text-slate-800 dark:text-slate-200">{skillCount}</div>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Skills</div>
                                </div>
                                <div className="text-center p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                    <div className="text-lg font-black text-slate-800 dark:text-slate-200">{expCount}</div>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Roles</div>
                                </div>
                                <div className="text-center p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                    <div className="text-lg font-black text-slate-800 dark:text-slate-200">{projCount}</div>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Projects</div>
                                </div>
                                <div className="text-center p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                    <div className="text-lg font-black text-slate-800 dark:text-slate-200">{eduCount}</div>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Edu</div>
                                </div>
                                <div className="text-center p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                    <div className="text-lg font-black text-slate-800 dark:text-slate-200">{keywordCount}</div>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Keywords</div>
                                </div>
                                <div className="text-center p-2 bg-red-50 dark:bg-red-500/10 rounded-lg border border-red-100 dark:border-red-500/20">
                                    <div className="text-lg font-black text-red-600 dark:text-red-400">{missingCount}</div>
                                    <div className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Missing</div>
                                </div>
                            </div>
                        </Card>
                        
                        <Card className="col-span-1 p-4 flex flex-col justify-between">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Processing Timeline</h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> Parsed</div>
                                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> Extracted</div>
                                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> Mapped</div>
                                <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400"><Target className="w-3.5 h-3.5" /> Evaluated</div>
                            </div>
                        </Card>
                    </div>

                    {/* 2. ATS Insights */}
                    <Card className="p-5">
                        <SectionHeader icon={Target} title="ATS Match Insights" badge="Core Metric" />
                        <div className="flex flex-col sm:flex-row items-center gap-6 mb-6 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800/50">
                            <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                    <path className="text-slate-200 dark:text-slate-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                    <path className={matchCategory.color} strokeDasharray={`${ats_score}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                </svg>
                                <div className="absolute flex flex-col items-center">
                                    <span className="text-3xl font-black text-slate-800 dark:text-slate-100 leading-none">{ats_score}</span>
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className={`inline-flex items-center px-2.5 py-1 rounded-md border ${matchCategory.bg} ${matchCategory.border} ${matchCategory.color} mb-3`}>
                                    <span className="text-xs font-bold uppercase tracking-wider">{matchCategory.label}</span>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                    This resume scored <strong className="text-slate-900 dark:text-white">{ats_score}%</strong> against the provided job description based on semantic keyword matching and experience relevance.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 bg-emerald-50/30 dark:bg-emerald-500/5 rounded-xl border border-emerald-100 dark:border-emerald-500/10">
                                <h4 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-3">
                                    <Check className="w-3.5 h-3.5" /> Matched Skills
                                </h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {matched_skills.map(s => (
                                        <span key={s} className="px-2 py-0.5 bg-white dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold rounded border border-emerald-200/50 dark:border-emerald-500/20 shadow-sm">{s}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="p-4 bg-red-50/50 dark:bg-red-500/5 rounded-xl border border-red-100 dark:border-red-500/10">
                                <h4 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 mb-3">
                                    <XCircle className="w-3.5 h-3.5" /> Missing Skills
                                </h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {missing_skills.length > 0 ? missing_skills.map(s => (
                                        <span key={s} className="px-2 py-0.5 bg-white dark:bg-red-500/10 text-red-700 dark:text-red-300 text-[11px] font-bold rounded border border-red-200/50 dark:border-red-500/20 shadow-sm">{s}</span>
                                    )) : <span className="text-xs text-slate-500 italic">No critical missing skills.</span>}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* 3. Strengths & Weaknesses */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Card className="p-5 border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/10 dark:bg-emerald-500/5">
                            <h3 className="flex items-center gap-2 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-4"><TrendingUp className="w-4 h-4" /> AI Identified Strengths</h3>
                            <ul className="space-y-3">
                                {strengths.map((str, i) => (
                                    <li key={i} className="flex gap-2 text-sm text-slate-700 dark:text-slate-300">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> <span className="leading-snug">{str}</span>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                        <Card className="p-5 border-amber-100 dark:border-amber-500/20 bg-amber-50/10 dark:bg-amber-500/5">
                            <h3 className="flex items-center gap-2 text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-4"><TrendingDown className="w-4 h-4" /> Areas of Concern</h3>
                            <ul className="space-y-3">
                                {weaknesses.map((w, i) => (
                                    <li key={i} className="flex gap-2 text-sm text-slate-700 dark:text-slate-300">
                                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" /> <span className="leading-snug">{w}</span>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    </div>

                    {/* Content Sections */}
                    <Card className="p-5">
                        <SectionHeader icon={Briefcase} title="Professional Experience" badge={`${expCount} Roles`} />
                        {formatContent(sections.experience)}
                    </Card>

                    <Card className="p-5">
                        <SectionHeader icon={LayoutTemplate} title="Key Projects" badge={`${projCount} Projects`} />
                        {formatContent(sections.projects)}
                    </Card>

                    <Card className="p-5">
                        <SectionHeader icon={Zap} title="Technical Skills" />
                        {formatContent(sections.skills)}
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="p-5">
                            <SectionHeader icon={GraduationCap} title="Education" />
                            {formatContent(sections.education)}
                        </Card>
                        
                        <Card className="p-5">
                            <SectionHeader icon={Award} title="Certifications & Achievements" />
                            {formatContent(sections.achievements)}
                        </Card>
                    </div>

                    {keywords.length > 0 && (
                        <Card className="p-5">
                            <SectionHeader icon={Hash} title="Keywords Extracted" badge={keywordCount} />
                            <div className="flex flex-wrap gap-1.5">
                                {keywords.map((k, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-semibold rounded border border-slate-200 dark:border-slate-700">{k}</span>
                                ))}
                            </div>
                        </Card>
                    )}

                    {improved_points.length > 0 && (
                        <Card className="p-5 border-blue-200 dark:border-blue-800/50 bg-blue-50/30 dark:bg-blue-900/10">
                            <SectionHeader icon={Star} title="AI Recommendations" />
                            {formatContent(improved_points)}
                        </Card>
                    )}

                    {/* Bottom Padding */}
                    <div className="h-8"></div>
                </div>
            </div>
        </div>
    );
};

export default AnalysisDashboard;
