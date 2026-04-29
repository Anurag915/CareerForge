import { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import UploadForm from './components/UploadForm';
import ResultCard from './components/ResultCard';
import LoadingScreen from './components/LoadingScreen';
import { Layers, AlertCircle, Sparkles, User } from 'lucide-react';

function App() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleUpload = async (file, jobDescription) => {
    setLoading(true);
    setError(null);
    setResults(null);
    
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('job_description', jobDescription);

    try {
      const response = await axios.post('http://localhost:5000/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      // Simulate slight delay for the loading screen experience
      setTimeout(() => {
        setResults(response.data);
        setLoading(false);
      }, 1500);

    } catch (err) {
      console.error('Upload error:', err);
      setError(
        err.response?.data?.error || 
        'Connection Failed: The analysis engine is unreachable.'
      );
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setError(null);
  };

  return (
    <div className="min-h-screen selection:bg-brand-200 selection:text-brand-900 flex flex-col">
      {/* Ultra-clean Navbar */}
      <nav className="sticky top-0 z-50 glass">
        <div className="max-w-5xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center space-x-2.5 cursor-pointer" onClick={handleReset}>
            <div className="bg-brand-900 p-1.5 rounded-md shadow-subtle">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-brand-900">CareerForge</span>
          </div>

          <div className="flex items-center space-x-4">
            <a href="#" className="text-sm font-medium text-brand-500 hover:text-brand-900 transition-colors hidden sm:block">Docs</a>

            <button className="flex items-center space-x-2 bg-white border border-brand-200 text-brand-900 px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-brand-50 hover:border-brand-300 transition-all shadow-subtle">
              <User className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-grow flex flex-col items-center pt-16 pb-24 px-6 relative z-10 w-full max-w-5xl mx-auto">
        
        {/* Hero Section (Hidden when results or loading) */}
        <AnimatePresence>
          {!loading && !results && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
              className="text-center mb-12 max-w-2xl"
            >
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-white border border-brand-200 rounded-full text-[11px] font-semibold text-brand-600 mb-6 shadow-subtle">
                <Sparkles className="w-3 h-3 text-brand-400" />
                <span>Powered by Llama3</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-brand-900 mb-4">
                Match your resume to <br className="hidden sm:block"/> the perfect role.
              </h1>
              <p className="text-brand-500 text-sm sm:text-base leading-relaxed">
                Upload your resume and the target job description. Our AI will analyze your compatibility and highlight exact skill gaps to improve your chances.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Error */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl mb-8 flex items-center justify-between bg-red-50/80 border border-red-200/50 p-4 rounded-xl text-red-800 backdrop-blur-sm shadow-subtle"
            >
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
              <button onClick={() => setError(null)} className="p-1 hover:bg-red-100/50 rounded-md transition-colors text-red-400 font-bold text-lg leading-none">
                &times;
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-full flex justify-center">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
                <LoadingScreen />
              </motion.div>
            ) : !results ? (
              <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
                <UploadForm onUpload={handleUpload} isLoading={loading} />
              </motion.div>
            ) : (
              <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
                <ResultCard results={results} onReset={handleReset} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </main>

      {/* Minimal Footer */}
      {!loading && (
        <footer className="py-8 text-center text-xs text-brand-400 border-t border-brand-200/50 bg-white/50 backdrop-blur-md relative z-10">
          <p>© 2026 CareerForge. Building better professional tools.</p>
        </footer>
      )}
    </div>
  );
}

export default App;
