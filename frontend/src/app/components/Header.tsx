import { Bell, ChevronDown, Moon, Sun, Upload } from 'lucide-react';
import { motion } from 'motion/react';
import { SidebarTrigger } from '@/app/components/ui/sidebar';

interface HeaderProps {
  onToggleTheme: () => void;
  isDark: boolean;
  onUpload: () => void;
  onNotifications: () => void;
  onHospitalSelect: () => void;
  showSidebarTrigger?: boolean;
}

export function Header({
  onToggleTheme,
  isDark,
  onUpload,
  onNotifications,
  onHospitalSelect,
  showSidebarTrigger = false,
}: HeaderProps) {
  return (
    <header className="relative h-18 overflow-hidden border-b border-white/20">
      {/* Refined gradient background */}
      <div 
        className="absolute inset-0 opacity-100"
        style={{
          background: 'linear-gradient(110deg, #0F172A 0%, #1E3A5F 50%, #0284C7 100%)',
        }}
      >
        {/* Subtler aurora blobs */}
        <motion.div
          className="absolute top-0 right-1/4 w-96 h-96 rounded-full opacity-[0.08] blur-3xl"
          style={{ background: '#06B6D4' }}
          animate={{
            x: [0, 20, 0],
            y: [0, -15, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-0 right-1/2 w-80 h-80 rounded-full opacity-[0.06] blur-3xl"
          style={{ background: '#7C3AED' }}
          animate={{
            x: [0, -30, 0],
            y: [0, 20, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Status strip */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-emerald-400/40 via-cyan-400/40 to-emerald-400/40" />

      {/* Content */}
      <div className="relative h-full px-6 flex items-center justify-between">
        {/* Logo */}
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {showSidebarTrigger && (
            <SidebarTrigger className="text-white hover:bg-white/10" />
          )}
          <div className="w-11 h-11 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/15">
            <img src="/medshare-logo.svg" alt="MedShare" className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white tracking-tight">MedShare</h1>
            <p className="text-[10px] text-cyan-200/70 tracking-wide">PHARMACY ANALYTICS</p>
          </div>
        </motion.div>

        {/* Right side - Notifications and Hospital Selector */}
        <div className="flex items-center gap-3">
          <motion.button
            onClick={onUpload}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-md hover:bg-white/15 rounded-xl transition-all duration-200 border border-white/15 shadow-lg text-white text-sm font-medium"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <Upload className="w-4 h-4" />
            Upload Data
          </motion.button>
          <motion.button
            onClick={onToggleTheme}
            className="relative p-2.5 hover:bg-white/10 rounded-xl transition-all duration-200"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun className="w-5 h-5 text-white" /> : <Moon className="w-5 h-5 text-white" />}
          </motion.button>
          {/* Notification Bell with pulse */}
          <motion.button 
            onClick={onNotifications}
            className="relative p-2.5 hover:bg-white/10 rounded-xl transition-all duration-200"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Bell className="w-5 h-5 text-white" />
            <motion.span 
              className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-400 rounded-full"
              animate={{
                scale: [1, 1.15, 1],
                opacity: [1, 0.85, 1]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.button>

          {/* Glass Hospital Selector */}
          <motion.button 
            onClick={onHospitalSelect}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-md hover:bg-white/15 rounded-xl transition-all duration-200 border border-white/15 shadow-lg"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <span className="text-sm text-white font-medium">Metro General Hospital</span>
            <ChevronDown className="w-4 h-4 text-white/70" />
          </motion.button>
        </div>
      </div>
    </header>
  );
}
