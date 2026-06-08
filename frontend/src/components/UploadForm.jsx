import { useState, useRef, useCallback, useMemo } from "react";
import { UploadCloud, FileText, X, AlertCircle, Loader2, CheckCircle2, ShieldCheck, Layers, Play, Terminal } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import { toast } from "sonner";
import { useValidateJd } from "../api/mutations/useValidateJd";

// Pre-defined high-quality Job Description templates for recruiters/hiring managers
const JD_TEMPLATES = [
  {
    id: "swe",
    label: "Software Engineer",
    description: "We are seeking a Full Stack Software Engineer experienced in React, Node.js, and TypeScript. You will build highly responsive web applications, design secure REST/GraphQL APIs, and optimize database schemas using PostgreSQL and MongoDB. The ideal candidate has 3+ years of experience, understands CI/CD pipelines, Docker, and possesses strong unit testing standards."
  },
  {
    id: "designer",
    label: "Product Designer",
    description: "Looking for a Senior Product Designer to craft intuitive, user-centric interfaces. You will translate complex user workflows into beautiful wireframes, mockups, and high-fidelity interactive prototypes using Figma. Must have 4+ years of UX/UI design experience, a solid portfolio demonstrating product design systems, user research methodologies, and close collaboration with frontend developers."
  },
  {
    id: "analyst",
    label: "Data Scientist",
    description: "We are hiring a Data Scientist to build predictive machine learning models and extract insights from complex datasets. Candidates must have expertise in Python, SQL, pandas, scikit-learn, and PyTorch. You will design A/B experiments, create business dashboards, and deploy production ML models. 3+ years of experience in data modeling or quantitative analytics is required."
  },
  {
    id: "pm",
    label: "Product Manager",
    description: "Seeking a Technical Product Manager to drive product roadmap execution from discovery to launch. You will write detailed PRDs, coordinate cross-functionally across design and engineering teams, analyze user telemetry data, and define success metrics. Ideal candidates have 3+ years of product management experience inside modern SaaS ecosystems."
  }
];

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
  const [isJdValidated, setIsJdValidated] = useState(false);
  const { mutateAsync: validateJd, isPending: isJdValidating } = useValidateJd();
  const fileInputRef = useRef(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const ALLOWED_TYPE = "application/pdf";

  const handleSelectTemplate = (template) => {
    setJobDescription(template.description);
    setIsJdValidated(true);
    setError("");
    toast.success(`Loaded "${template.label}" template`);
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
          setError(`"${file.name}" exceeds 5MB.`);
          return false;
        }
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
    setError("");
    try {
      await validateJd(jobDescription);
      setIsJdValidated(true);
      toast.success("Job requirements validated successfully");
    } catch (err) {
      setError(err.response?.data?.error || "Validation failed.");
      setIsJdValidated(false);
    }
  };

  const handleCancelTask = async (taskId) => {
    try {
      await api.post(`/api/job/${taskId}/cancel`);
    } catch (e) {
      console.error("Failed to cancel.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    try {
      await onUpload(files, jobDescription);
      setFiles([]);
      setJobDescription("");
      setIsJdValidated(false);
    } catch (err) {}
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full mx-auto space-y-6">
      
      {/* Main Workspace Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 dark:bg-white rounded-lg">
              <Layers className="w-4 h-4 text-white dark:text-black" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight">AI Match Workspace</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Configure pipeline & evaluate candidates</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-[11px] font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isJdValidated ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              JD: {isJdValidated ? 'Locked' : 'Pending'}
            </div>
            <div className="px-2.5 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-[11px] font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${files.length > 0 ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
              Files: {files.length}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-white/5">
            
            {/* Left Panel: Job Description */}
            <div className="p-6 sm:p-8 flex flex-col space-y-5 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">1. Target Requirements</h3>
              </div>

              {/* Minimal Templates */}
              <div className="flex flex-wrap gap-2">
                {JD_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tmpl)}
                    className="px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors border bg-transparent border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                  >
                    {tmpl.label}
                  </button>
                ))}
              </div>

              {/* Editor */}
              <div className="relative flex-grow flex flex-col min-h-[220px]">
                <textarea
                  value={jobDescription}
                  onChange={(e) => handleJdChange(e.target.value)}
                  placeholder="Paste job description or requirements here..."
                  className="w-full flex-grow p-4 rounded-xl border outline-none resize-none font-mono text-xs leading-relaxed transition-all duration-200 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 focus:border-slate-400 dark:focus:border-white/30 text-slate-800 dark:text-slate-300"
                />
              </div>

              {/* Validation Action */}
              <button
                type="button"
                onClick={handleValidateJd}
                disabled={isJdValidating || jobDescription.trim().length < 50}
                className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  isJdValidated 
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' 
                    : 'bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-gray-100'
                }`}
              >
                {isJdValidating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (isJdValidated ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />)}
                {isJdValidating ? 'Verifying...' : (isJdValidated ? 'Requirements Validated' : 'Validate Context')}
              </button>
            </div>

            {/* Right Panel: Resumes */}
            <div className="p-6 sm:p-8 flex flex-col space-y-5 bg-slate-50/30 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">2. Candidate Documents</h3>
              </div>

              {/* Compact Dropzone */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current.click()}
                className={`
                  relative min-h-[140px] flex flex-col items-center justify-center cursor-pointer rounded-xl transition-all duration-200 border-2 border-dashed
                  ${isDragging 
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-500/5" 
                    : "border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-white/30 bg-white dark:bg-slate-900/40"}
                `}
              >
                <input type="file" className="hidden" accept=".pdf" multiple onChange={(e) => validateAndAddFiles(e.target.files)} ref={fileInputRef} />
                <UploadCloud className={`w-6 h-6 mb-2 ${isDragging ? 'text-blue-500' : 'text-slate-400'}`} />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Click or drag PDF files</p>
                <p className="text-[10px] text-slate-500 mt-1">Maximum 5MB per file</p>
              </div>

              {/* Compact File List */}
              {files.length > 0 && (
                <div className="flex-grow flex flex-col min-h-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-medium text-slate-500">{files.length} selected</span>
                    <button type="button" onClick={clearAllFiles} className="text-[10px] text-slate-400 hover:text-red-500 transition-colors">Clear all</button>
                  </div>
                  <div className="overflow-y-auto max-h-[160px] pr-1 space-y-1.5 custom-scrollbar">
                    {files.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg group hover:border-slate-300 dark:hover:border-white/20 transition-colors">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <div className="truncate">
                            <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate">{file.name}</p>
                            <p className="text-[9px] text-slate-500">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <button type="button" onClick={(e) => { e.stopPropagation(); removeFile(idx); }} className="p-1 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Action */}
          <div className="p-6 sm:p-8 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-red-500 text-xs font-medium w-full sm:w-auto">
              {error && <><AlertCircle className="w-3.5 h-3.5" /> {error}</>}
            </div>
            <button
              type="submit"
              disabled={!isFormValid || isLoading}
              className="w-full sm:w-auto px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-slate-200 dark:disabled:bg-white/5 disabled:text-slate-400 dark:disabled:text-slate-600 rounded-lg font-semibold text-xs transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              {isLoading ? 'Processing...' : `Run Analysis (${files.length})`}
            </button>
          </div>
        </form>
      </div>

      {/* Terminal-Style Processing Queue */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm"
          >
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Terminal className="w-4 h-4 text-slate-400" />
                Active Processes
              </div>
              <span className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Running
              </span>
            </div>
            <div className="p-2 space-y-1">
              {processingQueue.filter(t => !['completed', 'failed', 'cancelled'].includes(t.status)).map((task) => {
                const prog = task.progress || 10;
                let stepText = "Initializing...";
                if (prog >= 80) stepText = "Matching...";
                else if (prog >= 60) stepText = "Extracting skills...";
                else if (prog >= 30) stepText = "Reading document...";

                return (
                  <div key={task.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                    <div className="flex items-center gap-3 min-w-0">
                      <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin shrink-0" />
                      <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate w-32 sm:w-48">{task.name}</span>
                      <span className="text-[10px] text-slate-500 hidden sm:inline-block border-l border-slate-200 dark:border-slate-800 pl-3">{stepText}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-mono text-slate-400">{prog}%</span>
                      <button onClick={() => handleCancelTask(task.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
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
