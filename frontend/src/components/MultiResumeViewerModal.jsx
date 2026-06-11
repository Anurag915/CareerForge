import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Download, FileText, ChevronRight } from 'lucide-react';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const MultiResumeViewerModal = ({ isOpen, onClose, resumes, comparisonName, initialIndex = 0 }) => {
    const defaultLayoutPluginInstance = defaultLayoutPlugin({
        sidebarTabs: () => [],
    });

    const [selectedIndex, setSelectedIndex] = useState(0);

    // Reset selection when modal opens with new resumes
    useEffect(() => {
        if (isOpen) setSelectedIndex(initialIndex);
    }, [isOpen, resumes, initialIndex]);

    if (!isOpen) return null;

    const validResumes = resumes?.filter(r => r && r.id) || [];
    const activeResume = validResumes[selectedIndex];

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-8"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-6xl h-[90vh] bg-white dark:bg-slate-950 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
                        <div className="flex flex-col">
                            <h3 className="font-bold text-slate-900 dark:text-white truncate">
                                Viewing Resumes
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {comparisonName || 'Comparison Job'}
                            </p>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex flex-1 overflow-hidden">
                        {/* Sidebar */}
                        <div className="w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 overflow-y-auto shrink-0 flex flex-col">
                            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Candidates ({validResumes.length})</h4>
                            </div>
                            <div className="flex-1 p-2 space-y-1">
                                {validResumes.map((resume, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedIndex(idx)}
                                        className={`w-full text-left flex items-center justify-between px-3 py-3 rounded-xl transition-all ${selectedIndex === idx ? 'bg-accent-50 dark:bg-accent-500/10 border border-accent-200 dark:border-accent-500/20 shadow-sm' : 'hover:bg-slate-200 dark:hover:bg-slate-800 border border-transparent'}`}
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <FileText className={`w-4 h-4 shrink-0 ${selectedIndex === idx ? 'text-accent-500' : 'text-slate-400'}`} />
                                            <div className="flex flex-col overflow-hidden">
                                                <span className={`text-sm truncate font-medium ${selectedIndex === idx ? 'text-accent-700 dark:text-accent-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                                    {resume.filename || `Candidate ${idx+1}`}
                                                </span>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {resume.score !== undefined && resume.score !== null && (
                                                        <span className={`text-[10px] uppercase font-bold ${selectedIndex === idx ? 'text-accent-600 dark:text-accent-500' : 'text-slate-500 dark:text-slate-400'}`}>
                                                            Score: {resume.score}%
                                                        </span>
                                                    )}
                                                    {resume.created_at && (
                                                        <span className="text-[10px] text-slate-400 font-medium">
                                                            {resume.score !== undefined && resume.score !== null ? '• ' : ''}
                                                            {formatDate(resume.created_at)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {selectedIndex === idx && (
                                            <ChevronRight className="w-4 h-4 text-accent-500 shrink-0" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Viewer Body */}
                        <div className="flex-1 overflow-hidden relative bg-slate-100 dark:bg-slate-900/50 flex flex-col">
                            {/* Toolbar for active resume */}
                            {activeResume && (
                                <div className="h-12 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 shrink-0">
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">
                                        {activeResume.filename}
                                    </span>
                                    {activeResume.pdf_url && (
                                        <a 
                                            href={activeResume.pdf_url} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                            Open External
                                        </a>
                                    )}
                                </div>
                            )}

                            {activeResume?.pdf_url ? (
                                <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                                    <Viewer
                                        fileUrl={activeResume.pdf_url}
                                        plugins={[defaultLayoutPluginInstance]}
                                        renderError={(error) => (
                                            <div className="flex flex-col items-center justify-center h-full space-y-4 p-8 text-center bg-slate-50 dark:bg-slate-900">
                                                <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-500/10 flex items-center justify-center text-red-500 mb-2">
                                                    <X className="w-8 h-8" />
                                                </div>
                                                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Failed to load PDF</h4>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                                                    {error.message || "The document could not be loaded. It may have been removed or access is restricted."}
                                                    <br /><br />
                                                    <span className="font-mono text-[10px] break-all text-slate-400">{activeResume.pdf_url}</span>
                                                </p>
                                                <a 
                                                    href={activeResume.pdf_url}
                                                    download
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="px-6 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl flex items-center gap-2 hover:bg-slate-800 dark:hover:bg-white transition-colors mt-4"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    Download Directly
                                                </a>
                                            </div>
                                        )}
                                    />
                                </Worker>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full space-y-4 p-8 text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center text-amber-500 mb-2">
                                        <ExternalLink className="w-8 h-8" />
                                    </div>
                                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">PDF Preview Unavailable</h4>
                                    <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                                        This document is not a PDF or hasn't been synced to the cloud viewer yet.
                                    </p>
                                    {activeResume?.pdf_url && (
                                        <a 
                                            href={activeResume.pdf_url}
                                            download
                                            className="px-6 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl flex items-center gap-2 hover:bg-slate-800 dark:hover:bg-white transition-colors"
                                        >
                                            <Download className="w-4 h-4" />
                                            Download File
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
};

export default MultiResumeViewerModal;
