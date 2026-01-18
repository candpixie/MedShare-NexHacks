import { LifeBuoy } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { toast } from 'sonner';

interface SupportChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

export function SupportChatbot({ isOpen, onClose }: SupportChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your MedShare assistant. How can I help you today?",
      isBot: true,
      timestamp: new Date(),
    },
    {
      id: '2',
      text: "Here are some things I can help with:\n• Uploading and parsing inventory data\n• Understanding expiration alerts\n• Generating and downloading reports\n• Managing FIFO compliance\n• Switching between hospital locations",
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    const typingMessage: Message = {
    id: 'typing',
    text: 'typing...',
    isBot: true,
    timestamp: new Date(),
  };
  setMessages((prev) => [...prev, typingMessage]);

  //   // Simulate bot response
  //   setTimeout(() => {
  //     const botResponse: Message = {
  //       id: (Date.now() + 1).toString(),
  //       text: "Thanks for your message! This is a demo chatbot. In production, I would be powered by AI to answer your questions about MedShare.",
  //       isBot: true,
  //       timestamp: new Date(),
  //     };
  //     setMessages((prev) => [...prev, botResponse]);
  //   }, 800);

  //   toast.info('Chat feature', { 
  //     description: 'This is a demo chatbot interface.' 
  //   });
  // };

    try {
      const res = await fetch('http://localhost:3000/news/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: inputValue }),
      });

      const data = await res.json();
      console.log(data)

      // Remove typing indicator
      setMessages((prev) => prev.filter((m) => m.id !== 'typing'));

      // Add Gemini response
      const botResponse: Message = {
        id: Date.now().toString(),
        text: data.text || 'Sorry, I could not get a response.',
        isBot: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      console.error(error);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === 'typing' ? { ...m, text: 'Error fetching response.' } : m
        )
      );
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed bottom-6 right-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-slate-700/40 shadow-2xl w-96 z-50"
      initial={{ scale: 0, opacity: 0, y: 100 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0, opacity: 0, y: 100 }}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center" 
            style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)' }}
          >
            <LifeBuoy className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              MedShare Support
            </h4>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Online • Typically replies instantly
            </p>
          </div>
        </div>
        <motion.button
          onClick={onClose}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <span className="text-xl" style={{ color: 'var(--text-muted)' }}>×</span>
        </motion.button>
      </div>

      {/* Messages */}
      <div className="p-4 h-96 overflow-y-auto space-y-3">
        {messages.map((message) => (
          <div key={message.id} className="flex items-start gap-2">
            {message.isBot && (
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" 
                style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)' }}
              >
                <LifeBuoy className="w-3 h-3 text-white" />
              </div>
            )}
            <div 
              className={`flex-1 p-3 rounded-xl ${
                message.isBot 
                  ? 'bg-violet-50 dark:bg-violet-900/20' 
                  : 'bg-sky-50 dark:bg-sky-900/20 ml-8'
              }`}
            >
              <p 
                className="text-sm whitespace-pre-line" 
                style={{ color: 'var(--text-primary)' }}
              >
                {message.text}
              </p>
            </div>
            {!message.isBot && (
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-sky-500"
              >
                <span className="text-white text-xs font-medium">U</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Type your message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 px-4 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 bg-white/70 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 dark:text-slate-100"
            style={{ color: 'var(--text-primary)' }}
          />
          <motion.button
            className="px-4 py-2 rounded-xl font-medium text-sm text-white"
            style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSendMessage}
          >
            Send
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
