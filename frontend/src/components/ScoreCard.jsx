
import { motion } from 'framer-motion';

const ScoreCard = ({ score, label = "Match Score" }) => {
  const radius = 55;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  const getScoreColor = (s) => {
    if (s >= 80) return '#10b981'; // emerald-500
    if (s >= 60) return '#f59e0b'; // amber-500
    return '#ef4444'; // red-500
  };

  const color = getScoreColor(score);

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-subtle w-full theme-transition">
      <div className="relative w-40 h-40">
        {/* Background Circle */}
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            className="text-slate-100 dark:text-slate-900"
            strokeWidth="4"
          />
          {/* Animated Progress Circle */}
          <motion.circle
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth="4"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>
        
        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center mt-1">
          <motion.span 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="text-4xl font-semibold tracking-tighter text-slate-900 dark:text-slate-100"
          >
            {Math.round(score)}<span className="text-xl text-slate-400 dark:text-slate-500 font-normal">%</span>
          </motion.span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-1 text-center max-w-[90px] leading-tight">
            {label}
          </span>
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
          {score >= 80 ? 'Excellent Match' : score >= 60 ? 'Good Potential' : 'Needs Optimization'}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">AI-Powered ATS Intelligence</p>
      </div>
    </div>
  );
};

export default ScoreCard;
