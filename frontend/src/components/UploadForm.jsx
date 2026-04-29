import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, X, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

const UploadForm = ({ onUpload, isLoading }) => {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (selectedFile) => {
    setError('');
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      setFile(null);
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File must be smaller than 5MB.');
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) {
      setError('A resume file is required.');
      return;
    }
    if (!jobDescription.trim()) {
      setError('A job description is required.');
      return;
    }
    onUpload(file, jobDescription);
  };

  const clearFile = (e) => {
    e.stopPropagation();
    setFile(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
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
          <p className="text-sm text-brand-500 mt-1">Upload your resume and the target job description to generate a match report.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          {/* File Upload Zone */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-brand-900">
              Resume <span className="text-brand-400 font-normal">(PDF only)</span>
            </label>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                validateAndSetFile(e.dataTransfer.files[0]);
              }}
              onClick={() => !file && fileInputRef.current.click()}
              className={`relative border border-dashed rounded-xl transition-colors duration-200 ease-in-out cursor-pointer group
                ${isDragging ? 'border-brand-900 bg-brand-50' : 'border-brand-300 hover:border-brand-400 bg-white'}
                ${file ? 'border-solid border-brand-200 bg-brand-50/50 cursor-default' : 'h-32 flex flex-col items-center justify-center'}`}
            >
              <input type="file" className="hidden" accept=".pdf" onChange={handleFileChange} ref={fileInputRef} />

              <AnimatePresence mode="wait">
                {!file ? (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center text-center px-4"
                  >
                    <div className="p-2 bg-brand-100 rounded-full mb-3 text-brand-600 group-hover:bg-brand-200 group-hover:text-brand-900 transition-colors">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-medium text-brand-700">Click to upload or drag and drop</p>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="filled"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-center justify-between w-full p-4"
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div className="p-2 bg-white border border-brand-200 rounded-lg text-brand-900 shadow-subtle shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-medium text-brand-900 truncate">{file.name}</p>
                        <p className="text-xs text-brand-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={clearFile}
                      className="p-1.5 hover:bg-brand-200 rounded-md transition-colors text-brand-500 shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
              disabled={!file || !jobDescription.trim() || isLoading}
              className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center space-x-2
                ${!file || !jobDescription.trim() || isLoading
                  ? 'bg-brand-100 text-brand-400 cursor-not-allowed'
                  : 'bg-brand-900 text-white hover:bg-brand-800 hover:shadow-card active:scale-[0.99]'}`}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Analyze Compatibility</span>
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
