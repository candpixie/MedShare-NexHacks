import { Clock, Package } from 'lucide-react';
import { motion } from 'motion/react';

interface AlertCardProps {
  id: number;
  name: string;
  qty: number;
  need: number;
  excess: number;
  expDays: number;
  value: number;
  urgency: 'high' | 'medium' | 'low';
  onFindMatch: (id: number) => void;
}

export function AlertCard({ 
  id, 
  name, 
  qty, 
  need, 
  excess, 
  expDays, 
  value, 
  urgency,
  onFindMatch 
}: AlertCardProps) {
  const urgencyConfig = {
    high: {
      glowColor: 'rgba(251, 113, 133, 0.15)',
      ringColor: 'ring-rose-200/60 hover:ring-rose-300/70',
      badgeBg: 'bg-rose-100',
      badgeText: 'text-rose-700',
      accentColor: '#FB7185',
      label: 'Urgent'
    },
    medium: {
      glowColor: 'rgba(251, 191, 36, 0.12)',
      ringColor: 'ring-amber-200/60 hover:ring-amber-300/70',
      badgeBg: 'bg-amber-100',
      badgeText: 'text-amber-700',
      accentColor: '#FBBF24',
      label: 'Warning'
    },
    low: {
      glowColor: 'rgba(34, 211, 238, 0.1)',
      ringColor: 'ring-cyan-200/60 hover:ring-cyan-300/70',
      badgeBg: 'bg-cyan-100',
      badgeText: 'text-cyan-700',
      accentColor: '#22D3EE',
      label: 'Monitor'
    }
  };

  const config = urgencyConfig[urgency];
  const totalValue = excess * value;

  return (
    <motion.div 
      className={`relative bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-white/60 ring-1 ${config.ringColor} transition-all duration-200 ease-out group overflow-hidden`}
      style={{
        boxShadow: `0 8px 30px rgba(2, 6, 23, 0.08), 0 0 20px ${config.glowColor}`
      }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ 
        y: -2,
        boxShadow: `0 12px 34px rgba(2, 6, 23, 0.12), 0 0 30px ${config.glowColor}`,
      }}
    >
      {/* Corner accent glow */}
      <div 
        className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20"
        style={{ background: config.accentColor }}
      />

      {/* Urgency pulse for high only */}
      {urgency === 'high' && (
        <motion.div
          className="absolute inset-0 rounded-2xl"
          style={{ border: `1px solid ${config.accentColor}` }}
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Header */}
      <div className="relative flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="inline-block px-3 py-1 rounded-full mb-2" style={{ backgroundColor: 'var(--soft-ice)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {name}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Expires in {expDays} days
            </span>
          </div>
        </div>
        
        {/* Countdown chip */}
        <motion.div 
          className={`px-3 py-1 rounded-full text-xs font-medium ${config.badgeBg} ${config.badgeText} backdrop-blur-sm`}
          whileHover={{ scale: 1.05 }}
        >
          {config.label}
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="relative grid grid-cols-4 gap-3 mb-4">
        <div className="text-center p-3 bg-slate-50/50 backdrop-blur-sm rounded-xl border border-slate-100">
          <div className="text-lg font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{qty}</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Stock</div>
        </div>
        <div className="text-center p-3 bg-slate-50/50 backdrop-blur-sm rounded-xl border border-slate-100">
          <div className="text-lg font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{need}</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Need</div>
        </div>
        <div className="text-center p-3 rounded-xl border" style={{ backgroundColor: 'rgba(52, 211, 153, 0.1)', borderColor: 'rgba(52, 211, 153, 0.2)' }}>
          <div className="text-lg font-bold tabular-nums" style={{ color: 'var(--success-mint)' }}>{excess}</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Excess</div>
        </div>
        <div className="text-center p-3 rounded-xl border" style={{ backgroundColor: 'rgba(14, 165, 233, 0.1)', borderColor: 'rgba(14, 165, 233, 0.2)' }}>
          <div className="text-lg font-bold tabular-nums" style={{ color: 'var(--med-blue)' }}>${totalValue}</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Value</div>
        </div>
      </div>

      {/* Split Button Actions */}
      <div className="relative flex gap-2">
        <motion.button 
          onClick={() => onFindMatch(id)}
          className="flex-1 px-4 py-2.5 rounded-xl text-white font-medium text-sm flex items-center justify-center gap-2 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #0EA5E9 0%, #22D3EE 100%)'
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Package className="w-4 h-4" />
          Find Match
        </motion.button>
        
        <motion.button
          className="px-4 py-2.5 rounded-xl font-medium text-sm border border-slate-200 bg-slate-50/50 backdrop-blur-sm hover:bg-slate-100/50 transition-colors"
          style={{ color: 'var(--text-primary)' }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Details
        </motion.button>
      </div>
    </motion.div>
  );
}
