import { LucideIcon } from 'lucide-react';
import { motion, useInView, useMotionValue, useSpring } from 'motion/react';
import { useEffect, useRef } from 'react';

interface StatCardProps {
  icon: LucideIcon;
  iconGradient: string;
  value: string | number;
  label: string;
  delay?: number;
}

export function StatCard({ icon: Icon, iconGradient, value, label, delay = 0 }: StatCardProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  
  // Count-up animation for numbers
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { duration: 1500 });
  const displayValue = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isInView && typeof value === 'number') {
      motionValue.set(value);
    }
  }, [isInView, value, motionValue]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      if (displayValue.current && typeof value === 'number') {
        displayValue.current.textContent = Math.round(latest).toLocaleString();
      }
    });
    return unsubscribe;
  }, [springValue, value]);

  return (
    <motion.div 
      ref={ref}
      className="relative bg-white/70 backdrop-blur-xl rounded-2xl p-5 border border-white/40 group overflow-hidden dark:bg-slate-900/70 dark:border-slate-700/40"
      style={{
        boxShadow: '0 4px 24px rgba(15, 23, 42, 0.08)'
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay }}
      whileHover={{ 
        y: -2,
        boxShadow: '0 8px 32px rgba(15, 23, 42, 0.12)',
        transition: { duration: 0.2 }
      }}
    >
      {/* Top glow edge - more subtle */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-300/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Gradient wash background - very subtle */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{ background: `linear-gradient(135deg, ${iconGradient} 0%, transparent 100%)` }}
      />

      <div className="relative flex items-start gap-4">
        {/* Icon with gradient */}
        <motion.div 
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 relative overflow-hidden shadow-lg"
          style={{ background: iconGradient }}
          whileHover={{ scale: 1.03 }}
          transition={{ duration: 0.2 }}
        >
          <Icon className="w-5 h-5 text-white relative z-10" />
        </motion.div>

        <div className="flex-1 min-w-0">
          <div 
            ref={displayValue}
            className="text-3xl font-semibold tracking-tight tabular-nums"
            style={{ color: 'var(--text-primary)' }}
          >
            {typeof value === 'string' ? value : '0'}
          </div>
          <div className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
            {label}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
