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
import ABTestingView from './components/ABTestingView';
import MyResumesView from './components/MyResumesView';
import { useAuth } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import { Layers, AlertCircle, Sparkles, User, MessageSquare, History, Columns, Search, LogOut, TrendingUp, FolderOpen } from 'lucide-react';
const ProtectedRoute = ({ children, requireRole }) => {
  const { user, token, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return <LoadingScreen />;
  if (!token) {
    return <LoginPage />;
  }

  if (requireRole && user?.role !== requireRole) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="bg-red-100 p-4 rounded-full text-red-600 mb-2">
          <AlertCircle className="w-12 h-12" />
        </div>
        <h2 className="text-xl font-bold text-brand-900">Access Denied</h2>
        <p className="text-brand-500 max-w-sm text-center">The Comparison Dashboard is restricted to Hiring Manager accounts only.</p>
        <button onClick={() => window.location.href='/'} className="px-6 py-2 bg-brand-900 text-white rounded-lg font-semibold shadow-subtle hover:bg-brand-800 transition-all">
          Go Back Home
        </button>
      </div>
    );
  }

  return children;
};

function App() {
  const [activeTab, setActiveTab] = useState('analyze'); // analyze, chat, compare, history
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  
  const { user, logout } = useAuth();
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
      case 'abtest': return (
        <ProtectedRoute requireRole="candidate">
          <ABTestingView />
        </ProtectedRoute>
      );
      case 'compare': return (
        <ProtectedRoute requireRole="hiring_manager">
          <ComparisonDashboard />
        </ProtectedRoute>
      );
      case 'history': return <HistoryView />;
      case 'resumes': return <MyResumesView />;
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

            {/* Navigation Tabs (Only if logged in) */}
            {user && (
              <div className="hidden md:flex items-center space-x-1">
                {[
                  { id: 'analyze', label: 'Dashboard', icon: Search },
                  { id: 'chat', label: 'AI Chat', icon: MessageSquare },
                  ...(user.role === 'candidate' ? [
                    { id: 'abtest', label: 'Find Best Resume', icon: TrendingUp }
                  ] : []),
                  ...(user.role === 'hiring_manager' ? [
                    { id: 'compare', label: 'Compare Candidates', icon: Columns }
                  ] : []),
                  { id: 'resumes', label: 'My Resumes', icon: FolderOpen },
                  { id: 'history', label: 'My History', icon: History },
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
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex flex-col items-end mr-1">
                  <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest leading-none mb-1">
                    {user.role === 'hiring_manager' ? 'Hiring Manager' : 'Candidate'}
                  </span>
                  <span className="text-xs font-bold text-brand-900">{user.name || 'Account'}</span>
                </div>
                <button 
                  onClick={logout}
                  className="p-2 text-brand-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button onClick={() => navigate('/login')} className="px-4 py-2 text-xs font-bold text-brand-500 hover:text-brand-900 transition-colors">Sign In</button>
                <button onClick={() => navigate('/signup')} className="px-4 py-2 bg-brand-900 text-white rounded-xl text-xs font-bold shadow-subtle hover:bg-brand-800 transition-all">Sign Up</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-grow flex flex-col pt-4 pb-24 px-6 lg:px-12 relative z-10 w-full">
        
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
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/" element={
              <ProtectedRoute>
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
              </ProtectedRoute>
            } />
            <Route path="/analysis" element={<ProtectedRoute><AnalysisPage /></ProtectedRoute>} />
            <Route path="/analysis/:id" element={<ProtectedRoute><AnalysisPage /></ProtectedRoute>} />
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
