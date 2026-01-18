const express = require('express');
const router = express.Router();

// Mock reports data
const getMockReports = () => {
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

/**
 * GET /reports
 * Get all available reports
 */
router.get('/', async (req, res) => {
  try {
    const reports = getMockReports();
    res.json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /reports/:id
 * Get specific report by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const reports = getMockReports();
    const report = reports.find((r) => r.id === id);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found',
      });
    }

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /reports/generate
 * Generate a new report
 * Body: { type: 'inventory' | 'expiration' | 'fifo' | 'forecast' | 'insights' | 'audit' }
 */
router.post('/generate', async (req, res) => {
  try {
    const { type } = req.body;

    if (!type) {
      return res.status(400).json({
        success: false,
        error: 'Report type is required',
      });
    }

    const validTypes = ['inventory', 'expiration', 'fifo', 'forecast', 'insights', 'audit'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid report type',
      });
    }

    // In a real app, you would generate the actual report
    const newReport = {
      id: String(Date.now()),
      type,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
      description: `Generated ${type} report`,
      createdAt: new Date().toISOString(),
      generatedBy: 'API Request',
    };

    res.json({
      success: true,
      data: newReport,
      message: 'Report generated successfully',
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
