import { useState, useEffect, useRef } from "react";
import api from "./services/api";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { useJobTracker } from "./api/queries/useJobTracker";
import { useUploadResumes } from "./api/mutations/useUploadResumes";
import { Toaster, toast } from "sonner";
import {
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import UploadForm from "./components/UploadForm";
import AnalysisDashboard from "./components/AnalysisDashboard";
import LoadingScreen from "./components/LoadingScreen";
import HistoryView from "./components/HistoryView";
import ChatUI from "./components/ChatUI";
import ComparisonDashboard from "./components/ComparisonDashboard";
import AnalysisPage from "./components/AnalysisPage";
import ABTestingView from "./components/ABTestingView";
import MyResumesView from "./components/MyResumesView";
import JobsView from "./components/JobsView";
import LandingPage from "./components/LandingPage";
import { useAuth } from "./context/AuthContext";
import { useTheme } from "./context/ThemeContext";
import LoginPage from "./components/LoginPage";
import SignupPage from "./components/SignupPage";
import VerifyEmail from "./components/VerifyEmail";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import {
  Layers,
  AlertCircle,
  Sparkles,
  User,
  MessageSquare,
  History,
  Columns,
  Search,
  LogOut,
  TrendingUp,
  FolderOpen,
  Sun,
  Moon,
  Bell,
  Command,
  Settings,
  CreditCard,
  ChevronDown,
  Menu,
  X,
  Briefcase,
  Target,
  Zap,
  Clock,
  CheckCircle2,
} from "lucide-react";
import Navbar from "./components/Navbar";

const parseDateTime = (str) => {
  if (!str) return new Date();
  if (!str.includes("Z") && !str.includes("+")) {
    return new Date(str.replace(" ", "T") + "Z");
  }
  return new Date(str);
};

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
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Access Denied
        </h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm text-center">
          The Comparison Dashboard is restricted to Hiring Manager accounts
          only.
        </p>
        <button
          onClick={() => (window.location.href = "/")}
          className="px-6 py-2 bg-slate-900 dark:bg-accent-600 text-white rounded-lg font-semibold shadow-subtle hover:bg-slate-800 dark:hover:bg-accent-700 transition-all"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  return children;
};

