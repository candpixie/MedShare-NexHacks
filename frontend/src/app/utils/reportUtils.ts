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
  return stored ? JSON.parse(stored) : [];
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
