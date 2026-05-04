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
import { useTheme } from './context/ThemeContext';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import { Layers, AlertCircle, Sparkles, User, MessageSquare, History, Columns, Search, LogOut, TrendingUp, FolderOpen, Sun, Moon } from 'lucide-react';

const ProtectedRoute = ({ children, requireRole }) => {
  const { user, token, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return <LoadingScreen />;
  if (!token) {
    return <LoginPage />;
  }

  if (requireRole && user?.role !== requireRole) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 theme-transition">
        <div className="bg-red-500/10 p-4 rounded-full text-red-500 mb-2">
          <AlertCircle className="w-12 h-12" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Access Denied</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm text-center">The Comparison Dashboard is restricted to Hiring Manager accounts only.</p>
        <button onClick={() => window.location.href='/'} className="px-6 py-2 bg-slate-900 dark:bg-accent-600 text-white rounded-lg font-semibold shadow-subtle hover:bg-slate-800 dark:hover:bg-accent-700 transition-all">
          Go Back Home
        </button>
      </div>
    );
  }

  return children;
};

function App() {
  const [activeTab, setActiveTab] = useState('analyze');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
              className="text-center mb-10 max-w-2xl mx-auto"
            >
              {/* <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest mb-6 shadow-sm">
                <Sparkles className="w-3 h-3 text-blue-500" />
                Enterprise Grade Analysis
              </div> */}
              
              <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-6 leading-[1.1]">
                AI-Powered <br className="hidden sm:block"/> Candidate Intelligence
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-base sm:text-md leading-relaxed max-w-xl mx-auto font-medium">
                Experience a high-precision analysis engine designed to match talent with opportunity using deep learning. Precise, persistent, and private.
              </p>
            </motion.div>
            <UploadForm onUpload={handleUpload} isLoading={loading} />
          </>
        );
    }
  };

  return (
    <div className="h-screen selection:bg-accent-500/30 selection:text-slate-900 dark:selection:text-slate-100 flex flex-col bg-slate-50/50 dark:bg-slate-950 w-full overflow-hidden theme-transition">
      {/* Ultra-clean Navbar */}
      <nav className="sticky top-0 z-50 glass dark:glass-dark border-b border-slate-200/50 dark:border-slate-800/50 w-full">
        <div className="w-full px-6 lg:px-12 h-16 flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => handleTabClick('analyze')}>
              <div className="bg-slate-900 dark:bg-accent-600 p-1.5 rounded-md shadow-subtle">
                <Layers className="w-4 h-4 text-slate-50" />
              </div>
              <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">CareerForge</span>
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
                      ? 'bg-slate-900 dark:bg-accent-600 text-white shadow-md' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/50'
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
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-all border border-slate-200 dark:border-slate-700"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {user ? (
              <div className="flex items-center space-x-3 pl-4 border-l border-slate-200 dark:border-slate-800">
                <div className="flex flex-col items-end mr-1">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">
                    {user.role === 'hiring_manager' ? 'Hiring Manager' : 'Candidate'}
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{user.name || 'Account'}</span>
                </div>
                <button 
                  onClick={logout}
                  className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-1 pl-4 border-l border-slate-200 dark:border-slate-800">
                <button 
                  onClick={() => navigate('/login')} 
                  className={`px-4 py-2 text-xs font-bold transition-all rounded-xl ${
                    location.pathname === '/login' 
                    ? 'bg-slate-900 dark:bg-accent-600 text-white shadow-subtle' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  Sign In
                </button>
                <button 
                  onClick={() => navigate('/signup')} 
                  className={`px-4 py-2 text-xs font-bold transition-all rounded-xl ${
                    location.pathname === '/signup' 
                    ? 'bg-slate-900 dark:bg-accent-600 text-white shadow-subtle' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className={`flex-grow flex flex-col relative z-10 w-full min-h-0 ${activeTab === 'chat' ? 'overflow-hidden pb-0 px-0 pt-0' : 'overflow-y-auto pb-8 px-6 lg:px-12 pt-4'}`}>
        
        {/* Global Error */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl mx-auto mb-8 flex items-center justify-between bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-500 backdrop-blur-sm shadow-subtle"
            >
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
              <button onClick={() => setError(null)} className="p-1 hover:bg-red-500/10 rounded-md transition-colors text-red-500 font-bold text-lg leading-none">
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

        {/* Minimal Footer - Moved inside scrollable area
        {!loading && activeTab !== 'chat' && (
          <footer className="py-6 mt-auto text-center text-xs text-slate-500 dark:text-slate-500 border-t border-slate-200/50 dark:border-slate-800/50">
            <p>© 2026 CareerForge. Building better professional tools.</p>
          </footer>
        )} */}
      </main>
    </div>
  );
}

export default App;
