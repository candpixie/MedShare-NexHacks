import { motion } from 'motion/react';
import { FileText, Download, Calendar, User, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getReports, deleteReport, generateReportPDF, AIReport } from '../utils/reportUtils';

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
  const [reports, setReports] = useState<AIReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = () => {
    try {
      const storedReports = getReports();
      // Sort by date, newest first
      const sorted = storedReports.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setReports(sorted);
    } catch (error) {
      console.error('Failed to load reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (report: AIReport) => {
    setDownloading(report.id);
    try {
      await generateReportPDF(report);
      toast.success('Report downloaded', {
        description: `${report.title} has been downloaded as PDF`,
      });
    } catch (error) {
      console.error('Failed to download report:', error);
      toast.error('Download failed', {
        description: 'Unable to generate PDF. Please try again.',
      });
    } finally {
      setDownloading(null);
    }
  };

  const handleDeleteReport = (id: string, title: string) => {
    deleteReport(id);
    setReports(reports.filter(r => r.id !== id));
    toast.success('Report deleted', {
      description: `${title} has been removed`,
    });
  };

  const getReportIcon = (type: string) => {
    const iconClass = 'w-10 h-10 rounded-xl flex items-center justify-center shadow-lg';
    
    switch (type) {
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
      ) : reports.length === 0 ? (
        <motion.div
          className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-12 dark:bg-slate-900/70 dark:border-slate-700/40 text-center"
          style={{ boxShadow: '0 4px 24px rgba(15, 23, 42, 0.08)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <FileText className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            No reports yet
          </h3>
          <p style={{ color: 'var(--text-muted)' }}>
            Generate your first AI-powered report by clicking the "Generate" button in the Dashboard's AI Insights section.
          </p>
        </motion.div>
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
                  <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                    {report.stats}
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

                  <div className="flex gap-2">
                    <motion.button
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border"
                      style={{
                        backgroundColor: downloading === report.id ? 'rgba(100, 116, 139, 0.1)' : 'rgba(2, 132, 199, 0.06)',
                        borderColor: downloading === report.id ? 'rgba(100, 116, 139, 0.2)' : 'rgba(2, 132, 199, 0.15)',
                        color: downloading === report.id ? 'var(--text-muted)' : 'var(--med-blue)',
                      }}
                      whileHover={{ scale: downloading === report.id ? 1 : 1.01 }}
                      whileTap={{ scale: downloading === report.id ? 1 : 0.99 }}
                      onClick={() => downloadReport(report)}
                      disabled={downloading === report.id}
                    >
                      <Download className="w-4 h-4" />
                      {downloading === report.id ? 'Generating...' : 'Download PDF'}
                    </motion.button>
                    <motion.button
                      className="px-4 py-2.5 rounded-xl text-sm font-medium border"
                      style={{
                        backgroundColor: 'rgba(225, 29, 72, 0.06)',
                        borderColor: 'rgba(225, 29, 72, 0.15)',
                        color: '#E11D48',
                      }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleDeleteReport(report.id, report.title)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
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
