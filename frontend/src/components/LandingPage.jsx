import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Target,
  CheckCircle2,
  Upload,
  MessageSquare,
  SplitSquareHorizontal,
  BarChart,
  BrainCircuit,
  Activity
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
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-x-clip relative theme-transition">
      
      {/* Navigation */}
      <header className="fixed inset-x-0 top-0 z-50 w-full border-b border-slate-200/50 dark:border-white/[0.07] bg-white/85 dark:bg-slate-950/85 backdrop-blur-xl shadow-[0_14px_45px_-35px_rgba(138,76,239,0.75)]">
        <div className="max-w-[1500px] 2xl:max-w-[1700px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
            <img src="/logo.svg" alt="CareerForge Icon" className="h-12 w-12 object-contain dark:drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] dark:brightness-125" />
            <span className="text-2xl font-extrabold tracking-tight font-outfit">
              <span className="text-slate-900 dark:text-white">Career</span>
              <span className="text-blue-500 dark:text-blue-400">Forge</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <button onClick={() => scrollTo('features')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Features</button>
            <button onClick={() => scrollTo('how-it-works')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">How It Works</button>
            <button onClick={() => scrollTo('demo')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Demo</button>
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
      <section className="relative pt-36 pb-24 overflow-hidden">
        {/* Decorative Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1500px] 2xl:max-w-[1700px] h-[600px] pointer-events-none opacity-50 dark:opacity-30">
          <div className="absolute -top-[10%] left-[20%] w-[500px] h-[500px] rounded-full bg-blue-400/30 blur-[100px]" />
          <div className="absolute top-[20%] right-[10%] w-[600px] h-[600px] rounded-full bg-indigo-400/20 blur-[120px]" />
        </div>

        <div className="max-w-[1500px] 2xl:max-w-[1700px] mx-auto px-6 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl 2xl:max-w-6xl mx-auto space-y-8">
            <div className="inline-flex items-center gap-3 rounded-full border border-blue-500/35 bg-blue-500/5 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-300 shadow-[0_0_45px_-16px_rgba(138,76,239,0.8)]">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
              AI-powered resume intelligence, built for real applications
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl 2xl:text-8xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1]">
              Beat ATS Filters. <br className="hidden sm:block"/>
              Land More Interviews<span className="text-blue-500">.</span>
            </h1>
            
            <p className="text-lg sm:text-xl 2xl:text-2xl text-slate-600 dark:text-slate-400 max-w-2xl 2xl:max-w-4xl mx-auto leading-relaxed">
              Score your resume, find missing keywords, and get clear fixes for the job you want.
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
          <motion.div id="demo" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="scroll-mt-28 mt-16 max-w-5xl 2xl:max-w-7xl mx-auto">
            <div className="jobbie-surface rounded-3xl overflow-hidden">
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
      <section id="how-it-works" className="scroll-mt-20 py-20 bg-slate-50 dark:bg-slate-900/30 border-y border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-[1500px] 2xl:max-w-[1700px] mx-auto px-6">
          <div className="text-center space-y-3 mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">How It Works</h2>
            <p className="text-base text-slate-500 dark:text-slate-400">Useful feedback in minutes.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative max-w-5xl mx-auto">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-8 left-12 right-12 h-0.5 bg-slate-200 dark:bg-slate-800" />
            
            {[
              { icon: Upload, title: "Upload", desc: "Add your resume and target role." },
              { icon: Activity, title: "Analyze", desc: "See your ATS score and gaps." },
              { icon: BrainCircuit, title: "Improve", desc: "Apply focused, actionable fixes." }
            ].map((step, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <step.icon className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{i + 1}. {step.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="scroll-mt-20 py-20">
        <div className="max-w-[1500px] 2xl:max-w-[1700px] mx-auto px-6">
          <div className="text-center space-y-3 mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Built for Better Applications</h2>
            <p className="text-base text-slate-500 dark:text-slate-400">Three tools. One stronger resume.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { icon: Target, color: "text-rose-500", bg: "bg-rose-500/10", title: "ATS Match", desc: "Score your resume against a specific job." },
              { icon: Sparkles, color: "text-purple-500", bg: "bg-purple-500/10", title: "AI Improvements", desc: "Turn gaps into clear, practical edits." },
              { icon: SplitSquareHorizontal, color: "text-amber-500", bg: "bg-amber-500/10", title: "Resume Comparison", desc: "Find the strongest version before applying." }
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

      <section className="border-y border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 py-20 text-center">
        <div className="mx-auto max-w-2xl px-6 space-y-6">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">Ready to improve your resume?</h2>
          <p className="text-slate-500 dark:text-slate-400">Upload once. Get a focused plan.</p>
          <Link to="/signup" className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-7 py-3.5 font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700">
            Analyze My Resume <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 dark:bg-slate-950 py-10 border-t border-slate-200 dark:border-slate-900 theme-transition">
        <div className="max-w-[1500px] 2xl:max-w-[1700px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
              <img src="/logo.svg" alt="CareerForge Icon" className="h-8 w-8 object-contain dark:brightness-125" />
              <span className="text-xl font-extrabold tracking-tight font-outfit">
                <span className="text-slate-900 dark:text-white">Career</span><span className="text-blue-500 dark:text-blue-400">Forge</span>
              </span>
          </div>
          <div className="flex items-center gap-6 text-sm font-semibold text-slate-500 dark:text-slate-400">
            <button onClick={() => scrollTo('features')} className="hover:text-blue-500">Features</button>
            <button onClick={() => scrollTo('how-it-works')} className="hover:text-blue-500">How it works</button>
            <Link to="/login" className="hover:text-blue-500">Sign in</Link>
          </div>
          <p className="text-sm text-slate-400">&copy; {new Date().getFullYear()} CareerForge</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
