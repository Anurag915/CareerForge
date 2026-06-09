import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  Target,
  CheckCircle2,
  UserCheck,
  Star,
  ArrowUpRight,
  Layers,
} from "lucide-react";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500/20 selection:text-blue-500 overflow-x-hidden relative theme-transition">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1400px] h-[600px] pointer-events-none overflow-hidden z-0 opacity-70 dark:opacity-40">
        <div className="absolute -top-[10%] left-[20%] w-[500px] h-[500px] rounded-full bg-blue-400/20 dark:bg-blue-600/10 blur-[100px]" />
        <div className="absolute top-[20%] right-[10%] w-[600px] h-[600px] rounded-full bg-indigo-400/20 dark:bg-indigo-600/10 blur-[120px]" />
      </div>

      {/* Glassmorphic Top Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/50 dark:border-slate-900/50 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md">
        <div className="max-w-[1500px] 2xl:max-w-[1700px] mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3 group">
            <img src="/logo.svg" alt="CareerForge Icon" className="h-12 w-12 object-contain dark:drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] dark:brightness-125" />
            <span className="text-2xl font-extrabold tracking-tight font-outfit">
              <span className="text-slate-900 dark:text-white">Career</span><span className="text-blue-500 dark:text-blue-400">Forge</span>
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              to="/login"
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all hover:bg-slate-100/50 dark:hover:bg-slate-900/50"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="px-6 py-2.5 bg-slate-900 dark:bg-accent-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-900/10 dark:shadow-accent-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-[1500px] 2xl:max-w-[1700px] mx-auto px-6 lg:px-12 pt-16 pb-20 md:pt-24 md:pb-28 text-center relative z-10">
        <div className="space-y-6 max-w-4xl 2xl:max-w-5xl mx-auto">
          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl 2xl:text-7xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1] sm:leading-none"
          >
            Accelerate Your Career with <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
              Real-Time AI Intelligence
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 dark:text-slate-400 text-base sm:text-lg lg:text-xl 2xl:text-2xl font-medium max-w-2xl 2xl:max-w-3xl mx-auto leading-relaxed"
          >
            Upload your resume to get deterministic ATS scores, real-time visual
            parsing event logs, and section-by-section AI-powered resume
            optimizations in seconds.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Link
              to="/signup"
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 dark:bg-accent-600 text-white rounded-2xl text-base font-extrabold shadow-xl shadow-slate-900/20 dark:shadow-accent-600/30 hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-2 group"
            >
              <span>Get Started for Free</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-base font-extrabold text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800/80 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>Sign In to Dashboard</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>

        {/* Dashboard Showcase Preview Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
          className="mt-16 sm:mt-20 max-w-5xl 2xl:max-w-6xl mx-auto rounded-[32px] border border-slate-200/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/40 p-4 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.12)] backdrop-blur-xl"
        >
          <div className="rounded-[24px] border border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-950/50 overflow-hidden relative shadow-inner">
            {/* Top Window controls */}
            <div className="h-12 border-b border-slate-200/50 dark:border-slate-800/50 px-6 flex items-center justify-between bg-slate-100/50 dark:bg-slate-900/50">
              <div className="flex space-x-2">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-yellow-400" />
                <span className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                https://careerforge.ai/dashboard
              </span>
              <div className="w-12 h-2 bg-slate-200 dark:bg-slate-800 rounded-full" />
            </div>

            {/* Visual Mock Interior */}
            <div className="p-6 sm:p-10 space-y-8 text-left">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-200/50 dark:border-slate-800/50">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    Active Mode
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2">
                    ATS Analysis Dashboard
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase font-mono">
                      Job ID #65fe1ad6
                    </p>
                    <p className="text-xs font-bold text-slate-500">
                      Last Scanned: Just now
                    </p>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                    <Target className="w-6 h-6 animate-spin" />
                  </div>
                </div>
              </div>

              {/* Two-Column Mock Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  <div className="bg-white/80 dark:bg-slate-900/80 rounded-2xl p-6 border border-slate-200/30 dark:border-slate-800/30 shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Match score
                      </p>
                      <span className="text-lg font-black text-emerald-500">
                        92% Match
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full w-[92%]" />
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <span className="text-xs px-3 py-1 rounded-lg bg-blue-500/10 text-blue-500 font-bold">
                        Python
                      </span>
                      <span className="text-xs px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-500 font-bold">
                        Machine Learning
                      </span>
                      <span className="text-xs px-3 py-1 rounded-lg bg-purple-500/10 text-purple-500 font-bold">
                        RAG Pipeline
                      </span>
                    </div>
                  </div>

                  <div className="bg-white/80 dark:bg-slate-900/80 rounded-2xl p-6 border border-slate-200/30 dark:border-slate-800/30 shadow-sm space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Section Optimizations
                    </p>
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>
                          Experience metrics updated with quantifiable data and
                          business outcomes.
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>
                          Missing industry-specific keyword "RAG pipeline"
                          injected organically.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/80 rounded-2xl p-6 border border-slate-200/30 dark:border-slate-800/30 shadow-sm space-y-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Live Analysis stream
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 text-[10px] shrink-0 font-bold">
                        ✓
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Resume uploaded
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Successfully validated
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Extracting key skills...
                        </p>
                        <p className="text-[10px] text-slate-400">
                          In progress
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Core Features Grid */}
      <section className="bg-white dark:bg-slate-900/30 border-y border-slate-200/50 dark:border-slate-900/50 py-20 relative z-10 theme-transition">
        <div className="max-w-[1500px] 2xl:max-w-[1700px] mx-auto px-6 lg:px-12 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Built for High-Velocity Talent Optimization
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base max-w-lg mx-auto">
              Explore the tools designed to supercharge and perfect your career
              path.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200/50 dark:border-slate-800/50 hover:shadow-md transition-all space-y-4">
              <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500 w-12 h-12 flex items-center justify-center">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Deterministic ATS Evaluation
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                Avoid automated filtration gates. Test and benchmark your resume
                with granular algorithms built to align perfectly with applicant
                tracking systems.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200/50 dark:border-slate-800/50 hover:shadow-md transition-all space-y-4">
              <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-500 w-12 h-12 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Section-by-Section AI Rewrites
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                Receive direct, quantifiable optimizations for your skills,
                achievements, and work descriptions rather than generic advice.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200/50 dark:border-slate-800/50 hover:shadow-md transition-all space-y-4">
              <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500 w-12 h-12 flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Live Event Stream Tracking
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                Track the complete analysis flow in real-time. Witness section
                parsing, skill mapping, and description matching live as it
                progresses.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Trust Section */}
      <section className="max-w-[1500px] 2xl:max-w-[1700px] mx-auto px-6 lg:px-12 py-20 text-center relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="space-y-2">
            <p className="text-3xl sm:text-4xl font-black text-blue-600 dark:text-blue-400">
              94.2%
            </p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Matching Accuracy
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-3xl sm:text-4xl font-black text-indigo-500">
              1.4s
            </p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Median Parse Speed
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-3xl sm:text-4xl font-black text-purple-500">
              10,000+
            </p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Optimized Resumes
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-3xl sm:text-4xl font-black text-emerald-500">
              Zero
            </p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Data Retention Risk
            </p>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-900 py-10 bg-white dark:bg-slate-950 relative z-10 text-center text-xs text-slate-400 theme-transition">
        <div className="max-w-[1500px] 2xl:max-w-[1700px] mx-auto px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-slate-400" />
            <span className="font-bold uppercase tracking-wider text-slate-500">
              CareerForge &copy; {new Date().getFullYear()}
            </span>
          </div>
          <p className="font-medium">
            Designed for real-time production-grade talent acquisition.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
