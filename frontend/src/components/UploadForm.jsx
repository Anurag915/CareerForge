import { useState, useRef, useCallback, useMemo } from "react";
import { Sparkles, UploadCloud, FileText, X, AlertCircle, Loader2, ArrowRight, Trash2, CheckCircle2, User, ShieldCheck, Zap, Layers, Play } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import { toast } from "sonner";

// Pre-defined high-quality Job Description templates for recruiters/hiring managers
const JD_TEMPLATES = [
  {
    id: "swe",
    label: "⚡ Software Engineer",
    description: "We are seeking a Full Stack Software Engineer experienced in React, Node.js, and TypeScript. You will build highly responsive web applications, design secure REST/GraphQL APIs, and optimize database schemas using PostgreSQL and MongoDB. The ideal candidate has 3+ years of experience, understands CI/CD pipelines, Docker, and possesses strong unit testing standards."
  },
  {
    id: "designer",
    label: "🎨 Product Designer",
    description: "Looking for a Senior Product Designer to craft intuitive, user-centric interfaces. You will translate complex user workflows into beautiful wireframes, mockups, and high-fidelity interactive prototypes using Figma. Must have 4+ years of UX/UI design experience, a solid portfolio demonstrating product design systems, user research methodologies, and close collaboration with frontend developers."
  },
  {
    id: "analyst",
    label: "📊 Data Scientist",
    description: "We are hiring a Data Scientist to build predictive machine learning models and extract insights from complex datasets. Candidates must have expertise in Python, SQL, pandas, scikit-learn, and PyTorch. You will design A/B experiments, create business dashboards, and deploy production ML models. 3+ years of experience in data modeling or quantitative analytics is required."
  },
  {
    id: "pm",
    label: "🚀 Product Manager",
    description: "Seeking a Technical Product Manager to drive product roadmap execution from discovery to launch. You will write detailed PRDs, coordinate cross-functionally across design and engineering teams, analyze user telemetry data, and define success metrics. Ideal candidates have 3+ years of product management experience inside modern SaaS ecosystems."
  }
];

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
  const [isJdValidating, setIsJdValidating] = useState(false);
  const [isJdValidated, setIsJdValidated] = useState(false);
  const fileInputRef = useRef(null);

  // Constants for validation
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPE = "application/pdf";

  const handleSelectTemplate = (template) => {
    setJobDescription(template.description);
    setIsJdValidated(true);
    setError("");
    toast.success(`Loaded "${template.label.split(" ").slice(1).join(" ")}" requirements template!`);
  };

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
      await api.post("/validate-jd", { job_description: jobDescription });
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
      await api.post(`/api/job/${taskId}/cancel`);
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
    } catch (err) {
      // Parent handleUpload sets error in global app level usually,
      // but local wrapper protects component resets
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full mx-auto space-y-8"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden p-6 sm:p-10">
        
        {/* Workspace Title & Stats Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-6 mb-8 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-500" />
              AI Match Workspace
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Configure your candidate matching pipeline in a single professional screen.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 border border-slate-200/20">
              Resumes: <span className="text-blue-500 font-extrabold">{files.length}</span>
            </div>
            <div className="px-3.5 py-1.5 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 border border-slate-200/20">
              Target JD: <span className={isJdValidated ? "text-emerald-500 font-extrabold" : "text-amber-500 font-extrabold"}>{isJdValidated ? "Locked" : "Pending"}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-slate-100 dark:divide-slate-800/60">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-800/60">
            
            {/* Left Panel: Job Description (Col span 5) */}
            <div className="lg:col-span-5 flex flex-col space-y-4 lg:pr-8">
              <div className="space-y-1">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">1. Job Context</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Select a template below or paste requirements to align the AI.</p>
              </div>

              {/* Quick AI Templates capsules */}
              <div className="flex flex-wrap gap-2 py-1">
                {JD_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tmpl)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 active:bg-slate-100 cursor-pointer dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-850 dark:hover:text-slate-200 dark:hover:border-slate-700"
                  >
                    {tmpl.label}
                  </button>
                ))}
              </div>

              <div className="relative flex-grow flex flex-col min-h-[250px]">
                <textarea
                  value={jobDescription}
                  onChange={(e) => handleJdChange(e.target.value)}
                  placeholder="Paste target job requirements here (min 50 characters)..."
                  className="w-full flex-grow p-4 sm:p-5 rounded-2xl border outline-none resize-none shadow-inner font-mono text-xs leading-relaxed transition-all duration-300 bg-slate-50/50 dark:bg-slate-950/40 border-slate-300 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-600 text-slate-800 dark:text-slate-200"
                />
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <div className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 border border-slate-200/10 backdrop-blur-sm">
                    {jobDescription.length} chars
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-stretch gap-2.5">
                {!isJdValidated ? (
                  <button
                    type="button"
                    onClick={handleValidateJd}
                    disabled={isJdValidating || jobDescription.trim().length < 50}
                    className="flex items-center justify-center gap-2.5 px-6 py-3.5 bg-slate-900 dark:bg-slate-850 hover:bg-slate-800 dark:hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg transition-all disabled:opacity-50 disabled:grayscale cursor-pointer active:scale-98"
                  >
                    {isJdValidating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        <span>Verifying Requirements...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-blue-500" />
                        <span>Validate Requirements</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-2 p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold shadow-inner">
                    <CheckCircle2 className="w-4 h-4 text-slate-400" />
                    <span>Target Locked & Validated</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel: Resumes Drag & Drop (Col span 7) */}
            <div className="lg:col-span-7 flex flex-col space-y-4 lg:pl-8 pt-8 lg:pt-0">
              <div className="space-y-1">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">2. Candidate Resumes</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Load PDF documents of the applicants to match.</p>
              </div>

              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current.click()}
                className={`
                  relative flex-grow min-h-[220px] border-2 border-dashed rounded-2xl sm:rounded-3xl transition-all duration-300
                  flex flex-col items-center justify-center cursor-pointer group px-6 py-8 overflow-hidden select-none
                  ${isDragging 
                    ? "border-blue-500 bg-blue-500/[0.04] dark:bg-blue-500/[0.02] scale-[0.99]" 
                    : "border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 bg-slate-50/20 dark:bg-slate-900/40 shadow-inner"}
                `}
              >
                <input type="file" className="hidden" accept=".pdf" multiple onChange={(e) => validateAndAddFiles(e.target.files)} ref={fileInputRef} />
                <div className={`p-4 rounded-2xl mb-3.5 transition-all duration-500 group-hover:scale-110 ${isDragging ? "bg-blue-500 text-white shadow-xl shadow-blue-500/25" : "bg-white dark:bg-slate-850 text-slate-400 shadow-sm border border-slate-100 dark:border-slate-800"}`}>
                  <UploadCloud className="w-8 h-8 text-blue-500" />
                </div>
                <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white text-center">Drop Resumes Here</p>
                <p className="text-xs text-slate-500 mt-1 text-center font-semibold">or click to browse local files (PDF up to 5MB)</p>
              </div>

              {/* Added Files Section */}
              {files.length > 0 && (
                <div className="max-h-[160px] overflow-y-auto pr-1 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {files.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 p-2.5 bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-xl group hover:border-blue-500/20 transition-all">
                        <div className="p-1.5 bg-white dark:bg-slate-900 rounded-lg text-blue-500 shadow-sm border border-slate-100 dark:border-slate-800/50"><FileText className="w-3.5 h-3.5" /></div>
                        <div className="truncate flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{file.name}</p>
                          <p className="text-[9px] text-slate-400 font-medium">{formatFileSize(file.size)}</p>
                        </div>
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeFile(idx); }} 
                          className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all shrink-0 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Orchestration Banner */}
          <div className="border-t border-slate-150 dark:border-slate-800/60 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1">
              {error ? (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-xs font-extrabold bg-red-500/5 border border-red-500/15 rounded-xl px-4 py-2.5 flex items-center gap-2 max-w-lg animate-pulse"
                >
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span>{error}</span>
                </motion.div>
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium leading-normal max-w-md">
                  Once your requirements are validated and candidate documents are enqueued, launch the campaign to evaluate profiles.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!isFormValid || isLoading}
              className="w-full md:w-auto px-10 py-4 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 border border-slate-900 dark:border-slate-100 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-550 disabled:border-transparent rounded-xl font-semibold text-xs tracking-wide transition-all shadow-sm flex items-center justify-center gap-3 active:scale-95 cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Initializing Analysis...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current text-white" />
                  <span>Launch AI Match Campaign ({files.length})</span>
                </>
              )}
            </button>
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
              <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full animate-pulse">Active Queue</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <div key={task.id} className="bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-sm theme-transition">
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
                              <span className={step.check ? "text-slate-400 dark:text-slate-500 font-medium" : step.active ? "text-blue-500 font-bold" : "text-slate-400"}>
                                {step.label}
                              </span>
                            </div>
                            {step.active && (
                              <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest animate-pulse">Processing</span>
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
