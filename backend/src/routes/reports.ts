import { Router, Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import { mockMedications } from '../data/mockData';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get available reports
router.get('/', (req: Request, res: Response) => {
  try {
    const reports = [
      {
        id: uuidv4(),
        type: 'inventory',
        title: 'Full Inventory Report',
        description: 'Complete list of all medications with quantities and expiration dates',
        createdAt: new Date().toISOString(),
        generatedBy: 'Dr. Sarah Johnson',
      },
      {
        id: uuidv4(),
        type: 'expiration',
        title: 'Expiration Alerts Report',
        description: 'Medications expiring within 30 days',
        createdAt: new Date().toISOString(),
        generatedBy: 'Dr. Sarah Johnson',
      },
      {
        id: uuidv4(),
        type: 'fifo',
        title: 'FIFO Compliance Report',
        description: 'First-in-first-out compliance violations and recommendations',
        createdAt: new Date().toISOString(),
        generatedBy: 'Dr. Sarah Johnson',
      },
      {
        id: uuidv4(),
        type: 'forecast',
        title: '30-Day Demand Forecast',
        description: 'AI-powered demand predictions and reorder recommendations',
        createdAt: new Date().toISOString(),
        generatedBy: 'Dr. Sarah Johnson',
      },
      {
        id: uuidv4(),
        type: 'insights',
        title: 'AI Insights Report',
        description: 'Gemini-powered recommendations for waste reduction and optimization',
        createdAt: new Date().toISOString(),
        generatedBy: 'Dr. Sarah Johnson',
      },
    ];

    res.json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch reports' });
  }
});

// Generate and download PDF report
router.get('/download/:type', (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=medshare-${type}-report.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Header
    doc.fontSize(24).text('MedShare Analytics Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Report Type: ${type.toUpperCase()}`, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.text('Metro General Hospital', { align: 'center' });
    doc.moveDown(2);

    // Content based on report type
    if (type === 'inventory') {
      doc.fontSize(16).text('Full Inventory List', { underline: true });
      doc.moveDown();
      
      mockMedications.forEach((med, index) => {
        doc.fontSize(12).text(`${index + 1}. ${med.drugName}`, { continued: true });
        doc.fontSize(10).text(` (NDC: ${med.ndcCode})`);
        doc.fontSize(10).text(`   Quantity: ${med.totalQuantity} ${med.formType}(s)`);
        doc.text(`   Par Level: ${med.parLevel} | Avg Daily Usage: ${med.avgDailyUsage}`);
        doc.text(`   Lots: ${med.lots.length} | Total Value: $${med.lots.reduce((sum, lot) => sum + lot.quantity * lot.unitCost, 0).toLocaleString()}`);
        doc.moveDown(0.5);
      });
    } else if (type === 'expiration') {
      doc.fontSize(16).text('Expiration Alerts', { underline: true });
      doc.moveDown();
      
      const expiring = mockMedications.filter((m) => m.alerts.expiringSoon);
      doc.fontSize(12).text(`Total medications expiring within 30 days: ${expiring.length}`);
      doc.moveDown();

      expiring.forEach((med, index) => {
        doc.fontSize(12).text(`${index + 1}. ${med.drugName}`);
        med.lots.forEach((lot) => {
          const daysUntil = Math.ceil((new Date(lot.expDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          doc.fontSize(10).text(`   Lot ${lot.lotNumber}: ${lot.quantity} units, expires in ${daysUntil} days`);
        });
        doc.moveDown(0.5);
      });
    } else if (type === 'fifo') {
      doc.fontSize(16).text('FIFO Compliance Report', { underline: true });
      doc.moveDown();
      
      const fifoRisk = mockMedications.filter((m) => m.alerts.fifoRisk);
      doc.fontSize(12).text(`FIFO violations detected: ${fifoRisk.length}`);
      doc.moveDown();

      fifoRisk.forEach((med, index) => {
        doc.fontSize(12).text(`${index + 1}. ${med.drugName}`);
        doc.fontSize(10).text(`   Issue: Newer lot being used before older lot`);
        doc.text(`   Recommendation: Use lot ${med.lots[0]?.lotNumber} first`);
        doc.moveDown(0.5);
      });
    } else if (type === 'forecast') {
      doc.fontSize(16).text('30-Day Demand Forecast', { underline: true });
      doc.moveDown();

      mockMedications.forEach((med, index) => {
        const predicted = Math.round(med.avgDailyUsage * 30);
        const excess = Math.max(med.totalQuantity - predicted, 0);
        
        doc.fontSize(12).text(`${index + 1}. ${med.drugName}`);
        doc.fontSize(10).text(`   Current Stock: ${med.totalQuantity} units`);
        doc.text(`   Predicted 30-day usage: ${predicted} units`);
        doc.text(`   Excess at risk: ${excess} units`);
        doc.text(`   Recommendation: ${excess > 0 ? `Reduce next order by ${excess} units` : 'Order as normal'}`);
        doc.moveDown(0.5);
      });
    } else if (type === 'insights') {
      doc.fontSize(16).text('AI-Powered Insights', { underline: true });
      doc.moveDown();

      const insights = [
        'Reduce Propofol order by 15% based on low turnover and current stock levels.',
        'Ephedrine usage is trending up; increase par level by 10% to prevent stockouts.',
        '3 FIFO violations detected in the last 7 days. Review lot rotation procedures.',
        'Fentanyl usage is stable. Current stock levels are optimal.',
        'Consider consolidating orders to reduce shipping costs and improve efficiency.',
      ];

      insights.forEach((insight, index) => {
        doc.fontSize(11).text(`${index + 1}. ${insight}`);
        doc.moveDown(0.5);
      });
    }

    // Footer
    doc.moveDown(2);
    doc.fontSize(8).text('This report is confidential and for authorized personnel only.', { align: 'center' });
    doc.text('MedShare © 2026 - Hospital Pharmacy Analytics Platform', { align: 'center' });

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate report' });
  }
});

export default router;
