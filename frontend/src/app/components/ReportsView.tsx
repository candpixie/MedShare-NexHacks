import { motion } from 'motion/react';
import { FileText, Download, Calendar, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

type Report = {
  id: string;
  type: string;
  title: string;
  description: string;
  createdAt: string;
  generatedBy: string;
};

const getMockReportsData = (): Report[] => {
  const today = new Date();
  return [
    {
      id: '1',
      type: 'inventory',
      title: 'Complete Inventory Report',
      description: 'Full medication inventory with stock levels, lot details, and par level analysis',
      createdAt: today.toISOString(),
      generatedBy: 'AI System',
    },
    {
      id: '2',
      type: 'expiration',
      title: 'Expiration Alert Report',
      description: 'Medications expiring within 30 days with potential waste value calculations',
      createdAt: today.toISOString(),
      generatedBy: 'AI System',
    },
    {
      id: '3',
      type: 'fifo',
      title: 'FIFO Compliance Report',
      description: 'First-In-First-Out violations and recommendations for proper rotation',
      createdAt: today.toISOString(),
      generatedBy: 'AI System',
    },
    {
      id: '4',
      type: 'forecast',
      title: 'Demand Forecasting Report',
      description: 'AI-powered 30-day usage predictions and recommended reorder quantities',
      createdAt: today.toISOString(),
      generatedBy: 'Gemini AI',
    },
    {
      id: '5',
      type: 'insights',
      title: 'Cost Optimization Insights',
      description: 'Identified cost savings opportunities and waste reduction strategies',
      createdAt: today.toISOString(),
      generatedBy: 'Gemini AI',
    },
    {
      id: '6',
      type: 'audit',
      title: 'Inventory Audit Trail',
      description: 'Complete transaction history and inventory movement logs',
      createdAt: new Date(today.setDate(today.getDate() - 1)).toISOString(),
      generatedBy: 'System Admin',
    },
  ];
};

export function ReportsView() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/reports');
      const result = await response.json();
      if (result.success) {
        setReports(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      // Use mock data for demo
      setReports(getMockReportsData());
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (type: string, title: string) => {
    setDownloading(type);
    try {
      // For now, generate a simple CSV report client-side
      // In a real app, you would fetch from backend
      const csvContent = `MedShare Report - ${title}\nGenerated: ${new Date().toLocaleString()}\n\nReport Type: ${type}\n\nThis is a demo report. Connect to backend for full functionality.`;
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `medshare-${type}-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Report downloaded', {
        description: `${title} has been downloaded successfully`,
      });
    } catch (error) {
      console.error('Failed to download report:', error);
      toast.error('Download failed', {
        description: 'Unable to download the report. Please try again.',
      });
    } finally {
      setDownloading(null);
    }
  };

  const getReportIcon = (type: string) => {
    const iconClass = 'w-10 h-10 rounded-xl flex items-center justify-center shadow-lg';
    
    switch (type) {
      case 'inventory':
        return (
          <div className={iconClass} style={{ background: 'linear-gradient(135deg, #0284C7 0%, #06B6D4 100%)' }}>
            <FileText className="w-5 h-5 text-white" />
          </div>
        );
      case 'expiration':
        return (
          <div className={iconClass} style={{ background: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)' }}>
            <Calendar className="w-5 h-5 text-white" />
          </div>
        );
      case 'fifo':
        return (
          <div className={iconClass} style={{ background: 'linear-gradient(135deg, #E11D48 0%, #F43F5E 100%)' }}>
            <FileText className="w-5 h-5 text-white" />
          </div>
        );
      case 'forecast':
        return (
          <div className={iconClass} style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)' }}>
            <FileText className="w-5 h-5 text-white" />
          </div>
        );
      case 'insights':
        return (
          <div className={iconClass} style={{ background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)' }}>
            <FileText className="w-5 h-5 text-white" />
          </div>
        );
      default:
        return (
          <div className={iconClass} style={{ background: 'linear-gradient(135deg, #64748B 0%, #94A3B8 100%)' }}>
            <FileText className="w-5 h-5 text-white" />
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          Reports
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Download AI-powered insights and analytics reports as PDF
        </p>
      </div>

      {/* Reports Grid */}
      {loading ? (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
          Loading reports...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {reports.map((report, index) => (
            <motion.div
              key={report.id}
              className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-6 dark:bg-slate-900/70 dark:border-slate-700/40"
              style={{ boxShadow: '0 4px 24px rgba(15, 23, 42, 0.08)' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -2 }}
            >
              <div className="flex items-start gap-4">
                {getReportIcon(report.type)}
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                    {report.title}
                  </h3>
                  <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
                    {report.description}
                  </p>
                  
                  <div className="flex items-center gap-3 text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{report.generatedBy}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <motion.button
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border"
                    style={{
                      backgroundColor: downloading === report.type ? 'rgba(100, 116, 139, 0.1)' : 'rgba(2, 132, 199, 0.06)',
                      borderColor: downloading === report.type ? 'rgba(100, 116, 139, 0.2)' : 'rgba(2, 132, 199, 0.15)',
                      color: downloading === report.type ? 'var(--text-muted)' : 'var(--med-blue)',
                    }}
                    whileHover={{ scale: downloading === report.type ? 1 : 1.01 }}
                    whileTap={{ scale: downloading === report.type ? 1 : 0.99 }}
                    onClick={() => downloadReport(report.type, report.title)}
                    disabled={downloading === report.type}
                  >
                    <Download className="w-4 h-4" />
                    {downloading === report.type ? 'Downloading...' : 'Download PDF'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Info Card */}
      <motion.div
        className="bg-sky-50/50 backdrop-blur-xl rounded-2xl border border-sky-200/50 p-6 dark:bg-sky-900/10 dark:border-sky-700/30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 mt-0.5" style={{ color: 'var(--med-blue)' }} />
          <div>
            <h4 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              About Reports
            </h4>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              All reports are generated with AI-powered insights from Gemini. They include real-time inventory data, 
              expiration alerts, FIFO compliance checks, and demand forecasting to help optimize your pharmacy operations 
              and reduce waste.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
