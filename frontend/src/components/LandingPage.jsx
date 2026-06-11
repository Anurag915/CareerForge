import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Target,
  CheckCircle2,
  ArrowUpRight,
  Upload,
  MessageSquare,
  FileText,
  SplitSquareHorizontal,
  XCircle,
  BarChart,
  BrainCircuit,
  Settings,
  ChevronRight,
  Zap,
  ShieldCheck,
  Activity,
  Users
} from "lucide-react";

// --- Subcomponents for Product Mockups ---

const ATSMock = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 space-y-6 text-left">
    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-200/50 dark:border-slate-800/50">
      <div>
        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">ATS Analysis Dashboard</h3>
        <p className="text-sm text-slate-500 mt-1">Software Engineer - Google</p>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full mb-1">
          Scanned
        </span>
        <span className="text-3xl font-black text-emerald-500">92%</span>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Keyword Matches</p>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">Python</span>
          <span className="text-xs px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">Machine Learning</span>
          <span className="text-xs px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">RAG</span>
          <span className="text-xs px-3 py-1 rounded-lg bg-rose-500/10 text-rose-500 font-bold border border-rose-500/20">Docker (Missing)</span>
        </div>
      </div>
      <div className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">AI Recommendations</p>
        <div className="space-y-2">
          <div className="flex gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
            <span>Quantify your impact in the "Backend Developer" role. Try: "Reduced latency by 40%".</span>
          </div>
          <div className="flex gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
            <span>Move your Skills section to the top to improve immediate parsing.</span>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

const CopilotMock = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 h-[300px] flex flex-col text-left">
    <div className="flex-1 space-y-4 overflow-hidden">
      <div className="flex gap-3 max-w-[80%]">
        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
          <BrainCircuit className="w-4 h-4 text-blue-500" />
        </div>
        <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none text-sm text-slate-700 dark:text-slate-300">
          I noticed your experience section is missing quantifiable metrics. Would you like me to help rewrite your bullet points for the Senior Dev role?
        </div>
      </div>
      <div className="flex gap-3 max-w-[80%] ml-auto justify-end">
        <div className="bg-blue-600 text-white p-3 rounded-2xl rounded-tr-none text-sm">
          Yes, rewrite my bullet point about the REST API migration.
        </div>
      </div>
      <div className="flex gap-3 max-w-[80%]">
        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
          <BrainCircuit className="w-4 h-4 text-blue-500" />
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl rounded-tl-none text-sm text-emerald-700 dark:text-emerald-400">
          <strong>Suggested Rewrite:</strong><br />
          "Architected and executed the migration of legacy monolithic APIs to a distributed REST architecture, reducing average response time by 35% and supporting 10k+ concurrent users."
        </div>
      </div>
    </div>
    <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-800/50 flex gap-2">
      <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2 text-slate-400 text-sm">Type a message to copilot...</div>
      <div className="bg-blue-600 rounded-xl p-2 text-white"><ArrowRight className="w-5 h-5" /></div>
    </div>
  </motion.div>
);

const ComparisonMock = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 text-left space-y-6">
    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white border-b border-slate-200/50 dark:border-slate-800/50 pb-4">Resume Comparison</h3>
    <div className="grid grid-cols-2 gap-4">
      {/* Candidate A */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/50 dark:border-slate-700/50">
        <div className="flex justify-between mb-4">
          <span className="font-bold text-slate-900 dark:text-white">v1_SoftwareEng.pdf</span>
          <span className="text-lg font-black text-yellow-500">74%</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-500"><span>Formatting</span><span className="text-green-500">Good</span></div>
          <div className="flex justify-between text-xs text-slate-500"><span>Keywords</span><span className="text-red-500">Poor</span></div>
          <div className="flex justify-between text-xs text-slate-500"><span>Impact</span><span className="text-yellow-500">Fair</span></div>
        </div>
      </div>
      {/* Candidate B */}
      <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl p-4 border border-blue-200 dark:border-blue-800/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">WINNER</div>
        <div className="flex justify-between mb-4">
          <span className="font-bold text-blue-900 dark:text-blue-100">v2_TechLead_Final.pdf</span>
          <span className="text-lg font-black text-emerald-500">96%</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-500"><span>Formatting</span><span className="text-green-500">Excellent</span></div>
          <div className="flex justify-between text-xs text-slate-500"><span>Keywords</span><span className="text-green-500">Excellent</span></div>
          <div className="flex justify-between text-xs text-slate-500"><span>Impact</span><span className="text-green-500">Excellent</span></div>
        </div>
      </div>
    </div>
  </motion.div>
);


