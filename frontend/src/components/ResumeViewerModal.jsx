import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Download } from 'lucide-react';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

const ResumeViewerModal = ({ isOpen, onClose, pdfUrl, filename }) => {
    const defaultLayoutPluginInstance = defaultLayoutPlugin({
        sidebarTabs: (defaultTabs) => [],
    });

    if (!isOpen) return null;

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
                    className="w-full max-w-5xl h-[90vh] bg-white dark:bg-slate-950 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
                        <div className="flex items-center gap-3">
                            <h3 className="font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                                {filename || 'Resume Document'}
                            </h3>
                            {pdfUrl && (
                                <a 
                                    href={pdfUrl} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="p-1.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors"
                                    title="Open Original"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            )}
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Viewer Body */}
                    <div className="flex-1 overflow-hidden relative bg-slate-100 dark:bg-slate-900/50">
                        {pdfUrl ? (
                            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                                <Viewer
                                    fileUrl={`https://corsproxy.io/?${encodeURIComponent(pdfUrl)}`}
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
                                                <span className="font-mono text-[10px] break-all text-slate-400">{pdfUrl}</span>
                                            </p>
                                            <a 
                                                href={pdfUrl}
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
                                <a 
                                    href={pdfUrl}
                                    download
                                    className="px-6 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl flex items-center gap-2 hover:bg-slate-800 dark:hover:bg-white transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                    Download File
                                </a>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
};

export default ResumeViewerModal;
