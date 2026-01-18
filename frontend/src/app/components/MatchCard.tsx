import { MapPin, Building2, Navigation } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

interface MatchCardProps {
  hospital: string;
  distance: number;
  needs: number;
  drug: string;
  contact: string;
  compatibility?: 'strong' | 'good';
  onPropose: () => void;
}

export function MatchCard({ 
  hospital, 
  distance, 
  needs, 
  drug, 
  contact, 
  compatibility = 'good',
  onPropose 
}: MatchCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const compatibilityConfig = {
    strong: {
      bg: 'bg-violet-50',
      text: 'text-violet-700',
      border: 'border-violet-200',
      label: 'Strong Match'
    },
    good: {
      bg: 'bg-cyan-50',
      text: 'text-cyan-700',
      border: 'border-cyan-200',
      label: 'Good Match'
    }
  };

  const config = compatibilityConfig[compatibility];
  const eta = Math.round(distance * 2.3); // Mock ETA calculation

  return (
    <motion.div 
      className="p-4 backdrop-blur-sm rounded-xl transition-all duration-200 cursor-pointer border relative overflow-hidden group bg-slate-50/50 hover:bg-white/60 dark:bg-slate-800/50 dark:hover:bg-slate-700/60 border-slate-100 dark:border-slate-700"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.01 }}
    >
      {/* Shimmer effect on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
        initial={{ x: '-100%' }}
        animate={isHovered ? { x: '100%' } : { x: '-100%' }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />

      <div className="relative">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 relative overflow-hidden" 
               style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #22D3EE 100%)' }}>
            <Building2 className="w-5 h-5 text-white relative z-10" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {hospital}
            </h4>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {distance} miles away
              </span>
            </div>
          </div>
        </div>

        {/* Compatibility tag */}
        <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium mb-3 border backdrop-blur-sm ${config.bg} dark:bg-opacity-20 ${config.text} dark:${config.text} ${config.border}`}>
          {config.label}
        </div>
        
        <div className="space-y-1.5 mb-3">
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Needs: <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{needs} vials {drug}</span>
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Contact: <span className="font-medium">{contact}</span>
          </div>
        </div>

        {/* Route preview - reveals on hover */}
        <motion.div
          className="overflow-hidden"
          initial={{ height: 0, opacity: 0 }}
          animate={isHovered ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3 border" 
               style={{ backgroundColor: 'rgba(14, 165, 233, 0.08)', borderColor: 'rgba(14, 165, 233, 0.2)' }}>
            <Navigation className="w-3 h-3" style={{ color: 'var(--med-blue)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--med-blue)' }}>
              {distance}mi • ETA {eta}m
            </span>
          </div>
        </motion.div>

        <motion.button 
          onClick={onPropose}
          className="w-full px-3 py-2 rounded-lg font-medium text-sm relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #0EA5E9 0%, #22D3EE 100%)',
            color: 'white'
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Propose Transfer
        </motion.button>
      </div>
    </motion.div>
  );
}
