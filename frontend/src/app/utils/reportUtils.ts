import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface AIReport {
  id: string;
  title: string;
  type: 'insights' | 'inventory' | 'expiration' | 'fifo' | 'forecast';
  news: string;
  stats: string;
  createdAt: string;
  generatedBy: string;
}

const STORAGE_KEY = 'medshare_reports';

/**
 * Save a report to localStorage
 */
export function saveReport(report: AIReport): void {
  const reports = getReports();
  reports.push(report);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

/**
 * Get all saved reports from localStorage
 */
export function getReports(): AIReport[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    // Initialize with demo reports if none exist
    initializeDemoReports();
    const newStored = localStorage.getItem(STORAGE_KEY);
    return newStored ? JSON.parse(newStored) : [];
  }
  return JSON.parse(stored);
}

/**
 * Delete a report from localStorage
 */
export function deleteReport(id: string): void {
  const reports = getReports();
  const filtered = reports.filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Create a new report object
 */
export function createReport(
  title: string,
  type: AIReport['type'],
  news: string,
  stats: string,
  generatedBy: string = 'MedShare AI'
): AIReport {
  return {
    id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title,
    type,
    news,
    stats,
    createdAt: new Date().toISOString(),
    generatedBy,
  };
}

/**
 * Generate a PDF from report data
 */
export async function generateReportPDF(report: AIReport): Promise<void> {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageHeight = pdf.internal.pageSize.getHeight();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Add header
    pdf.setFillColor(2, 132, 199);
    pdf.rect(0, 0, pageWidth, 30, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.text('MedShare', margin, 18);

    pdf.setFontSize(10);
    pdf.text('Hospital Pharmacy Analytics Report', margin, 25);

    yPosition = 40;

    // Add report title
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(18);
    pdf.setFont(undefined, 'bold');
    pdf.text(report.title, margin, yPosition);
    yPosition += 10;

    // Add metadata
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Generated on: ${new Date(report.createdAt).toLocaleString()}`, margin, yPosition);
    yPosition += 6;
    pdf.text(`Report Type: ${report.type.charAt(0).toUpperCase() + report.type.slice(1)}`, margin, yPosition);
    yPosition += 10;

    // Add separator
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Add news/analysis section
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('Health News Analysis', margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    const newsLines = pdf.splitTextToSize(report.news, contentWidth);
    pdf.text(newsLines, margin, yPosition);
    yPosition += newsLines.length * 5 + 8;

    // Check if we need a new page
    if (yPosition > pageHeight - 40) {
      pdf.addPage();
      yPosition = margin;
    }

    // Add stats/insights section
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('AI-Generated Insights', margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    const statsLines = pdf.splitTextToSize(report.stats, contentWidth);
    pdf.text(statsLines, margin, yPosition);
    yPosition += statsLines.length * 5 + 10;

    // Add footer
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    const pageCount = pdf.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Download the PDF
    const fileName = `medshare-${report.type}-report-${new Date(report.createdAt)
      .toISOString()
      .split('T')[0]}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

/**
 * Export reports as JSON for backup
 */
export function exportReportsAsJSON(): void {
  const reports = getReports();
  const dataStr = JSON.stringify(reports, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `medshare-reports-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Initialize demo reports for first-time users
 */
function initializeDemoReports(): void {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const demoReports: AIReport[] = [
    {
      id: `report_${Date.now()}_demo1`,
      title: 'Complete Inventory Analysis Report',
      type: 'inventory',
      news: 'Recent healthcare supply chain disruptions have affected medication availability nationwide. Our AI analysis shows your facility is well-stocked with critical medications. Current inventory levels for Propofol (70 units), Fentanyl (60 units), and Rocuronium (55 units) exceed minimum thresholds. However, Epinephrine shows critical low stock at 5 units against a minimum of 25 units, requiring immediate reorder.',
      stats: 'Total Inventory Items: 8 medications tracked\nTotal Stock Value: $18,450 (estimated)\nLow Stock Alerts: 2 items (Epinephrine, Morphine)\nBackordered Items: 2 (Epinephrine, Morphine)\nAnomalies Detected: 1 usage pattern anomaly in Atropine\nAverage Stock Level: 73% of par levels\nRecommendation: Immediate reorder of Epinephrine and Morphine. Review Atropine usage patterns for potential overuse or data entry errors.',
      createdAt: today.toISOString(),
      generatedBy: 'Gemini AI System',
    },
    {
      id: `report_${Date.now()}_demo2`,
      title: 'Expiration Alert & Waste Prevention Report',
      type: 'expiration',
      news: 'FDA guidelines recommend monitoring medication expiration dates closely to prevent waste and ensure patient safety. Studies show hospitals waste up to $10 million annually on expired medications. Proactive expiration management can reduce waste by 40% according to recent healthcare studies.',
      stats: 'Medications Expiring in 30 Days: 3 items\n- Midazolam: 8 days until expiry (45 units, $1,575 value)\n- Atropine: 13 days until expiry (30 units, $600 value)\n- Morphine: 15 days until expiry (12 units, $660 value)\n\nTotal At-Risk Value: $2,835\nRecommendation: Prioritize use of near-expiry items, implement FIFO rotation protocols, and consider transferring excess stock to partner facilities.',
      createdAt: today.toISOString(),
      generatedBy: 'AI Waste Prevention System',
    },
    {
      id: `report_${Date.now()}_demo3`,
      title: 'FIFO Compliance & Rotation Report',
      type: 'fifo',
      news: 'First-In-First-Out (FIFO) inventory management is critical for medication safety and cost control. Recent audits show hospitals implementing strict FIFO protocols reduce expired medication waste by 35% and improve regulatory compliance scores significantly.',
      stats: 'FIFO Compliance Score: 87%\nRotation Violations Detected: 2 instances\n- Atropine lot LOT2024A002 should be used before newer lots\n- Midazolam lot LOT2024M001 needs priority dispensing\n\nCompliant Medications: 6 out of 8\nRecommendation: Update pharmacy staff training on FIFO protocols, implement barcode scanning for lot tracking, and add automated alerts for rotation compliance.',
      createdAt: yesterday.toISOString(),
      generatedBy: 'Compliance AI',
    },
    {
      id: `report_${Date.now()}_demo4`,
      title: '30-Day Demand Forecasting Report',
      type: 'forecast',
      news: 'Healthcare AI forecasting models now achieve 92% accuracy in predicting medication demand patterns. Machine learning algorithms analyze seasonal trends, patient admission rates, and procedure schedules to optimize inventory levels and reduce stockouts.',
      stats: 'Forecast Period: Next 30 days\nPredicted High-Demand Items:\n- Fentanyl: 84 units needed (current: 60, order: 30 units)\n- Propofol: 75 units needed (current: 70, order: 10 units)\n- Succinylcholine: 54 units needed (current: 40, order: 20 units)\n\nPredicted Low-Demand Items:\n- Rocuronium: Sufficient stock for 60+ days\n- Midazolam: Adequate current levels\n\nConfidence Level: 88%\nRecommendation: Place orders for high-demand items within 7 days. Monitor surgical schedule changes that may affect anesthesia medication usage.',
      createdAt: today.toISOString(),
      generatedBy: 'WoodWide Prediction AI',
    },
    {
      id: `report_${Date.now()}_demo5`,
      title: 'Cost Optimization & Savings Insights',
      type: 'insights',
      news: 'Hospital pharmacy costs represent 15-20% of total operating expenses. AI-driven optimization strategies help healthcare facilities save $500,000 to $2 million annually through better inventory management, reduced waste, and strategic purchasing decisions.',
      stats: 'Potential Monthly Savings: $2,850\n\nIdentified Opportunities:\n1. Expiration Prevention: $2,835 in near-expiry medications\n2. Overstocking Reduction: $850 in excess Rocuronium inventory\n3. Strategic Ordering: $1,200 savings through bulk purchase timing\n4. Waste Reduction: $965 from improved FIFO compliance\n\nAnnual Savings Potential: $34,200\n\nTop Recommendations:\n- Implement automated expiration alerts\n- Negotiate volume discounts with suppliers\n- Transfer excess inventory to partner facilities\n- Optimize reorder points based on AI predictions',
      createdAt: today.toISOString(),
      generatedBy: 'Financial Optimization AI',
    },
  ];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(demoReports));
  console.log('✅ Initialized demo reports in localStorage');
}
