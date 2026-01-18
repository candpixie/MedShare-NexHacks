import { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CheckCircle, XCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import type { DrugLabelData } from '@/config/livekit';
import { recognizeDrugLabel, testOpenFDAConnection } from '@/services/drugRecognition';

interface LiveKitWebcamProps {
  onClose: () => void;
  onDataDetected?: (data: DrugLabelData) => void;
}

export function LiveKitWebcam({ onClose, onDataDetected }: LiveKitWebcamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  
  const [isActive, setIsActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedData, setDetectedData] = useState<DrugLabelData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'starting' | 'active' | 'error'>('idle');
  const [ocrProgress, setOcrProgress] = useState<string>('');
  const [fdaConnected, setFdaConnected] = useState<boolean>(true);

  // Start webcam
  const startCamera = useCallback(async () => {
    try {
      setCameraStatus('starting');
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment',
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        await videoRef.current.play();
        setIsActive(true);
        setCameraStatus('active');
        toast.success('Camera activated', {
          description: 'Position drug label in frame for scanning',
        });
        
        // Start processing frames
        startProcessing();
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setCameraStatus('error');
      setError('Failed to access camera. Please check permissions.');
      toast.error('Camera Error', {
        description: 'Unable to access your camera. Please check permissions.',
      });
    }
  }, []);

  // Stop webcam
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsActive(false);
    setCameraStatus('idle');
  }, []);

  // Capture and process frame with REAL OCR and OpenFDA API
  const processFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data for processing
    const imageData = canvas.toDataURL('image/jpeg', 0.8);

    setIsProcessing(true);
    setOcrProgress('Analyzing image...');
    
    try {
      // REAL PROCESSING using OCR and OpenFDA API
      setOcrProgress('Extracting text with OCR...');
      const drugData = await recognizeDrugLabel(imageData);
      
      setOcrProgress('Validating with FDA database...');
      
      // Update detected data
      setDetectedData(drugData);
      onDataDetected?.(drugData);
      
      // Show success notification
      toast.success('Drug label detected!', {
        description: `Found: ${drugData.drugName || 'Unknown'} (${Math.round((drugData.confidence || 0) * 100)}% confidence)`,
      });
      
      setOcrProgress('');
    } catch (error) {
      console.error('Drug recognition error:', error);
      setOcrProgress('');
      
      toast.error('Recognition failed', {
        description: 'Could not read drug label. Please ensure good lighting and clear focus.',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, onDataDetected]);

  // Start continuous processing
  const startProcessing = useCallback(() => {
    if (intervalRef.current) return;
    
    // Process frame every 3 seconds
    intervalRef.current = window.setInterval(() => {
      processFrame();
    }, 3000);
  }, [processFrame]);

  // Capture single frame
  const captureFrame = useCallback(() => {
    if (!isProcessing) {
      processFrame();
    }
  }, [processFrame, isProcessing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Test FDA API connection on mount
  useEffect(() => {
    testOpenFDAConnection().then((connected) => {
      setFdaConnected(connected);
      if (!connected) {
        console.warn('OpenFDA API is not accessible');
        toast.warning('Limited functionality', {
          description: 'FDA database unavailable. OCR will still work.',
        });
      }
    });
  }, []);

  return (
    <motion.div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-slate-700/40 p-6 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)' }}>
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                LiveKit AI Drug Label Scanner
              </h3>
              <p className="text-sm flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                <Sparkles className="w-3 h-3" />
                Real OCR + OpenFDA API {fdaConnected ? '✓' : '(OCR only)'}
              </p>
            </div>
          </div>
          <motion.button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <span className="text-2xl" style={{ color: 'var(--text-muted)' }}>×</span>
          </motion.button>
        </div>

        {/* Camera Feed */}
        <div className="relative bg-slate-900 rounded-xl overflow-hidden mb-6" style={{ aspectRatio: '16/9' }}>
          {/* Video Element */}
          <video
            ref={videoRef}
            className={`w-full h-full object-cover ${!isActive ? 'hidden' : ''}`}
            playsInline
            muted
          />
          
          {/* Hidden canvas for processing */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Placeholder when camera is off */}
          {!isActive && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Camera className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                <p className="text-white/80 text-sm mb-2">Camera Ready</p>
                <p className="text-white/60 text-xs">Click "Start Camera" to begin scanning</p>
              </div>
            </div>
          )}

          {/* Scanning Frame Overlay */}
          {isActive && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                className="border-4 border-violet-500 rounded-lg"
                style={{ width: '60%', height: '60%' }}
                animate={{
                  borderColor: isProcessing 
                    ? ['rgba(124, 58, 237, 1)', 'rgba(168, 139, 250, 1)', 'rgba(124, 58, 237, 1)']
                    : ['rgba(124, 58, 237, 0.5)', 'rgba(124, 58, 237, 1)', 'rgba(124, 58, 237, 0.5)'],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-violet-400" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-violet-400" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-violet-400" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-violet-400" />
              </motion.div>
            </div>
          )}

          {/* Scanning Line Animation */}
          {isActive && isProcessing && (
            <motion.div
              className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-violet-400 to-transparent"
              animate={{
                top: ['20%', '80%', '20%'],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}

          {/* Status Badge */}
          <div className="absolute top-4 left-4">
            <motion.div
              className="flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-md"
              style={{
                backgroundColor: cameraStatus === 'active' 
                  ? 'rgba(16, 185, 129, 0.8)' 
                  : cameraStatus === 'error' 
                  ? 'rgba(239, 68, 68, 0.8)'
                  : 'rgba(100, 116, 139, 0.8)',
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {cameraStatus === 'active' && <CheckCircle className="w-4 h-4 text-white" />}
              {cameraStatus === 'starting' && <Loader2 className="w-4 h-4 text-white animate-spin" />}
              {cameraStatus === 'error' && <XCircle className="w-4 h-4 text-white" />}
              {cameraStatus === 'idle' && <AlertCircle className="w-4 h-4 text-white" />}
              <span className="text-xs font-medium text-white capitalize">{cameraStatus}</span>
            </motion.div>
          </div>

          {/* Processing Indicator */}
          <AnimatePresence>
            {isProcessing && (
              <motion.div
                className="absolute top-4 right-4 flex flex-col items-end gap-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-md"
                  style={{ backgroundColor: 'rgba(124, 58, 237, 0.8)' }}>
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                  <span className="text-xs font-medium text-white">Processing...</span>
                </div>
                {ocrProgress && (
                  <div className="px-3 py-1.5 rounded-lg backdrop-blur-md text-xs text-white"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
                    {ocrProgress}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-sm font-medium text-red-900 dark:text-red-200">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Instructions */}
        <div className="bg-violet-50/50 dark:bg-violet-900/10 rounded-xl p-4 mb-6">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Sparkles className="w-4 h-4" />
            How it works (REAL AI):
          </h4>
          <ul className="space-y-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            <li>• Click "Start Camera" and allow camera access when prompted</li>
            <li>• Position the drug label clearly within the scanning frame</li>
            <li>• <strong>Real OCR</strong> (Tesseract.js) extracts text from the label</li>
            <li>• <strong>OpenFDA API</strong> validates and enriches drug information</li>
            <li>• Click "Capture & Scan" to manually trigger or wait for auto-scan</li>
            <li>• Detected information will be automatically added to your inventory</li>
          </ul>
        </div>

        {/* Detected Info Card */}
        <AnimatePresence>
          {detectedData && (
            <motion.div
              className="bg-white/70 dark:bg-slate-800/70 rounded-xl p-4 mb-4 border border-green-200 dark:border-green-800"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Detected Information
                </h4>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-mint)' }}>
                    {detectedData.confidence ? `${Math.round(detectedData.confidence * 100)}% confidence` : 'Recognized'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {detectedData.drugName && (
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Drug Name</p>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{detectedData.drugName}</p>
                  </div>
                )}
                {detectedData.ndcCode && (
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>NDC Code</p>
                    <p className="font-medium font-mono" style={{ color: 'var(--text-primary)' }}>{detectedData.ndcCode}</p>
                  </div>
                )}
                {detectedData.lotNumber && (
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Lot Number</p>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{detectedData.lotNumber}</p>
                  </div>
                )}
                {detectedData.expiryDate && (
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Expiry Date</p>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{detectedData.expiryDate}</p>
                  </div>
                )}
                {detectedData.manufacturer && (
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Manufacturer</p>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{detectedData.manufacturer}</p>
                  </div>
                )}
                {detectedData.dosage && (
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Dosage</p>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{detectedData.dosage}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!isActive ? (
            <motion.button
              className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm text-white shadow-lg"
              style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)' }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={startCamera}
              disabled={cameraStatus === 'starting'}
            >
              <div className="flex items-center justify-center gap-2">
                {cameraStatus === 'starting' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
                {cameraStatus === 'starting' ? 'Starting Camera...' : 'Start Camera'}
              </div>
            </motion.button>
          ) : (
            <>
              <motion.button
                className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm text-white shadow-lg"
                style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)' }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={captureFrame}
                disabled={isProcessing}
              >
                <div className="flex items-center justify-center gap-2">
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                  {isProcessing ? 'Scanning...' : 'Capture & Scan'}
                </div>
              </motion.button>
              <motion.button
                className="px-6 py-3 rounded-xl font-medium text-sm border"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                  color: '#EF4444',
                }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={stopCamera}
              >
                Stop Camera
              </motion.button>
            </>
          )}
          <motion.button
            className="px-6 py-3 rounded-xl font-medium text-sm border"
            style={{
              backgroundColor: 'rgba(100, 116, 139, 0.1)',
              borderColor: 'rgba(100, 116, 139, 0.2)',
              color: 'var(--text-primary)',
            }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={onClose}
          >
            Close
          </motion.button>
        </div>

        {/* Tech Info */}
        <div className="mt-4 text-center text-xs flex items-center justify-center gap-2" style={{ color: 'var(--text-muted)' }}>
          <Sparkles className="w-3 h-3" />
          Powered by LiveKit • Tesseract.js OCR • OpenFDA API • Real AI Drug Recognition
        </div>
      </motion.div>
    </motion.div>
  );
}