function App() {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("activeTab") || "analyze";
  });

  useEffect(() => {
    localStorage.setItem("activeTab", activeTab);
  }, [activeTab]);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const addToast = (message, type = "info") => {
    if (type === "success") {
      toast.success(message);
    } else if (type === "error") {
      toast.error(message);
    } else {
      toast.info(message);
    }
  };

  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const { user, token, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Use the new React Query-based job tracker hook
  const { queue: processingQueue, addJobToQueue } = useJobTracker();
  const { mutateAsync: uploadResume } = useUploadResumes();

  const handleUpload = async (files, jobDescription) => {
    setIsUploading(true);
    setError(null);

    // Instantly transition to the queue tab
    setActiveTab("jobs");
    addToast(`Initializing analysis campaign for ${files.length} candidate(s)...`, "info");

    try {
      const uploadPromises = files.map(async (file) => {
        try {
          const res = await uploadResume({ file, jobDescription });
          const jobId = res.data.jobId;
          
          addJobToQueue(jobId, file.name);
          addToast(`"${file.name}" enqueued successfully!`, "success");
          return res.data;
        } catch (err) {
          addToast(`Failed to enqueue "${file.name}".`, "error");
          throw err;
        }
      });

      await Promise.allSettled(uploadPromises);
    } catch (err) {
      console.error("Upload error:", err);
      const errorMsg =
        err.response?.data?.error ||
        "Batch Analysis Failed: One or more files could not be processed.";
      addToast(errorMsg, "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleViewJobResult = async (jobId) => {
    try {
      const res = await api.get(`/api/job/${jobId}`);
      if (res.data.status === "completed" && res.data.result) {
        setResults(res.data.result);
        setActiveTab("analyze"); // Navigate to dashboard
      }
    } catch (err) {
      console.error("Failed to load job result:", err);
      addToast("Could not retrieve job results. Please try again.", "error");
    }
  };

  const handleReset = () => {
    setResults(null);
    setError(null);
  };

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    if (location.pathname !== "/") {
      navigate("/");
    }
    handleReset();
  };

  const renderDashboard = () => {
    switch (activeTab) {
      case "chat":
        return <ChatUI />;
      case "abtest":
        return (
          <ProtectedRoute requireRole="candidate">
            <ABTestingView />
          </ProtectedRoute>
        );
      case "compare":
        return (
          <ProtectedRoute requireRole="hiring_manager">
            <ComparisonDashboard />
          </ProtectedRoute>
        );
      case "history":
        return <HistoryView />;
      case "jobs":
        return <JobsView onViewResult={handleViewJobResult} />;
      case "resumes":
        return <MyResumesView />;
      default:
        return results ? (
          <AnalysisDashboard results={results} onBack={handleReset} />
        ) : (
          <div className="max-w-[1800px] mx-auto w-full px-6 lg:px-12 py-6 sm:py-12">
            {/* SaaS Dashboard Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 rounded-full bg-accent-500 animate-pulse" />
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                  Welcome back, <br className="sm:hidden" />{" "}
                  {user?.name?.split(" ")[0] || "Member"}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base font-medium max-w-lg">
                  Analyze and optimize your talent acquisition pipeline with AI.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <button className="w-full sm:w-auto px-6 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                  Export Reports
                </button>
                <button className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 dark:bg-accent-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-accent-500/20 hover:scale-[1.02] active:scale-95 transition-all">
                  New Campaign
                </button>
              </div>
            </div>

            {/* SaaS Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
              {[
                {
                  label: "Candidates Scanned",
                  value: "1,284",
                  change: "+12%",
                  icon: User,
                  color: "blue",
                },
                {
                  label: "Smart Matches",
                  value: "439",
                  change: "+5.4%",
                  icon: Target,
                  color: "emerald",
                },
                {
                  label: "Average Accuracy",
                  value: "94.2%",
                  change: "+1.2%",
                  icon: Zap,
                  color: "amber",
                },
                {
                  label: "Processing Time",
                  value: "1.4s",
                  change: "-0.2s",
                  icon: Clock,
                  color: "purple",
                },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 p-5 sm:p-6 rounded-2xl sm:rounded-[24px] shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div
                      className={`p-2.5 rounded-xl bg-blue-500/10 text-blue-500 dark:bg-accent-500/10 dark:text-accent-500 group-hover:scale-110 transition-transform`}
                    >
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400`}
                    >
                      {stat.change}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                      {stat.label}
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                      {stat.value}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Main Action Area */}
            <div className="w-full">
              <UploadForm
                onUpload={handleUpload}
                isLoading={isUploading}
                processingQueue={processingQueue}
              />
            </div>
          </div>
        );
    }
  };

  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    );
  }

  return (
    <div
      className={`${theme} flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 w-full overflow-x-hidden theme-transition font-sans ${activeTab === "chat" ? "h-screen overflow-hidden" : "min-h-screen"}`}
    >
      {/* Premium Modular Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabClick={handleTabClick}
        user={user}
        logout={logout}
        processingQueue={processingQueue}
      />

      {/* Main Container */}
      <main
        className={`flex-grow flex flex-col relative z-10 w-full min-h-0 ${activeTab === "chat" ? "h-[calc(100vh-80px)] overflow-hidden pt-16 pb-0 px-0" : "min-h-0 overflow-y-auto pt-20 pb-8 px-6 lg:px-12"}`}
      >
        {/* Global Error Notification */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -100 }}
              className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] w-full max-w-md px-4"
            >
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-500/20 flex items-center gap-4 shadow-[0_20px_50px_-12px_rgba(239,68,68,0.2)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] backdrop-blur-xl">
                <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <div className="flex-grow">
                  <h3 className="text-sm font-black text-red-600 dark:text-red-400 uppercase tracking-wider mb-0.5">
                    Analysis Error
                  </h3>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-tight">
                    {error}
                  </p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all group active:scale-90"
                  aria-label="Close error"
                >
                  <X className="w-5 h-5 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Page Content */}
        <Routes>
          {/* Anti-Recursion Guards: Bounce authed users out of auth pages */}
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/signup" element={<Navigate to="/" replace />} />
          <Route path="/verify-email" element={<Navigate to="/" replace />} />
          <Route
            path="/forgot-password"
            element={<Navigate to="/" replace />}
          />
          <Route path="/reset-password" element={<Navigate to="/" replace />} />
          <Route path="/analysis/:id" element={<AnalysisPage />} />
          <Route path="/" element={renderDashboard()} />
          {/* Catch-all safety net */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Toaster richColors closeButton theme={theme} position="bottom-right" />
    </div>
  );
}

export default App;