const LandingPage = () => {
  const [activeMock, setActiveMock] = useState('ats');

  // Simple scroll function for anchor links
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500/20 selection:text-blue-500 overflow-x-hidden relative theme-transition">
      
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/50 dark:border-slate-900/50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-[1500px] 2xl:max-w-[1700px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
            <img src="/logo.svg" alt="CareerForge Icon" className="h-12 w-12 object-contain dark:drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] dark:brightness-125" />
            <span className="text-2xl font-extrabold tracking-tight font-outfit">
              <span className="text-slate-900 dark:text-white">Career</span>
              <span className="text-blue-500 dark:text-blue-400">Forge</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <button disabled className="opacity-50 cursor-not-allowed transition-colors" title="Coming soon">Features</button>
            <button onClick={() => scrollTo('how-it-works')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">How It Works</button>
            <button disabled className="opacity-50 cursor-not-allowed transition-colors" title="Coming soon">Resume Copilot</button>
            <button disabled className="opacity-50 cursor-not-allowed transition-colors" title="Coming soon">Pricing</button>
          </nav>

          <div className="flex items-center space-x-4">
            <Link to="/login" className="hidden sm:block text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Sign In
            </Link>
            <Link to="/signup" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 transition-all">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        {/* Decorative Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1500px] 2xl:max-w-[1700px] h-[600px] pointer-events-none opacity-50 dark:opacity-30">
          <div className="absolute -top-[10%] left-[20%] w-[500px] h-[500px] rounded-full bg-blue-400/30 blur-[100px]" />
          <div className="absolute top-[20%] right-[10%] w-[600px] h-[600px] rounded-full bg-indigo-400/20 blur-[120px]" />
        </div>

        <div className="max-w-[1500px] 2xl:max-w-[1700px] mx-auto px-6 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl 2xl:max-w-6xl mx-auto space-y-8">
            <h1 className="text-5xl sm:text-6xl md:text-7xl 2xl:text-8xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1]">
              Beat ATS Filters and <br className="hidden sm:block"/>
              <span className="text-blue-600 dark:text-blue-400">Land More Interviews</span>
            </h1>
            
            <p className="text-lg sm:text-xl 2xl:text-2xl text-slate-600 dark:text-slate-400 max-w-2xl 2xl:max-w-4xl mx-auto leading-relaxed">
              Upload your resume and instantly discover ATS issues, missing keywords, formatting problems, and opportunities to improve your chances of getting shortlisted.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link to="/signup" className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-base font-bold shadow-xl shadow-blue-600/25 transition-all flex items-center justify-center gap-2 group">
                <span>Analyze My Resume</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button onClick={() => scrollTo('demo')} className="w-full sm:w-auto px-8 py-4 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl text-base font-bold transition-all flex items-center justify-center gap-2">
                <BarChart className="w-5 h-5" />
                <span>View Demo</span>
              </button>
            </div>
          </motion.div>

          {/* Interactive Product Mockup */}
          <motion.div id="demo" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-20 max-w-5xl 2xl:max-w-7xl mx-auto">
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shadow-2xl overflow-hidden">
              {/* Mockup Controls */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 overflow-x-auto custom-scrollbar">
                <button 
                  onClick={() => setActiveMock('ats')}
                  className={`px-6 py-4 text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${activeMock === 'ats' ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}
                >
                  <Target className="w-4 h-4" /> ATS Score Analysis
                </button>
                <button 
                  onClick={() => setActiveMock('copilot')}
                  className={`px-6 py-4 text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${activeMock === 'copilot' ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}
                >
                  <MessageSquare className="w-4 h-4" /> Resume Copilot
                </button>
                <button 
                  onClick={() => setActiveMock('comparison')}
                  className={`px-6 py-4 text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${activeMock === 'comparison' ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}
                >
                  <SplitSquareHorizontal className="w-4 h-4" /> Resume Comparison
                </button>
              </div>
              
              {/* Mockup Content */}
              <div className="bg-white dark:bg-slate-950 min-h-[300px]">
                <AnimatePresence mode="wait">
                  {activeMock === 'ats' && <ATSMock key="ats" />}
                  {activeMock === 'copilot' && <CopilotMock key="copilot" />}
                  {activeMock === 'comparison' && <ComparisonMock key="comparison" />}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-slate-50 dark:bg-slate-900/30 border-y border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-[1500px] 2xl:max-w-[1700px] mx-auto px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">How It Works</h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">From upload to application in four simple steps.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-8 left-12 right-12 h-0.5 bg-slate-200 dark:bg-slate-800" />
            
            {[
              { icon: Upload, title: "Upload Resume", desc: "Upload your PDF or DOCX resume securely." },
              { icon: Activity, title: "Analyze ATS Score", desc: "Evaluate formatting, keywords, and ATS compatibility." },
              { icon: BrainCircuit, title: "Get AI Recommendations", desc: "Receive actionable suggestions to improve." },
              { icon: CheckCircle2, title: "Apply With Confidence", desc: "Download an optimized version and start applying." }
            ].map((step, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <step.icon className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Step {i + 1}: {step.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="max-w-[1500px] 2xl:max-w-[1700px] mx-auto px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Everything You Need to Get Hired</h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">Powerful tools designed to perfect your resume.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Target, color: "text-rose-500", bg: "bg-rose-500/10", title: "ATS Resume Score", desc: "Test your resume against actual ATS algorithms to ensure parsing compatibility." },
              { icon: Sparkles, color: "text-purple-500", bg: "bg-purple-500/10", title: "AI Resume Improvements", desc: "Get specific, line-by-line rewrites to maximize impact and keyword density." },
              { icon: Activity, color: "text-emerald-500", bg: "bg-emerald-500/10", title: "Real-Time Resume Analysis", desc: "Watch exactly how systems extract and interpret your data live." },
              { icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-500/10", title: "Resume Copilot", desc: "Chat directly with AI to brainstorm, edit, and improve every section of your resume." },
              { icon: SplitSquareHorizontal, color: "text-amber-500", bg: "bg-amber-500/10", title: "Resume Comparison", desc: "Compare multiple resumes side-by-side and identify the strongest candidate for a job." },
              { icon: ShieldCheck, color: "text-indigo-500", bg: "bg-indigo-500/10", title: "Privacy First", desc: "Your data is strictly confidential, encrypted, and never used to train global models." }
            ].map((f, i) => (
              <div key={i} className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-8 border border-slate-200/50 dark:border-slate-800 hover:shadow-lg transition-all space-y-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${f.bg} ${f.color}`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{f.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Before vs After Section */}
      <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
        <div className="max-w-[1500px] 2xl:max-w-[1700px] mx-auto px-6 relative z-10">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">Stop Guessing. Start Landing Interviews.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Before */}
            <div className="bg-rose-950/30 border border-rose-500/20 rounded-3xl p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-rose-500/20 pb-4">
                <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-500">
                  <XCircle className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-rose-100">Before CareerForge</h3>
              </div>
              <ul className="space-y-4">
                {["Low ATS Score & Auto-Rejections", "Missing Critical Job Keywords", "Weak Resume Structure & Impact", "Lower Visibility to Recruiters"].map((text, i) => (
                  <li key={i} className="flex items-center gap-3 text-rose-200">
                    <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* After */}
            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-3xl p-8 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] pointer-events-none" />
              <div className="flex items-center gap-3 border-b border-emerald-500/20 pb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-emerald-50">After CareerForge</h3>
              </div>
              <ul className="space-y-4">
                {["ATS Optimized & Parsable", "Job-Specific Keywords Injected", "Strong Structure with Metrics", "Higher Interview Potential"].map((text, i) => (
                  <li key={i} className="flex items-center gap-3 text-emerald-100">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span className="font-medium">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Statistics */}
      <section className="py-24 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-[1500px] 2xl:max-w-[1700px] mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {[
              { num: "10,000+", label: "Resumes Analyzed" },
              { num: "94%", label: "ATS Matching Accuracy" },
              { num: "5,000+", label: "Active Users" },
              { num: "4.9/5", label: "User Satisfaction" }
            ].map((stat, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, type: "spring" }}
                className="text-center space-y-2"
              >
                <p className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">{stat.num}</p>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 dark:bg-slate-950 py-16 md:py-24 border-t border-slate-200 dark:border-slate-900 theme-transition">
        <div className="max-w-[1500px] 2xl:max-w-[1700px] mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          
          <div className="space-y-6 md:col-span-1">
            <div className="flex items-center space-x-3">
              <img src="/logo.svg" alt="CareerForge Icon" className="h-8 w-8 object-contain dark:brightness-125" />
              <span className="text-xl font-extrabold tracking-tight font-outfit">
                <span className="text-slate-900 dark:text-white">Career</span><span className="text-blue-500 dark:text-blue-400">Forge</span>
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Designed for real-time production-grade talent acquisition and resume optimization.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 dark:text-white">Product</h4>
            <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
              <li><Link to="/features/analyzer" className="hover:text-blue-600 transition-colors">Resume Analyzer</Link></li>
              <li><Link to="/features/copilot" className="hover:text-blue-600 transition-colors">Resume Copilot</Link></li>
              <li><Link to="/features/compare" className="hover:text-blue-600 transition-colors">Resume Comparison</Link></li>
              <li id="pricing"><Link to="/pricing" className="hover:text-blue-600 transition-colors">Pricing</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 dark:text-white">Resources</h4>
            <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
              <li><Link to="/help" className="hover:text-blue-600 transition-colors">Help Center</Link></li>
              <li><Link to="/docs" className="hover:text-blue-600 transition-colors">Documentation</Link></li>
              <li><Link to="/blog" className="hover:text-blue-600 transition-colors">Blog</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 dark:text-white">Company</h4>
            <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
              <li><Link to="/about" className="hover:text-blue-600 transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-blue-600 transition-colors">Contact</Link></li>
              <li><Link to="/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-blue-600 transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

        </div>
        <div className="max-w-[1500px] 2xl:max-w-[1700px] mx-auto px-6 mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-sm text-slate-400">
          &copy; {new Date().getFullYear()} CareerForge. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
