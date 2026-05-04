import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const messages = [
  "Connecting to AI intelligence...",
  "Extracting resume structure...",
  "Parsing professional experience...",
  "Analyzing job requirements...",
  "Mapping skill overlaps...",
  "Identifying knowledge gaps...",
  "Finalizing compatibility score..."
];

const LoadingScreen = () => {
  const [currentMessage, setCurrentMessage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % messages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full max-w-2xl mx-auto p-12 bg-white dark:bg-slate-800/50 rounded-2xl shadow-premium border border-slate-200 dark:border-slate-700 theme-transition">
      
      {/* Minimalist Spinner */}
      <div className="mb-8 relative flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="text-slate-900 dark:text-accent-500"
        >
          <Loader2 className="w-10 h-10" strokeWidth={1.5} />
        </motion.div>
      </div>

      <div className="text-center space-y-4">
        <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100 tracking-tight">Processing Analysis</h2>
        
        <div className="h-6 relative overflow-hidden flex justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentMessage}
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -15, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-slate-500 dark:text-slate-400 text-sm"
            >
              {messages[currentMessage]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Minimal Progress Line */}
        <div className="w-48 h-0.5 bg-slate-100 dark:bg-slate-900 rounded-full mx-auto mt-6 overflow-hidden relative">
          <motion.div
            initial={{ left: '-100%' }}
            animate={{ left: '100%' }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 bottom-0 w-1/2 bg-slate-900 dark:bg-accent-600 rounded-full"
          />
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
