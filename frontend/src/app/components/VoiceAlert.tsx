import { Volume2, Play, Pause, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { voiceAlertService, VoiceAlerts } from '@/services/voiceAlerts';

interface VoiceAlertProps {
  medications?: Array<{
    drugName: string;
    quantity: number;
    expDays: number;
    value: number;
  }>;
}

export function VoiceAlert({ medications = [] }: VoiceAlertProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(-1);
  const [allWords, setAllWords] = useState<string[]>([]);

  // Get the first medication with alerts or use default
  const alertMed = medications[0] || {
    drugName: 'Propofol 200mg',
    quantity: 27,
    expDays: 21,
    value: 1620
  };

  const generateAlertMessage = () => {
    return `Alert: ${alertMed.quantity} units of ${alertMed.drugName} expiring in ${alertMed.expDays} days. Excess inventory valued at ${alertMed.value} dollars. Urgent action required. Consider transfer or use immediately to prevent waste.`;
  };

  const handlePlayAlert = async () => {
    if (isPlaying) {
      // Stop alert
      voiceAlertService.stop();
      setIsPlaying(false);
      setCurrentWordIndex(-1);
      setAllWords([]);
      return;
    }

    setIsPlaying(true);
    
    // Create voice alert configuration
    const alertConfig = VoiceAlerts.medicationExpiring(
      alertMed.drugName,
      alertMed.expDays
    );

    // Enhanced message with more details
    alertConfig.message = `Alert: ${alertMed.quantity} units of ${alertMed.drugName} expiring in ${alertMed.expDays} days. Excess inventory valued at ${alertMed.value} dollars. Urgent action required. Consider transfer or use immediately to prevent waste.`;
    
    // Split message into words
    const words = alertConfig.message.split(' ');
    setAllWords(words);
    setCurrentWordIndex(0);
    
    // Calculate timing based on speech rate (critical = 0.9 rate)
    const speechRate = 0.9; // From the voice service config for critical alerts
    const averageWordDuration = 60000 / (150 * speechRate); // Average 150 words per minute
    
    // Animate words to sync with speech
    let wordIndex = 0;
    const wordInterval = setInterval(() => {
      if (wordIndex < words.length) {
        setCurrentWordIndex(wordIndex);
        wordIndex++;
      } else {
        clearInterval(wordInterval);
      }
    }, averageWordDuration);
    
    // Play voice alert using LiveKit-enhanced service
    await voiceAlertService.speak(alertConfig);
    
    // Cleanup after speaking completes
    setTimeout(() => {
      setIsPlaying(false);
      setCurrentWordIndex(-1);
      setAllWords([]);
      clearInterval(wordInterval);
    }, words.length * averageWordDuration + 1000);
  };

  useEffect(() => {
    // Initialize voice alert service
    voiceAlertService.initialize();
    
    return () => {
      voiceAlertService.stop();
    };
  }, []);

  return (
    <motion.div 
      className="backdrop-blur-md rounded-2xl p-5 border relative overflow-hidden bg-white/80 dark:bg-slate-800/90 border-white/60 dark:border-slate-700/60"
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
        <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Sparkles className="w-4 h-4" />
          LiveKit Voice Alerts
        </h3>
      </div>
      
      <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
        Real-time voice alerts powered by LiveKit with priority-based speech synthesis for expiring {alertMed.drugName}.
      </p>
      
      {/* Live Transcript Display */}
      {isPlaying && allWords.length > 0 && (
        <motion.div
          className="mb-4 p-4 rounded-xl border backdrop-blur-sm min-h-[80px] flex items-center overflow-hidden"
          style={{ 
            backgroundColor: 'rgba(139, 92, 246, 0.08)',
            borderColor: 'rgba(139, 92, 246, 0.2)'
          }}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <div className="text-sm font-medium leading-relaxed w-full" style={{ color: 'var(--text-primary)' }}>
            {allWords.map((word, index) => {
              // Show only a rolling window of words (previous 5, current, next 2)
              const isVisible = index >= Math.max(0, currentWordIndex - 5) && index <= currentWordIndex + 2;
              const isCurrent = index === currentWordIndex;
              const isPast = index < currentWordIndex;
              
              if (!isVisible) return null;
              
              return (
                <motion.span
                  key={`word-${index}`}
                  className="inline-block mr-2"
                  style={{
                    fontWeight: isCurrent ? 700 : isPast ? 500 : 400,
                    color: isCurrent 
                      ? 'var(--aurora-violet)' 
                      : isPast 
                        ? 'var(--text-muted)'
                        : 'var(--text-primary)',
                    opacity: isCurrent ? 1 : isPast ? 0.6 : 0.4,
                  }}
                  initial={isCurrent ? { scale: 0.95, opacity: 0.5 } : {}}
                  animate={isCurrent ? { scale: 1, opacity: 1 } : {}}
                  transition={{ duration: 0.2 }}
                >
                  {word}
                  {isCurrent && (
                    <motion.span
                      className="inline-block ml-0.5"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                    >
                      |
                    </motion.span>
                  )}
                </motion.span>
              );
            })}
          </div>
        </motion.div>
      )}
      
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
        style={{ backgroundColor: 'rgba(14, 165, 233, 0.08)', borderColor: 'rgba(14, 165, 233, 0.2)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-xs font-medium mb-1" style={{ color: 'var(--med-blue)' }}>
          Alert Preview:
        </p>
        <p className="text-xs italic leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          "{generateAlertMessage().substring(0, 120)}..."
        </p>
      </motion.div>
    </motion.div>
  );
}
