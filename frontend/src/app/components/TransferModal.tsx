import { X, ArrowRightLeft, Building2, Package, CheckCircle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: () => void;
  fromHospital: string;
  toHospital: string;
  medication: string;
  quantity: number;
  value: number;
}

export function TransferModal({ 
  isOpen, 
  onClose, 
  onSubmit,
  fromHospital, 
  toHospital, 
  medication, 
  quantity, 
  value 
}: TransferModalProps) {
  const [showCompliance, setShowCompliance] = useState(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(7, 26, 43, 0.6)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div 
            className="bg-white/80 backdrop-blur-xl rounded-3xl max-w-lg w-full relative overflow-hidden border border-white/60"
            style={{
              boxShadow: '0 24px 60px rgba(2, 6, 23, 0.2)'
            }}
            initial={{ opacity: 0, scale: 0.98, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Aurora accent glow */}
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
                 style={{ background: 'linear-gradient(135deg, #22D3EE 0%, #8B5CF6 100%)' }} />

            {/* Header */}
            <div className="relative p-6 border-b border-slate-200/60 flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Propose Transfer
              </h2>
              <motion.button 
                onClick={onClose}
                className="p-2 hover:bg-slate-100/50 rounded-xl transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              </motion.button>
            </div>

            {/* Body */}
            <div className="relative p-6 space-y-5">
              {/* Animated Transfer Flow Diagram */}
              <div className="relative p-5 rounded-2xl overflow-hidden" 
                   style={{ backgroundColor: 'rgba(52, 211, 153, 0.08)' }}>
                <div className="flex items-center justify-between gap-4">
                  {/* From */}
                  <motion.div 
                    className="flex-1 text-center"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-2 relative overflow-hidden"
                         style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #22D3EE 100%)' }}>
                      <Building2 className="w-7 h-7 text-white relative z-10" />
                    </div>
                    <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {fromHospital}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Sender
                    </div>
                  </motion.div>

                  {/* Animated Arrow */}
                  <motion.div 
                    className="flex flex-col items-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                  >
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <ArrowRightLeft className="w-6 h-6" style={{ color: 'var(--success-mint)' }} />
                    </motion.div>
                    <div className="text-xs font-bold mt-1 px-2 py-1 rounded-full" 
                         style={{ backgroundColor: 'var(--success-mint)', color: 'white' }}>
                      {quantity} vials
                    </div>
                  </motion.div>

                  {/* To */}
                  <motion.div 
                    className="flex-1 text-center"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-2 relative overflow-hidden"
                         style={{ background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)' }}>
                      <Building2 className="w-7 h-7 text-white relative z-10" />
                    </div>
                    <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {toHospital}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Receiver
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-4 bg-slate-50/50 backdrop-blur-sm rounded-xl border border-slate-100">
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Medication</span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{medication}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50/50 backdrop-blur-sm rounded-xl border border-slate-100">
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Quantity</span>
                  <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>{quantity} vials</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl border" 
                     style={{ backgroundColor: 'rgba(52, 211, 153, 0.1)', borderColor: 'rgba(52, 211, 153, 0.2)' }}>
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Estimated Value</span>
                  <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--success-mint)' }}>${value}</span>
                </div>
              </div>

              {/* Benefits */}
              <div className="rounded-xl p-4 border" style={{ backgroundColor: 'rgba(14, 165, 233, 0.06)', borderColor: 'rgba(14, 165, 233, 0.15)' }}>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <CheckCircle className="w-4 h-4" style={{ color: 'var(--med-blue)' }} />
                  Transfer Benefits
                </h3>
                <ul className="space-y-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <li>• Prevents medication waste</li>
                  <li>• Saves {toHospital} procurement costs</li>
                  <li>• Recovers ${value} value for {fromHospital}</li>
                  <li>• Strengthens hospital network collaboration</li>
                </ul>
              </div>

              {/* Compliance Accordion */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <motion.button
                  onClick={() => setShowCompliance(!showCompliance)}
                  className="w-full p-4 flex items-center justify-between bg-slate-50/30 hover:bg-slate-50/50 transition-colors"
                  whileHover={{ backgroundColor: 'rgba(248, 250, 252, 0.5)' }}
                >
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Risk & Compliance Checklist
                  </span>
                  <motion.div
                    animate={{ rotate: showCompliance ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  </motion.div>
                </motion.button>
                
                <AnimatePresence>
                  {showCompliance && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="p-4 space-y-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <span>Cold chain required? ❄️</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <span>Controlled substance? 🔒</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <span>Documentation checklist complete ✅</span>
                        </label>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="relative p-6 border-t border-slate-200/60 flex gap-3">
              <motion.button 
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-slate-100/50 backdrop-blur-sm hover:bg-slate-100 rounded-xl transition-colors font-medium text-sm border border-slate-200"
                style={{ color: 'var(--text-primary)' }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
              <motion.button 
                onClick={() => {
                  onSubmit?.();
                  onClose();
                }}
                className="flex-1 px-4 py-2.5 rounded-xl text-white font-medium text-sm flex items-center justify-center gap-2 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #0EA5E9 0%, #22D3EE 100%)'
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Package className="w-4 h-4" />
                Send Proposal
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
