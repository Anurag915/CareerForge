import { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import UploadForm from './components/UploadForm';
import ResultCard from './components/ResultCard';
import LoadingScreen from './components/LoadingScreen';
import HistoryView from './components/HistoryView';
import ChatUI from './components/ChatUI';
import ComparisonDashboard from './components/ComparisonDashboard';
import AnalysisPage from './components/AnalysisPage';
import { Layers, AlertCircle, Sparkles, User, MessageSquare, History, Columns, Search } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('analyze'); // analyze, chat, compare, history
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  const handleUpload = async (files, jobDescription) => {
    setLoading(true);
    setError(null);
    setResults(null);
    
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('resume', file);
        formData.append('job_description', jobDescription);
        
        return axios.post('http://localhost:5000/analyze-advanced', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      });

      await Promise.all(uploadPromises);
      
      setTimeout(() => {
        setLoading(false);
        handleTabClick('history');
      }, 1500);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || 'Batch Analysis Failed: One or more files could not be processed.');
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setError(null);
  };

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    if (location.pathname !== '/') {
        navigate('/');
    }
    handleReset();
  };

  const renderDashboard = () => {
    if (loading) return <LoadingScreen />;
    
    switch(activeTab) {
      case 'chat': return <ChatUI />;
      case 'compare': return <ComparisonDashboard />;
      case 'history': return <HistoryView />;
      default:
        return results ? (
          <ResultCard results={results} onReset={handleReset} />
        ) : (
          <>
            <motion.div 
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12 max-w-2xl mx-auto"
            >
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-white border border-brand-200 rounded-full text-[11px] font-semibold text-brand-600 mb-6 shadow-subtle">
                <Sparkles className="w-3 h-3 text-brand-400" />
                <span>Level 3 Persistent RAG System</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-brand-900 mb-4">
                Your Intelligent <br className="hidden sm:block"/> Career Dashboard.
              </h1>
              <p className="text-brand-500 text-sm sm:text-base leading-relaxed">
                Upload, analyze, chat, and compare. Your professional documents are now persistent and searchable via local AI.
              </p>
            </motion.div>
            <UploadForm onUpload={handleUpload} isLoading={loading} />
          </>
        );
    }
  };

  return (
    <div className="min-h-screen selection:bg-brand-200 selection:text-brand-900 flex flex-col bg-slate-50/30 w-full">
      {/* Ultra-clean Navbar */}
      <nav className="sticky top-0 z-50 glass border-b border-brand-100 w-full">
        <div className="w-full px-6 lg:px-12 h-16 flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => handleTabClick('analyze')}>
              <div className="bg-brand-900 p-1.5 rounded-md shadow-subtle">
                <Layers className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold tracking-tight text-brand-900">CareerForge</span>
            </div>

            {/* Navigation Tabs */}
            <div className="hidden md:flex items-center space-x-1">
              {[
                { id: 'analyze', label: 'Analyze', icon: Search },
                { id: 'chat', label: 'AI Chat', icon: MessageSquare },
                { id: 'compare', label: 'Compare', icon: Columns },
                { id: 'history', label: 'History', icon: History },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === tab.id && location.pathname === '/'
                    ? 'bg-brand-900 text-white shadow-md' 
                    : 'text-brand-400 hover:text-brand-900 hover:bg-brand-50'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-2 bg-white border border-brand-200 text-brand-900 px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-brand-50 hover:border-brand-300 transition-all shadow-subtle">
              <User className="w-3.5 h-3.5" />
              <span>Session: Guest</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-grow flex flex-col pt-12 pb-24 px-6 lg:px-12 relative z-10 w-full">
        
        {/* Global Error */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl mx-auto mb-8 flex items-center justify-between bg-red-50/80 border border-red-200/50 p-4 rounded-xl text-red-800 backdrop-blur-sm shadow-subtle"
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

        <div className="w-full">
          <Routes>
            <Route path="/" element={
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab + (loading ? '-loading' : '')}
                  initial={{ opacity: 0, x: 5 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderDashboard()}
                </motion.div>
              </AnimatePresence>
            } />
            <Route path="/analysis" element={<AnalysisPage />} />
            <Route path="/analysis/:id" element={<AnalysisPage />} />
          </Routes>
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
