import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, RefreshCw, Layers, Award, FileText, Zap, Box } from 'lucide-react';
import ScoreCard from './ScoreCard';

const ResultCard = ({ results, onReset }) => {
  // Destructure with safe defaults
  const { 
    ats_score = 0, 
    match_score = 0,
    keyword_match_score = 0,
    format_score = 0,
    section_score = 0,
    matched_skills = [], 
    missing_skills = [], 
    keywords = [],
    top_skills = [],
    tools = [],
    sections = {}
  } = results;

  const renderItem = (item) => {
    if (typeof item === 'string') return item;
    if (typeof item === 'object' && item !== null) {
      return item.skill || item.name || item.description || Object.values(item)[0] || JSON.stringify(item);
    }
    return String(item);
  };

  const MetricPill = ({ label, value, icon: Icon }) => (
    <div className="flex items-center justify-between p-3 bg-brand-50 rounded-xl border border-brand-200">
      <div className="flex items-center space-x-2">
        <Icon className="w-4 h-4 text-brand-500" />
        <span className="text-xs font-medium text-brand-600">{label}</span>
      </div>
      <span className="text-sm font-semibold text-brand-900">{Math.round(value)}%</span>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-5xl mx-auto space-y-6"
    >
      {/* Dashboard Header */}
      <div className="flex items-center justify-between pb-4 border-b border-subtle">
        <div>
          <h2 className="text-xl font-semibold text-brand-900 tracking-tight">Full ATS Profile</h2>
          <p className="text-sm text-brand-500 mt-0.5">Comprehensive intelligence report based on your resume and target job.</p>
        </div>
        <button
          onClick={onReset}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-brand-200 text-brand-900 rounded-md text-xs font-medium hover:bg-brand-50 transition-colors shadow-subtle"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>New Analysis</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Scores */}
        <div className="md:col-span-1 space-y-6">
          <ScoreCard score={ats_score} label="Final ATS Score" />
          
          <div className="bg-white rounded-2xl p-6 border border-subtle shadow-subtle space-y-4">
            <h3 className="text-sm font-semibold text-brand-900 border-b border-subtle pb-3">Score Breakdown</h3>
            <div className="space-y-2.5">
              <MetricPill label="Semantic Match" value={match_score} icon={Zap} />
              <MetricPill label="Keyword Density" value={keyword_match_score} icon={Award} />
              <MetricPill label="Format Sanity" value={format_score} icon={FileText} />
              <MetricPill label="Section Quality" value={section_score} icon={Layers} />
            </div>
          </div>
        </div>

        {/* Right Column: Content */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Main Skills Analysis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-subtle p-6 shadow-subtle flex flex-col h-full">
              <div className="flex items-center space-x-2 mb-4">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-semibold text-brand-900">Matched Skills</h3>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-auto">
                {matched_skills.length > 0 ? matched_skills.map((item, i) => (
                  <span key={i} className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-medium rounded-md border border-emerald-100/50">
                    {renderItem(item)}
                  </span>
                )) : <span className="text-xs text-brand-400">None detected.</span>}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-subtle p-6 shadow-subtle flex flex-col h-full">
              <div className="flex items-center space-x-2 mb-4">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <h3 className="text-sm font-semibold text-brand-900">Missing Skills (Critical)</h3>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-auto">
                {missing_skills.length > 0 ? missing_skills.map((item, i) => (
                  <span key={i} className="px-2 py-1 bg-red-50 text-red-700 text-[11px] font-medium rounded-md border border-red-100/50">
                    {renderItem(item)}
                  </span>
                )) : <span className="text-xs text-brand-400">Perfect match!</span>}
              </div>
            </div>
          </div>

          {/* Extracted Profile Data */}
          <div className="bg-white rounded-2xl border border-subtle p-6 shadow-subtle space-y-6">
            <div className="flex items-center space-x-2 border-b border-subtle pb-3">
              <Box className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-semibold text-brand-900">Extracted Intelligence</h3>
            </div>
            
            <div className="space-y-4">
              {/* Keywords */}
              <div>
                <span className="text-xs font-semibold text-brand-500 uppercase tracking-wider mb-2 block">Resume Keywords</span>
                <div className="flex flex-wrap gap-1.5">
                  {keywords.length > 0 ? keywords.map((item, i) => (
                    <span key={i} className="px-2 py-1 bg-brand-50 text-brand-700 text-[11px] rounded-md border border-brand-200">
                      {renderItem(item)}
                    </span>
                  )) : <span className="text-xs text-brand-400">No keywords extracted.</span>}
                </div>
              </div>

              {/* Tools & Tech */}
              <div>
                <span className="text-xs font-semibold text-brand-500 uppercase tracking-wider mb-2 block">Tools & Software</span>
                <div className="flex flex-wrap gap-1.5">
                  {tools.length > 0 ? tools.map((item, i) => (
                    <span key={i} className="px-2 py-1 bg-brand-50 text-brand-700 text-[11px] rounded-md border border-brand-200">
                      {renderItem(item)}
                    </span>
                  )) : <span className="text-xs text-brand-400">No tools extracted.</span>}
                </div>
              </div>
            </div>

            {/* Extracted Sections Preview */}
            <div className="pt-4 border-t border-subtle">
              <span className="text-xs font-semibold text-brand-500 uppercase tracking-wider mb-3 block">Section Detection Confidence</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {['skills', 'experience', 'education', 'projects'].map(section => (
                  <div key={section} className="p-3 bg-brand-50 rounded-xl border border-brand-200">
                    <span className="text-[10px] font-bold text-brand-500 uppercase block mb-1">{section}</span>
                    <span className={`text-xs font-medium ${sections[section] && sections[section].length > 10 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {sections[section] && sections[section].length > 10 ? 'Detected' : 'Missing'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>
    </motion.div>
  );
};

export default ResultCard;
