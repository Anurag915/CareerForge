import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, RefreshCw, Layers, Award, FileText, Zap, Box, Sparkles, UserPlus } from 'lucide-react';
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
    recommended_skills = [],
    skill_distribution = [],
    improved_points = [],
    rewritten_resume = "",
    keywords = [],
    top_skills = [],
    tools = [],
    sections = {},
    breakdown = { skills: 0, experience: 0, projects: 0 }
  } = results;

  const renderItem = (item) => {
    if (typeof item === 'string') return item;
    if (typeof item === 'object' && item !== null) {
      return item.skill || item.name || item.description || Object.values(item)[0] || JSON.stringify(item);
    }
    return String(item);
  };

  const MetricBar = ({ label, value, icon: Icon, colorClass }) => (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center space-x-2">
          <Icon className="w-3.5 h-3.5 text-brand-400" />
          <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider">{label}</span>
        </div>
        <span className="text-[11px] font-bold text-brand-900">{value}%</span>
      </div>
      <div className="h-1.5 w-full bg-brand-50 rounded-full overflow-hidden border border-brand-100">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className={`h-full rounded-full ${colorClass}`}
        />
      </div>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full space-y-6"
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
        <div className="md:col-span-1 space-y-4">
          <ScoreCard score={ats_score} label="Weighted Match Score" />
          
          <div className="bg-white rounded-2xl p-4 border border-subtle shadow-subtle space-y-4">
            <div className="flex items-center space-x-2 border-b border-subtle pb-3">
              <Zap className="w-4 h-4 text-brand-900" />
              <h3 className="text-sm font-semibold text-brand-900">Weighted Engine</h3>
            </div>
            
            <div className="space-y-5">
              <MetricBar label="Skill Match (60%)" value={breakdown.skills} icon={Award} colorClass="bg-brand-900" />
              <MetricBar label="Experience Depth (25%)" value={breakdown.experience} icon={UserPlus} colorClass="bg-emerald-500" />
              <MetricBar label="Project Impact (15%)" value={breakdown.projects} icon={Layers} colorClass="bg-amber-500" />
            </div>

            <div className="pt-4 mt-2 bg-brand-50/50 p-3 rounded-xl border border-brand-100">
               <p className="text-[10px] text-brand-500 leading-relaxed italic">
                 "Our deterministic scoring engine uses weighted vectors to ensure your technical skills are the primary ranking factor."
               </p>
            </div>
          </div>
        </div>

        {/* Right Column: Content */}
        <div className="md:col-span-2 space-y-4">
          
          {/* Main Skills Analysis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-subtle p-4 shadow-subtle flex flex-col h-full">
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

            <div className="bg-white rounded-2xl border border-subtle p-4 shadow-subtle flex flex-col h-full">
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
          <div className="bg-white rounded-2xl border border-subtle p-4 shadow-subtle space-y-4">
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {['summary', 'skills', 'experience', 'education', 'projects', 'achievements'].map(section => (
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
          
          {/* Level 2: Advanced Analysis Section */}
          <div className="bg-white rounded-2xl border border-subtle p-4 shadow-subtle space-y-4">
            <h3 className="text-lg font-semibold text-brand-900 border-b border-subtle pb-3">Advanced Enhancements</h3>
            
            {/* AI Generated Suggestions */}
            {results.advanced_enhancements && results.advanced_enhancements.length > 0 && (
              <div className="space-y-3">
                <span className="text-xs font-semibold text-brand-500 uppercase tracking-wider block mb-2">Strategy to improve ATS Score</span>
                <ul className="space-y-2">
                  {results.advanced_enhancements.map((suggestion, i) => (
                    <li key={i} className="flex items-start space-x-3 p-3 bg-brand-50 rounded-xl border border-brand-100 shadow-sm">
                      <div className="mt-1 bg-brand-900 text-white rounded-full p-0.5 shrink-0">
                        <Sparkles className="w-2.5 h-2.5" />
                      </div>
                      <span className="text-sm text-brand-800 font-medium leading-snug">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommended Skills */}
            {recommended_skills.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-brand-500 uppercase tracking-wider mb-2 block">Recommended to Learn</span>
                <div className="flex flex-wrap gap-1.5">
                  {recommended_skills.map((item, i) => (
                    <span key={i} className="px-2 py-1 bg-amber-50 text-amber-700 text-[11px] font-medium rounded-md border border-amber-100/50">
                      {renderItem(item)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Improved Bullet Points */}
            {improved_points.length > 0 && (
              <div className="space-y-3">
                <span className="text-xs font-semibold text-brand-500 uppercase tracking-wider block">Bullet Point Rewrites</span>
                {improved_points.map((pt, i) => (
                  <div key={i} className="p-3 bg-brand-50 rounded-xl border border-brand-200 space-y-2">
                    <div className="text-xs text-red-400 line-through">
                      {pt.original}
                    </div>
                    <div className="text-sm text-emerald-700 font-medium">
                      {pt.improved}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Full Resume Rewrite (Structured) */}
            {rewritten_resume && typeof rewritten_resume === 'object' && (
              <div className="space-y-4">
                <span className="text-xs font-semibold text-brand-500 uppercase tracking-wider block">Fully Rewritten Resume</span>
                <div className="p-5 bg-zinc-900 text-zinc-300 rounded-xl text-xs font-mono leading-relaxed max-h-96 overflow-y-auto custom-scrollbar shadow-inner space-y-4">
                  
                  {/* Summary */}
                  {rewritten_resume.summary && (
                    <div>
                      <div className="text-zinc-500 font-bold mb-1 uppercase tracking-wider text-[10px] border-b border-zinc-800 pb-1">Summary</div>
                      <div className="whitespace-pre-wrap text-zinc-300">{rewritten_resume.summary}</div>
                    </div>
                  )}

                  {/* Skills */}
                  {rewritten_resume.skills && rewritten_resume.skills.length > 0 && (
                    <div>
                      <div className="text-zinc-500 font-bold mb-1 uppercase tracking-wider text-[10px] border-b border-zinc-800 pb-1">Skills</div>
                      <div className="text-zinc-300">{rewritten_resume.skills.join(" • ")}</div>
                    </div>
                  )}

                  {/* Experience */}
                  {rewritten_resume.experience && rewritten_resume.experience.length > 0 && (
                    <div>
                      <div className="text-zinc-500 font-bold mb-2 uppercase tracking-wider text-[10px] border-b border-zinc-800 pb-1">Experience</div>
                      <div className="space-y-3">
                        {rewritten_resume.experience.map((exp, idx) => (
                          <div key={idx} className="bg-zinc-800/50 p-2.5 rounded-lg border border-zinc-800">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-emerald-400">{exp.role}</span>
                              <span className="text-zinc-500 text-[10px]">{exp.duration}</span>
                            </div>
                            <div className="text-zinc-400 font-medium mb-2">{exp.company}</div>
                            <ul className="list-disc list-inside space-y-1 text-zinc-300 ml-1">
                              {exp.points && exp.points.map((pt, i) => <li key={i} className="leading-snug">{pt}</li>)}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Projects */}
                  {rewritten_resume.projects && rewritten_resume.projects.length > 0 && (
                    <div>
                      <div className="text-zinc-500 font-bold mb-2 uppercase tracking-wider text-[10px] border-b border-zinc-800 pb-1">Projects</div>
                      <div className="space-y-2">
                        {rewritten_resume.projects.map((proj, idx) => (
                          <div key={idx} className="bg-zinc-800/50 p-2.5 rounded-lg border border-zinc-800">
                            <div className="font-bold text-amber-400 mb-1">{proj.name}</div>
                            <div className="text-zinc-300">{proj.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {rewritten_resume.education && rewritten_resume.education.length > 0 && (
                    <div>
                      <div className="text-zinc-500 font-bold mb-2 uppercase tracking-wider text-[10px] border-b border-zinc-800 pb-1">Education</div>
                      <div className="space-y-2">
                        {rewritten_resume.education.map((edu, idx) => (
                          <div key={idx} className="bg-zinc-800/50 p-2.5 rounded-lg border border-zinc-800">
                            <div className="font-bold text-blue-400">{edu.degree}</div>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-zinc-300">{edu.institution}</span>
                              <span className="text-zinc-500 text-[10px]">{edu.year}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Achievements */}
                  {rewritten_resume.achievements && rewritten_resume.achievements.length > 0 && (
                    <div>
                      <div className="text-zinc-500 font-bold mb-1 uppercase tracking-wider text-[10px] border-b border-zinc-800 pb-1">Achievements</div>
                      <ul className="list-disc list-inside space-y-1 text-zinc-300 ml-1">
                        {rewritten_resume.achievements.map((ach, idx) => <li key={idx} className="leading-snug">{ach}</li>)}
                      </ul>
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </motion.div>
  );
};

export default ResultCard;
