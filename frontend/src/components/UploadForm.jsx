import { useState, useRef, useCallback, useMemo } from "react";
import { Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud,
  FileText,
  X,
  AlertCircle,
  Loader2,
  ArrowRight,
  Trash2,
  CheckCircle2,
  User,
} from "lucide-react";

// Utility for human-readable file sizes
const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const UploadForm = ({ onUpload, isLoading }) => {
  const [files, setFiles] = useState([]);
  const [jobDescription, setJobDescription] = useState("");
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Constants for validation
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPE = "application/pdf";

  const validateAndAddFiles = useCallback(
    (newFiles) => {
      setError("");
      const incomingFiles = Array.from(newFiles);

      const validFiles = incomingFiles.filter((file) => {
        if (file.type !== ALLOWED_TYPE) {
          setError(`"${file.name}" is not a PDF.`);
          return false;
        }
        if (file.size > MAX_FILE_SIZE) {
          setError(`"${file.name}" exceeds the 5MB limit.`);
          return false;
        }
        // Check for duplicates
        if (files.some((f) => f.name === file.name && f.size === file.size)) {
          return false;
        }
        return true;
      });

      setFiles((prev) => [...prev, ...validFiles]);
    },
    [files],
  );

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => setFiles([]);

  const isFormValid = useMemo(() => {
    return files.length > 0 && jobDescription.trim().length > 50;
  }, [files, jobDescription]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    onUpload(files, jobDescription);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-6xl mx-auto"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] shadow-2xl overflow-hidden">
        {/* Header Section */}
        <div className="px-10 py-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-slate-50/50 to-white dark:from-slate-900/50 dark:to-slate-900">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Candidate Intelligence
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-500/20 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                AI Powered
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-md">
              Analyze and match resumes with high-precision AI scoring.
            </p>
          </div>
          {files.length > 0 && (
            <button
              onClick={clearAllFiles}
              className="px-4 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2 transition-all active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
              Reset All
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
            {/* Left: Upload Area */}
            <div className="space-y-6 flex flex-col">
              <div className="flex justify-between items-end px-1">
                <div className="space-y-1">
                  <label className="text-lg font-bold text-slate-800 dark:text-slate-200">
                    Target Resumes
                  </label>
                  <p className="text-[15px] text-slate-400 dark:text-slate-500">
                    PDF documents only • Max 5MB
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {files.length > 0 && (
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                  <span className="text-[10px] uppercase tracking-tighter text-slate-400 font-black">
                    {files.length}{" "}
                    {files.length === 1 ? "Candidate" : "Candidates"}
                  </span>
                </div>
              </div>

              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current.click()}
                className={`
                  relative h-72 border-2 border-dashed rounded-3xl transition-all duration-500
                  flex flex-col items-center justify-center cursor-pointer group overflow-hidden
                  ${
                    isDragging
                      ? "border-blue-500 bg-blue-50/50 dark:bg-blue-500/5"
                      : "border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 bg-slate-50/20 dark:bg-slate-900/50"
                  }
                `}
              >
                {/* Subtle Gradient Background on Hover */}
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <input
                  type="file"
                  className="hidden"
                  accept=".pdf"
                  multiple
                  onChange={(e) => validateAndAddFiles(e.target.files)}
                  ref={fileInputRef}
                />

                <div
                  className={`p-5 rounded-[20px] mb-5 transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-1 ${isDragging ? "bg-blue-500 text-white shadow-xl shadow-blue-500/20" : "bg-white dark:bg-slate-800 text-slate-400 shadow-sm"}`}
                >
                  <UploadCloud className="w-10 h-10" />
                </div>
                <div className="text-center px-6">
                  <p className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
                    {isDragging
                      ? "Ready for Analysis"
                      : "Drop candidate profiles here"}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                    {isDragging
                      ? "Release to upload"
                      : "or click to choose files from device"}
                  </p>
                </div>

                {/* AI Hint */}
                {!isDragging && files.length === 0 && (
                  <div className="mt-8 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center gap-2 border border-slate-200/50 dark:border-slate-700/50">
                    <Sparkles className="w-3 h-3 text-blue-500" />
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      AI Ready for Batch Upload
                    </span>
                  </div>
                )}
              </div>

              {/* File Preview List */}
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                  {files.map((file, idx) => (
                    <motion.div
                      key={`${file.name}-${idx}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex items-center gap-4 p-3.5 bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-[18px] group hover:border-blue-500/30 transition-all"
                    >
                      <div className="bg-blue-50 dark:bg-blue-500/10 p-2.5 rounded-xl text-blue-600 transition-colors group-hover:bg-blue-500 group-hover:text-white">
                        <FileText className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                          {file.name}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-wider mt-0.5">
                          {formatFileSize(file.size)} • PDF
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(idx);
                        }}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Right: Job Description */}
            <div className="flex flex-col space-y-6">
              <div className="flex justify-between items-end px-1">
                <div className="space-y-1">
                  <label className="text-lg font-bold text-slate-800 dark:text-slate-200">
                    Job Description
                  </label>
                  <p className="text-[15px] text-slate-400 dark:text-slate-500">
                    Extracts skills & experience requirements
                  </p>
                </div>
                <div
                  className={`text-[12px] font-black tracking-widest uppercase px-2 py-1 rounded-md transition-colors ${jobDescription.length > 50 ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}
                >
                  {jobDescription.length} Characters
                </div>
              </div>

              <div className="relative flex-1 flex flex-col min-h-0">
                <div className="relative flex-1 group">
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the target job description to extract required skills and match candidates..."
                    className="w-full h-full min-h-[300px] p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 bg-slate-50/10 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 text-sm leading-relaxed focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all outline-none resize-none shadow-inner"
                  />
                  <div className="absolute top-6 right-6">
                    {jobDescription.length > 50 ? (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 text-white rounded-full text-[10px] font-bold shadow-lg shadow-emerald-500/20 animate-in fade-in zoom-in duration-500">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        JD Looks Strong
                      </div>
                    ) : jobDescription.length > 0 ? (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500 text-white rounded-full text-[10px] font-bold shadow-lg shadow-amber-500/20">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Insufficient Detail
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Intelligent Hints Area */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-lg text-blue-500 shadow-sm shrink-0">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest mb-1">
                        Pro Tip
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight font-medium">
                        Include technical stack and soft skills for better AI
                        extraction.
                      </p>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-lg text-emerald-500 shadow-sm shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest mb-1">
                        AI Ready
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight font-medium">
                        The system is ready to cross-reference multiple
                        documents.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error & Footer */}
          <div className="mt-12 pt-10 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-md">
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl text-red-600 dark:text-red-400"
                  >
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-bold tracking-tight">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>
              {!error && (
                <div className="flex items-center gap-4 text-slate-400 dark:text-slate-500">
                  <div className="flex -space-x-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-sm"
                      >
                         <User className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs font-bold tracking-tight">
                    Trusted by 2,000+ talent specialists.
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!isFormValid || isLoading}
              className={`
                min-w-[280px] py-4 px-8 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-500 flex items-center justify-center gap-3
                ${
                  !isFormValid || isLoading
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700 shadow-none"
                    : "bg-slate-900 dark:bg-blue-600 text-white hover:bg-black dark:hover:bg-blue-500 shadow-2xl shadow-blue-500/30 transform hover:scale-[1.02] active:scale-[0.98]"
                }
              `}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Analyzing Intelligence...</span>
                </>
              ) : (
                <>
                  <span>Compare Candidates</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 20px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
        }
      `}</style>
    </motion.div>
  );
};

export default UploadForm;
