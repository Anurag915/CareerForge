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
  ShieldCheck,
  Zap,
} from "lucide-react";
import axios from "axios";

// Utility for human-readable file sizes
const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const UploadForm = ({ onUpload, isLoading, processingQueue = [] }) => {
  const isProcessing = processingQueue.some(t => !['completed', 'failed', 'cancelled'].includes(t.status));
  const [files, setFiles] = useState([]);
  const [jobDescription, setJobDescription] = useState("");
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isJdValidating, setIsJdValidating] = useState(false);
  const [isJdValidated, setIsJdValidated] = useState(false);
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
    return files.length > 0 && jobDescription.trim().length > 50 && isJdValidated;
  }, [files, jobDescription, isJdValidated]);

  const handleJdChange = (val) => {
    setJobDescription(val);
    setIsJdValidated(false);
  };

  const handleValidateJd = async () => {
    if (jobDescription.trim().length < 50) {
      setError("Please provide a more detailed job description first.");
      return;
    }

    setIsJdValidating(true);
    setError("");
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/validate-jd`, 
        { job_description: jobDescription },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsJdValidated(true);
    } catch (err) {
      setError(err.response?.data?.error || "Validation failed. The job description might be too short or invalid.");
      setIsJdValidated(false);
    } finally {
      setIsJdValidating(false);
    }
  };

  const handleCancelTask = async (taskId) => {
    if (!window.confirm("Abort this processing task?")) return;
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/api/job/${taskId}/cancel`);
    } catch (e) {
      console.error("Failed to issue cancel command.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    try {
      await onUpload(files, jobDescription);
      // Form State Reset - enables instantaneous second processing queue batch!
      setFiles([]);
      setJobDescription("");
      setIsJdValidated(false);
      setCurrentStep(1);
    } catch (err) {
      // Parent handleUpload sets error in global app level usually, 
      // but local wrapper protects component resets
    }
  };

  const steps = [
    { id: 1, label: "Upload", icon: UploadCloud },
    { id: 2, label: "Requirements", icon: FileText },
    { id: 3, label: "Review", icon: CheckCircle2 },
  ];

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full mx-auto"
    >
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-[32px] shadow-2xl overflow-hidden">
        
        {/* Responsive Step Indicator */}
        <div className="px-6 sm:px-10 py-6 sm:py-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between max-w-3xl mx-auto relative gap-6 md:gap-4">
            
            {/* Desktop Connecting Line */}
            <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-100 dark:bg-slate-800 -translate-y-1/2 z-0 hidden md:block" />
            <motion.div 
              className="absolute top-5 left-0 h-0.5 bg-blue-500 -translate-y-1/2 z-0 hidden md:block"
              initial={{ width: "0%" }}
              animate={{ width: `${(currentStep - 1) * 50}%` }}
            />

            {steps.map((s, i) => (
              <div key={s.id} className="relative z-10 flex flex-row md:flex-col items-center gap-4 md:gap-0 w-full md:w-auto">
                <motion.div 
                  animate={{ 
                    scale: currentStep >= s.id ? 1 : 0.9,
                    backgroundColor: currentStep >= s.id ? "#3b82f6" : "#f1f5f9"
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-4 shrink-0 ${currentStep >= s.id ? "border-blue-100 dark:border-blue-900 text-white shadow-lg shadow-blue-500/20" : "border-white dark:border-slate-900 text-slate-400 dark:bg-slate-800"}`}
                >
                  {currentStep > s.id ? <CheckCircle2 className="w-5 h-5" /> : <s.icon className="w-4 h-4" />}
                </motion.div>
                
                <div className="flex flex-col md:items-center">
                  <span className={`text-[13px] font-black tracking-widest md:mt-3 ${currentStep >= s.id ? "text-slate-900 dark:text-white" : "text-slate-400"}`}>
                    {s.label}
                  </span>
                  <span className="text-[10px] text-slate-400 md:hidden">Step 0{s.id}</span>
                </div>

                {/* Mobile Connecting Line (Vertical) */}
                {i < steps.length - 1 && (
                  <div className={`absolute top-10 left-5 w-0.5 h-6 -z-10 md:hidden ${currentStep > s.id ? "bg-blue-500" : "bg-slate-100 dark:bg-slate-800"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-0">
          <div className="min-h-[400px] sm:min-h-[500px] flex flex-col">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-6 sm:p-10 flex-grow"
                >
                  <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
                    <div className="text-center space-y-2">
                      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Upload Candidate Profiles</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">PDF format supported • Max 5MB per file</p>
                    </div>

                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current.click()}
                      className={`
                        relative min-h-[250px] sm:min-h-[300px] border-2 border-dashed rounded-2xl sm:rounded-[32px] transition-all duration-500
                        flex flex-col items-center justify-center cursor-pointer group overflow-hidden px-4
                        ${isDragging ? "border-blue-500 bg-blue-50/50 dark:bg-blue-500/5" : "border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 bg-slate-50/20 dark:bg-slate-900/50 shadow-inner"}
                      `}
                    >
                      <input type="file" className="hidden" accept=".pdf" multiple onChange={(e) => validateAndAddFiles(e.target.files)} ref={fileInputRef} />
                      <div className={`p-4 sm:p-6 rounded-2xl sm:rounded-[24px] mb-4 transition-all duration-500 group-hover:scale-110 ${isDragging ? "bg-blue-500 text-white shadow-xl shadow-blue-500/20" : "bg-white dark:bg-slate-800 text-slate-400 shadow-sm"}`}>
                        <UploadCloud className="w-8 h-8 sm:w-12 sm:h-12" />
                      </div>
                      <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white text-center">Drop Resumes Here</p>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1 text-center">or click to browse local files</p>
                    </div>

                    {files.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {files.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl sm:rounded-2xl group hover:border-blue-500/30 transition-all">
                            <div className="p-2 bg-white dark:bg-slate-900 rounded-lg sm:rounded-xl text-blue-500 shadow-sm"><FileText className="w-4 h-4" /></div>
                            <span className="text-xs sm:text-sm font-bold truncate flex-1 text-slate-700 dark:text-slate-300">{file.name}</span>
                            <button 
                              type="button"
                              onClick={(e) => { e.stopPropagation(); removeFile(idx); }} 
                              className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-6 sm:p-10 flex-grow"
                >
                  <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
                    <div className="text-center space-y-2">
                      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Job Requirements</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">Paste the description to enable semantic matching.</p>
                    </div>

                    <div className="relative group">
                      <textarea
                        value={jobDescription}
                        onChange={(e) => handleJdChange(e.target.value)}
                        placeholder="Paste job description here..."
                        className={`w-full min-h-[250px] sm:min-h-[320px] p-6 sm:p-8 rounded-2xl sm:rounded-[32px] border transition-all outline-none resize-none shadow-inner leading-relaxed text-xs sm:text-sm
                          ${isJdValidated 
                            ? "bg-emerald-50/10 dark:bg-emerald-950/20 border-emerald-500/30 ring-4 ring-emerald-500/5 text-slate-900 dark:text-slate-100" 
                            : "border-slate-200 dark:border-slate-800 bg-slate-50/10 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 focus:ring-4 focus:ring-blue-500/5"}
                        `}
                      />
                      <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-8 flex items-center gap-3">
                        {isJdValidated && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 animate-in fade-in zoom-in">
                            <CheckCircle2 className="w-3 h-3" />
                            Verified
                          </div>
                        )}
                        <div className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border shadow-sm ${jobDescription.length > 100 ? "bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700" : "bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"}`}>
                          {jobDescription.length} chars
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                      {!isJdValidated ? (
                        <button
                          type="button"
                          onClick={handleValidateJd}
                          disabled={isJdValidating || jobDescription.trim().length < 50}
                          className="flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-accent-600 text-white rounded-2xl font-bold shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:hover:scale-100"
                        >
                          {isJdValidating ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>Validating Requirements...</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-5 h-5" />
                              <span>Validate Job Description</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm animate-in slide-in-from-bottom-2">
                          <CheckCircle2 className="w-5 h-5" />
                          <span>Ready to proceed!</span>
                        </div>
                      )}
                      
                      {error && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-red-500 text-xs font-bold bg-red-50 dark:bg-red-500/10 px-4 py-2 rounded-xl border border-red-100 dark:border-red-500/20"
                        >
                          {error}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-6 sm:p-10 flex-grow"
                >
                  <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
                    <div className="text-center space-y-2">
                      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Ready for Analysis</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">Review campaign details before launching the AI engine.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div className="p-5 sm:p-6 rounded-2xl sm:rounded-[24px] bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-900/30 space-y-3 sm:space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-500 text-white rounded-lg"><User className="w-4 h-4" /></div>
                          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Candidates</span>
                        </div>
                        <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">{files.length}</p>
                        <p className="text-[10px] sm:text-xs text-slate-500 font-medium">Verified documents loaded</p>
                      </div>
                      <div className="p-5 sm:p-6 rounded-2xl sm:rounded-[24px] bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-900/30 space-y-3 sm:space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-500 text-white rounded-lg"><FileText className="w-4 h-4" /></div>
                          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Requirements</span>
                        </div>
                        <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">{Math.round(jobDescription.length / 5.5)}</p>
                        <p className="text-[10px] sm:text-xs text-slate-500 font-medium">Estimated word count</p>
                      </div>
                    </div>

                    <div className="p-5 sm:p-6 rounded-2xl sm:rounded-[24px] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-blue-500 shadow-sm border border-slate-100 dark:border-slate-800 shrink-0"><Sparkles className="w-5 h-5 sm:w-6 sm:h-6" /></div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">AI Engine: GPT-4 High Precision</p>
                        <p className="text-[10px] sm:text-xs text-slate-500 font-medium">Semantic matching and scoring active.</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Responsive Footer Navigation */}
            <div className="px-6 sm:px-10 py-6 sm:py-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1 || isLoading}
                className={`w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold transition-all ${currentStep === 1 ? "hidden" : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700"}`}
              >
                Back to {currentStep === 2 ? "Upload" : "Requirements"}
              </button>

              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto ml-auto">
                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={
                      (currentStep === 1 && files.length === 0) || 
                      (currentStep === 2 && !isJdValidated) || 
                      isLoading
                    }
                    className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl text-xs font-bold shadow-lg hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:grayscale disabled:hover:scale-100 transition-all flex items-center justify-center gap-2 border border-slate-900 dark:border-white shadow-slate-900/10"
                  >
                    <span>Continue to {currentStep === 1 ? "Job Requirements" : "Review"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!isFormValid || isLoading}
                    className="w-full sm:w-auto px-10 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:hover:scale-100 flex items-center justify-center gap-3"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Starting Analysis...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-current" />
                        <span>Launch AI Analysis</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Real-time Processing Event Log Section [PHASE 6] */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-8 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/60 rounded-3xl p-6 sm:p-8 space-y-6 overflow-hidden animate-in fade-in zoom-in-95 duration-500"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                  Live Analysis Stream
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Watch AI process your professional documents in real-time.</p>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full animate-pulse">
                Active Queue
              </span>
            </div>

            <div className="space-y-6">
              {processingQueue
                .filter(t => !['completed', 'failed', 'cancelled'].includes(t.status))
                .map((task) => {
                  const prog = task.progress || 10;
                  const stepsLog = [
                    { label: "Resume Uploaded", target: 10, check: prog >= 30, active: prog === 10 },
                    { label: "Reading resume...", target: 30, check: prog >= 60, active: prog === 30 },
                    { label: "Extracting skills...", target: 60, check: prog >= 80, active: prog === 60 },
                    { label: "Matching job description", target: 80, check: task.status === 'completed' || prog >= 100, active: prog === 80 },
                    { label: "Analysis complete", target: 100, check: task.status === 'completed', active: prog === 100 }
                  ];

                  return (
                    <div key={task.id} className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 rounded-2xl p-5 space-y-4 shadow-sm theme-transition">
                      <div className="flex items-center justify-between">
                        <div className="truncate max-w-[70%]">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">File Analysis</h4>
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">{task.name}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black text-blue-500">{prog}%</span>
                          <button 
                            onClick={() => handleCancelTask(task.id)}
                            className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-red-500 hover:text-white text-slate-400 rounded-lg transition-all"
                            title="Terminate Processing"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-blue-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${prog}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>

                      {/* Timeline Event List */}
                      <div className="space-y-3 pt-2">
                        {stepsLog.map((step, sIdx) => (
                          <div key={sIdx} className="flex items-center justify-between text-xs font-medium">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-5 h-5 shrink-0">
                                {step.check ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                ) : step.active ? (
                                  <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                                ) : (
                                  <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-800" />
                                )}
                              </div>
                              <span className={step.check ? "text-slate-500 dark:text-slate-400 line-through decoration-slate-300 dark:decoration-slate-700" : step.active ? "text-blue-500 font-bold" : "text-slate-400"}>
                                {step.label}
                              </span>
                            </div>
                            {step.active && (
                              <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest animate-pulse">
                                Processing
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default UploadForm;
