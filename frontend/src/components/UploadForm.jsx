import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, X, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

const UploadForm = ({ onUpload, isLoading }) => {
  const [files, setFiles] = useState([]);
  const [jobDescription, setJobDescription] = useState('');
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    validateAndAddFiles(selectedFiles);
  };

  const validateAndAddFiles = (newFiles) => {
    setError('');
    const validFiles = [];
    
    for (const f of newFiles) {
        if (f.type !== 'application/pdf') {
            setError('Only PDF files are allowed.');
            continue;
        }
        if (f.size > 5 * 1024 * 1024) {
            setError('Each file must be smaller than 5MB.');
            continue;
        }
        validFiles.push(f);
    }

    setFiles(prev => [...prev, ...validFiles]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (files.length === 0) {
      setError('At least one resume file is required.');
      return;
    }
    if (!jobDescription.trim()) {
      setError('A job description is required.');
      return;
    }
    onUpload(files, jobDescription);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="bg-white rounded-2xl shadow-card border border-subtle overflow-hidden">
        <div className="p-8 pb-6 border-b border-subtle bg-brand-50/50">
          <h2 className="text-xl font-semibold text-brand-900 tracking-tight">New Analysis</h2>
          <p className="text-sm text-brand-500 mt-1">Upload one or more resumes and the target job description.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          {/* File Upload Zone */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-brand-900">
              Resumes <span className="text-brand-400 font-normal">(PDF only, multiple allowed)</span>
            </label>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                validateAndAddFiles(Array.from(e.dataTransfer.files));
              }}
              onClick={() => fileInputRef.current.click()}
              className={`relative border border-dashed rounded-xl transition-colors duration-200 ease-in-out cursor-pointer group p-6
                ${isDragging ? 'border-brand-900 bg-brand-50' : 'border-brand-300 hover:border-brand-400 bg-white'}`}
            >
              <input type="file" className="hidden" accept=".pdf" multiple onChange={handleFileChange} ref={fileInputRef} />

              <div className="flex flex-col items-center text-center">
                <div className="p-2 bg-brand-100 rounded-full mb-3 text-brand-600 group-hover:bg-brand-200 group-hover:text-brand-900 transition-colors">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-brand-700">Click to upload or drag and drop</p>
                <p className="text-[10px] text-brand-400 mt-1 uppercase font-bold tracking-wider">Select Multiple Candidates</p>
              </div>
            </div>

            {/* File List */}
            <AnimatePresence>
              {files.length > 0 && (
                <div className="grid grid-cols-1 gap-2 mt-4">
                  {files.map((f, idx) => (
                    <motion.div 
                      key={`${f.name}-${idx}`}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                      className="flex items-center justify-between w-full p-3 bg-brand-50/50 border border-brand-100 rounded-xl"
                    >
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="p-1.5 bg-white border border-brand-200 rounded-lg text-brand-900 shadow-sm shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-brand-900 truncate">{f.name}</p>
                          <p className="text-[10px] text-brand-400">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                        className="p-1 hover:bg-brand-200 rounded-md transition-colors text-brand-400 hover:text-brand-600 shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Job Description Textarea */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-brand-900">
              Job Description
            </label>
            <div className="relative">
              <textarea
                className="w-full h-48 p-4 rounded-xl border border-brand-200 bg-white text-sm text-brand-900 placeholder:text-brand-400 resize-none focus:ring-4 focus:ring-brand-100 transition-all duration-200"
                placeholder="Paste the full job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center space-x-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg border border-red-100 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-medium">{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={files.length === 0 || !jobDescription.trim() || isLoading}
              className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center space-x-2
                ${files.length === 0 || !jobDescription.trim() || isLoading
                  ? 'bg-brand-100 text-brand-400 cursor-not-allowed'
                  : 'bg-brand-900 text-white hover:bg-brand-800 hover:shadow-card active:scale-[0.99]'}`}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Analyze Resume Intelligence</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default UploadForm;
