import { Activity } from 'lucide-react';
import { motion } from 'motion/react';

interface NetworkRequestProps {
  hospital: string;
  medication: string;
  onRespond: () => void;
}

export function NetworkRequest({ hospital, medication, onRespond }: NetworkRequestProps) {
  return (
    <motion.div 
      className="p-4 backdrop-blur-sm rounded-xl border transition-all duration-200 bg-slate-50/50 hover:bg-white/60 dark:bg-slate-800/50 dark:hover:bg-slate-700/60 border-slate-100 dark:border-slate-700"
      whileHover={{ scale: 1.01 }}
    >
      <div className="flex items-start gap-2 mb-3">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          <Activity className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--warning-amber)' }} />
        </motion.div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {hospital}
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Needs: {medication}
          </div>
        </div>
      </div>
      <motion.button 
        onClick={onRespond}
        className="w-full px-3 py-2 rounded-lg font-medium text-xs border transition-colors"
        style={{ 
          backgroundColor: 'rgba(251, 191, 36, 0.1)', 
          borderColor: 'rgba(251, 191, 36, 0.3)',
          color: 'var(--warning-amber)'
        }}
        whileHover={{ 
          backgroundColor: 'rgba(251, 191, 36, 0.15)',
          scale: 1.02 
        }}
        whileTap={{ scale: 0.98 }}
      >
        Respond
      </motion.button>
    </motion.div>
  );
}
