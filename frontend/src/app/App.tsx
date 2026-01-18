import { useMemo, useRef, useState, useCallback} from 'react';
import { motion } from 'motion/react';
import { Header } from '@/app/components/Header';
import { StatCard } from '@/app/components/StatCard';
import { InventoryView } from '@/app/components/InventoryView';
import { ReportsView } from '@/app/components/ReportsView';
import { SettingsView } from '@/app/components/SettingsView';
import { VoiceAlert } from '@/app/components/VoiceAlert';
import { SupportChatbot } from '@/app/components/SupportChatbot';
import Webcam from 'react-webcam'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/app/components/ui/chart';
import { Skeleton } from '@/app/components/ui/skeleton';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/app/components/ui/sidebar';
import { Toaster, toast } from 'sonner';
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import {
  Activity,
  AlertTriangle,
  Camera,
  ClipboardList,
  DollarSign,
  FileUp,
  Hospital,
  LayoutDashboard,
  LifeBuoy,
  Settings,
} from 'lucide-react';

type ViewState = 'landing' | 'login' | 'dashboard';

type MedicationLot = {
  lotNumber: string;
  quantity: number;
  expDate: string;
  unitCost: number;
};

type Medication = {
  ndcCode: string;
  drugName: string;
  formType: string;
  totalQuantity: number;
  parLevel: number;
  avgDailyUsage: number;
  lots: MedicationLot[];
  alerts: {
    expiringSoon: boolean;
    fifoRisk: boolean;
    belowPar: boolean;
  };
};

const defaultMedications: Medication[] = [
  {
    ndcCode: '00409-4676-01',
    drugName: 'Propofol 200mg/20mL',
    formType: 'vial',
    totalQuantity: 70,
    parLevel: 20,
    avgDailyUsage: 2.5,
    lots: [
      { lotNumber: 'LOT2024A001', quantity: 45, expDate: '2026-02-07', unitCost: 60 },
      { lotNumber: 'LOT2024B002', quantity: 25, expDate: '2026-03-15', unitCost: 62 },
    ],
    alerts: {
      expiringSoon: true,
      fifoRisk: false,
      belowPar: false,
    },
  },
  {
    ndcCode: '00409-1105-01',
    drugName: 'Atropine 0.4mg/mL',
    formType: 'vial',
    totalQuantity: 30,
    parLevel: 10,
    avgDailyUsage: 1.2,
    lots: [{ lotNumber: 'LOT2024A002', quantity: 30, expDate: '2026-01-31', unitCost: 20 }],
    alerts: {
      expiringSoon: true,
      fifoRisk: true,
      belowPar: false,
    },
  },
  {
    ndcCode: '00409-6629-01',
    drugName: 'Succinylcholine 20mg/mL',
    formType: 'vial',
    totalQuantity: 40,
    parLevel: 15,
    avgDailyUsage: 1.8,
    lots: [{ lotNumber: 'LOT2024C001', quantity: 40, expDate: '2026-02-21', unitCost: 30 }],
    alerts: {
      expiringSoon: true,
      fifoRisk: false,
      belowPar: false,
    },
  },
];

const usageTrend = [
  { week: 'W1', usage: 18 },
  { week: 'W2', usage: 22 },
  { week: 'W3', usage: 19 },
  { week: 'W4', usage: 25 },
  { week: 'W5', usage: 20 },
  { week: 'W6', usage: 18 },
  { week: 'W7', usage: 15 },
  { week: 'W8', usage: 22 },
];

const usageByDepartment = [
  { department: 'OR Suite', value: 67 },
  { department: 'ICU', value: 22 },
  { department: 'ER', value: 11 },
];

const aiInsights = [
  'Reduce Propofol order by 15% based on low turnover.',
  'Ephedrine usage is trending up; increase par level by 10%.',
  '3 FIFO violations detected in the last 7 days.',
];

const hospitals = [
  { id: 'metro-general', name: 'Metro General Hospital', type: 'Urban', distance: '—', location: 'Downtown', isCurrent: true },
  { id: 'st-marys', name: "St. Mary's Medical Center", type: 'Suburban', distance: '12 miles', location: 'Bronx area', isCurrent: false },
  { id: 'county-medical', name: 'County Medical Center', type: 'Rural', distance: '25 miles', location: 'Suffern, NY', isCurrent: false },
];

const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'inventory', label: 'Inventory', icon: ClipboardList },
  { key: 'reports', label: 'Reports', icon: FileUp },
  { key: 'settings', label: 'Settings', icon: Settings },
];

