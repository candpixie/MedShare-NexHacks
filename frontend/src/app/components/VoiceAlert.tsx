import { Volume2, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';

export function VoiceAlert() {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayAlert = () => {
    setIsPlaying(!isPlaying);
    
    if (!isPlaying) {
      const utterance = new SpeechSynthesisUtterance(
        "Alert: 27 vials of Propofol 200mg expiring in 21 days. Excess inventory valued at 1,620 dollars. St. Mary's Medical Center, 12 miles away, needs 30 vials. Match available for immediate transfer."
      );
      utterance.rate = 0.9;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
      
      utterance.onend = () => {
        setIsPlaying(false);
      };
      
      setTimeout(() => {
        setIsPlaying(false);
      }, 15000);
    } else {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <motion.div 
      className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-white/60 relative overflow-hidden"
      style={{
        boxShadow: '0 8px 30px rgba(2, 6, 23, 0.08)'
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      {/* Aurora accent */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-8 blur-3xl pointer-events-none"
           style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #22D3EE 100%)' }} />

      <div className="relative flex items-center gap-3 mb-3">
        <motion.div
          className="w-10 h-10 rounded-[12px] flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)' }}
          whileHover={{ scale: 1.05 }}
        >
          <Volume2 className="w-5 h-5 text-white" />
        </motion.div>
        <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
          Voice Alert Demo
        </h3>
      </div>
      
      <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
        Listen to an automated voice alert for expiring inventory and available matches.
      </p>
      
      {/* Pill button with waveform animation */}
      <motion.button 
        onClick={handlePlayAlert}
        className="w-full px-5 py-3 rounded-full text-white font-medium text-sm flex items-center justify-center gap-3 relative overflow-hidden"
        style={{
          background: isPlaying 
            ? 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)'
            : 'linear-gradient(135deg, #0EA5E9 0%, #22D3EE 100%)'
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <AnimatePresence mode="wait">
          {isPlaying ? (
            <motion.div
              key="pause"
              className="flex items-center gap-3"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Pause className="w-4 h-4" />
              <span>Stop Alert</span>
              {/* Waveform animation */}
              <div className="flex items-center gap-0.5">
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    className="w-0.5 bg-white/70 rounded-full"
                    animate={{
                      height: ['8px', '16px', '8px'],
                    }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.15,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="play"
              className="flex items-center gap-2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Play className="w-4 h-4" />
              <span>Play Voice Alert</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
      
      <motion.div 
        className="mt-4 p-3 rounded-xl border backdrop-blur-sm"
        style={{ backgroundColor: 'var(--soft-ice)', borderColor: 'rgba(14, 165, 233, 0.2)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
          "Alert: 27 vials of Propofol 200mg expiring in 21 days. Excess inventory valued at $1,620. St. Mary's Medical Center, 12 miles away, needs 30 vials..."
        </p>
      </motion.div>
    </motion.div>
  );
}