const getDaysUntil = (dateString: string) => {
  const target = new Date(dateString);
  const today = new Date();
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const exportExpirationAlertsToCSV = (medications: Medication[]) => {
  // Filter medications with expiration alerts
  const expiringMeds = medications.filter(med => med.alerts.expiringSoon);
  
  // Create CSV header
  const headers = ['Drug Name', 'NDC Code', 'Lot Number', 'Quantity', 'Expiration Date', 'Days Until Expiry', 'Unit Cost', 'Total Value', 'FIFO Risk'];
  
  // Create CSV rows
  const rows = expiringMeds.flatMap(med => 
    med.lots
      .filter(lot => getDaysUntil(lot.expDate) <= 30)
      .map(lot => [
        med.drugName,
        med.ndcCode,
        lot.lotNumber,
        lot.quantity,
        lot.expDate,
        getDaysUntil(lot.expDate),
        lot.unitCost,
        lot.quantity * lot.unitCost,
        med.alerts.fifoRisk ? 'Yes' : 'No'
      ])
  );
  
  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `expiration-alerts-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const computeAlerts = (medication: Medication) => {
  const sortedLots = [...medication.lots].sort(
    (a, b) => new Date(a.expDate).getTime() - new Date(b.expDate).getTime(),
  );
  const expiringSoon = sortedLots.some((lot) => getDaysUntil(lot.expDate) <= 30);
  const fifoRisk = sortedLots.length > 1 && sortedLots[0].quantity < sortedLots[1].quantity;
  const belowPar = medication.totalQuantity < medication.parLevel;
  return { expiringSoon, fifoRisk, belowPar };
};

export default function App() {
  const [view, setView] = useState<ViewState>('landing');
  const [activeNav, setActiveNav] = useState('dashboard');
  const [medications, setMedications] = useState<Medication[]>(defaultMedications);
  const [isParsing, setIsParsing] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [showHospitalSelector, setShowHospitalSelector] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState('Metro General Hospital');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [aiInsightsData, setAiInsightsData] = useState<{ news: string; stats: string } | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [expandedInsights, setExpandedInsights] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const webcamRef = useRef<Webcam>(null);

  const stats = useMemo(() => {
    const totalItems = medications.length;
    const expiringSoon = medications.filter((med) => med.alerts.expiringSoon).length;
    const fifoAlerts = medications.filter((med) => med.alerts.fifoRisk).length;
    const atRiskValue = medications.reduce((total, med) => {
      const expiringLots = med.lots.filter((lot) => getDaysUntil(lot.expDate) <= 30);
      const lotValue = expiringLots.reduce((sum, lot) => sum + lot.quantity * lot.unitCost, 0);
      return total + lotValue;
    }, 0);

    return {
      totalItems,
      expiringSoon,
      fifoAlerts,
      atRiskValue,
    };
  }, [medications]);

  const forecast = useMemo(() => {
    const primaryMedication = medications[0];
    if (!primaryMedication) {
      return null;
    }
    const predicted30DayUsage = Math.round(primaryMedication.avgDailyUsage * 30);
    const excessAtRisk = Math.max(primaryMedication.totalQuantity - predicted30DayUsage, 0);
    return {
      drugName: primaryMedication.drugName,
      predicted30DayUsage,
      confidence: 0.85,
      excessAtRisk,
    };
  }, [medications]);






  const handleToggleTheme = () => setIsDark((prev) => !prev);

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsParsing(true);

    try {
      const text = await file.text();
      const lines = text.trim().split(/\r?\n/);
      if (lines.length < 2) {
        throw new Error('CSV has no data rows.');
      }

      const header = lines[0].split(',').map((value) => value.trim());
      const indexes = {
        ndc: header.indexOf('ndc_code'),
        drug: header.indexOf('drug_name'),
        form: header.indexOf('form_type'),
        quantity: header.indexOf('quantity'),
        lot: header.indexOf('lot_number'),
        exp: header.indexOf('expiration_date'),
        cost: header.indexOf('unit_cost'),
        par: header.indexOf('par_level'),
        usage: header.indexOf('daily_usage'),
      };

      if (Object.values(indexes).some((idx) => idx === -1)) {
        throw new Error('CSV columns do not match the expected template.');
      }

      const grouped = new Map<string, Medication>();

      lines.slice(1).forEach((row) => {
        if (!row.trim()) {
          return;
        }
        const columns = row.split(',').map((value) => value.trim());
        const ndcCode = columns[indexes.ndc];
        const drugName = columns[indexes.drug];
        const formType = columns[indexes.form];
        const quantity = Number(columns[indexes.quantity]) || 0;
        const lotNumber = columns[indexes.lot];
        const expDate = columns[indexes.exp];
        const unitCost = Number(columns[indexes.cost]) || 0;
        const parLevel = Number(columns[indexes.par]) || 0;
        const avgDailyUsage = Number(columns[indexes.usage]) || 0;

        const key = `${ndcCode}-${drugName}`;
        const existing = grouped.get(key);
        const lot: MedicationLot = { lotNumber, quantity, expDate, unitCost };

        if (existing) {
          existing.totalQuantity += quantity;
          existing.lots.push(lot);
        } else {
          grouped.set(key, {
            ndcCode,
            drugName,
            formType,
            totalQuantity: quantity,
            parLevel,
            avgDailyUsage,
            lots: [lot],
            alerts: {
              expiringSoon: false,
              fifoRisk: false,
              belowPar: false,
            },
          });
        }
      });

      const parsed = Array.from(grouped.values()).map((med) => ({
        ...med,
        alerts: computeAlerts(med),
      }));

      if (!parsed.length) {
        throw new Error('No valid rows found.');
      }

      setMedications(parsed);
      toast.success('Inventory uploaded', {
        description: `Parsed ${parsed.length} medications from ${file.name}.`,
      });
    } catch (error) {
      toast.error('Upload failed', {
        description: error instanceof Error ? error.message : 'Unable to parse CSV file.',
      });
    } finally {
      setIsParsing(false);
      event.target.value = '';
    }
  };

  const handleLogin = (method: 'email' | 'google') => {
    toast.success('Welcome to MedShare', {
      description:
        method === 'email'
          ? 'Signed in with email credentials.'
          : 'Signed in with Google workspace.',
    });
    setView('dashboard');
  };

  const handleRunForecast = () => {
    toast.message('Forecast running', {
      description: 'Gemini is generating a 30-day demand forecast.',
    });
  };

  const handleGenerateInsights = async () => {
    setIsLoadingInsights(true);
    setExpandedInsights(false);

    try {
      // Fetch health news analysis
      const newsResponse = await fetch('http://localhost:3000/news/health-inventory-analysis', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!newsResponse.ok) {
        throw new Error('Failed to fetch health news');
      }

      const newsData = await newsResponse.json();
      const newsInsights = newsData.analysis || 'No news analysis available';

      // Fetch generate insights
      const statsResponse = await fetch('http://localhost:3000/news/generate-insights', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!statsResponse.ok) {
        throw new Error('Failed to generate insights');
      }

      const statsData = await statsResponse.json();
      const statsInsights = statsData.insights || 'No insights generated';

      // Merge results
      setAiInsightsData({
        news: newsInsights,
        stats: statsInsights,
      });

      setExpandedInsights(true);
      toast.success('Insights generated', {
        description: 'AI recommendations loaded. Click to expand.',
      });
    } catch (error) {
      console.error('Error generating insights:', error);
      toast.error('Failed to generate insights', {
        description: error instanceof Error ? error.message : 'Unable to fetch AI recommendations.',
      });
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const handleMarkReviewed = (drugName: string) => {
    toast.success('Alert reviewed', {
      description: `${drugName} marked as reviewed by pharmacy lead.`,
    });
  };

  const handleViewFifo = (drugName: string) => {
    toast('FIFO detail opened', {
      description: `Showing FIFO compliance detail for ${drugName}.`,
    });
  };

  const handleHospitalSelect = (hospitalId: string) => {
    const hospital = hospitals.find(h => h.id === hospitalId);
    if (hospital) {
      setSelectedHospital(hospital.name);
      setShowHospitalSelector(false);
      toast.success('Hospital switched', {
        description: `Now viewing ${hospital.name}`,
      });
    }
  };

  const handleCapturePicture = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setCapturedImage(imageSrc);
        toast.success('Photo captured', {
          description: 'Image captured successfully. Ready to process.',
        });
      }
    }
  };

  const handleRetakePicture = () => {
    setCapturedImage(null);
  };

  const handleCloseWebcam = () => {
    setShowWebcam(false);
    setCapturedImage(null);
  };

  const extractBase64 = (dataUrl: string) => {
  return dataUrl.split(',')[1]; // removes "data:image/jpeg;base64,"
};


  // const handleUploadCapturedImage = async () => {
  //   if (!capturedImage) return;

  //   setIsUploadingImage(true);
  //   console.log(capturedImage)

  //   try {
  //     const response = await fetch('http://localhost:3000/news/image', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         image: capturedImage,
  //         timestamp: new Date().toISOString(),
  //       }),
  //     });

  //     if (!response.ok) {
  //       throw new Error('Failed to upload image');
  //     }

  //     const data = await response.json();
      
  //     toast.success('Image uploaded successfully', {
  //       description: `Image sent to backend for processing. ID: ${data.id || 'pending'}`,
  //     });
      
  //     handleCloseWebcam();
  //   } catch (error) {
  //     toast.error('Upload failed', {
  //       description: error instanceof Error ? error.message : 'Failed to send image to backend.',
  //     });
  //   } finally {
  //     setIsUploadingImage(false);
  //   }
  // };

  const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
  const res = await fetch(dataUrl);
  return await res.blob();
};

const handleUploadCapturedImage = async () => {
  if (!capturedImage) return;

  setIsUploadingImage(true);

  try {
    const imageBlob = await dataUrlToBlob(capturedImage);

    const formData = new FormData();
    formData.append('image', imageBlob, 'label.jpg');

    const response = await fetch('http://localhost:3000/news/image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to upload image');
    }

    const data = await response.json();
    toast.success('Image processed successfully', {
      description: 'Drug label analyzed by AI.',
    });

    handleCloseWebcam();
  } catch (err) {
    console.error('Upload error:', err);
    toast.error('Upload failed', {
      description: err instanceof Error ? err.message : 'Failed to send image to backend.',
    });
  } finally {
    setIsUploadingImage(false);
  }
};

  if (view === 'landing') {
    return (
      <div className={isDark ? 'dark' : ''} style={{ backgroundColor: 'var(--soft-ice)' }}>
        <div className="min-h-screen relative overflow-hidden">
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <motion.div
              className="absolute top-20 left-1/4 w-[500px] h-[500px] rounded-full opacity-[0.03] blur-3xl"
              style={{ background: 'var(--aurora-cyan)' }}
              animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
              transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute top-40 right-1/3 w-[400px] h-[400px] rounded-full opacity-[0.03] blur-3xl"
              style={{ background: 'var(--aurora-violet)' }}
              animate={{ x: [0, -30, 0], y: [0, 30, 0] }}
              transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          <div className="relative max-w-6xl mx-auto px-6 py-16">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/10">
                  <img src="/medshare-logo.svg" alt="MedShare" className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                    MedShare
                  </h1>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Hospital Pharmacy Analytics
                  </p>
                </div>
              </div>
              <motion.button
                className="px-5 py-2.5 rounded-xl font-medium text-sm border"
                style={{
                  backgroundColor: 'rgba(2, 132, 199, 0.08)',
                  borderColor: 'rgba(2, 132, 199, 0.2)',
                  color: 'var(--med-blue)',
                }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setView('login')}
              >
                Sign in
              </motion.button>
            </div>

            <div className="mt-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border"
                     style={{ backgroundColor: 'rgba(2, 132, 199, 0.06)', borderColor: 'rgba(2, 132, 199, 0.15)', color: 'var(--med-blue)' }}>
                  NexHacks 2026
                </div>
                <h2 className="text-5xl font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
                  AI-powered pharmacy analytics
                </h2>
                <p className="text-lg leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Upload your inventory data to get real-time expiration alerts, FIFO compliance tracking, and intelligent demand forecasting.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <motion.button
                    className="px-6 py-3 rounded-xl font-semibold text-sm text-white shadow-lg shadow-sky-500/20"
                    style={{ background: 'linear-gradient(135deg, #0284C7 0%, #06B6D4 100%)' }}
                    whileHover={{ scale: 1.01, boxShadow: '0 20px 40px rgba(6, 182, 212, 0.3)' }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setView('login')}
                  >
                    Get started
                  </motion.button>
                  <motion.button
                    className="px-6 py-3 rounded-xl font-medium text-sm border bg-white/50 backdrop-blur-sm"
                    style={{ borderColor: 'rgba(100, 116, 139, 0.2)', color: 'var(--text-primary)' }}
                    whileHover={{ scale: 1.01, backgroundColor: 'rgba(255, 255, 255, 0.7)' }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setView('dashboard')}
                  >
                    View demo
                  </motion.button>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/40 p-8 shadow-2xl shadow-slate-200/50 dark:bg-slate-900/70 dark:border-slate-700/40">
                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center shadow-lg">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Expiration Alerts
                      </p>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                        Track medications expiring within 30 days
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center shadow-lg">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Waste Reduction
                      </p>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                        AI-powered recommendations to reduce waste
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 text-white flex items-center justify-center shadow-lg">
                      <ClipboardList className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        FIFO Compliance
                      </p>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                        Automated first-in-first-out monitoring
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Toaster richColors position="top-right" theme={isDark ? 'dark' : 'light'} />
        </div>
      </div>
    );
  }

  if (view === 'login') {
    return (
      <div className={isDark ? 'dark' : ''} style={{ backgroundColor: 'var(--soft-ice)' }}>
        <div className="min-h-screen flex items-center justify-center px-6">
          <div className="w-full max-w-md bg-white/70 backdrop-blur-xl rounded-3xl border border-white/40 p-8 shadow-2xl shadow-slate-200/50 dark:bg-slate-900/70 dark:border-slate-700/40">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-11 h-11 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/10">
                <img src="/medshare-logo.svg" alt="MedShare" className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Sign in
                </h2>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Access your hospital dashboard
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-primary)' }}>
                  Work Email
                </label>
                <input
                  type="email"
                  placeholder="pharmacy@hospital.org"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/70 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all dark:bg-slate-900/70 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-400"
                  style={{ color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-primary)' }}>
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/70 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all dark:bg-slate-900/70 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-400"
                  style={{ color: 'var(--text-primary)' }}
                />
              </div>
              <motion.button
                className="w-full px-4 py-3 rounded-xl font-semibold text-sm text-white shadow-lg shadow-sky-500/20"
                style={{ background: 'linear-gradient(135deg, #0284C7 0%, #06B6D4 100%)' }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleLogin('email')}
              >
                Sign in with Email
              </motion.button>
              <motion.button
                className="w-full px-4 py-3 rounded-xl font-medium text-sm border bg-white/50 backdrop-blur-sm"
                style={{ borderColor: 'rgba(100, 116, 139, 0.2)', color: 'var(--text-primary)' }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleLogin('google')}
              >
                Continue with Google Workspace
              </motion.button>
              <motion.button
                className="w-full px-4 py-2 rounded-xl text-xs font-medium"
                style={{ color: 'var(--text-muted)' }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setView('landing')}
              >
                Back to landing page
              </motion.button>
            </div>
          </div>
        </div>
        <Toaster richColors position="top-right" theme={isDark ? 'dark' : 'light'} />
      </div>
    );
  }

  return (
    <SidebarProvider
      className={isDark ? 'dark' : ''}
      style={{ backgroundColor: 'var(--soft-ice)' }}
    >
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-20 left-1/4 w-[500px] h-[500px] rounded-full opacity-[0.03] blur-3xl"
          style={{ background: 'var(--aurora-cyan)' }}
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-40 right-1/3 w-[400px] h-[400px] rounded-full opacity-[0.03] blur-3xl"
          style={{ background: 'var(--aurora-violet)' }}
          animate={{ x: [0, -30, 0], y: [0, 30, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <Sidebar
        variant="inset"
        collapsible="icon"
        className="border-r border-white/30 bg-white/70 backdrop-blur-xl dark:bg-slate-950/80 dark:border-slate-700/40"
      >
        <div className="px-4 pt-5 pb-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/60 border border-white/40 flex items-center justify-center dark:bg-slate-900/70 dark:border-slate-700/40">
            <img src="/medshare-logo.svg" alt="MedShare" className="w-5 h-5" />
          </div>
          <div className="text-sm font-semibold group-data-[collapsible=icon]:hidden" style={{ color: 'var(--text-primary)' }}>
            MedShare
          </div>
        </div>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      isActive={activeNav === item.key}
                      onClick={() => setActiveNav(item.key)}
                      tooltip={item.label}
                    >
                      <item.icon />
                      <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div className="px-4 pb-4 text-xs" style={{ color: 'var(--text-muted)' }}>
            NexHacks 2026
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="relative">
        <Header
          onToggleTheme={handleToggleTheme}
          isDark={isDark}
          onUpload={handleUploadClick}
          onNotifications={() => setShowNotifications(!showNotifications)}
          onHospitalSelect={() => setShowHospitalSelector(!showHospitalSelector)}
          selectedHospital={selectedHospital}
          showSidebarTrigger
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileChange}
        />

        <main className="relative max-w-7xl mx-auto p-6">
          {activeNav === 'dashboard' && (
            <>
              <div className="mb-8">
                <h2 className="text-3xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Dashboard
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Real-time pharmacy analytics and inventory management
                </p>
              </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <StatCard
              icon={ClipboardList}
              iconGradient="linear-gradient(135deg, #0284C7 0%, #06B6D4 100%)"
              value={stats.totalItems}
              label="Items in Inventory"
              delay={0}
            />
            <StatCard
              icon={AlertTriangle}
              iconGradient="linear-gradient(135deg, #D97706 0%, #F59E0B 100%)"
              value={stats.expiringSoon}
              label="Expiring Soon (30d)"
              delay={0.05}
            />
            <StatCard
              icon={DollarSign}
              iconGradient="linear-gradient(135deg, #059669 0%, #10B981 100%)"
              value={`$${stats.atRiskValue.toLocaleString()}`}
              label="Value at Risk"
              delay={0.1}
            />
            <StatCard
              icon={Activity}
              iconGradient="linear-gradient(135deg, #E11D48 0%, #F43F5E 100%)"
              value={stats.fifoAlerts}
              label="FIFO Alerts"
              delay={0.15}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <motion.div
                className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-6 dark:bg-slate-900/70 dark:border-slate-700/40"
                style={{ boxShadow: '0 4px 24px rgba(15, 23, 42, 0.08)' }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <div className="mb-5 flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                      Usage Trends
                    </h3>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Weekly usage for top medications
                    </p>
                  </div>
                  <motion.button
                    className="px-3 py-2 rounded-lg text-xs font-medium border"
                    style={{
                      backgroundColor: 'rgba(2, 132, 199, 0.06)',
                      borderColor: 'rgba(2, 132, 199, 0.15)',
                      color: 'var(--med-blue)',
                    }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() =>
                      toast('Chart refreshed', {
                        description: 'Usage trend updated with the latest inventory data.',
                      })
                    }
                  >
                    Refresh
                  </motion.button>
                </div>
                <ChartContainer
                  config={{
                    usage: { label: 'Usage', color: 'var(--med-blue)' },
                  }}
                  className="h-60"
                >
                  <LineChart data={usageTrend} margin={{ left: 8, right: 8 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis width={32} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="usage" stroke="var(--med-blue)" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ChartContainer>
              </motion.div>

              <motion.div
                className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-6 dark:bg-slate-900/70 dark:border-slate-700/40"
                style={{ boxShadow: '0 4px 24px rgba(15, 23, 42, 0.08)' }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                      Expiration Alerts
                    </h3>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Items expiring within 30 days and FIFO violations
                    </p>
                  </div>
                  <motion.button
                    className="px-3 py-2 rounded-lg text-xs font-medium border"
                    style={{
                      backgroundColor: 'rgba(217, 119, 6, 0.08)',
                      borderColor: 'rgba(217, 119, 6, 0.2)',
                      color: 'var(--warning-amber)',
                    }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                      exportExpirationAlertsToCSV(medications);
                      toast.success('Export complete', {
                        description: 'Expiration alerts downloaded as CSV.',
                      });
                    }}
                  >
                    Export CSV
                  </motion.button>
                </div>
                <div className="space-y-3">
                  {isParsing
                    ? Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton key={index} className="h-24 rounded-xl" />
                      ))
                    : medications.map((med) => (
                        <div
                          key={med.ndcCode}
                          className="border border-slate-100 rounded-xl p-4 bg-white/60 dark:bg-slate-800/60 dark:border-slate-700/40"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                                {med.drugName}
                              </div>
                              <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                                Lot {med.lots[0]?.lotNumber} · Expires in {getDaysUntil(med.lots[0]?.expDate)} days
                              </div>
                              {med.alerts.fifoRisk && (
                                <div className="text-xs font-medium" style={{ color: 'var(--danger-rose)' }}>
                                  ⚠ FIFO risk: newer lot is being used first
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <motion.button
                                className="px-3 py-2 rounded-lg text-xs font-medium border"
                                style={{
                                  backgroundColor: 'rgba(225, 29, 72, 0.06)',
                                  borderColor: 'rgba(225, 29, 72, 0.15)',
                                  color: 'var(--danger-rose)',
                                }}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => handleViewFifo(med.drugName)}
                              >
                                View FIFO
                              </motion.button>
                              <motion.button
                                className="px-3 py-2 rounded-lg text-xs font-medium border"
                                style={{
                                  backgroundColor: 'rgba(2, 132, 199, 0.06)',
                                  borderColor: 'rgba(2, 132, 199, 0.15)',
                                  color: 'var(--med-blue)',
                                }}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => handleMarkReviewed(med.drugName)}
                              >
                                Mark Reviewed
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      ))}
                </div>
              </motion.div>

              <motion.div
                className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-6 dark:bg-slate-900/70 dark:border-slate-700/40"
                style={{ boxShadow: '0 4px 24px rgba(15, 23, 42, 0.08)' }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <div className="mb-5">
                  <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                    Usage by Department
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    % of medication usage by department
                  </p>
                </div>
                <ChartContainer
                  config={{
                    value: { label: 'Usage %', color: 'var(--aurora-violet)' },
                  }}
                  className="h-56"
                >
                  <BarChart data={usageByDepartment} layout="vertical" margin={{ left: 10, right: 16 }}>
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="department" type="category" width={80} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" fill="var(--aurora-violet)" radius={[8, 8, 8, 8]} />
                  </BarChart>
                </ChartContainer>
              </motion.div>
            </div>

            <div className="space-y-6">
              <motion.div
                className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-6 dark:bg-slate-900/70 dark:border-slate-700/40"
                style={{ boxShadow: '0 4px 24px rgba(15, 23, 42, 0.08)' }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                      AI Insights
                    </h3>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Gemini-powered recommendations
                    </p>
                  </div>
                  <motion.button
                    className="px-3 py-2 rounded-lg text-xs font-medium border"
                    style={{
                      backgroundColor: 'rgba(2, 132, 199, 0.06)',
                      borderColor: 'rgba(2, 132, 199, 0.15)',
                      color: 'var(--med-blue)',
                    }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleGenerateInsights}
                    disabled={isLoadingInsights}
                  >
                    {isLoadingInsights ? (
                      <div className="flex items-center gap-2">
                        <motion.div
                          className="w-3 h-3 border-2 border-sky-500 border-t-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        />
                        Loading...
                      </div>
                    ) : (
                      'Generate'
                    )}
                  </motion.button>
                </div>

                {aiInsightsData && expandedInsights ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    {/* Health News Analysis */}
                    <div className="bg-blue-50/50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200/50 dark:border-blue-800/50">
                      <button
                        onClick={() => setExpandedInsights(!expandedInsights)}
                        className="flex items-center gap-2 w-full text-left"
                      >
                        <motion.div
                          animate={{ rotate: expandedInsights ? 90 : 0 }}
                          className="text-sky-600 dark:text-sky-400"
                        >
                          ▶
                        </motion.div>
                        <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                          Health News Analysis
                        </h4>
                      </button>
                      {expandedInsights && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-3 pl-6 text-xs leading-relaxed whitespace-pre-wrap"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {aiInsightsData.news}
                        </motion.div>
                      )}
                    </div>

                    {/* AI Generated Insights */}
                    <div className="bg-emerald-50/50 dark:bg-emerald-900/20 rounded-lg p-4 border border-emerald-200/50 dark:border-emerald-800/50">
                      <button
                        onClick={() => setExpandedInsights(!expandedInsights)}
                        className="flex items-center gap-2 w-full text-left"
                      >
                        <motion.div
                          animate={{ rotate: expandedInsights ? 90 : 0 }}
                          className="text-emerald-600 dark:text-emerald-400"
                        >
                          ▶
                        </motion.div>
                        <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                          Generated Insights
                        </h4>
                      </button>
                      {expandedInsights && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-3 pl-6 text-xs leading-relaxed whitespace-pre-wrap"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {aiInsightsData.stats}
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <ul className="space-y-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                    {aiInsights.map((insight) => (
                      <li key={insight} className="flex gap-2 leading-relaxed">
                        <span className="text-sky-500 mt-0.5">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>

              <motion.div
                className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-6 dark:bg-slate-900/70 dark:border-slate-700/40"
                style={{ boxShadow: '0 4px 24px rgba(15, 23, 42, 0.08)' }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
              >
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                      30-Day Forecast
                    </h3>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Predicted demand and excess risk
                    </p>
                  </div>
                  <motion.button
                    className="px-3 py-2 rounded-lg text-xs font-medium border"
                    style={{
                      backgroundColor: 'rgba(5, 150, 105, 0.08)',
                      borderColor: 'rgba(5, 150, 105, 0.2)',
                      color: 'var(--success-mint)',
                    }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleRunForecast}
                  >
                    Run Forecast
                  </motion.button>
                </div>
                {forecast ? (
                  <div className="space-y-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                    <div className="flex items-center justify-between">
                      <span>Medication</span>
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {forecast.drugName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>30-Day Predicted</span>
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {forecast.predicted30DayUsage} units
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Excess at Risk</span>
                      <span className="font-medium" style={{ color: 'var(--danger-rose)' }}>
                        {forecast.excessAtRisk} units
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Confidence</span>
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {Math.round(forecast.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Upload inventory data to generate a forecast.
                  </div>
                )}
              </motion.div>

              <VoiceAlert 
                medications={medications
                  .filter(med => med.alerts.expiringSoon)
                  .map(med => ({
                    drugName: med.drugName,
                    quantity: med.lots[0]?.quantity || 0,
                    expDays: getDaysUntil(med.lots[0]?.expDate || ''),
                    value: (med.lots[0]?.quantity || 0) * (med.lots[0]?.unitCost || 0)
                  }))
                }
              />

              <motion.div
                className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-6 dark:bg-slate-900/70 dark:border-slate-700/40"
                style={{ boxShadow: '0 4px 24px rgba(15, 23, 42, 0.08)' }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Hospital className="w-4 h-4" style={{ color: 'var(--med-blue)' }} />
                  <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Quick Actions
                  </h3>
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'View Full Inventory', icon: ClipboardList, action: () => setActiveNav('inventory') },
                    { label: 'Export Dashboard', icon: FileUp, action: () => setActiveNav('reports') },
                    { label: 'Scan Drug Label', icon: Camera, action: () => setShowWebcam(true) },
                    { label: 'Support', icon: LifeBuoy, action: () => setShowChatbot(true) },
                  ].map((action) => (
                    <motion.button
                      key={action.label}
                      className="w-full px-4 py-2.5 rounded-xl font-medium text-sm text-left transition-all duration-200 border"
                      style={{
                        backgroundColor: 'rgba(2, 132, 199, 0.04)',
                        borderColor: 'rgba(2, 132, 199, 0.1)',
                        color: 'var(--med-blue)',
                      }}
                      whileHover={{ scale: 1.005, backgroundColor: 'rgba(2, 132, 199, 0.08)' }}
                      whileTap={{ scale: 0.995 }}
                      onClick={action.action}
                    >
                      <div className="flex items-center gap-2">
                        <action.icon className="w-4 h-4" />
                        <span>{action.label}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </>
      )}

      {activeNav === 'inventory' && <InventoryView />}
      {activeNav === 'reports' && <ReportsView />}
      {activeNav === 'settings' && <SettingsView />}
    </main>
      </SidebarInset>

      <Toaster richColors position="top-right" theme={isDark ? 'dark' : 'light'} />

      {isParsing && (
        <div className="fixed bottom-6 right-6 text-xs text-white bg-slate-900/80 px-3 py-2 rounded-full">
          Parsing inventory...
        </div>
      )}

      {/* Hospital Selector Modal */}
      {showHospitalSelector && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowHospitalSelector(false)}
        >
          <motion.div
            className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-slate-700/40 p-6 max-w-2xl w-full shadow-2xl"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Select Hospital
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              Switch between hospitals to view their inventory and analytics
            </p>
            <div className="space-y-3">
              {hospitals.map((hospital) => (
                <motion.button
                  key={hospital.id}
                  onClick={() => handleHospitalSelect(hospital.id)}
                  className="w-full p-4 rounded-xl border text-left transition-all"
                  style={{
                    backgroundColor: hospital.isCurrent ? 'rgba(2, 132, 199, 0.1)' : 'rgba(100, 116, 139, 0.05)',
                    borderColor: hospital.isCurrent ? 'rgba(2, 132, 199, 0.3)' : 'rgba(100, 116, 139, 0.2)',
                  }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                          {hospital.name}
                        </h4>
                        {hospital.isCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(2, 132, 199, 0.2)', color: 'var(--med-blue)' }}>
                            Current
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <span>Type: {hospital.type}</span>
                        <span>Distance: {hospital.distance}</span>
                        <span>Location: {hospital.location}</span>
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
            <motion.button
              onClick={() => setShowHospitalSelector(false)}
              className="mt-6 w-full px-4 py-3 rounded-xl font-medium text-sm"
              style={{ backgroundColor: 'rgba(100, 116, 139, 0.1)', color: 'var(--text-primary)' }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              Close
            </motion.button>
          </motion.div>
        </motion.div>
      )}

      {/* Notifications Panel */}
      {showNotifications && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-end p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowNotifications(false)}
        >
          <motion.div
            className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-slate-700/40 p-6 max-w-md w-full shadow-2xl"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Notifications
            </h3>
            <div className="space-y-3">
              {medications.filter(med => med.alerts.expiringSoon).map((med) => (
                <div
                  key={med.ndcCode}
                  className="p-4 rounded-xl border"
                  style={{ backgroundColor: 'rgba(217, 119, 6, 0.1)', borderColor: 'rgba(217, 119, 6, 0.2)' }}
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5" style={{ color: 'var(--warning-amber)' }} />
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                        {med.drugName} expiring soon
                      </h4>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {med.lots[0]?.quantity} units expire in {getDaysUntil(med.lots[0]?.expDate)} days
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {medications.filter(med => med.alerts.fifoRisk).map((med) => (
                <div
                  key={`fifo-${med.ndcCode}`}
                  className="p-4 rounded-xl border"
                  style={{ backgroundColor: 'rgba(225, 29, 72, 0.1)', borderColor: 'rgba(225, 29, 72, 0.2)' }}
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5" style={{ color: 'var(--danger-rose)' }} />
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                        FIFO violation: {med.drugName}
                      </h4>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Newer lot being used before older stock
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <motion.button
              onClick={() => setShowNotifications(false)}
              className="mt-6 w-full px-4 py-3 rounded-xl font-medium text-sm"
              style={{ backgroundColor: 'rgba(2, 132, 199, 0.1)', color: 'var(--med-blue)' }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              Close
            </motion.button>
          </motion.div>
        </motion.div>
      )}

      {/* Support Chatbot */}
      <SupportChatbot 
        isOpen={showChatbot} 
        onClose={() => setShowChatbot(false)} 
      />

      {/* Webcam Drug Scanner Modal */}
      {showWebcam && (
        <motion.div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={handleCloseWebcam}
        >
          <motion.div
            className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-slate-700/40 p-6 max-w-3xl w-full shadow-2xl"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)' }}>
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                    AI Drug Label Scanner
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Use your webcam to scan and recognize medication labels
                  </p>
                </div>
              </div>
              <motion.button
                onClick={handleCloseWebcam}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <span className="text-2xl" style={{ color: 'var(--text-muted)' }}>×</span>
              </motion.button>
            </div>

            {/* Camera View or Captured Image */}
            {!capturedImage ? (
              <>
                {/* Live Camera Feed */}
                <div className="relative bg-black rounded-xl overflow-hidden mb-6" style={{ aspectRatio: '16/9' }}>
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Scanning Frame Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <motion.div
                      className="border-4 border-violet-500 rounded-lg"
                      style={{ width: '60%', height: '60%' }}
                      animate={{
                        borderColor: ['rgba(124, 58, 237, 0.5)', 'rgba(124, 58, 237, 1)', 'rgba(124, 58, 237, 0.5)'],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-violet-400" />
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-violet-400" />
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-violet-400" />
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-violet-400" />
                    </motion.div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-violet-50/50 dark:bg-violet-900/10 rounded-xl p-4 mb-6">
                  <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    How it works:
                  </h4>
                  <ul className="space-y-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <li>• Allow camera access when prompted</li>
                    <li>• Position the drug label clearly within the frame</li>
                    <li>• Click "Capture Photo" to take a picture</li>
                    <li>• Review and confirm the captured image</li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <motion.button
                    className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm text-white shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)' }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleCapturePicture}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Camera className="w-4 h-4" />
                      Capture Photo
                    </div>
                  </motion.button>
                  <motion.button
                    className="px-6 py-3 rounded-xl font-medium text-sm border"
                    style={{
                      backgroundColor: 'rgba(100, 116, 139, 0.1)',
                      borderColor: 'rgba(100, 116, 139, 0.2)',
                      color: 'var(--text-primary)',
                    }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleCloseWebcam}
                  >
                    Cancel
                  </motion.button>
                </div>
              </>
            ) : (
              <>
                {/* Display Captured Image */}
                <div className="relative bg-black rounded-xl overflow-hidden mb-6" style={{ aspectRatio: '16/9' }}>
                  <img src={capturedImage} alt="Captured Drug Label" className="w-full h-full object-contain" />
                </div>

                {/* Detected Info Card */}
                <motion.div
                  className="bg-white/70 dark:bg-slate-800/70 rounded-xl p-4 mb-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Captured Image
                    </h4>
                    <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED' }}>
                      Ready for Processing
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Captured At</p>
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {new Date().toLocaleTimeString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Image Quality</p>
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        High Resolution
                      </p>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Format</p>
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        JPEG
                      </p>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Status</p>
                      <p className="font-medium" style={{ color: '#10B981' }}>
                        ✓ Valid
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <motion.button
                    className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm text-white shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)' }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleUploadCapturedImage}
                    disabled={isUploadingImage}
                  >
                    <div className="flex items-center justify-center gap-2">
                      {isUploadingImage ? (
                        <>
                          <motion.div
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          />
                          Uploading...
                        </>
                      ) : (
                        <>Use This Photo</>
                      )}
                    </div>
                  </motion.button>
                  <motion.button
                    className="flex-1 px-4 py-3 rounded-xl font-medium text-sm border"
                    style={{
                      backgroundColor: 'rgba(100, 116, 139, 0.1)',
                      borderColor: 'rgba(100, 116, 139, 0.2)',
                      color: 'var(--text-primary)',
                    }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleRetakePicture}
                    disabled={isUploadingImage}
                  >
                    Retake
                  </motion.button>
                </div>
              </>
            )}

            {/* Tech Info */}
            <div className="mt-4 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
              Powered by AI Computer Vision • Real-time OCR • Smart Drug Recognition
            </div>
          </motion.div>
        </motion.div>
      )}
    </SidebarProvider>
  );
}
